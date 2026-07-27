"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { TradingViewChart } from "@/components/TradingViewChart";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ChartsPage() {
  const params = useParams();
  const symbol = params.symbol as string;

  const { data: chartData, isLoading } = useQuery({
    queryKey: ['charts', symbol, 'full'],
    queryFn: async () => {
      const res = await api.get(`/charts/${symbol}?timeframe=1D`);
      if (!res.data.success) throw new Error(res.data.message);
      return res.data.data;
    },
  });

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex items-center gap-4">
        <Link href={`/stock/${symbol}`}>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{symbol}</h1>
          <p className="text-muted-foreground text-sm">Interactive Technical Chart (Live Angel One Data)</p>
        </div>
      </div>

      <Card className="flex-1 glass-card overflow-hidden flex flex-col">
        <CardHeader className="py-2 border-b border-border/50 bg-muted/20">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Daily Timeframe</CardTitle>
            <div className="text-xs text-muted-foreground">Scroll to zoom, drag to pan</div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-0 flex flex-col">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              Loading high-resolution chart data for {symbol}...
            </div>
          ) : chartData ? (
            <div className="flex-1 w-full h-full min-h-[600px]">
                <TradingViewChart data={chartData} height={600} />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-destructive">
              Failed to load chart data. Ensure Angel One credentials are correct.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
