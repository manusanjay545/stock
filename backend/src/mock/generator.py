"""QuantStrike AI — Mock Data Generator (Backend)"""

import random
import math
from datetime import datetime, timedelta
from typing import List, Dict, Any

BASE_PRICES = {
    "NIFTY": 24850, "BANKNIFTY": 53200, "FINNIFTY": 24100, "SENSEX": 81500,
    "RELIANCE": 2980, "TCS": 3850, "HDFCBANK": 1720, "INFY": 1580, "ICICIBANK": 1290,
}


def _rand(lo: float, hi: float) -> float:
    return random.uniform(lo, hi)


def _randint(lo: int, hi: int) -> int:
    return random.randint(lo, hi)


def _pick(arr):
    return random.choice(arr)


def get_next_expiry() -> str:
    now = datetime.now()
    days_until_thu = (3 - now.weekday() + 7) % 7 or 7
    return (now + timedelta(days=days_until_thu)).strftime("%Y-%m-%d")


def generate_market_data(symbol: str) -> Dict[str, Any]:
    base = BASE_PRICES.get(symbol, 1000)
    price = base * _rand(0.98, 1.02)
    change = price - base
    indicators = {
        "atr": _rand(50, 200), "adx": _rand(15, 55), "rsi": _rand(25, 80),
        "macd": _rand(-30, 30), "macdSignal": _rand(-20, 20), "macdHistogram": _rand(-15, 15),
        "ema20": price * _rand(0.98, 1.02), "ema50": price * _rand(0.96, 1.04),
        "ema100": price * _rand(0.94, 1.06), "ema200": price * _rand(0.92, 1.08),
        "supertrend": price * _rand(0.97, 1.03),
        "supertrendDirection": "BULLISH" if change > 0 else "BEARISH",
        "bollingerUpper": price * 1.03, "bollingerMiddle": price, "bollingerLower": price * 0.97,
        "cci": _rand(-200, 200), "stochRsiK": _rand(10, 90), "stochRsiD": _rand(10, 90),
    }
    return {
        "symbol": symbol, "price": round(price, 2), "open": round(base * _rand(0.995, 1.005), 2),
        "high": round(price * _rand(1.001, 1.015), 2), "low": round(price * _rand(0.985, 0.999), 2),
        "close": round(price, 2), "prevClose": base,
        "change": round(change, 2), "changePercent": round((change / base) * 100, 2),
        "volume": _randint(5_000_000, 50_000_000), "vwap": round(price * _rand(0.998, 1.002), 2),
        "relativeVolume": round(_rand(0.5, 3), 1), "timestamp": datetime.now().isoformat(),
        "indicators": indicators,
        "trend": "BULLISH" if change > 0 else "BEARISH" if change < 0 else "SIDEWAYS",
    }


def generate_option_chain(symbol: str) -> Dict[str, Any]:
    spot = BASE_PRICES.get(symbol, 24850)
    step = 100 if symbol in ("BANKNIFTY", "SENSEX") else 50
    atm = round(spot / step) * step
    expiry = get_next_expiry()
    strikes = []

    for s in range(atm - step * 15, atm + step * 15 + 1, step):
        dist = abs(s - spot) / spot
        call_oi = _randint(5000, 2_000_000)
        put_oi = _randint(5000, 2_000_000)
        iv = _rand(12, 25) + dist * 80

        call_premium = max(0, spot - s) + _rand(5, 80 * (1 - dist))
        put_premium = max(0, s - spot) + _rand(5, 80 * (1 - dist))

        def make_strike(opt_type, premium, oi):
            return {
                "strikePrice": s, "expiryDate": expiry, "optionType": opt_type,
                "ltp": round(premium, 2), "change": round(_rand(-20, 20), 2),
                "changePercent": round(_rand(-8, 8), 2), "volume": _randint(1000, 500000),
                "oi": oi, "changeInOI": _randint(-50000, 100000), "iv": round(iv, 2),
                "bid": round(premium - _rand(0.5, 3), 2), "ask": round(premium + _rand(0.5, 3), 2),
                "bidQty": _randint(100, 5000), "askQty": _randint(100, 5000),
                "greeks": {
                    "delta": round(_rand(0.1, 0.95) if opt_type == "CE" else _rand(-0.95, -0.1), 4),
                    "gamma": round(_rand(0.001, 0.05), 4),
                    "theta": round(_rand(-50, -2), 2),
                    "vega": round(_rand(2, 30), 2),
                },
            }

        strikes.append({
            "strikePrice": s, "isATM": s == atm,
            "isITM_CE": s < spot, "isITM_PE": s > spot,
            "call": make_strike("CE", call_premium, call_oi),
            "put": make_strike("PE", put_premium, put_oi),
        })

    total_call_oi = sum(r["call"]["oi"] for r in strikes)
    total_put_oi = sum(r["put"]["oi"] for r in strikes)
    return {
        "symbol": symbol, "spotPrice": spot, "expiry": expiry, "atmStrike": atm,
        "maxPain": atm + _pick([-2, -1, 0, 1, 2]) * step,
        "pcr": round(total_put_oi / max(total_call_oi, 1), 2),
        "totalCallOI": total_call_oi, "totalPutOI": total_put_oi, "strikes": strikes,
    }


def generate_recommendations(count: int = 8) -> List[Dict[str, Any]]:
    results = []
    for _ in range(count):
        symbol = _pick(["NIFTY", "BANKNIFTY", "FINNIFTY", "RELIANCE", "TCS"])
        base = BASE_PRICES.get(symbol, 24850)
        direction = _pick(["BUY CALL", "BUY PUT"])
        step = 100 if symbol == "BANKNIFTY" else 50
        atm = round(base / step) * step
        strike = atm + _pick([-2, -1, 0, 1, 2]) * step
        premium = _rand(30, 350)
        score = _randint(45, 95)
        bullish = direction == "BUY CALL"

        results.append({
            "id": f"rec-{random.randint(1000, 9999)}", "symbol": symbol,
            "direction": direction, "strikePrice": strike, "expiry": get_next_expiry(),
            "currentPremium": round(premium, 2),
            "entryPrice": round(premium * _rand(0.95, 1.02), 2),
            "stopLoss": round(premium * _rand(0.6, 0.8), 2),
            "target1": round(premium * _rand(1.3, 1.6), 2),
            "target2": round(premium * _rand(1.6, 2.2), 2),
            "holdingTime": _pick(["Intraday", "1-2 Days", "2-5 Days"]),
            "confidence": _randint(55, 92), "overallScore": score,
            "riskLevel": "LOW" if score >= 70 else "MEDIUM" if score >= 50 else "HIGH",
            "expectedMove": round(_rand(0.5, 3.5), 2),
            "probabilityOfSuccess": _randint(45, 82),
            "riskRewardRatio": round(_rand(1.2, 3.5), 2),
            "explanation": {
                "trend": f"{symbol} is {'bullish' if bullish else 'bearish'} on hourly timeframe.",
                "momentum": f"RSI at {_randint(40, 70)}, MACD {'positive' if bullish else 'negative'}.",
                "technicalIndicators": f"Price {'above' if bullish else 'below'} 20-EMA. ADX at {_randint(20, 45)}.",
                "optionChain": f"PCR {_rand(0.7, 1.4):.2f}. {'Put writing' if bullish else 'Call writing'} detected.",
                "volume": f"Relative volume {_rand(1.1, 2.5):.1f}x. {'Buying' if bullish else 'Selling'} pressure.",
                "quantitativeSignals": f"IV Rank {_randint(20, 70)}. Favorable risk-reward.",
                "support": f"Support at {base * 0.98:.0f}", "resistance": f"Resistance at {base * 1.02:.0f}",
                "volatility": f"IV at {_rand(12, 25):.1f}%.", "marketSentiment": "Moderately " + ("bullish" if bullish else "bearish"),
                "strikeRationale": "Optimal liquidity and probability.", "technicalSummary": f"{'Bullish' if bullish else 'Bearish'} bias.",
                "optionChainSummary": "OI structure supportive.", "quantitativeSummary": f"R:R {_rand(1.5, 3):.1f}:1.",
                "finalRecommendation": "Educational analysis only. Manage risk carefully.",
            },
            "createdAt": datetime.now().isoformat(),
        })
    return sorted(results, key=lambda x: x["overallScore"], reverse=True)


def generate_scanner_results(count: int = 12) -> List[Dict[str, Any]]:
    categories = ["BREAKOUT", "MOMENTUM", "TREND_REVERSAL", "HIGH_VOLUME", "OI_CHANGE", "HIGH_CONFIDENCE"]
    return [{
        "id": f"scan-{random.randint(1000, 9999)}",
        "symbol": _pick(["NIFTY", "BANKNIFTY", "FINNIFTY", "RELIANCE", "TCS"]),
        "category": _pick(categories), "direction": _pick(["BUY CALL", "BUY PUT"]),
        "strikePrice": round(24850 / 50) * 50, "expiry": get_next_expiry(),
        "score": _randint(55, 95), "confidence": _randint(50, 90),
        "description": f"Signal detected with strong confirmation.",
        "detectedAt": datetime.now().isoformat(),
    } for _ in range(count)]


def generate_backtest_result() -> Dict[str, Any]:
    trades = []
    equity = 100000
    for i in range(40):
        pnl = _rand(-5000, 8000)
        equity += pnl
        trades.append({
            "entryDate": (datetime.now() - timedelta(days=60 - i)).isoformat(),
            "exitDate": (datetime.now() - timedelta(days=59 - i)).isoformat(),
            "strikePrice": 24800 + _pick([-100, -50, 0, 50, 100]),
            "direction": _pick(["BUY CALL", "BUY PUT"]),
            "entryPrice": round(_rand(50, 300), 2), "exitPrice": round(_rand(20, 500), 2),
            "pnl": round(pnl, 2), "pnlPercent": round(pnl / 1000, 2),
        })
    wins = [t for t in trades if t["pnl"] > 0]
    losses = [t for t in trades if t["pnl"] <= 0]
    return {
        "id": f"bt-{random.randint(1000, 9999)}",
        "winRate": round(len(wins) / len(trades) * 100, 1),
        "lossRate": round(len(losses) / len(trades) * 100, 1),
        "averageProfit": round(sum(t["pnl"] for t in wins) / max(len(wins), 1)),
        "averageLoss": round(sum(t["pnl"] for t in losses) / max(len(losses), 1)),
        "maximumDrawdown": round(_rand(5, 25), 1),
        "profitFactor": round(_rand(1.1, 2.8), 2),
        "sharpeRatio": round(_rand(0.5, 2.5), 2),
        "totalTrades": len(trades),
        "totalProfit": round(sum(t["pnl"] for t in wins)),
        "totalLoss": round(sum(t["pnl"] for t in losses)),
        "netPnL": round(equity - 100000),
        "equityCurve": [{"date": t["exitDate"], "value": round(100000 + sum(tr["pnl"] for tr in trades[:j+1]))} for j, t in enumerate(trades)],
        "trades": trades,
    }
