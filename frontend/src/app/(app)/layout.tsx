"use client";

import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { PlanProvider } from "@/context/PlanContext";
import { AuthProvider } from "@/context/AuthContext";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <PlanProvider>
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex-1 lg:ml-[260px] flex flex-col min-h-screen">
            <Header />
            <main className="flex-1 p-6 overflow-auto">{children}</main>
            {/* Disclaimer footer */}
            <footer className="px-6 py-3 border-t border-border-default text-center">
              <p className="text-[11px] text-muted">
                Disclaimer: All recommendations are probabilistic and for educational purposes only.
                Past performance does not guarantee future results. Options trading involves significant risk.
              </p>
            </footer>
          </div>
        </div>
      </PlanProvider>
    </AuthProvider>
  );
}
