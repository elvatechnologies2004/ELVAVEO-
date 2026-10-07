"use client";

import { useState, useEffect } from "react";
import {
  Settings,
  ShieldCheck,
  CheckCircle2,
  Download,
  Globe,
  Mail,
  Server,
  Lock,
  RefreshCw,
} from "lucide-react";
import { SITE_NAME, SITE_URL, CONTACT_EMAIL } from "@/lib/constants";
import type { InquiryItem } from "@/app/api/admin/inquiries/route";
import { teamMembers } from "@/data/team";
import { products } from "@/data/products";

interface AdminSettingsProps {
  inquiries: InquiryItem[];
}

export default function AdminSettings({ inquiries }: AdminSettingsProps) {
  const [siteEmail, setSiteEmail] = useState(CONTACT_EMAIL);
  const [siteName, setSiteName] = useState(SITE_NAME);
  const [siteUrl, setSiteUrl] = useState(SITE_URL);
  const [tagline, setTagline] = useState("Software, SaaS & Digital Solutions");
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch settings from API
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/admin/settings");
        if (res.ok) {
          const data = await res.json();
          if (data.settings) {
            setSiteName(data.settings.siteName || SITE_NAME);
            setSiteEmail(data.settings.contactEmail || CONTACT_EMAIL);
            setSiteUrl(data.settings.siteUrl || SITE_URL);
            setTagline(data.settings.tagline || "Software, SaaS & Digital Solutions");
          }
        }
      } catch (err) {
        console.error("Failed to fetch settings:", err);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteName,
          siteUrl,
          contactEmail: siteEmail,
          tagline,
        }),
      });

      if (res.ok) {
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
      }
    } catch (err) {
      console.error("Failed to save settings:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportBackup = () => {
    const backupData = {
      exportedAt: new Date().toISOString(),
      site: {
        name: siteName,
        url: siteUrl,
        email: siteEmail,
        tagline,
      },
      inquiries,
      team: teamMembers,
      products,
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `elvaveo-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass rounded-[22px] p-6 shadow-card">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-bold text-emerald-600">
          <ShieldCheck size={13} />
          Configuration &amp; Diagnostics
        </span>
        <h2 className="mt-2 text-[20px] font-bold text-navy">
          System Diagnostics &amp; Global Settings
        </h2>
        <p className="text-[13px] text-muted">
          Platform configurations, environment diagnostics, and live data export.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column: General Configuration */}
        <div className="glass rounded-[24px] p-6 shadow-card">
          <h3 className="text-[16px] font-bold text-navy">Global Site Identity</h3>
          <p className="mt-1 text-[12px] text-muted">
            Core branding variables referenced across metadata, emails, and headers.
          </p>

          <form onSubmit={handleSave} className="mt-5 space-y-4">
            <div>
              <label className="text-xs font-bold text-navy">Organization Name</label>
              <input
                type="text"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-blue/20 bg-ice px-3.5 py-2.5 text-xs font-medium text-navy focus:border-blue focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-navy">Tagline / Headline</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-blue/20 bg-ice px-3.5 py-2.5 text-xs font-medium text-navy focus:border-blue focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-navy">Canonical URL</label>
              <input
                type="text"
                value={siteUrl}
                onChange={(e) => setSiteUrl(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-blue/20 bg-ice px-3.5 py-2.5 text-xs font-mono text-navy focus:border-blue focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-navy">Contact Inbox Email</label>
              <input
                type="email"
                value={siteEmail}
                onChange={(e) => setSiteEmail(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-blue/20 bg-ice px-3.5 py-2.5 text-xs font-medium text-navy focus:border-blue focus:bg-white focus:outline-none"
              />
              <p className="mt-1 text-[11px] text-muted">
                Inquiries submitted on the site are routed here via Resend.
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[12px] text-emerald-600 font-semibold">
                {isSaved && "Settings saved live on server!"}
              </span>
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-xl bg-gradient-to-r from-cyan via-blue to-violet px-5 py-2.5 text-xs font-bold text-white shadow-md hover:opacity-95 disabled:opacity-50"
              >
                {isSaving ? "Saving Live..." : "Save Settings"}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Platform Diagnostics & Backup */}
        <div className="space-y-6">
          <div className="glass rounded-[24px] p-6 shadow-card">
            <h3 className="text-[16px] font-bold text-navy">Platform Diagnostics</h3>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-white/70 p-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <Server size={15} className="text-blue" />
                  <span className="font-semibold text-navy">Next.js Framework</span>
                </div>
                <span className="font-mono text-[11px] text-emerald-600 font-bold">
                  v16.3.6 (App Router)
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-white/70 p-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <Mail size={15} className="text-blue" />
                  <span className="font-semibold text-navy">Resend Mail Transport</span>
                </div>
                <span className="font-mono text-[11px] text-emerald-600 font-bold">
                  Integrated
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-white/70 p-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <Globe size={15} className="text-blue" />
                  <span className="font-semibold text-navy">Data Persistence</span>
                </div>
                <span className="font-mono text-[11px] text-emerald-600 font-bold">
                  JSON Store + Live API
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-white/70 p-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <Lock size={15} className="text-blue" />
                  <span className="font-semibold text-navy">Security Sandbox</span>
                </div>
                <span className="font-mono text-[11px] text-emerald-600 font-bold">
                  Enforced
                </span>
              </div>
            </div>
          </div>

          {/* Backup Export */}
          <div className="glass rounded-[24px] p-6 shadow-card">
            <h3 className="text-[16px] font-bold text-navy">Database &amp; Data Export</h3>
            <p className="mt-1 text-[12px] text-muted">
              Download a full JSON archive of all contact inquiries, products, and team configurations.
            </p>

            <button
              onClick={handleExportBackup}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-blue/20 bg-white/80 py-2.5 text-xs font-bold text-navy hover:bg-white hover:text-blue transition-colors shadow-sm"
            >
              <Download size={14} />
              <span>Download Full System Backup (.json)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
