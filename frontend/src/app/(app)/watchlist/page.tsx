"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Eye, Star } from "lucide-react";
import MiniSparkline from "@/components/charts/MiniSparkline";
import { generateWatchlists } from "@/lib/mockData";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import type { Watchlist, WatchlistItem } from "@/lib/types";

const MOCK_PRICES: Record<string, { price: number; change: number }> = {
  NIFTY: { price: 24850, change: 0.45 }, BANKNIFTY: { price: 53200, change: -0.32 },
  RELIANCE: { price: 2980, change: 1.2 }, TCS: { price: 3850, change: -0.55 },
  HDFCBANK: { price: 1720, change: 0.78 }, INFY: { price: 1580, change: -0.15 },
};

export default function WatchlistPage() {
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    setWatchlists(generateWatchlists());
  }, []);

  const activeWatchlist = watchlists[activeTab];

  const handleAddWatchlist = () => {
    if (!newName.trim()) return;
    setWatchlists([...watchlists, {
      id: `w${Date.now()}`, name: newName, userId: "user-1", items: [], createdAt: new Date().toISOString(),
    }]);
    setNewName("");
    setShowAddModal(false);
    setActiveTab(watchlists.length);
  };

  const handleRemoveItem = (itemId: string) => {
    setWatchlists(watchlists.map((wl, i) =>
      i === activeTab ? { ...wl, items: wl.items.filter((it) => it.id !== itemId) } : wl
    ));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Watchlist</h1>
          <p className="text-sm text-muted-foreground mt-1">Track your favorite stocks, indices & options</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/15 text-primary border border-primary/30 text-sm font-medium hover:bg-primary/25 transition-all">
          <Plus size={16} /> New Watchlist
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border-default pb-0">
        {watchlists.map((wl, i) => (
          <button key={wl.id} onClick={() => setActiveTab(i)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px ${
              i === activeTab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Eye size={14} className="inline mr-1.5" />{wl.name} ({wl.items.length})
          </button>
        ))}
      </div>

      {/* Items */}
      {activeWatchlist ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {activeWatchlist.items.map((item) => {
            const priceData = MOCK_PRICES[item.symbol] || { price: 1000, change: 0 };
            const positive = priceData.change >= 0;
            return (
              <div key={item.id} className="glass-card glass-card-hover p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star size={14} className="text-yellow-400" />
                    <span className="font-bold">{item.symbol}</span>
                    <span className="badge badge-neutral text-[10px]">{item.type}</span>
                  </div>
                  <button onClick={() => handleRemoveItem(item.id)} className="p-1.5 rounded text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
                {item.strikePrice && <p className="text-xs text-muted-foreground">Strike: {item.strikePrice} {item.optionType} • {item.expiry}</p>}
                <div className="flex items-center justify-between">
                  <p className="text-xl font-bold">{formatCurrency(priceData.price)}</p>
                  <span className={`text-sm font-semibold ${positive ? "text-emerald-400" : "text-red-400"}`}>
                    {formatPercent(priceData.change)}
                  </span>
                </div>
                <MiniSparkline data={Array.from({ length: 24 }, () => priceData.price * (0.99 + Math.random() * 0.02))} width={200} height={32} />
              </div>
            );
          })}
          {activeWatchlist.items.length === 0 && (
            <div className="col-span-full glass-card p-12 text-center text-muted-foreground">
              <Eye size={40} className="mx-auto mb-3 opacity-30" />
              <p>No items in this watchlist yet</p>
              <p className="text-sm mt-1">Add stocks, indices, or options to track them here</p>
            </div>
          )}
        </div>
      ) : (
        <div className="glass-card p-12 text-center text-muted-foreground">Create a watchlist to get started</div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass-card p-6 w-full max-w-sm space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold">New Watchlist</h3>
            <input type="text" placeholder="Watchlist name" value={newName} onChange={(e) => setNewName(e.target.value)}
              className="w-full h-10 px-4 rounded-lg bg-background border border-border-default text-sm focus:outline-none focus:border-primary/50" autoFocus />
            <div className="flex gap-3">
              <button onClick={() => setShowAddModal(false)} className="flex-1 h-10 rounded-lg border border-border-default text-sm hover:bg-surface-hover transition-colors">Cancel</button>
              <button onClick={handleAddWatchlist} className="flex-1 h-10 rounded-lg bg-primary text-gray-900 font-semibold text-sm hover:bg-primary-hover transition-colors">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
