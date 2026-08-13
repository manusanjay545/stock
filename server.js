// ── Polyfill fetch for Node < 18 (Render compatibility) ──
const nodeFetch = (() => {
  try { return require('node-fetch'); } catch (e) { return null; }
})();
if (typeof globalThis.fetch === 'undefined' && nodeFetch) {
  globalThis.fetch = nodeFetch;
}

const express = require('express');
const cors = require('cors');
const path = require('path');
const { RSI } = require('technicalindicators');

// ── Groww API Credentials ──
const GROWW_API_KEY = process.env.GROWW_API_KEY || "eyJraWQiOiJaTUtjVXciLCJhbGciOiJFUzI1NiJ9.eyJleHAiOjI1NzUwMzYyNDQsImlhdCI6MTc4NjYzNjI0NCwibmJmIjoxNzg2NjM2MjQ0LCJzdWIiOiJ7XCJ0b2tlblJlZklkXCI6XCJiZTE1OWUxNS1hZGFhLTRkMWUtYjM2ZC01ODJmYzc3ZWVjNTRcIixcInZlbmRvckludGVncmF0aW9uS2V5XCI6XCJlMzFmZjIzYjA4NmI0MDZjODg3NGIyZjZkODQ5NTMxM1wiLFwidXNlckFjY291bnRJZFwiOlwiZTBhYzUxYmItMDA0YS00NDA0LTgxMDQtZDU3MDVmYzdiYmM0XCIsXCJkZXZpY2VJZFwiOlwiMDRhOWNkOGItZWJiMC01ZTc4LWI1MDYtMGVhOTdlOTY2MGI3XCIsXCJzZXNzaW9uSWRcIjpcIjlmYWRlNzJmLTJkZTYtNDE4NS04Zjk3LTgyOTdlYmVkNWEwMVwiLFwiYWRkaXRpb25hbERhdGFcIjpcIno1NC9NZzltdjE2WXdmb0gvS0EwYk9kenlyeGJiUHlWZFNUcjdhZ2tNY05STkczdTlLa2pWZDNoWjU1ZStNZERhWXBOVi9UOUxIRmtQejFFQisybTdRPT1cIixcInJvbGVcIjpcImF1dGgtdG90cFwiLFwic291cmNlSXBBZGRyZXNzXCI6XCIxMDMuMTMwLjIwNC4xNjQsMTcyLjcxLjE5OC44MCwzNS4yNDEuMjMuMTIzXCIsXCJ0d29GYUV4cGlyeVRzXCI6MjU3NTAzNjI0NDU5MCxcInZlbmRvck5hbWVcIjpcImdyb3d3QXBpXCJ9IiwiaXNzIjoiYXBleC1hdXRoLXByb2QtYXBwIn0.cjX2QNcSAapKSW4kopVIUdcVNrHlipBjdUpjeQm1RFr20vkc_5I4a_tvth27QZXMJvFej3a7vkjKEG2wK-uDlg";
const GROWW_SECRET = process.env.GROWW_SECRET || "oQq#TYjD@Uuj^!sKR!O8RiVL$s5_1tpq";
const GROWW_TOTP_SECRET = process.env.GROWW_TOTP_SECRET || "SQVIA6ERHA5QCORD4YILC6STS5WHKD7P";

const { TOTP, Secret } = require('otpauth');
let GROWW_ACCESS_TOKEN = null;
let GROWW_HEADERS = {
  'x-api-key': GROWW_SECRET,
  'X-API-VERSION': '1.0',
  'Accept': 'application/json, text/plain, */*',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Origin': 'https://groww.in',
  'Referer': 'https://groww.in/'
};

let authFailCount = 0;

async function authenticateGroww() {
  try {
    const totpCode = new TOTP({
      secret: Secret.fromBase32(GROWW_TOTP_SECRET),
      algorithm: 'SHA1',
      digits: 6,
      period: 30
    }).generate();

    console.log('🔑 Authenticating with Groww (TOTP generated)...');
    const authRes = await fetch('https://api.groww.in/v1/token/api/access', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + GROWW_API_KEY,
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      body: JSON.stringify({ totp: totpCode })
    });

    const responseText = await authRes.text();
    if (authRes.ok) {
      try {
        const data = JSON.parse(responseText);
        GROWW_ACCESS_TOKEN = data.token;
        GROWW_HEADERS['Authorization'] = `Bearer ${GROWW_ACCESS_TOKEN}`;
        authFailCount = 0;
        console.log('✅ Successfully acquired new Groww Access Token.');
        return true;
      } catch (e) {
        console.error('❌ Auth response not JSON:', responseText.substring(0, 200));
        return false;
      }
    } else {
      authFailCount++;
      console.error(`❌ Auth failed (${authRes.status}): ${responseText.substring(0, 300)}`);
      if (authFailCount >= 3) {
        console.error('❌ Auth failed 3 times in a row. Token may be expired or IP blocked.');
      }
      return false;
    }
  } catch (e) {
    authFailCount++;
    console.error('❌ Error authenticating with Groww:', e.message);
    return false;
  }
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// ── Health check endpoint (Render pings this) ──
app.get('/health', (req, res) => {
  res.json({ status: 'ok', stocks: Object.keys(historicalData).length, hasData: !!latestMarketData });
});

const USER_STOCKS = [
  'ASTRAL', 'SOLARINDS', 'CONCOR', 'APLAPOLLO', 'RADICO', 'GODREJCP', 'KALYANKJIL', 'AMBER', 'TATACONSUM', 'BDL', 'OBEROIRLTY', 'PAYTM', 'LODHA', 'TMPV', '360ONE', 'KPITTECH', 'TATAELXSI', 'PRESTIGE', 'DIXON', 'OIL', 'BLUESTARCO', 'COFORGE', 'NTPC', 'JUBLFOOD', 'HINDUNILVR', 'NAUKRI', 'SHRIRAMFIN', 'GLENMARK', 'LT', 'ETERNAL', 'BEL', 'MARICO', 'TCS', 'SUPREMEIND', 'PREMIERENE', 'NYKAA', 'SRF', 'PERSISTENT', 'TATAPOWER', 'IDFCFIRSTB', 'TECHM', 'NHPC', 'ITC', 'CDSL', 'KFINTECH', 'DMART', 'MAZDOCK', 'HINDPETRO', 'M&M', 'INDUSINDBK', 'WAAREEENER', 'INDIGO', 'FORTIS', 'GODREJPROP', 'PFC', 'IOC', 'EICHERMOT', 'PNBHOUSING', 'UNOMINDA', 'KEI', 'AUBANK', 'MAXHEALTH', 'BOSCHLTD', 'ASIANPAINT', 'SUZLON', 'CHOLAFIN', 'DRREDDY', 'KOTAKBANK', 'JSWSTEEL', 'PIIND', 'TORNTPHARM', 'HAVELLS', 'HDFCAMC', 'ONGC', 'PATANJALI', 'HCLTECH', 'ANGELONE', 'DLF', 'BHARATFORG', 'COALINDIA', 'POLICYBZR', 'BAJAJFINSV', 'MARUTI', 'HDFCLIFE', 'SWIGGY', 'RECLTD', 'INOXWIND', 'MPHASIS', 'CROMPTON', 'ICICIPRULI', 'IRFC', 'TRENT', 'SBIN', 'LAURUSLABS', 'POLYCAB', 'COCHINSHIP', 'IDEA', 'LTM', 'PGEL', 'APOLLOHOSP', 'BHEL', 'INDIANB', 'VBL', 'MCX', 'ABB', 'YESBANK', 'NESTLEIND', 'MUTHOOTFIN', 'JSWENERGY', 'VOLTAS', 'INDUSTOWER', 'BANDHANBNK', 'INFY', 'NBCC', 'HYUNDAI', 'CANBK', 'CGPOWER', 'JIOFIN', 'PETRONET', 'AUROPHARMA', 'MFSL', 'ASHOKLEY', 'UNIONBANK', 'CIPLA', 'DABUR', 'BHARTIARTL', 'BAJFINANCE', 'INDHOTEL', 'PIDILITIND', 'BAJAJ-AUTO', 'IREDA', 'PHOENIXLTD', 'IEX', 'DALBHARAT', 'AMBUJACEM', 'MOTILALOFS', 'UPL', 'ADANIPORTS', 'BANKINDIA', 'ADANIPOWER', 'ICICIGI', 'NAM-INDIA', 'WIPRO', 'COLPAL', 'BRITANNIA', 'HDFCBANK', 'ALKEM', 'CAMS', 'SONACOMS', 'LTF', 'SUNPHARMA', 'BPCL', 'RBLBANK', 'AXISBANK', 'BAJAJHLDNG', 'BSE', 'TITAN', 'DELHIVERY', 'ADANIENT', 'TATASTEEL', 'TVSMOTOR', 'HEROMOTOCO', 'ABCAPITAL', 'SIEMENS', 'RVNL', 'RELIANCE', 'CUMMINSIND', 'VMM', 'SBILIFE', 'ADANIENSOL', 'HAL', 'ADANIGREEN', 'NMDC', 'POWERGRID', 'HINDZINC', 'JINDALSTEL', 'GAIL', 'DIVISLAB', 'LICI', 'PNB', 'MANKIND', 'LICHSGFIN', 'MANAPPURAM', 'BANKBARODA', 'POWERINDIA', 'FEDERALBNK', 'MOTHERSON', 'SHREECEM', 'UNITDSPR', 'LUPIN', 'GMRAIRPORT', 'GRASIM', 'ULTRACEMCO', 'VEDL', 'BIOCON', 'ICICIBANK', 'KAYNES', 'GODFRYPHLP', 'TIINDIA', 'OFSS', 'GVT&D', 'SBICARD', 'HINDALCO', 'SAIL', 'ZYDUSLIFE', 'FORCEMOT', 'NATIONALUM', 'PAGEIND'
];
const FNO_STOCKS = [...new Set(USER_STOCKS)];

const SECTOR_MAP = {
  "IT": ["TCS", "INFY", "WIPRO", "HCLTECH", "TECHM", "LTIM", "LTM", "COFORGE", "PERSISTENT", "MPHASIS", "TATAELXSI", "KPITTECH", "OFSS", "TMPV"],
  "Financial Services": ["HDFCBANK", "ICICIBANK", "SBIN", "AXISBANK", "KOTAKBANK", "INDUSINDBK", "BANKBARODA", "PNB", "CANBK", "UNIONBANK", "BANKINDIA", "INDIANB", "FEDERALBNK", "IDFCFIRSTB", "AUBANK", "BANDHANBNK", "YESBANK", "RBLBANK", "BAJFINANCE", "BAJAJFINSV", "CHOLAFIN", "SHRIRAMFIN", "MUTHOOTFIN", "MANAPPURAM", "PFC", "RECLTD", "IRFC", "IREDA", "JIOFIN", "HDFCAMC", "NAM-INDIA", "CAMS", "KFINTECH", "CDSL", "BSE", "MCX", "ANGELONE", "MOTILALOFS", "360ONE", "PAYTM", "POLICYBZR", "SBICARD", "ABCAPITAL", "LTF", "BAJAJHLDNG", "MFSL", "HDFCLIFE", "SBILIFE", "ICICIPRULI", "ICICIGI", "LICI", "LICHSGFIN", "PNBHOUSING"],
  "FMCG": ["ITC", "HINDUNILVR", "NESTLEIND", "BRITANNIA", "TATACONSUM", "DABUR", "GODREJCP", "MARICO", "COLPAL", "VBL", "VARUNBEV", "RADICO", "UNITDSPR", "PATANJALI", "GODFRYPHLP"],
  "Automobile": ["MARUTI", "M&M", "TATAMOTORS", "BAJAJ-AUTO", "HEROMOTOCO", "EICHERMOT", "TVSMOTOR", "ASHOKLEY", "HYUNDAI", "FORCEMOT", "BOSCHLTD", "MOTHERSON", "SONACOMS", "BHARATFORG", "APOLLOTYRE", "UNOMINDA"],
  "Pharma & Healthcare": ["SUNPHARMA", "CIPLA", "DRREDDY", "DIVISLAB", "APOLLOHOSP", "MAXHEALTH", "FORTIS", "LUPIN", "AUROPHARMA", "ZYDUSLIFE", "TORNTPHARM", "GLENMARK", "BIOCON", "ALKEM", "LAURUSLABS", "MANKIND", "SYNGENE"],
  "Oil & Gas": ["RELIANCE", "ONGC", "OIL", "IOC", "BPCL", "HINDPETRO", "GAIL", "PETRONET", "IGL", "MGL", "GUJGASLTD", "CASTROLIND"],
  "Metals & Mining": ["TATASTEEL", "JSWSTEEL", "HINDALCO", "COALINDIA", "VEDL", "NMDC", "SAIL", "NATIONALUM", "HINDZINC", "JINDALSTEL"],
  "Power & Energy": ["NTPC", "POWERGRID", "TATAPOWER", "ADANIPOWER", "JSWENERGY", "ADANIGREEN", "SUZLON", "INOXWIND", "WAAREEENER", "PREMIERENE", "NHPC", "ADANIENSOL"],
  "Consumer Durables": ["ASIANPAINT", "BERGEPAINT", "TITAN", "DIXON", "HAVELLS", "VOLTAS", "CROMPTON", "BLUESTARCO", "AMBER", "KALYANKJIL", "PGEL"],
  "Construction & Real Estate": ["LT", "DLF", "LODHA", "GODREJPROP", "OBEROIRLTY", "PRESTIGE", "PHOENIXLTD", "NBCC"],
  "Chemicals": ["SRF", "PIIND", "UPL", "ETERNAL", "SOLARINDS"],
  "Capital Goods & Defense": ["HAL", "BEL", "BDL", "MAZDOCK", "COCHINSHIP", "BHEL", "ABB", "SIEMENS", "CGPOWER", "CUMMINSIND", "RVNL", "GVT&D", "POWERINDIA", "KAYNES", "TIINDIA"],
  "Building Materials": ["ULTRACEMCO", "GRASIM", "AMBUJACEM", "SHREECEM", "DALBHARAT", "ASTRAL", "SUPREMEIND", "APLAPOLLO", "POLYCAB", "KEI"],
  "Services (Retail, Logistics, Telecom)": ["BHARTIARTL", "IDEA", "INDUSTOWER", "TRENT", "DMART", "ZOMATO", "SWIGGY", "NYKAA", "JUBLFOOD", "INDIGO", "CONCOR", "DELHIVERY", "NAUKRI", "INDHOTEL", "ADANIPORTS", "GMRAIRPORT", "IEX", "ADANIENT", "VMM", "PAGEIND"]
};

const SECTOR_LOOKUP = {};
for (const [sector, stocks] of Object.entries(SECTOR_MAP)) {
  for (const stock of stocks) {
    SECTOR_LOOKUP[stock] = sector;
  }
}

const NIFTY_50_STOCKS = new Set([
  'ADANIENT', 'ADANIPORTS', 'APOLLOHOSP', 'ASIANPAINT', 'AXISBANK', 'BAJAJ-AUTO', 'BAJFINANCE', 'BAJAJFINSV', 'BPCL', 'BHARTIARTL', 'BRITANNIA', 'CIPLA', 'COALINDIA', 'DIVISLAB', 'DRREDDY', 'EICHERMOT', 'GRASIM', 'HCLTECH', 'HDFCBANK', 'HDFCLIFE', 'HEROMOTOCO', 'HINDALCO', 'HINDUNILVR', 'ICICIBANK', 'INDUSINDBK', 'INFY', 'ITC', 'JSWSTEEL', 'KOTAKBANK', 'LT', 'LTIM', 'M&M', 'MARUTI', 'NESTLEIND', 'NTPC', 'ONGC', 'POWERGRID', 'RELIANCE', 'SBILIFE', 'SBIN', 'SUNPHARMA', 'TATAMOTORS', 'TATASTEEL', 'TCS', 'TATACONSUM', 'TECHM', 'TITAN', 'ULTRACEMCO', 'WIPRO', 'SHRIRAMFIN'
]);

let historicalData = {};
let latestMarketData = null;
let lastUpdate = 0;
let initStatus = 'pending'; // pending | loading | ready | error

// ── Helper: safe fetch with timeout and retry ──
async function safeFetch(url, options = {}, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeout);

      if (response.status === 401 || response.status === 403) {
        console.warn(`🔄 Got ${response.status}, re-authenticating...`);
        await authenticateGroww();
        continue; // retry with new token
      }
      if (response.status === 429) {
        const waitMs = (attempt + 1) * 2000;
        console.warn(`⏳ Rate limited (429). Waiting ${waitMs}ms...`);
        await new Promise(r => setTimeout(r, waitMs));
        continue;
      }
      return response;
    } catch (err) {
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 1000));
        continue;
      }
      return null;
    }
  }
  return null;
}

// ── Groww API: Fetch historical candle data for a single symbol ──
async function fetchGrowwHistory(symbol) {
  try {
    const endTime = new Date();
    const startTime = new Date();
    startTime.setDate(startTime.getDate() - 30);

    const fmt = (d) => d.toISOString().replace('T', ' ').substring(0, 19);
    const url = `https://api.groww.in/v1/historical/candle/range?exchange=NSE&segment=CASH&trading_symbol=${encodeURIComponent(symbol)}&start_time=${encodeURIComponent(fmt(startTime))}&end_time=${encodeURIComponent(fmt(endTime))}&interval_in_minutes=1440`;

    const response = await safeFetch(url, { headers: GROWW_HEADERS });

    if (!response || !response.ok) {
      // Try alternate endpoint
      const url2 = `https://api.groww.in/v1/historical/candle?exchange=NSE&segment=CASH&trading_symbol=${encodeURIComponent(symbol)}&start_time=${startTime.getTime()}&end_time=${endTime.getTime()}&interval_in_minutes=1440`;
      const response2 = await safeFetch(url2, { headers: GROWW_HEADERS });
      if (!response2 || !response2.ok) {
        console.warn(`  ⚠ History failed for ${symbol}: ${response ? response.status : 'timeout'}`);
        return;
      }
      const data2 = await response2.json();
      processHistoricalData(symbol, data2);
      return;
    }

    const data = await response.json();
    processHistoricalData(symbol, data);
  } catch (error) {
    console.error(`  ✗ History error for ${symbol}:`, error.message);
  }
}

// Parse historical candle response from Groww
function processHistoricalData(symbol, data) {
  try {
    let candles = data.candles || data.data || data.historicalData || [];

    if (!Array.isArray(candles) || candles.length === 0) {
      // Try nested payload format
      if (data.payload && data.payload.candles) {
        candles = data.payload.candles;
      } else if (data.payload && Array.isArray(data.payload)) {
        candles = data.payload;
      }
    }

    if (Array.isArray(candles) && candles.length > 0) {
      const parsed = candles.map(c => {
        if (Array.isArray(c)) {
          return { open: c[1], high: c[2], low: c[3], close: c[4] };
        }
        return { open: c.open, high: c.high, low: c.low, close: c.close };
      });

      const closes = parsed.map(c => c.close).filter(v => v != null);
      const prevDay = parsed.length >= 2 ? parsed[parsed.length - 2] : parsed[0];

      historicalData[symbol] = {
        closes,
        yesterdayHigh: prevDay.high || 0,
        yesterdayLow: prevDay.low || 0
      };
      console.log(`  ✓ ${symbol}: ${closes.length} candles, yHigh=${prevDay.high}, yLow=${prevDay.low}`);
    } else {
      console.warn(`  ⚠ ${symbol}: No candle data in response`);
    }
  } catch (e) {
    console.error(`  ✗ Parse error for ${symbol}:`, e.message);
  }
}

// ── Initialize history for all F&O stocks ──
async function initializeHistory() {
  console.log("\n📈 Fetching historical data from Groww API...");
  initStatus = 'loading';

  // Fetch in chunks of 5 with 1s delay
  for (let i = 0; i < FNO_STOCKS.length; i += 5) {
    const chunk = FNO_STOCKS.slice(i, i + 5);
    await Promise.all(chunk.map(symbol => fetchGrowwHistory(symbol)));
    await new Promise(r => setTimeout(r, 1000));
  }

  const loadedCount = Object.keys(historicalData).length;
  console.log(`✅ Historical data initialized: ${loadedCount}/${FNO_STOCKS.length} stocks loaded.\n`);
  initStatus = loadedCount > 0 ? 'ready' : 'error';
}

// ── Groww API: Fetch single live quote ──
async function fetchGrowwQuote(symbol) {
  const url = `https://api.groww.in/v1/live-data/quote?exchange=NSE&segment=CASH&trading_symbol=${encodeURIComponent(symbol)}`;
  try {
    const response = await safeFetch(url, { headers: GROWW_HEADERS }, 1);
    if (!response || !response.ok) return null;
    const data = await response.json();
    if (data.status === 'FAILURE') return null;
    return { symbol, data: data.payload || data.data || data };
  } catch (err) {
    return null;
  }
}

// ── Poll live quotes from Groww every cycle ──
async function pollLiveQuotes() {
  try {
    // Re-authenticate if no token
    if (!GROWW_ACCESS_TOKEN) {
      console.log('🔄 No access token, re-authenticating before poll...');
      await authenticateGroww();
    }

    const growwResults = [];
    const chunkSize = 5;

    for (let i = 0; i < FNO_STOCKS.length; i += chunkSize) {
      const chunk = FNO_STOCKS.slice(i, i + chunkSize);
      const chunkPromises = chunk.map(sym => fetchGrowwQuote(sym));
      const chunkRes = await Promise.all(chunkPromises);
      growwResults.push(...chunkRes.filter(r => r !== null && r.data));
      await new Promise(r => setTimeout(r, 1000));
    }

    if (growwResults.length === 0) {
      console.warn("⚠ Groww API returned no data this cycle. Re-authenticating...");
      await authenticateGroww();
      return;
    }

    console.log(`📊 Received live quotes for ${growwResults.length}/${FNO_STOCKS.length} stocks`);

    const allStocks = growwResults.map(item => {
      const symbol = item.symbol;
      const quote = item.data;

      const ltp = quote.last_price || quote.ltp || quote.lastPrice || 0;
      const ohlc = quote.ohlc || {};
      const open = ohlc.open || quote.open || quote.open_price || 0;
      const high = ohlc.high || quote.high || quote.high_price || 0;
      const low = ohlc.low || quote.low || quote.low_price || 0;
      const previousClose = ohlc.close || quote.close || quote.prev_close || quote.previousClose || 0;
      const change = quote.day_change != null ? quote.day_change : (ltp - previousClose);
      const changePercent = quote.day_change_perc != null ? quote.day_change_perc : (previousClose ? (change / previousClose) * 100 : 0);

      // Calculate RSI from historical closes + current LTP
      let rsiVal = null;
      if (historicalData[symbol] && historicalData[symbol].closes.length >= 14) {
        const closes = [...historicalData[symbol].closes, ltp];
        const rsiResult = RSI.calculate({ values: closes, period: 14 });
        if (rsiResult.length > 0) {
          rsiVal = rsiResult[rsiResult.length - 1];
        }
      }

      return {
        symbol,
        ltp,
        open,
        high,
        low,
        close: previousClose,
        change,
        changePercent,
        rsi: rsiVal ? parseFloat(rsiVal.toFixed(2)) : null,
        yesterdayHigh: historicalData[symbol] ? historicalData[symbol].yesterdayHigh : 0,
        yesterdayLow: historicalData[symbol] ? historicalData[symbol].yesterdayLow : 0,
        sector: SECTOR_LOOKUP[symbol] || "Others",
        isNifty50: NIFTY_50_STOCKS.has(symbol)
      };
    });

    // 1. Sort all by percent change
    const sortedByChange = [...allStocks].sort((a, b) => b.changePercent - a.changePercent);

    // 2. Filter Gainers: LTP crossed above yesterday's high AND RSI >= 70
    const gainers = sortedByChange
      .filter(s => s.ltp > s.yesterdayHigh && s.yesterdayHigh > 0 && s.rsi !== null && s.rsi >= 70)
      .slice(0, 15);

    // 3. Filter Losers: LTP crossed below yesterday's low AND RSI <= 30
    const losers = sortedByChange
      .filter(s => s.ltp < s.yesterdayLow && s.yesterdayLow > 0 && s.rsi !== null && s.rsi <= 30)
      .reverse()
      .slice(0, 15);

    // 4. All RSI > 70 for the RSI tab
    const rsiAbove70 = allStocks
      .filter(s => s.rsi !== null && s.rsi >= 70)
      .sort((a, b) => b.rsi - a.rsi);

    // 5. All RSI < 30
    const rsiBelow30 = allStocks
      .filter(s => s.rsi !== null && s.rsi <= 30)
      .sort((a, b) => a.rsi - b.rsi);

    latestMarketData = {
      gainers,
      losers,
      rsiAbove70,
      rsiBelow30,
      allStocks: sortedByChange,
      lastUpdated: new Date().toISOString(),
      totalStocks: allStocks.length
    };

    lastUpdate = Date.now();
  } catch (err) {
    console.error("Error polling Groww quotes:", err.message);
  }
}

// ── API Endpoints ──
app.get('/api/market-data', (req, res) => {
  if (!latestMarketData) {
    return res.status(503).json({
      error: "Data is still initializing. Please wait.",
      status: initStatus,
      historicalLoaded: Object.keys(historicalData).length,
      totalStocks: FNO_STOCKS.length
    });
  }
  res.json(latestMarketData);
});

app.get('/api/refresh', (req, res) => {
  initializeHistory();
  res.json({ message: 'History refresh initiated via Groww API' });
});

app.get('/api/status', (req, res) => {
  res.json({
    initStatus,
    historicalLoaded: Object.keys(historicalData).length,
    totalStocks: FNO_STOCKS.length,
    hasLiveData: !!latestMarketData,
    lastUpdate: lastUpdate ? new Date(lastUpdate).toISOString() : null,
    authenticated: !!GROWW_ACCESS_TOKEN
  });
});

// ── Start Server ──
// IMPORTANT: Start listening FIRST, then load data in background.
// This prevents Render health check timeouts.
const server = app.listen(PORT, () => {
  console.log(`\n🚀 Market Scanner running at http://localhost:${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}`);
  console.log(`🔌 API: http://localhost:${PORT}/api/market-data`);
  console.log(`❤️  Health: http://localhost:${PORT}/health`);
  console.log(`📡 Data Source: Groww API (100%)\n`);
});

// Load data in background AFTER server is listening
async function startDataPipeline() {
  // Authenticate first
  const authOk = await authenticateGroww();
  if (!authOk) {
    console.log('⏳ Auth failed, retrying in 5 seconds...');
    await new Promise(r => setTimeout(r, 5000));
    await authenticateGroww();
  }

  // Refresh token every 4 hours (more aggressive than 12h for Render)
  setInterval(authenticateGroww, 4 * 60 * 60 * 1000);

  await initializeHistory();

  // Start first poll immediately
  await pollLiveQuotes();

  // Poll live quotes every 90 seconds
  setInterval(pollLiveQuotes, 90000);
}

// Start the data pipeline after a tiny delay so the server is fully ready
setTimeout(startDataPipeline, 500);
