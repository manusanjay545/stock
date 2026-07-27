"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Play, Save, Settings2, Download } from "lucide-react";
import {
  Table,
  Body,
  Cell,
  Head,
  HeaderCell,
  Row,
} from "@/components/ui/table";

const DEMO_RESULTS = [
  { sNo: 1, symbol: "TCS", name: "Tata Consultancy Services", cmp: 3890.10, pe: 30.2, marCap: 1400000, divYield: 1.8, npQtr: 11000, qtrProfitVar: 8.5 },
  { sNo: 2, symbol: "INFY", name: "Infosys", cmp: 1450.75, pe: 24.5, marCap: 600000, divYield: 2.1, npQtr: 6200, qtrProfitVar: 5.2 },
  { sNo: 3, symbol: "HCLTECH", name: "HCL Technologies", cmp: 1560.20, pe: 22.1, marCap: 420000, divYield: 2.8, npQtr: 3900, qtrProfitVar: 6.8 },
];

export default function ScreenerPage() {
  const [query, setQuery] = useState(
    "Market Capitalization > 10000 AND\nPrice to Earning < 35 AND\nReturn on equity > 15 AND\nSales growth 3Years > 10"
  );
  
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const handleRunQuery = () => {
    setIsSearching(true);
    // Simulate API call
    setTimeout(() => {
      setResults(DEMO_RESULTS);
      setIsSearching(false);
    }, 1000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gradient">Create Search Query</h1>
        <p className="text-muted-foreground mt-1">Filter stocks using fundamental and technical criteria.</p>
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
            Enter your screening criteria below. E.g., <code className="bg-muted px-1 py-0.5 rounded text-primary">Market cap {">"} 500</code>
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
              <Button onClick={handleRunQuery} disabled={isSearching} className="bg-primary hover:bg-primary/90 shadow-[0_0_15px_rgba(var(--primary),0.4)]">
                {isSearching ? "Running..." : (
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
                  {results.map((row) => (
                    <tr key={row.sNo} className="hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground">{row.sNo}</td>
                      <td className="px-4 py-3 font-medium text-primary hover:underline cursor-pointer" onClick={() => window.location.href = `/stock/${row.symbol}`}>
                        {row.name}
                      </td>
                      <td className="px-4 py-3 text-right">{row.cmp.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right">{row.pe.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right">{row.marCap.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">{row.divYield.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right">{row.npQtr.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-success">{row.qtrProfitVar.toFixed(2)}%</td>
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
