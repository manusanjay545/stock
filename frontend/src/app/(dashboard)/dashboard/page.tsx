"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, TrendingUp, Activity, BarChart3 } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gradient">Market Overview</h1>
        <p className="text-muted-foreground mt-1">Real-time market performance and key indicators.</p>
      </div>

      {/* Top Indices Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { name: "NIFTY 50", value: "24,800.50", change: "+120.40", percent: "+0.45%", isUp: true },
          { name: "BANK NIFTY", value: "52,300.10", change: "-80.20", percent: "-0.15%", isUp: false },
          { name: "SENSEX", value: "81,200.75", change: "+350.10", percent: "+0.41%", isUp: true },
          { name: "INDIA VIX", value: "13.45", change: "-0.50", percent: "-3.50%", isUp: false },
        ].map((index) => (
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
              <div className="text-2xl font-bold">{index.value}</div>
              <p className={`text-xs font-medium flex items-center gap-1 mt-1 ${index.isUp ? 'text-success' : 'text-destructive'}`}>
                {index.change} ({index.percent})
              </p>
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
                Sector Performance
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center border border-dashed border-border rounded-lg bg-muted/20">
            <p className="text-muted-foreground text-sm">Sector heatmap visualization will appear here.</p>
          </CardContent>
        </Card>

        {/* Top Movers */}
        <Card className="col-span-3 glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Top Gainers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { symbol: "RELIANCE", price: "2,980.50", change: "+4.2%" },
                { symbol: "TCS", price: "3,890.10", change: "+3.1%" },
                { symbol: "INFY", price: "1,450.75", change: "+2.8%" },
                { symbol: "HDFCBANK", price: "1,680.00", change: "+2.1%" },
                { symbol: "ITC", price: "450.25", change: "+1.9%" },
              ].map((stock) => (
                <div key={stock.symbol} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors cursor-pointer">
                  <div className="font-medium">{stock.symbol}</div>
                  <div className="text-right">
                    <div className="font-medium">{stock.price}</div>
                    <div className="text-xs text-success">{stock.change}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
