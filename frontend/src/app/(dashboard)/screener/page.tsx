"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Save, Settings2, Download } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

export default function ScreenerPage() {
  const [query, setQuery] = useState(
    "Market Capitalization > 10000 AND\nPrice to Earning < 35 AND\nReturn on equity > 15 AND\nSales growth 3Years > 10"
  );
  
  const { mutate: runScreen, data: resultsData, isPending } = useMutation({
    mutationFn: async () => {
      const res = await api.post("/screener/run", { query, limit: 50 });
      if (!res.data.success) throw new Error(res.data.message);
      return res.data;
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to run screener");
    }
  });

  const results = resultsData?.data || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gradient">Create Search Query</h1>
        <p className="text-muted-foreground mt-1">Filter stocks using fundamental and technical criteria (Phase 2 Live API).</p>
      </div>

      <Card className="glass-card border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center justify-between">
            <span>Query Editor</span>
            <Button variant="ghost" size="sm" className="h-8">
              <Settings2 className="mr-2 h-4 w-4" /> Custom Ratios
            </Button>
          </CardTitle>
          <CardDescription>
            Enter your screening criteria below. Note: Running query pulls live data via yfinance backend.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full min-h-[150px] p-4 bg-muted/30 border border-border rounded-md font-mono text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 text-foreground resize-y"
              placeholder="Enter query here..."
            />
          </div>
          
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Pro tip: Use <span className="font-mono text-foreground">AND</span> / <span className="font-mono text-foreground">OR</span> to combine multiple filters.
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="glass">
                <Save className="mr-2 h-4 w-4" /> Save Query
              </Button>
              <Button onClick={() => runScreen()} disabled={isPending} className="bg-primary hover:bg-primary/90 shadow-[0_0_15px_rgba(var(--primary),0.4)]">
                {isPending ? "Running..." : (
                  <><Play className="mr-2 h-4 w-4" /> Run This Query</>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card className="glass-card">
          <CardHeader className="pb-2 border-b border-border/50 flex flex-row items-center justify-between">
            <div>
              <CardTitle>Query Results</CardTitle>
              <CardDescription>{results.length} companies found</CardDescription>
            </div>
            <Button variant="outline" size="sm" className="glass h-8">
              <Download className="mr-2 h-4 w-4" /> Export
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground bg-muted/30">
                  <tr>
                    <th className="px-4 py-3 font-medium">S.No.</th>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium text-right">CMP Rs.</th>
                    <th className="px-4 py-3 font-medium text-right">P/E</th>
                    <th className="px-4 py-3 font-medium text-right">Mar Cap Rs.Cr.</th>
                    <th className="px-4 py-3 font-medium text-right">Div Yld %</th>
                    <th className="px-4 py-3 font-medium text-right">NP Qtr Rs.Cr.</th>
                    <th className="px-4 py-3 font-medium text-right">Qtr Profit Var %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {results.map((row: any) => (
                    <tr key={row.sNo} className="hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground">{row.sNo}</td>
                      <td className="px-4 py-3 font-medium text-primary hover:underline cursor-pointer" onClick={() => window.location.href = `/stock/${row.symbol}`}>
                        {row.name}
                      </td>
                      <td className="px-4 py-3 text-right">{row.cmp.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right">{row.pe ? row.pe.toFixed(2) : '-'}</td>
                      <td className="px-4 py-3 text-right">{row.marCap.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">{row.divYield.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right">{row.npQtr.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-success">{row.qtrProfitVar}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
