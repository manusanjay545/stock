"""Charts Router"""
from fastapi import APIRouter
from src.core.angel_one import angel_client
import time
from datetime import datetime, timedelta

router = APIRouter()

@router.get("/{symbol}")
async def get_chart_data(symbol: str, timeframe: str = "1D", range_str: str = "1M"):
    """Get historical chart data for TradingView."""
    token = angel_client.get_token(symbol)
    if not token:
        # Return mock data
        now = datetime.now()
        data = []
        base_price = 1500.0
        for i in range(30):
            date_str = (now - timedelta(days=30-i)).strftime("%Y-%m-%d %H:%M")
            data.append({
                "time": date_str,
                "open": base_price,
                "high": base_price + 20,
                "low": base_price - 10,
                "close": base_price + 5,
                "volume": 1000000 + (i * 10000)
            })
            base_price += 5
        return {"success": True, "data": data}
        
    # Example logic for interval mapping
    interval_map = {"1D": "ONE_DAY", "1H": "ONE_HOUR", "15M": "FIFTEEN_MINUTE", "5M": "FIVE_MINUTE", "1M": "ONE_MINUTE"}
    interval = interval_map.get(timeframe, "ONE_DAY")
    
    # Calculate dates
    to_date = datetime.now().strftime("%Y-%m-%d %H:%M")
    from_date = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d %H:%M")
    
    data = angel_client.get_historical("NSE", token, interval, from_date, to_date)
    
    if data:
        formatted_data = []
        for row in data:
            formatted_data.append({
                "time": row[0],
                "open": row[1],
                "high": row[2],
                "low": row[3],
                "close": row[4],
                "volume": row[5]
            })
        return {"success": True, "data": formatted_data}
        
    return {"success": False, "message": "Could not fetch data"}
