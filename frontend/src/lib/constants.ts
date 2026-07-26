// ============================================================
// QuantStrike AI — Constants (Updated 2026-07-26)
// ============================================================

export const APP_NAME = "QuantStrike AI";
export const APP_DESCRIPTION =
  "AI-powered option chain analysis and strike price recommendations for Indian markets.";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://cjbujntpatknaqyhqsco.supabase.co";
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqYnVqbnRwYXRrbmFxeWhxc2NvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUwNTE2OTIsImV4cCI6MjEwMDYyNzY5Mn0.dLfCy4oN62t8UXGz7AkZSReWpA9VQb0GlMRLXr8HRms";

// Market indices
export const MARKET_INDICES = [
  { symbol: "NIFTY", name: "NIFTY 50", lotSize: 25 },
  { symbol: "BANKNIFTY", name: "BANK NIFTY", lotSize: 15 },
  { symbol: "FINNIFTY", name: "FIN NIFTY", lotSize: 25 },
  { symbol: "SENSEX", name: "SENSEX", lotSize: 10 },
] as const;

// Refresh intervals (ms)
export const REFRESH_INTERVALS = {
  marketData: 5000,
  optionChain: 10000,
  recommendations: 30000,
  scanner: 15000,
  alerts: 10000,
} as const;

// Default score weights
export const DEFAULT_WEIGHTS = {
  priceAction: 0.2,
  technical: 0.25,
  optionChain: 0.3,
  volume: 0.15,
  quantitative: 0.1,
} as const;

// Navigation items
export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/recommendations", label: "Recommendations", icon: "Target" },
  { href: "/option-chain", label: "Option Chain", icon: "TableProperties" },
  { href: "/scanner", label: "Market Scanner", icon: "Scan" },
  { href: "/market-breadth", label: "Market Breadth", icon: "BarChart3" },
  { href: "/watchlist", label: "Watchlist", icon: "Eye" },
  { href: "/backtesting", label: "Backtesting", icon: "FlaskConical" },
  { href: "/alerts", label: "Alerts", icon: "Bell" },
  { href: "/settings", label: "Settings", icon: "Settings" },
  { href: "/profile", label: "Profile", icon: "User" },
] as const;

// Risk level config
export const RISK_LEVELS = {
  LOW: { label: "Low", color: "#10b981", bg: "rgba(16,185,129,0.15)" },
  MEDIUM: { label: "Medium", color: "#f59e0b", bg: "rgba(245,158,11,0.15)" },
  HIGH: { label: "High", color: "#ef4444", bg: "rgba(239,68,68,0.15)" },
} as const;

// Score thresholds
export const SCORE_THRESHOLDS = {
  high: 70,
  medium: 40,
} as const;

export const DISCLAIMER =
  "All recommendations are probabilistic and for educational purposes only. Past performance does not guarantee future results. Options trading involves significant risk of loss. Always do your own research before making any trading decisions.";
