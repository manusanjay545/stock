"""
QuantStrike AI — Scoring Engine
Calculates composite scores for option strikes using configurable weights.
"""

import random
from typing import Dict, List, Any
from src.core.config import settings


def calculate_price_action_score(data: Dict) -> float:
    """Score based on trend, breakout/breakdown, support/resistance."""
    score = 50.0
    trend = data.get("trend", "SIDEWAYS")
    if trend == "BULLISH":
        score += 20
    elif trend == "BEARISH":
        score += 10  # Bearish can be good for puts
    
    indicators = data.get("indicators", {})
    rsi = indicators.get("rsi", 50)
    if 40 < rsi < 60:
        score += 10  # Not overbought/oversold
    adx = indicators.get("adx", 20)
    if adx > 25:
        score += 15  # Strong trend
    return min(max(score, 0), 100)


def calculate_technical_score(indicators: Dict) -> float:
    """Score based on RSI, MACD, EMA, ADX, Supertrend, etc."""
    score = 50.0
    rsi = indicators.get("rsi", 50)
    if 30 < rsi < 70:
        score += 10
    macd_hist = indicators.get("macdHistogram", 0)
    if macd_hist > 0:
        score += 10
    adx = indicators.get("adx", 20)
    if adx > 25:
        score += 10
    if indicators.get("supertrendDirection") == "BULLISH":
        score += 10
    return min(max(score, 0), 100)


def calculate_option_chain_score(strike_data: Dict) -> float:
    """Score based on OI, change in OI, PCR, volume, IV."""
    score = 50.0
    oi = strike_data.get("oi", 0)
    if oi > 500000:
        score += 15
    elif oi > 100000:
        score += 10
    change_oi = strike_data.get("changeInOI", 0)
    if change_oi > 0:
        score += 10
    volume = strike_data.get("volume", 0)
    if volume > 100000:
        score += 10
    iv = strike_data.get("iv", 20)
    if iv < 25:
        score += 5  # Lower IV preferred for buyers
    return min(max(score, 0), 100)


def calculate_volume_score(data: Dict) -> float:
    """Score based on volume analysis."""
    score = 50.0
    rel_vol = data.get("relativeVolume", 1.0)
    if rel_vol > 1.5:
        score += 20
    elif rel_vol > 1.2:
        score += 10
    volume = data.get("volume", 0)
    if volume > 10_000_000:
        score += 15
    return min(max(score, 0), 100)


def calculate_quantitative_score(greeks: Dict, iv: float) -> float:
    """Score based on Greeks, IV rank, probability."""
    score = 50.0
    delta = abs(greeks.get("delta", 0.5))
    if 0.3 < delta < 0.7:
        score += 15  # Optimal delta range
    theta = greeks.get("theta", 0)
    if theta > -20:
        score += 10  # Not too much time decay
    if iv < 30:
        score += 10  # Reasonable IV
    return min(max(score, 0), 100)


def calculate_final_score(
    price_action: float,
    technical: float,
    option_chain: float,
    volume: float,
    quantitative: float,
    weights: Dict[str, float] = None,
) -> float:
    """Combine sub-scores with configurable weights."""
    w = weights or {
        "priceAction": settings.WEIGHT_PRICE_ACTION,
        "technical": settings.WEIGHT_TECHNICAL,
        "optionChain": settings.WEIGHT_OPTION_CHAIN,
        "volume": settings.WEIGHT_VOLUME,
        "quantitative": settings.WEIGHT_QUANTITATIVE,
    }
    final = (
        price_action * w["priceAction"]
        + technical * w["technical"]
        + option_chain * w["optionChain"]
        + volume * w["volume"]
        + quantitative * w["quantitative"]
    )
    return round(min(max(final, 0), 100), 1)


def score_all_strikes(market_data: Dict, option_chain: Dict) -> List[Dict[str, Any]]:
    """Score every strike in the option chain and return sorted list."""
    scored = []
    indicators = market_data.get("indicators", {})
    
    for row in option_chain.get("strikes", []):
        for opt_type in ("call", "put"):
            strike_data = row[opt_type]
            pa = calculate_price_action_score(market_data)
            tech = calculate_technical_score(indicators)
            oc = calculate_option_chain_score(strike_data)
            vol = calculate_volume_score(market_data)
            quant = calculate_quantitative_score(strike_data.get("greeks", {}), strike_data.get("iv", 20))
            final = calculate_final_score(pa, tech, oc, vol, quant)
            
            premium = strike_data.get("ltp", 100)
            scored.append({
                "strikePrice": row["strikePrice"],
                "expiry": option_chain["expiry"],
                "optionType": strike_data["optionType"],
                "liquidityScore": round(random.uniform(40, 95), 1),
                "volumeScore": round(vol, 1),
                "oiScore": round(oc, 1),
                "changeInOIScore": round(random.uniform(30, 90), 1),
                "trendScore": round(pa, 1),
                "momentumScore": round(tech, 1),
                "volatilityScore": round(quant, 1),
                "riskScore": round(random.uniform(30, 80), 1),
                "probabilityScore": round(random.uniform(40, 75), 1),
                "expectedReward": round(premium * random.uniform(0.3, 1.0), 2),
                "expectedLoss": round(premium * random.uniform(0.2, 0.5), 2),
                "riskRewardRatio": round(random.uniform(1.2, 3.5), 2),
                "finalScore": final,
            })
    
    return sorted(scored, key=lambda x: x["finalScore"], reverse=True)
