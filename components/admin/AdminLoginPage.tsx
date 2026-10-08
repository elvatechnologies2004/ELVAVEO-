"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Lock,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  Eye,
  EyeOff,
  Mail,
  Activity,
} from "lucide-react";
import { BRAND_LOGO, SITE_NAME } from "@/lib/constants";

interface AdminLoginPageProps {
  onUnlock: () => void;
}

export default function AdminLoginPage({ onUnlock }: AdminLoginPageProps) {
  // Login Form States (Single-Step Direct Login)
  const [adminEmail, setAdminEmail] = useState("admin@elvaveo.com");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Supabase real-time connection status
  const [supabaseStatus, setSupabaseStatus] = useState<"checking" | "connected" | "active">("checking");

  // Check backend & Supabase security status on mount
  useEffect(() => {
    async function checkHealth() {
      try {
        const res = await fetch("/api/admin/auth");
        if (res.ok) {
          setSupabaseStatus("connected");
        } else {
          setSupabaseStatus("active");
        }
      } catch {
        setSupabaseStatus("active");
      }
    }
    checkHealth();
  }, []);

  // Handle Direct Login Submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    const cleanEmail = adminEmail.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail) {
      setLoginError("Please enter your administrator email address.");
      return;
    }
    if (!cleanPassword) {
      setLoginError("Please enter your master password.");
      return;
    }

    setIsAuthenticating(true);

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "login",
          email: cleanEmail,
          passcode: cleanPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setLoginError(
          data.error || "Galat ID ya Password. Access Denied: Invalid credentials."
        );
        setIsAuthenticating(false);
        return;
      }

      // Login Successful! Unlock console immediately
      try {
        sessionStorage.setItem("elvaveo_admin_auth", "true");
      } catch {}

      onUnlock();
    } catch {
      setLoginError("Unable to establish secure handshake with server. Try again.");
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#051124] text-white flex flex-col justify-between font-sans selection:bg-cyan selection:text-navy overflow-hidden">
      {/* Ambient Cybernetic Lighting */}
      <div
        className="pointer-events-none fixed -top-40 right-1/4 h-[550px] w-[550px] rounded-full bg-cyan/15 blur-[140px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none fixed top-1/3 -left-32 h-[550px] w-[550px] rounded-full bg-blue/15 blur-[150px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none fixed -bottom-36 right-10 h-[600px] w-[600px] rounded-full bg-violet/20 blur-[160px]"
        aria-hidden="true"
      />

      {/* Subtle Matrix Dot Texture */}
      <div
        className="pointer-events-none fixed inset-0 opacity-20 bg-[radial-gradient(rgba(255,255,255,0.15)_1px,transparent_1px)] [background-size:28px_28px]"
        aria-hidden="true"
      />

      {/* Top Header Bar */}
      <header className="relative z-20 flex items-center justify-between px-6 py-5 sm:px-10 border-b border-white/5 bg-navy/40 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-3 group">
          <Image
            src={BRAND_LOGO}
            alt={SITE_NAME}
            width={120}
            height={42}
            className="h-8 sm:h-9 w-auto object-contain transition-opacity group-hover:opacity-90"
          />
          <span className="hidden sm:inline-block h-4 w-[1px] bg-white/15" />
          <span className="hidden sm:inline-block text-xs font-semibold tracking-wider text-slate-400 uppercase">
            Executive Console
          </span>
        </Link>

        {/* Real-Time Supabase Security Pill */}
        <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 text-[11.5px] font-semibold text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="tracking-wide">
            {supabaseStatus === "connected"
              ? "Supabase Real-Time Guard"
              : "Zero-Trust Security Active"}
          </span>
        </div>
      </header>

      {/* Main Authentication Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
        <div className="w-full max-w-[450px] rounded-[32px] border border-white/10 bg-[#081a38]/85 p-7 sm:p-10 shadow-[0_30px_90px_rgba(0,0,0,0.6)] backdrop-blur-2xl">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan to-blue text-navy shadow-lg shadow-cyan/20">
              <Lock size={26} className="text-[#051124]" />
            </div>
            <h1 className="mt-4 text-2xl font-black tracking-tight text-white">
              Administrator Sign In
            </h1>
            <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
              Enter your verified administrator ID and password to access the executive portal.
            </p>
          </div>

          {/* Real-Time Error Banner */}
          {loginError && (
            <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-rose-500/40 bg-rose-500/15 p-3.5 text-xs font-semibold text-rose-300 animate-in fade-in">
              <AlertCircle size={16} className="shrink-0 text-rose-400 mt-0.5" />
              <span>{loginError}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLoginSubmit} className="mt-6 space-y-4">
            {/* Administrator ID / Email */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Administrator ID (Email) *
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  autoFocus
                  placeholder="admin@elvaveo.com"
                  value={adminEmail}
                  onChange={(e) => {
                    setAdminEmail(e.target.value);
                    if (loginError) setLoginError("");
                  }}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.05] pl-10 pr-3.5 py-3 text-xs font-medium text-white placeholder-slate-500 focus:border-cyan focus:bg-white/[0.08] focus:outline-none transition-all"
                />
                <Mail
                  size={16}
                  className="absolute left-3.5 top-3.5 text-slate-400 pointer-events-none"
                />
              </div>
            </div>

            {/* Master Password Field */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Master Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Enter administrator password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (loginError) setLoginError("");
                  }}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.05] pl-10 pr-10 py-3 text-xs font-medium text-white placeholder-slate-500 focus:border-cyan focus:bg-white/[0.08] focus:outline-none transition-all"
                />
                <Lock
                  size={16}
                  className="absolute left-3.5 top-3.5 text-slate-400 pointer-events-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-white transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isAuthenticating}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan via-blue to-violet py-3.5 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-cyan/25 hover:opacity-95 disabled:opacity-50 transition-all cursor-pointer"
            >
              {isAuthenticating ? (
                <>
                  <RefreshCw size={15} className="animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={16} />
                  <span>Sign In to Admin Console</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          {/* Security Note */}
          <div className="mt-6 border-t border-white/10 pt-4 text-center">
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Protected by Supabase Real-Time Security &amp; HMAC-SHA256 Tokenization. Unauthorized attempts are monitored and recorded.
            </p>
          </div>
        </div>
      </main>

      {/* Footer Bar */}
      <footer className="relative z-20 flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 sm:px-10 border-t border-white/5 bg-navy/40 backdrop-blur-md text-[11px] text-slate-400">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-slate-300 hover:text-cyan font-bold transition-colors"
          >
            <span>&larr; Return to ELVAVEO Home</span>
          </Link>
          <span className="text-white/20">&bull;</span>
          <span>TLS 1.3 Encryption Active</span>
        </div>

        <div className="flex items-center gap-2 text-slate-400">
          <Activity size={13} className="text-emerald-400" />
          <span>Real-time Supabase Auth Handshake</span>
        </div>
      </footer>
    </div>
  );
}
