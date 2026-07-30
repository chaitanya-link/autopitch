import uuid

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models import Campaign, Lead


def get_owned_campaign(campaign_id: uuid.UUID, user: dict, db: Session) -> Campaign:
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign or str(campaign.user_id) != user["id"]:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return campaign


def get_owned_lead(lead_id: uuid.UUID, user: dict, db: Session) -> Lead:
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    get_owned_campaign(lead.campaign_id, user, db)
    return lead
