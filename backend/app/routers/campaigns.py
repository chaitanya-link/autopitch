import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.mailer.pacing import get_pacing_status
from app.models import Campaign
from app.schemas import CampaignCreate, CampaignRead, PacingResponse

router = APIRouter(prefix="/campaigns", tags=["campaigns"])


@router.post("", response_model=CampaignRead, status_code=201)
def create_campaign(payload: CampaignCreate, db: Session = Depends(get_db)):
    campaign = Campaign(**payload.model_dump())
    db.add(campaign)
    db.commit()
    db.refresh(campaign)
    return campaign


@router.get("", response_model=list[CampaignRead])
def list_campaigns(db: Session = Depends(get_db)):
    return db.query(Campaign).order_by(Campaign.created_at.desc()).all()


@router.get("/{campaign_id}", response_model=CampaignRead)
def get_campaign(campaign_id: uuid.UUID, db: Session = Depends(get_db)):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return campaign


@router.get("/{campaign_id}/pacing", response_model=PacingResponse)
def get_campaign_pacing(campaign_id: uuid.UUID, db: Session = Depends(get_db)):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    status = get_pacing_status(campaign, db)
    return PacingResponse(
        can_send_now=status.can_send_now,
        seconds_until_next_send=status.seconds_until_next_send,
        sent_today=status.sent_today,
        daily_cap=status.daily_cap,
        daily_cap_reached=status.daily_cap_reached,
    )
