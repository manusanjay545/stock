"""Screener Router"""
from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import List, Optional
import yfinance as yf
# We'll use a predefined list of popular stocks for the screener to avoid extremely long api calls
# In a real prod environment, you'd scan a database of pre-fetched daily values

router = APIRouter()

POPULAR_STOCKS = [
    "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS", "ICICIBANK.NS", 
    "HUL.NS", "SBI.NS", "BAJFINANCE.NS", "BHARTIARTL.NS", "KOTAKBANK.NS",
    "ITC.NS", "LT.NS", "ASIANPAINT.NS", "AXISBANK.NS", "MARUTI.NS"
]

class ScreenerCriteria(BaseModel):
    minPrice: Optional[float] = None
    maxPrice: Optional[float] = None
    minVolume: Optional[int] = None
    minChangePercent: Optional[float] = None
    maxChangePercent: Optional[float] = None
    minPeRatio: Optional[float] = None

@router.post("")
async def screen_stocks(criteria: ScreenerCriteria):
    try:
        # Fetch latest data for the universe of stocks
        tickers = yf.Tickers(" ".join(POPULAR_STOCKS))
        results = []
        
        for symbol in POPULAR_STOCKS:
            try:
                info = tickers.tickers[symbol].info
                if not info or "currentPrice" not in info:
                    continue
                    
                price = info.get("currentPrice", 0)
                volume = info.get("volume", 0)
                prev_close = info.get("previousClose", price)
                change_pct = ((price - prev_close) / prev_close) * 100 if prev_close else 0
                pe_ratio = info.get("trailingPE", 0)
                
                # Apply filters
                if criteria.minPrice and price < criteria.minPrice: continue
                if criteria.maxPrice and price > criteria.maxPrice: continue
                if criteria.minVolume and volume < criteria.minVolume: continue
                if criteria.minChangePercent and change_pct < criteria.minChangePercent: continue
                if criteria.maxChangePercent and change_pct > criteria.maxChangePercent: continue
                if criteria.minPeRatio and pe_ratio < criteria.minPeRatio: continue
                
                results.append({
                    "symbol": symbol.replace(".NS", ""),
                    "name": info.get("shortName", symbol),
                    "price": price,
                    "change": price - prev_close,
                    "changePercent": change_pct,
                    "volume": volume,
                    "peRatio": pe_ratio,
                    "marketCap": info.get("marketCap", 0)
                })
            except Exception:
                continue # Skip stocks that fail to fetch
                
        # Sort by change percent descending by default
        results.sort(key=lambda x: x["changePercent"], reverse=True)
        
        return {"success": True, "data": results}
    except Exception as e:
        return {"success": False, "message": f"Error running screener: {str(e)}"}
