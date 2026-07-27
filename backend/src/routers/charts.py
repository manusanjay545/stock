"""Charts Data Router"""
from fastapi import APIRouter
from datetime import datetime, timedelta
import random

router = APIRouter()

@router.get("/historical/{symbol}")
async def get_historical_data(
    symbol: str,
    interval: str = "ONE_DAY",
    days: int = 30
):
    """Get historical candlestick chart data (Generated for Lightweight Charts)."""
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)
    
    # Generate realistic historical candles around base price
    base_price = 2500.0 if "NIFTY" in symbol.upper() else 1500.0
    candles = []
    
    current_time = start_date
    current_price = base_price
    
    while current_time <= end_date:
        if current_time.weekday() < 5: # Weekdays only
            change = random.uniform(-15.0, 15.0)
            open_p = current_price
            close_p = current_price + change
            high_p = max(open_p, close_p) + random.uniform(2.0, 10.0)
            low_p = min(open_p, close_p) - random.uniform(2.0, 10.0)
            
            candles.append({
                "time": current_time.strftime("%Y-%m-%d"),
                "open": round(open_p, 2),
                "high": round(high_p, 2),
                "low": round(low_p, 2),
                "close": round(close_p, 2),
                "volume": random.randint(100000, 5000000)
            })
            current_price = close_p
        current_time += timedelta(days=1)
        
    return {
        "success": True,
        "data": candles
    }
