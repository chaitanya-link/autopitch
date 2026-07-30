from dataclasses import dataclass
from datetime import datetime, time, timezone

from sqlalchemy.orm import Session

from app.models import Campaign, EmailLog, Lead


@dataclass
class PacingStatus:
    can_send_now: bool
    seconds_until_next_send: int
    sent_today: int
    daily_cap: int
    daily_cap_reached: bool


def get_pacing_status(campaign: Campaign, db: Session) -> PacingStatus:
    now = datetime.now(timezone.utc)

    latest_log = (
        db.query(EmailLog)
        .join(Lead, EmailLog.lead_id == Lead.id)
        .filter(Lead.campaign_id == campaign.id, EmailLog.sent_at.isnot(None))
        .order_by(EmailLog.sent_at.desc())
        .first()
    )

    if latest_log and latest_log.sent_at:
        elapsed = (now - latest_log.sent_at).total_seconds()
        seconds_until_next = max(0, int(campaign.pacing_seconds - elapsed))
    else:
        seconds_until_next = 0

    today_start = datetime.combine(now.date(), time.min, tzinfo=timezone.utc)
    sent_today = (
        db.query(EmailLog)
        .join(Lead, EmailLog.lead_id == Lead.id)
        .filter(Lead.campaign_id == campaign.id, EmailLog.sent_at >= today_start)
        .count()
    )

    daily_cap_reached = sent_today >= campaign.daily_cap

    return PacingStatus(
        can_send_now=seconds_until_next == 0 and not daily_cap_reached,
        seconds_until_next_send=seconds_until_next,
        sent_today=sent_today,
        daily_cap=campaign.daily_cap,
        daily_cap_reached=daily_cap_reached,
    )
