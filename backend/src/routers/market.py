"""Market Data Router"""
from fastapi import APIRouter
from src.core.angel_one import angel_client

router = APIRouter()

@router.get("/dashboard")
async def get_dashboard_data():
    """Get real-time data for the dashboard (Indices and Top Stocks)."""
    # Define the tokens we want to track on the dashboard
    indices = {
        "NIFTY 50": {"exchange": "NSE", "token": "99926000", "symbol": "NIFTY"},
        "BANK NIFTY": {"exchange": "NSE", "token": "99926009", "symbol": "BANKNIFTY"},
        "SENSEX": {"exchange": "BSE", "token": "99919000", "symbol": "SENSEX"},
        "INDIA VIX": {"exchange": "NSE", "token": "99926014", "symbol": "INDIA VIX"}
    }
    
    # Watchlist of popular stocks for the "Top Movers" section
    stocks = ["RELIANCE", "TCS", "INFY", "HDFCBANK", "ITC", "SBIN", "BHARTIARTL"]
    
    nse_tokens = []
    bse_tokens = []
    
    # Collect index tokens
    for name, info in indices.items():
        if info["exchange"] == "NSE":
            nse_tokens.append(info["token"])
        elif info["exchange"] == "BSE":
            bse_tokens.append(info["token"])
            
    # Collect stock tokens
    for symbol in stocks:
        token = angel_client.get_token(symbol)
        if token:
            nse_tokens.append(token)
            
    try:
        # Fetch all NSE tokens in one request
        market_data = []
        if nse_tokens:
            nse_data = angel_client.smart_api.getMarketData(mode="FULL", exchangeTokens={"NSE": nse_tokens})
            if nse_data and nse_data.get("status"):
                market_data.extend(nse_data.get("data", {}).get("fetched", []))
                
        # Fetch BSE tokens (SENSEX)
        if bse_tokens:
            bse_data = angel_client.smart_api.getMarketData(mode="FULL", exchangeTokens={"BSE": bse_tokens})
            if bse_data and bse_data.get("status"):
                market_data.extend(bse_data.get("data", {}).get("fetched", []))
                
        # Parse results
        live_indices = []
        live_stocks = []
        
        for item in market_data:
            token = item.get("symbolToken")
            name = item.get("tradingSymbol", "").replace("-EQ", "")
            
            # Map back to readable names for indices
            if token == "99926000": name = "NIFTY 50"
            elif token == "99926009": name = "BANK NIFTY"
            elif token == "99919000": name = "SENSEX"
            elif token == "99926014": name = "INDIA VIX"
            
            data_point = {
                "name": name,
                "symbol": item.get("tradingSymbol", "").replace("-EQ", ""),
                "value": item.get("ltp", 0.0),
                "change": item.get("netChange", 0.0),
                "percent": item.get("percentChange", 0.0),
                "isUp": item.get("netChange", 0.0) >= 0
            }
            
            if token in ["99926000", "99926009", "99919000", "99926014"]:
                live_indices.append(data_point)
            else:
                live_stocks.append(data_point)
                
        # Sort stocks by percent change to get top gainers
        top_gainers = sorted(live_stocks, key=lambda x: x["percent"], reverse=True)[:5]
        
        # Ensure indices exist even if API fails (fallback to 0)
        index_names_found = [i["name"] for i in live_indices]
        for name in indices.keys():
            if name not in index_names_found:
                live_indices.append({"name": name, "symbol": name, "value": 0, "change": 0, "percent": 0, "isUp": True})
                
        # Sort indices to match intended order
        order = ["NIFTY 50", "BANK NIFTY", "SENSEX", "INDIA VIX"]
        live_indices.sort(key=lambda x: order.index(x["name"]) if x["name"] in order else 99)
                
        return {
            "success": True,
            "data": {
                "indices": live_indices,
                "topMovers": top_gainers
            }
        }
    except Exception as e:
        return {
            "success": False,
            "message": str(e),
            "data": {
                "indices": [
                    {"name": "NIFTY 50", "value": 0, "change": 0, "percent": 0, "isUp": True},
                    {"name": "BANK NIFTY", "value": 0, "change": 0, "percent": 0, "isUp": True},
                    {"name": "SENSEX", "value": 0, "change": 0, "percent": 0, "isUp": True},
                    {"name": "INDIA VIX", "value": 0, "change": 0, "percent": 0, "isUp": True}
                ],
                "topMovers": []
            }
        }
