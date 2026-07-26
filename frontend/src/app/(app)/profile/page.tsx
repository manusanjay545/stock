"use client";

import { useState } from "react";
import { User, Mail, Shield, Save, Crown, Zap, ArrowRight } from "lucide-react";
import { usePlan } from "@/context/PlanContext";
import { PLANS } from "@/lib/plans";
import Link from "next/link";

export default function ProfilePage() {
  const [profile, setProfile] = useState({
    name: "Trader", email: "trader@quantstrike.ai",
    defaultMarket: "NIFTY", notifications: true, theme: "dark",
  });
  const [saved, setSaved] = useState(false);
  const { plan, isPro } = usePlan();
  const planConfig = PLANS[plan];

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account and preferences</p>
      </div>

      {/* Avatar + Info */}
      <div className="glass-card p-6 flex items-center gap-6">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center text-2xl font-bold text-gray-900">
          {profile.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="text-xl font-bold">{profile.name}</h2>
          <p className="text-sm text-muted-foreground flex items-center gap-1"><Mail size={14} />{profile.email}</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="badge badge-call"><Shield size={10} />Verified</span>
            {isPro ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/20">
                <Crown size={10} /> Pro Plan
              </span>
            ) : (
              <span className="badge badge-neutral">Free Plan</span>
            )}
          </div>
        </div>
      </div>

      {/* Subscription Card */}
      <div className={`glass-card p-6 space-y-4 ${isPro ? "border border-amber-500/20" : ""}`}>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Subscription</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-bold flex items-center gap-2">
              {isPro && <Crown size={18} className="text-amber-400" />}
              {planConfig.name} Plan
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {isPro
                ? "You have full access to all QuantStrike AI features."
                : "Upgrade to Pro for unlimited recommendations and advanced tools."}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-extrabold">
              ₹{planConfig.price}<span className="text-sm text-muted-foreground font-normal">/mo</span>
            </p>
            {isPro && (
              <span className="text-xs text-emerald-400 font-semibold">Active</span>
            )}
          </div>
        </div>
        {!isPro && (
          <Link href="/pricing" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-gray-900 font-bold text-sm hover:from-amber-400 hover:to-orange-400 transition-all shadow-lg shadow-amber-500/20">
            Upgrade to Pro <ArrowRight size={16} />
          </Link>
        )}
        {isPro && (
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border-default">
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <p className="text-sm font-semibold text-emerald-400">Active</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Billing</p>
              <p className="text-sm font-semibold">Monthly</p>
            </div>
          </div>
        )}
      </div>

      {/* Edit Form */}
      <div className="glass-card p-6 space-y-5">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Account Details</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Display Name</label>
            <input type="text" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="w-full h-10 px-3 rounded-lg bg-background border border-border-default text-sm focus:outline-none focus:border-primary/50" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Email</label>
            <input type="email" value={profile.email} disabled
              className="w-full h-10 px-3 rounded-lg bg-surface border border-border-default text-sm text-muted-foreground cursor-not-allowed" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Default Market</label>
            <select value={profile.defaultMarket} onChange={(e) => setProfile({ ...profile, defaultMarket: e.target.value })}
              className="w-full h-10 px-3 rounded-lg bg-background border border-border-default text-sm focus:outline-none focus:border-primary/50">
              <option>NIFTY</option><option>BANKNIFTY</option><option>FINNIFTY</option><option>SENSEX</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">Notifications</label>
              <p className="text-xs text-muted-foreground">Receive alerts via email</p>
            </div>
            <button onClick={() => setProfile({ ...profile, notifications: !profile.notifications })}
              className={`w-12 h-6 rounded-full transition-all relative ${profile.notifications ? "bg-primary" : "bg-surface-hover border border-border-default"}`}>
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${profile.notifications ? "left-6" : "left-0.5"}`} />
            </button>
          </div>
        </div>
        <button onClick={handleSave}
          className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-semibold transition-all ${saved ? "bg-emerald-500/20 text-emerald-400" : "bg-primary text-gray-900 hover:bg-primary-hover"}`}>
          <Save size={14} /> {saved ? "Saved ✓" : "Save Profile"}
        </button>
      </div>
    </div>
  );
}
