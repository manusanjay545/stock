"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, TrendingUp, Activity, BarChart3, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  
  const { data: dashboardData, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await api.get('/market/dashboard');
      if (!res.data.success) throw new Error(res.data.message);
      return res.data.data;
    },
    refetchInterval: 5000, // Auto-refresh every 5 seconds for live feel
  });

  const indices = dashboardData?.indices || [
    { name: "NIFTY 50", value: 0, change: 0, percent: 0, isUp: true },
    { name: "BANK NIFTY", value: 0, change: 0, percent: 0, isUp: true },
    { name: "SENSEX", value: 0, change: 0, percent: 0, isUp: true },
    { name: "INDIA VIX", value: 0, change: 0, percent: 0, isUp: true },
  ];

  const topMovers = dashboardData?.topMovers || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gradient">Market Overview</h1>
          <p className="text-muted-foreground mt-1">Real-time market performance (Powered by Angel One Live API).</p>
        </div>
        <button 
          onClick={() => refetch()} 
          className="p-2 rounded-full hover:bg-muted/50 transition-colors"
          disabled={isFetching}
        >
          <RefreshCw className={`h-5 w-5 text-muted-foreground ${isFetching ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Top Indices Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {indices.map((index: any) => (
          <Card key={index.name} className="glass-card overflow-hidden relative group">
            <div className={`absolute top-0 left-0 w-1 h-full ${index.isUp ? 'bg-success' : 'bg-destructive'}`}></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {index.name}
              </CardTitle>
              {index.isUp ? (
                <ArrowUpRight className="h-4 w-4 text-success" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-destructive" />
              )}
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-8 w-24 bg-muted animate-pulse rounded"></div>
              ) : (
                <>
                  <div className="text-2xl font-bold">{index.value.toLocaleString()}</div>
                  <p className={`text-xs font-medium flex items-center gap-1 mt-1 ${index.isUp ? 'text-success' : 'text-destructive'}`}>
                    {index.change > 0 ? '+' : ''}{index.change.toFixed(2)} ({index.percent > 0 ? '+' : ''}{index.percent.toFixed(2)}%)
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Sector Heatmap (Placeholder) */}
        <Card className="col-span-4 glass-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Live Performance Chart
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center border border-dashed border-border rounded-lg bg-muted/20">
            <p className="text-muted-foreground text-sm">Select a stock to view live charts</p>
          </CardContent>
        </Card>

        {/* Top Movers */}
        <Card className="col-span-3 glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Top Active Stocks
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-12 bg-muted/50 animate-pulse rounded-md"></div>
                ))}
              </div>
            ) : topMovers.length > 0 ? (
              <div className="space-y-4">
                {topMovers.map((stock: any) => (
                  <div 
                    key={stock.symbol} 
                    onClick={() => router.push(`/stock/${stock.symbol}`)}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <div className="font-medium text-primary">{stock.name}</div>
                    <div className="text-right">
                      <div className="font-medium">₹{stock.value.toLocaleString()}</div>
                      <div className={`text-xs ${stock.isUp ? 'text-success' : 'text-destructive'}`}>
                        {stock.change > 0 ? '+' : ''}{stock.change.toFixed(2)} ({stock.percent > 0 ? '+' : ''}{stock.percent.toFixed(2)}%)
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                Live data unavailable. Ensure market is open.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
