"use client";

import { useState } from "react";
import { Check, X, Crown, Zap, Shield, Star, ArrowRight, Sparkles } from "lucide-react";
import { PLANS, type UserPlan } from "@/lib/plans";
import { usePlan } from "@/context/PlanContext";

export default function PricingPage() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const { plan: currentPlan, setPlan, isPro } = usePlan();
  const [processing, setProcessing] = useState(false);

  const handleSubscribe = async (targetPlan: UserPlan) => {
    if (targetPlan === currentPlan) return;

    setProcessing(true);

    if (targetPlan === "PRO") {
      // In production: integrate Razorpay / Stripe here
      // For demo, simulate payment
      await new Promise((r) => setTimeout(r, 1500));
      setPlan("PRO");
      alert("🎉 Welcome to QuantStrike Pro! All features are now unlocked.");
    } else {
      setPlan("FREE");
    }
    setProcessing(false);
  };

  const savings = Math.round(((PLANS.PRO.price * 12 - PLANS.PRO.yearlyPrice) / (PLANS.PRO.price * 12)) * 100);

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
          <Sparkles size={12} /> Upgrade Your Trading Edge
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold">
          Choose Your{" "}
          <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Plan
          </span>
        </h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Unlock unlimited AI-powered recommendations, real-time data, and advanced analysis tools.
        </p>
      </div>

      {/* Billing Toggle */}
      <div className="flex items-center justify-center gap-3">
        <span className={`text-sm font-medium ${billing === "monthly" ? "text-foreground" : "text-muted-foreground"}`}>
          Monthly
        </span>
        <button
          onClick={() => setBilling(billing === "monthly" ? "yearly" : "monthly")}
          className={`relative w-14 h-7 rounded-full transition-all ${
            billing === "yearly"
              ? "bg-gradient-to-r from-cyan-500 to-emerald-500"
              : "bg-surface-hover border border-border-default"
          }`}
        >
          <span
            className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-all ${
              billing === "yearly" ? "left-7" : "left-0.5"
            }`}
          />
        </button>
        <span className={`text-sm font-medium ${billing === "yearly" ? "text-foreground" : "text-muted-foreground"}`}>
          Yearly
        </span>
        {billing === "yearly" && (
          <span className="badge badge-call text-xs">Save {savings}%</span>
        )}
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* FREE Plan */}
        <div
          className={`glass-card p-8 space-y-6 relative ${
            currentPlan === "FREE" ? "border-primary/30 shadow-[0_0_20px_rgba(6,182,212,0.08)]" : ""
          }`}
        >
          {currentPlan === "FREE" && (
            <div className="absolute top-4 right-4">
              <span className="badge badge-call">Current Plan</span>
            </div>
          )}
          <div>
            <h3 className="text-xl font-bold">Free</h3>
            <p className="text-sm text-muted-foreground mt-1">Get started with basic analysis</p>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-extrabold">₹0</span>
            <span className="text-muted-foreground">/month</span>
          </div>
          <button
            disabled={currentPlan === "FREE"}
            onClick={() => handleSubscribe("FREE")}
            className="w-full h-11 rounded-lg border border-border-default text-foreground font-semibold text-sm hover:bg-surface-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {currentPlan === "FREE" ? "Current Plan" : "Downgrade"}
          </button>
          <ul className="space-y-3">
            {PLANS.FREE.features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                <Check size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                {f}
              </li>
            ))}
            {/* Features NOT in Free */}
            {[
              "Detailed AI Explanations",
              "Full Balance Sheet Analysis",
              "Advanced Filters & Sorting",
              "Export to CSV / PDF",
              "Priority Support",
            ].map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-muted/50 line-through">
                <X size={16} className="text-red-400/50 shrink-0 mt-0.5" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* PRO Plan */}
        <div
          className={`glass-card p-8 space-y-6 relative border-2 ${
            currentPlan === "PRO"
              ? "border-amber-500/40 shadow-[0_0_30px_rgba(245,158,11,0.1)]"
              : "border-amber-500/20 shadow-[0_0_30px_rgba(245,158,11,0.05)]"
          }`}
        >
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-gray-900 text-xs font-bold">
              <Star size={12} /> MOST POPULAR
            </span>
          </div>
          {currentPlan === "PRO" && (
            <div className="absolute top-4 right-4">
              <span className="inline-flex items-center gap-1 badge bg-amber-500/15 text-amber-400 border-amber-500/20">
                <Crown size={10} /> Active
              </span>
            </div>
          )}
          <div>
            <h3 className="text-xl font-bold flex items-center gap-2">
              Pro <Crown size={20} className="text-amber-400" />
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Full access to all trading tools
            </p>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-extrabold">
              ₹{billing === "monthly" ? PLANS.PRO.price : Math.round(PLANS.PRO.yearlyPrice / 12)}
            </span>
            <span className="text-muted-foreground">/month</span>
            {billing === "yearly" && (
              <span className="text-xs text-muted-foreground ml-2">
                (₹{PLANS.PRO.yearlyPrice.toLocaleString("en-IN")}/year)
              </span>
            )}
          </div>
          {billing === "monthly" && (
            <p className="text-xs text-muted-foreground -mt-4">
              or ₹{PLANS.PRO.yearlyPrice.toLocaleString("en-IN")}/year (save {savings}%)
            </p>
          )}
          <button
            disabled={currentPlan === "PRO" || processing}
            onClick={() => handleSubscribe("PRO")}
            className="w-full h-11 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-gray-900 font-bold text-sm hover:from-amber-400 hover:to-orange-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
          >
            {processing ? (
              "Processing..."
            ) : currentPlan === "PRO" ? (
              <>
                <Crown size={16} /> Current Plan
              </>
            ) : (
              <>
                Upgrade to Pro <ArrowRight size={16} />
              </>
            )}
          </button>
          <ul className="space-y-3">
            {PLANS.PRO.features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm">
                <Check size={16} className="text-amber-400 shrink-0 mt-0.5" />
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Feature Comparison Table */}
      <div className="glass-card overflow-hidden">
        <div className="p-5 border-b border-border-default">
          <h3 className="text-lg font-bold">Feature Comparison</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-default">
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Feature</th>
                <th className="text-center p-4 text-sm font-semibold">Free</th>
                <th className="text-center p-4 text-sm font-semibold text-amber-400">
                  <span className="inline-flex items-center gap-1">
                    <Crown size={14} /> Pro
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row) => (
                <tr key={row.feature} className="border-b border-border-default/50 hover:bg-surface/30">
                  <td className="p-4 text-sm">{row.feature}</td>
                  <td className="p-4 text-center text-sm">
                    {typeof row.free === "boolean" ? (
                      row.free ? (
                        <Check size={16} className="text-emerald-400 mx-auto" />
                      ) : (
                        <X size={16} className="text-red-400/50 mx-auto" />
                      )
                    ) : (
                      <span className="text-muted-foreground">{row.free}</span>
                    )}
                  </td>
                  <td className="p-4 text-center text-sm">
                    {typeof row.pro === "boolean" ? (
                      row.pro ? (
                        <Check size={16} className="text-amber-400 mx-auto" />
                      ) : (
                        <X size={16} className="text-red-400/50 mx-auto" />
                      )
                    ) : (
                      <span className="font-semibold text-amber-400">{row.pro}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="text-lg font-bold">Frequently Asked Questions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FAQ q="Can I cancel anytime?" a="Yes, you can cancel or downgrade your plan at any time. Your Pro features will remain active until the end of your billing cycle." />
          <FAQ q="Is payment secure?" a="All payments are processed securely through Razorpay with bank-grade encryption. We never store your card details." />
          <FAQ q="Do I get a refund?" a="We offer a 7-day money-back guarantee. If you're not satisfied, contact support for a full refund." />
          <FAQ q="What payment methods are accepted?" a="We accept UPI, Credit Cards, Debit Cards, Net Banking, and Wallets via Razorpay." />
        </div>
      </div>
    </div>
  );
}

function FAQ({ q, a }: { q: string; a: string }) {
  return (
    <div className="p-4 rounded-lg bg-surface/50 border border-border-default">
      <h4 className="text-sm font-semibold mb-1">{q}</h4>
      <p className="text-sm text-muted-foreground">{a}</p>
    </div>
  );
}

const COMPARISON_ROWS = [
  { feature: "AI Recommendations", free: "5 / day", pro: "Unlimited" },
  { feature: "Market Scanner Results", free: "6", pro: "50+" },
  { feature: "Option Chain Strikes", free: "10", pro: "30" },
  { feature: "Active Alerts", free: "3", pro: "Unlimited" },
  { feature: "Watchlists", free: "2", pro: "Unlimited" },
  { feature: "Stock Screener Results", free: "20", pro: "Unlimited" },
  { feature: "Backtest Trades", free: "20", pro: "60" },
  { feature: "AI Explanations", free: false, pro: true },
  { feature: "Balance Sheet Analysis", free: false, pro: true },
  { feature: "Advanced Filters", free: false, pro: true },
  { feature: "Export Data (CSV/PDF)", free: false, pro: true },
  { feature: "Real-time Data", free: false, pro: true },
  { feature: "Priority Support", free: false, pro: true },
];
