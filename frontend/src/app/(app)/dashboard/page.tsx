"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp, TrendingDown, Activity, Zap, AlertTriangle,
  ArrowUpRight, ArrowDownRight, BarChart3, Target, Clock,
} from "lucide-react";
import ScoreGauge from "@/components/charts/ScoreGauge";
import MiniSparkline from "@/components/charts/MiniSparkline";
import { generateDashboard } from "@/lib/mockData";
import { formatCurrency, formatPercent, formatCompact, timeAgo, getScoreColor } from "@/lib/formatters";
import type { DashboardData, Recommendation, MarketDataWithIndicators } from "@/lib/types";
import { DISCLAIMER } from "@/lib/constants";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    setData(generateDashboard());
    const timer = setInterval(() => setData(generateDashboard()), 30000);
    return () => clearInterval(timer);
  }, []);

  if (!data) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-32 w-full" />
        ))}
      </div>
    );
  }

  const { marketOverview, topOpportunities, recentAlerts, mostActiveStocks, latestRecommendations } = data;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Real-time market overview & top opportunities</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock size={14} />
          <span>Last updated: {new Date().toLocaleTimeString("en-IN")}</span>
        </div>
      </div>

      {/* Market Indices Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {marketOverview.indices.map((idx) => (
          <IndexCard key={idx.symbol} data={idx} />
        ))}
      </div>

      {/* Market Score + Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Overall Market Score */}
        <div className="glass-card p-6 flex flex-col items-center justify-center gap-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Overall Market Score</h3>
          <ScoreGauge score={marketOverview.overallScore} size={120} strokeWidth={8} label="/ 100" />
          <div className="flex items-center gap-2 mt-1">
            {marketOverview.marketSentiment === "BULLISH" ? (
              <span className="badge badge-call"><TrendingUp size={12} />Bullish</span>
            ) : marketOverview.marketSentiment === "BEARISH" ? (
              <span className="badge badge-put"><TrendingDown size={12} />Bearish</span>
            ) : (
              <span className="badge badge-neutral"><Activity size={12} />Sideways</span>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Quick Stats</h3>
          <div className="grid grid-cols-2 gap-4">
            <StatBox label="Active Signals" value={topOpportunities.length.toString()} icon={<Zap size={16} className="text-cyan-400" />} />
            <StatBox label="Avg Confidence" value={`${Math.round(topOpportunities.reduce((a, r) => a + r.confidence, 0) / topOpportunities.length)}%`} icon={<Target size={16} className="text-emerald-400" />} />
            <StatBox label="Active Alerts" value={recentAlerts.filter((a) => a.isActive).length.toString()} icon={<AlertTriangle size={16} className="text-yellow-400" />} />
            <StatBox label="Watchlist Items" value="8" icon={<BarChart3 size={16} className="text-violet-400" />} />
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Recent Alerts</h3>
          <div className="space-y-3">
            {recentAlerts.slice(0, 4).map((alert) => (
              <div key={alert.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-hover transition-colors">
                <div className={`w-2 h-2 rounded-full ${alert.isTriggered ? "bg-yellow-400" : "bg-emerald-400"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{alert.symbol} — {alert.alertType}</p>
                  <p className="text-xs text-muted-foreground">{alert.condition} {alert.threshold}</p>
                </div>
                <span className="text-[11px] text-muted">{alert.triggeredAt ? timeAgo(alert.triggeredAt) : "Pending"}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Opportunities */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Top Opportunities</h3>
          <a href="/recommendations" className="text-xs text-primary hover:text-primary-hover transition-colors">View All →</a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {topOpportunities.slice(0, 6).map((rec) => (
            <RecommendationMini key={rec.id} rec={rec} />
          ))}
        </div>
      </div>

      {/* Most Active Stocks */}
      <div className="glass-card p-6">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Most Active Stocks</h3>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Price</th>
                <th>Change</th>
                <th>Volume</th>
                <th>Rel. Vol</th>
                <th>Trend</th>
              </tr>
            </thead>
            <tbody>
              {mostActiveStocks.map((stock) => (
                <tr key={stock.symbol}>
                  <td className="font-semibold">{stock.symbol}</td>
                  <td>{formatCurrency(stock.price)}</td>
                  <td className={stock.change >= 0 ? "text-emerald-400" : "text-red-400"}>
                    <span className="flex items-center gap-1">
                      {stock.change >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                      {formatPercent(stock.changePercent)}
                    </span>
                  </td>
                  <td>{formatCompact(stock.volume)}</td>
                  <td>{stock.relativeVolume.toFixed(1)}x</td>
                  <td>
                    <MiniSparkline data={Array.from({ length: 20 }, () => stock.price * (0.98 + Math.random() * 0.04))} width={80} height={24} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────

function IndexCard({ data }: { data: MarketDataWithIndicators }) {
  const positive = data.change >= 0;
  return (
    <div className="glass-card glass-card-hover p-5 space-y-3 transition-all duration-300">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-muted-foreground">{data.symbol}</span>
        <span className={`badge ${positive ? "badge-call" : "badge-put"}`}>
          {data.trend}
        </span>
      </div>
      <p className="text-2xl font-bold tabular-nums">{formatCurrency(data.price, 0)}</p>
      <div className="flex items-center gap-2">
        {positive ? (
          <ArrowUpRight size={16} className="text-emerald-400" />
        ) : (
          <ArrowDownRight size={16} className="text-red-400" />
        )}
        <span className={`text-sm font-semibold ${positive ? "text-emerald-400" : "text-red-400"}`}>
          {data.change >= 0 ? "+" : ""}{data.change.toFixed(2)} ({formatPercent(data.changePercent)})
        </span>
      </div>
      <MiniSparkline
        data={Array.from({ length: 30 }, (_, i) => data.price + (Math.sin(i * 0.4) + Math.random() - 0.5) * data.price * 0.005)}
        width={200} height={32}
      />
    </div>
  );
}

function StatBox({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border border-border-default">
      {icon}
      <div>
        <p className="text-lg font-bold">{value}</p>
        <p className="text-[11px] text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function RecommendationMini({ rec }: { rec: Recommendation }) {
  const isCall = rec.direction === "BUY CALL";
  return (
    <div className="p-4 rounded-xl border border-border-default bg-background/40 hover:border-primary/30 transition-all space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm">{rec.symbol}</span>
          <span className={`badge ${isCall ? "badge-call" : "badge-put"}`}>{rec.direction}</span>
        </div>
        <ScoreGauge score={rec.overallScore} size={44} strokeWidth={3} />
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-muted-foreground">Strike</span>
          <p className="font-semibold">{rec.strikePrice}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Premium</span>
          <p className="font-semibold">{formatCurrency(rec.currentPremium)}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Target</span>
          <p className="font-semibold text-emerald-400">{formatCurrency(rec.target1)}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Stop Loss</span>
          <p className="font-semibold text-red-400">{formatCurrency(rec.stopLoss)}</p>
        </div>
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-border-default">
        <span className="text-[11px] text-muted-foreground">Confidence: {rec.confidence}%</span>
        <span className="text-[11px] text-muted-foreground">R:R {rec.riskRewardRatio}</span>
      </div>
    </div>
  );
}
