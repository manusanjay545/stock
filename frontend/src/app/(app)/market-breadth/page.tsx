"use client";

import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from "lucide-react";
import MiniSparkline from "@/components/charts/MiniSparkline";
import { generateMarketOverview } from "@/lib/mockData";
import { formatCurrency, formatPercent } from "@/lib/formatters";

export default function MarketBreadthPage() {
  const [overview, setOverview] = useState<ReturnType<typeof generateMarketOverview> | null>(null);

  useEffect(() => {
    setOverview(generateMarketOverview());
  }, []);

  if (!overview) return <div className="skeleton h-96 w-full" />;

  const sectors = [
    { name: "IT", change: (Math.random() - 0.3) * 4 },
    { name: "Banking", change: (Math.random() - 0.4) * 5 },
    { name: "Pharma", change: (Math.random() - 0.5) * 3 },
    { name: "Auto", change: (Math.random() - 0.45) * 4 },
    { name: "FMCG", change: (Math.random() - 0.4) * 2 },
    { name: "Metal", change: (Math.random() - 0.5) * 6 },
    { name: "Energy", change: (Math.random() - 0.35) * 3 },
    { name: "Realty", change: (Math.random() - 0.5) * 5 },
    { name: "Infra", change: (Math.random() - 0.45) * 4 },
    { name: "Media", change: (Math.random() - 0.5) * 3 },
    { name: "PSU Bank", change: (Math.random() - 0.4) * 4 },
    { name: "Fin Service", change: (Math.random() - 0.35) * 3 },
  ];

  const advancers = Math.floor(Math.random() * 30 + 20);
  const decliners = 50 - advancers;
  const breadthRatio = advancers / (advancers + decliners);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Market Breadth</h1>
        <p className="text-sm text-muted-foreground mt-1">Sector performance and breadth indicators</p>
      </div>

      {/* Breadth Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-5 text-center">
          <p className="text-sm text-muted-foreground">Advance / Decline</p>
          <div className="flex items-center justify-center gap-4 mt-3">
            <div>
              <p className="text-2xl font-bold text-emerald-400">{advancers}</p>
              <p className="text-xs text-muted-foreground">Advancing</p>
            </div>
            <div className="w-px h-10 bg-border-default" />
            <div>
              <p className="text-2xl font-bold text-red-400">{decliners}</p>
              <p className="text-xs text-muted-foreground">Declining</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-5 text-center">
          <p className="text-sm text-muted-foreground">Breadth Ratio</p>
          <p className={`text-3xl font-bold mt-3 ${breadthRatio > 0.55 ? "text-emerald-400" : breadthRatio < 0.45 ? "text-red-400" : "text-yellow-400"}`}>
            {breadthRatio.toFixed(2)}
          </p>
          <div className="w-full h-2 rounded-full bg-surface mt-3 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all" style={{ width: `${breadthRatio * 100}%` }} />
          </div>
        </div>
        <div className="glass-card p-5 text-center">
          <p className="text-sm text-muted-foreground">Market Sentiment</p>
          <div className="flex items-center justify-center gap-2 mt-3">
            {overview.marketSentiment === "BULLISH" ? (
              <><TrendingUp size={28} className="text-emerald-400" /><p className="text-2xl font-bold text-emerald-400">Bullish</p></>
            ) : overview.marketSentiment === "BEARISH" ? (
              <><TrendingDown size={28} className="text-red-400" /><p className="text-2xl font-bold text-red-400">Bearish</p></>
            ) : (
              <p className="text-2xl font-bold text-yellow-400">Sideways</p>
            )}
          </div>
        </div>
      </div>

      {/* Sector Heatmap */}
      <div className="glass-card p-6">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Sector Heatmap</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
          {sectors.sort((a, b) => b.change - a.change).map((sector) => {
            const positive = sector.change >= 0;
            const intensity = Math.min(Math.abs(sector.change) / 3, 1);
            return (
              <div key={sector.name}
                className="p-4 rounded-xl text-center transition-all hover:scale-105"
                style={{
                  backgroundColor: positive
                    ? `rgba(16, 185, 129, ${0.08 + intensity * 0.2})`
                    : `rgba(239, 68, 68, ${0.08 + intensity * 0.2})`,
                  border: `1px solid ${positive ? `rgba(16,185,129,${0.15 + intensity * 0.25})` : `rgba(239,68,68,${0.15 + intensity * 0.25})`}`,
                }}
              >
                <p className="text-sm font-semibold">{sector.name}</p>
                <p className={`text-lg font-bold mt-1 flex items-center justify-center gap-1 ${positive ? "text-emerald-400" : "text-red-400"}`}>
                  {positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {formatPercent(sector.change)}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Index Comparison */}
      <div className="glass-card p-6">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Index Comparison</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {overview.indices.map((idx) => (
            <div key={idx.symbol} className="p-4 rounded-xl border border-border-default bg-background/40 space-y-2">
              <p className="text-sm font-semibold text-muted-foreground">{idx.symbol}</p>
              <p className="text-xl font-bold">{formatCurrency(idx.price, 0)}</p>
              <div className={`flex items-center gap-1 text-sm font-semibold ${idx.change >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {idx.change >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {formatPercent(idx.changePercent)}
              </div>
              <MiniSparkline data={Array.from({ length: 30 }, () => idx.price * (0.99 + Math.random() * 0.02))} width={180} height={36} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
