"use client";

import { Lock, Crown } from "lucide-react";
import Link from "next/link";

interface ProGateProps {
  children: React.ReactNode;
  isPro: boolean;
  feature?: string;
  blur?: boolean; // blur content behind gate
}

/** Wraps content that requires PRO plan. Shows upgrade CTA for FREE users. */
export default function ProGate({ children, isPro, feature, blur = true }: ProGateProps) {
  if (isPro) return <>{children}</>;

  return (
    <div className="relative">
      {blur && (
        <div className="pointer-events-none select-none filter blur-sm opacity-40">
          {children}
        </div>
      )}
      <div className={`${blur ? "absolute inset-0" : ""} flex items-center justify-center`}>
        <div className="glass-card p-6 text-center max-w-sm mx-auto space-y-3">
          <div className="w-12 h-12 rounded-full bg-amber-500/15 flex items-center justify-center mx-auto">
            <Crown size={24} className="text-amber-400" />
          </div>
          <h3 className="text-lg font-bold">Pro Feature</h3>
          <p className="text-sm text-muted-foreground">
            {feature
              ? `${feature} is available exclusively for Pro subscribers.`
              : "This feature requires a Pro subscription."}
          </p>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-gray-900 font-bold text-sm hover:from-amber-400 hover:to-orange-400 transition-all shadow-lg shadow-amber-500/20"
          >
            <Lock size={14} />
            Upgrade to Pro
          </Link>
        </div>
      </div>
    </div>
  );
}

/** Small inline badge for pro-only items in lists */
export function ProBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/20">
      <Crown size={9} /> PRO
    </span>
  );
}
