"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, FileText, History, Rocket, Save, ShieldCheck } from "lucide-react";

interface PrivacyPolicyVersion {
  id: string;
  versionNumber?: number;
  title: string;
  content: string;
  summary: string;
  status: "draft" | "published" | "archived";
  createdAt: string;
  updatedAt: string;
  publishedAt?: string | null;
  publishedBy?: string | null;
  author: string;
}

interface PrivacyPolicyDocument {
  currentVersionId: string | null;
  updatedAt: string;
  versions: PrivacyPolicyVersion[];
}

const EMPTY_DOCUMENT: PrivacyPolicyDocument = {
  currentVersionId: null,
  updatedAt: new Date().toISOString(),
  versions: [],
};

function formatDate(value?: string | null) {
  if (!value) return "Not published yet";
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function AdminPrivacyPolicy() {
  const [document, setDocument] = useState<PrivacyPolicyDocument>(EMPTY_DOCUMENT);
  const [title, setTitle] = useState("Privacy Policy");
  const [summary, setSummary] = useState("Baseline privacy notice covering the ELVAVEO website and contact interactions.");
  const [content, setContent] = useState(`## Privacy policy

ELVAVEO respects the privacy of visitors, clients, and business contacts. This policy explains the information we collect through the ELVAVEO website and how we use it.

## Information we collect

We may collect information you provide directly through our website, including your name, email address, company, and message content when you contact us. We also automatically receive limited technical information such as browser type, operating system, referring page, and approximate usage data needed to keep the website secure and working correctly.

## How we use information

We use the information we collect to respond to inquiries, manage business conversations, provide services, improve the website, and maintain the security of our systems. We do not sell personal data.

## Cookies and analytics

Our site may use basic cookies or session tools that are necessary for basic site operation and security. If non-essential analytics or advertising tools are introduced in the future, we will update this policy and provide appropriate notice and consent controls before activating them for visitors.

## Sharing and third parties

We may share information with trusted service providers that help us operate our site, send email, or support business workflows. We limit sharing to what is necessary for those services and require reasonable safeguards. We may also disclose information when required by law, court order, or to protect legal rights and safety.

## Retention

We retain information only as long as needed to fulfill the purpose for which it was collected, to satisfy legal obligations, to resolve disputes, and to enforce agreements.

## Your rights and contact

You can contact us at hello@elvaveo.com to ask for access, correction, or deletion of personal data you have submitted through our website, to the extent applicable under applicable law. We will review requests in good faith and respond as required by law.

## Updates

This policy may be updated from time to time to reflect changes in our services, legal requirements, or operational practices. The most current version is the version published on this page.`);
  const [statusMessage, setStatusMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isWorking, setIsWorking] = useState(false);

  useEffect(() => {
    async function loadPolicy() {
      try {
        const res = await fetch("/api/admin/privacy-policy", { cache: "no-store" });
        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          setStatusMessage(errData?.error || "Could not load privacy policy.");
          return;
        }
        const data = await res.json();
        const policy = data.policy ?? EMPTY_DOCUMENT;
        setDocument(policy);

        const latest = policy.versions?.[policy.versions.length - 1] ?? null;
        if (latest) {
          setTitle(latest.title || "Privacy Policy");
          setSummary(latest.summary || "");
          setContent(latest.content || "");
        }
      } catch (error) {
        console.warn("Could not load privacy policy:", error);
        setStatusMessage("Could not load the latest privacy policy.");
      } finally {
        setIsLoading(false);
      }
    }

    loadPolicy();
  }, []);

  const currentPublished = useMemo(
    () => document.versions.find((version) => version.status === "published") ?? null,
    [document]
  );

  const latestDraft = useMemo(
    () => document.versions.filter((version) => version.status === "draft").slice(-1)[0] ?? null,
    [document]
  );

  async function submit(action: "save" | "publish" | "restore", versionId?: string) {
    setIsWorking(true);
    setStatusMessage("");

    try {
      const res = await fetch("/api/admin/privacy-policy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          title,
          summary,
          content,
          versionId,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update privacy policy");
      }

      setDocument(data.policy ?? document);
      const latest = (data.policy?.versions ?? []).slice(-1)[0] ?? null;
      if (latest) {
        setTitle(latest.title || "Privacy Policy");
        setSummary(latest.summary || "");
        setContent(latest.content || "");
      }
      setStatusMessage(action === "publish" ? "Privacy policy published live." : "Draft saved successfully.");
    } catch (error) {
      console.error("Privacy policy save failed:", error);
      setStatusMessage(error instanceof Error ? error.message : "Privacy policy update failed.");
    } finally {
      setIsWorking(false);
    }
  }

  if (isLoading) {
    return (
      <div className="glass rounded-[24px] p-8 shadow-card">
        <p className="text-sm text-muted">Loading policy editor…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="glass rounded-[24px] p-6 shadow-card">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue/10 px-3 py-1 text-[11px] font-bold text-blue">
          <ShieldCheck size={13} />
          Privacy policy management
        </span>
        <h2 className="mt-2 text-[20px] font-bold text-navy">Website Privacy Policy</h2>
        <p className="mt-1 text-[13px] text-muted">
          Draft, preview, and publish ELVAVEO privacy content without exposing a draft to the public site.
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-[12px]">
          <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 font-semibold text-emerald-700">
            Live: {currentPublished ? currentPublished.title : "No published version"}
          </span>
          <span className="rounded-full bg-amber-500/10 px-2.5 py-1 font-semibold text-amber-700">
            Draft: {latestDraft ? latestDraft.title : "No draft"}
          </span>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="glass rounded-[24px] p-6 shadow-card">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-navy">Policy title</label>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-blue/20 bg-ice px-3.5 py-2.5 text-sm text-navy focus:border-blue focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-navy">Summary</label>
              <input
                value={summary}
                onChange={(event) => setSummary(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-blue/20 bg-ice px-3.5 py-2.5 text-sm text-navy focus:border-blue focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-navy">Content</label>
              <textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                rows={18}
                className="mt-1.5 w-full rounded-xl border border-blue/20 bg-ice px-3.5 py-3 text-[13px] leading-7 text-navy focus:border-blue focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={() => submit("save")}
                disabled={isWorking}
                className="inline-flex items-center gap-2 rounded-xl border border-blue/20 bg-white px-4 py-2.5 text-xs font-bold text-navy shadow-sm transition hover:text-blue disabled:opacity-60"
              >
                <Save size={14} />
                {isWorking ? "Saving…" : "Save Draft"}
              </button>
              <button
                type="button"
                onClick={() => submit("publish")}
                disabled={isWorking}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan via-blue to-violet px-4 py-2.5 text-xs font-bold text-white shadow-md transition hover:opacity-95 disabled:opacity-60"
              >
                <Rocket size={14} />
                Publish Live
              </button>
            </div>

            {statusMessage ? (
              <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12px] font-medium text-emerald-700">
                {statusMessage}
              </p>
            ) : null}
          </div>
        </div>

        <aside className="space-y-6">
          <div className="glass rounded-[24px] p-5 shadow-card">
            <div className="flex items-center gap-2 text-[15px] font-bold text-navy">
              <Eye size={16} className="text-blue" />
              Preview status
            </div>
            <div className="mt-4 space-y-3 text-[12px] text-muted">
              <p>
                <span className="font-bold text-navy">Current live version:</span>{" "}
                {currentPublished ? currentPublished.title : "None"}
              </p>
              <p>
                <span className="font-bold text-navy">Last updated:</span>{" "}
                {formatDate(document.updatedAt)}
              </p>
              <p>
                <span className="font-bold text-navy">Draft status:</span>{" "}
                {latestDraft ? latestDraft.summary : "No current draft"}
              </p>
            </div>
          </div>

          <div className="glass rounded-[24px] p-5 shadow-card">
            <div className="flex items-center gap-2 text-[15px] font-bold text-navy">
              <History size={16} className="text-blue" />
              Version history
            </div>
            <div className="mt-4 space-y-3">
              {[...document.versions].reverse().map((version) => (
                <div key={version.id} className="rounded-xl border border-white/80 bg-white/70 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-[12px] font-bold text-navy">{version.title}</p>
                      <p className="text-[10px] text-muted">{version.status} · {formatDate(version.updatedAt)}</p>
                      {version.publishedBy ? (
                        <p className="text-[10px] text-muted">Published by {version.publishedBy}</p>
                      ) : null}
                    </div>
                    {version.status === "published" ? (
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        Live
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-[11px] leading-5 text-muted">{version.summary}</p>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setTitle(version.title);
                        setSummary(version.summary);
                        setContent(version.content);
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-blue/20 bg-white px-2 py-1.5 text-[10px] font-bold text-navy"
                    >
                      <FileText size={11} />
                      Load
                    </button>
                    {version.status !== "published" ? (
                      <button
                        type="button"
                        onClick={() => submit("restore", version.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-blue/20 bg-white px-2 py-1.5 text-[10px] font-bold text-navy"
                      >
                        <ShieldCheck size={11} />
                        Restore
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
