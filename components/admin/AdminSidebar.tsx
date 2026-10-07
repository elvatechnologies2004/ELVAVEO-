"use client";

import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard,
  Inbox,
  Layers,
  Users,
  Briefcase,
  Settings,
  ExternalLink,
  Shield,
  LogOut,
  X,
} from "lucide-react";
import { BRAND_LOGO, SITE_NAME } from "@/lib/constants";

export type AdminTab =
  | "overview"
  | "inquiries"
  | "products"
  | "team"
  | "projects"
  | "settings";

interface AdminSidebarProps {
  currentTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  unreadInquiriesCount: number;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onLock: () => void;
}

export default function AdminSidebar({
  currentTab,
  onSelectTab,
  unreadInquiriesCount,
  mobileOpen,
  onCloseMobile,
  onLock,
}: AdminSidebarProps) {
  const navItems: {
    id: AdminTab;
    label: string;
    icon: typeof LayoutDashboard;
    badge?: number;
  }[] = [
    { id: "overview", label: "Dashboard", icon: LayoutDashboard },
    {
      id: "inquiries",
      label: "Inquiries & Leads",
      icon: Inbox,
      badge: unreadInquiriesCount > 0 ? unreadInquiriesCount : undefined,
    },
    { id: "products", label: "Products & SaaS", icon: Layers },
    { id: "team", label: "Team Members", icon: Users },
    { id: "projects", label: "Portfolio Projects", icon: Briefcase },
    { id: "settings", label: "System & Settings", icon: Settings },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-navy/40 backdrop-blur-sm lg:hidden"
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-72 flex-col border-r border-white/80 bg-white/85 backdrop-blur-2xl transition-transform duration-300 shadow-2xl lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header / Brand lockup */}
        <div className="flex h-20 items-center justify-between border-b border-blue/10 px-6">
          <Link href="/admin" className="flex items-center gap-3">
            <Image
              src={BRAND_LOGO}
              alt={SITE_NAME}
              width={108}
              height={38}
              className="h-8 w-auto object-contain"
            />
            <span className="rounded-md border border-blue/20 bg-blue/10 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-blue">
              Admin
            </span>
          </Link>
          <button
            onClick={onCloseMobile}
            className="rounded-lg p-1.5 text-muted hover:bg-black/5 lg:hidden"
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto px-4 py-6">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-muted">
            Management Portal
          </p>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                className={`group flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-[14px] font-semibold transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-blue to-cyan text-white shadow-[0_8px_20px_-6px_rgba(37,99,255,0.45)]"
                    : "text-navy/80 hover:bg-blue/5 hover:text-blue"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    size={18}
                    className={isActive ? "text-white" : "text-blue/70 group-hover:text-blue"}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                      isActive
                        ? "bg-white text-blue"
                        : "bg-blue/15 text-blue"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          <div className="pt-6">
            <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-muted">
              Live Website
            </p>
            <Link
              href="/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between rounded-xl px-3.5 py-2.5 text-[14px] font-semibold text-navy/80 transition hover:bg-blue/5 hover:text-blue"
            >
              <div className="flex items-center gap-3">
                <ExternalLink size={18} className="text-muted" />
                <span>Visit Public Site</span>
              </div>
              <span className="text-[11px] font-medium text-muted">elvaveo.com</span>
            </Link>
          </div>
        </nav>

        {/* Admin Footer / User Profile */}
        <div className="border-t border-blue/10 bg-white/40 p-4">
          <div className="flex items-center justify-between rounded-xl border border-white/90 bg-white/70 p-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan via-blue to-violet text-xs font-bold text-white shadow-sm">
                SHA
              </div>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-bold text-navy">
                  Syed Hussain Ali
                </p>
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[11px] text-muted">Super Admin</span>
                </div>
              </div>
            </div>

            <button
              onClick={onLock}
              title="Lock Admin Console"
              className="rounded-lg p-2 text-muted transition hover:bg-rose-50 hover:text-rose-600"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
