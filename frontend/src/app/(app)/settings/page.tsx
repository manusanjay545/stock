"use client";

import { useState, useEffect } from "react";
import { Settings as SettingsIcon, Save, RotateCcw } from "lucide-react";
import { generateSettings } from "@/lib/mockData";
import { DEFAULT_WEIGHTS } from "@/lib/constants";
import type { AppSettings, ScoreWeights } from "@/lib/types";

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setSettings(generateSettings()); }, []);

  if (!settings) return <div className="skeleton h-96 w-full" />;

  const updateWeight = (key: keyof ScoreWeights, value: number) => {
    setSettings({ ...settings, scoreWeights: { ...settings.scoreWeights, [key]: value / 100 } });
    setSaved(false);
  };

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };
  const handleReset = () => {
    setSettings({ ...settings, scoreWeights: { ...DEFAULT_WEIGHTS } });
    setSaved(false);
  };

  const weightTotal = Object.values(settings.scoreWeights).reduce((a, b) => a + b, 0) * 100;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure scoring weights, thresholds, and scanner rules</p>
      </div>

      {/* Score Weights */}
      <div className="glass-card p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Scoring Weights</h3>
          <span className={`text-sm font-semibold ${Math.abs(weightTotal - 100) < 1 ? "text-emerald-400" : "text-red-400"}`}>
            Total: {weightTotal.toFixed(0)}%
          </span>
        </div>
        {(Object.entries(settings.scoreWeights) as [keyof ScoreWeights, number][]).map(([key, val]) => (
          <WeightSlider key={key} label={key.replace(/([A-Z])/g, " $1").trim()} value={Math.round(val * 100)} onChange={(v) => updateWeight(key, v)} />
        ))}
        <div className="flex gap-3 pt-2">
          <button onClick={handleReset} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border-default text-sm text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-all">
            <RotateCcw size={14} /> Reset Defaults
          </button>
          <button onClick={handleSave} className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-semibold transition-all ${saved ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-primary text-gray-900 hover:bg-primary-hover"}`}>
            <Save size={14} /> {saved ? "Saved ✓" : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Thresholds */}
      <div className="glass-card p-6 space-y-5">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Thresholds & Rules</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Confidence Threshold (%)</label>
            <input type="number" value={settings.confidenceThreshold} onChange={(e) => setSettings({ ...settings, confidenceThreshold: +e.target.value })}
              className="w-full h-10 px-3 rounded-lg bg-background border border-border-default text-sm focus:outline-none focus:border-primary/50" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Risk Threshold (%)</label>
            <input type="number" value={settings.riskThreshold} onChange={(e) => setSettings({ ...settings, riskThreshold: +e.target.value })}
              className="w-full h-10 px-3 rounded-lg bg-background border border-border-default text-sm focus:outline-none focus:border-primary/50" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Scanner Frequency (seconds)</label>
            <input type="number" value={settings.scannerFrequency} onChange={(e) => setSettings({ ...settings, scannerFrequency: +e.target.value })}
              className="w-full h-10 px-3 rounded-lg bg-background border border-border-default text-sm focus:outline-none focus:border-primary/50" />
          </div>
        </div>
      </div>
    </div>
  );
}

function WeightSlider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium capitalize">{label}</label>
        <span className="text-sm font-bold text-primary">{value}%</span>
      </div>
      <input type="range" min={0} max={50} value={value} onChange={(e) => onChange(+e.target.value)}
        className="w-full h-2 accent-cyan-500 cursor-pointer" />
    </div>
  );
}
