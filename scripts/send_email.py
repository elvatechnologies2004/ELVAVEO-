#!/usr/bin/env python3
"""
ELVAVEO Contact Form Email Sender
Uses Python's built-in standard library (smtplib, email) to send inquiries via SMTP.
No third-party pip dependencies required.
"""

import sys
import os
import json
import argparse
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import formataddr

def load_env_file(filepath):
    """Simple parser for .env / .env.local files without external dependencies."""
    if not os.path.exists(filepath):
        return
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                k, v = line.split("=", 1)
                k = k.strip()
                v = v.strip().strip("'\"")
                if k and k not in os.environ:
                    os.environ[k] = v
    except Exception as e:
        sys.stderr.write(f"Warning: Could not read env file {filepath}: {e}\n")

def send_contact_email(name, email, subject, message, to_email=None):
    # Try loading .env.local from project root
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    load_env_file(os.path.join(project_root, ".env.local"))
    load_env_file(os.path.join(project_root, ".env"))

    smtp_host = os.environ.get("SMTP_HOST", "smtp.omucloud.co").strip()
    smtp_port_raw = os.environ.get("SMTP_PORT", "587").strip()
    try:
        smtp_port = int(smtp_port_raw)
    except ValueError:
        smtp_port = 587

    sender_email = os.environ.get("SENDER_EMAIL", "hello@elvaveo.com").strip()
    sender_name = os.environ.get("SENDER_NAME", "ELVAVEO Website").strip()
    smtp_user = os.environ.get("SMTP_USER", sender_email).strip()
    smtp_pass = os.environ.get("SMTP_PASS") or os.environ.get("SMTP_PASSWORD", "")
    
    recipient = to_email or os.environ.get("CONTACT_EMAIL", "hello@elvaveo.com").strip()

    if not smtp_host:
        return {
            "success": False,
            "error": "SMTP_HOST environment variable is not configured."
        }

    # Construct Email Message
    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"[{subject}] {name}"
    msg["From"] = formataddr((sender_name, sender_email))
    msg["To"] = recipient
    msg["Reply-To"] = email

    # Plain text version
    text_content = (
        f"New Inquiry Received from ELVAVEO Website\n\n"
        f"Name: {name}\n"
        f"Email: {email}\n"
        f"Topic: {subject}\n\n"
        f"Message:\n{message}\n\n"
        f"---\nSent via ELVAVEO Python SMTP Service"
    )

    # HTML version
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #081b3d; margin: 0; padding: 20px; background-color: #f4f7fd; }}
        .card {{ max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid rgba(130,160,220,0.25); box-shadow: 0 10px 30px rgba(8,27,61,0.06); padding: 32px; }}
        .header {{ border-bottom: 2px solid #2563ff; padding-bottom: 16px; margin-bottom: 24px; }}
        .header h2 {{ margin: 0; color: #081b3d; font-size: 22px; }}
        .badge {{ display: inline-block; padding: 4px 12px; background: rgba(37,99,255,0.1); color: #2563ff; font-weight: 600; font-size: 13px; border-radius: 20px; margin-top: 6px; }}
        .detail-row {{ margin-bottom: 12px; font-size: 15px; }}
        .detail-label {{ font-weight: bold; color: #61708f; display: inline-block; width: 80px; }}
        .detail-value {{ color: #081b3d; }}
        .message-box {{ margin-top: 20px; padding: 18px; background: #f8fafc; border-left: 4px solid #2563ff; border-radius: 6px; font-size: 15px; white-space: pre-wrap; }}
        .footer {{ margin-top: 30px; font-size: 12px; color: #94a3b8; text-align: center; }}
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h2>New Website Inquiry</h2>
          <span class="badge">{subject}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Name:</span>
          <span class="detail-value"><strong>{name}</strong></span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Email:</span>
          <span class="detail-value"><a href="mailto:{email}" style="color: #2563ff; text-decoration: none;">{email}</a></span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Topic:</span>
          <span class="detail-value">{subject}</span>
        </div>
        <div class="message-box">{message}</div>
        <div class="footer">
          Received via ELVAVEO Contact Form • Sender: {sender_email}
        </div>
      </div>
    </body>
    </html>
    """

    msg.attach(MIMEText(text_content, "plain", "utf-8"))
    msg.attach(MIMEText(html_content, "html", "utf-8"))

    try:
        if smtp_port == 465:
            with smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=20) as server:
                if smtp_user and smtp_pass:
                    server.login(smtp_user, smtp_pass)
                server.sendmail(sender_email, [recipient], msg.as_string())
        else:
            with smtplib.SMTP(smtp_host, smtp_port, timeout=20) as server:
                server.ehlo()
                try:
                    server.starttls()
                    server.ehlo()
                except Exception as tls_err:
                    sys.stderr.write(f"Notice: STARTTLS not supported or skipped: {tls_err}\n")
                if smtp_user and smtp_pass:
                    server.login(smtp_user, smtp_pass)
                server.sendmail(sender_email, [recipient], msg.as_string())

        return {
            "success": True,
            "message": f"Email successfully dispatched to {recipient} via {smtp_host}:{smtp_port}"
        }
    except Exception as exc:
        return {
            "success": False,
            "error": str(exc),
            "host": smtp_host,
            "port": smtp_port,
            "sender": sender_email
        }

def main():
    parser = argparse.ArgumentParser(description="Send contact inquiry email via Python SMTP")
    parser.add_argument("--name", help="Visitor full name")
    parser.add_argument("--email", help="Visitor email address")
    parser.add_argument("--subject", help="Inquiry subject")
    parser.add_argument("--message", help="Inquiry message content")
    parser.add_argument("--to", help="Recipient email address", default=None)
    parser.add_argument("--json", action="store_true", help="Read payload as JSON from stdin")

    args = parser.parse_args()

    if args.json or not (args.name and args.email and args.message):
        try:
            stdin_data = sys.stdin.read()
            if stdin_data.strip():
                payload = json.loads(stdin_data)
                name = payload.get("name", "")
                email = payload.get("email", "")
                subject = payload.get("subject", "General Inquiry")
                message = payload.get("message", "")
                to_email = payload.get("to", None)
            else:
                name = args.name or ""
                email = args.email or ""
                subject = args.subject or "General Inquiry"
                message = args.message or ""
                to_email = args.to
        except Exception as e:
            sys.stdout.write(json.dumps({"success": False, "error": f"Invalid JSON input: {e}"}))
            sys.exit(1)
    else:
        name = args.name
        email = args.email
        subject = args.subject or "General Inquiry"
        message = args.message
        to_email = args.to

    result = send_contact_email(name, email, subject, message, to_email)
    sys.stdout.write(json.dumps(result, indent=2))
    sys.exit(0 if result["success"] else 1)

if __name__ == "__main__":
    main()
