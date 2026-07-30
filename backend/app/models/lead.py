import uuid

from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Numeric, func
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class Lead(Base):
    __tablename__ = "leads"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    campaign_id = Column(UUID(as_uuid=True), ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False)
    company_name = Column(String, nullable=False)
    founder_name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    company_url = Column(String, nullable=False)
    status = Column(String, nullable=False, default="queued")
    draft_subject = Column(Text, nullable=True)
    draft_body = Column(Text, nullable=True)
    confidence_score = Column(Numeric, nullable=True)
    confidence_reasoning = Column(Text, nullable=True)
    failure_reason = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now())
