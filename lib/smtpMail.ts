import { spawn } from "child_process";
import path from "path";
import nodemailer from "nodemailer";

export interface SendMailParams {
  name: string;
  email: string;
  subject: string;
  message: string;
  to?: string;
}

export interface SendMailResult {
  success: boolean;
  message?: string;
  error?: string;
  method?: "python_smtplib" | "node_smtp";
}

/**
 * Execute Python smtplib script to send the email.
 */
function sendWithPython(params: SendMailParams): Promise<SendMailResult> {
  return new Promise((resolve) => {
    const scriptPath = path.join(process.cwd(), "scripts", "send_email.py");
    const pyProcess = spawn("python", [
      scriptPath,
      "--name", params.name,
      "--email", params.email,
      "--subject", params.subject,
      "--message", params.message,
      "--to", params.to || process.env.CONTACT_EMAIL || "hello@elvaveo.com",
    ], {
      cwd: process.cwd(),
      env: process.env,
      timeout: 25000,
    });

    let stdout = "";
    let stderr = "";

    pyProcess.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    pyProcess.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    pyProcess.on("error", (err) => {
      resolve({
        success: false,
        error: `Python execution failed: ${err.message}`,
      });
    });

    pyProcess.on("close", (code) => {
      if (code === 0) {
        try {
          const parsed = JSON.parse(stdout.trim());
          resolve({
            success: parsed.success ?? true,
            message: parsed.message || "Email sent via Python smtplib",
            method: "python_smtplib",
          });
        } catch {
          resolve({
            success: true,
            message: stdout.trim() || "Email sent via Python smtplib",
            method: "python_smtplib",
          });
        }
      } else {
        let errDetail = stderr.trim() || stdout.trim();
        try {
          const parsed = JSON.parse(stdout.trim());
          if (parsed.error) errDetail = parsed.error;
        } catch {}
        resolve({
          success: false,
          error: errDetail || `Python smtplib process exited with code ${code}`,
        });
      }
    });
  });
}

/**
 * Fallback to Node.js SMTP (nodemailer) using the exact same SMTP credentials.
 * Ensures email delivery works seamlessly in environments where Python runtime is not installed (e.g. Vercel).
 */
async function sendWithNodeSMTP(params: SendMailParams): Promise<SendMailResult> {
  const host = process.env.SMTP_HOST || "smtp.omucloud.co";
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const senderEmail = process.env.SENDER_EMAIL || "hello@elvaveo.com";
  const senderName = process.env.SENDER_NAME || "ELVAVEO Website";
  const user = process.env.SMTP_USER || senderEmail;
  const pass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD || "";
  const recipient = params.to || process.env.CONTACT_EMAIL || "hello@elvaveo.com";

  if (!host) {
    return {
      success: false,
      error: "SMTP_HOST is not configured in environment variables.",
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: pass ? { user, pass } : undefined,
      tls: {
        rejectUnauthorized: false,
      },
    });

    const info = await transporter.sendMail({
      from: `"${senderName}" <${senderEmail}>`,
      to: recipient,
      replyTo: params.email,
      subject: `[${params.subject}] ${params.name}`,
      text: `New Website Inquiry:\n\nName: ${params.name}\nEmail: ${params.email}\nTopic: ${params.subject}\n\nMessage:\n${params.message}`,
      html: `
        <div style="font-family:ui-sans-serif,system-ui,sans-serif;line-height:1.6;color:#081b3d;max-width:600px;margin:0 auto;padding:24px;background:#ffffff;border-radius:12px;border:1px solid #e2e8f0">
          <h2 style="margin:0 0 16px;color:#2563ff">New Website Inquiry</h2>
          <p><strong>Name:</strong> ${params.name}</p>
          <p><strong>Email:</strong> <a href="mailto:${params.email}">${params.email}</a></p>
          <p><strong>Topic:</strong> ${params.subject}</p>
          <hr style="border:0;border-top:1px solid #e2e8f0;margin:16px 0" />
          <div style="background:#f8fafc;padding:16px;border-radius:8px;border-left:4px solid #2563ff;white-space:pre-wrap">${params.message}</div>
          <p style="margin-top:24px;font-size:12px;color:#94a3b8">Sender: ${senderEmail} • Recipient: ${recipient}</p>
        </div>
      `,
    });

    return {
      success: true,
      message: `Email delivered via Node SMTP: ${info.messageId}`,
      method: "node_smtp",
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Failed to send email via Node SMTP",
    };
  }
}

/**
 * Primary dispatch function:
 * First attempts to send using Python smtplib.
 * If Python is unavailable or errors out due to runtime, falls back to Node SMTP.
 */
export async function sendEmailViaSMTP(params: SendMailParams): Promise<SendMailResult> {
  // 1. Try Python smtplib first
  try {
    const pythonResult = await sendWithPython(params);
    if (pythonResult.success) {
      return pythonResult;
    }
    console.warn("[smtpMail] Python smtplib attempt returned error:", pythonResult.error);
    // If error is runtime/missing python or SMTP connection, try Node SMTP
  } catch (err) {
    console.warn("[smtpMail] Could not execute Python process:", err);
  }

  // 2. Fallback to Node SMTP
  console.log("[smtpMail] Falling back to Node.js SMTP transport...");
  return await sendWithNodeSMTP(params);
}
