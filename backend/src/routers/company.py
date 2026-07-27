"""Company Data Router"""
from fastapi import APIRouter

router = APIRouter()

@router.get("/{symbol}")
async def get_company_overview(symbol: str):
    """Get company overview details (Screener.in style snapshot)."""
    # Placeholder for actual database/API fetch
    return {
        "success": True, 
        "data": {
            "symbol": symbol,
            "name": f"{symbol} Limited",
            "marketCap": 500000.0, # in Cr
            "currentPrice": 1500.0,
            "high52": 1600.0,
            "low52": 1000.0,
            "pe": 25.4,
            "bookValue": 350.0,
            "dividendYield": 1.2,
            "roce": 22.5,
            "roe": 18.4,
            "faceValue": 1.0,
            "about": f"{symbol} Ltd is a leading company in its sector, engaged in various business activities.",
            "pros": ["Company has reduced debt", "Company is expected to give good quarter", "Company has been maintaining a healthy dividend payout of 40.0%"],
            "cons": ["Stock is trading at 4.29 times its book value", "Company has delivered a poor sales growth of 5.50% over past five years"]
        }
    }

@router.get("/{symbol}/financials")
async def get_company_financials(symbol: str):
    """Get company financial statements."""
    return {
        "success": True,
        "data": {
            "quarters": ["Mar 2023", "Jun 2023", "Sep 2023", "Dec 2023", "Mar 2024"],
            "sales": [1000, 1100, 1050, 1200, 1250],
            "expenses": [700, 750, 720, 800, 820],
            "operatingProfit": [300, 350, 330, 400, 430],
            "opm": [30, 31, 31, 33, 34],
            "netProfit": [200, 240, 220, 280, 300]
        }
    }
