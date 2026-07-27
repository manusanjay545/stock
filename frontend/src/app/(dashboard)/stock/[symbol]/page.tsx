"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Activity, Download, Plus, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { TradingViewChart } from "@/components/TradingViewChart";
import { toast } from "sonner";

export default function CompanyPage() {
  const params = useParams();
  const symbol = params.symbol as string;

  // Fetch Fundamentals via FastAPI (which uses yfinance)
  const { data: companyData, isLoading: isLoadingCompany } = useQuery({
    queryKey: ['company', symbol],
    queryFn: async () => {
      const res = await api.get(`/company/${symbol}`);
      if (!res.data.success) throw new Error(res.data.message);
      return res.data.data;
    },
  });

  // Fetch Financials via FastAPI
  const { data: financialsData, isLoading: isLoadingFinancials } = useQuery({
    queryKey: ['financials', symbol],
    queryFn: async () => {
      const res = await api.get(`/company/${symbol}/financials`);
      if (!res.data.success) throw new Error(res.data.message);
      return res.data.data;
    },
  });
  
  // Fetch Charts via FastAPI (which uses Angel One)
  const { data: chartData, isLoading: isLoadingChart } = useQuery({
    queryKey: ['charts', symbol],
    queryFn: async () => {
      const res = await api.get(`/charts/${symbol}?timeframe=1D`);
      if (!res.data.success) throw new Error(res.data.message);
      return res.data.data;
    },
  });

  if (isLoadingCompany || !companyData) {
    return <div className="flex h-[80vh] items-center justify-center">Loading fundamental data for {symbol}...</div>;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{companyData.name}</h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="bg-muted/50">NSE</Badge>
            <span className="text-muted-foreground text-sm">{companyData.sector}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="glass">
            <Download className="mr-2 h-4 w-4" /> Export Excel
          </Button>
          <Button size="sm" onClick={() => toast.success(`Added ${symbol} to watchlist!`)} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_10px_rgba(var(--primary),0.3)]">
            <Plus className="mr-2 h-4 w-4" /> Add to Watchlist
          </Button>
        </div>
      </div>

      {/* Snapshot / Key Metrics */}
      <Card className="glass-card">
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            <div className="flex justify-between border-b border-border/50 pb-2">
              <span className="text-muted-foreground text-sm">Market Cap</span>
              <span className="font-medium">₹ {companyData.marketCap.toLocaleString()} Cr</span>
            </div>
            <div className="flex justify-between border-b border-border/50 pb-2">
              <span className="text-muted-foreground text-sm">Current Price</span>
              <span className="font-medium">₹ {companyData.currentPrice}</span>
            </div>
            <div className="flex justify-between border-b border-border/50 pb-2">
              <span className="text-muted-foreground text-sm">High / Low</span>
              <span className="font-medium">₹ {companyData.high52} / {companyData.low52}</span>
            </div>
            <div className="flex justify-between border-b border-border/50 pb-2">
              <span className="text-muted-foreground text-sm">Stock P/E</span>
              <span className="font-medium">{companyData.pe}</span>
            </div>
            <div className="flex justify-between border-b border-border/50 pb-2">
              <span className="text-muted-foreground text-sm">Book Value</span>
              <span className="font-medium">₹ {companyData.bookValue}</span>
            </div>
            <div className="flex justify-between border-b border-border/50 pb-2">
              <span className="text-muted-foreground text-sm">Dividend Yield</span>
              <span className="font-medium">{companyData.dividendYield}%</span>
            </div>
            <div className="flex justify-between border-b border-border/50 pb-2">
              <span className="text-muted-foreground text-sm">ROCE</span>
              <span className="font-medium">{companyData.roce}%</span>
            </div>
            <div className="flex justify-between border-b border-border/50 pb-2">
              <span className="text-muted-foreground text-sm">ROE</span>
              <span className="font-medium">{companyData.roe}%</span>
            </div>
            <div className="flex justify-between border-b border-border/50 pb-2">
              <span className="text-muted-foreground text-sm">Face Value</span>
              <span className="font-medium">₹ {companyData.faceValue}</span>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-border">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">About</h3>
            <p className="text-sm text-foreground/80 leading-relaxed">{companyData.about}</p>
          </div>
        </CardContent>
      </Card>

      {/* Charts View */}
      <Card className="glass-card overflow-hidden">
         <CardHeader className="py-4 border-b border-border bg-muted/20">
           <CardTitle className="text-base flex items-center gap-2 justify-between">
             <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" /> Price Volume Chart
             </div>
             <Button variant="ghost" size="sm" onClick={() => window.location.href = `/charts/${symbol}`}>
                Expand
             </Button>
           </CardTitle>
         </CardHeader>
         <CardContent className="p-0">
            {isLoadingChart ? (
                <div className="h-[400px] flex items-center justify-center text-muted-foreground">Loading chart data from Angel One...</div>
            ) : chartData ? (
                <TradingViewChart data={chartData} height={400} />
            ) : (
                <div className="h-[400px] flex items-center justify-center text-muted-foreground">Chart data unavailable</div>
            )}
         </CardContent>
      </Card>

      {/* Pros & Cons */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="glass-card border-success/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-success flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" /> Pros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {companyData.pros.map((pro: string, i: number) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <span className="text-success mt-0.5">•</span>
                  <span>{pro}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card className="glass-card border-destructive/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" /> Cons
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {companyData.cons.map((con: string, i: number) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <span className="text-destructive mt-0.5">•</span>
                  <span>{con}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Financials Tabs */}
      <Card className="glass-card">
        <Tabs defaultValue="quarters" className="w-full">
          <div className="flex items-center justify-between p-4 border-b border-border bg-muted/20">
            <TabsList className="bg-background">
              <TabsTrigger value="quarters">Quarters</TabsTrigger>
              <TabsTrigger value="pl">Profit & Loss</TabsTrigger>
            </TabsList>
            <div className="text-xs text-muted-foreground hidden sm:block">Figures in Rs. Crores</div>
          </div>
          
          <TabsContent value="quarters" className="m-0">
            <div className="overflow-x-auto">
              {isLoadingFinancials ? (
                  <div className="p-8 text-center text-muted-foreground">Loading financials...</div>
              ) : financialsData ? (
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground bg-muted/30 border-b border-border">
                      <tr>
                        <th className="px-6 py-3 font-medium">Metric</th>
                        {financialsData.quarters.map((q: string) => (
                          <th key={q} className="px-6 py-3 font-medium text-right">{q}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      <tr className="hover:bg-muted/50">
                        <td className="px-6 py-3 font-medium">Sales</td>
                        {financialsData.sales.map((val: number, i: number) => (
                          <td key={i} className="px-6 py-3 text-right">{val.toLocaleString()}</td>
                        ))}
                      </tr>
                      <tr className="hover:bg-muted/50">
                        <td className="px-6 py-3 font-medium text-muted-foreground">Expenses</td>
                        {financialsData.expenses.map((val: number, i: number) => (
                          <td key={i} className="px-6 py-3 text-right">{val.toLocaleString()}</td>
                        ))}
                      </tr>
                      <tr className="hover:bg-muted/50 bg-muted/20">
                        <td className="px-6 py-3 font-bold">Operating Profit</td>
                        {financialsData.operatingProfit.map((val: number, i: number) => (
                          <td key={i} className="px-6 py-3 text-right font-bold">{val.toLocaleString()}</td>
                        ))}
                      </tr>
                      <tr className="hover:bg-muted/50">
                        <td className="px-6 py-3 font-medium text-muted-foreground">OPM %</td>
                        {financialsData.opm.map((val: number, i: number) => (
                          <td key={i} className="px-6 py-3 text-right">{val}%</td>
                        ))}
                      </tr>
                      <tr className="hover:bg-muted/50 bg-primary/5">
                        <td className="px-6 py-3 font-bold text-primary">Net Profit</td>
                        {financialsData.netProfit.map((val: number, i: number) => (
                          <td key={i} className="px-6 py-3 text-right font-bold">{val.toLocaleString()}</td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
              ) : (
                  <div className="p-8 text-center text-muted-foreground">No financial data available</div>
              )}
            </div>
          </TabsContent>
          <TabsContent value="pl" className="p-6 text-center text-muted-foreground">Yearly Profit & Loss view requires full premium API setup.</TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
