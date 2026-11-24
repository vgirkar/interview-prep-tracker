"""Sends the email built by daily-email.mjs through Gmail, using repository secrets."""
import os
import smtplib
import sys
from email.message import EmailMessage

user = os.environ.get("MAIL_USERNAME", "").strip()
password = os.environ.get("MAIL_APP_PASSWORD", "").replace(" ", "")
if not user or not password:
    sys.exit("Add the MAIL_USERNAME and MAIL_APP_PASSWORD secrets to this repository first.")

msg = EmailMessage()
msg["Subject"] = open("subject.txt", encoding="utf-8").read().strip()
msg["From"] = f"Interview prep tracker <{user}>"
msg["To"] = os.environ.get("MAIL_TO", "").strip() or user
msg.set_content("Open this email in a mail app that shows HTML to see today's plan.")
msg.add_alternative(open("body.html", encoding="utf-8").read(), subtype="html")

with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
    server.login(user, password)
    server.send_message(msg)
print("Email sent.")
