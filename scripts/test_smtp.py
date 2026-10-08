import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def run_test():
    sender = "hussain.ali.power2go@gmail.com"
    password = "iagyvdambrunhetl"
    receiver = "hello@elvaveo.com"

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "ELVAVEO Test Email via Python SMTP"
    msg["From"] = f"ELVAVEO System <{sender}>"
    msg["To"] = receiver

    text = (
        "Hello Syed Hussain Ali,\n\n"
        "This is a verified test email sent using Python standard library smtplib via Gmail SMTP!\n"
        "Your Omucloud inbox is working!\n\n"
        "Sender: " + sender + "\n"
        "Receiver: " + receiver + "\n"
        "Transport: Python 3.11 smtplib (smtp.gmail.com:587)"
    )

    html = f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #081b3d; padding: 24px; background: #f4f7fd;">
      <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 32px; border: 1px solid rgba(130,160,220,0.25); box-shadow: 0 10px 30px rgba(8,27,61,0.06);">
        <div style="border-bottom: 2px solid #2563ff; padding-bottom: 16px; margin-bottom: 24px;">
          <h2 style="margin: 0; color: #081b3d; font-size: 22px;">ELVAVEO Test Email Successful!</h2>
          <span style="display: inline-block; padding: 4px 12px; background: rgba(37,99,255,0.1); color: #2563ff; font-weight: 600; font-size: 13px; border-radius: 20px; margin-top: 8px;">Python smtplib Verified</span>
        </div>
        <p style="font-size: 15px; color: #61708f; margin-bottom: 20px;">
          Yeh email <strong>Python smtplib</strong> ke zariye Gmail SMTP relay se successfully dispatch hui hai.
        </p>
        <div style="background: #f8fafc; padding: 18px; border-radius: 8px; border-left: 4px solid #2563ff; margin: 18px 0; font-size: 14px;">
          <div><strong>Sender:</strong> {sender}</div>
          <div style="margin-top: 6px;"><strong>Receiver:</strong> {receiver} (Omucloud Inbox)</div>
          <div style="margin-top: 6px;"><strong>Server:</strong> smtp.gmail.com:587 (TLS Authenticated)</div>
        </div>
        <p style="font-size: 14px; color: #081b3d; margin-top: 20px;">
          Aapki website ka contact form ab har inquiry directly aapke <strong>Omucloud inbox ({receiver})</strong> me deliver karega!
        </p>
        <div style="margin-top: 28px; font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 14px;">
          ELVAVEO Digital Solutions • Python SMTP Service
        </div>
      </div>
    </div>
    """

    msg.attach(MIMEText(text, "plain", "utf-8"))
    msg.attach(MIMEText(html, "html", "utf-8"))

    print(f"Connecting to smtp.gmail.com:587 as {sender}...")
    with smtplib.SMTP("smtp.gmail.com", 587, timeout=20) as server:
        server.ehlo()
        server.starttls()
        server.ehlo()
        server.login(sender, password)
        server.sendmail(sender, [receiver], msg.as_string())

    print(f"SUCCESS: Email successfully delivered to {receiver}!")

if __name__ == "__main__":
    run_test()
