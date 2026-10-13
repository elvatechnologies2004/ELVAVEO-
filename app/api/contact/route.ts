import { NextResponse } from "next/server";
import { CONTACT_SUBJECTS, type ContactApiResponse } from "@/types";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { addInquiry } from "@/lib/dataStore";
import { z } from "zod";

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const DEFAULT_FROM = "ELVAVEO Website <notifications@notify.elvaveo.com>";
const DEFAULT_RECIPIENT = "hello@elvaveo.com";

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

  // 1. Store inquiry safely in admin database / Supabase so leads are never lost
  try {
    await addInquiry({
      name,
      email,
      subject,
      message,
      company: company || undefined,
      source: "Website Contact",
    });
  } catch (err) {
    console.error("[contact] Failed to store inquiry in dataStore:", err);
  }

  // 2. Validate Resend API Configuration
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  if (!resendApiKey) {
    console.warn("[contact] RESEND_API_KEY environment variable is not configured.");
    return fail(
      "Our contact form is temporarily unavailable. Please email us directly at hello@elvaveo.com.",
      503
    );
  }

  const recipient = process.env.CONTACT_EMAIL?.trim() || DEFAULT_RECIPIENT;
  const from = process.env.RESEND_FROM_EMAIL?.trim() || DEFAULT_FROM;

  const text = [
    `New message from ELVAVEO website contact form:`,
    ``,
    `Name: ${name}`,
    `Email: ${email}`,
    `Topic: ${subject}`,
    ``,
    `Message:`,
    message,
    ``,
    `—`,
    `Submitted at: ${new Date().toISOString()}`,
    `Client IP: ${ip}`,
  ].join("\n");

  const html = `
    <div style="font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;color:#081b3d;max-width:600px;margin:0 auto;padding:24px;background:#ffffff;border-radius:12px;border:1px solid #e2e8f0">
      <div style="border-bottom:2px solid #2563ff;padding-bottom:12px;margin-bottom:20px">
        <h2 style="margin:0;color:#081b3d;font-size:20px">New Website Contact Inquiry</h2>
        <span style="display:inline-block;padding:3px 10px;background:#eff6ff;color:#2563ff;font-weight:600;font-size:12px;border-radius:12px;margin-top:6px">${escapeHtml(subject)}</span>
      </div>
      <table style="width:100%;margin-bottom:16px;border-collapse:collapse;font-size:14px">
        <tr>
          <td style="padding:6px 0;color:#61708f;width:80px;font-weight:600">Name:</td>
          <td style="padding:6px 0;color:#081b3d"><strong>${escapeHtml(name)}</strong></td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#61708f;font-weight:600">Email:</td>
          <td style="padding:6px 0;color:#081b3d"><a href="mailto:${escapeHtml(email)}" style="color:#2563ff;text-decoration:none">${escapeHtml(email)}</a></td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#61708f;font-weight:600">Topic:</td>
          <td style="padding:6px 0;color:#081b3d">${escapeHtml(subject)}</td>
        </tr>
      </table>
      <div style="background:#f8fafc;padding:16px;border-radius:8px;border-left:4px solid #2563ff;margin-bottom:20px">
        <p style="margin:0;white-space:pre-wrap;font-size:14.5px;color:#081b3d">${escapeHtml(message)}</p>
      </div>
      <hr style="border:0;border-top:1px solid #e2e8f0;margin:16px 0" />
      <p style="margin:0;font-size:11px;color:#94a3b8">
        Sender: ${escapeHtml(from)} &bull; Recipient: ${escapeHtml(recipient)} &bull; Reply-To: ${escapeHtml(email)}
      </p>
    </div>
  `;

  // 3. Dispatch via Resend HTTP API
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

    const requestId =
      resendResponse.headers.get("x-request-id") ||
      resendResponse.headers.get("x-resend-request-id") ||
      "none";

    if (resendResponse.ok) {
      const resendData = (await resendResponse.json().catch(() => ({}))) as { id?: string };
      const emailId = resendData.id || "accepted";
      console.log(
        `[contact] Resend accepted email: id=${emailId}, requestId=${requestId}, recipient=${recipient}`
      );
      return json(
        {
          success: true,
          message: "Your message has been sent successfully. We will get back to you shortly.",
        },
        200
      );
    }

    // Handle Resend rejection
    const rawError = await resendResponse.text().catch(() => "");
    let errorDetail = rawError;
    try {
      const parsedError = JSON.parse(rawError);
      errorDetail = parsedError.message || parsedError.name || rawError;
    } catch {}

    console.error(
      `[contact] Resend API error: status=${resendResponse.status}, requestId=${requestId}, detail=${errorDetail}`
    );

    return fail(
      "We could not send your message at this time. Please try again or email us directly at hello@elvaveo.com.",
      502
    );
  } catch (err: any) {
    console.error("[contact] Resend dispatch network error:", err?.message || err);
    return fail(
      "A network error occurred while sending your message. Please try again or email us directly at hello@elvaveo.com.",
      500
    );
  }
}
