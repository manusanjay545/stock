"use client";

import { Search, Bell, Menu } from "lucide-react";
import { useState } from "react";

interface HeaderProps {
  sidebarCollapsed?: boolean;
  onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <header className="sticky top-0 z-30 h-16 flex items-center justify-between px-6 border-b border-border-default bg-surface/80 backdrop-blur-xl">
      {/* Left: Mobile menu + Search */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
        >
          <Menu size={20} />
        </button>

        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search stocks, indices, strikes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchOpen(true)}
            onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
            className="w-64 lg:w-80 h-9 pl-9 pr-4 rounded-lg bg-background border border-border-default text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary/50 focus:shadow-[0_0_0_3px_rgba(6,182,212,0.1)] transition-all"
          />
          {searchOpen && searchQuery && (
            <div className="absolute top-full left-0 right-0 mt-1 glass-card p-2 shadow-xl">
              {["NIFTY", "BANKNIFTY", "RELIANCE", "TCS", "HDFCBANK"]
                .filter((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((s) => (
                  <button
                    key={s}
                    className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-surface-hover transition-colors"
                  >
                    {s}
                  </button>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: Market Status + Notifications */}
      <div className="flex items-center gap-4">
        {/* Market Status Pill */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold text-emerald-400">Market Open</span>
        </div>

        {/* Notification Bell */}
        <button className="relative p-2 rounded-lg text-muted hover:text-foreground hover:bg-surface-hover transition-colors">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary animate-pulse" />
        </button>

        {/* User Avatar */}
        <button className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center text-xs font-bold text-gray-900">
          QS
        </button>
      </div>
    </header>
  );
}
