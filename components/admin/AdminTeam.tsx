"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  X,
  Sparkles,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Upload,
  Link as LinkIcon,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Move,
} from "lucide-react";
import Link from "next/link";
import { teamMembers as fallbackMembers, type TeamMember } from "@/data/team";
import LeadershipCard from "@/components/about/LeadershipCard";

function getAdminAuthHeaders(extraHeaders: Record<string, string> = {}) {
  const headers: Record<string, string> = { ...extraHeaders };
  if (typeof window !== "undefined") {
    const token =
      sessionStorage.getItem("elvaveo_admin_token") ||
      localStorage.getItem("elvaveo_admin_token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }
  return headers;
}

export default function AdminTeam() {
  const [members, setMembers] = useState<TeamMember[]>(fallbackMembers);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [editingMember, setEditingMember] = useState<{
    member: TeamMember;
    index: number;
  } | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [copied, setCopied] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Drag and drop state for card reordering
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formState, setFormState] = useState<TeamMember>({
    name: "",
    role: "",
    initials: "",
    description: "",
    image: "",
    linkedin: "",
  });

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch live team members from API
  const fetchTeam = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/team", {
        headers: getAdminAuthHeaders(),
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.team && Array.isArray(data.team)) {
          setMembers(data.team);
          try {
            localStorage.setItem("elvaveo_team_cache", JSON.stringify(data.team));
          } catch {}
        }
      } else {
        console.warn("Could not fetch team from API, falling back to local dataset.");
      }
    } catch (err) {
      console.error("Failed to load team from API:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  // Save updated team list to API & Website
  const persistTeam = async (updatedList: TeamMember[], message: string): Promise<boolean> => {
    setIsSaving(true);
    setFormError(null);
    try {
      const res = await fetch("/api/admin/team", {
        method: "POST",
        headers: getAdminAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(updatedList),
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data?.success) {
        const finalList = data.team && Array.isArray(data.team) ? data.team : updatedList;
        setMembers(finalList);

        // Instantly sync to website (localStorage + BroadcastChannel)
        try {
          localStorage.setItem("elvaveo_team_cache", JSON.stringify(finalList));
          if (typeof BroadcastChannel !== "undefined") {
            const ch = new BroadcastChannel("elvaveo_team_sync");
            ch.postMessage({ team: finalList });
            ch.close();
          }
        } catch {}

        showToast(message, "success");
        return true;
      } else {
        const errorText = data?.error || (res.status === 401 ? "Session expired. Please log in again." : "Error saving changes. Please try again.");
        setFormError(errorText);
        showToast(errorText, "error");
        return false;
      }
    } catch (err: any) {
      console.error("Save team error:", err);
      const errMsg = err?.message || "Failed to reach server. Please check your connection.";
      setFormError(errMsg);
      showToast(errMsg, "error");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Drag and Drop reordering handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverIdx !== index) {
      setDragOverIdx(index);
    }
  };

  const handleDragLeave = (e: React.DragEvent, index: number) => {
    if (dragOverIdx === index) {
      setDragOverIdx(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    setDragOverIdx(null);

    if (draggedIdx === null || draggedIdx === targetIndex) {
      setDraggedIdx(null);
      return;
    }

    const updated = [...members];
    const [draggedMember] = updated.splice(draggedIdx, 1);
    updated.splice(targetIndex, 0, draggedMember);

    setMembers(updated);
    setDraggedIdx(null);

    await persistTeam(
      updated,
      `Reordered sequence! Moved ${draggedMember.name} to position #${targetIndex + 1}. Saved live.`
    );
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  const moveMember = async (currentIndex: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= members.length) return;

    const updated = [...members];
    const [member] = updated.splice(currentIndex, 1);
    updated.splice(targetIndex, 0, member);

    setMembers(updated);
    await persistTeam(
      updated,
      `Reordered sequence! Moved ${member.name} to position #${targetIndex + 1}. Saved live.`
    );
  };

  const openAddModal = () => {
    setFormError(null);
    setFormState({
      name: "",
      role: "",
      initials: "",
      description: "",
      image: "",
      imagePosition: "50% 20%",
      imageScale: 1,
      linkedin: "https://www.linkedin.com/",
    });
    setIsAdding(true);
  };

  const openEditModal = (member: TeamMember, index: number) => {
    setFormError(null);
    setFormState({
      name: member.name || "",
      role: member.role || "",
      initials: member.initials || "",
      description: member.description || "",
      image: member.image || "",
      imagePosition: member.imagePosition || "50% 20%",
      imageScale: typeof member.imageScale === "number" ? member.imageScale : 1,
      linkedin: member.linkedin || "",
    });
    setEditingMember({ member, index });
  };

  // Live photo upload handler
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      showToast("File is too large. Maximum image size is 8MB.", "error");
      return;
    }

    setIsUploadingPhoto(true);
    setFormError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        headers: getAdminAuthHeaders(),
        body: formData,
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data?.url) {
        setFormState((prev) => ({ ...prev, image: data.url }));
        showToast("Profile photo uploaded successfully!", "success");
      } else {
        const uploadErr = data?.error || "Failed to upload image. You can also paste an image URL directly.";
        setFormError(uploadErr);
        showToast(uploadErr, "error");
      }
    } catch (err) {
      console.error("Photo upload error:", err);
      showToast("Failed to upload photo. Try pasting image URL.", "error");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedName = formState.name.trim();
    const trimmedRole = formState.role.trim();
    const trimmedDesc = formState.description.trim();

    if (!trimmedName) {
      setFormError("Full Name is required.");
      return;
    }
    if (!trimmedRole) {
      setFormError("Role / Designation is required.");
      return;
    }
    if (!trimmedDesc) {
      setFormError("Bio / Description is required.");
      return;
    }

    // Auto-generate initials if not entered
    const initials =
      formState.initials?.trim().toUpperCase() ||
      trimmedName
        .split(" ")
        .filter(Boolean)
        .map((p) => p[0])
        .join("")
        .toUpperCase()
        .slice(0, 3) ||
      "EL";

    // Normalize LinkedIn URL
    let linkedinUrl = formState.linkedin?.trim() || "";
    if (linkedinUrl && !linkedinUrl.startsWith("http://") && !linkedinUrl.startsWith("https://")) {
      linkedinUrl = `https://${linkedinUrl}`;
    }

    const updatedItem: TeamMember = {
      name: trimmedName,
      role: trimmedRole,
      description: trimmedDesc,
      initials,
      image: formState.image?.trim() || undefined,
      imagePosition: formState.imagePosition?.trim() || undefined,
      imageScale: formState.imageScale || 1,
      linkedin: linkedinUrl || undefined,
    };

    let updatedList: TeamMember[];
    let successMsg = "";

    if (editingMember !== null) {
      updatedList = [...members];
      updatedList[editingMember.index] = updatedItem;
      successMsg = `Updated ${updatedItem.name}! Changes are now live on website.`;
    } else {
      updatedList = [...members, updatedItem];
      successMsg = `Added ${updatedItem.name}! Changes are now live on website.`;
    }

    // Only close modal if persisting actually succeeded!
    const success = await persistTeam(updatedList, successMsg);
    if (success) {
      setIsAdding(false);
      setEditingMember(null);
    }
  };

  const handleDelete = async (index: number) => {
    const memberName = members[index]?.name || "Member";
    if (!confirm(`Are you sure you want to remove "${memberName}" from the live team slider?`)) {
      return;
    }

    const updated = members.filter((_, i) => i !== index);
    await persistTeam(updated, `Removed ${memberName}! Website updated.`);
  };

  const copyCode = () => {
    const code = `export const teamMembers: TeamMember[] = ${JSON.stringify(
      members,
      null,
      2
    )};`;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Preview initials for card in modal
  const previewInitials =
    formState.initials?.trim().toUpperCase() ||
    (formState.name
      ? formState.name
          .split(" ")
          .filter(Boolean)
          .map((p) => p[0])
          .join("")
          .toUpperCase()
          .slice(0, 3)
      : "ZH");

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-24 right-8 z-50 flex items-center gap-2.5 rounded-2xl border px-5 py-3 text-sm font-bold text-white shadow-xl backdrop-blur-xl animate-in fade-in slide-in-from-top-4 ${
            toast.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/90"
              : "border-rose-500/30 bg-rose-500/95"
          }`}
        >
          {toast.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="glass flex flex-col justify-between gap-4 rounded-[22px] p-6 shadow-card sm:flex-row sm:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-violet/10 px-3 py-1 text-[11px] font-bold text-violet">
              <Users size={13} />
              Connected Live to Website ({members.length} Active Members)
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-blue/10 px-3 py-1 text-[11px] font-bold text-blue">
              <Move size={11} />
              Drag &amp; drop cards to reorder sequence
            </span>
            <Link
              href="/about#team"
              target="_blank"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-blue hover:underline"
            >
              <span>View Live on /about</span>
              <ExternalLink size={12} />
            </Link>
          </div>
          <h2 className="mt-2 text-[20px] font-bold text-navy">
            Team Members &amp; Leadership Management
          </h2>
          <p className="text-[13px] text-muted">
            Drag cards or use arrow buttons to reorder positions. Any change <strong>instantly updates</strong> the public About page team slider.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchTeam}
            disabled={isLoading}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue/20 bg-white/80 text-navy hover:bg-white transition-colors"
            title="Reload team from database"
          >
            <RefreshCw size={15} className={isLoading ? "animate-spin text-blue" : ""} />
          </button>

          <button
            onClick={copyCode}
            className="flex h-10 items-center gap-2 rounded-xl border border-blue/20 bg-white/80 px-3.5 text-xs font-bold text-blue shadow-sm hover:bg-white transition-colors"
            title="Copy current team data as TypeScript code"
          >
            {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
            <span>{copied ? "Copied!" : "Export Code"}</span>
          </button>

          <button
            onClick={openAddModal}
            disabled={isSaving}
            className="flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-cyan via-blue to-violet px-4 text-xs font-bold text-white shadow-md hover:opacity-95 transition-opacity disabled:opacity-50 cursor-pointer"
          >
            <Plus size={16} />
            <span>Add Member</span>
          </button>
        </div>
      </div>

      {/* Grid of Team Cards with Drag and Drop Sequence Support */}
      <div className="grid gap-6 lg:grid-cols-2">
        {members.map((member, idx) => (
          <div
            key={member.name + idx}
            draggable={!isSaving}
            onDragStart={(e) => handleDragStart(e, idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDragLeave={(e) => handleDragLeave(e, idx)}
            onDrop={(e) => handleDrop(e, idx)}
            onDragEnd={handleDragEnd}
            className={`relative group rounded-[28px] transition-all duration-200 ${
              draggedIdx === idx
                ? "opacity-35 scale-[0.98] ring-2 ring-dashed ring-blue"
                : dragOverIdx === idx
                ? "scale-[1.02] ring-2 ring-blue ring-offset-4 shadow-2xl z-30"
                : ""
            }`}
          >
            {/* Top Sequence & Drag Reorder Bar */}
            <div className="mb-2.5 flex items-center justify-between rounded-xl bg-white/70 backdrop-blur-sm border border-blue/15 px-3 py-1.5 shadow-xs">
              <div className="flex items-center gap-2">
                {/* Sequence position badge */}
                <span className="flex items-center gap-1 rounded-full bg-blue/10 px-2 py-0.5 text-[11px] font-extrabold text-blue">
                  <span>#{idx + 1}</span>
                  {idx === 0 && <span className="text-[9px] uppercase font-bold text-violet">(First)</span>}
                </span>

                {/* Drag handle */}
                <div
                  className="flex items-center gap-1 cursor-grab active:cursor-grabbing rounded-lg bg-white border border-blue/15 px-2 py-0.5 text-[11px] font-semibold text-muted hover:text-blue hover:border-blue/30 shadow-2xs transition-colors"
                  title="Drag and drop to reorder member position"
                >
                  <GripVertical size={13} className="text-blue shrink-0" />
                  <span className="text-[11px]">Drag to reorder</span>
                </div>
              </div>

              {/* Action buttons: Move Up, Move Down, Edit, Delete */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={idx === 0 || isSaving}
                  onClick={() => moveMember(idx, "up")}
                  title="Move member up / left in sequence"
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-blue/15 bg-white text-navy hover:bg-blue hover:text-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-navy transition-colors cursor-pointer"
                >
                  <ArrowUp size={12} />
                </button>

                <button
                  type="button"
                  disabled={idx === members.length - 1 || isSaving}
                  onClick={() => moveMember(idx, "down")}
                  title="Move member down / right in sequence"
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-blue/15 bg-white text-navy hover:bg-blue hover:text-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-navy transition-colors cursor-pointer"
                >
                  <ArrowDown size={12} />
                </button>

                <button
                  type="button"
                  onClick={() => openEditModal(member, idx)}
                  title="Edit member details"
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-blue/20 bg-white text-blue hover:bg-blue hover:text-white transition-colors cursor-pointer ml-1"
                >
                  <Edit2 size={12} />
                </button>

                {members.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleDelete(idx)}
                    title="Delete member"
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-rose-200 bg-white text-rose-600 hover:bg-rose-600 hover:text-white transition-colors cursor-pointer"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Live rendered LeadershipCard */}
            <LeadershipCard variant="person" {...member} />
          </div>
        ))}
      </div>

      {/* Modal: Add or Edit Member */}
      {(isAdding || editingMember !== null) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/50 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-xl rounded-[28px] border border-white/80 bg-white p-6 shadow-2xl sm:p-8 my-8 max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => {
                setIsAdding(false);
                setEditingMember(null);
                setFormError(null);
              }}
              className="absolute right-5 top-5 rounded-full p-2 text-muted hover:bg-black/5 cursor-pointer"
            >
              <X size={18} />
            </button>

            <h3 className="text-[19px] font-bold text-navy flex items-center gap-2">
              <Sparkles size={18} className="text-blue" />
              <span>{editingMember !== null ? "Edit Team Member" : "Add New Team Member"}</span>
            </h3>
            <p className="mt-1 text-[13px] text-muted">
              Saving here will update the live About page team slider immediately.
            </p>

            {/* Error Banner inside modal */}
            {formError && (
              <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs font-semibold text-rose-600 animate-in fade-in">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="mt-5 space-y-4">
              {/* Full Name & Designation */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-bold text-navy">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Zeeshan Haider"
                    value={formState.name}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormState({ ...formState, name: val });
                      if (formError) setFormError(null);
                    }}
                    className="mt-1.5 w-full rounded-xl border border-blue/20 bg-ice px-3.5 py-2.5 text-xs font-medium text-navy focus:border-blue focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-navy">Role / Designation *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lead Full-Stack Engineer"
                    value={formState.role}
                    onChange={(e) => {
                      setFormState({ ...formState, role: e.target.value });
                      if (formError) setFormError(null);
                    }}
                    className="mt-1.5 w-full rounded-xl border border-blue/20 bg-ice px-3.5 py-2.5 text-xs font-medium text-navy focus:border-blue focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Monogram Initials & LinkedIn */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-bold text-navy">
                    Monogram Initials (Auto or Custom)
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    placeholder={`e.g. ${previewInitials}`}
                    value={formState.initials || ""}
                    onChange={(e) =>
                      setFormState({ ...formState, initials: e.target.value.toUpperCase() })
                    }
                    className="mt-1.5 w-full rounded-xl border border-blue/20 bg-ice px-3.5 py-2.5 text-xs font-medium text-navy focus:border-blue focus:bg-white focus:outline-none uppercase"
                  />
                  <p className="mt-1 text-[10.5px] text-muted">
                    Leave blank to auto-generate from name ({previewInitials})
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-navy">LinkedIn URL (Optional)</label>
                  <input
                    type="text"
                    placeholder="https://www.linkedin.com/in/username"
                    value={formState.linkedin || ""}
                    onChange={(e) =>
                      setFormState({ ...formState, linkedin: e.target.value })
                    }
                    className="mt-1.5 w-full rounded-xl border border-blue/20 bg-ice px-3.5 py-2.5 text-xs font-medium text-navy focus:border-blue focus:bg-white focus:outline-none"
                  />
                  <p className="mt-1 text-[10.5px] text-muted">
                    Full link or linkedin.com/in/username
                  </p>
                </div>
              </div>

              {/* Profile Photo / Avatar Upload */}
              <div className="rounded-2xl border border-blue/15 bg-ice/50 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-navy">
                    Profile Portrait Photo (Optional)
                  </label>
                  {formState.image && (
                    <button
                      type="button"
                      onClick={() => setFormState({ ...formState, image: "" })}
                      className="text-[11px] font-bold text-rose-500 hover:underline cursor-pointer"
                    >
                      Remove Photo
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {/* Avatar Preview */}
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-white bg-gradient-to-br from-[#d9f4ff] via-[#e9edff] to-[#f1e8ff] shadow-sm flex items-center justify-center">
                    {formState.image ? (
                      <Image
                        src={formState.image}
                        alt="Preview"
                        fill
                        className="object-cover"
                        unoptimized
                        style={{
                          objectPosition: formState.imagePosition || "50% 20%",
                          transform: `scale(${formState.imageScale || 1})`,
                          transformOrigin: formState.imagePosition || "center",
                        }}
                      />
                    ) : (
                      <span className="text-sm font-black text-blue">
                        {previewInitials}
                      </span>
                    )}
                  </div>

                  {/* Upload button & direct URL input */}
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        className="hidden"
                        onChange={handlePhotoUpload}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingPhoto}
                        className="flex items-center gap-1.5 rounded-xl border border-blue/20 bg-white px-3 py-1.5 text-xs font-bold text-navy shadow-xs hover:bg-blue/5 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {isUploadingPhoto ? (
                          <RefreshCw size={13} className="animate-spin text-blue" />
                        ) : (
                          <Upload size={13} className="text-blue" />
                        )}
                        <span>{isUploadingPhoto ? "Uploading..." : "Upload Photo"}</span>
                      </button>

                      <span className="text-[11px] text-muted">or paste URL:</span>
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        placeholder="https://... or /brand/photo.jpg"
                        value={formState.image || ""}
                        onChange={(e) =>
                          setFormState({ ...formState, image: e.target.value })
                        }
                        className="w-full rounded-xl border border-blue/20 bg-white pl-8 pr-3 py-1.5 text-[11px] font-medium text-navy focus:border-blue focus:outline-none"
                      />
                      <LinkIcon size={12} className="absolute left-2.5 top-2.5 text-muted pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Picture Frame Adjustment (Crop / Alignment / Zoom) */}
              {formState.image && (
                <div className="rounded-2xl border border-blue/20 bg-gradient-to-br from-blue/5 via-white to-violet/5 p-4 space-y-3.5 shadow-xs">
                  <div className="flex items-center justify-between border-b border-blue/10 pb-2.5">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-navy">
                      <Sparkles size={13} className="text-cyan" />
                      Picture Frame &amp; Face Alignment Controls
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setFormState({
                          ...formState,
                          imagePosition: "50% 20%",
                          imageScale: 1,
                        });
                      }}
                      className="text-[11px] font-bold text-blue hover:underline cursor-pointer"
                    >
                      Reset Frame
                    </button>
                  </div>

                  {/* Live Interactive Framing Box & Controls */}
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                    {/* Simulated website frame */}
                    <div className="flex flex-col items-center gap-1.5 shrink-0">
                      <div className="relative h-28 w-36 overflow-hidden rounded-[20px] border-2 border-blue/30 bg-gradient-to-br from-[#d9f4ff] via-[#e9edff] to-[#f1e8ff] shadow-md flex items-center justify-center">
                        <Image
                          src={formState.image}
                          alt="Framing preview"
                          fill
                          unoptimized
                          className="object-cover transition-all duration-150"
                          style={{
                            objectPosition: formState.imagePosition || "50% 20%",
                            transform: `scale(${formState.imageScale || 1})`,
                            transformOrigin: formState.imagePosition || "center",
                          }}
                        />
                        <div className="absolute inset-0 border border-white/40 pointer-events-none rounded-[18px]" />
                        <span className="absolute bottom-1 right-1.5 rounded-md bg-black/60 px-1.5 py-0.5 text-[9px] font-bold text-white tracking-wider pointer-events-none">
                          WEBSITE FRAME
                        </span>
                      </div>
                      <span className="text-[10px] text-muted font-medium text-center">
                        Matches live card shape
                      </span>
                    </div>

                    {/* Frame Alignment Controls */}
                    <div className="flex-1 space-y-3 w-full">
                      {/* Focus Presets */}
                      <div>
                        <div className="flex items-center justify-between text-[11px] font-bold text-navy mb-1.5">
                          <span>Quick Focus Presets:</span>
                          <span className="text-[10.5px] font-mono text-blue">
                            {formState.imagePosition || "50% 20%"}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            { label: "Head/Face (Top)", val: "50% 12%" },
                            { label: "Upper Body", val: "50% 25%" },
                            { label: "Center", val: "50% 50%" },
                            { label: "Lower", val: "50% 80%" },
                          ].map((preset) => {
                            const isSelected = formState.imagePosition === preset.val;
                            return (
                              <button
                                key={preset.val}
                                type="button"
                                onClick={() =>
                                  setFormState({ ...formState, imagePosition: preset.val })
                                }
                                className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer ${
                                  isSelected
                                    ? "bg-blue text-white shadow-xs"
                                    : "bg-white border border-blue/20 text-navy hover:bg-blue/10"
                                }`}
                              >
                                {preset.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Fine Vertical Position Slider */}
                      <div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-navy font-semibold">Fine-tune Vertical Position (Y):</span>
                          <span className="font-bold text-blue text-[10.5px]">
                            {(() => {
                              const parts = (formState.imagePosition || "50% 20%").split(" ");
                              return parts[1] || "20%";
                            })()}
                          </span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={2}
                          value={(() => {
                            const parts = (formState.imagePosition || "50% 20%").split(" ");
                            const yVal = parseInt(parts[1] || "20", 10);
                            return isNaN(yVal) ? 20 : yVal;
                          })()}
                          onChange={(e) => {
                            const y = e.target.value;
                            const parts = (formState.imagePosition || "50% 20%").split(" ");
                            const x = parts[0] || "50%";
                            setFormState({
                              ...formState,
                              imagePosition: `${x} ${y}%`,
                            });
                          }}
                          className="w-full h-1.5 bg-blue/20 rounded-lg appearance-none cursor-pointer accent-blue mt-1"
                        />
                        <div className="flex justify-between text-[9.5px] text-muted mt-0.5">
                          <span>0% (Top of photo)</span>
                          <span>50% (Center)</span>
                          <span>100% (Bottom)</span>
                        </div>
                      </div>

                      {/* Zoom / Scale Slider */}
                      <div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-navy font-semibold">Zoom / Scale Size:</span>
                          <span className="font-bold text-blue text-[10.5px]">
                            {((formState.imageScale || 1) * 100).toFixed(0)}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min={1}
                          max={1.6}
                          step={0.05}
                          value={formState.imageScale || 1}
                          onChange={(e) => {
                            setFormState({
                              ...formState,
                              imageScale: parseFloat(e.target.value),
                            });
                          }}
                          className="w-full h-1.5 bg-blue/20 rounded-lg appearance-none cursor-pointer accent-blue mt-1"
                        />
                        <div className="flex justify-between text-[9.5px] text-muted mt-0.5">
                          <span>100% (Normal)</span>
                          <span>130%</span>
                          <span>160% (Close-up)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Bio / Description */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-navy">Short Bio / Description *</label>
                  <span className="text-[10px] text-muted">
                    {formState.description.length} / 2000 chars
                  </span>
                </div>
                <textarea
                  required
                  rows={3}
                  maxLength={2000}
                  placeholder="Short summary of expertise and contribution..."
                  value={formState.description}
                  onChange={(e) => {
                    setFormState({ ...formState, description: e.target.value });
                    if (formError) setFormError(null);
                  }}
                  className="mt-1.5 w-full rounded-xl border border-blue/20 bg-ice px-3.5 py-2.5 text-xs font-medium text-navy focus:border-blue focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAdding(false);
                    setEditingMember(null);
                    setFormError(null);
                  }}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-muted hover:text-navy cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || isUploadingPhoto}
                  className="rounded-xl bg-gradient-to-r from-cyan via-blue to-violet px-5 py-2.5 text-xs font-bold text-white shadow-md hover:opacity-95 disabled:opacity-50 cursor-pointer flex items-center gap-2"
                >
                  {isSaving && <RefreshCw size={13} className="animate-spin" />}
                  <span>
                    {isSaving
                      ? "Saving to Website..."
                      : editingMember !== null
                      ? "Update & Save Live"
                      : "Add & Save Live"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
