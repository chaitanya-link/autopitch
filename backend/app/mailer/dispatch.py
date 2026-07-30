import uuid
from dataclasses import dataclass
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.mailer.pacing import get_pacing_status
from app.mailer.sender import send_email, verify_email_format
from app.models import Campaign, EmailLog, Lead


@dataclass
class SendResult:
    success: bool
    lead: Lead
    error: str | None = None
    rate_limited: bool = False
    retry_after_seconds: int | None = None


def send_lead_email(lead_id: uuid.UUID, db: Session) -> SendResult:
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if lead is None:
        raise ValueError(f"Lead {lead_id} not found")

    campaign = db.query(Campaign).filter(Campaign.id == lead.campaign_id).first()
    if campaign is None:
        raise ValueError(f"Campaign {lead.campaign_id} not found for lead {lead_id}")

    if not lead.draft_subject or not lead.draft_body:
        lead.failure_reason = "No draft available to send — run research and drafting first"
        db.commit()
        return SendResult(success=False, lead=lead, error=lead.failure_reason)

    # Verify step: basic email format/pattern check before send
    valid, reason = verify_email_format(lead.email)
    if not valid:
        lead.status = "failed"
        lead.failure_reason = f"Invalid email address, not sent: {reason}"
        db.commit()
        return SendResult(success=False, lead=lead, error=lead.failure_reason)

    pacing = get_pacing_status(campaign, db)
    if pacing.daily_cap_reached:
        error = f"Daily send cap reached ({pacing.sent_today}/{pacing.daily_cap}). Try again tomorrow."
        return SendResult(success=False, lead=lead, error=error, rate_limited=True)
    if not pacing.can_send_now:
        error = f"Pacing interval active — next send available in {pacing.seconds_until_next_send}s"
        return SendResult(
            success=False,
            lead=lead,
            error=error,
            rate_limited=True,
            retry_after_seconds=pacing.seconds_until_next_send,
        )

    try:
        message_id = send_email(lead.email, lead.draft_subject, lead.draft_body)
    except Exception as exc:
        lead.status = "failed"
        lead.failure_reason = f"Send failed: {exc}"
        db.commit()
        return SendResult(success=False, lead=lead, error=lead.failure_reason)

    db.add(
        EmailLog(
            lead_id=lead.id,
            sent_at=datetime.now(timezone.utc),
            provider_message_id=message_id,
        )
    )
    lead.status = "sent"
    lead.failure_reason = None
    db.commit()
    return SendResult(success=True, lead=lead)
