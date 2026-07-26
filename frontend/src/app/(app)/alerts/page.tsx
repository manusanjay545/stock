"use client";

import { useState, useEffect } from "react";
import { Bell, Plus, Trash2, ToggleLeft, ToggleRight, AlertTriangle, CheckCircle } from "lucide-react";
import { generateAlerts } from "@/lib/mockData";
import { formatNumber, timeAgo } from "@/lib/formatters";
import type { Alert, AlertType, AlertCondition } from "@/lib/types";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newAlert, setNewAlert] = useState({ symbol: "NIFTY", alertType: "PRICE" as AlertType, condition: "ABOVE" as AlertCondition, threshold: "" });

  useEffect(() => { setAlerts(generateAlerts(8)); }, []);

  const toggleAlert = (id: string) => {
    setAlerts(alerts.map((a) => a.id === id ? { ...a, isActive: !a.isActive } : a));
  };
  const deleteAlert = (id: string) => { setAlerts(alerts.filter((a) => a.id !== id)); };
  const addAlert = () => {
    if (!newAlert.threshold) return;
    setAlerts([{
      id: `a${Date.now()}`, userId: "user-1", symbol: newAlert.symbol, alertType: newAlert.alertType,
      condition: newAlert.condition, threshold: +newAlert.threshold, currentValue: 0,
      isActive: true, isTriggered: false, createdAt: new Date().toISOString(),
    }, ...alerts]);
    setShowModal(false);
    setNewAlert({ symbol: "NIFTY", alertType: "PRICE", condition: "ABOVE", threshold: "" });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Alerts</h1>
          <p className="text-sm text-muted-foreground mt-1">Create and manage price & indicator alerts</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/15 text-primary border border-primary/30 text-sm font-medium hover:bg-primary/25 transition-all">
          <Plus size={16} /> New Alert
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {alerts.map((alert) => (
          <div key={alert.id} className={`glass-card p-5 space-y-3 transition-all ${!alert.isActive ? "opacity-50" : ""}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell size={16} className={alert.isTriggered ? "text-yellow-400" : "text-primary"} />
                <span className="font-bold">{alert.symbol}</span>
                <span className="badge badge-neutral">{alert.alertType}</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => toggleAlert(alert.id)} className="text-muted hover:text-foreground transition-colors">
                  {alert.isActive ? <ToggleRight size={22} className="text-emerald-400" /> : <ToggleLeft size={22} />}
                </button>
                <button onClick={() => deleteAlert(alert.id)} className="p-1 text-muted hover:text-red-400 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <p className="text-sm">
              <span className="text-muted-foreground">{alert.condition.replace("_", " ")}</span>{" "}
              <span className="font-semibold">{formatNumber(alert.threshold, 0)}</span>
            </p>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              {alert.isTriggered ? (
                <span className="flex items-center gap-1 text-yellow-400"><AlertTriangle size={12} />Triggered {alert.triggeredAt ? timeAgo(alert.triggeredAt) : ""}</span>
              ) : (
                <span className="flex items-center gap-1 text-emerald-400"><CheckCircle size={12} />Active</span>
              )}
              <span>Created {timeAgo(alert.createdAt)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Alert Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass-card p-6 w-full max-w-md space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold">Create Alert</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Symbol</label>
                <select value={newAlert.symbol} onChange={(e) => setNewAlert({ ...newAlert, symbol: e.target.value })} className="w-full h-10 px-3 rounded-lg bg-background border border-border-default text-sm focus:outline-none focus:border-primary/50">
                  <option>NIFTY</option><option>BANKNIFTY</option><option>FINNIFTY</option><option>RELIANCE</option><option>TCS</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Alert Type</label>
                <select value={newAlert.alertType} onChange={(e) => setNewAlert({ ...newAlert, alertType: e.target.value as AlertType })} className="w-full h-10 px-3 rounded-lg bg-background border border-border-default text-sm focus:outline-none focus:border-primary/50">
                  <option value="PRICE">Price</option><option value="VOLUME">Volume</option><option value="OI">Open Interest</option>
                  <option value="RSI">RSI</option><option value="IV">Implied Volatility</option><option value="BREAKOUT">Breakout</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Condition</label>
                <select value={newAlert.condition} onChange={(e) => setNewAlert({ ...newAlert, condition: e.target.value as AlertCondition })} className="w-full h-10 px-3 rounded-lg bg-background border border-border-default text-sm focus:outline-none focus:border-primary/50">
                  <option value="ABOVE">Above</option><option value="BELOW">Below</option><option value="CROSSES_ABOVE">Crosses Above</option><option value="CROSSES_BELOW">Crosses Below</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Threshold</label>
                <input type="number" value={newAlert.threshold} onChange={(e) => setNewAlert({ ...newAlert, threshold: e.target.value })} placeholder="e.g. 25000" className="w-full h-10 px-3 rounded-lg bg-background border border-border-default text-sm focus:outline-none focus:border-primary/50" />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 h-10 rounded-lg border border-border-default text-sm hover:bg-surface-hover transition-colors">Cancel</button>
              <button onClick={addAlert} className="flex-1 h-10 rounded-lg bg-primary text-gray-900 font-semibold text-sm hover:bg-primary-hover transition-colors">Create Alert</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
