import os
import smtplib
from email.mime.text import MIMEText
from email.utils import make_msgid

from email_validator import EmailNotValidError, validate_email

SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 465


def verify_email_format(email: str) -> tuple[bool, str | None]:
    try:
        validate_email(email, check_deliverability=False)
        return True, None
    except EmailNotValidError as exc:
        return False, str(exc)


def send_email(to_email: str, subject: str, body: str) -> str:
    """Sends an email via Gmail SMTP. Returns the Message-ID assigned to the outgoing mail."""
    sender = os.environ["GMAIL_SENDER_ADDRESS"]
    password = os.environ["GMAIL_APP_PASSWORD"]

    msg = MIMEText(body)
    msg["Subject"] = subject
    msg["From"] = sender
    msg["To"] = to_email
    message_id = make_msgid()
    msg["Message-ID"] = message_id

    with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=15) as server:
        server.login(sender, password)
        server.sendmail(sender, [to_email], msg.as_string())

    return message_id
