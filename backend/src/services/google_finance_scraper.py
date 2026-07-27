"""Google Finance Scraper Service — Accurate real-time quotes from Google Finance."""
import requests
from bs4 import BeautifulSoup
import re

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9"
}

SYMBOL_MAP = {
    "NIFTY 50": "NIFTY_50:INDEXNSE",
    "NIFTY": "NIFTY_50:INDEXNSE",
    "BANK NIFTY": "NIFTY_BANK:INDEXNSE",
    "BANKNIFTY": "NIFTY_BANK:INDEXNSE",
    "SENSEX": "SENSEX:INDEXBOM",
    "INDIA VIX": "INDIA_VIX:INDEXNSE",
}

def get_google_finance_symbol(symbol: str) -> str:
    symbol_upper = symbol.upper().strip()
    if symbol_upper in SYMBOL_MAP:
        return SYMBOL_MAP[symbol_upper]
    if ":" not in symbol_upper:
        return f"{symbol_upper}:NSE"
    return symbol_upper

def fetch_quote(symbol: str) -> dict:
    """Fetch live quote for a given stock or index from Google Finance.
    
    Uses the following verified CSS class selectors (as of July 2026):
      - div.N6SYTe  => Main current price (inside parent div.ujg0He)
      - div.dO6ijd  => Stats row values: Previous Close, Open, High, Low, 52W High, 52W Low, etc.
      - span.ougHge => Positive % change (green)
      - span.ymyBi  => Negative % change (red)
    """
    gf_symbol = get_google_finance_symbol(symbol)
    url = f"https://www.google.com/finance/quote/{gf_symbol}"
    
    try:
        r = requests.get(url, headers=HEADERS, timeout=5)
        if r.status_code != 200:
            return _empty_quote(symbol)
            
        soup = BeautifulSoup(r.text, "html.parser")
        
        # ── 1. MAIN PRICE ──
        # The primary price is in a div with class 'N6SYTe' (inside parent 'ujg0He')
        price = 0.0
        price_div = soup.find("div", class_="N6SYTe")
        if price_div:
            price = _parse_number(price_div.text)
        
        # ── 2. PERCENTAGE CHANGE ──
        percent_change = 0.0
        is_up = True
        
        # Green (positive) change
        change_span = soup.find("span", class_="ougHge")
        if change_span:
            text = change_span.text.strip()
            if "%" in text:
                percent_change = _parse_number(text.replace("%", ""))
                is_up = True
        
        # Red (negative) change — check if this appears instead
        if percent_change == 0.0:
            change_span = soup.find("span", class_="ymyBi")
            if change_span:
                text = change_span.text.strip()
                if "%" in text:
                    percent_change = _parse_number(text.replace("%", ""))
                    is_up = False

        # ── 3. STATS (Open, High, Low, 52W High, 52W Low) ──
        stats = []
        for stat_div in soup.find_all("div", class_="dO6ijd"):
            val = _parse_number(stat_div.text)
            if val > 0:
                stats.append(val)
        
        # Google Finance stats order: Previous Close, Open, High, Low, 52W High, 52W Low, ...
        # (duplicated once for mobile/desktop, so first 6 are what we need)
        prev_close = stats[0] if len(stats) > 0 else price
        open_price = stats[0] if len(stats) > 0 else price
        high_price = stats[1] if len(stats) > 1 else price
        low_price  = stats[2] if len(stats) > 2 else price
        high_52w   = stats[3] if len(stats) > 3 else price
        low_52w    = stats[4] if len(stats) > 4 else price
        
        # Calculate net change from previous close
        net_change = round(price - prev_close, 2) if prev_close > 0 else 0.0
        if net_change != 0 and percent_change == 0:
            percent_change = round((net_change / prev_close) * 100, 2)
        
        return {
            "symbol": symbol,
            "ltp": price,
            "open": open_price,
            "high": high_price,
            "low": low_price,
            "high52": high_52w,
            "low52": low_52w,
            "prevClose": prev_close,
            "netChange": net_change,
            "percentChange": percent_change,
            "isUp": is_up
        }
    except Exception as e:
        print(f"Google Finance scraper error for {symbol}: {e}")
        return _empty_quote(symbol)

def _parse_number(text: str) -> float:
    """Clean and parse a number string like '₹1,281.00' or '+2.39%' into a float."""
    cleaned = text.strip()
    cleaned = cleaned.replace("₹", "").replace("$", "").replace(",", "").replace("+", "").replace("%", "").strip()
    try:
        return float(cleaned)
    except ValueError:
        return 0.0

def _empty_quote(symbol: str) -> dict:
    return {
        "symbol": symbol, "ltp": 0.0, "open": 0.0, "high": 0.0, "low": 0.0,
        "high52": 0.0, "low52": 0.0, "prevClose": 0.0,
        "netChange": 0.0, "percentChange": 0.0, "isUp": True
    }
