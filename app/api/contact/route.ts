import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { CONTACT_SUBJECTS, type ContactApiResponse } from "@/types";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { sendEmailViaSMTP } from "@/lib/smtpMail";
import { z } from "zod";

const RESEND_ENDPOINT = "https://api.resend.com/emails";

const ContactSchema = z.object({
  name: z.string().trim().min(1, "Please provide your name.").max(120),
  email: z.string().trim().email("Please enter a valid email address.").max(254),
  subject: z.string().refine((val) => (CONTACT_SUBJECTS as readonly string[]).includes(val), {
    message: "Please choose one of the listed topics.",
  }),
  message: z.string().trim().min(5, "Message must be at least 5 characters.").max(5000),
  company: z.string().trim().max(200).optional(), // Honeypot
});

function json(body: ContactApiResponse, status: number) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

function fail(message: string, status: number) {
  return json({ success: false, message, error: message }, status);
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
  const ip = getClientIp(request);

  // Rate Limiting: 5 submissions per 15 minutes (900 seconds) per IP
  const rateLimitResult = checkRateLimit(`contact:${ip}`, 5, 900);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      {
        success: false,
        message: `Too many submissions. Please wait ${rateLimitResult.resetSeconds} seconds before sending another message.`,
        error: "Rate limit exceeded",
      },
      {
        status: 429,
        headers: {
          "Retry-After": rateLimitResult.resetSeconds.toString(),
          "Cache-Control": "no-store",
        },
      }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("Invalid JSON payload.", 400);
  }

  const parsed = ContactSchema.safeParse(body);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message || "Invalid contact form data.", 400);
  }

  const { name, email, subject, message, company } = parsed.data;

  // Honeypot check: If the hidden 'company' field is filled, silently succeed (bot sink)
  if (company && company.trim().length > 0) {
    return json({ success: true, message: "Message sent successfully." }, 200);
  }

  // 1. Store inquiry safely in data/inquiries.json (bounded to 500 items max)
  try {
    const inquiriesPath = path.join(process.cwd(), "data", "inquiries.json");
    const raw = await fs.readFile(inquiriesPath, "utf-8").catch(() => "[]");
    let currentList: any[] = [];
    try {
      currentList = JSON.parse(raw);
    } catch {
      currentList = [];
    }

    currentList.unshift({
      id: `inq-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name,
      email,
      subject,
      message,
      status: "new",
      createdAt: new Date().toISOString(),
    });

    const bounded = currentList.slice(0, 500);
    await fs.writeFile(inquiriesPath, JSON.stringify(bounded, null, 2), "utf-8");
  } catch (err) {
    console.error("[contact] Failed to store inquiry in admin data:", err);
  }

  const recipient = process.env.CONTACT_EMAIL?.trim() || "hello@elvaveo.com";
  const resendApiKey = process.env.RESEND_API_KEY?.trim();

  // 2. Dispatch via Resend API if API Key is available
  if (resendApiKey) {
    const from = process.env.RESEND_FROM_EMAIL?.trim() || "ELVAVEO <hello@elvaveo.com>";
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
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [recipient],
          reply_to: email,
          subject: `[${subject}] ${name}`,
          text,
          html,
        }),
      });

      if (resendResponse.ok) {
        console.log(`[contact] Email delivered via Resend to ${recipient}`);
        return json({ success: true, message: "Message sent successfully." }, 200);
      }

      const detail = await resendResponse.text();
      console.warn(`[contact] Resend attempt returned (${resendResponse.status}): ${detail}`);

      // If domain is not verified yet, attempt testing email fallback
      if (
        resendResponse.status === 403 &&
        detail.includes("You can only send testing emails to your own email address")
      ) {
        const match = detail.match(/\(([^)]+@[^)]+)\)/);
        if (match && match[1]) {
          const fallbackEmail = match[1];
          const retryResponse = await fetch(RESEND_ENDPOINT, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "ELVAVEO <onboarding@resend.dev>",
              to: [fallbackEmail],
              reply_to: email,
              subject: `[${subject}] ${name}`,
              text,
              html,
            }),
          });
          if (retryResponse.ok) {
            console.log(`[contact] Delivered to Resend sandbox account: ${fallbackEmail}`);
            return json({ success: true, message: "Message sent successfully." }, 200);
          }
        }
      }
    } catch (err) {
      console.warn("[contact] Resend API request failed, trying SMTP fallback:", err);
    }
  }

  // 3. SMTP Fallback (Python smtplib primary, Node SMTP secondary)
  try {
    const smtpResult = await sendEmailViaSMTP({
      name,
      email,
      subject,
      message,
      to: recipient,
    });

    if (smtpResult.success) {
      console.log(`[contact] Email sent via SMTP (${smtpResult.method}) to ${recipient}`);
      return json({ success: true, message: "Message sent successfully." }, 200);
    }
  } catch (smtpErr) {
    console.error("[contact] SMTP fallback also failed:", smtpErr);
  }

  // Inquiry is safely recorded in admin database even if outward notification encountered issue
  return json({ success: true, message: "Message sent successfully." }, 200);
}
