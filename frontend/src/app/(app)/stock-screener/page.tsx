"use client";

import { useState, useEffect } from "react";
import { Search, Filter, ArrowUpRight, ArrowDownRight, RefreshCw, AlertTriangle } from "lucide-react";
import { formatCurrency, formatPercent, formatCompact } from "@/lib/formatters";

type ScreenerResult = {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  peRatio: number;
  marketCap: number;
};

export default function StockScreenerPage() {
  const [results, setResults] = useState<ScreenerResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [filters, setFilters] = useState({
    minPrice: "",
    maxPrice: "",
    minVolume: "100000",
    minChangePercent: "",
    maxChangePercent: "",
    minPeRatio: ""
  });

  const runScreener = async () => {
    setLoading(true);
    setError(null);
    
    // Convert string filters to numbers for API
    const apiFilters: any = {};
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== "") apiFilters[k] = Number(v);
    });

    try {
      const res = await fetch(`http://localhost:8000/api/v1/screener`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiFilters)
      });
      const data = await res.json();
      
      if (data.success) {
        setResults(data.data);
      } else {
        setError(data.message || "Failed to run screener.");
      }
    } catch (err) {
      setError("Network error occurred while fetching data.");
    } finally {
      setLoading(false);
    }
  };

  // Run on mount
  useEffect(() => {
    runScreener();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Stock Screener</h1>
          <p className="text-sm text-muted-foreground mt-1">Filter and discover high-probability setups</p>
        </div>
        <button 
          onClick={runScreener}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/15 text-primary border border-primary/30 text-sm font-medium hover:bg-primary/25 transition-all disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> 
          {loading ? "Scanning..." : "Run Scan"}
        </button>
      </div>

      {/* Filters */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={16} className="text-primary" />
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Screening Criteria</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          <FilterInput label="Min Price" value={filters.minPrice} onChange={(v) => setFilters({...filters, minPrice: v})} />
          <FilterInput label="Max Price" value={filters.maxPrice} onChange={(v) => setFilters({...filters, maxPrice: v})} />
          <FilterInput label="Min Volume" value={filters.minVolume} onChange={(v) => setFilters({...filters, minVolume: v})} />
          <FilterInput label="Min Change %" value={filters.minChangePercent} onChange={(v) => setFilters({...filters, minChangePercent: v})} />
          <FilterInput label="Max Change %" value={filters.maxChangePercent} onChange={(v) => setFilters({...filters, maxChangePercent: v})} />
          <FilterInput label="Min P/E Ratio" value={filters.minPeRatio} onChange={(v) => setFilters({...filters, minPeRatio: v})} />
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-3">
          <AlertTriangle size={18} />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Results Table */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-border-default flex justify-between items-center bg-surface/50">
          <h3 className="text-sm font-semibold">Scan Results</h3>
          <span className="badge badge-neutral">{results.length} Stocks Found</span>
        </div>
        
        {loading && results.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
            <RefreshCw size={32} className="animate-spin mb-4 text-primary" />
            <p>Scanning the market...</p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="sticky top-0 bg-background z-10 text-left">Symbol</th>
                  <th className="sticky top-0 bg-background z-10 text-right">Price</th>
                  <th className="sticky top-0 bg-background z-10 text-right">Change</th>
                  <th className="sticky top-0 bg-background z-10 text-right">Change %</th>
                  <th className="sticky top-0 bg-background z-10 text-right">Volume</th>
                  <th className="sticky top-0 bg-background z-10 text-right">P/E Ratio</th>
                  <th className="sticky top-0 bg-background z-10 text-right">Market Cap</th>
                </tr>
              </thead>
              <tbody>
                {results.length > 0 ? results.map((stock) => {
                  const positive = stock.changePercent >= 0;
                  return (
                    <tr key={stock.symbol} className="hover:bg-surface/30">
                      <td>
                        <div className="font-bold text-foreground">{stock.symbol}</div>
                        <div className="text-[10px] text-muted-foreground truncate max-w-[120px]">{stock.name}</div>
                      </td>
                      <td className="text-right font-semibold">{formatCurrency(stock.price)}</td>
                      <td className={`text-right ${positive ? "text-emerald-400" : "text-red-400"}`}>
                        {positive ? "+" : ""}{stock.change.toFixed(2)}
                      </td>
                      <td className="text-right">
                        <span className={`inline-flex items-center gap-1 badge ${positive ? "badge-call" : "badge-put"}`}>
                          {positive ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                          {formatPercent(stock.changePercent)}
                        </span>
                      </td>
                      <td className="text-right">{formatCompact(stock.volume)}</td>
                      <td className="text-right">{stock.peRatio ? stock.peRatio.toFixed(2) : "-"}</td>
                      <td className="text-right">{formatCompact(stock.marketCap)}</td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-muted-foreground">
                      No stocks matched your screening criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function FilterInput({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1.5">{label}</label>
      <input 
        type="number" 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-9 px-3 rounded-lg bg-background border border-border-default text-sm focus:outline-none focus:border-primary/50"
      />
    </div>
  );
}
