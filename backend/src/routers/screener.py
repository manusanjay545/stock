"""Screener Router"""
from fastapi import APIRouter
from pydantic import BaseModel
from src.core.angel_one import angel_client
from src.services.screener_scraper import scrape_company_data

router = APIRouter()

class ScreenerQuery(BaseModel):
    query: str
    limit: int = 50

@router.post("/run")
async def run_screener(query: ScreenerQuery):
    """Run a stock screen based on query parameters.
    Since we removed yfinance, we will use a preset universe, 
    pull live Angel One quotes, and optionally augment with scraped fundamental data.
    """
    universe = ["RELIANCE", "TCS", "INFY", "HDFCBANK", "ITC", "HINDUNILVR", "SBIN", "BHARTIARTL"]
    
    results = []
    
    try:
        s_no = 1
        for symbol in universe:
            # First get live price from Angel One
            token = angel_client.get_token(symbol)
            quote = None
            if token:
                quote = angel_client.get_quote(exchange="NSE", symbol=f"{symbol}-EQ", token=token)
            
            # Since the screener UI requires P/E, Mar Cap etc, we scrape it for the universe
            fundamentals = scrape_company_data(symbol)
            
            cmp = quote.get("ltp", fundamentals.get("currentPrice", 0)) if quote else fundamentals.get("currentPrice", 0)
            
            results.append({
                "sNo": s_no,
                "symbol": symbol,
                "name": f"{symbol} Limited",
                "cmp": cmp,
                "pe": fundamentals.get("pe", 0),
                "marCap": fundamentals.get("marketCap", 0),
                "divYield": fundamentals.get("dividendYield", 0),
                "npQtr": 0, # Cannot scrape easily inside a loop without slowing down heavily
                "qtrProfitVar": 0 
            })
            s_no += 1
            
            if len(results) >= query.limit:
                break
                
        return {
            "success": True,
            "data": results,
            "count": len(results)
        }
    except Exception as e:
        return {
            "success": False,
            "message": str(e),
            "data": [],
            "count": 0
        }
