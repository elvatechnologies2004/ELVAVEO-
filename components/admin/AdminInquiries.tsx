"use client";

import { useState } from "react";
import {
  Inbox,
  Search,
  Filter,
  Mail,
  Reply,
  CheckCircle,
  Archive,
  Trash2,
  ExternalLink,
  Plus,
  Clock,
  X,
  Send,
  MessageSquare,
  Download,
  Building2,
  Sparkles,
  Globe,
  FileText,
} from "lucide-react";
import type { InquiryItem } from "@/lib/dataStore";

interface AdminInquiriesProps {
  inquiries: InquiryItem[];
  onUpdateStatus: (id: string, status: "new" | "replied" | "archived") => Promise<void>;
  onDeleteInquiry: (id: string) => Promise<void>;
  onAddInquiry: (item: {
    name: string;
    email: string;
    subject: string;
    message: string;
    company?: string;
    source?: string;
  }) => Promise<void>;
  searchQuery: string;
}

export default function AdminInquiries({
  inquiries,
  onUpdateStatus,
  onDeleteInquiry,
  onAddInquiry,
  searchQuery,
}: AdminInquiriesProps) {
  const [statusFilter, setStatusFilter] = useState<"all" | "new" | "replied" | "archived">("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [topicFilter, setTopicFilter] = useState<string>("all");
  const [selectedInquiry, setSelectedInquiry] = useState<InquiryItem | null>(null);
  const [isAddingLead, setIsAddingLead] = useState(false);
  const [newLeadForm, setNewLeadForm] = useState({
    name: "",
    email: "",
    company: "",
    subject: "Software Development",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sources and topics for filtering
  const sources = Array.from(new Set(inquiries.map((i) => i.source).filter(Boolean))) as string[];
  const topics = Array.from(new Set(inquiries.map((i) => i.subject).filter(Boolean))) as string[];

  // Filtered inquiries
  const filtered = inquiries.filter((inquiry) => {
    // Status filter
    if (statusFilter !== "all" && inquiry.status !== statusFilter) return false;
    // Source filter
    if (sourceFilter !== "all" && inquiry.source !== sourceFilter) return false;
    // Topic filter
    if (topicFilter !== "all" && inquiry.subject !== topicFilter) return false;
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        inquiry.name.toLowerCase().includes(q) ||
        inquiry.email.toLowerCase().includes(q) ||
        inquiry.subject.toLowerCase().includes(q) ||
        inquiry.message.toLowerCase().includes(q) ||
        (inquiry.company && inquiry.company.toLowerCase().includes(q)) ||
        (inquiry.source && inquiry.source.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  const handleExportCSV = () => {
    const headers = [
      "ID",
      "Name",
      "Email",
      "Company",
      "Subject",
      "Status",
      "Source",
      "Country",
      "Score",
      "Created At",
      "Message",
    ];
    const rows = filtered.map((item) => [
      `"${item.id}"`,
      `"${(item.name || "").replace(/"/g, '""')}"`,
      `"${(item.email || "").replace(/"/g, '""')}"`,
      `"${(item.company || "").replace(/"/g, '""')}"`,
      `"${(item.subject || "").replace(/"/g, '""')}"`,
      `"${item.status}"`,
      `"${(item.source || "").replace(/"/g, '""')}"`,
      `"${(item.country || "").replace(/"/g, '""')}"`,
      `"${item.qualificationScore ?? ""}"`,
      `"${item.createdAt}"`,
      `"${(item.message || "").replace(/"/g, '""').replace(/\r?\n/g, " ")}"`,
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `elvaveo-leads-inquiries-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateDemoLead = async () => {
    setIsSubmitting(true);
    await onAddInquiry({
      name: "Ahmad Hassan",
      email: "ahmad.h@enterprise.pk",
      company: "Enterprise Logix PK",
      subject: "Software Development",
      source: "CRM Manual",
      message:
        "We are looking for full-cycle development of a high-performance web dashboard. Let's discuss architecture requirements.",
    });
    setIsSubmitting(false);
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadForm.name || !newLeadForm.email || !newLeadForm.message) return;
    setIsSubmitting(true);
    await onAddInquiry({
      name: newLeadForm.name,
      email: newLeadForm.email,
      company: newLeadForm.company || undefined,
      subject: newLeadForm.subject,
      source: "CRM Manual",
      message: newLeadForm.message,
    });
    setNewLeadForm({ name: "", email: "", company: "", subject: "Software Development", message: "" });
    setIsAddingLead(false);
    setIsSubmitting(false);
  };

  const handleDeleteWithConfirm = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete inquiry from "${name}"?`)) {
      await onDeleteInquiry(id);
      if (selectedInquiry?.id === id) {
        setSelectedInquiry(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="glass flex flex-col justify-between gap-4 rounded-[22px] p-5 shadow-card lg:flex-row lg:items-center">
        {/* Status filter tabs */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-blue/5 p-1">
          {(["all", "new", "replied", "archived"] as const).map((tab) => {
            const count =
              tab === "all"
                ? inquiries.length
                : inquiries.filter((i) => i.status === tab).length;
            const isActive = statusFilter === tab;
            return (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold capitalize transition-all ${
                  isActive
                    ? "bg-white text-blue shadow-sm"
                    : "text-muted hover:text-navy"
                }`}
              >
                <span>{tab}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                    isActive ? "bg-blue/10 text-blue" : "bg-black/5 text-muted"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Filters, Add Lead & Export */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Source Filter */}
          {sources.length > 0 && (
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="h-9 rounded-xl border border-blue/15 bg-white/80 px-3 text-xs font-semibold text-navy shadow-sm focus:border-blue focus:outline-none"
              title="Filter by lead source"
            >
              <option value="all">All Sources ({inquiries.length})</option>
              {sources.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          )}

          {/* Topic Filter */}
          {topics.length > 0 && (
            <select
              value={topicFilter}
              onChange={(e) => setTopicFilter(e.target.value)}
              className="h-9 rounded-xl border border-blue/15 bg-white/80 px-3 text-xs font-semibold text-navy shadow-sm focus:border-blue focus:outline-none"
              title="Filter by topic"
            >
              <option value="all">All Topics</option>
              {topics.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          )}

          {/* Export CSV button */}
          <button
            onClick={handleExportCSV}
            disabled={filtered.length === 0}
            className="flex h-9 items-center gap-1.5 rounded-xl border border-blue/20 bg-white/80 px-3 text-xs font-bold text-navy shadow-sm transition hover:bg-white disabled:opacity-50"
            title="Export inquiries to CSV"
          >
            <Download size={13} />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          {/* Add Lead button */}
          <button
            onClick={() => setIsAddingLead(true)}
            className="flex h-9 items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan via-blue to-violet px-3.5 text-xs font-bold text-white shadow-sm transition hover:opacity-95"
          >
            <Plus size={14} />
            <span>Add Lead</span>
          </button>

          {/* Simulate Demo Lead */}
          <button
            onClick={handleCreateDemoLead}
            disabled={isSubmitting}
            className="flex h-9 items-center gap-1.5 rounded-xl border border-blue/20 bg-white/80 px-3 text-xs font-bold text-blue shadow-sm transition hover:bg-white disabled:opacity-50"
            title="Create a sample lead to test live sync"
          >
            <Send size={13} />
            <span className="hidden sm:inline">Simulate Lead</span>
          </button>
        </div>
      </div>

      {/* Inquiries & Leads List */}
      <div className="glass overflow-hidden rounded-[24px] shadow-card">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue/10 text-blue">
              <Inbox size={26} />
            </div>
            <h3 className="mt-4 text-[16px] font-bold text-navy">No Inquiries Found</h3>
            <p className="mt-1 text-[13px] text-muted max-w-sm">
              There are no messages matching your selected filters. Try changing status or source filters.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-blue/10">
            {filtered.map((item) => {
              const isNew = item.status === "new";
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedInquiry(item)}
                  className={`group flex cursor-pointer flex-col justify-between gap-4 p-5 transition sm:flex-row sm:items-center ${
                    isNew ? "bg-white/95 font-semibold" : "bg-white/60 hover:bg-white/90"
                  }`}
                >
                  <div className="flex items-start gap-4 min-w-0">
                    {/* Monogram avatar */}
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xs font-bold shadow-sm ${
                        isNew
                          ? "bg-gradient-to-br from-cyan to-blue text-white"
                          : "bg-blue/10 text-blue"
                      }`}
                    >
                      {item.name.slice(0, 2).toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-[15px] font-bold text-navy group-hover:text-blue transition-colors">
                          {item.name}
                        </h4>

                        {item.company && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-blue/10 px-2 py-0.5 text-[11px] font-bold text-blue">
                            <Building2 size={11} />
                            <span>{item.company}</span>
                          </span>
                        )}

                        <span className="text-[12px] text-muted">&bull; {item.email}</span>

                        {isNew ? (
                          <span className="rounded-full bg-blue/10 px-2 py-0.5 text-[10px] font-extrabold uppercase text-blue">
                            New
                          </span>
                        ) : item.status === "replied" ? (
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-600">
                            Replied
                          </span>
                        ) : (
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold uppercase text-gray-600">
                            Archived
                          </span>
                        )}

                        {item.source && (
                          <span className="rounded-full bg-violet/10 px-2.5 py-0.5 text-[10px] font-bold text-violet">
                            {item.source}
                          </span>
                        )}

                        {typeof item.qualificationScore === "number" && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-extrabold text-amber-700">
                            <Sparkles size={10} />
                            <span>Score {item.qualificationScore}</span>
                          </span>
                        )}

                        {item.country && (
                          <span className="rounded-md bg-navy/5 px-1.5 py-0.5 text-[10px] font-bold text-navy/70">
                            {item.country}
                          </span>
                        )}

                        <span className="rounded-full border border-blue/15 bg-blue/5 px-2.5 py-0.5 text-[11px] font-medium text-blue">
                          {item.subject}
                        </span>
                      </div>

                      <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-muted">
                        {item.message}
                      </p>
                    </div>
                  </div>

                  {/* Right side actions */}
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="flex shrink-0 items-center gap-2 self-end sm:self-center"
                  >
                    <span className="mr-2 text-[11px] text-muted">
                      {new Date(item.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>

                    {/* Email Mailto button */}
                    <a
                      href={`mailto:${item.email}?subject=Re: ${encodeURIComponent(
                        item.subject
                      )} - ELVAVEO&body=${encodeURIComponent(
                        `Hi ${item.name.split(" ")[0] || item.name},\n\nThank you for connecting with ELVAVEO regarding ${item.subject}.\n\nBest regards,\nSyed Hussain Ali\nELVAVEO Team\nhttps://elvaveo.com`
                      )}`}
                      onClick={() => onUpdateStatus(item.id, "replied")}
                      title="Reply via Email Client"
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue/20 bg-white/80 text-blue hover:bg-blue hover:text-white transition-colors"
                    >
                      <Reply size={14} />
                    </a>

                    {/* Mark as Replied toggle */}
                    {item.status !== "replied" ? (
                      <button
                        onClick={() => onUpdateStatus(item.id, "replied")}
                        title="Mark as Replied"
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-500/20 bg-white/80 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-colors"
                      >
                        <CheckCircle size={14} />
                      </button>
                    ) : (
                      <button
                        onClick={() => onUpdateStatus(item.id, "new")}
                        title="Mark as Unread / New"
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue/20 bg-white/80 text-muted hover:bg-blue hover:text-white transition-colors"
                      >
                        <Inbox size={14} />
                      </button>
                    )}

                    {/* Archive toggle */}
                    {item.status !== "archived" ? (
                      <button
                        onClick={() => onUpdateStatus(item.id, "archived")}
                        title="Archive Lead"
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white/80 text-muted hover:bg-gray-600 hover:text-white transition-colors"
                      >
                        <Archive size={14} />
                      </button>
                    ) : (
                      <button
                        onClick={() => onUpdateStatus(item.id, "new")}
                        title="Move back to Inbox"
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue/20 bg-white/80 text-blue hover:bg-blue hover:text-white transition-colors"
                      >
                        <Inbox size={14} />
                      </button>
                    )}

                    {/* Delete button */}
                    <button
                      onClick={() => handleDeleteWithConfirm(item.id, item.name)}
                      title="Delete Inquiry"
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 bg-white/80 text-rose-500 hover:bg-rose-600 hover:text-white transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Inquiry / Lead Detail Modal */}
      {selectedInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-4 backdrop-blur-sm">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-white/80 bg-white p-6 shadow-2xl sm:p-8">
            <button
              onClick={() => setSelectedInquiry(null)}
              className="absolute right-5 top-5 rounded-full p-2 text-muted hover:bg-black/5"
            >
              <X size={18} />
            </button>

            {/* Header info */}
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan to-blue text-base font-bold text-white shadow-sm">
                {selectedInquiry.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-[20px] font-bold text-navy">
                    {selectedInquiry.name}
                  </h3>
                  {selectedInquiry.company && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-blue/10 px-2.5 py-0.5 text-xs font-bold text-blue">
                      <Building2 size={12} />
                      <span>{selectedInquiry.company}</span>
                    </span>
                  )}
                  {selectedInquiry.source && (
                    <span className="rounded-full bg-violet/10 px-2.5 py-0.5 text-xs font-bold text-violet">
                      {selectedInquiry.source}
                    </span>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-[13px] text-muted">
                  <a
                    href={`mailto:${selectedInquiry.email}`}
                    className="hover:text-blue hover:underline font-medium text-navy/80"
                  >
                    {selectedInquiry.email}
                  </a>
                  {selectedInquiry.country && (
                    <span>&bull; Location: {selectedInquiry.country}</span>
                  )}
                  {selectedInquiry.sourceUrl && (
                    <a
                      href={selectedInquiry.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue hover:underline"
                    >
                      <Globe size={12} />
                      <span>Source Link</span>
                      <ExternalLink size={11} />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Qualification score bar if available */}
            {typeof selectedInquiry.qualificationScore === "number" && (
              <div className="mt-5 rounded-2xl border border-amber-500/20 bg-amber-50/60 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                    <Sparkles size={14} className="text-amber-600" />
                    <span>Lead Qualification Match</span>
                  </div>
                  <span className="text-xs font-extrabold text-amber-700">
                    {selectedInquiry.qualificationScore} / 100
                  </span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-amber-200/60">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-500"
                    style={{ width: `${Math.min(100, selectedInquiry.qualificationScore)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Observations if available */}
            {selectedInquiry.observations && selectedInquiry.observations.length > 0 && (
              <div className="mt-4 rounded-2xl border border-blue/15 bg-blue/5 p-4">
                <div className="flex items-center gap-1.5 text-xs font-bold text-navy">
                  <Sparkles size={13} className="text-blue" />
                  <span>Technical &amp; Business Observations</span>
                </div>
                <ul className="mt-2 space-y-1.5 text-[12px] leading-relaxed text-navy/80">
                  {selectedInquiry.observations.map((obs, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-blue font-bold">&bull;</span>
                      <span>{obs}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Message Body */}
            <div className="mt-5 space-y-3 border-y border-blue/10 py-5">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div>
                  <span className="font-semibold text-muted">Topic / Service: </span>
                  <span className="rounded-md bg-blue/10 px-2 py-0.5 font-bold text-blue">
                    {selectedInquiry.subject}
                  </span>
                </div>
                <div className="text-muted">
                  Received: {new Date(selectedInquiry.createdAt).toLocaleString()}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted">
                  Message / Inquiries Content:
                </label>
                <div className="mt-2 rounded-2xl border border-blue/10 bg-ice p-4 text-[14px] leading-relaxed text-navy whitespace-pre-wrap">
                  {selectedInquiry.message}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={async () => {
                    const next = selectedInquiry.status === "replied" ? "new" : "replied";
                    await onUpdateStatus(selectedInquiry.id, next);
                    setSelectedInquiry({ ...selectedInquiry, status: next });
                  }}
                  className="rounded-xl border border-blue/20 bg-white px-3.5 py-2 text-xs font-bold text-navy hover:bg-blue/5 transition-colors"
                >
                  {selectedInquiry.status === "replied" ? "Mark as Unread" : "Mark as Replied"}
                </button>

                <button
                  onClick={async () => {
                    const next = selectedInquiry.status === "archived" ? "new" : "archived";
                    await onUpdateStatus(selectedInquiry.id, next);
                    setSelectedInquiry({ ...selectedInquiry, status: next });
                  }}
                  className="rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-bold text-muted hover:bg-gray-100 transition-colors"
                >
                  {selectedInquiry.status === "archived" ? "Move to Inbox" : "Archive"}
                </button>

                <button
                  onClick={async () => {
                    await handleDeleteWithConfirm(selectedInquiry.id, selectedInquiry.name);
                  }}
                  className="rounded-xl border border-rose-200 bg-white px-3.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  Delete
                </button>
              </div>

              <a
                href={`mailto:${selectedInquiry.email}?subject=Re: ${encodeURIComponent(
                  selectedInquiry.subject
                )} - ELVAVEO&body=${encodeURIComponent(
                  `Hi ${selectedInquiry.name.split(" ")[0] || selectedInquiry.name},\n\nThank you for reaching out to ELVAVEO regarding ${selectedInquiry.subject}.\n\nBest regards,\nSyed Hussain Ali\nELVAVEO Team\nhttps://elvaveo.com`
                )}`}
                onClick={() => onUpdateStatus(selectedInquiry.id, "replied")}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan via-blue to-violet px-5 py-2.5 text-xs font-bold text-white shadow-md hover:opacity-95"
              >
                <Send size={14} />
                <span>Reply via Email Client</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Add Lead Form Modal */}
      {isAddingLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-[28px] border border-white/80 bg-white p-6 shadow-2xl sm:p-8">
            <button
              onClick={() => setIsAddingLead(false)}
              className="absolute right-5 top-5 rounded-full p-2 text-muted hover:bg-black/5"
            >
              <X size={18} />
            </button>

            <h3 className="text-[18px] font-bold text-navy">Create Lead Entry</h3>
            <p className="mt-1 text-[13px] text-muted">
              Add a client inquiry manually to record offline, phone, or direct communications.
            </p>

            <form onSubmit={handleManualSubmit} className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-navy">Client Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bilal Tariq"
                  value={newLeadForm.name}
                  onChange={(e) =>
                    setNewLeadForm({ ...newLeadForm, name: e.target.value })
                  }
                  className="mt-1.5 w-full rounded-xl border border-blue/20 bg-ice px-3.5 py-2.5 text-xs font-medium text-navy focus:border-blue focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-navy">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="bilal@domain.com"
                    value={newLeadForm.email}
                    onChange={(e) =>
                      setNewLeadForm({ ...newLeadForm, email: e.target.value })
                    }
                    className="mt-1.5 w-full rounded-xl border border-blue/20 bg-ice px-3.5 py-2.5 text-xs font-medium text-navy focus:border-blue focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-navy">Company Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Apex Tech"
                    value={newLeadForm.company}
                    onChange={(e) =>
                      setNewLeadForm({ ...newLeadForm, company: e.target.value })
                    }
                    className="mt-1.5 w-full rounded-xl border border-blue/20 bg-ice px-3.5 py-2.5 text-xs font-medium text-navy focus:border-blue focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-navy">Topic / Required Service</label>
                <select
                  value={newLeadForm.subject}
                  onChange={(e) =>
                    setNewLeadForm({ ...newLeadForm, subject: e.target.value })
                  }
                  className="mt-1.5 w-full rounded-xl border border-blue/20 bg-ice px-3.5 py-2.5 text-xs font-medium text-navy focus:border-blue focus:bg-white focus:outline-none"
                >
                  <option value="Software Development">Software Development</option>
                  <option value="SaaS Products">SaaS Products</option>
                  <option value="Custom CRM / ERP">Custom CRM / ERP</option>
                  <option value="UI/UX Design">UI/UX Design</option>
                  <option value="Cloud Architecture">Cloud Architecture</option>
                  <option value="Consultation">Consultation</option>
                  <option value="Partnership">Partnership</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-navy">Inquiry Message *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Details of the project proposal, budget, requirements, or conversation notes..."
                  value={newLeadForm.message}
                  onChange={(e) =>
                    setNewLeadForm({ ...newLeadForm, message: e.target.value })
                  }
                  className="mt-1.5 w-full rounded-xl border border-blue/20 bg-ice px-3.5 py-2.5 text-xs font-medium text-navy focus:border-blue focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingLead(false)}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-muted hover:text-navy"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-gradient-to-r from-cyan via-blue to-violet px-5 py-2.5 text-xs font-bold text-white shadow-md hover:opacity-95 disabled:opacity-50"
                >
                  Save Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
