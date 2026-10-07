"use client";

import {
  Inbox,
  Layers,
  Users,
  ShieldCheck,
  ArrowUpRight,
  Clock,
  Mail,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { useState, useEffect } from "react";
import type { InquiryItem } from "@/app/api/admin/inquiries/route";
import type { AdminTab } from "./AdminSidebar";
import { products as defaultProducts, type Product } from "@/data/products";
import { teamMembers as defaultTeam } from "@/data/team";

interface AdminOverviewProps {
  inquiries: InquiryItem[];
  onSelectTab: (tab: AdminTab) => void;
  onViewInquiry: (inquiry: InquiryItem) => void;
}

export default function AdminOverview({
  inquiries,
  onSelectTab,
  onViewInquiry,
}: AdminOverviewProps) {
  const [liveTeamCount, setLiveTeamCount] = useState(defaultTeam.length);
  const [liveProducts, setLiveProducts] = useState<Product[]>(defaultProducts);

  useEffect(() => {
    fetch("/api/admin/team")
      .then((r) => r.json())
      .then((d) => {
        if (d.team && Array.isArray(d.team)) setLiveTeamCount(d.team.length);
      })
      .catch(() => {});

    fetch("/api/admin/products")
      .then((r) => r.json())
      .then((d) => {
        if (d.products && Array.isArray(d.products)) setLiveProducts(d.products);
      })
      .catch(() => {});
  }, []);

  const newInquiries = inquiries.filter((i) => i.status === "new");
  const repliedInquiries = inquiries.filter((i) => i.status === "replied");

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-[24px] border border-white/80 bg-gradient-to-r from-[#e0f2fe]/80 via-[#ede9fe]/80 to-[#fdf4ff]/80 p-6 shadow-card backdrop-blur-xl sm:p-8">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-blue/20 bg-white/70 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-blue backdrop-blur-md">
            <Sparkles size={13} className="text-cyan" />
            ELVAVEO Command Center
          </span>
          <h2 className="mt-3 text-[24px] font-extrabold tracking-tight text-navy sm:text-[30px]">
            Welcome back, <span className="text-gradient">Syed Hussain Ali</span>
          </h2>
          <p className="mt-2 text-[14px] leading-relaxed text-muted sm:text-[15px]">
            Your digital products ecosystem, incoming client inquiries, and team
            showcase are performing smoothly across all channels.
          </p>
        </div>

        {/* Ambient glow decoration */}
        <div
          className="pointer-events-none absolute -right-10 -top-10 h-64 w-64 rounded-full bg-blue/15 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute right-40 -bottom-10 h-56 w-56 rounded-full bg-cyan/15 blur-3xl"
          aria-hidden="true"
        />
      </div>

      {/* 4 Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1: Inquiries */}
        <div
          onClick={() => onSelectTab("inquiries")}
          className="glass group cursor-pointer rounded-[20px] p-5 shadow-card transition duration-300 hover:-translate-y-1 hover:bg-white/90"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue/10 text-blue group-hover:bg-blue group-hover:text-white transition-colors">
              <Inbox size={22} />
            </div>
            <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-600">
              <TrendingUp size={12} />
              {newInquiries.length} New
            </span>
          </div>
          <p className="mt-4 text-[12px] font-bold uppercase tracking-wider text-muted">
            Total Inquiries
          </p>
          <p className="mt-1 text-[28px] font-extrabold text-navy">
            {inquiries.length}
          </p>
          <div className="mt-2 flex items-center justify-between text-[11px] text-muted">
            <span>{repliedInquiries.length} replied</span>
            <span className="font-semibold text-blue group-hover:underline">Manage &rarr;</span>
          </div>
        </div>

        {/* Metric 2: Live Products */}
        <div
          onClick={() => onSelectTab("products")}
          className="glass group cursor-pointer rounded-[20px] p-5 shadow-card transition duration-300 hover:-translate-y-1 hover:bg-white/90"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan/15 text-cyan-600 group-hover:bg-gradient-to-r group-hover:from-cyan group-hover:to-blue group-hover:text-white transition-all">
              <Layers size={22} />
            </div>
            <span className="rounded-full bg-cyan/10 px-2 py-0.5 text-[11px] font-bold text-cyan-700">
              100% Shipped
            </span>
          </div>
          <p className="mt-4 text-[12px] font-bold uppercase tracking-wider text-muted">
            Active SaaS Products
          </p>
          <p className="mt-1 text-[28px] font-extrabold text-navy">
            {liveProducts.length}
          </p>
          <div className="mt-2 flex items-center justify-between text-[11px] text-muted">
            <span>Finlo &amp; FinloCRM</span>
            <span className="font-semibold text-blue group-hover:underline">View suite &rarr;</span>
          </div>
        </div>

        {/* Metric 3: Team */}
        <div
          onClick={() => onSelectTab("team")}
          className="glass group cursor-pointer rounded-[20px] p-5 shadow-card transition duration-300 hover:-translate-y-1 hover:bg-white/90"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet/10 text-violet group-hover:bg-violet group-hover:text-white transition-colors">
              <Users size={22} />
            </div>
            <span className="rounded-full bg-violet/10 px-2 py-0.5 text-[11px] font-bold text-violet">
              Active Crew
            </span>
          </div>
          <p className="mt-4 text-[12px] font-bold uppercase tracking-wider text-muted">
            Team Members
          </p>
          <p className="mt-1 text-[28px] font-extrabold text-navy">
            {liveTeamCount}
          </p>
          <div className="mt-2 flex items-center justify-between text-[11px] text-muted">
            <span>Displayed on About</span>
            <span className="font-semibold text-blue group-hover:underline">Edit team &rarr;</span>
          </div>
        </div>

        {/* Metric 4: Platform Health */}
        <div
          onClick={() => onSelectTab("settings")}
          className="glass group cursor-pointer rounded-[20px] p-5 shadow-card transition duration-300 hover:-translate-y-1 hover:bg-white/90"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <ShieldCheck size={22} />
            </div>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-600">
              99.98% Uptime
            </span>
          </div>
          <p className="mt-4 text-[12px] font-bold uppercase tracking-wider text-muted">
            Platform Status
          </p>
          <p className="mt-1 text-[28px] font-extrabold text-navy">
            Healthy
          </p>
          <div className="mt-2 flex items-center justify-between text-[11px] text-muted">
            <span>Next.js 16 + Edge</span>
            <span className="font-semibold text-blue group-hover:underline">Diagnostics &rarr;</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Inquiries + Products Showcase */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Recent Inquiries (2 cols) */}
        <div className="glass rounded-[24px] p-6 shadow-card lg:col-span-2">
          <div className="flex items-center justify-between border-b border-blue/10 pb-4">
            <div>
              <h3 className="text-[17px] font-bold text-navy">Recent Inquiries &amp; Leads</h3>
              <p className="text-[12px] text-muted">
                Latest messages submitted via the contact portal
              </p>
            </div>
            <button
              onClick={() => onSelectTab("inquiries")}
              className="inline-flex items-center gap-1 text-[12px] font-bold text-blue hover:underline"
            >
              View All ({inquiries.length})
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="mt-4 divide-y divide-blue/5">
            {inquiries.slice(0, 4).map((inquiry) => {
              const isNew = inquiry.status === "new";
              return (
                <div
                  key={inquiry.id}
                  onClick={() => onViewInquiry(inquiry)}
                  className="group flex cursor-pointer items-start justify-between gap-4 py-3.5 transition hover:bg-white/60 -mx-2 px-2 rounded-xl"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue/10 text-blue font-bold text-xs">
                      {inquiry.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-[14px] font-bold text-navy group-hover:text-blue transition-colors">
                          {inquiry.name}
                        </p>
                        {isNew ? (
                          <span className="rounded-full bg-blue/10 px-2 py-0.5 text-[10px] font-bold text-blue">
                            New
                          </span>
                        ) : inquiry.status === "replied" ? (
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                            Replied
                          </span>
                        ) : (
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-600">
                            Archived
                          </span>
                        )}
                      </div>
                      <p className="truncate text-[12px] text-muted">
                        <span className="font-semibold text-navy/70">{inquiry.subject}:</span> {inquiry.message}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2 text-right">
                    <span className="text-[11px] text-muted">
                      {new Date(inquiry.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <button
                      className="rounded-lg p-1 text-muted transition hover:bg-blue/10 hover:text-blue"
                      title="Open inquiry"
                    >
                      <ArrowUpRight size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Products & Infrastructure */}
        <div className="space-y-6">
          {/* Products Snapshot */}
          <div className="glass rounded-[24px] p-6 shadow-card">
            <div className="flex items-center justify-between border-b border-blue/10 pb-4">
              <h3 className="text-[17px] font-bold text-navy">Live SaaS Products</h3>
              <button
                onClick={() => onSelectTab("products")}
                className="text-[12px] font-bold text-blue hover:underline"
              >
                Manage
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {liveProducts.map((prod) => (
                <div
                  key={prod.id}
                  className="rounded-2xl border border-white/90 bg-white/70 p-4 transition hover:bg-white hover:shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-600">
                        {prod.category}
                      </span>
                      <h4 className="text-[15px] font-bold text-navy">{prod.name}</h4>
                    </div>
                    <a
                      href={prod.href}
                      target="_blank"
                      rel="noreferrer"
                      className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue/10 text-blue hover:bg-blue hover:text-white transition-colors"
                      title="Visit Live Product"
                    >
                      <ExternalLink size={14} />
                    </a>
                  </div>
                  <p className="mt-2 line-clamp-2 text-[12px] text-muted">
                    {prod.description}
                  </p>
                  <div className="mt-3 flex items-center justify-between border-t border-blue/5 pt-2 text-[11px] text-muted">
                    <span className="flex items-center gap-1 font-semibold text-emerald-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Live in Production
                    </span>
                    <span className="font-mono text-[10px]">{prod.href.replace("https://", "")}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Infrastructure Status */}
          <div className="glass rounded-[24px] p-6 shadow-card">
            <h3 className="text-[17px] font-bold text-navy">Services &amp; Endpoints</h3>
            <div className="mt-4 space-y-2.5">
              <div className="flex items-center justify-between rounded-xl bg-white/60 px-3.5 py-2.5 text-[12px]">
                <span className="font-medium text-navy">Contact Form API</span>
                <span className="flex items-center gap-1 font-bold text-emerald-600">
                  <CheckCircle2 size={13} /> Active
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-white/60 px-3.5 py-2.5 text-[12px]">
                <span className="font-medium text-navy">Resend Delivery</span>
                <span className="flex items-center gap-1 font-bold text-emerald-600">
                  <CheckCircle2 size={13} /> Configured
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-white/60 px-3.5 py-2.5 text-[12px]">
                <span className="font-medium text-navy">Next.js App Router</span>
                <span className="flex items-center gap-1 font-bold text-emerald-600">
                  <CheckCircle2 size={13} /> v16.3 (Latest)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
