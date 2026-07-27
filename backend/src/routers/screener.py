"""Screener Router"""
from fastapi import APIRouter
from pydantic import BaseModel
import yfinance as yf

router = APIRouter()

class ScreenerQuery(BaseModel):
    query: str
    limit: int = 50

@router.post("/run")
async def run_screener(query: ScreenerQuery):
    """Run a stock screen based on query parameters.
    Since we don't have a full database of all 5000+ stocks fundamentals locally yet, 
    we will simulate the screening on a preset universe using yfinance for live data.
    """
    
    # Preset universe for demonstration (in production, this would query the Supabase DB)
    universe = ["RELIANCE.NS", "TCS.NS", "INFY.NS", "HDFCBANK.NS", "ITC.NS", "HINDUNILVR.NS", "SBIN.NS", "BHARTIARTL.NS"]
    
    results = []
    
    # Parse query simply to demonstrate (e.g. "Market Capitalization > 10000")
    # For Phase 2, we just pull real data for the universe and return it.
    try:
        tickers = yf.Tickers(" ".join(universe))
        
        s_no = 1
        for symbol, ticker in tickers.tickers.items():
            info = ticker.info
            if not info:
                continue
                
            clean_symbol = symbol.replace(".NS", "")
            results.append({
                "sNo": s_no,
                "symbol": clean_symbol,
                "name": info.get("shortName", clean_symbol),
                "cmp": info.get("currentPrice", info.get("regularMarketPrice", 0)),
                "pe": info.get("trailingPE", 0),
                "marCap": round(info.get("marketCap", 0) / 10000000, 2) if info.get("marketCap") else 0, # Crores
                "divYield": round((info.get("dividendYield", 0) * 100), 2) if info.get("dividendYield") else 0,
                "npQtr": round(info.get("netIncomeToCommon", 0) / 10000000, 2) if info.get("netIncomeToCommon") else 0,
                "qtrProfitVar": 5.0 # Simulated
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
