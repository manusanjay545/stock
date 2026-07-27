"""Company Data Router"""
from fastapi import APIRouter
import yfinance as yf
from datetime import datetime

router = APIRouter()

@router.get("/{symbol}")
async def get_company_overview(symbol: str):
    """Get company overview details (Screener.in style snapshot)."""
    try:
        # Convert NSE symbol to yfinance ticker format
        ticker_symbol = f"{symbol}.NS"
        stock = yf.Ticker(ticker_symbol)
        info = stock.info
        
        # Format the numbers gracefully (if they exist)
        market_cap = info.get("marketCap", 0) / 10000000 if info.get("marketCap") else 0 # In Crores
        current_price = info.get("currentPrice", info.get("regularMarketPrice", 0))
        high52 = info.get("fiftyTwoWeekHigh", 0)
        low52 = info.get("fiftyTwoWeekLow", 0)
        pe = info.get("trailingPE", 0)
        book_value = info.get("bookValue", 0)
        dividend_yield = (info.get("dividendYield", 0) * 100) if info.get("dividendYield") else 0
        roe = (info.get("returnOnEquity", 0) * 100) if info.get("returnOnEquity") else 0
        face_value = 1.0 # default fallback
        
        return {
            "success": True, 
            "data": {
                "symbol": symbol,
                "name": info.get("shortName", f"{symbol} Limited"),
                "sector": info.get("sector", "Unknown Sector"),
                "marketCap": round(market_cap, 2),
                "currentPrice": round(current_price, 2),
                "high52": round(high52, 2),
                "low52": round(low52, 2),
                "pe": round(pe, 2) if pe else "N/A",
                "bookValue": round(book_value, 2) if book_value else "N/A",
                "dividendYield": round(dividend_yield, 2) if dividend_yield else "N/A",
                "roce": round(roe, 2), # Using ROE for both to approximate
                "roe": round(roe, 2),
                "faceValue": face_value,
                "about": info.get("longBusinessSummary", f"{symbol} is a listed company on the NSE."),
                "pros": ["Company fundamentals fetched successfully"],
                "cons": ["Note: Real-time price updates require market hours"]
            }
        }
    except Exception as e:
        # Fallback if yfinance fails
        return {
            "success": False,
            "message": f"Failed to fetch data for {symbol}: {str(e)}",
            "data": {
                "symbol": symbol,
                "name": f"{symbol} Limited",
                "marketCap": 0, "currentPrice": 0, "high52": 0, "low52": 0,
                "pe": 0, "bookValue": 0, "dividendYield": 0, "roce": 0, "roe": 0,
                "faceValue": 0, "about": "Data unavailable", "pros": [], "cons": []
            }
        }

@router.get("/{symbol}/financials")
async def get_company_financials(symbol: str):
    """Get company financial statements."""
    try:
        ticker_symbol = f"{symbol}.NS"
        stock = yf.Ticker(ticker_symbol)
        
        # Get quarterly financials
        q_financials = stock.quarterly_financials
        
        # Parse the yfinance pandas dataframe into our structure if not empty
        if not q_financials.empty:
            dates = [d.strftime("%b %Y") for d in q_financials.columns[:5]][::-1]
            
            def get_row(key, default=[0]*5):
                if key in q_financials.index:
                    vals = q_financials.loc[key].fillna(0).values[:5][::-1]
                    # Convert to Crores
                    return [round(v / 10000000, 2) for v in vals]
                return default
            
            sales = get_row("Total Revenue")
            expenses = get_row("Total Operating Expenses")
            net_profit = get_row("Net Income")
            
            # Approximate operating profit and margin
            op_profit = [round(s - e, 2) for s, e in zip(sales, expenses)]
            opm = [round((o / s) * 100, 2) if s > 0 else 0 for o, s in zip(op_profit, sales)]
            
            return {
                "success": True,
                "data": {
                    "quarters": dates,
                    "sales": sales,
                    "expenses": expenses,
                    "operatingProfit": op_profit,
                    "opm": opm,
                    "netProfit": net_profit
                }
            }
            
        raise ValueError("No financial data returned")
        
    except Exception as e:
        # Graceful fallback structure
        return {
            "success": False,
            "message": str(e),
            "data": {
                "quarters": ["Q1", "Q2", "Q3", "Q4", "Q1"],
                "sales": [0,0,0,0,0], "expenses": [0,0,0,0,0],
                "operatingProfit": [0,0,0,0,0], "opm": [0,0,0,0,0], "netProfit": [0,0,0,0,0]
            }
        }
