"""Market Data Router (Real Data via nsepython)"""
from fastapi import APIRouter
from nsepython import nse_quote

router = APIRouter()

def get_real_market_data(symbol: str):
    try:
        data = nse_quote(symbol)
        if not data:
            return None
        
        # Parse the nse_quote data into our expected format
        price_info = data.get("priceInfo", {})
        metadata = data.get("info", {})
        
        base = price_info.get("previousClose", 1000)
        price = price_info.get("lastPrice", base)
        change = price - base
        
        return {
            "symbol": metadata.get("symbol", symbol),
            "price": price,
            "open": price_info.get("open", base),
            "high": price_info.get("intraDayHighLow", {}).get("max", price),
            "low": price_info.get("intraDayHighLow", {}).get("min", price),
            "close": price,
            "prevClose": base,
            "change": change,
            "changePercent": price_info.get("pChange", 0),
            "volume": data.get("preOpenMarket", {}).get("totalTradedVolume", 0), # Fallback if unavailable
            "timestamp": data.get("metadata", {}).get("lastUpdateTime", ""),
            "trend": "BULLISH" if change > 0 else "BEARISH" if change < 0 else "SIDEWAYS",
            "indicators": {} # We can't easily get live indicators from nsepython directly without historical data processing
        }
    except Exception as e:
        print(f"Error fetching data for {symbol}: {e}")
        return None

@router.get("/overview")
async def get_market_overview():
    indices = []
    for s in ["NIFTY 50", "NIFTY BANK", "NIFTY FIN SERVICE"]:
        data = get_real_market_data(s)
        if data:
            indices.append(data)
            
    bulls = sum(1 for i in indices if i.get("trend") == "BULLISH")
    return {
        "success": True,
        "data": {
            "status": {"isOpen": True, "session": "OPEN", "nextOpen": "", "nextClose": ""},
            "indices": indices,
            "overallScore": sum(i.get("changePercent", 0) for i in indices) * 10 + 50,
            "marketSentiment": "BULLISH" if bulls >= 2 else "BEARISH" if bulls <= 0 else "SIDEWAYS",
        },
        "timestamp": indices[0]["timestamp"] if indices else "",
    }

@router.get("/{symbol}")
async def get_market_data(symbol: str):
    data = get_real_market_data(symbol.upper())
    if data:
        return {"success": True, "data": data}
    return {"success": False, "message": "Failed to fetch data"}

@router.get("/{symbol}/indicators")
async def get_indicators(symbol: str):
    # This would require a historical data provider and talib to calculate properly
    return {"success": True, "data": {}}
