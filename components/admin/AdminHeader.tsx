"use client";

import { Menu, Search, Activity, RefreshCw } from "lucide-react";
import type { AdminTab } from "./AdminSidebar";

interface AdminHeaderProps {
  currentTab: AdminTab;
  onOpenMobile: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

const tabTitles: Record<AdminTab, { title: string; subtitle: string }> = {
  overview: {
    title: "Executive Overview",
    subtitle: "Real-time metrics, recent inquiries, and platform health",
  },
  inquiries: {
    title: "Inquiries & Leads",
    subtitle: "Direct contact submissions from clients and partners",
  },
  products: {
    title: "Products & SaaS Suite",
    subtitle: "Manage Finlo, FinloCRM, and active product ecosystems",
  },
  team: {
    title: "Team Management",
    subtitle: "Update team members, roles, and profiles shown on About page",
  },
  projects: {
    title: "Portfolio & Showcase",
    subtitle: "Curate featured projects and concept case studies",
  },
  settings: {
    title: "System Settings",
    subtitle: "Brand identity, API diagnostics, and platform configurations",
  },
};

export default function AdminHeader({
  currentTab,
  onOpenMobile,
  searchQuery,
  onSearchChange,
  onRefresh,
  isRefreshing,
}: AdminHeaderProps) {
  const current = tabTitles[currentTab];

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-white/80 bg-white/70 px-4 backdrop-blur-xl sm:px-8">
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Mobile menu button */}
        <button
          onClick={onOpenMobile}
          className="rounded-xl border border-blue/15 bg-white/80 p-2 text-navy hover:bg-white lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu size={20} />
        </button>

        {/* Page titles */}
        <div>
          <h1 className="text-[18px] font-bold tracking-tight text-navy sm:text-[22px]">
            {current.title}
          </h1>
          <p className="hidden text-[12px] text-muted sm:block">
            {current.subtitle}
          </p>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Search input */}
        <div className="relative hidden md:block">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Quick search..."
            className="h-10 w-48 rounded-xl border border-blue/15 bg-white/80 pl-9 pr-4 text-xs font-medium text-navy placeholder-muted shadow-sm transition-all focus:w-64 focus:border-blue focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue/20"
          />
        </div>

        {/* Live operational badge */}
        <div className="hidden items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-50/70 px-3 py-1.5 text-[11px] font-bold text-emerald-700 sm:flex">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
          </span>
          <Activity size={13} className="text-emerald-600" />
          <span>Operational</span>
        </div>

        {/* Refresh button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Refresh Data"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue/15 bg-white/80 text-navy/80 shadow-sm transition hover:border-blue/30 hover:bg-white hover:text-blue disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={isRefreshing ? "animate-spin text-blue" : ""}
          />
        </button>
      </div>
    </header>
  );
}
