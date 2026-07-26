"use client";

import { useState } from "react";
import { Search, Building, AlertTriangle, ExternalLink, Globe } from "lucide-react";
import { formatCurrency, formatCompact } from "@/lib/formatters";

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
    <div className="space-y-6 animate-fade-in max-w-[1200px] mx-auto">
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
          
          {/* Company Header & Summary Grid */}
          <div className="glass-card p-6 space-y-6 border border-border-default shadow-lg">
            
            {/* Top Row: Name, links */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">{data.info.name}</h2>
                <div className="flex items-center gap-4 mt-2">
                  <span className="badge badge-neutral text-xs">{data.symbol}</span>
                  {data.info.website && (
                    <a href={data.info.website} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                      <Globe size={12} /> Website
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* About / Description */}
            <div className="text-sm text-muted-foreground leading-relaxed line-clamp-3 hover:line-clamp-none transition-all duration-300">
              <span className="font-semibold text-foreground">About: </span>
              {data.info.about}
            </div>

            {/* Screener Style Key Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pt-4 border-t border-border-default bg-surface/30 p-4 rounded-xl">
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

          {/* Financial Statements */}
          <FinancialTable 
            title="Profit & Loss" 
            subtitle="Consolidated Figures in ₹ Crores / Millions" 
            data={data.profitAndLoss} 
          />
          
          <FinancialTable 
            title="Balance Sheet" 
            subtitle="Consolidated Figures in ₹ Crores / Millions" 
            data={data.balanceSheet} 
          />
          
          <FinancialTable 
            title="Cash Flows" 
            subtitle="Consolidated Figures in ₹ Crores / Millions" 
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
    <div className="flex flex-col justify-between py-1 border-b border-border-default/50 border-dotted md:border-none md:pb-0">
      <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">{label}</span>
      <span className="text-lg font-bold text-foreground mt-0.5">{value}</span>
    </div>
  );
}

function FinancialTable({ title, subtitle, data }: { title: string; subtitle: string; data: FinancialSection }) {
  if (!data || !data.dates || data.dates.length === 0) return null;

  return (
    <div className="glass-card overflow-hidden border border-border-default shadow-md">
      <div className="p-5 border-b border-border-default bg-surface/50">
        <h3 className="text-xl font-bold tracking-tight">{title}</h3>
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      </div>
      <div className="overflow-x-auto w-full">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-default bg-surface/20">
              <th className="sticky left-0 bg-background/95 backdrop-blur z-10 text-left font-semibold text-muted-foreground py-3 pl-5 min-w-[280px]">
                Metric
              </th>
              {data.dates.map((date, idx) => (
                <th key={idx} className="text-right font-semibold text-muted-foreground py-3 px-4 min-w-[110px]">
                  {date}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-default/30">
            {data.rows.map((row, i) => {
              // Highlight summary rows visually
              const isSummaryRow = row.metric.includes("Total") || row.metric.includes("Net Profit") || row.metric.includes("Operating");
              return (
                <tr key={i} className={`hover:bg-surface-hover/50 transition-colors ${isSummaryRow ? "bg-surface/10 font-medium" : ""}`}>
                  <td className="sticky left-0 bg-background/95 backdrop-blur z-10 py-2.5 pl-5 text-foreground/90 whitespace-nowrap overflow-hidden text-ellipsis max-w-[280px]" title={row.metric}>
                    {row.metric}
                  </td>
                  {row.values.map((val, vIdx) => (
                    <td key={vIdx} className={`text-right py-2.5 px-4 tabular-nums ${val !== null && val < 0 ? "text-red-400" : "text-foreground"}`}>
                      {val !== null ? formatCompact(val) : "-"}
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
