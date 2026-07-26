"use client";

import { useState, useEffect } from "react";
import { Scan, Zap, TrendingUp, TrendingDown, BarChart3, Activity, Filter, Lock } from "lucide-react";
import ScoreGauge from "@/components/charts/ScoreGauge";
import { generateScannerResults } from "@/lib/mockData";
import { timeAgo } from "@/lib/formatters";
import { usePlan } from "@/context/PlanContext";
import { getLimit } from "@/lib/plans";
import type { ScannerResult, ScannerCategory } from "@/lib/types";
import Link from "next/link";

const CATEGORY_CONFIG: Record<ScannerCategory, { label: string; icon: React.ElementType; color: string }> = {
  BREAKOUT: { label: "Breakout", icon: Zap, color: "text-cyan-400" },
  MOMENTUM: { label: "Momentum", icon: TrendingUp, color: "text-emerald-400" },
  TREND_REVERSAL: { label: "Trend Reversal", icon: Activity, color: "text-violet-400" },
  HIGH_VOLUME: { label: "High Volume", icon: BarChart3, color: "text-yellow-400" },
  OI_CHANGE: { label: "OI Change", icon: TrendingDown, color: "text-orange-400" },
  HIGH_CONFIDENCE: { label: "High Confidence", icon: Scan, color: "text-pink-400" },
};

export default function ScannerPage() {
  const [results, setResults] = useState<ScannerResult[]>([]);
  const [catFilter, setCatFilter] = useState<ScannerCategory | "ALL">("ALL");
  const { plan } = usePlan();
  const maxResults = getLimit(plan, "maxScannerResults");

  useEffect(() => {
    setResults(generateScannerResults(18));
    const timer = setInterval(() => setResults(generateScannerResults(18)), 15000);
    return () => clearInterval(timer);
  }, []);

  const allFiltered = catFilter === "ALL" ? results : results.filter((r) => r.category === catFilter);
  const visible = allFiltered.slice(0, maxResults);
  const hiddenCount = allFiltered.length - visible.length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Market Scanner</h1>
        <p className="text-sm text-muted-foreground mt-1">Auto-detected opportunities across all markets</p>
      </div>

      {/* Category filter chips */}
      <div className="flex flex-wrap gap-2">
        <FilterChip active={catFilter === "ALL"} onClick={() => setCatFilter("ALL")} label="All" count={results.length} />
        {(Object.keys(CATEGORY_CONFIG) as ScannerCategory[]).map((cat) => (
          <FilterChip key={cat} active={catFilter === cat} onClick={() => setCatFilter(cat)}
            label={CATEGORY_CONFIG[cat].label} count={results.filter((r) => r.category === cat).length} />
        ))}
      </div>

      {/* Scanner Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {visible.map((result) => {
          const config = CATEGORY_CONFIG[result.category];
          const Icon = config.icon;
          const isCall = result.direction === "BUY CALL";
          return (
            <div key={result.id} className="glass-card glass-card-hover p-5 space-y-3 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon size={16} className={config.color} />
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{config.label}</span>
                </div>
                <ScoreGauge score={result.score} size={44} strokeWidth={3} />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold">{result.symbol}</span>
                <span className={`badge ${isCall ? "badge-call" : "badge-put"}`}>{result.direction}</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{result.description}</p>
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border-default">
                <span>Strike: {result.strikePrice}</span>
                <span>Confidence: {result.confidence}%</span>
                <span>{timeAgo(result.detectedAt)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Upgrade CTA */}
      {hiddenCount > 0 && (
        <div className="glass-card p-6 text-center space-y-3 border border-amber-500/20">
          <p className="text-sm text-muted-foreground">
            <span className="font-bold text-foreground">{hiddenCount} more scanner results</span> are hidden on the Free plan.
          </p>
          <Link href="/pricing" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-gray-900 font-bold text-sm hover:from-amber-400 hover:to-orange-400 transition-all shadow-lg shadow-amber-500/20">
            <Lock size={14} /> Upgrade to Pro
          </Link>
        </div>
      )}
    </div>
  );
}

function FilterChip({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count: number }) {
  return (
    <button onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
        active ? "bg-primary/15 text-primary border border-primary/30" : "text-muted-foreground hover:text-foreground border border-border-default hover:bg-surface-hover"
      }`}
    >
      {label} <span className="ml-1 opacity-60">({count})</span>
    </button>
  );
}
