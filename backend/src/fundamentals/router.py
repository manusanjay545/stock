"""Fundamentals Router (Screener.in Style using yfinance)"""
from fastapi import APIRouter
import yfinance as yf
import math
import pandas as pd

router = APIRouter()

def process_dataframe(df):
    """Converts a yfinance DataFrame into a list of metric rows with chronological columns."""
    if df is None or df.empty:
        return {"dates": [], "rows": []}
    
    # Sort columns chronologically (oldest to newest left to right)
    sorted_cols = sorted(df.columns)
    dates = [col.strftime('%b %Y') for col in sorted_cols]
    
    rows = []
    for index in df.index:
        values = []
        for col in sorted_cols:
            val = df.loc[index, col]
            values.append(None if pd.isna(val) or math.isnan(val) else float(val))
        
        # Only add row if it has at least one non-null value
        if any(v is not None for v in values):
            # Clean up index names for UI
            name = str(index).replace("Net Income", "Net Profit").replace("Total Revenue", "Sales")
            rows.append({"metric": name, "values": values})
            
    return {"dates": dates, "rows": rows}

@router.get("/{symbol}")
async def get_fundamentals(symbol: str):
    try:
        ticker_symbol = symbol.upper()
        if not ticker_symbol.endswith(".NS") and ticker_symbol != "NIFTY":
            ticker_symbol += ".NS"
            
        ticker = yf.Ticker(ticker_symbol)
        
        # Fetch data
        info = ticker.info
        financials = ticker.financials
        balance_sheet = ticker.balance_sheet
        cashflow = ticker.cashflow
        
        # Process Summary Info (Top Grid)
        current_price = info.get("currentPrice", info.get("regularMarketPrice", 0))
        high_52 = info.get("fiftyTwoWeekHigh", 0)
        low_52 = info.get("fiftyTwoWeekLow", 0)
        
        company_info = {
            "name": info.get("longName", symbol),
            "about": info.get("longBusinessSummary", "No description available."),
            "website": info.get("website", ""),
            "marketCap": info.get("marketCap", 0),
            "currentPrice": current_price,
            "highLow": f"{high_52} / {low_52}",
            "peRatio": info.get("trailingPE", 0),
            "bookValue": info.get("bookValue", 0),
            "dividendYield": info.get("dividendYield", 0) * 100 if info.get("dividendYield") else 0,
            "roce": info.get("returnOnEquity", 0) * 100, # Approximate ROCE with ROE if missing
            "roe": info.get("returnOnEquity", 0) * 100,
            "faceValue": 10 # yfinance doesn't reliably provide face value
        }
        
        # Process Statements
        return {
            "success": True, 
            "data": {
                "symbol": symbol.upper(),
                "info": company_info,
                "profitAndLoss": process_dataframe(financials),
                "balanceSheet": process_dataframe(balance_sheet),
                "cashFlow": process_dataframe(cashflow)
            }
        }
    except Exception as e:
        return {"success": False, "message": f"Error fetching fundamental data: {str(e)}"}
