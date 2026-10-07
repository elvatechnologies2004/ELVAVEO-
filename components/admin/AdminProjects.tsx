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
  Upload,
  Image as ImageIcon,
  Trash2,
  Edit2,
  AlertCircle,
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
  const [isUploading, setIsUploading] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const [filter, setFilter] = useState<"all" | "products" | "concepts">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [newProject, setNewProject] = useState({
    title: "",
    category: "EdTech & AI",
    description: "",
    logo: "/brand/camvia-logo.svg",
    href: "https://camvia.elvaveo.com",
    isProduct: true,
  });

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
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
      } else {
        showToast("Failed to load projects from server", "error");
      }
    } catch (err) {
      console.error("Failed to load projects:", err);
      showToast("Network error loading projects", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setNewProject({
      title: "",
      category: "EdTech & AI",
      description: "",
      logo: "/brand/camvia-logo.svg",
      href: "https://camvia.elvaveo.com",
      isProduct: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: StoredProject) => {
    setEditingId(item.id);
    setNewProject({
      title: item.title,
      category: item.category,
      description: item.description,
      logo: item.logo || "/brand/elvaveo-logo.3d7b3289.png",
      href: item.href,
      isProduct: item.isProduct,
    });
    setIsModalOpen(true);
  };

  const filtered = projectsList.filter((p) => {
    if (filter === "products") return p.isProduct;
    if (filter === "concepts") return !p.isProduct;
    return true;
  });

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      showToast("File is too large. Max size is 8MB.", "error");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        setNewProject((prev) => ({ ...prev, logo: data.url }));
        showToast("Logo uploaded successfully!", "success");
      } else {
        showToast(data.error || "Failed to upload logo file.", "error");
      }
    } catch (err) {
      console.error("Upload error:", err);
      showToast("Failed to connect to file upload service.", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = newProject.title.trim();
    const trimmedDesc = newProject.description.trim();

    if (!trimmedTitle || !trimmedDesc) {
      showToast("Title and description are required.", "error");
      return;
    }

    let finalUrl = newProject.href.trim();
    if (!finalUrl) {
      finalUrl = "https://elvaveo.com";
    } else if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = `https://${finalUrl}`;
    }

    const targetId = editingId || trimmedTitle.toLowerCase().replace(/[^a-z0-9]/g, "-") || `proj-${Date.now()}`;

    const projectPayload: StoredProject = {
      id: targetId,
      title: trimmedTitle,
      category: newProject.category.trim() || "Web & Mobile",
      categoryLabel: newProject.category.trim() || "Web & Mobile",
      description: trimmedDesc,
      logo: newProject.logo || "/brand/elvaveo-logo.3d7b3289.png",
      href: finalUrl,
      cta: "Explore Project",
      isProduct: newProject.isProduct,
    };

    const existingIndex = projectsList.findIndex((p) => p.id === targetId);
    const updated = existingIndex >= 0
      ? projectsList.map((p, idx) => (idx === existingIndex ? projectPayload : p))
      : [...projectsList, projectPayload];

    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setProjectsList(data.projects || updated);
        showToast(
          editingId
            ? `Updated ${projectPayload.title}! Saved live.`
            : `Saved ${projectPayload.title}! Project is now live on /projects.`,
          "success"
        );
        setIsModalOpen(false);
      } else {
        showToast(data.error || "Error saving project.", "error");
      }
    } catch (err: any) {
      console.error("Error saving project:", err);
      showToast(err?.message || "Error saving project.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProject = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to remove "${title}" from showcase?`)) {
      return;
    }

    const updated = projectsList.filter((p) => p.id !== id);
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setProjectsList(data.projects || updated);
        showToast(`Removed "${title}".`, "success");
      } else {
        showToast(data.error || "Failed to delete project.", "error");
      }
    } catch (err) {
      console.error("Error deleting project:", err);
      showToast("Error communicating with projects server.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-24 right-8 z-50 flex items-center gap-2.5 rounded-2xl border px-5 py-3 text-sm font-bold shadow-xl backdrop-blur-xl animate-in fade-in slide-in-from-top-4 ${
            toastMessage.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/90 text-white"
              : "border-rose-500/30 bg-rose-500/95 text-white"
          }`}
        >
          {toastMessage.type === "success" ? (
            <CheckCircle2 size={18} />
          ) : (
            <AlertCircle size={18} />
          )}
          <span>{toastMessage.text}</span>
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
            onClick={openAddModal}
            className="flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-cyan via-blue to-violet px-4 text-xs font-bold text-white shadow-md hover:opacity-95"
          >
            <Plus size={16} />
            <span>Add Showcase Project</span>
          </button>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {filtered.map((item) => (
          <article
            key={item.id}
            className="glass group flex flex-col justify-between rounded-[24px] p-6 shadow-card transition duration-300 hover:-translate-y-1 hover:bg-white/95"
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/90 bg-white p-2 shadow-xs">
                    {item.logo ? (
                      <img
                        src={item.logo}
                        alt={item.title}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <Layers size={22} className="text-blue" />
                    )}
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

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEditModal(item)}
                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-blue/15 bg-white/80 text-blue hover:bg-blue hover:text-white transition-colors"
                    title="Edit project"
                  >
                    <Edit2 size={13} />
                  </button>

                  <a
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-blue/20 bg-white/80 text-blue hover:bg-blue hover:text-white transition-colors"
                    title="Open Project URL"
                  >
                    <ArrowUpRight size={15} />
                  </a>

                  <button
                    onClick={() => handleDeleteProject(item.id, item.title)}
                    className="flex h-8 w-8 items-center justify-center rounded-xl text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                    title="Delete project"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <p className="mt-4 text-[13px] leading-relaxed text-muted line-clamp-3">
                {item.description}
              </p>
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-blue/10 pt-4 text-[11px] text-muted">
              <span className="flex items-center gap-1.5 font-semibold text-emerald-600">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {item.isProduct ? "Shipped Product / SaaS" : "Concept Prototype"}
              </span>
              <span className="font-mono text-[10px] text-blue truncate max-w-[170px]">{item.href.replace(/^https?:\/\//, "")}</span>
            </div>
          </article>
        ))}
      </div>

      {/* Add / Edit Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-[28px] border border-white/80 bg-white p-6 shadow-2xl sm:p-8 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-5 top-5 rounded-full p-2 text-muted hover:bg-black/5"
            >
              <X size={18} />
            </button>

            <h3 className="text-[18px] font-bold text-navy">
              {editingId ? `Edit ${newProject.title}` : "Add Showcase Project / SaaS"}
            </h3>
            <p className="mt-1 text-[13px] text-muted">
              {editingId
                ? "Update showcase entry details, logo, and classification live on the website."
                : "Add a new portfolio entry or SaaS product. It will appear live on the public /projects page immediately."}
            </p>

            <form onSubmit={handleSaveProject} className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-navy">Project Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CAMVIA, Apex Health Portal"
                  value={newProject.title}
                  onChange={(e) =>
                    setNewProject({ ...newProject, title: e.target.value })
                  }
                  className="mt-1.5 w-full rounded-xl border border-blue/20 bg-ice px-3.5 py-2.5 text-xs font-medium text-navy focus:border-blue focus:bg-white focus:outline-none"
                />
              </div>

              {/* Logo Upload & Selection */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-navy">Logo / Icon</label>
                  {isUploading && (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-blue">
                      <RefreshCw size={12} className="animate-spin" /> Uploading image...
                    </span>
                  )}
                </div>

                <div className="mt-1.5 flex flex-col sm:flex-row items-center gap-3.5 rounded-2xl border border-blue/20 bg-ice p-3.5">
                  <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/90 bg-white p-2 shadow-xs">
                    {newProject.logo ? (
                      <img
                        src={newProject.logo}
                        alt="Logo preview"
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <ImageIcon size={22} className="text-muted" />
                    )}
                  </div>

                  <div className="flex-1 w-full space-y-2">
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-blue/20 bg-white px-3 py-1.5 text-xs font-bold text-blue hover:bg-blue/5 transition-colors shadow-xs">
                      <Upload size={13} />
                      <span>Upload Logo File (SVG, PNG, JPG)</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="sr-only"
                      />
                    </label>

                    <input
                      type="text"
                      placeholder="e.g. /brand/camvia-logo.svg or /uploads/..."
                      value={newProject.logo}
                      onChange={(e) =>
                        setNewProject({ ...newProject, logo: e.target.value })
                      }
                      className="w-full rounded-lg border border-blue/15 bg-white px-3 py-1.5 text-xs font-mono text-navy focus:border-blue focus:outline-none"
                    />
                  </div>
                </div>

                {/* Presets */}
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="text-[10.5px] font-semibold text-muted">Presets:</span>
                  {[
                    { label: "CAMVIA Logo", path: "/brand/camvia-logo.svg" },
                    { label: "Finlo Logo", path: "/brand/finlo-logo.svg" },
                    { label: "FinloCRM Logo", path: "/brand/finlocrm-logo.png" },
                    { label: "ELVAVEO Brand", path: "/brand/elvaveo-logo.3d7b3289.png" },
                  ].map((preset) => (
                    <button
                      key={preset.path}
                      type="button"
                      onClick={() => setNewProject({ ...newProject, logo: preset.path })}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                        newProject.logo === preset.path
                          ? "bg-blue text-white shadow-xs"
                          : "bg-white/80 border border-blue/15 text-navy/80 hover:bg-white hover:text-blue"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-navy">Category</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. EdTech & AI, HealthTech, AI Automation"
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
                  type="text"
                  placeholder="e.g. camvia.elvaveo.com or https://..."
                  value={newProject.href}
                  onChange={(e) =>
                    setNewProject({ ...newProject, href: e.target.value })
                  }
                  className="mt-1.5 w-full rounded-xl border border-blue/20 bg-ice px-3.5 py-2.5 text-xs font-medium text-navy focus:border-blue focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-navy">Type</label>
                <div className="mt-1.5 flex gap-4">
                  <label className="flex items-center gap-2 text-xs font-semibold text-navy cursor-pointer">
                    <input
                      type="radio"
                      name="projType"
                      checked={newProject.isProduct}
                      onChange={() => setNewProject({ ...newProject, isProduct: true })}
                      className="accent-blue"
                    />
                    <span>Shipped Product / SaaS</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-navy cursor-pointer">
                    <input
                      type="radio"
                      name="projType"
                      checked={!newProject.isProduct}
                      onChange={() => setNewProject({ ...newProject, isProduct: false })}
                      className="accent-blue"
                    />
                    <span>Client / Concept Project</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-navy">Description *</label>
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
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-muted hover:text-navy"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || isUploading}
                  className="rounded-xl bg-gradient-to-r from-cyan via-blue to-violet px-5 py-2.5 text-xs font-bold text-white shadow-md hover:opacity-95 disabled:opacity-50"
                >
                  {isSaving ? "Saving Live..." : editingId ? "Save Changes" : "Save Live to /projects"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
