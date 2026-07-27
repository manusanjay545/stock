"""Search Router"""
from fastapi import APIRouter

router = APIRouter()

POPULAR_STOCKS = [
    {"symbol": "RELIANCE", "name": "Reliance Industries Ltd", "exchange": "NSE"},
    {"symbol": "TCS", "name": "Tata Consultancy Services Ltd", "exchange": "NSE"},
    {"symbol": "INFY", "name": "Infosys Ltd", "exchange": "NSE"},
    {"symbol": "HDFCBANK", "name": "HDFC Bank Ltd", "exchange": "NSE"},
    {"symbol": "ITC", "name": "ITC Ltd", "exchange": "NSE"},
    {"symbol": "SBIN", "name": "State Bank of India", "exchange": "NSE"},
    {"symbol": "BHARTIARTL", "name": "Bharti Airtel Ltd", "exchange": "NSE"},
    {"symbol": "HINDUNILVR", "name": "Hindustan Unilever Ltd", "exchange": "NSE"},
    {"symbol": "ICICIBANK", "name": "ICICI Bank Ltd", "exchange": "NSE"},
    {"symbol": "LT", "name": "Larsen & Toubro Ltd", "exchange": "NSE"},
]

@router.get("/")
async def search(q: str):
    """Search symbols locally without external broker API dependencies."""
    q_upper = q.upper().strip()
    if not q_upper:
        return {"success": True, "data": []}
        
    results = [
        s for s in POPULAR_STOCKS 
        if q_upper in s["symbol"] or q_upper in s["name"].upper()
    ]
    
    return {"success": True, "data": results}
