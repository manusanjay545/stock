"""Company Data Router"""
from fastapi import APIRouter
from src.services.screener_scraper import scrape_company_data, scrape_financial_quarters
from src.services.google_finance_scraper import fetch_quote

router = APIRouter()

@router.get("/{symbol}")
async def get_company_overview(symbol: str):
    """Get company overview blending Screener.in Fundamentals and Google Finance Live Quotes."""
    try:
        # 1. Scrape Fundamentals from Screener.in
        fundamentals = scrape_company_data(symbol)
        
        # 2. Fetch Live Price from Google Finance
        gf_quote = fetch_quote(symbol)
        live_price = gf_quote.get("ltp", 0.0)
        if live_price > 0:
            fundamentals["currentPrice"] = live_price
        
        return {
            "success": True, 
            "data": {
                "symbol": symbol,
                "name": f"{symbol} Limited",
                "sector": fundamentals["sector"],
                "marketCap": fundamentals["marketCap"],
                "currentPrice": fundamentals["currentPrice"],
                "high52": fundamentals["high52"],
                "low52": fundamentals["low52"],
                "pe": fundamentals["pe"],
                "bookValue": fundamentals["bookValue"],
                "dividendYield": fundamentals["dividendYield"],
                "roce": fundamentals["roce"],
                "roe": fundamentals["roe"],
                "faceValue": fundamentals["faceValue"],
                "about": fundamentals["about"],
                "pros": fundamentals["pros"] if fundamentals["pros"] else ["Data scraped directly from Screener & Google Finance"],
                "cons": fundamentals["cons"] if fundamentals["cons"] else ["Real-time data stream active"]
            }
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"Failed to fetch data for {symbol}: {str(e)}",
            "data": {}
        }

@router.get("/{symbol}/financials")
async def get_company_financials(symbol: str):
    """Get company financial statements from Screener.in scraper."""
    try:
        financials = scrape_financial_quarters(symbol)
        return {
            "success": True,
            "data": financials
        }
    except Exception as e:
        return {
            "success": False,
            "message": str(e),
            "data": {}
        }
