// ============================================================
// QuantStrike AI — Plan Configuration & Feature Gating
// ============================================================

export type UserPlan = "FREE" | "PRO";

export interface PlanConfig {
  name: string;
  price: number; // INR per month
  yearlyPrice: number; // INR per year
  badge: string;
  color: string;
  features: string[];
  limits: PlanLimits;
}

export interface PlanLimits {
  maxRecommendations: number; // visible recommendations per refresh
  maxScannerResults: number; // scanner results shown
  maxAlerts: number; // active alerts
  maxWatchlists: number; // watchlists
  maxBacktestTrades: number; // backtest trade count
  optionChainStrikes: number; // strikes around ATM (per side)
  screenerResults: number; // stock screener result limit
  aiExplanation: boolean; // show detailed AI explanation
  balanceSheet: boolean; // full balance sheet access
  advancedFilters: boolean; // advanced screener/scanner filters
  exportData: boolean; // CSV/PDF export
  realTimeData: boolean; // real-time vs 15min delayed
  prioritySupport: boolean;
}

export const PLANS: Record<UserPlan, PlanConfig> = {
  FREE: {
    name: "Free",
    price: 0,
    yearlyPrice: 0,
    badge: "Free Plan",
    color: "text-muted-foreground",
    features: [
      "5 AI Recommendations per day",
      "Basic Market Scanner (6 results)",
      "Option Chain (10 strikes)",
      "3 Active Alerts",
      "2 Watchlists",
      "Stock Screener (20 results)",
      "Basic Backtesting",
      "15-min delayed data",
    ],
    limits: {
      maxRecommendations: 5,
      maxScannerResults: 6,
      maxAlerts: 3,
      maxWatchlists: 2,
      maxBacktestTrades: 20,
      optionChainStrikes: 10,
      screenerResults: 20,
      aiExplanation: false,
      balanceSheet: false,
      advancedFilters: false,
      exportData: false,
      realTimeData: false,
      prioritySupport: false,
    },
  },
  PRO: {
    name: "Pro",
    price: 999,
    yearlyPrice: 9999,
    badge: "Pro Plan",
    color: "text-amber-400",
    features: [
      "Unlimited AI Recommendations",
      "Full Market Scanner (50+ results)",
      "Full Option Chain (30 strikes)",
      "Unlimited Alerts",
      "Unlimited Watchlists",
      "Unlimited Screener Results",
      "Advanced Backtesting (60 trades)",
      "Real-time market data",
      "Detailed AI Explanations",
      "Full Balance Sheet Analysis",
      "Advanced Filters & Sorting",
      "Export to CSV / PDF",
      "Priority Support",
    ],
    limits: {
      maxRecommendations: 999,
      maxScannerResults: 50,
      maxAlerts: 999,
      maxWatchlists: 999,
      maxBacktestTrades: 60,
      optionChainStrikes: 30,
      screenerResults: 999,
      aiExplanation: true,
      balanceSheet: true,
      advancedFilters: true,
      exportData: true,
      realTimeData: true,
      prioritySupport: true,
    },
  },
};

/** Returns whether a feature is available for a given plan */
export function canAccess(plan: UserPlan, feature: keyof PlanLimits): boolean {
  const val = PLANS[plan].limits[feature];
  if (typeof val === "boolean") return val;
  return true; // numeric limits are checked separately
}

/** Returns the limit number for a given plan feature */
export function getLimit(plan: UserPlan, feature: keyof PlanLimits): number {
  const val = PLANS[plan].limits[feature];
  if (typeof val === "number") return val;
  return val ? 999 : 0;
}
