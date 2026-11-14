"use client";

import { useState } from "react";
import Image from "next/image";
import { AlertCircle, Eye, EyeOff, Lock, RefreshCw, ShieldCheck } from "lucide-react";
import { BRAND_LOGO, SITE_NAME } from "@/lib/constants";

interface AdminAuthModalProps {
  onUnlock: () => void;
}

export default function AdminAuthModal({ onUnlock }: AdminAuthModalProps) {
  const [adminUser, setAdminUser] = useState("admin@elvaveo.com");
  const [passcode, setPasscode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "login",
          email: adminUser.trim(),
          passcode,
        }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        setErrorMessage(result.error || "Administrator authentication failed.");
        return;
      }

      onUnlock();
    } catch {
      setErrorMessage("Unable to reach the authentication service. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/70 backdrop-blur-md">
      <div
        className="pointer-events-none absolute -top-24 h-[420px] w-[420px] rounded-full bg-cyan/20 blur-[130px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-24 h-[420px] w-[420px] rounded-full bg-violet/25 blur-[130px]"
        aria-hidden="true"
      />

      <div className="relative w-full max-w-lg rounded-[32px] border border-white/80 bg-white/95 p-6 shadow-[0_30px_90px_rgba(8,27,61,0.3)] backdrop-blur-2xl sm:p-8">
        <div className="flex items-center justify-between border-b border-blue/10 pb-4">
          <div className="flex items-center gap-3">
            <Image
              src={BRAND_LOGO}
              alt={SITE_NAME}
              width={110}
              height={38}
              className="h-8 w-auto object-contain"
            />
            <span className="hidden h-4 w-[1px] bg-blue/20 sm:inline-block" />
            <span className="hidden text-[11px] font-bold text-muted sm:inline-block">
              Executive Console
            </span>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-blue/20 bg-blue/5 px-3 py-1 text-[11px] font-bold text-blue">
            <ShieldCheck size={13} className="text-cyan-600" />
            Administrator sign-in
          </span>
        </div>

        <div className="mt-7 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan to-blue text-white shadow-lg shadow-blue/25">
            <Lock size={26} />
          </div>
          <h2 className="mt-3.5 text-[20px] font-extrabold text-navy">
            Sign in to the Admin Console
          </h2>
          <p className="mt-1 text-[13px] text-muted">
            Use your existing authorized Supabase administrator account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="admin-email" className="text-xs font-bold text-navy">
              Administrator email
            </label>
            <input
              id="admin-email"
              type="email"
              required
              autoComplete="username"
              value={adminUser}
              onChange={(event) => setAdminUser(event.target.value)}
              placeholder="Administrator email"
              className="mt-1.5 w-full rounded-xl border border-blue/20 bg-ice px-3.5 py-2.5 text-xs font-medium text-navy focus:border-blue focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="admin-password" className="text-xs font-bold text-navy">
              Administrator password
            </label>
            <div className="relative mt-1.5">
              <input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={passcode}
                onChange={(event) => {
                  setPasscode(event.target.value);
                  if (errorMessage) setErrorMessage("");
                }}
                placeholder="Enter your password"
                className={`w-full rounded-xl border px-3.5 py-2.5 pr-10 text-xs font-medium text-navy focus:outline-none ${
                  errorMessage
                    ? "border-rose-400 bg-rose-50/50"
                    : "border-blue/20 bg-ice focus:border-blue focus:bg-white"
                }`}
              />
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((visible) => !visible)}
                className="absolute right-3 top-2.5 text-muted hover:text-navy"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errorMessage ? (
              <p role="alert" className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-rose-500">
                <AlertCircle size={12} />
                <span>{errorMessage}</span>
              </p>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan via-blue to-violet py-3 text-xs font-bold text-white shadow-md transition-opacity hover:opacity-95 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Verifying administrator account…</span>
              </>
            ) : (
              <>
                <span>Sign in securely</span>
                <ShieldCheck size={15} />
              </>
            )}
          </button>
        </form>

        <p className="mt-5 border-t border-blue/10 pt-3 text-center text-[11.5px] font-medium text-muted">
          Authentication is verified server-side. Your session is stored in a secure HTTP-only cookie.
        </p>
      </div>
    </div>
  );
}
