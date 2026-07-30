import email as email_pkg
import imaplib
import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.mailer.credentials import get_sender_credentials
from app.models import Campaign, EmailLog, Lead

IMAP_HOST = "imap.gmail.com"
IMAP_PORT = 993
SNIPPET_MAX_CHARS = 240


@dataclass
class ReplyCheckResult:
    success: bool
    checked: int
    new_replies: int
    error: str | None = None


def _extract_snippet(raw_message: bytes) -> str:
    msg = email_pkg.message_from_bytes(raw_message)
    body = ""
    if msg.is_multipart():
        for part in msg.walk():
            if part.get_content_type() == "text/plain" and not part.get_filename():
                charset = part.get_content_charset() or "utf-8"
                body = part.get_payload(decode=True).decode(charset, errors="replace")
                break
    else:
        charset = msg.get_content_charset() or "utf-8"
        payload = msg.get_payload(decode=True)
        if payload:
            body = payload.decode(charset, errors="replace")

    body = " ".join(body.split())
    return body[:SNIPPET_MAX_CHARS]


def check_replies_for_campaign(campaign_id: uuid.UUID, db: Session) -> ReplyCheckResult:
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if campaign is None:
        return ReplyCheckResult(success=False, checked=0, new_replies=0, error="Campaign not found")

    pending_logs = (
        db.query(EmailLog)
        .join(Lead, EmailLog.lead_id == Lead.id)
        .filter(
            Lead.campaign_id == campaign_id,
            EmailLog.sent_at.isnot(None),
            EmailLog.replied_at.is_(None),
            EmailLog.provider_message_id.isnot(None),
        )
        .all()
    )
    if not pending_logs:
        return ReplyCheckResult(success=True, checked=0, new_replies=0)

    pending_by_msgid = {log.provider_message_id: log for log in pending_logs}
    earliest_sent = min(log.sent_at for log in pending_logs)
    since_date = (earliest_sent - timedelta(days=1)).strftime("%d-%b-%Y")

    try:
        sender, password = get_sender_credentials(campaign)
        mail = imaplib.IMAP4_SSL(IMAP_HOST, IMAP_PORT, timeout=20)
        mail.login(sender, password)
        mail.select("INBOX", readonly=True)
        typ, data = mail.search(None, f'(SINCE "{since_date}")')
        if typ != "OK":
            mail.logout()
            return ReplyCheckResult(success=False, checked=0, new_replies=0, error="IMAP search failed")

        message_nums = data[0].split()
        new_replies = 0
        matched_msgids: set[str] = set()

        for num in message_nums:
            typ, msg_data = mail.fetch(
                num, "(BODY.PEEK[HEADER.FIELDS (IN-REPLY-TO REFERENCES)])"
            )
            if typ != "OK" or not msg_data or not msg_data[0]:
                continue
            header_msg = email_pkg.message_from_bytes(msg_data[0][1])
            combined_refs = f"{header_msg.get('In-Reply-To', '')} {header_msg.get('References', '')}"

            matched_msgid = next(
                (msgid for msgid in pending_by_msgid if msgid not in matched_msgids and msgid in combined_refs),
                None,
            )
            if not matched_msgid:
                continue

            typ, full_data = mail.fetch(num, "(RFC822)")
            snippet = ""
            if typ == "OK" and full_data and full_data[0]:
                snippet = _extract_snippet(full_data[0][1])

            log = pending_by_msgid[matched_msgid]
            log.replied_at = datetime.now(timezone.utc)
            log.reply_snippet = snippet or "(reply received, no readable text body)"
            lead = db.query(Lead).filter(Lead.id == log.lead_id).first()
            if lead:
                lead.status = "replied"
            matched_msgids.add(matched_msgid)
            new_replies += 1

        mail.logout()
        db.commit()
        return ReplyCheckResult(success=True, checked=len(message_nums), new_replies=new_replies)
    except Exception as exc:
        return ReplyCheckResult(success=False, checked=0, new_replies=0, error=str(exc))
