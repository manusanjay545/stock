import requests
from bs4 import BeautifulSoup
import logging
import re

logger = logging.getLogger(__name__)

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
}

def clean_value(val_str: str) -> float | str:
    """Clean a string value like '14,500 Cr.' to a float 14500"""
    try:
        # Remove commas, Rs, Cr, %, spaces
        cleaned = re.sub(r'[^\d.-]', '', val_str)
        if not cleaned:
            return 0.0
        return float(cleaned)
    except Exception:
        return val_str

def scrape_company_data(symbol: str) -> dict:
    """Scrape fundamental data from Screener.in"""
    url = f"https://www.screener.in/company/{symbol}/consolidated/"
    
    result = {
        "marketCap": 0.0,
        "currentPrice": 0.0,
        "high52": 0.0,
        "low52": 0.0,
        "pe": "N/A",
        "bookValue": "N/A",
        "dividendYield": "N/A",
        "roce": 0.0,
        "roe": 0.0,
        "faceValue": 0.0,
        "about": "Data fetched from Screener.in",
        "pros": [],
        "cons": [],
        "sector": "N/A"
    }
    
    try:
        response = requests.get(url, headers=HEADERS, timeout=10)
        # If consolidated not found, try standalone
        if response.status_code == 404:
            url = f"https://www.screener.in/company/{symbol}/"
            response = requests.get(url, headers=HEADERS, timeout=10)
            
        if response.status_code != 200:
            logger.warning(f"Failed to fetch {symbol} from Screener (Status: {response.status_code})")
            return result
            
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # 1. Parse Top Ratios
        ratios_ul = soup.find('ul', id='top-ratios')
        if ratios_ul:
            lis = ratios_ul.find_all('li')
            for li in lis:
                name_span = li.find('span', class_='name')
                value_span = li.find('span', class_='number')
                
                if not name_span or not value_span:
                    continue
                    
                name = name_span.text.strip().lower()
                value = clean_value(value_span.text.strip())
                
                if 'market cap' in name: result['marketCap'] = value
                elif 'current price' in name: result['currentPrice'] = value
                elif 'high / low' in name:
                    # Special case for high/low which is rendered differently
                    values = li.find_all('span', class_='number')
                    if len(values) >= 2:
                        result['high52'] = clean_value(values[0].text)
                        result['low52'] = clean_value(values[1].text)
                elif 'stock p/e' in name: result['pe'] = value
                elif 'book value' in name: result['bookValue'] = value
                elif 'dividend yield' in name: result['dividendYield'] = value
                elif 'roce' in name: result['roce'] = value
                elif 'roe' in name: result['roe'] = value
                elif 'face value' in name: result['faceValue'] = value
                
        # 2. Parse Sector
        peers_section = soup.find('section', id='peers')
        if peers_section:
            sector_links = peers_section.find_all('a', href=re.compile(r'/screens/\d+/'))
            if sector_links:
                result['sector'] = sector_links[-1].text.strip()
                
        # 3. Parse About
        about_div = soup.find('div', class_='company-profile')
        if about_div:
            about_p = about_div.find('div', class_='sub')
            if about_p:
                result['about'] = about_p.text.strip()
                
        # 4. Parse Pros & Cons
        analysis_section = soup.find('section', id='analysis')
        if analysis_section:
            pros_div = analysis_section.find('div', class_='pros')
            if pros_div:
                lis = pros_div.find_all('li')
                result['pros'] = [li.text.strip() for li in lis]
                
            cons_div = analysis_section.find('div', class_='cons')
            if cons_div:
                lis = cons_div.find_all('li')
                result['cons'] = [li.text.strip() for li in lis]
                
    except Exception as e:
        logger.error(f"Error parsing Screener.in for {symbol}: {e}")
        
    return result

def scrape_financial_quarters(symbol: str) -> dict:
    """Scrape quarterly results table from Screener.in"""
    url = f"https://www.screener.in/company/{symbol}/consolidated/"
    
    result = {
        "quarters": ["Q1", "Q2", "Q3", "Q4", "Q1"],
        "sales": [0,0,0,0,0],
        "expenses": [0,0,0,0,0],
        "operatingProfit": [0,0,0,0,0],
        "opm": [0,0,0,0,0],
        "netProfit": [0,0,0,0,0]
    }
    
    try:
        response = requests.get(url, headers=HEADERS, timeout=10)
        if response.status_code == 404:
            url = f"https://www.screener.in/company/{symbol}/"
            response = requests.get(url, headers=HEADERS, timeout=10)
            
        if response.status_code != 200:
            return result
            
        soup = BeautifulSoup(response.content, 'html.parser')
        quarters_section = soup.find('section', id='quarters')
        
        if quarters_section:
            table = quarters_section.find('table', class_='data-table')
            if table:
                # Get Headers (Quarters)
                thead = table.find('thead')
                if thead:
                    ths = thead.find_all('th')[1:] # Skip first 'Metric' header
                    result['quarters'] = [th.text.strip() for th in ths][-5:] # Get last 5
                    
                # Get Data Rows
                tbody = table.find('tbody')
                if tbody:
                    trs = tbody.find_all('tr')
                    for tr in trs:
                        tds = tr.find_all('td')
                        if not tds: continue
                        
                        metric = tds[0].text.strip().lower()
                        values = [clean_value(td.text.strip()) for td in tds[1:]][-5:] # Get last 5
                        
                        # Pad if less than 5
                        while len(values) < 5:
                            values.insert(0, 0.0)
                            
                        if 'sales' in metric and 'growth' not in metric: result['sales'] = values
                        elif 'expenses' in metric: result['expenses'] = values
                        elif 'operating profit' in metric: result['operatingProfit'] = values
                        elif 'opm %' in metric: result['opm'] = values
                        elif 'net profit' in metric: result['netProfit'] = values
                        
    except Exception as e:
        logger.error(f"Error parsing quarters for {symbol}: {e}")
        
    return result
