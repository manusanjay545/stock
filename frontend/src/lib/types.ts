// ============================================================
// QuantStrike AI — Shared TypeScript Types
// ============================================================

// ── Market & Instrument ──────────────────────────────────────

export type MarketIndex = "NIFTY" | "BANKNIFTY" | "FINNIFTY" | "SENSEX";
export type OptionType = "CE" | "PE";
export type TradeDirection = "BUY CALL" | "BUY PUT" | "NO TRADE";
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";
export type Trend = "BULLISH" | "BEARISH" | "SIDEWAYS";
export type AlertType =
  | "PRICE"
  | "VOLUME"
  | "OI"
  | "PCR"
  | "IV"
  | "RSI"
  | "MACD"
  | "BREAKOUT"
  | "TREND_CHANGE"
  | "SCORE"
  | "CONFIDENCE";

export type AlertCondition = "ABOVE" | "BELOW" | "CROSSES_ABOVE" | "CROSSES_BELOW";

// ── Market Data ──────────────────────────────────────────────

export interface MarketData {
  symbol: string;
  price: number;
  open: number;
  high: number;
  low: number;
  close: number;
  prevClose: number;
  change: number;
  changePercent: number;
  volume: number;
  vwap: number;
  relativeVolume: number;
  timestamp: string;
}

export interface Indicators {
  atr: number;
  adx: number;
  rsi: number;
  macd: number;
  macdSignal: number;
  macdHistogram: number;
  ema20: number;
  ema50: number;
  ema100: number;
  ema200: number;
  supertrend: number;
  supertrendDirection: Trend;
  bollingerUpper: number;
  bollingerMiddle: number;
  bollingerLower: number;
  cci: number;
  stochRsiK: number;
  stochRsiD: number;
}

export interface MarketDataWithIndicators extends MarketData {
  indicators: Indicators;
  trend: Trend;
}

// ── Market Status ────────────────────────────────────────────

export interface MarketStatus {
  isOpen: boolean;
  session: "PRE_MARKET" | "OPEN" | "CLOSED" | "POST_MARKET";
  nextOpen: string;
  nextClose: string;
}

export interface MarketOverview {
  status: MarketStatus;
  indices: MarketDataWithIndicators[];
  overallScore: number;
  marketSentiment: Trend;
}

// ── Option Chain ─────────────────────────────────────────────

export interface Greeks {
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
}

export interface OptionStrike {
  strikePrice: number;
  expiryDate: string;
  optionType: OptionType;
  ltp: number;
  change: number;
  changePercent: number;
  volume: number;
  oi: number;
  changeInOI: number;
  iv: number;
  bid: number;
  ask: number;
  bidQty: number;
  askQty: number;
  greeks: Greeks;
}

export interface OptionChainData {
  symbol: string;
  spotPrice: number;
  expiry: string;
  atmStrike: number;
  maxPain: number;
  pcr: number;
  totalCallOI: number;
  totalPutOI: number;
  strikes: OptionChainRow[];
}

export interface OptionChainRow {
  strikePrice: number;
  call: OptionStrike;
  put: OptionStrike;
  isATM: boolean;
  isITM_CE: boolean;
  isITM_PE: boolean;
}

// ── Scoring ──────────────────────────────────────────────────

export interface ScoreWeights {
  priceAction: number;
  technical: number;
  optionChain: number;
  volume: number;
  quantitative: number;
}

export interface StrikeScore {
  strikePrice: number;
  expiry: string;
  optionType: OptionType;
  liquidityScore: number;
  volumeScore: number;
  oiScore: number;
  changeInOIScore: number;
  trendScore: number;
  momentumScore: number;
  volatilityScore: number;
  riskScore: number;
  probabilityScore: number;
  expectedReward: number;
  expectedLoss: number;
  riskRewardRatio: number;
  finalScore: number;
}

// ── Recommendations ──────────────────────────────────────────

export interface Recommendation {
  id: string;
  symbol: string;
  direction: TradeDirection;
  strikePrice: number;
  expiry: string;
  currentPremium: number;
  entryPrice: number;
  stopLoss: number;
  target1: number;
  target2: number;
  holdingTime: string;
  confidence: number;
  overallScore: number;
  riskLevel: RiskLevel;
  expectedMove: number;
  probabilityOfSuccess: number;
  riskRewardRatio: number;
  explanation: AIExplanation;
  createdAt: string;
}

export interface AIExplanation {
  trend: string;
  momentum: string;
  technicalIndicators: string;
  optionChain: string;
  volume: string;
  quantitativeSignals: string;
  support: string;
  resistance: string;
  volatility: string;
  marketSentiment: string;
  strikeRationale: string;
  technicalSummary: string;
  optionChainSummary: string;
  quantitativeSummary: string;
  finalRecommendation: string;
}

// ── Scanner ──────────────────────────────────────────────────

export type ScannerCategory =
  | "BREAKOUT"
  | "MOMENTUM"
  | "TREND_REVERSAL"
  | "HIGH_VOLUME"
  | "OI_CHANGE"
  | "HIGH_CONFIDENCE";

export interface ScannerResult {
  id: string;
  symbol: string;
  category: ScannerCategory;
  direction: TradeDirection;
  strikePrice: number;
  expiry: string;
  score: number;
  confidence: number;
  description: string;
  detectedAt: string;
}

// ── Quantitative ─────────────────────────────────────────────

export interface QuantitativeData {
  historicalVolatility: number;
  impliedVolatility: number;
  ivRank: number;
  ivPercentile: number;
  expectedMove: number;
  probabilityOfProfit: number;
  expectedRange: { low: number; high: number };
  averageTrueRange: number;
}

// ── Volume Analysis ──────────────────────────────────────────

export interface VolumeAnalysis {
  volumeSpike: boolean;
  relativeVolume: number;
  buyingPressure: number;
  sellingPressure: number;
  deliveryPercentage: number;
  volumeDelta: number;
}

// ── Price Action ─────────────────────────────────────────────

export interface PriceAction {
  trend: Trend;
  higherHigh: boolean;
  higherLow: boolean;
  lowerHigh: boolean;
  lowerLow: boolean;
  breakout: boolean;
  breakdown: boolean;
  retest: boolean;
  supports: number[];
  resistances: number[];
  swingHigh: number;
  swingLow: number;
}

// ── Watchlist ────────────────────────────────────────────────

export interface Watchlist {
  id: string;
  name: string;
  userId: string;
  items: WatchlistItem[];
  createdAt: string;
}

export interface WatchlistItem {
  id: string;
  symbol: string;
  type: "STOCK" | "INDEX" | "OPTION";
  strikePrice?: number;
  expiry?: string;
  optionType?: OptionType;
  addedAt: string;
}

// ── Alerts ───────────────────────────────────────────────────

export interface Alert {
  id: string;
  userId: string;
  symbol: string;
  alertType: AlertType;
  condition: AlertCondition;
  threshold: number;
  currentValue: number;
  isActive: boolean;
  isTriggered: boolean;
  triggeredAt?: string;
  createdAt: string;
}

// ── Backtesting ──────────────────────────────────────────────

export interface BacktestInput {
  symbol: string;
  startDate: string;
  endDate: string;
  capital: number;
  expiry: string;
  strategy: string;
  riskLevel: RiskLevel;
}

export interface BacktestResult {
  id: string;
  winRate: number;
  lossRate: number;
  averageProfit: number;
  averageLoss: number;
  maximumDrawdown: number;
  profitFactor: number;
  sharpeRatio: number;
  totalTrades: number;
  totalProfit: number;
  totalLoss: number;
  netPnL: number;
  equityCurve: { date: string; value: number }[];
  trades: BacktestTrade[];
}

export interface BacktestTrade {
  entryDate: string;
  exitDate: string;
  strikePrice: number;
  direction: TradeDirection;
  entryPrice: number;
  exitPrice: number;
  pnl: number;
  pnlPercent: number;
}

// ── User & Settings ──────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  role: "USER" | "ADMIN";
  preferences: UserPreferences;
  createdAt: string;
}

export interface UserPreferences {
  defaultMarket: MarketIndex;
  theme: "dark" | "light";
  notifications: boolean;
  defaultExpiry: string;
}

export interface AppSettings {
  scoreWeights: ScoreWeights;
  confidenceThreshold: number;
  riskThreshold: number;
  scannerFrequency: number;
  alertRules: Record<string, unknown>;
}

// ── API Response ─────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ── Dashboard ────────────────────────────────────────────────

export interface DashboardData {
  marketOverview: MarketOverview;
  topOpportunities: Recommendation[];
  recentAlerts: Alert[];
  mostActiveStocks: MarketData[];
  mostActiveOptions: OptionStrike[];
  latestRecommendations: Recommendation[];
}

// ── Filters ──────────────────────────────────────────────────

export interface RecommendationFilters {
  expiry?: string;
  strikeType?: OptionType;
  riskLevel?: RiskLevel;
  minConfidence?: number;
  minLiquidity?: number;
  minVolume?: number;
  maxIV?: number;
  trend?: Trend;
  minScore?: number;
}
