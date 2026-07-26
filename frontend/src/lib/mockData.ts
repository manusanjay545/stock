// ============================================================
// QuantStrike AI — Mock Data Generator (Client-side)
// Generates realistic Indian market mock data for all pages
// ============================================================

import type {
  MarketDataWithIndicators, MarketOverview, MarketStatus, Indicators,
  OptionChainData, OptionChainRow, OptionStrike, Greeks,
  Recommendation, AIExplanation, ScannerResult, Alert, Watchlist,
  BacktestResult, BacktestTrade, DashboardData, MarketData,
  StrikeScore, QuantitativeData, VolumeAnalysis, PriceAction,
  TradeDirection, RiskLevel, Trend, OptionType, ScannerCategory,
  AppSettings,
} from "./types";

// ── Helpers ──────────────────────────────────────────────────
const rand = (min: number, max: number) => Math.random() * (max - min) + min;
const randInt = (min: number, max: number) => Math.floor(rand(min, max + 1));
const pick = <T>(arr: readonly T[]): T => arr[randInt(0, arr.length - 1)];
const uuid = () => crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const BASE_PRICES: Record<string, number> = {
  NIFTY: 24850, BANKNIFTY: 53200, FINNIFTY: 24100, SENSEX: 81500,
  RELIANCE: 2980, TCS: 3850, HDFCBANK: 1720, INFY: 1580, ICICIBANK: 1290,
};

function makeIndicators(price: number): Indicators {
  return {
    atr: rand(50, 200), adx: rand(15, 55), rsi: rand(25, 80),
    macd: rand(-30, 30), macdSignal: rand(-20, 20), macdHistogram: rand(-15, 15),
    ema20: price * rand(0.98, 1.02), ema50: price * rand(0.96, 1.04),
    ema100: price * rand(0.94, 1.06), ema200: price * rand(0.92, 1.08),
    supertrend: price * rand(0.97, 1.03),
    supertrendDirection: pick(["BULLISH", "BEARISH", "SIDEWAYS"] as const),
    bollingerUpper: price * 1.03, bollingerMiddle: price, bollingerLower: price * 0.97,
    cci: rand(-200, 200), stochRsiK: rand(10, 90), stochRsiD: rand(10, 90),
  };
}

function makeMarketData(symbol: string): MarketDataWithIndicators {
  const base = BASE_PRICES[symbol] || 1000;
  const price = base * rand(0.98, 1.02);
  const change = price - base;
  return {
    symbol, price, open: base * rand(0.995, 1.005), high: price * rand(1.001, 1.015),
    low: price * rand(0.985, 0.999), close: price, prevClose: base,
    change, changePercent: (change / base) * 100,
    volume: randInt(5e6, 5e7), vwap: price * rand(0.998, 1.002),
    relativeVolume: rand(0.5, 3), timestamp: new Date().toISOString(),
    indicators: makeIndicators(price),
    trend: change > 0 ? "BULLISH" : change < 0 ? "BEARISH" : "SIDEWAYS",
  };
}

// ── Exported Generators ──────────────────────────────────────

export function generateMarketOverview(): MarketOverview {
  const indices = ["NIFTY", "BANKNIFTY", "FINNIFTY", "SENSEX"].map(makeMarketData);
  const bulls = indices.filter((i) => i.trend === "BULLISH").length;
  return {
    status: {
      isOpen: true, session: "OPEN",
      nextOpen: new Date(Date.now() + 86400000).toISOString(),
      nextClose: new Date(Date.now() + 3600000).toISOString(),
    },
    indices,
    overallScore: randInt(35, 85),
    marketSentiment: bulls >= 3 ? "BULLISH" : bulls <= 1 ? "BEARISH" : "SIDEWAYS",
  };
}

export function generateOptionChain(symbol: string, spotPrice?: number): OptionChainData {
  const spot = spotPrice || BASE_PRICES[symbol] || 24850;
  const step = symbol === "BANKNIFTY" ? 100 : symbol === "SENSEX" ? 100 : 50;
  const atm = Math.round(spot / step) * step;
  const strikes: OptionChainRow[] = [];
  const expiry = getNextExpiry();

  for (let s = atm - step * 15; s <= atm + step * 15; s += step) {
    const dist = Math.abs(s - spot) / spot;
    const isATM = s === atm;
    const callITM = s < spot;
    const putITM = s > spot;
    const baseIV = rand(12, 25) + dist * 80;
    const callOI = randInt(5000, callITM ? 800000 : 2000000);
    const putOI = randInt(5000, putITM ? 800000 : 2000000);
    const callPremium = Math.max(0, spot - s) + rand(5, 80 * (1 - dist));
    const putPremium = Math.max(0, s - spot) + rand(5, 80 * (1 - dist));

    const makeGreeks = (isCall: boolean): Greeks => ({
      delta: isCall ? rand(0.1, 0.95) : rand(-0.95, -0.1),
      gamma: rand(0.001, 0.05), theta: rand(-50, -2), vega: rand(2, 30),
    });

    const makeStrike = (type: OptionType, premium: number, oi: number): OptionStrike => ({
      strikePrice: s, expiryDate: expiry, optionType: type,
      ltp: +premium.toFixed(2), change: rand(-20, 20), changePercent: rand(-8, 8),
      volume: randInt(1000, 500000), oi, changeInOI: randInt(-50000, 100000),
      iv: +baseIV.toFixed(2), bid: +(premium - rand(0.5, 3)).toFixed(2),
      ask: +(premium + rand(0.5, 3)).toFixed(2), bidQty: randInt(100, 5000),
      askQty: randInt(100, 5000), greeks: makeGreeks(type === "CE"),
    });

    strikes.push({
      strikePrice: s, isATM, isITM_CE: callITM, isITM_PE: putITM,
      call: makeStrike("CE", callPremium, callOI),
      put: makeStrike("PE", putPremium, putOI),
    });
  }

  const totalCallOI = strikes.reduce((a, r) => a + r.call.oi, 0);
  const totalPutOI = strikes.reduce((a, r) => a + r.put.oi, 0);

  return {
    symbol, spotPrice: spot, expiry, atmStrike: atm,
    maxPain: atm + pick([-2, -1, 0, 1, 2]) * step,
    pcr: +(totalPutOI / totalCallOI).toFixed(2),
    totalCallOI, totalPutOI, strikes,
  };
}

export function generateRecommendations(count = 8): Recommendation[] {
  return Array.from({ length: count }, () => {
    const symbol = pick(["NIFTY", "BANKNIFTY", "FINNIFTY", "RELIANCE", "TCS", "HDFCBANK"]);
    const base = BASE_PRICES[symbol] || 24850;
    const direction: TradeDirection = pick(["BUY CALL", "BUY PUT"]);
    const step = symbol === "BANKNIFTY" ? 100 : 50;
    const atm = Math.round(base / step) * step;
    const offset = pick([-2, -1, 0, 1, 2]) * step;
    const strike = atm + (direction === "BUY CALL" ? offset : -offset);
    const premium = rand(30, 350);
    const score = randInt(45, 95);

    return {
      id: uuid(), symbol, direction, strikePrice: strike,
      expiry: getNextExpiry(), currentPremium: +premium.toFixed(2),
      entryPrice: +(premium * rand(0.95, 1.02)).toFixed(2),
      stopLoss: +(premium * rand(0.6, 0.8)).toFixed(2),
      target1: +(premium * rand(1.3, 1.6)).toFixed(2),
      target2: +(premium * rand(1.6, 2.2)).toFixed(2),
      holdingTime: pick(["Intraday", "1-2 Days", "2-5 Days", "Weekly"]),
      confidence: randInt(55, 92), overallScore: score,
      riskLevel: (score >= 70 ? "LOW" : score >= 50 ? "MEDIUM" : "HIGH") as RiskLevel,
      expectedMove: +rand(0.5, 3.5).toFixed(2),
      probabilityOfSuccess: randInt(45, 82),
      riskRewardRatio: +rand(1.2, 3.5).toFixed(2),
      explanation: generateExplanation(symbol, direction),
      createdAt: new Date(Date.now() - randInt(0, 3600000)).toISOString(),
    };
  }).sort((a, b) => b.overallScore - a.overallScore);
}

function generateExplanation(symbol: string, direction: TradeDirection): AIExplanation {
  const bullish = direction === "BUY CALL";
  return {
    trend: `${symbol} is in a ${bullish ? "bullish" : "bearish"} trend with ${bullish ? "higher highs and higher lows" : "lower highs and lower lows"} on the hourly timeframe.`,
    momentum: `RSI at ${randInt(40, 70)} indicates ${bullish ? "positive" : "weakening"} momentum. MACD histogram is ${bullish ? "expanding above" : "contracting below"} the signal line.`,
    technicalIndicators: `Price is trading ${bullish ? "above" : "below"} the 20-EMA and ${bullish ? "approaching" : "retreating from"} the 50-EMA. Supertrend is ${bullish ? "bullish" : "bearish"}. ADX at ${randInt(20, 45)} shows trending market.`,
    optionChain: `PCR is ${rand(0.7, 1.4).toFixed(2)}. Significant ${bullish ? "put writing" : "call writing"} observed at nearby strikes indicating ${bullish ? "support" : "resistance"} build-up.`,
    volume: `Relative volume is ${rand(1.1, 2.5).toFixed(1)}x. ${bullish ? "Buying" : "Selling"} pressure dominates with volume delta strongly ${bullish ? "positive" : "negative"}.`,
    quantitativeSignals: `IV Rank at ${randInt(20, 70)}. Delta of ${(bullish ? rand(0.4, 0.7) : rand(-0.7, -0.4)).toFixed(2)} provides favorable risk-reward.`,
    support: `Key support at ${(BASE_PRICES[symbol] * 0.98).toFixed(0)}`,
    resistance: `Key resistance at ${(BASE_PRICES[symbol] * 1.02).toFixed(0)}`,
    volatility: `Implied volatility is ${bullish ? "relatively low" : "elevated"} at ${rand(12, 25).toFixed(1)}%. Historical volatility suggests ${bullish ? "expansion" : "contraction"} ahead.`,
    marketSentiment: `Overall market sentiment is ${bullish ? "cautiously bullish" : "bearish"} with breadth indicators ${bullish ? "improving" : "deteriorating"}.`,
    strikeRationale: `This strike was selected for optimal liquidity (OI > ${randInt(100, 500)}K), favorable bid-ask spread, and ${bullish ? "high" : "moderate"} probability of reaching target.`,
    technicalSummary: `${bullish ? "Bullish" : "Bearish"} bias with multiple confirmations from trend, momentum, and moving average analysis.`,
    optionChainSummary: `Option chain structure supports ${bullish ? "upside" : "downside"} with significant ${bullish ? "put support" : "call resistance"} at nearby levels.`,
    quantitativeSummary: `Risk-reward ratio is favorable at ${rand(1.5, 3).toFixed(1)}:1 with ${randInt(50, 75)}% probability of profit.`,
    finalRecommendation: `Based on comprehensive analysis of price action, technical indicators, option chain dynamics, and quantitative metrics, this ${direction} setup presents a ${randInt(55, 85)}% probability trade. This is for educational purposes only — always manage risk.`,
  };
}

export function generateScannerResults(count = 12): ScannerResult[] {
  const categories: ScannerCategory[] = ["BREAKOUT", "MOMENTUM", "TREND_REVERSAL", "HIGH_VOLUME", "OI_CHANGE", "HIGH_CONFIDENCE"];
  return Array.from({ length: count }, () => {
    const symbol = pick(["NIFTY", "BANKNIFTY", "FINNIFTY", "RELIANCE", "TCS", "HDFCBANK", "INFY", "ICICIBANK"]);
    const cat = pick(categories);
    return {
      id: uuid(), symbol, category: cat,
      direction: pick(["BUY CALL", "BUY PUT"] as const),
      strikePrice: Math.round((BASE_PRICES[symbol] || 24850) / 50) * 50,
      expiry: getNextExpiry(), score: randInt(55, 95), confidence: randInt(50, 90),
      description: `${cat.replace("_", " ")} detected on ${symbol} with strong ${pick(["volume", "OI", "momentum"])} confirmation.`,
      detectedAt: new Date(Date.now() - randInt(0, 1800000)).toISOString(),
    };
  }).sort((a, b) => b.score - a.score);
}

export function generateAlerts(count = 6): Alert[] {
  return Array.from({ length: count }, () => ({
    id: uuid(), userId: "user-1",
    symbol: pick(["NIFTY", "BANKNIFTY", "RELIANCE", "TCS"]),
    alertType: pick(["PRICE", "RSI", "VOLUME", "OI", "IV", "BREAKOUT"] as const),
    condition: pick(["ABOVE", "BELOW", "CROSSES_ABOVE"] as const),
    threshold: randInt(100, 25000), currentValue: randInt(100, 25000),
    isActive: Math.random() > 0.3, isTriggered: Math.random() > 0.7,
    triggeredAt: Math.random() > 0.5 ? new Date(Date.now() - randInt(0, 86400000)).toISOString() : undefined,
    createdAt: new Date(Date.now() - randInt(0, 604800000)).toISOString(),
  }));
}

export function generateWatchlists(): Watchlist[] {
  return [
    { id: "w1", name: "Index Options", userId: "user-1", items: [
      { id: "i1", symbol: "NIFTY", type: "INDEX", addedAt: new Date().toISOString() },
      { id: "i2", symbol: "BANKNIFTY", type: "INDEX", addedAt: new Date().toISOString() },
      { id: "i3", symbol: "NIFTY", type: "OPTION", strikePrice: 24900, expiry: getNextExpiry(), optionType: "CE", addedAt: new Date().toISOString() },
    ], createdAt: new Date().toISOString() },
    { id: "w2", name: "Stock Picks", userId: "user-1", items: [
      { id: "i4", symbol: "RELIANCE", type: "STOCK", addedAt: new Date().toISOString() },
      { id: "i5", symbol: "TCS", type: "STOCK", addedAt: new Date().toISOString() },
      { id: "i6", symbol: "HDFCBANK", type: "STOCK", addedAt: new Date().toISOString() },
    ], createdAt: new Date().toISOString() },
  ];
}

export function generateBacktestResult(): BacktestResult {
  const trades: BacktestTrade[] = Array.from({ length: randInt(20, 60) }, (_, i) => {
    const pnl = rand(-5000, 8000);
    return {
      entryDate: new Date(Date.now() - (60 - i) * 86400000).toISOString(),
      exitDate: new Date(Date.now() - (60 - i - 1) * 86400000).toISOString(),
      strikePrice: 24800 + pick([-100, -50, 0, 50, 100]),
      direction: pick(["BUY CALL", "BUY PUT"] as const),
      entryPrice: rand(50, 300), exitPrice: rand(20, 500), pnl,
      pnlPercent: rand(-50, 100),
    };
  });
  let equity = 100000;
  const equityCurve = trades.map((t) => {
    equity += t.pnl;
    return { date: t.exitDate, value: equity };
  });
  const wins = trades.filter((t) => t.pnl > 0);
  const losses = trades.filter((t) => t.pnl <= 0);
  return {
    id: uuid(), winRate: +((wins.length / trades.length) * 100).toFixed(1),
    lossRate: +((losses.length / trades.length) * 100).toFixed(1),
    averageProfit: +(wins.reduce((s, t) => s + t.pnl, 0) / (wins.length || 1)).toFixed(0),
    averageLoss: +(losses.reduce((s, t) => s + t.pnl, 0) / (losses.length || 1)).toFixed(0),
    maximumDrawdown: +rand(5, 25).toFixed(1),
    profitFactor: +rand(1.1, 2.8).toFixed(2),
    sharpeRatio: +rand(0.5, 2.5).toFixed(2),
    totalTrades: trades.length,
    totalProfit: +wins.reduce((s, t) => s + t.pnl, 0).toFixed(0),
    totalLoss: +losses.reduce((s, t) => s + t.pnl, 0).toFixed(0),
    netPnL: +(equity - 100000).toFixed(0), equityCurve, trades,
  };
}

export function generateDashboard(): DashboardData {
  const overview = generateMarketOverview();
  return {
    marketOverview: overview,
    topOpportunities: generateRecommendations(5),
    recentAlerts: generateAlerts(4),
    mostActiveStocks: ["RELIANCE", "TCS", "HDFCBANK", "INFY", "ICICIBANK"].map((s) => ({
      symbol: s, price: BASE_PRICES[s] * rand(0.98, 1.02),
      open: BASE_PRICES[s], high: BASE_PRICES[s] * 1.01, low: BASE_PRICES[s] * 0.99,
      close: BASE_PRICES[s] * rand(0.99, 1.01), prevClose: BASE_PRICES[s],
      change: rand(-30, 30), changePercent: rand(-2, 2),
      volume: randInt(5e6, 3e7), vwap: BASE_PRICES[s], relativeVolume: rand(0.8, 2.5),
      timestamp: new Date().toISOString(),
    })),
    mostActiveOptions: [],
    latestRecommendations: generateRecommendations(6),
  };
}

export function generateSettings(): AppSettings {
  return {
    scoreWeights: { priceAction: 0.2, technical: 0.25, optionChain: 0.3, volume: 0.15, quantitative: 0.1 },
    confidenceThreshold: 60, riskThreshold: 70, scannerFrequency: 15, alertRules: {},
  };
}

function getNextExpiry(): string {
  const now = new Date();
  const day = now.getDay();
  const daysUntilThursday = (4 - day + 7) % 7 || 7;
  const next = new Date(now.getTime() + daysUntilThursday * 86400000);
  return next.toISOString().split("T")[0];
}
