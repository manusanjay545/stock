"use client";

import { Search, Bell } from "lucide-react";
import { Input } from "@/components/ui/input";

export function Header() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur-md">
      <div className="flex flex-1 items-center gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search stocks, sectors, or indices..."
            className="w-full bg-muted/50 pl-9 border-none focus-visible:ring-1 focus-visible:ring-primary/50"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        {/* Market Status */}
        <div className="hidden md:flex items-center gap-2 text-sm">
          <div className="h-2 w-2 rounded-full bg-success shadow-[0_0_8px_rgba(var(--success),0.8)]"></div>
          <span className="text-muted-foreground">Market Open</span>
        </div>
        
        <button className="relative rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary shadow-[0_0_5px_rgba(var(--primary),0.8)]"></span>
        </button>
      </div>
    </header>
  );
}
