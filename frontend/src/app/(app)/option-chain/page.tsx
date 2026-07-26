"use client";

import { useState, useEffect, useMemo } from "react";
import { generateOptionChain } from "@/lib/mockData";
import { formatCurrency, formatCompact, formatPercent } from "@/lib/formatters";
import type { OptionChainData, OptionChainRow } from "@/lib/types";
import { MARKET_INDICES } from "@/lib/constants";

export default function OptionChainPage() {
  const [symbol, setSymbol] = useState("NIFTY");
  const [chain, setChain] = useState<OptionChainData | null>(null);

  useEffect(() => {
    setChain(generateOptionChain(symbol));
    const timer = setInterval(() => setChain(generateOptionChain(symbol)), 10000);
    return () => clearInterval(timer);
  }, [symbol]);

  if (!chain) return <div className="skeleton h-96 w-full" />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Option Chain</h1>
          <p className="text-sm text-muted-foreground mt-1">Analyze OI, IV, Greeks, and strike-level data</p>
        </div>
        <div className="flex items-center gap-3">
          {MARKET_INDICES.map((idx) => (
            <button key={idx.symbol} onClick={() => setSymbol(idx.symbol)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                symbol === idx.symbol
                  ? "bg-primary/15 text-primary border border-primary/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface-hover border border-transparent"
              }`}
            >
              {idx.symbol}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Strip */}
      <div className="glass-card p-4 flex flex-wrap gap-6 items-center">
        <SumItem label="Spot Price" value={formatCurrency(chain.spotPrice, 0)} />
        <SumItem label="ATM Strike" value={chain.atmStrike.toString()} />
        <SumItem label="Max Pain" value={chain.maxPain.toString()} />
        <SumItem label="PCR" value={chain.pcr.toFixed(2)} color={chain.pcr > 1 ? "text-emerald-400" : chain.pcr < 0.7 ? "text-red-400" : "text-yellow-400"} />
        <SumItem label="Total Call OI" value={formatCompact(chain.totalCallOI)} />
        <SumItem label="Total Put OI" value={formatCompact(chain.totalPutOI)} />
        <SumItem label="Expiry" value={chain.expiry} />
      </div>

      {/* Option Chain Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto max-h-[65vh] overflow-y-auto">
          <table className="data-table min-w-[1100px]">
            <thead>
              <tr>
                <th colSpan={7} className="text-center !bg-emerald-500/10 !text-emerald-400 !border-b-emerald-500/20">CALLS</th>
                <th className="text-center !bg-surface">Strike</th>
                <th colSpan={7} className="text-center !bg-red-500/10 !text-red-400 !border-b-red-500/20">PUTS</th>
              </tr>
              <tr>
                <th>OI</th><th>Chg OI</th><th>Volume</th><th>IV</th><th>LTP</th><th>Bid</th><th>Ask</th>
                <th className="text-center font-bold">Strike</th>
                <th>Bid</th><th>Ask</th><th>LTP</th><th>IV</th><th>Volume</th><th>Chg OI</th><th>OI</th>
              </tr>
            </thead>
            <tbody>
              {chain.strikes.map((row) => (
                <StrikeRow key={row.strikePrice} row={row} spotPrice={chain.spotPrice} maxPain={chain.maxPain} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StrikeRow({ row, spotPrice, maxPain }: { row: OptionChainRow; spotPrice: number; maxPain: number }) {
  const isATM = row.isATM;
  const isMaxPain = row.strikePrice === maxPain;
  const callITM = row.strikePrice < spotPrice;
  const putITM = row.strikePrice > spotPrice;

  return (
    <tr className={`${isATM ? "!bg-primary/5 !border-y !border-primary/30" : ""}`}>
      {/* Calls */}
      <td className={callITM ? "bg-emerald-500/5" : ""}>{formatCompact(row.call.oi)}</td>
      <td className={`${callITM ? "bg-emerald-500/5" : ""} ${row.call.changeInOI > 0 ? "text-emerald-400" : "text-red-400"}`}>
        {row.call.changeInOI > 0 ? "+" : ""}{formatCompact(row.call.changeInOI)}
      </td>
      <td className={callITM ? "bg-emerald-500/5" : ""}>{formatCompact(row.call.volume)}</td>
      <td className={callITM ? "bg-emerald-500/5" : ""}>{row.call.iv.toFixed(1)}%</td>
      <td className={`font-semibold ${callITM ? "bg-emerald-500/5" : ""}`}>{row.call.ltp.toFixed(2)}</td>
      <td className={callITM ? "bg-emerald-500/5" : ""}>{row.call.bid.toFixed(2)}</td>
      <td className={callITM ? "bg-emerald-500/5" : ""}>{row.call.ask.toFixed(2)}</td>

      {/* Strike */}
      <td className={`text-center font-bold ${isATM ? "text-primary" : ""} ${isMaxPain ? "text-yellow-400" : ""}`}>
        {row.strikePrice}
        {isATM && <span className="ml-1 text-[9px] text-primary">(ATM)</span>}
        {isMaxPain && <span className="ml-1 text-[9px] text-yellow-400">(MP)</span>}
      </td>

      {/* Puts */}
      <td className={putITM ? "bg-red-500/5" : ""}>{row.put.bid.toFixed(2)}</td>
      <td className={putITM ? "bg-red-500/5" : ""}>{row.put.ask.toFixed(2)}</td>
      <td className={`font-semibold ${putITM ? "bg-red-500/5" : ""}`}>{row.put.ltp.toFixed(2)}</td>
      <td className={putITM ? "bg-red-500/5" : ""}>{row.put.iv.toFixed(1)}%</td>
      <td className={putITM ? "bg-red-500/5" : ""}>{formatCompact(row.put.volume)}</td>
      <td className={`${putITM ? "bg-red-500/5" : ""} ${row.put.changeInOI > 0 ? "text-emerald-400" : "text-red-400"}`}>
        {row.put.changeInOI > 0 ? "+" : ""}{formatCompact(row.put.changeInOI)}
      </td>
      <td className={putITM ? "bg-red-500/5" : ""}>{formatCompact(row.put.oi)}</td>
    </tr>
  );
}

function SumItem({ label, value, color = "" }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <span className="text-[11px] text-muted-foreground uppercase tracking-wider">{label}</span>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
    </div>
  );
}
