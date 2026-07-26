"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Target, TableProperties, Scan, BarChart3,
  Eye, FlaskConical, Bell, Settings, User, Zap, ChevronLeft, Crown,
} from "lucide-react";
import { useState } from "react";

const icons: Record<string, React.ElementType> = {
  LayoutDashboard, Target, TableProperties, Scan, BarChart3,
  Eye, FlaskConical, Bell, Settings, User, Crown,
};

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/recommendations", label: "Recommendations", icon: "Target" },
  { href: "/option-chain", label: "Option Chain", icon: "TableProperties" },
  { href: "/scanner", label: "Market Scanner", icon: "Scan" },
  { href: "/stock-screener", label: "Stock Screener", icon: "Scan" },
  { href: "/market-breadth", label: "Market Breadth", icon: "BarChart3" },
  { href: "/watchlist", label: "Watchlist", icon: "Eye" },
  { href: "/backtesting", label: "Backtesting", icon: "FlaskConical" },
  { href: "/balance-sheet", label: "Balance Sheet", icon: "TableProperties" },
  { href: "/alerts", label: "Alerts", icon: "Bell" },
  { href: "/pricing", label: "Pricing", icon: "Crown" },
  { href: "/settings", label: "Settings", icon: "Settings" },
  { href: "/profile", label: "Profile", icon: "User" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`fixed top-0 left-0 h-screen z-40 flex flex-col border-r border-border-default bg-surface transition-all duration-300 ${
        collapsed ? "w-[72px]" : "w-[260px]"
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-border-default shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center">
          <Zap size={18} className="text-gray-900" />
        </div>
        {!collapsed && (
          <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            QuantStrike
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {NAV.map((item) => {
          const Icon = icons[item.icon] || LayoutDashboard;
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const isPricing = item.href === "/pricing";
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                isPricing && !active
                  ? "text-amber-400 hover:bg-amber-500/10 border border-amber-500/10 hover:border-amber-500/20"
                  : active
                  ? "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_12px_rgba(6,182,212,0.1)]"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface-hover"
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={20} className={isPricing && !active ? "text-amber-400" : active ? "text-primary" : "text-muted group-hover:text-foreground"} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center h-12 border-t border-border-default text-muted hover:text-foreground transition-colors"
      >
        <ChevronLeft size={18} className={`transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`} />
      </button>
    </aside>
  );
}
