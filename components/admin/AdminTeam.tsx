"use client";

import { useState, useEffect } from "react";
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
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { teamMembers as fallbackMembers, type TeamMember } from "@/data/team";
import LeadershipCard from "@/components/about/LeadershipCard";

export default function AdminTeam() {
  const [members, setMembers] = useState<TeamMember[]>(fallbackMembers);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [editingMember, setEditingMember] = useState<{
    member: TeamMember;
    index: number;
  } | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [copied, setCopied] = useState(false);

  const [formState, setFormState] = useState<TeamMember>({
    name: "",
    role: "",
    initials: "",
    description: "",
    linkedin: "https://www.linkedin.com/",
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch live team members from API
  const fetchTeam = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/team");
      if (res.ok) {
        const data = await res.json();
        if (data.team && Array.isArray(data.team)) {
          setMembers(data.team);
        }
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
  const persistTeam = async (updatedList: TeamMember[], message: string) => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedList),
      });

      if (res.ok) {
        setMembers(updatedList);
        showToast(message);
      } else {
        showToast("Error saving changes. Please try again.");
      }
    } catch (err) {
      console.error("Save team error:", err);
      showToast("Error saving changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const openAddModal = () => {
    setFormState({
      name: "",
      role: "",
      initials: "",
      description: "",
      linkedin: "https://www.linkedin.com/",
    });
    setIsAdding(true);
  };

  const openEditModal = (member: TeamMember, index: number) => {
    setFormState({ ...member });
    setEditingMember({ member, index });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.name || !formState.role || !formState.description) return;

    const initials =
      formState.initials ||
      formState.name
        .split(" ")
        .filter(Boolean)
        .map((p) => p[0])
        .join("")
        .toUpperCase()
        .slice(0, 3);

    const updatedItem: TeamMember = {
      ...formState,
      initials,
    };

    let updatedList: TeamMember[];
    let successMsg = "";

    if (editingMember !== null) {
      updatedList = [...members];
      updatedList[editingMember.index] = updatedItem;
      successMsg = `Updated ${updatedItem.name}! Changes are now live on website.`;
      setEditingMember(null);
    } else {
      updatedList = [...members, updatedItem];
      successMsg = `Added ${updatedItem.name}! Changes are now live on website.`;
      setIsAdding(false);
    }

    await persistTeam(updatedList, successMsg);
  };

  const handleDelete = async (index: number) => {
    const memberName = members[index]?.name || "Member";
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
            <span className="inline-flex items-center gap-1.5 rounded-full bg-violet/10 px-3 py-1 text-[11px] font-bold text-violet">
              <Users size={13} />
              Connected Live to Website
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
            className="flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-cyan via-blue to-violet px-4 text-xs font-bold text-white shadow-md hover:opacity-95 transition-opacity disabled:opacity-50"
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
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue/20 bg-white shadow-md text-blue hover:bg-blue hover:text-white transition-colors"
              >
                <Edit2 size={13} />
              </button>
              {members.length > 1 && (
                <button
                  onClick={() => handleDelete(idx)}
                  title="Delete member"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 bg-white shadow-md text-rose-600 hover:bg-rose-600 hover:text-white transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-[28px] border border-white/80 bg-white p-6 shadow-2xl sm:p-8">
            <button
              onClick={() => {
                setIsAdding(false);
                setEditingMember(null);
              }}
              className="absolute right-5 top-5 rounded-full p-2 text-muted hover:bg-black/5"
            >
              <X size={18} />
            </button>

            <h3 className="text-[18px] font-bold text-navy">
              {editingMember !== null ? "Edit Team Member" : "Add Team Member"}
            </h3>
            <p className="mt-1 text-[13px] text-muted">
              Saving here will update the live About page team slider immediately.
            </p>

            <form onSubmit={handleSave} className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-navy">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Zeeshan Haider"
                  value={formState.name}
                  onChange={(e) =>
                    setFormState({ ...formState, name: e.target.value })
                  }
                  className="mt-1.5 w-full rounded-xl border border-blue/20 bg-ice px-3.5 py-2.5 text-xs font-medium text-navy focus:border-blue focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-navy">Role / Designation</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lead Full-Stack Engineer"
                  value={formState.role}
                  onChange={(e) =>
                    setFormState({ ...formState, role: e.target.value })
                  }
                  className="mt-1.5 w-full rounded-xl border border-blue/20 bg-ice px-3.5 py-2.5 text-xs font-medium text-navy focus:border-blue focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-navy">
                  Monogram Initials (Optional - auto computed from name)
                </label>
                <input
                  type="text"
                  maxLength={3}
                  placeholder="e.g. ZH"
                  value={formState.initials || ""}
                  onChange={(e) =>
                    setFormState({ ...formState, initials: e.target.value.toUpperCase() })
                  }
                  className="mt-1.5 w-full rounded-xl border border-blue/20 bg-ice px-3.5 py-2.5 text-xs font-medium text-navy focus:border-blue focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-navy">LinkedIn URL</label>
                <input
                  type="url"
                  placeholder="https://www.linkedin.com/in/username"
                  value={formState.linkedin || ""}
                  onChange={(e) =>
                    setFormState({ ...formState, linkedin: e.target.value })
                  }
                  className="mt-1.5 w-full rounded-xl border border-blue/20 bg-ice px-3.5 py-2.5 text-xs font-medium text-navy focus:border-blue focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-navy">Short Bio / Description</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Short summary of expertise and contribution..."
                  value={formState.description}
                  onChange={(e) =>
                    setFormState({ ...formState, description: e.target.value })
                  }
                  className="mt-1.5 w-full rounded-xl border border-blue/20 bg-ice px-3.5 py-2.5 text-xs font-medium text-navy focus:border-blue focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAdding(false);
                    setEditingMember(null);
                  }}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-muted hover:text-navy"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-xl bg-gradient-to-r from-cyan via-blue to-violet px-5 py-2.5 text-xs font-bold text-white shadow-md hover:opacity-95 disabled:opacity-50"
                >
                  {isSaving
                    ? "Saving to Website..."
                    : editingMember !== null
                    ? "Update & Save Live"
                    : "Add & Save Live"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
