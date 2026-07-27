"""Screener Router"""
from fastapi import APIRouter
from pydantic import BaseModel
from src.services.screener_scraper import scrape_company_data
from src.services.google_finance_scraper import fetch_quote

router = APIRouter()

class ScreenerQuery(BaseModel):
    query: str
    limit: int = 50

@router.post("/run")
async def run_screener(query: ScreenerQuery):
    """Run a stock screen based on query parameters."""
    universe = ["RELIANCE", "TCS", "INFY", "HDFCBANK", "ITC", "HINDUNILVR", "SBIN", "BHARTIARTL"]
    
    results = []
    try:
        s_no = 1
        for symbol in universe:
            # Live price from Google Finance
            gf = fetch_quote(symbol)
            fundamentals = scrape_company_data(symbol)
            
            cmp = gf.get("ltp", fundamentals.get("currentPrice", 0))
            
            results.append({
                "sNo": s_no,
                "symbol": symbol,
                "name": f"{symbol} Limited",
                "cmp": cmp,
                "pe": fundamentals.get("pe", 0),
                "marCap": fundamentals.get("marketCap", 0),
                "divYield": fundamentals.get("dividendYield", 0),
                "npQtr": 0,
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
