"use client";

import Link from "next/link";
import { usePathname } from "next/pathname";
import { 
  LayoutDashboard, 
  LineChart, 
  Search, 
  List, 
  Briefcase, 
  Bell, 
  Settings,
  LogOut,
  Crown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Screener", href: "/screener", icon: Search },
  { name: "Charts", href: "/charts/RELIANCE", icon: LineChart },
  { name: "Watchlist", href: "/watchlist", icon: List },
  { name: "Portfolio", href: "/portfolio", icon: Briefcase },
  { name: "Alerts", href: "/alerts", icon: Bell },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  return (
    <div className="flex h-screen w-64 flex-col border-r border-border bg-sidebar px-4 py-6 text-sidebar-foreground">
      <div className="flex items-center gap-2 px-2 mb-8">
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(var(--primary),0.5)]">
          Q
        </div>
        <span className="text-xl font-bold tracking-tight">QuantStrike</span>
      </div>

      <nav className="flex-1 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                isActive 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-4 pt-4 border-t border-border">
        {user ? (
          <>
            <div className="rounded-lg bg-muted/50 p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                  {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{user.full_name || 'User'}</span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    {user.plan === 'PRO' ? (
                      <><Crown className="h-3 w-3 text-yellow-500" /> Pro Member</>
                    ) : (
                      'Free Plan'
                    )}
                  </span>
                </div>
              </div>
            </div>
            
            <button 
              onClick={logout}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <LogOut className="h-5 w-5" />
              Sign Out
            </button>
          </>
        ) : (
          <Link
            href="/login"
            className="flex w-full items-center justify-center rounded-md bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground shadow-[0_0_15px_rgba(var(--primary),0.3)] hover:bg-primary/90 transition-all"
          >
            Sign In
          </Link>
        )}
      </div>
    </div>
  );
}
