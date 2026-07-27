"""Market Data Router — Uses Google Finance Web Scraper instead of Angel One."""
from fastapi import APIRouter
from src.services.google_finance_scraper import fetch_quote

router = APIRouter()

@router.get("/dashboard")
async def get_dashboard_data():
    """Get real-time market overview (Indices & Top Stocks) via Google Finance scraper."""
    indices_symbols = ["NIFTY 50", "BANK NIFTY", "SENSEX", "INDIA VIX"]
    top_symbols = ["RELIANCE", "TCS", "INFY", "HDFCBANK", "ITC"]
    
    live_indices = []
    for sym in indices_symbols:
        q = fetch_quote(sym)
        live_indices.append({
            "name": sym,
            "symbol": sym,
            "value": q.get("ltp", 0.0),
            "change": q.get("netChange", 0.0),
            "percent": q.get("percentChange", 0.0),
            "isUp": q.get("isUp", True)
        })
        
    top_movers = []
    for sym in top_symbols:
        q = fetch_quote(sym)
        top_movers.append({
            "name": f"{sym} Ltd",
            "symbol": sym,
            "value": q.get("ltp", 0.0),
            "change": q.get("netChange", 0.0),
            "percent": q.get("percentChange", 0.0),
            "isUp": q.get("isUp", True)
        })
        
    return {
        "success": True,
        "data": {
            "indices": live_indices,
            "topMovers": top_movers
        }
    }

@router.get("/ltp/{symbol}")
async def get_ltp(symbol: str):
    """Get Last Traded Price for a symbol via Google Finance."""
    quote = fetch_quote(symbol)
    return {"success": True, "data": quote}

@router.get("/quote/{symbol}")
async def get_quote(symbol: str):
    """Get full market quote for a symbol via Google Finance."""
    quote = fetch_quote(symbol)
    return {"success": True, "data": quote}
