"use client";

import { useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { LineChart, ArrowLeft } from "lucide-react";
import Link from "next/link";

let tvScriptLoadingPromise: Promise<void> | null = null;

function TradingViewWidget() {
  const searchParams = useSearchParams();
  const symbol = searchParams.get("symbol") || "RELIANCE";
  
  // Format symbol for TradingView (usually prefix with NSE: or BSE:)
  // TradingView prefers NSE:RELIANCE
  const tvSymbol = symbol.includes(":") ? symbol : `NSE:${symbol}`;
  
  const onLoadScriptRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    onLoadScriptRef.current = createWidget;

    if (!tvScriptLoadingPromise) {
      tvScriptLoadingPromise = new Promise((resolve) => {
        const script = document.createElement("script");
        script.id = "tradingview-widget-loading-script";
        script.src = "https://s3.tradingview.com/tv.js";
        script.type = "text/javascript";
        script.onload = () => resolve();
        document.head.appendChild(script);
      });
    }

    tvScriptLoadingPromise.then(() => {
      if (onLoadScriptRef.current) {
        onLoadScriptRef.current();
      }
    });

    return () => {
      onLoadScriptRef.current = null;
    };

    function createWidget() {
      if (document.getElementById("tradingview_widget") && "TradingView" in window) {
        new (window as any).TradingView.widget({
          autosize: true,
          symbol: tvSymbol,
          interval: "D",
          timezone: "Asia/Kolkata",
          theme: "dark",
          style: "1",
          locale: "in",
          enable_publishing: false,
          backgroundColor: "#09090b", // Matches app background
          gridColor: "#27272a", // Matches border-default
          hide_top_toolbar: false,
          hide_legend: false,
          save_image: false,
          container_id: "tradingview_widget",
          toolbar_bg: "#18181b", // Matches surface
          studies: [
            "Volume@tv-basicstudies",
            "RSI@tv-basicstudies",
            "MACD@tv-basicstudies"
          ],
        });
      }
    }
  }, [tvSymbol]);

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Link href="/balance-sheet" className="p-2 rounded-lg bg-surface hover:bg-surface-hover text-muted-foreground hover:text-foreground transition-colors border border-border-default">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <LineChart size={20} className="text-primary" />
              Advanced Technical Chart
            </h1>
            <p className="text-sm text-muted-foreground">{tvSymbol}</p>
          </div>
        </div>
      </div>
      
      {/* Chart Container */}
      <div className="flex-1 w-full rounded-xl overflow-hidden border border-border-default shadow-2xl bg-surface relative">
        <div id="tradingview_widget" className="absolute inset-0" />
      </div>
    </div>
  );
}

export default function ChartPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-[calc(100vh-6rem)] animate-pulse text-muted">Loading chart engine...</div>}>
      <TradingViewWidget />
    </Suspense>
  );
}
