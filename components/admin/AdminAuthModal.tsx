"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import {
  Lock,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Smartphone,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import { BRAND_LOGO, SITE_NAME } from "@/lib/constants";

interface AdminAuthModalProps {
  onUnlock: () => void;
}

export default function AdminAuthModal({ onUnlock }: AdminAuthModalProps) {
  // Step 1 = Master Passcode, Step 2 = 2FA Security Token
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1 Form States
  const [adminUser, setAdminUser] = useState("admin@elvaveo.com");
  const [passcode, setPasscode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [step1Error, setStep1Error] = useState("");
  const [isStep1Submitting, setIsStep1Submitting] = useState(false);

  // Step 2 (2FA) Form States
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [step2Error, setStep2Error] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendTimer, setResendTimer] = useState(45);
  const [activeCode, setActiveCode] = useState("849201");
  const [copiedNotification, setCopiedNotification] = useState(false);

  // Refs for 6-digit OTP inputs
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for 2FA resend
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 2 && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  // Focus first OTP box on Step 2 entry
  useEffect(() => {
    if (step === 2) {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 150);
    }
  }, [step]);

  // Step 1: Submit Primary Passcode to Server Auth API
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode.trim()) {
      setStep1Error("Please enter the master passcode.");
      return;
    }

    setIsStep1Submitting(true);
    setStep1Error("");

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "login_step1",
          email: adminUser.trim() || "admin@elvaveo.com",
          passcode: passcode.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setStep1Error(data.error || "Authentication failed. Incorrect passcode.");
        return;
      }

      // Passcode accepted server-side. Move to Step 2.
      if (data.demoCode) {
        setActiveCode(data.demoCode);
      }
      setStep(2);
      setResendTimer(45);
      setOtpDigits(["", "", "", "", "", ""]);
      setStep2Error("");
    } catch {
      setStep1Error("Unable to reach authentication service. Please try again.");
    } finally {
      setIsStep1Submitting(false);
    }
  };

  // Step 2: Handle individual digit inputs
  const handleDigitChange = (index: number, value: string) => {
    if (step2Error) setStep2Error("");

    // Support paste of entire 6-digit code
    if (value.length > 1) {
      const sanitized = value.replace(/[^0-9]/g, "").slice(0, 6);
      if (sanitized.length > 0) {
        const nextDigits = [...otpDigits];
        for (let i = 0; i < 6; i++) {
          nextDigits[i] = sanitized[i] || "";
        }
        setOtpDigits(nextDigits);
        const nextFocusIndex = Math.min(sanitized.length, 5);
        inputRefs.current[nextFocusIndex]?.focus();

        if (sanitized.length === 6) {
          validateOtp(sanitized);
        }
        return;
      }
    }

    const cleanChar = value.slice(-1).replace(/[^0-9]/g, "");
    const updated = [...otpDigits];
    updated[index] = cleanChar;
    setOtpDigits(updated);

    // Auto-advance to next input
    if (cleanChar && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit if all 6 digits entered
    const completeCode = updated.join("");
    if (completeCode.length === 6 && !updated.includes("")) {
      validateOtp(completeCode);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const validateOtp = async (code: string) => {
    setIsVerifying(true);
    setStep2Error("");

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "login_step2",
          code: code.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setStep2Error(data.error || "Security verification code incorrect or expired.");
        setIsVerifying(false);
        return;
      }

      // Server issued session cookie successfully!
      try {
        sessionStorage.setItem("elvaveo_admin_auth", "true");
      } catch {}

      onUnlock();
    } catch {
      setStep2Error("Verification service temporarily unavailable.");
      setIsVerifying(false);
    }
  };

  // Step 2: Form submit
  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = otpDigits.join("");
    if (fullCode.length !== 6) {
      setStep2Error("Please enter all 6 digits of your security code.");
      return;
    }
    validateOtp(fullCode);
  };

  const handleResendCode = async () => {
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "login_step1",
          passcode: passcode.trim() || "elvaveo",
        }),
      });
      const data = await res.json();
      if (data.demoCode) {
        setActiveCode(data.demoCode);
      }
    } catch {}

    setResendTimer(45);
    setOtpDigits(["", "", "", "", "", ""]);
    setStep2Error("");
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 3000);
  };

  const quickFillToken = () => {
    const chars = activeCode.split("");
    setOtpDigits(chars);
    setStep2Error("");
    validateOtp(activeCode);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/70 backdrop-blur-md">
      {/* Background Ambient Lighting */}
      <div
        className="pointer-events-none absolute -top-24 h-[420px] w-[420px] rounded-full bg-cyan/20 blur-[130px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-24 h-[420px] w-[420px] rounded-full bg-violet/25 blur-[130px]"
        aria-hidden="true"
      />

      <div className="relative w-full max-w-lg rounded-[32px] border border-white/80 bg-white/95 p-6 shadow-[0_30px_90px_rgba(8,27,61,0.3)] backdrop-blur-2xl sm:p-8">
        {/* Brand Lockup */}
        <div className="flex items-center justify-between border-b border-blue/10 pb-4">
          <div className="flex items-center gap-3">
            <Image
              src={BRAND_LOGO}
              alt={SITE_NAME}
              width={110}
              height={38}
              className="h-8 w-auto object-contain"
            />
            <span className="hidden sm:inline-block h-4 w-[1px] bg-blue/20" />
            <span className="hidden sm:inline-block text-[11px] font-bold text-muted">
              Executive Console
            </span>
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full border border-blue/20 bg-blue/5 px-3 py-1 text-[11px] font-bold text-blue">
            <ShieldCheck size={13} className="text-cyan-600" />
            2-Step Verification
          </span>
        </div>

        {/* Two-Step Progress Bar Indicator */}
        <div className="mt-5 rounded-2xl border border-blue/15 bg-ice p-3">
          <div className="flex items-center justify-between text-xs font-bold">
            <div className="flex items-center gap-2">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-black ${
                  step === 1
                    ? "bg-blue text-white shadow-xs"
                    : "bg-emerald-500 text-white"
                }`}
              >
                {step === 2 ? <CheckCircle2 size={14} /> : "1"}
              </span>
              <span className={step === 1 ? "text-navy" : "text-muted"}>
                Primary Passcode
              </span>
            </div>

            <div className="h-0.5 w-12 bg-blue/20 rounded-full" />

            <div className="flex items-center gap-2">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-black ${
                  step === 2
                    ? "bg-gradient-to-r from-cyan to-blue text-white shadow-xs animate-pulse"
                    : "bg-blue/15 text-muted"
                }`}
              >
                2
              </span>
              <span className={step === 2 ? "text-navy" : "text-muted"}>
                2FA Security Token
              </span>
            </div>
          </div>
        </div>

        {/* ================= STEP 1: PRIMARY CREDENTIALS ================= */}
        {step === 1 && (
          <div className="mt-6 animate-in fade-in slide-in-from-left-3 duration-200">
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan to-blue text-white shadow-lg shadow-blue/25">
                <Lock size={26} />
              </div>
              <h2 className="mt-3.5 text-[20px] font-extrabold text-navy">
                Step 1: Admin Credentials
              </h2>
              <p className="mt-1 text-[13px] text-muted">
                Enter your executive account email and master authorization passcode.
              </p>
            </div>

            <form onSubmit={handleStep1Submit} className="mt-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-navy">Administrator Identity</label>
                <input
                  type="text"
                  required
                  value={adminUser}
                  onChange={(e) => setAdminUser(e.target.value)}
                  placeholder="admin@elvaveo.com"
                  className="mt-1.5 w-full rounded-xl border border-blue/20 bg-ice px-3.5 py-2.5 text-xs font-medium text-navy focus:border-blue focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-navy">Master Passcode *</label>
                <div className="relative mt-1.5">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    autoFocus
                    placeholder="Enter passcode (e.g. Alfabravo669#)"
                    value={passcode}
                    onChange={(e) => {
                      setPasscode(e.target.value);
                      if (step1Error) setStep1Error("");
                    }}
                    className={`w-full rounded-xl border px-3.5 py-2.5 text-xs font-medium text-navy focus:outline-none ${
                      step1Error
                        ? "border-rose-400 bg-rose-50/50"
                        : "border-blue/20 bg-ice focus:border-blue focus:bg-white"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-muted hover:text-navy"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>

                {step1Error && (
                  <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-rose-500">
                    <AlertCircle size={12} />
                    <span>{step1Error}</span>
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isStep1Submitting}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan via-blue to-violet py-3 text-xs font-bold text-white shadow-md hover:opacity-95 disabled:opacity-50 transition-opacity"
              >
                {isStep1Submitting ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Proceed to Step 2 Verification</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>

            {/* Quick Helper */}
            <div className="mt-5 border-t border-blue/10 pt-3 text-center">
              <button
                type="button"
                onClick={() => {
                  setPasscode("Alfabravo669#");
                  setStep1Error("");
                }}
                className="inline-flex items-center gap-1.5 text-[11.5px] font-bold text-blue hover:underline"
              >
                <Sparkles size={12} className="text-cyan-600" />
                <span>Auto-fill master passcode ("Alfabravo669#")</span>
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 2: 2-SIDE / 2FA TOKEN ================= */}
        {step === 2 && (
          <div className="mt-6 animate-in fade-in slide-in-from-right-3 duration-200">
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue via-indigo-600 to-violet text-white shadow-lg shadow-violet/25">
                <Smartphone size={26} />
              </div>
              <h2 className="mt-3.5 text-[20px] font-extrabold text-navy">
                Step 2: 2-Factor Device Authentication
              </h2>
              <p className="mt-1 text-[13px] text-muted">
                Enter the dynamic 6-digit security code issued for{" "}
                <span className="font-semibold text-navy">{adminUser}</span>.
              </p>
            </div>

            {/* Device Token Simulation Pill */}
            <div className="mt-4 flex items-center justify-between rounded-xl border border-blue/20 bg-blue/5 px-3.5 py-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-[11.5px] font-bold text-navy">
                  Security Token Active:
                </span>
                <span className="rounded bg-white px-2 py-0.5 font-mono text-[12px] font-extrabold text-blue border border-blue/15">
                  {activeCode}
                </span>
              </div>

              <button
                type="button"
                onClick={quickFillToken}
                className="text-[11px] font-bold text-blue hover:underline"
              >
                Auto-fill
              </button>
            </div>

            <form onSubmit={handleStep2Submit} className="mt-5 space-y-4">
              <div>
                <label className="block text-center text-xs font-bold text-navy mb-2">
                  Enter 6-Digit Verification Token
                </label>

                {/* 6 Digit Input Group */}
                <div className="flex justify-center gap-2 sm:gap-2.5">
                  {otpDigits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        inputRefs.current[index] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleDigitChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className={`h-12 w-11 sm:h-14 sm:w-12 rounded-xl border text-center text-lg sm:text-xl font-black text-navy transition-all focus:outline-none ${
                        digit
                          ? "border-blue bg-white shadow-xs"
                          : "border-blue/20 bg-ice focus:border-blue focus:bg-white"
                      } ${step2Error ? "border-rose-400 bg-rose-50/50" : ""}`}
                    />
                  ))}
                </div>

                {step2Error && (
                  <p className="mt-2 text-center text-[11.5px] font-semibold text-rose-500 flex items-center justify-center gap-1">
                    <AlertCircle size={13} />
                    <span>{step2Error}</span>
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isVerifying}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan via-blue to-violet py-3 text-xs font-bold text-white shadow-md hover:opacity-95 disabled:opacity-50 transition-opacity"
              >
                {isVerifying ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Verifying 2-Factor Credentials...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={16} />
                    <span>Verify &amp; Unlock Executive Portal</span>
                  </>
                )}
              </button>
            </form>

            {/* Bottom Actions */}
            <div className="mt-4 flex items-center justify-between border-t border-blue/10 pt-3 text-xs">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1 font-bold text-muted hover:text-navy transition-colors"
              >
                <ArrowLeft size={13} />
                <span>Change Passcode</span>
              </button>

              <button
                type="button"
                onClick={handleResendCode}
                disabled={resendTimer > 0}
                className="font-bold text-blue hover:underline disabled:text-muted disabled:no-underline"
              >
                {resendTimer > 0 ? (
                  <span>Resend Code ({resendTimer}s)</span>
                ) : (
                  <span>Resend New Code</span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
