import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr


class CampaignCreate(BaseModel):
    product_name: str
    product_url: str
    product_summary: Optional[str] = None
    pacing_seconds: int = 60
    daily_cap: int = 50


class CampaignRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    product_name: str
    product_url: str
    product_summary: Optional[str]
    pacing_seconds: int
    daily_cap: int
    created_at: datetime
    updated_at: datetime


class LeadCreate(BaseModel):
    campaign_id: uuid.UUID
    company_name: str
    founder_name: str
    email: EmailStr
    company_url: str


class LeadUpdate(BaseModel):
    status: Optional[str] = None
    draft_subject: Optional[str] = None
    draft_body: Optional[str] = None
    confidence_score: Optional[Decimal] = None
    confidence_reasoning: Optional[str] = None
    failure_reason: Optional[str] = None


class LeadRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    campaign_id: uuid.UUID
    company_name: str
    founder_name: str
    email: str
    company_url: str
    status: str
    draft_subject: Optional[str]
    draft_body: Optional[str]
    confidence_score: Optional[Decimal]
    confidence_reasoning: Optional[str]
    failure_reason: Optional[str]
    created_at: datetime
    updated_at: datetime


class ResearchResponse(BaseModel):
    success: bool
    chunk_count: int
    errors: list[str]
    low_content: bool
    lead: LeadRead


class DraftResponse(BaseModel):
    success: bool
    confidence: Optional[float]
    reasoning: Optional[str]
    error: Optional[str]
    lead: LeadRead


class LeadChunkRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    source_url: str
    content: str


class SendResponse(BaseModel):
    success: bool
    error: Optional[str]
    rate_limited: bool
    retry_after_seconds: Optional[int]
    lead: LeadRead


class ReplyCheckResponse(BaseModel):
    success: bool
    checked: int
    new_replies: int
    error: Optional[str]


class PacingResponse(BaseModel):
    can_send_now: bool
    seconds_until_next_send: int
    sent_today: int
    daily_cap: int
    daily_cap_reached: bool
