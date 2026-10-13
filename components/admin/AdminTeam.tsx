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

  const openAddModal = () => {
    setFormError(null);
    setFormState({
      name: "",
      role: "",
      initials: "",
      description: "",
      image: "",
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
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-violet/10 px-3 py-1 text-[11px] font-bold text-violet">
              <Users size={13} />
              Connected Live to Website ({members.length} Active Members)
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
            Any addition, edit, or deletion made here <strong>instantly updates</strong> the public About page team slider.
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

      {/* Grid of Team Cards */}
      <div className="grid gap-6 lg:grid-cols-2">
        {members.map((member, idx) => (
          <div key={idx} className="relative group">
            {/* Action overlay buttons */}
            <div className="absolute right-4 top-4 z-20 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => openEditModal(member, idx)}
                title="Edit member"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue/20 bg-white shadow-md text-blue hover:bg-blue hover:text-white transition-colors cursor-pointer"
              >
                <Edit2 size={13} />
              </button>
              {members.length > 1 && (
                <button
                  onClick={() => handleDelete(idx)}
                  title="Delete member"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 bg-white shadow-md text-rose-600 hover:bg-rose-600 hover:text-white transition-colors cursor-pointer"
                >
                  <Trash2 size={13} />
                </button>
              )}
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
