"use client";

import { useState, useEffect } from "react";
import {
  Briefcase,
  ExternalLink,
  Plus,
  ArrowUpRight,
  Sparkles,
  X,
  Layers,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { showcaseProjects as initialProjects, type ShowcaseProject } from "@/data/projectShowcase";
import type { StoredProject } from "@/lib/dataStore";

export default function AdminProjects() {
  const [projectsList, setProjectsList] = useState<StoredProject[]>(
    initialProjects.map((p) => ({
      id: p.id,
      title: p.title,
      category: p.category,
      categoryLabel: p.categoryLabel,
      description: p.description,
      logo: p.logo,
      href: p.href,
      cta: p.cta,
      isProduct: p.isProduct,
    }))
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [filter, setFilter] = useState<"all" | "products" | "concepts">("all");
  const [isAdding, setIsAdding] = useState(false);
  const [newProject, setNewProject] = useState({
    title: "",
    category: "Web & Mobile",
    description: "",
    href: "https://elvaveo.com",
    isProduct: true,
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/projects");
      if (res.ok) {
        const data = await res.json();
        if (data.projects && Array.isArray(data.projects)) {
          setProjectsList(data.projects);
        }
      }
    } catch (err) {
      console.error("Failed to load projects:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const filtered = projectsList.filter((p) => {
    if (filter === "products") return p.isProduct;
    if (filter === "concepts") return !p.isProduct;
    return true;
  });

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.title || !newProject.description) return;

    const created: StoredProject = {
      id: `proj-${Date.now()}`,
      title: newProject.title,
      category: newProject.category,
      categoryLabel: newProject.category,
      description: newProject.description,
      logo: "/brand/elvaveo-logo.png",
      href: newProject.href,
      cta: "Explore Project",
      isProduct: newProject.isProduct,
    };

    const updated = [...projectsList, created];
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });

      if (res.ok) {
        setProjectsList(updated);
        showToast(`Saved ${created.title}! Project is now live on /projects.`);
        setIsAdding(false);
        setNewProject({
          title: "",
          category: "Web & Mobile",
          description: "",
          href: "https://elvaveo.com",
          isProduct: true,
        });
      } else {
        showToast("Error saving project.");
      }
    } catch (err) {
      console.error("Error saving project:", err);
      showToast("Error saving project.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-24 right-8 z-50 flex items-center gap-2.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/90 px-5 py-3 text-sm font-bold text-white shadow-xl backdrop-blur-xl animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="glass flex flex-col justify-between gap-4 rounded-[22px] p-6 shadow-card sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue/10 px-3 py-1 text-[11px] font-bold text-blue">
              <Briefcase size={13} />
              Connected Live to Website
            </span>
            <Link
              href="/projects"
              target="_blank"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-blue hover:underline"
            >
              <span>View Live on /projects</span>
              <ExternalLink size={12} />
            </Link>
          </div>
          <h2 className="mt-2 text-[20px] font-bold text-navy">
            Portfolio &amp; Showcase Projects
          </h2>
          <p className="text-[13px] text-muted">
            Projects and digital systems presented on the public <strong>/projects</strong> showcase.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchProjects}
            disabled={isLoading}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue/20 bg-white/80 text-navy hover:bg-white transition-colors"
            title="Reload projects from database"
          >
            <RefreshCw size={15} className={isLoading ? "animate-spin text-blue" : ""} />
          </button>

          {/* Filter Pills */}
          <div className="flex rounded-xl bg-blue/5 p-1">
            {(["all", "products", "concepts"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold capitalize transition-all ${
                  filter === tab
                    ? "bg-white text-blue shadow-sm"
                    : "text-muted hover:text-navy"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsAdding(true)}
            className="flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-cyan via-blue to-violet px-4 text-xs font-bold text-white shadow-md hover:opacity-95"
          >
            <Plus size={16} />
            <span>Add Project</span>
          </button>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {filtered.map((item) => (
          <article
            key={item.id}
            className="glass group rounded-[24px] p-6 shadow-card transition duration-300 hover:-translate-y-1 hover:bg-white/95"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue/10 text-blue group-hover:bg-blue group-hover:text-white transition-colors">
                  <Layers size={22} />
                </div>
                <div>
                  <span className="rounded-full bg-blue/10 px-2.5 py-0.5 text-[10px] font-bold text-blue">
                    {item.category}
                  </span>
                  <h3 className="mt-1 text-[18px] font-bold text-navy">
                    {item.title}
                  </h3>
                </div>
              </div>

              <a
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-blue/20 bg-white/80 text-blue hover:bg-blue hover:text-white transition-colors"
                title="Open Project URL"
              >
                <ArrowUpRight size={15} />
              </a>
            </div>

            <p className="mt-4 text-[13px] leading-relaxed text-muted">
              {item.description}
            </p>

            <div className="mt-5 flex items-center justify-between border-t border-blue/10 pt-4 text-[11px] text-muted">
              <span className="flex items-center gap-1.5 font-semibold text-emerald-600">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {item.isProduct ? "Shipped Product" : "Concept Prototype"}
              </span>
              <span className="font-mono text-[10px] text-blue">{item.href}</span>
            </div>
          </article>
        ))}
      </div>

      {/* Add Project Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-[28px] border border-white/80 bg-white p-6 shadow-2xl sm:p-8">
            <button
              onClick={() => setIsAdding(false)}
              className="absolute right-5 top-5 rounded-full p-2 text-muted hover:bg-black/5"
            >
              <X size={18} />
            </button>

            <h3 className="text-[18px] font-bold text-navy">Add Showcase Project</h3>
            <p className="mt-1 text-[13px] text-muted">
              Add a new portfolio entry. It will appear live on the public /projects page immediately.
            </p>

            <form onSubmit={handleAddProject} className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-navy">Project Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Health Portal"
                  value={newProject.title}
                  onChange={(e) =>
                    setNewProject({ ...newProject, title: e.target.value })
                  }
                  className="mt-1.5 w-full rounded-xl border border-blue/20 bg-ice px-3.5 py-2.5 text-xs font-medium text-navy focus:border-blue focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-navy">Category</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HealthTech, AI Automation"
                  value={newProject.category}
                  onChange={(e) =>
                    setNewProject({ ...newProject, category: e.target.value })
                  }
                  className="mt-1.5 w-full rounded-xl border border-blue/20 bg-ice px-3.5 py-2.5 text-xs font-medium text-navy focus:border-blue focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-navy">Project URL</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={newProject.href}
                  onChange={(e) =>
                    setNewProject({ ...newProject, href: e.target.value })
                  }
                  className="mt-1.5 w-full rounded-xl border border-blue/20 bg-ice px-3.5 py-2.5 text-xs font-medium text-navy focus:border-blue focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-navy">Description</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Project scope, technologies used, and outcomes..."
                  value={newProject.description}
                  onChange={(e) =>
                    setNewProject({ ...newProject, description: e.target.value })
                  }
                  className="mt-1.5 w-full rounded-xl border border-blue/20 bg-ice px-3.5 py-2.5 text-xs font-medium text-navy focus:border-blue focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-muted hover:text-navy"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-xl bg-gradient-to-r from-cyan via-blue to-violet px-5 py-2.5 text-xs font-bold text-white shadow-md hover:opacity-95 disabled:opacity-50"
                >
                  {isSaving ? "Saving Live..." : "Save Live to /projects"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
