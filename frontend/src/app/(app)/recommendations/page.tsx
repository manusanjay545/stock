"use client";

import { useState, useEffect, useMemo } from "react";
import { Filter, ChevronDown, ChevronUp, Target, Shield, Clock, TrendingUp, TrendingDown, Lock } from "lucide-react";
import ScoreGauge from "@/components/charts/ScoreGauge";
import { ProBadge } from "@/components/ProGate";
import { generateRecommendations } from "@/lib/mockData";
import { formatCurrency, formatPercent, formatExpiry, timeAgo, getScoreColor } from "@/lib/formatters";
import { usePlan } from "@/context/PlanContext";
import { getLimit, canAccess } from "@/lib/plans";
import type { Recommendation, TradeDirection, RiskLevel } from "@/lib/types";
import Link from "next/link";

export default function RecommendationsPage() {
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dirFilter, setDirFilter] = useState<TradeDirection | "ALL">("ALL");
  const [riskFilter, setRiskFilter] = useState<RiskLevel | "ALL">("ALL");
  const [minScore, setMinScore] = useState(0);
  const { plan, isPro } = usePlan();

  const maxRecs = getLimit(plan, "maxRecommendations");
  const canSeeExplanation = canAccess(plan, "aiExplanation");

  useEffect(() => {
    setRecs(generateRecommendations(15));
  }, []);

  const filtered = useMemo(() => {
    return recs
      .filter((r) => dirFilter === "ALL" || r.direction === dirFilter)
      .filter((r) => riskFilter === "ALL" || r.riskLevel === riskFilter)
      .filter((r) => r.overallScore >= minScore);
  }, [recs, dirFilter, riskFilter, minScore]);

  const visibleRecs = filtered.slice(0, maxRecs);
  const hiddenCount = filtered.length - visibleRecs.length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Recommendations</h1>
        <p className="text-sm text-muted-foreground mt-1">AI-powered trade recommendations ranked by score</p>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-muted" />
          <span className="text-sm font-medium text-muted-foreground">Filters:</span>
        </div>
        <select value={dirFilter} onChange={(e) => setDirFilter(e.target.value as TradeDirection | "ALL")} className="h-9 px-3 rounded-lg bg-background border border-border-default text-sm focus:outline-none focus:border-primary/50">
          <option value="ALL">All Directions</option>
          <option value="BUY CALL">BUY CALL</option>
          <option value="BUY PUT">BUY PUT</option>
        </select>
        <select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value as RiskLevel | "ALL")} className="h-9 px-3 rounded-lg bg-background border border-border-default text-sm focus:outline-none focus:border-primary/50">
          <option value="ALL">All Risk</option>
          <option value="LOW">Low Risk</option>
          <option value="MEDIUM">Medium Risk</option>
          <option value="HIGH">High Risk</option>
        </select>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Min Score:</span>
          <input type="range" min={0} max={90} value={minScore} onChange={(e) => setMinScore(+e.target.value)} className="w-24 accent-cyan-500" />
          <span className="text-xs font-semibold w-6">{minScore}</span>
        </div>
        <span className="text-xs text-muted-foreground ml-auto">{filtered.length} results</span>
      </div>

      {/* Cards */}
      <div className="space-y-4">
        {visibleRecs.map((rec) => {
          const expanded = expandedId === rec.id;
          const isCall = rec.direction === "BUY CALL";
          return (
            <div key={rec.id} className="glass-card glass-card-hover overflow-hidden transition-all duration-300">
              {/* Main row */}
              <button onClick={() => setExpandedId(expanded ? null : rec.id)} className="w-full text-left p-5 flex flex-wrap items-center gap-6">
                <ScoreGauge score={rec.overallScore} size={56} strokeWidth={4} />
                <div className="min-w-[120px]">
                  <p className="text-lg font-bold">{rec.symbol}</p>
                  <span className={`badge ${isCall ? "badge-call" : "badge-put"}`}>{rec.direction}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-2 flex-1 text-sm">
                  <Field label="Strike" value={rec.strikePrice.toString()} />
                  <Field label="Premium" value={formatCurrency(rec.currentPremium)} />
                  <Field label="Entry" value={formatCurrency(rec.entryPrice)} />
                  <Field label="Expiry" value={formatExpiry(rec.expiry)} />
                  <Field label="Target 1" value={formatCurrency(rec.target1)} className="text-emerald-400" />
                  <Field label="Target 2" value={formatCurrency(rec.target2)} className="text-emerald-400" />
                  <Field label="Stop Loss" value={formatCurrency(rec.stopLoss)} className="text-red-400" />
                  <Field label="R:R Ratio" value={`${rec.riskRewardRatio}:1`} />
                </div>
                <div className="flex flex-col items-end gap-1">
                  <RiskBadge level={rec.riskLevel} />
                  <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock size={12} />{rec.holdingTime}</span>
                  <span className="text-xs text-muted-foreground">Conf: {rec.confidence}%</span>
                  {expanded ? <ChevronUp size={16} className="text-muted mt-1" /> : <ChevronDown size={16} className="text-muted mt-1" />}
                </div>
              </button>

              {/* Expanded AI Explanation */}
              {expanded && (
                <div className="border-t border-border-default p-5 space-y-4 animate-fade-in bg-background/30">
                  {canSeeExplanation ? (
                    <>
                      <h4 className="text-sm font-semibold text-primary flex items-center gap-2"><Target size={16} /> AI Analysis</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <ExplainSection title="Trend" text={rec.explanation.trend} />
                        <ExplainSection title="Momentum" text={rec.explanation.momentum} />
                        <ExplainSection title="Technical Indicators" text={rec.explanation.technicalIndicators} />
                        <ExplainSection title="Option Chain" text={rec.explanation.optionChain} />
                        <ExplainSection title="Volume" text={rec.explanation.volume} />
                        <ExplainSection title="Quantitative" text={rec.explanation.quantitativeSignals} />
                        <ExplainSection title="Volatility" text={rec.explanation.volatility} />
                        <ExplainSection title="Market Sentiment" text={rec.explanation.marketSentiment} />
                      </div>
                      <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
                        <h5 className="text-sm font-semibold text-primary mb-1">Strike Selection Rationale</h5>
                        <p className="text-sm text-muted-foreground">{rec.explanation.strikeRationale}</p>
                      </div>
                      <div className="p-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
                        <h5 className="text-sm font-semibold text-emerald-400 mb-1">Final Recommendation</h5>
                        <p className="text-sm text-muted-foreground">{rec.explanation.finalRecommendation}</p>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-6 space-y-3">
                      <div className="w-12 h-12 rounded-full bg-amber-500/15 flex items-center justify-center mx-auto">
                        <Lock size={24} className="text-amber-400" />
                      </div>
                      <h4 className="text-lg font-bold">AI Analysis is a Pro Feature</h4>
                      <p className="text-sm text-muted-foreground max-w-md mx-auto">
                        Upgrade to Pro to unlock detailed AI-powered explanations for every recommendation including trend, momentum, option chain analysis, and strike rationale.
                      </p>
                      <Link href="/pricing" className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-gray-900 font-bold text-sm hover:from-amber-400 hover:to-orange-400 transition-all">
                        <Lock size={14} /> Upgrade to Pro
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Upgrade CTA when FREE user has hidden results */}
      {hiddenCount > 0 && (
        <div className="glass-card p-6 text-center space-y-3 border border-amber-500/20">
          <p className="text-sm text-muted-foreground">
            <span className="font-bold text-foreground">{hiddenCount} more recommendations</span> are available with Pro.
          </p>
          <Link href="/pricing" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-gray-900 font-bold text-sm hover:from-amber-400 hover:to-orange-400 transition-all shadow-lg shadow-amber-500/20">
            <Lock size={14} /> Unlock All Recommendations
          </Link>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div>
      <span className="text-xs text-muted-foreground">{label}</span>
      <p className={`font-semibold ${className}`}>{value}</p>
    </div>
  );
}

function RiskBadge({ level }: { level: RiskLevel }) {
  const cls = level === "LOW" ? "badge-call" : level === "MEDIUM" ? "badge-medium" : "badge-low-risk";
  return <span className={`badge ${cls}`}><Shield size={10} />{level}</span>;
}

function ExplainSection({ title, text }: { title: string; text: string }) {
  return (
    <div className="p-3 rounded-lg bg-surface/50 border border-border-default">
      <h5 className="text-xs font-semibold text-muted-foreground uppercase mb-1">{title}</h5>
      <p className="text-sm leading-relaxed">{text}</p>
    </div>
  );
}
