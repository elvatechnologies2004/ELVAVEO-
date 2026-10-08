"use client";

import { useEffect, useState } from "react";
import { CircleCheck, LoaderCircle, Send } from "lucide-react";
import GradientButton from "@/components/GradientButton";
import { CONTACT_EMAIL } from "@/lib/constants";
import { CONTACT_SUBJECTS, type ContactFormStatus } from "@/types";

const fieldClass =
  "w-full rounded-[14px] border border-line bg-white/70 px-4 py-3 text-[15px] text-navy outline-none transition-colors placeholder:text-muted/60 focus:border-blue/50 focus:bg-white disabled:opacity-60";

const labelClass =
  "mb-2 block text-[12px] font-bold uppercase tracking-[0.12em] text-navy/70";

/**
 * Contact form.
 *
 * Posts to /api/contact, which emails the message to the ELVAVEO inbox
 * server-side via Resend. The visitor's own mail client is never involved; the
 * direct address stays available as a fallback.
 */
export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState<string>(CONTACT_SUBJECTS[0]);
  const [message, setMessage] = useState("");
  // Honeypot: parked off-screen, so a real person never sees or fills it.
  const [company, setCompany] = useState("");
  const [error, setError] = useState<string | null>(null);
  // True when delivery itself is down (503), so the visitor is shown a
  // clickable address instead of a dead end.
  const [emailFallback, setEmailFallback] = useState(false);
  const [status, setStatus] = useState<ContactFormStatus>("idle");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const sub = params.get("subject");
      if (sub && CONTACT_SUBJECTS.includes(sub as any)) {
        setSubject(sub);
      }
    }
  }, []);

  const sending = status === "sending";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Guard against duplicate submissions while a request is in flight.
    if (sending) return;

    if (!name.trim() || !email.trim() || !message.trim()) {
      setError("Please fill in your name, email, and message.");
      setStatus("error");
      return;
    }

    setError(null);
    setEmailFallback(false);
    setStatus("sending");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message, company }),
      });

      const payload = (await response.json().catch(() => null)) as {
        success?: boolean;
        message?: string;
        error?: string;
      } | null;

      if (!response.ok || !payload?.success) {
        setStatus("error");
        setEmailFallback(response.status === 503);
        setError(
          payload?.error ??
            payload?.message ??
            "Something went wrong. Please try again or email us directly."
        );
        return;
      }

      setStatus("success");
    } catch {
      setStatus("error");
      setError("Network error. Please check your connection and try again.");
    }
  }

  if (status === "success") {
    return (
      <div
        role="status"
        className="flex flex-col items-start gap-4 rounded-[20px] border border-line bg-white/70 p-7 sm:p-9"
      >
        <span className="inline-flex items-center justify-center rounded-full bg-[#15803d]/10 p-3 text-[#15803d]">
          <CircleCheck size={26} aria-hidden="true" />
        </span>
        <div className="grid gap-2">
          <h3 className="text-[20px] font-bold text-navy">
            Thanks{name.trim() ? `, ${name.trim().split(" ")[0]}` : ""} — message sent.
          </h3>
          <p className="text-[14.5px] leading-relaxed text-muted">
            It is on its way to our inbox at{" "}
            <span className="font-semibold text-navy">{CONTACT_EMAIL}</span>. We
            read every message and usually reply within one business day.
          </p>
        </div>
        <GradientButton
          variant="outline"
          onClick={() => {
            setName("");
            setEmail("");
            setMessage("");
            setSubject(CONTACT_SUBJECTS[0]);
            setStatus("idle");
          }}
        >
          Send another message
        </GradientButton>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-4">
      {/* Honeypot: off-screen and unfocusable, so only bots fill it. */}
      <div
        aria-hidden="true"
        className="absolute -left-[9999px] h-0 w-0 overflow-hidden"
      >
        <label htmlFor="contact-company">Company</label>
        <input
          id="contact-company"
          name="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className={labelClass}>
            Your name
          </label>
          <input
            id="contact-name"
            name="name"
            type="text"
            autoComplete="name"
            maxLength={120}
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="contact-email" className={labelClass}>
            Your email
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            autoComplete="email"
            maxLength={254}
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            className={fieldClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="contact-subject" className={labelClass}>
          What is this about
        </label>
        <select
          id="contact-subject"
          name="subject"
          value={subject}
          disabled={sending}
          onChange={(e) => setSubject(e.target.value)}
          className={`${fieldClass} appearance-none bg-[length:16px] bg-[right_1rem_center] bg-no-repeat pr-11`}
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2361708f' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
          }}
        >
          {CONTACT_SUBJECTS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="contact-message" className={labelClass}>
          Your message
        </label>
        <textarea
          id="contact-message"
          name="message"
          rows={5}
          maxLength={5000}
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell us about your idea, product, or challenge."
          className={`${fieldClass} resize-y`}
        />
      </div>

      {error && status === "error" && (
        <div
          role="alert"
          className="grid gap-1.5 text-[13px] font-semibold text-[#c2410c]"
        >
          <p>{error}</p>
          {emailFallback && (
            <a
              href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
                `[${subject}] ${name.trim()}`
              )}&body=${encodeURIComponent(message.trim())}`}
              className="w-fit font-semibold text-blue underline underline-offset-2 hover:no-underline"
            >
              {CONTACT_EMAIL}
            </a>
          )}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <GradientButton
          type="submit"
          size="lg"
          showArrow
          disabled={sending}
          className="w-full sm:w-auto"
          ariaLabel="Send your message to ELVAVEO"
        >
          {sending ? (
            <>
              <LoaderCircle
                size={16}
                aria-hidden="true"
                className="animate-spin"
              />
              Sending...
            </>
          ) : (
            <>
              <Send size={16} aria-hidden="true" />
              Send Message
            </>
          )}
        </GradientButton>
        <p className="text-[12.5px] leading-snug text-muted">
          Goes straight to our inbox. Prefer your own mail app? Write to{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="font-semibold text-blue underline-offset-2 hover:underline"
          >
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </div>
    </form>
  );
}
