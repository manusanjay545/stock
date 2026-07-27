from src.services.google_finance_scraper import fetch_quote

for sym in ["RELIANCE", "TCS", "INFY", "HDFCBANK", "ITC"]:
    q = fetch_quote(sym)
    print(f"{sym}: LTP={q['ltp']}, Change={q['percentChange']}%, Open={q['open']}, High={q['high']}, Low={q['low']}")

for sym in ["NIFTY 50", "BANK NIFTY", "SENSEX"]:
    q = fetch_quote(sym)
    print(f"{sym}: LTP={q['ltp']}, Change={q['percentChange']}%, Open={q['open']}, High={q['high']}, Low={q['low']}")
