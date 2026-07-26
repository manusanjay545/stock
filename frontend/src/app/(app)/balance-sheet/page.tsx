"use client";

import { useState } from "react";
import { Search, AlertTriangle, ExternalLink, Globe, LineChart } from "lucide-react";
import { formatCurrency, formatCompact } from "@/lib/formatters";
import Link from "next/link";

type FinancialRow = {
  metric: string;
  values: (number | null)[];
};

type FinancialSection = {
  dates: string[];
  rows: FinancialRow[];
};

type ScreenerData = {
  symbol: string;
  info: {
    name: string;
    about: string;
    website: string;
    marketCap: number;
    currentPrice: number;
    highLow: string;
    peRatio: number;
    bookValue: number;
    dividendYield: number;
    roce: number;
    roe: number;
    faceValue: number;
  };
  profitAndLoss: FinancialSection;
  balanceSheet: FinancialSection;
  cashFlow: FinancialSection;
};

export default function FundamentalsPage() {
  const [symbol, setSymbol] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ScreenerData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchFundamentals = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol.trim()) return;
    
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`http://localhost:8000/api/v1/fundamentals/${symbol}`);
      const result = await res.json();
      
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.message || "Failed to fetch fundamental data.");
      }
    } catch (err) {
      setError("Network error occurred while fetching data. Make sure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-[1200px] mx-auto pb-12">
      {/* Search Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Financial Analysis</h1>
          <p className="text-sm text-muted-foreground mt-1">Deep dive into company fundamentals</p>
        </div>
        <form onSubmit={fetchFundamentals} className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input 
              type="text" 
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              placeholder="Search company (e.g. RELIANCE)" 
              className="w-full h-10 pl-9 pr-4 rounded-lg bg-surface border border-border-default text-sm focus:outline-none focus:border-primary/50 transition-all shadow-sm"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading || !symbol}
            className="h-10 px-6 rounded-lg bg-primary text-gray-900 font-semibold text-sm hover:bg-primary-hover transition-colors disabled:opacity-50"
          >
            {loading ? "Loading..." : "Search"}
          </button>
        </form>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-3">
          <AlertTriangle size={18} />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Main Content Area */}
      {data && !loading && (
        <div className="space-y-8 animate-fade-in">
          
          {/* Company Header & Summary Grid (Screener.in style) */}
          <div className="bg-surface border border-border-default shadow-lg rounded-xl overflow-hidden">
            
            <div className="p-6 md:p-8 space-y-6">
              {/* Top Row: Name, links, and Chart Button */}
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight text-foreground">{data.info.name}</h2>
                  <div className="flex items-center gap-4 mt-3">
                    <span className="px-2 py-1 rounded bg-surface-hover border border-border-default text-xs font-semibold text-muted-foreground">{data.symbol}</span>
                    {data.info.website && (
                      <a href={data.info.website} target="_blank" rel="noreferrer" className="text-xs text-primary hover:text-primary-hover flex items-center gap-1 transition-colors">
                        <Globe size={14} /> Website
                      </a>
                    )}
                  </div>
                </div>
                
                {/* View Chart Button */}
                <Link href={`/chart?symbol=${data.symbol}`} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-400 transition-all shadow-[0_0_15px_rgba(16,185,129,0.15)] font-semibold text-sm">
                  <LineChart size={18} />
                  View Technical Chart
                </Link>
              </div>

              {/* About / Description */}
              <div className="text-[13px] text-muted-foreground leading-relaxed">
                {data.info.about}
              </div>
            </div>

            {/* Dense Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-[1px] bg-border-default border-t border-border-default">
              <SummaryMetric label="Market Cap" value={`₹ ${formatCompact(data.info.marketCap)}`} />
              <SummaryMetric label="Current Price" value={`₹ ${formatCurrency(data.info.currentPrice)}`} />
              <SummaryMetric label="High / Low" value={`₹ ${data.info.highLow}`} />
              <SummaryMetric label="Stock P/E" value={data.info.peRatio ? data.info.peRatio.toFixed(2) : "-"} />
              <SummaryMetric label="Book Value" value={`₹ ${formatCurrency(data.info.bookValue)}`} />
              <SummaryMetric label="Dividend Yield" value={`${data.info.dividendYield.toFixed(2)} %`} />
              <SummaryMetric label="ROCE" value={`${data.info.roce.toFixed(2)} %`} />
              <SummaryMetric label="ROE" value={`${data.info.roe.toFixed(2)} %`} />
              <SummaryMetric label="Face Value" value={`₹ ${data.info.faceValue.toFixed(2)}`} />
            </div>
          </div>

          {/* Financial Statements (Dense Tables) */}
          <FinancialTable 
            title="Profit & Loss" 
            subtitle="Consolidated Figures in ₹ Crores" 
            data={data.profitAndLoss} 
          />
          
          <FinancialTable 
            title="Balance Sheet" 
            subtitle="Consolidated Figures in ₹ Crores" 
            data={data.balanceSheet} 
          />
          
          <FinancialTable 
            title="Cash Flows" 
            subtitle="Consolidated Figures in ₹ Crores" 
            data={data.cashFlow} 
          />
          
        </div>
      )}
    </div>
  );
}

// ── UI Components ───────────────────────────────────────────

function SummaryMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col justify-center px-6 py-4 bg-surface hover:bg-surface-hover/50 transition-colors">
      <span className="text-[12px] text-muted-foreground font-medium mb-1">{label}</span>
      <span className="text-[15px] font-bold text-foreground">{value}</span>
    </div>
  );
}

function FinancialTable({ title, subtitle, data }: { title: string; subtitle: string; data: FinancialSection }) {
  if (!data || !data.dates || data.dates.length === 0) return null;

  return (
    <div className="bg-surface rounded-xl overflow-hidden border border-border-default shadow-md">
      <div className="px-5 py-4 border-b border-border-default flex items-baseline justify-between">
        <h3 className="text-lg font-bold text-foreground">{title}</h3>
        <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">{subtitle}</p>
      </div>
      <div className="overflow-x-auto w-full max-w-[100vw] custom-scrollbar">
        <table className="w-full text-[13px] border-collapse">
          <thead>
            <tr className="border-b border-border-default bg-surface">
              <th className="sticky left-0 bg-surface z-10 text-left font-medium text-muted-foreground py-2.5 px-5 min-w-[240px] border-r border-border-default/50">
                Metric
              </th>
              {data.dates.map((date, idx) => (
                <th key={idx} className="text-right font-medium text-muted-foreground py-2.5 px-4 min-w-[100px]">
                  {date}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, i) => {
              // Highlight summary rows visually
              const isSummaryRow = row.metric.includes("Total") || row.metric.includes("Net Profit") || row.metric.includes("Operating") || row.metric.includes("EPS");
              return (
                <tr key={i} className={`border-b border-border-default/30 last:border-0 hover:bg-primary/5 transition-colors ${i % 2 !== 0 ? "bg-surface-hover/30" : "bg-surface"} ${isSummaryRow ? "font-semibold" : ""}`}>
                  <td className="sticky left-0 py-2 px-5 text-foreground/90 whitespace-nowrap overflow-hidden text-ellipsis max-w-[240px] border-r border-border-default/50" 
                      style={{ backgroundColor: i % 2 !== 0 ? 'var(--color-surface-hover)' : 'var(--color-surface)', zIndex: 10 }}>
                    {row.metric}
                  </td>
                  {row.values.map((val, vIdx) => (
                    <td key={vIdx} className={`text-right py-2 px-4 tabular-nums ${val !== null && val < 0 ? "text-red-400" : "text-foreground"}`}>
                      {val !== null ? formatCompact(val) : ""}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

