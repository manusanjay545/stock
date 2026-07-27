import requests
from bs4 import BeautifulSoup
import re

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9"
}

r = requests.get("https://www.google.com/finance/quote/RELIANCE:NSE", headers=headers)
soup = BeautifulSoup(r.text, "html.parser")

for el in soup.find_all(["div", "span"]):
    txt = el.text.strip()
    if re.match(r"^₹?\s?[0-9,]+\.[0-9]{2}$", txt) and len(el.find_all()) == 0:
        clean_txt = txt.encode("ascii", "ignore").decode("ascii")
        print(f"Tag: {el.name} | Class: {el.get('class')} | Parent Class: {el.parent.get('class')} | Text: '{clean_txt}'")
