"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Activity, Download, Plus, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// Mock API Call
async function fetchCompanyData(symbol: string) {
  // In production, this would call your FastAPI backend: /api/v1/company/{symbol}
  return {
    symbol,
    name: `${symbol} Limited`,
    sector: "Information Technology",
    marketCap: 1450000.0,
    currentPrice: 3850.45,
    high52: 4100.0,
    low52: 3100.0,
    pe: 28.5,
    bookValue: 450.0,
    dividendYield: 1.5,
    roce: 32.5,
    roe: 28.4,
    faceValue: 1.0,
    about: `${symbol} Ltd is a multinational information technology services and consulting company. It is one of the largest IT companies in the world by market capitalization.`,
    pros: [
      "Company is virtually debt free.",
      "Company has a good return on equity (ROE) track record: 3 Years ROE 40.0%.",
      "Company has been maintaining a healthy dividend payout of 65.0%."
    ],
    cons: [
      "Stock is trading at 8.5 times its book value.",
      "Promoter holding has decreased over last quarter."
    ],
    financials: {
      quarters: ["Mar 2023", "Jun 2023", "Sep 2023", "Dec 2023", "Mar 2024"],
      sales: [59162, 59381, 59692, 60583, 61237],
      expenses: [44312, 45123, 44980, 45200, 45600],
      operatingProfit: [14850, 14258, 14712, 15383, 15637],
      opm: [25, 24, 25, 25, 26],
      netProfit: [11436, 11120, 11380, 11097, 12502]
    }
  };
}

export default function CompanyPage() {
  const params = useParams();
  const symbol = params.symbol as string;

  const { data, isLoading } = useQuery({
    queryKey: ['company', symbol],
    queryFn: () => fetchCompanyData(symbol),
  });

  if (isLoading || !data) {
    return <div className="flex h-[80vh] items-center justify-center">Loading {symbol}...</div>;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{data.name}</h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="bg-muted/50">{data.exchange || 'NSE'}</Badge>
            <span className="text-muted-foreground text-sm">{data.sector}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="glass">
            <Download className="mr-2 h-4 w-4" /> Export Excel
          </Button>
          <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_10px_rgba(var(--primary),0.3)]">
            <Plus className="mr-2 h-4 w-4" /> Add to Watchlist
          </Button>
        </div>
      </div>

      {/* Snapshot / Key Metrics (Screener.in style) */}
      <Card className="glass-card">
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            <div className="flex justify-between border-b border-border/50 pb-2">
              <span className="text-muted-foreground text-sm">Market Cap</span>
              <span className="font-medium">₹ {data.marketCap.toLocaleString()} Cr</span>
            </div>
            <div className="flex justify-between border-b border-border/50 pb-2">
              <span className="text-muted-foreground text-sm">Current Price</span>
              <span className="font-medium">₹ {data.currentPrice}</span>
            </div>
            <div className="flex justify-between border-b border-border/50 pb-2">
              <span className="text-muted-foreground text-sm">High / Low</span>
              <span className="font-medium">₹ {data.high52} / {data.low52}</span>
            </div>
            <div className="flex justify-between border-b border-border/50 pb-2">
              <span className="text-muted-foreground text-sm">Stock P/E</span>
              <span className="font-medium">{data.pe}</span>
            </div>
            <div className="flex justify-between border-b border-border/50 pb-2">
              <span className="text-muted-foreground text-sm">Book Value</span>
              <span className="font-medium">₹ {data.bookValue}</span>
            </div>
            <div className="flex justify-between border-b border-border/50 pb-2">
              <span className="text-muted-foreground text-sm">Dividend Yield</span>
              <span className="font-medium">{data.dividendYield}%</span>
            </div>
            <div className="flex justify-between border-b border-border/50 pb-2">
              <span className="text-muted-foreground text-sm">ROCE</span>
              <span className="font-medium">{data.roce}%</span>
            </div>
            <div className="flex justify-between border-b border-border/50 pb-2">
              <span className="text-muted-foreground text-sm">ROE</span>
              <span className="font-medium">{data.roe}%</span>
            </div>
            <div className="flex justify-between border-b border-border/50 pb-2">
              <span className="text-muted-foreground text-sm">Face Value</span>
              <span className="font-medium">₹ {data.faceValue}</span>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-border">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">About</h3>
            <p className="text-sm text-foreground/80 leading-relaxed">{data.about}</p>
          </div>
        </CardContent>
      </Card>

      {/* Charts Placeholder */}
      <Card className="glass-card overflow-hidden">
         <CardHeader className="py-4 border-b border-border bg-muted/20">
           <CardTitle className="text-base flex items-center gap-2">
             <Activity className="h-4 w-4 text-primary" /> Price Volume Chart
           </CardTitle>
         </CardHeader>
         <CardContent className="h-[400px] p-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-muted-foreground">TradingView Chart Component Will Render Here</p>
              <Button variant="link" className="mt-2" onClick={() => window.location.href = `/charts/${symbol}`}>
                Open Advanced Chart
              </Button>
            </div>
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
              {data.pros.map((pro, i) => (
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
              {data.cons.map((con, i) => (
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
              <TabsTrigger value="balance">Balance Sheet</TabsTrigger>
              <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
              <TabsTrigger value="ratios">Ratios</TabsTrigger>
            </TabsList>
            <div className="text-xs text-muted-foreground hidden sm:block">Figures in Rs. Crores</div>
          </div>
          
          <TabsContent value="quarters" className="m-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground bg-muted/30 border-b border-border">
                  <tr>
                    <th className="px-6 py-3 font-medium">Metric</th>
                    {data.financials.quarters.map((q) => (
                      <th key={q} className="px-6 py-3 font-medium text-right">{q}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr className="hover:bg-muted/50">
                    <td className="px-6 py-3 font-medium">Sales</td>
                    {data.financials.sales.map((val, i) => (
                      <td key={i} className="px-6 py-3 text-right">{val.toLocaleString()}</td>
                    ))}
                  </tr>
                  <tr className="hover:bg-muted/50">
                    <td className="px-6 py-3 font-medium text-muted-foreground">Expenses</td>
                    {data.financials.expenses.map((val, i) => (
                      <td key={i} className="px-6 py-3 text-right">{val.toLocaleString()}</td>
                    ))}
                  </tr>
                  <tr className="hover:bg-muted/50 bg-muted/20">
                    <td className="px-6 py-3 font-bold">Operating Profit</td>
                    {data.financials.operatingProfit.map((val, i) => (
                      <td key={i} className="px-6 py-3 text-right font-bold">{val.toLocaleString()}</td>
                    ))}
                  </tr>
                  <tr className="hover:bg-muted/50">
                    <td className="px-6 py-3 font-medium text-muted-foreground">OPM %</td>
                    {data.financials.opm.map((val, i) => (
                      <td key={i} className="px-6 py-3 text-right">{val}%</td>
                    ))}
                  </tr>
                  <tr className="hover:bg-muted/50 bg-primary/5">
                    <td className="px-6 py-3 font-bold text-primary">Net Profit</td>
                    {data.financials.netProfit.map((val, i) => (
                      <td key={i} className="px-6 py-3 text-right font-bold">{val.toLocaleString()}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </TabsContent>
          <TabsContent value="pl" className="p-6 text-center text-muted-foreground">Profit & Loss view coming soon...</TabsContent>
          <TabsContent value="balance" className="p-6 text-center text-muted-foreground">Balance Sheet view coming soon...</TabsContent>
          <TabsContent value="cashflow" className="p-6 text-center text-muted-foreground">Cash Flow view coming soon...</TabsContent>
          <TabsContent value="ratios" className="p-6 text-center text-muted-foreground">Ratios view coming soon...</TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
