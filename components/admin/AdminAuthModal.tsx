"use client";

import { useState } from "react";
import Image from "next/image";
import { Lock, ArrowRight, ShieldCheck, Sparkles, Key } from "lucide-react";
import { BRAND_LOGO, SITE_NAME } from "@/lib/constants";

interface AdminAuthModalProps {
  onUnlock: () => void;
}

export default function AdminAuthModal({ onUnlock }: AdminAuthModalProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Default passcodes or fast access
    if (pin.trim().toLowerCase() === "elvaveo" || pin.trim() === "1234" || pin.trim() === "admin") {
      onUnlock();
    } else {
      setError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-md">
      {/* Glow effects */}
      <div
        className="pointer-events-none absolute -top-20 h-96 w-96 rounded-full bg-cyan/20 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-20 h-96 w-96 rounded-full bg-blue/25 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative w-full max-w-md rounded-[32px] border border-white/80 bg-white/90 p-8 shadow-[0_30px_90px_rgba(8,27,61,0.25)] backdrop-blur-2xl text-center">
        {/* Brand logo */}
        <div className="mx-auto flex justify-center">
          <Image
            src={BRAND_LOGO}
            alt={SITE_NAME}
            width={120}
            height={42}
            className="h-9 w-auto object-contain"
          />
        </div>

        <div className="mx-auto mt-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan via-blue to-violet text-white shadow-lg shadow-blue/20">
          <Lock size={28} />
        </div>

        <h2 className="mt-5 text-[22px] font-extrabold tracking-tight text-navy">
          Admin Portal Authentication
        </h2>
        <p className="mt-1.5 text-[13px] text-muted">
          Enter admin credentials to access executive controls, manage inquiries, and update team data.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3.5">
          <div className="relative">
            <input
              type="password"
              autoFocus
              placeholder="Enter passcode (e.g. elvaveo)"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                if (error) setError(false);
              }}
              className={`w-full rounded-2xl border px-4 py-3 text-center text-sm font-semibold tracking-wider text-navy shadow-inner focus:outline-none ${
                error
                  ? "border-rose-400 bg-rose-50/50"
                  : "border-blue/20 bg-ice focus:border-blue focus:bg-white"
              }`}
            />
            {error && (
              <p className="mt-1 text-[11px] font-semibold text-rose-500">
                Invalid passcode. Try <span className="font-mono">elvaveo</span> or click Quick Access.
              </p>
            )}
          </div>

          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan via-blue to-violet py-3 text-sm font-bold text-white shadow-md hover:opacity-95 transition-opacity"
          >
            <span>Unlock Console</span>
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Quick Demo Access Button */}
        <div className="mt-5 border-t border-blue/10 pt-4">
          <button
            onClick={onUnlock}
            className="inline-flex items-center gap-2 rounded-xl border border-blue/20 bg-white/80 px-4 py-2 text-xs font-bold text-blue hover:bg-white transition-colors"
          >
            <Sparkles size={14} className="text-cyan" />
            <span>Fast Demo Access (Syed Hussain Ali)</span>
          </button>
          <p className="mt-2 text-[10.5px] text-muted">
            Passcode: <code className="rounded bg-black/5 px-1.5 py-0.5 font-mono text-navy font-semibold">elvaveo</code>
          </p>
        </div>
      </div>
    </div>
  );
}
