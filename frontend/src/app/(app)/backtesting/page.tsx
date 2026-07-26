"use client";

import { useState } from "react";
import { FlaskConical, Play, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import MiniSparkline from "@/components/charts/MiniSparkline";
import { generateBacktestResult } from "@/lib/mockData";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import type { BacktestResult } from "@/lib/types";

export default function BacktestingPage() {
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    symbol: "NIFTY", startDate: "2025-01-01", endDate: "2025-06-30",
    capital: "100000", strategy: "momentum", riskLevel: "MEDIUM",
  });

  const runBacktest = () => {
    setLoading(true);
    setTimeout(() => { setResult(generateBacktestResult()); setLoading(false); }, 1500);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Backtesting</h1>
        <p className="text-sm text-muted-foreground mt-1">Test strategies using historical market data</p>
      </div>

      {/* Config Form */}
      <div className="glass-card p-6">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Strategy Configuration</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <FormField label="Symbol">
            <select value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value })} className="w-full h-10 px-3 rounded-lg bg-background border border-border-default text-sm focus:outline-none focus:border-primary/50">
              <option>NIFTY</option><option>BANKNIFTY</option><option>FINNIFTY</option>
            </select>
          </FormField>
          <FormField label="Start Date">
            <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="w-full h-10 px-3 rounded-lg bg-background border border-border-default text-sm focus:outline-none focus:border-primary/50" />
          </FormField>
          <FormField label="End Date">
            <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="w-full h-10 px-3 rounded-lg bg-background border border-border-default text-sm focus:outline-none focus:border-primary/50" />
          </FormField>
          <FormField label="Capital (₹)">
            <input type="number" value={form.capital} onChange={(e) => setForm({ ...form, capital: e.target.value })} className="w-full h-10 px-3 rounded-lg bg-background border border-border-default text-sm focus:outline-none focus:border-primary/50" />
          </FormField>
          <FormField label="Strategy">
            <select value={form.strategy} onChange={(e) => setForm({ ...form, strategy: e.target.value })} className="w-full h-10 px-3 rounded-lg bg-background border border-border-default text-sm focus:outline-none focus:border-primary/50">
              <option value="momentum">Momentum</option><option value="mean_reversion">Mean Reversion</option>
              <option value="breakout">Breakout</option><option value="trend_following">Trend Following</option>
            </select>
          </FormField>
          <FormField label="Risk Level">
            <select value={form.riskLevel} onChange={(e) => setForm({ ...form, riskLevel: e.target.value })} className="w-full h-10 px-3 rounded-lg bg-background border border-border-default text-sm focus:outline-none focus:border-primary/50">
              <option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option>
            </select>
          </FormField>
        </div>
        <button onClick={runBacktest} disabled={loading}
          className="mt-4 flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-gray-900 font-semibold text-sm hover:bg-primary-hover transition-all disabled:opacity-50">
          {loading ? <span className="animate-spin">⟳</span> : <Play size={16} />}
          {loading ? "Running..." : "Run Backtest"}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4 animate-fade-in">
          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <MetricCard label="Net P&L" value={formatCurrency(result.netPnL)} color={result.netPnL >= 0 ? "text-emerald-400" : "text-red-400"} />
            <MetricCard label="Win Rate" value={`${result.winRate}%`} color={result.winRate >= 50 ? "text-emerald-400" : "text-red-400"} />
            <MetricCard label="Profit Factor" value={result.profitFactor.toString()} color={result.profitFactor >= 1.5 ? "text-emerald-400" : "text-yellow-400"} />
            <MetricCard label="Sharpe Ratio" value={result.sharpeRatio.toString()} color={result.sharpeRatio >= 1 ? "text-emerald-400" : "text-yellow-400"} />
            <MetricCard label="Max Drawdown" value={`${result.maximumDrawdown}%`} color="text-red-400" />
            <MetricCard label="Total Trades" value={result.totalTrades.toString()} />
            <MetricCard label="Avg Profit" value={formatCurrency(result.averageProfit)} color="text-emerald-400" />
            <MetricCard label="Avg Loss" value={formatCurrency(result.averageLoss)} color="text-red-400" />
            <MetricCard label="Total Profit" value={formatCurrency(result.totalProfit)} color="text-emerald-400" />
            <MetricCard label="Total Loss" value={formatCurrency(result.totalLoss)} color="text-red-400" />
          </div>

          {/* Equity Curve */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Equity Curve</h3>
            <MiniSparkline data={result.equityCurve.map((p) => p.value)} width={800} height={200} showArea />
          </div>

          {/* Trade Log */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Trade Log ({result.trades.length} trades)</h3>
            <div className="overflow-x-auto max-h-80 overflow-y-auto">
              <table className="data-table">
                <thead>
                  <tr><th>#</th><th>Direction</th><th>Strike</th><th>Entry</th><th>Exit</th><th>P&L</th><th>P&L %</th></tr>
                </thead>
                <tbody>
                  {result.trades.map((t, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td><span className={`badge ${t.direction === "BUY CALL" ? "badge-call" : "badge-put"}`}>{t.direction}</span></td>
                      <td>{t.strikePrice}</td>
                      <td>{formatCurrency(t.entryPrice)}</td>
                      <td>{formatCurrency(t.exitPrice)}</td>
                      <td className={t.pnl >= 0 ? "text-emerald-400" : "text-red-400"}>{formatCurrency(t.pnl)}</td>
                      <td className={t.pnlPercent >= 0 ? "text-emerald-400" : "text-red-400"}>{formatPercent(t.pnlPercent)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function MetricCard({ label, value, color = "" }: { label: string; value: string; color?: string }) {
  return (
    <div className="glass-card p-4 text-center">
      <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className={`text-xl font-bold mt-1 ${color}`}>{value}</p>
    </div>
  );
}
