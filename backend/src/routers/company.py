"""Company Data Router"""
from fastapi import APIRouter
from src.core.angel_one import angel_client
from src.services.screener_scraper import scrape_company_data, scrape_financial_quarters

router = APIRouter()

@router.get("/{symbol}")
async def get_company_overview(symbol: str):
    """Get company overview details blending Angel One Live Data and Screener.in Fundamentals."""
    try:
        # 1. Scrape Fundamentals from Screener.in
        fundamentals = scrape_company_data(symbol)
        
        # 2. Fetch Live Price from Angel One (FULL mode)
        token = angel_client.get_token(symbol)
        if token:
            quote = angel_client.get_quote(exchange="NSE", symbol=f"{symbol}-EQ", token=token)
            if quote:
                # Override scraped price with live Angel One data
                fundamentals["currentPrice"] = quote.get("ltp", fundamentals["currentPrice"])
                fundamentals["high52"] = quote.get("52WeekHigh", fundamentals["high52"])
                fundamentals["low52"] = quote.get("52WeekLow", fundamentals["low52"])
        
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
                "pros": fundamentals["pros"] if fundamentals["pros"] else ["Data scraped successfully"],
                "cons": fundamentals["cons"] if fundamentals["cons"] else ["Prices updated via Angel One"]
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
