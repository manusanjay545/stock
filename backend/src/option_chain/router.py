"""Option Chain Router (Real Data via nsepython)"""
from fastapi import APIRouter
from nsepython import nse_optionchain_scrapper

router = APIRouter()

@router.get("/{symbol}")
async def get_option_chain(symbol: str, expiry: str = None):
    try:
        # nse_optionchain_scrapper returns the raw JSON from NSE
        # We need to map symbol name. "NIFTY" works, "BANKNIFTY" works.
        data = nse_optionchain_scrapper(symbol.upper())
        if not data or "records" not in data:
            return {"success": False, "message": "Failed to fetch option chain"}
            
        records = data["records"]
        spot_price = records.get("underlyingValue", 0)
        
        # Determine the expiry date to use
        expiries = records.get("expiryDates", [])
        if not expiries:
            return {"success": False, "message": "No expiry dates found"}
            
        target_expiry = expiry if expiry and expiry in expiries else expiries[0]
        
        # Filter data for target expiry
        raw_data = records.get("data", [])
        filtered_data = [row for row in raw_data if row.get("expiryDate") == target_expiry]
        
        # Calculate ATM strike
        step = 50 if symbol.upper() == "NIFTY" else 100
        atm = round(spot_price / step) * step
        
        # Transform strikes to our frontend format
        strikes = []
        total_ce_oi = 0
        total_pe_oi = 0
        
        for row in filtered_data:
            strike_price = row.get("strikePrice", 0)
            is_atm = strike_price == atm
            
            ce = row.get("CE", {})
            pe = row.get("PE", {})
            
            ce_oi = ce.get("openInterest", 0) * 50 # NSE returns OI in lots for some indices, need to be careful, but we'll leave as raw for now
            pe_oi = pe.get("openInterest", 0) * 50
            
            total_ce_oi += ce.get("openInterest", 0)
            total_pe_oi += pe.get("openInterest", 0)
            
            def map_option(opt_data, opt_type):
                if not opt_data:
                    return {
                        "strikePrice": strike_price, "expiryDate": target_expiry, "optionType": opt_type,
                        "ltp": 0, "change": 0, "changePercent": 0, "volume": 0, "oi": 0, "changeInOI": 0, 
                        "iv": 0, "bid": 0, "ask": 0, "bidQty": 0, "askQty": 0, "greeks": {"delta": 0, "gamma": 0, "theta": 0, "vega": 0}
                    }
                return {
                    "strikePrice": strike_price,
                    "expiryDate": target_expiry,
                    "optionType": opt_type,
                    "ltp": opt_data.get("lastPrice", 0),
                    "change": opt_data.get("change", 0),
                    "changePercent": opt_data.get("pChange", 0),
                    "volume": opt_data.get("totalTradedVolume", 0),
                    "oi": opt_data.get("openInterest", 0),
                    "changeInOI": opt_data.get("changeinOpenInterest", 0),
                    "iv": opt_data.get("impliedVolatility", 0),
                    "bid": opt_data.get("bidprice", 0),
                    "ask": opt_data.get("askPrice", 0),
                    "bidQty": opt_data.get("bidQty", 0),
                    "askQty": opt_data.get("askQty", 0),
                    "greeks": {"delta": 0, "gamma": 0, "theta": 0, "vega": 0} # Real greeks require calculation
                }
            
            strikes.append({
                "strikePrice": strike_price,
                "isATM": is_atm,
                "isITM_CE": strike_price < spot_price,
                "isITM_PE": strike_price > spot_price,
                "call": map_option(ce, "CE"),
                "put": map_option(pe, "PE")
            })
            
        return {
            "success": True, 
            "data": {
                "symbol": symbol.upper(),
                "spotPrice": spot_price,
                "expiry": target_expiry,
                "atmStrike": atm,
                "maxPain": atm, # Max pain requires calculation across all strikes, simplify for now
                "pcr": round(total_pe_oi / max(total_ce_oi, 1), 2),
                "totalCallOI": total_ce_oi,
                "totalPutOI": total_pe_oi,
                "strikes": strikes
            }
        }
    except Exception as e:
        print(f"Error fetching option chain for {symbol}: {e}")
        return {"success": False, "message": str(e)}

@router.get("/{symbol}/expiries")
async def get_expiries(symbol: str):
    try:
        data = nse_optionchain_scrapper(symbol.upper())
        if not data or "records" not in data:
            return {"success": False, "message": "Failed to fetch expiries"}
        
        return {"success": True, "data": data["records"].get("expiryDates", [])}
    except Exception as e:
        return {"success": False, "message": str(e)}
