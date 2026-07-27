"use client";

import { useEffect, useRef } from "react";
import { createChart, ColorType, IChartApi, ISeriesApi } from "lightweight-charts";
import { useTheme } from "next-themes"; // if you want to sync with theme, otherwise use a default

interface ChartData {
  time: string | number;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface TradingViewChartProps {
  data: ChartData[];
  height?: number;
}

export function TradingViewChart({ data, height = 400 }: TradingViewChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart instance
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "rgba(255, 255, 255, 0.7)",
      },
      grid: {
        vertLines: { color: "rgba(255, 255, 255, 0.1)" },
        horzLines: { color: "rgba(255, 255, 255, 0.1)" },
      },
      width: chartContainerRef.current.clientWidth,
      height: height,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        mode: 0,
      }
    });

    chartRef.current = chart;

    // Create candlestick series
    const candleSeries = chart.addCandlestickSeries({
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderVisible: false,
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
    });

    seriesRef.current = candleSeries;
    
    // Set data
    if (data && data.length > 0) {
      // lightweight-charts requires data to be sorted by time ascending
      const sortedData = [...data].sort((a, b) => {
          const timeA = typeof a.time === 'string' ? new Date(a.time).getTime() : a.time;
          const timeB = typeof b.time === 'string' ? new Date(b.time).getTime() : b.time;
          return timeA - timeB;
      });
      
      // format time strings to timestamp if needed
      const formattedData = sortedData.map(d => {
         return {
             ...d,
             time: typeof d.time === 'string' ? new Date(d.time).getTime() / 1000 : d.time as number
         };
      });

      candleSeries.setData(formattedData as any);
      chart.timeScale().fitContent();
    }

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chart) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [data, height]);

  return <div ref={chartContainerRef} className="w-full" />;
}
