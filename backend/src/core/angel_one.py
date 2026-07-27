"""Angel One SmartAPI Core Service — Connection & Token Manager"""
import logging
import time
import pyotp
from SmartApi import SmartConnect
from src.core.config import settings

logger = logging.getLogger(__name__)


class AngelOneService:
    """Manages Angel One SmartAPI connection, authentication, and token mapping."""
    
    def __init__(self):
        self.api_key = settings.ANGEL_API_KEY
        self.client_code = settings.ANGEL_CLIENT_CODE
        self.pin = settings.ANGEL_PIN
        self.totp_secret = settings.ANGEL_TOTP_SECRET
        self.smart_api = None
        self.auth_token = None
        self.feed_token = None
        self.refresh_token = None
        self.last_login = 0
        self.session_valid = False
        
        # Popular instrument tokens (NSE)
        self.INSTRUMENT_TOKENS = {
            "NIFTY": "99926000", "BANKNIFTY": "99926009",
            "RELIANCE": "2885", "TCS": "11536", "HDFCBANK": "1333",
            "INFY": "1594", "ICICIBANK": "4963", "HINDUNILVR": "1394",
            "SBIN": "3045", "BHARTIARTL": "10604", "ITC": "1660",
            "KOTAKBANK": "1922", "LT": "11483", "AXISBANK": "5900",
            "BAJFINANCE": "317", "ASIANPAINT": "236", "MARUTI": "10999",
            "TITAN": "3506", "SUNPHARMA": "3351", "ULTRACEMCO": "11532",
            "WIPRO": "3787", "TATAMOTORS": "3456", "TATASTEEL": "3499",
            "HCLTECH": "7229", "POWERGRID": "14977", "NTPC": "11630",
            "ONGC": "2475", "JSWSTEEL": "11723", "ADANIENT": "25",
            "ADANIPORTS": "15083", "NESTLEIND": "17963", "M&M": "2031",
            "BAJAJFINSV": "16675", "TECHM": "13538", "COALINDIA": "20374",
            "DIVISLAB": "10940", "GRASIM": "1232", "BPCL": "526",
            "DRREDDY": "881", "EICHERMOT": "910", "CIPLA": "694",
            "APOLLOHOSP": "157", "HEROMOTOCO": "1348", "UPL": "11287",
            "TATACONSUM": "3432", "SBILIFE": "21808", "BRITANNIA": "547",
            "HINDALCO": "1363", "INDUSINDBK": "5258",
        }
    
    def _is_configured(self) -> bool:
        return all([self.api_key, self.client_code, self.pin, self.totp_secret])
    
    def login(self) -> bool:
        """Authenticate with Angel One SmartAPI using TOTP."""
        if not self._is_configured():
            logger.warning("Angel One credentials not configured — using mock data")
            return False
        
        # Don't re-login if session is less than 6 hours old
        if self.session_valid and (time.time() - self.last_login) < 21600:
            return True
        
        try:
            self.smart_api = SmartConnect(api_key=self.api_key)
            totp = pyotp.TOTP(self.totp_secret).now()
            
            data = self.smart_api.generateSession(
                clientCode=self.client_code,
                password=self.pin,
                totp=totp
            )
            
            if data.get("status"):
                self.auth_token = data["data"]["jwtToken"]
                self.refresh_token = data["data"]["refreshToken"]
                self.feed_token = self.smart_api.getfeedToken()
                self.last_login = time.time()
                self.session_valid = True
                logger.info("✅ Angel One SmartAPI login successful")
                return True
            else:
                logger.error(f"Angel One login failed: {data.get('message')}")
                self.session_valid = False
                return False
        except Exception as e:
            logger.error(f"Angel One login error: {e}")
            self.session_valid = False
            return False
    
    def get_ltp(self, exchange: str, symbol: str, token: str) -> dict | None:
        """Get Last Traded Price for a symbol."""
        if not self.login():
            return None
        try:
            data = self.smart_api.ltpData(exchange, symbol, token)
            if data.get("status"):
                return data["data"]
            return None
        except Exception as e:
            logger.error(f"LTP fetch error for {symbol}: {e}")
            return None
    
    def get_quote(self, exchange: str, symbol: str, token: str) -> dict | None:
        """Get full market quote."""
        if not self.login():
            return None
        try:
            params = {"exchange": exchange, "tradingsymbol": symbol, "symboltoken": token}
            data = self.smart_api.getMarketData(mode="FULL", exchangeTokens={exchange: [token]})
            if data.get("status") and data.get("data"):
                fetched = data["data"].get("fetched", [])
                return fetched[0] if fetched else None
            return None
        except Exception as e:
            logger.error(f"Quote fetch error for {symbol}: {e}")
            return None
    
    def get_historical(self, exchange: str, token: str, interval: str,
                       from_date: str, to_date: str) -> list | None:
        """Get historical candle data. interval: ONE_MINUTE, FIVE_MINUTE, 
        FIFTEEN_MINUTE, THIRTY_MINUTE, ONE_HOUR, ONE_DAY"""
        if not self.login():
            return None
        try:
            params = {
                "exchange": exchange,
                "symboltoken": token,
                "interval": interval,
                "fromdate": from_date,
                "todate": to_date,
            }
            data = self.smart_api.getCandleData(params)
            if data.get("status") and data.get("data"):
                return data["data"]
            return None
        except Exception as e:
            logger.error(f"Historical data error: {e}")
            return None
    
    def get_token(self, symbol: str) -> str | None:
        """Get instrument token for a symbol."""
        return self.INSTRUMENT_TOKENS.get(symbol.upper())
    
    def search_symbol(self, query: str) -> list[dict]:
        """Search for symbols matching query."""
        results = []
        q = query.upper()
        for symbol, token in self.INSTRUMENT_TOKENS.items():
            if q in symbol:
                results.append({"symbol": symbol, "token": token, "exchange": "NSE"})
        return results[:20]


# Singleton instance
angel_client = AngelOneService()
