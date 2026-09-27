import { NextResponse } from "next/server";
import { CONTACT_SUBJECTS, type ContactApiResponse } from "@/types";
import { CONTACT_EMAIL as DEFAULT_CONTACT_EMAIL } from "@/lib/constants";

/**
 * Contact form endpoint.
 *
 * Accepts a JSON submission and delivers it to the ELVAVEO inbox through the
 * Resend API. The API key is read only here, on the server, and is never
 * exposed to the browser.
 */

const RESEND_ENDPOINT = "https://api.resend.com/emails";

/** Per-field caps, so one request cannot produce an oversized email. */
const LIMITS = {
  name: 120,
  email: 254,
  subject: 120,
  message: 5000,
} as const;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type ContactPayload = {
  name?: unknown;
  email?: unknown;
  subject?: unknown;
  message?: unknown;
  /** Honeypot. Hidden from people, tempting to bots. */
  company?: unknown;
};

/** Allow-list of accepted topics. Anything else is rejected, not forwarded. */
const ALLOWED_SUBJECTS: readonly string[] = CONTACT_SUBJECTS;

function json(body: ContactApiResponse, status: number) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function fail(message: string, status: number) {
  return json({ success: false, message, error: message }, status);
}

function readField(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function POST(request: Request) {
  let body: ContactPayload;

  try {
    body = (await request.json()) as ContactPayload;
  } catch {
    return fail("Invalid request.", 400);
  }

  // A filled honeypot means a bot. Report success so it stops trying, but send
  // nothing.
  if (readField(body.company, 200)) {
    return json({ success: true, message: "Message sent successfully." }, 200);
  }

  const name = readField(body.name, LIMITS.name);
  const email = readField(body.email, LIMITS.email);
  const subject = readField(body.subject, LIMITS.subject);
  const message = readField(body.message, LIMITS.message);

  if (!name || !email || !message) {
    return fail("Please fill in your name, email, and message.", 400);
  }

  if (!EMAIL_PATTERN.test(email)) {
    return fail("Please enter a valid email address.", 400);
  }

  if (!ALLOWED_SUBJECTS.includes(subject)) {
    return fail("Please choose one of the listed topics.", 400);
  }

  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    // Logged server-side only. The visitor just gets a safe fallback.
    console.error("[contact] RESEND_API_KEY is missing - email not sent.");
    return fail(
      `Email delivery is not configured yet. Please write to ${DEFAULT_CONTACT_EMAIL} directly.`,
      500
    );
  }

  const contactEmail = process.env.CONTACT_EMAIL?.trim() || DEFAULT_CONTACT_EMAIL;

  // Until elvaveo.com is verified in Resend, only the onboarding address is
  // allowed as a sender.
  const from =
    process.env.RESEND_FROM_EMAIL?.trim() || "ELVAVEO <onboarding@resend.dev>";

  const text = [
    message,
    "",
    "—",
    `Name: ${name}`,
    `Email: ${email}`,
    `Topic: ${subject}`,
  ].join("\n");

  const html = `
    <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;line-height:1.6;color:#081b3d">
      <p style="white-space:pre-wrap;margin:0 0 20px">${escapeHtml(message)}</p>
      <hr style="border:0;border-top:1px solid #e2e6ef;margin:0 0 16px" />
      <p style="margin:0"><strong>Name:</strong> ${escapeHtml(name)}<br />
      <strong>Email:</strong> ${escapeHtml(email)}<br />
      <strong>Topic:</strong> ${escapeHtml(subject)}</p>
    </div>
  `;

  try {
    const resendResponse = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [contactEmail],
        // Replying to the notification lands in the visitor's own inbox.
        reply_to: email,
        subject: `[${subject}] ${name}`,
        text,
        html,
      }),
    });

    if (!resendResponse.ok) {
      // Provider detail stays in the server log, never in the response body.
      const detail = await resendResponse.text();
      console.error(
        `[contact] Resend rejected the send (${resendResponse.status}): ${detail}`
      );
      return fail("Your message could not be sent. Please try again.", 502);
    }
  } catch (error) {
    console.error("[contact] Resend request failed:", error);
    return fail("Your message could not be sent. Please try again.", 502);
  }

  return json({ success: true, message: "Message sent successfully." }, 200);
}
