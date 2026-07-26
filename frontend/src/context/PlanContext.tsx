"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { UserPlan } from "@/lib/plans";
import { PLANS } from "@/lib/plans";

interface PlanContextType {
  plan: UserPlan;
  setPlan: (plan: UserPlan) => void;
  isPro: boolean;
  loading: boolean;
}

const PlanContext = createContext<PlanContextType>({
  plan: "FREE",
  setPlan: () => {},
  isPro: false,
  loading: true,
});

export function PlanProvider({ children }: { children: ReactNode }) {
  const [plan, setPlanState] = useState<UserPlan>("FREE");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In production, fetch from Supabase profiles table
    // For now, check localStorage for demo
    const stored = localStorage.getItem("quantstrike_plan") as UserPlan | null;
    if (stored && (stored === "FREE" || stored === "PRO")) {
      setPlanState(stored);
    }
    setLoading(false);
  }, []);

  const setPlan = (newPlan: UserPlan) => {
    setPlanState(newPlan);
    localStorage.setItem("quantstrike_plan", newPlan);
  };

  return (
    <PlanContext.Provider value={{ plan, setPlan, isPro: plan === "PRO", loading }}>
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan() {
  return useContext(PlanContext);
}
