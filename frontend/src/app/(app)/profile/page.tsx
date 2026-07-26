"use client";

import { useState, useEffect } from "react";
import { User, Mail, Shield, Save, Crown, ArrowRight, LogOut } from "lucide-react";
import { usePlan } from "@/context/PlanContext";
import { useAuth } from "@/context/AuthContext";
import { PLANS } from "@/lib/plans";
import Link from "next/link";

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const { plan, isPro } = usePlan();
  const planConfig = PLANS[plan];

  const [displayName, setDisplayName] = useState("");
  const [defaultMarket, setDefaultMarket] = useState("NIFTY");
  const [notifications, setNotifications] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(
        user.user_metadata?.full_name ||
        user.user_metadata?.display_name ||
        user.email?.split("@")[0] || "Trader"
      );
    }
  }, [user]);

  const userEmail = user?.email || "trader@quantstrike.ai";
  const initials = displayName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "QS";

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account and preferences</p>
      </div>

      {/* Avatar + Info */}
      <div className="glass-card p-6 flex items-center gap-6">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center text-2xl font-bold text-gray-900">
          {initials}
        </div>
        <div>
          <h2 className="text-xl font-bold">{displayName}</h2>
          <p className="text-sm text-muted-foreground flex items-center gap-1"><Mail size={14} />{userEmail}</p>
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
          <p className="text-xs text-muted-foreground mt-1">
            Joined {user?.created_at ? new Date(user.created_at).toLocaleDateString("en-IN", { month: "long", year: "numeric" }) : "—"}
          </p>
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
            <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-background border border-border-default text-sm focus:outline-none focus:border-primary/50" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Email</label>
            <input type="email" value={userEmail} disabled
              className="w-full h-10 px-3 rounded-lg bg-surface border border-border-default text-sm text-muted-foreground cursor-not-allowed" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Auth Provider</label>
            <input type="text" value={user?.app_metadata?.provider || "email"} disabled
              className="w-full h-10 px-3 rounded-lg bg-surface border border-border-default text-sm text-muted-foreground cursor-not-allowed capitalize" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Default Market</label>
            <select value={defaultMarket} onChange={(e) => setDefaultMarket(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-background border border-border-default text-sm focus:outline-none focus:border-primary/50">
              <option>NIFTY</option><option>BANKNIFTY</option><option>FINNIFTY</option><option>SENSEX</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">Email Notifications</label>
              <p className="text-xs text-muted-foreground">Receive alerts via email</p>
            </div>
            <button onClick={() => setNotifications(!notifications)}
              className={`w-12 h-6 rounded-full transition-all relative ${notifications ? "bg-primary" : "bg-surface-hover border border-border-default"}`}>
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${notifications ? "left-6" : "left-0.5"}`} />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleSave}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-semibold transition-all ${saved ? "bg-emerald-500/20 text-emerald-400" : "bg-primary text-gray-900 hover:bg-primary-hover"}`}>
            <Save size={14} /> {saved ? "Saved ✓" : "Save Profile"}
          </button>
          <button onClick={signOut}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-red-400 border border-red-500/20 hover:bg-red-500/10 transition-all">
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
