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

// ── Google Gen AI Setup ──
let aiClient = null;
try {
  const { GoogleGenAI } = require('@google/genai');
  if (process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    console.log('🤖 MarketPulse AI (Gemini) enabled.');
  } else {
    console.log('🤖 MarketPulse AI: No GEMINI_API_KEY found. Running in mock mode.');
  }
} catch (e) {
  console.log('🤖 MarketPulse AI: @google/genai not installed or failed to load. Running in mock mode.');
}

// ── Groww API Credentials ──
const GROWW_API_KEY = process.env.GROWW_API_KEY || "eyJraWQiOiJaTUtjVXciLCJhbGciOiJFUzI1NiJ9.eyJleHAiOjI1NzY5MDE4MjAsImlhdCI6MTc4ODUwMTgyMCwibmJmIjoxNzg4NTAxODIwLCJzdWIiOiJ7XCJ0b2tlblJlZklkXCI6XCIyM2E3MzNiMi04MmZhLTQ5ZWYtODAwYi0wMmMzMTA4M2EyNjJcIixcInZlbmRvckludGVncmF0aW9uS2V5XCI6XCJlMzFmZjIzYjA4NmI0MDZjODg3NGIyZjZkODQ5NTMxM1wiLFwidXNlckFjY291bnRJZFwiOlwiZTBhYzUxYmItMDA0YS00NDA0LTgxMDQtZDU3MDVmYzdiYmM0XCIsXCJkZXZpY2VJZFwiOlwiMDRhOWNkOGItZWJiMC01ZTc4LWI1MDYtMGVhOTdlOTY2MGI3XCIsXCJzZXNzaW9uSWRcIjpcImZiNDk3N2I3LWNiZDUtNDczMi1hNTg3LTE1YjU2ZDNjNzFiZFwiLFwiYWRkaXRpb25hbERhdGFcIjpcIno1NC9NZzltdjE2WXdmb0gvS0EwYk9kenlyeGJiUHlWZFNUcjdhZ2tNY05STkczdTlLa2pWZDNoWjU1ZStNZERhWXBOVi9UOUxIRmtQejFFQisybTdRPT1cIixcInJvbGVcIjpcImF1dGgtdG90cFwiLFwic291cmNlSXBBZGRyZXNzXCI6XCIxMDMuMTg2LjE1MS4xMjIsMTcyLjcwLjIxOC4xMDYsMzUuMjQxLjIzLjEyM1wiLFwidHdvRmFFeHBpcnlUc1wiOjI1NzY5MDE4MjA2MzcsXCJ2ZW5kb3JOYW1lXCI6XCJncm93d0FwaVwifSIsImlzcyI6ImFwZXgtYXV0aC1wcm9kLWFwcCJ9.pIa7sZFIl6MpFknj9pGAww4XXkNjesyVnJLr19WA39d21l-0sOCqpDOiwRRrMjWA2OlZ0D7TuIElY3R-FSwyvg";
const GROWW_SECRET = process.env.GROWW_SECRET || "oQq#TYjD@Uuj^!sKR!O8RiVL$s5_1tpq";
const GROWW_TOTP_SECRET = process.env.GROWW_TOTP_SECRET || "T2DYKTC2U5Z7FHG2O4BEERT4EN4R6IK2";

const { TOTP, Secret } = require('otpauth');
let GROWW_ACCESS_TOKEN = null;
let GROWW_HEADERS = {
  'x-api-key': GROWW_SECRET,
  'X-API-VERSION': '1.0',
  'Accept': 'application/json, text/plain, */*',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Origin': 'https://groww.in',
  'Referer': 'https://groww.in/'
};

let authFailCount = 0;

async function authenticateGroww() {
  try {
    const totpCode = new TOTP({
      secret: Secret.fromBase32(GROWW_TOTP_SECRET),
      algorithm: 'SHA1', digits: 6, period: 30
    }).generate();
    console.log('🔑 Authenticating with Groww...');
    const authRes = await fetch('https://api.groww.in/v1/token/api/access', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + GROWW_API_KEY,
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0'
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
        console.log('✅ Groww token acquired.');
        return true;
      } catch (e) { return false; }
    } else {
      authFailCount++;
      console.error(`❌ Auth failed (${authRes.status})`);
      return false;
    }
  } catch (e) {
    authFailCount++;
    console.error('❌ Auth error:', e.message);
    return false;
  }
}

// ── Express App ──
const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── Stock Universe: Top 20 Nifty 50 (keeps API calls minimal) ──
const ALL_SYMBOLS = [
  'RELIANCE','TCS','HDFCBANK','ICICIBANK','INFY',
  'BHARTIARTL','SBIN','ITC','BAJFINANCE','HINDUNILVR',
  'LT','KOTAKBANK','AXISBANK','MARUTI','SUNPHARMA',
  'TITAN','WIPRO','HCLTECH','TATASTEEL','M&M'
];
const SYMBOLS = [...new Set(ALL_SYMBOLS)];

const SECTOR_MAP = {
  "IT": ["TCS","INFY","WIPRO","HCLTECH"],
  "Banking & Finance": ["HDFCBANK","ICICIBANK","SBIN","BAJFINANCE","KOTAKBANK","AXISBANK"],
  "FMCG": ["ITC","HINDUNILVR"],
  "Auto": ["MARUTI","M&M"],
  "Pharma": ["SUNPHARMA"],
  "Energy": ["RELIANCE"],
  "Metals": ["TATASTEEL"],
  "Infra": ["LT"],
  "Consumer": ["TITAN"],
  "Services": ["BHARTIARTL"]
};

const SECTOR_LOOKUP = {};
for (const [sector, stocks] of Object.entries(SECTOR_MAP)) {
  for (const s of stocks) SECTOR_LOOKUP[s] = sector;
}

const NIFTY50 = new Set(ALL_SYMBOLS);


// ── Data stores ──
let historicalData = {};
let latestMarketData = null;
let lastUpdate = 0;
let initStatus = 'pending';

// ── Rate limit tracking ──
let rateLimitCooldown = 0; // timestamp until which we should not make requests
let consecutiveRateLimits = 0;

// ── Safe fetch with exponential backoff ──
async function safeFetch(url, options = {}, retries = 1) {
  // Respect global cooldown
  const now = Date.now();
  if (now < rateLimitCooldown) {
    const wait = rateLimitCooldown - now;
    console.log(`⏸️  Cooling down for ${(wait/1000).toFixed(0)}s...`);
    await new Promise(r => setTimeout(r, wait));
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeout);
      if (response.status === 401 || response.status === 403) {
        await authenticateGroww(); continue;
      }
      if (response.status === 429) {
        consecutiveRateLimits++;
        // Exponential backoff: 5s, 10s, 20s, 30s max
        const backoff = Math.min(5000 * Math.pow(2, consecutiveRateLimits - 1), 30000);
        console.warn(`⏳ Rate limited (429). Backing off ${(backoff/1000).toFixed(0)}s (streak: ${consecutiveRateLimits})`);
        rateLimitCooldown = Date.now() + backoff;
        await new Promise(r => setTimeout(r, backoff));
        continue;
      }
      // Successful request - reset streak
      if (consecutiveRateLimits > 0) consecutiveRateLimits = Math.max(0, consecutiveRateLimits - 1);
      return response;
    } catch (err) {
      if (attempt < retries) { await new Promise(r => setTimeout(r, 2000)); continue; }
      return null;
    }
  }
  return null;
}

// ── Historical data ──
async function fetchHistory(symbol) {
  try {
    const end = new Date(), start = new Date();
    start.setDate(start.getDate() - 30);
    const fmt = d => d.toISOString().replace('T', ' ').substring(0, 19);
    const url = `https://api.groww.in/v1/historical/candle/range?exchange=NSE&segment=CASH&trading_symbol=${encodeURIComponent(symbol)}&start_time=${encodeURIComponent(fmt(start))}&end_time=${encodeURIComponent(fmt(end))}&interval_in_minutes=1440`;
    const res = await safeFetch(url, { headers: GROWW_HEADERS });
    if (!res || !res.ok) return;
    const data = await res.json();
    let candles = data.candles || data.data || data.historicalData || [];
    if ((!Array.isArray(candles) || !candles.length) && data.payload) {
      candles = data.payload.candles || (Array.isArray(data.payload) ? data.payload : []);
    }
    if (Array.isArray(candles) && candles.length) {
      const parsed = candles.map(c => Array.isArray(c) ? { open:c[1], high:c[2], low:c[3], close:c[4] } : c);
      const closes = parsed.map(c => c.close).filter(v => v != null);
      const prev = parsed.length >= 2 ? parsed[parsed.length - 2] : parsed[0];
      historicalData[symbol] = { closes, yesterdayHigh: prev.high||0, yesterdayLow: prev.low||0 };
    }
  } catch (e) { /* skip */ }
}

async function initializeHistory() {
  console.log("📈 Loading historical data (chunks of 3, 3s delay)...");
  initStatus = 'loading';
  for (let i = 0; i < SYMBOLS.length; i += 3) {
    const chunk = SYMBOLS.slice(i, i + 3);
    await Promise.all(chunk.map(s => fetchHistory(s)));
    // Longer delay between chunks to respect rate limits
    await new Promise(r => setTimeout(r, 3000));
  }
  initStatus = Object.keys(historicalData).length > 0 ? 'ready' : 'error';
  console.log(`✅ Historical: ${Object.keys(historicalData).length}/${SYMBOLS.length} loaded`);
}

// ── Live quotes ──
async function fetchQuote(symbol) {
  const url = `https://api.groww.in/v1/live-data/quote?exchange=NSE&segment=CASH&trading_symbol=${encodeURIComponent(symbol)}`;
  try {
    const res = await safeFetch(url, { headers: GROWW_HEADERS }, 1);
    if (!res || !res.ok) return null;
    const data = await res.json();
    if (data.status === 'FAILURE') return null;
    return { symbol, data: data.payload || data.data || data };
  } catch { return null; }
}

function buildStock(symbol, quote) {
  const ltp = quote.last_price || quote.ltp || quote.lastPrice || 0;
  const ohlc = quote.ohlc || {};
  const open = ohlc.open || quote.open || 0;
  const high = ohlc.high || quote.high || 0;
  const low = ohlc.low || quote.low || 0;
  const prevClose = ohlc.close || quote.close || quote.prev_close || quote.previousClose || 0;
  const change = quote.day_change != null ? quote.day_change : (ltp - prevClose);
  const changePct = quote.day_change_perc != null ? quote.day_change_perc : (prevClose ? (change / prevClose) * 100 : 0);
  let rsi = null;
  if (historicalData[symbol] && historicalData[symbol].closes.length >= 14) {
    const vals = [...historicalData[symbol].closes, ltp];
    const r = RSI.calculate({ values: vals, period: 14 });
    if (r.length) rsi = parseFloat(r[r.length - 1].toFixed(2));
  }
  return {
    symbol, ltp, open, high, low, close: prevClose, change, changePct, rsi,
    yHigh: historicalData[symbol]?.yesterdayHigh || 0,
    yLow: historicalData[symbol]?.yesterdayLow || 0,
    sector: SECTOR_LOOKUP[symbol] || 'Others',
    nifty50: NIFTY50.has(symbol)
  };
}

let isFetching = false;
async function pollQuotes() {
  if (isFetching) return;
  isFetching = true;
  try {
    if (!GROWW_ACCESS_TOKEN) await authenticateGroww();
    const results = [];
    const CHUNK = 3; // Smaller chunks = fewer parallel requests
    const DELAY = 3000; // 3s between chunks
    const totalChunks = Math.ceil(SYMBOLS.length / CHUNK);
    console.log(`📡 Fetching quotes: ${SYMBOLS.length} stocks in chunks of ${CHUNK} (${totalChunks} chunks, ${DELAY/1000}s delay)...`);

    for (let i = 0; i < SYMBOLS.length; i += CHUNK) {
      const chunk = SYMBOLS.slice(i, i + CHUNK);
      const res = await Promise.all(chunk.map(s => fetchQuote(s)));
      results.push(...res.filter(r => r?.data));

      // Skip delay after last chunk
      if (i + CHUNK < SYMBOLS.length) {
        await new Promise(r => setTimeout(r, DELAY));
      }
    }
    if (!results.length) { await authenticateGroww(); return; }
    const allStocks = results.map(r => buildStock(r.symbol, r.data));
    allStocks.sort((a, b) => b.changePct - a.changePct);
    latestMarketData = { allStocks, lastUpdated: new Date().toISOString(), total: allStocks.length };
    lastUpdate = Date.now();
    console.log(`🔄 Updated: ${allStocks.length} stocks (rate limit streak: ${consecutiveRateLimits})`);
  } catch (e) { console.error('Poll error:', e.message); }
  finally { isFetching = false; }
}

// ═══════ API Routes ═══════

app.get('/health', (req, res) => res.json({ status: 'ok', stocks: Object.keys(historicalData).length }));

// Search symbols
app.get('/api/search', (req, res) => {
  const q = (req.query.q || '').toUpperCase().trim();
  if (!q) return res.json([]);
  const prefix = [], contains = [];
  for (const s of SYMBOLS) {
    if (s.startsWith(q)) prefix.push(s);
    else if (s.includes(q)) contains.push(s);
  }
  const matched = [...prefix, ...contains].slice(0, 15).map(symbol => {
    const base = { symbol, sector: SECTOR_LOOKUP[symbol] || 'Others', nifty50: NIFTY50.has(symbol) };
    if (latestMarketData) {
      const live = latestMarketData.allStocks.find(s => s.symbol === symbol);
      if (live) { base.ltp = live.ltp; base.changePct = live.changePct; base.rsi = live.rsi; }
    }
    return base;
  });
  res.json(matched);
});

// Batch quotes for a watchlist
app.post('/api/quotes', (req, res) => {
  const { symbols } = req.body;
  if (!symbols || !Array.isArray(symbols)) return res.status(400).json({ error: 'symbols[] required' });
  const stocks = symbols.map(sym => {
    const s = sym.toUpperCase();
    if (latestMarketData) {
      const live = latestMarketData.allStocks.find(x => x.symbol === s);
      if (live) return live;
    }
    return { symbol: s, sector: SECTOR_LOOKUP[s]||'Others', nifty50: NIFTY50.has(s), ltp:null, changePct:null, rsi:null };
  });
  res.json({ stocks, lastUpdated: latestMarketData?.lastUpdated || null });
});

// All stocks list for explore/browse
app.get('/api/stocks', (req, res) => {
  const stocks = SYMBOLS.map(symbol => {
    const base = { symbol, sector: SECTOR_LOOKUP[symbol]||'Others', nifty50: NIFTY50.has(symbol) };
    if (latestMarketData) {
      const live = latestMarketData.allStocks.find(s => s.symbol === symbol);
      if (live) Object.assign(base, { ltp: live.ltp, changePct: live.changePct, change: live.change, rsi: live.rsi });
    }
    return base;
  });
  stocks.sort((a,b) => (b.changePct||0) - (a.changePct||0));
  res.json({ stocks, sectors: Object.keys(SECTOR_MAP), lastUpdated: latestMarketData?.lastUpdated });
});

app.get('/api/status', (req, res) => res.json({
  initStatus, hasData: !!latestMarketData, isFetching,
  loaded: Object.keys(historicalData).length, total: SYMBOLS.length,
  lastUpdate: lastUpdate ? new Date(lastUpdate).toISOString() : null
}));

// ── MarketPulse AI Chat Endpoint ──
app.post('/api/chat', async (req, res) => {
  const { prompt, watchlist } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt required' });

  // If we don't have the real AI connected, return a mock response
  if (!aiClient) {
    await new Promise(r => setTimeout(r, 2000)); // Simulate thinking
    return res.json({
      reply: `**Mock AI Mode**\n\nI see you're asking about: "${prompt}".\n\nTo get real market insights, please add your \`GEMINI_API_KEY\` to the environment variables and restart the server.\n\nCurrently, you have ${watchlist ? watchlist.length : 0} stocks in your watchlist.`
    });
  }

  try {
    // Construct market context
    const contextStr = watchlist && watchlist.length > 0 
      ? watchlist.map(s => `${s.symbol}: ₹${s.ltp||'N/A'} (Change: ${s.changePct!=null?s.changePct.toFixed(1):'N/A'}%, RSI: ${s.rsi||'N/A'})`).join('\n')
      : "The user has an empty watchlist.";

    const systemInstruction = `You are MarketPulse AI, a smart, concise, and helpful financial assistant.
Context:
The user is viewing their market dashboard.
Here is the real-time data for their watchlist:
${contextStr}

Rules:
1. Keep answers brief (1-3 paragraphs maximum).
2. Format output nicely with Markdown (bolding, lists).
3. If they ask about a stock in their watchlist, reference the provided data.
4. If they ask a general market question, provide a knowledgeable answer.
5. Be professional but conversational (like a smart market companion).`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7
      }
    });

    res.json({ reply: response.text });
  } catch (error) {
    console.error('AI Chat Error:', error);
    res.status(500).json({ error: 'AI generation failed' });
  }
});

// ── Detailed Stock View (Deterministic Mock Data) ──
app.get('/api/stock/details/:symbol', (req, res) => {
  const sym = req.params.symbol.toUpperCase();
  
  // Use a simple hash of the symbol name to generate stable, deterministic mock data
  const hash = Array.from(sym).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Try to get real basic info if available
  let basePrice = 1000 + (hash * 10 % 2000);
  let changePct = ((hash % 100) / 20) - 2.5; // -2.5% to +2.5%
  let sector = SECTOR_LOOKUP[sym] || 'Unknown';
  let companyName = sym + ' Inc.';

  if (latestMarketData) {
    const live = latestMarketData.allStocks.find(s => s.symbol === sym);
    if (live) {
      basePrice = live.ltp;
      changePct = live.changePct;
      sector = live.sector;
    }
  }

  const change = (basePrice * (changePct / 100));
  const prevClose = basePrice - change;
  const isUp = changePct >= 0;

  // Market Depth
  const buyPct = 40 + (hash % 20);
  const sellPct = 100 - buyPct;
  const depth = {
    buyOrdersPct: buyPct.toFixed(2),
    sellOrdersPct: sellPct.toFixed(2),
    bids: [
      { price: (basePrice - 0.1).toFixed(2), qty: 23 },
      { price: (basePrice - 0.3).toFixed(2), qty: 24 },
      { price: (basePrice - 0.4).toFixed(2), qty: 39 },
      { price: (basePrice - 0.5).toFixed(2), qty: 56 },
      { price: (basePrice - 0.6).toFixed(2), qty: 328 }
    ],
    asks: [
      { price: (basePrice + 0.1).toFixed(2), qty: 22 },
      { price: (basePrice + 0.3).toFixed(2), qty: 6 },
      { price: (basePrice + 0.4).toFixed(2), qty: 2 },
      { price: (basePrice + 0.5).toFixed(2), qty: 3 },
      { price: (basePrice + 0.6).toFixed(2), qty: 21 }
    ],
    bidTotal: "72,434",
    askTotal: "92,504"
  };

  // Performance
  const todayLow = basePrice * (1 - ((hash%3)/100 + 0.01));
  const todayHigh = basePrice * (1 + ((hash%3)/100 + 0.01));
  const week52Low = basePrice * 0.7;
  const week52High = basePrice * 1.4;
  const performance = {
    todayLow: todayLow.toFixed(2),
    todayHigh: todayHigh.toFixed(2),
    week52Low: week52Low.toFixed(2),
    week52High: week52High.toFixed(2),
    openPrice: (basePrice - change + ((hash%10)/100)).toFixed(2),
    prevClose: prevClose.toFixed(2),
    liveVolume: (hash * 1234).toLocaleString(),
    lowerCircuit: (basePrice * 0.9).toFixed(2),
    upperCircuit: (basePrice * 1.1).toFixed(2)
  };

  // Fundamentals
  const fundamentals = {
    marketCap: "₹" + (hash * 123).toLocaleString() + "Cr",
    roe: (15 + (hash%15)).toFixed(2) + "%",
    peRatio: (10 + (hash%20)).toFixed(2),
    eps: (hash % 300).toFixed(2),
    pbRatio: ((hash % 10) / 2 + 1).toFixed(2),
    divYield: ((hash % 3) + 0.5).toFixed(2) + "%",
    industryPe: (15 + (hash%10)).toFixed(2),
    bookValue: (hash * 2.5).toFixed(2),
    debtToEquity: ((hash % 5) / 10).toFixed(2),
    faceValue: 10
  };

  // Financial Performance (Mock bar chart data)
  const financials = {
    yearly: [
      { year: "'22", rev: 5000 + hash, prof: 1000 + (hash/2) },
      { year: "'23", rev: 6000 + hash, prof: 1500 + (hash/2) },
      { year: "'24", rev: 7500 + hash, prof: 2000 + (hash/2) },
      { year: "'25", rev: 8000 + hash, prof: 1800 + (hash/2) },
      { year: "'26", rev: 8695 + hash, prof: 2825 + (hash/2) }
    ]
  };

  // Shareholding
  const shareholding = {
    promoters: (40 + (hash%30)).toFixed(2),
    fii: (10 + (hash%15)).toFixed(2),
    dii: (5 + (hash%10)).toFixed(2),
    public: (20 + (hash%10)).toFixed(2)
  };

  // About
  const about = {
    desc: `Established in 1997, ${companyName} is one of India's largest companies in the ${sector} sector with a rich legacy. The company's vision is to become the most trusted, globally diversified institution.`,
    ceo: "John Doe",
    founded: "1997",
    nseSymbol: sym
  };

  // Mock historical chart data (100 points for a nice sparkline)
  const chartData = [];
  let cp = prevClose;
  for (let i=0; i<100; i++) {
    cp = cp * (1 + (Math.random() - 0.48) * 0.01);
    chartData.push(cp);
  }
  chartData[chartData.length - 1] = basePrice; // end exactly at current price

  res.json({
    symbol: sym,
    companyName,
    sector,
    ltp: basePrice,
    changePct,
    change,
    depth,
    performance,
    fundamentals,
    financials,
    shareholding,
    about,
    chartData
  });
});

// ── Start ──
app.listen(PORT, () => {
  console.log(`\n🚀 Smart Watchlist → http://localhost:${PORT}\n`);
});

(async function boot() {
  const ok = await authenticateGroww();
  if (!ok) { await new Promise(r => setTimeout(r, 5000)); await authenticateGroww(); }
  setInterval(authenticateGroww, 4 * 3600000);
  await initializeHistory();
  await pollQuotes();
  // Poll every 5 minutes to respect rate limits (was 90s)
  setInterval(pollQuotes, 5 * 60 * 1000);
})();
