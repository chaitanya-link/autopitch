import csv
import io
import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from app.agent.draft import draft_email_for_lead
from app.database import get_db
from app.models import Campaign, Lead
from app.rag.pipeline import research_lead
from app.rag.retrieve import retrieve_top_chunks
from app.schemas import DraftResponse, LeadChunkRead, LeadCreate, LeadRead, LeadUpdate, ResearchResponse

router = APIRouter(prefix="/leads", tags=["leads"])

REQUIRED_CSV_COLUMNS = {"company_name", "founder_name", "email", "company_url"}


@router.post("", response_model=LeadRead, status_code=201)
def create_lead(payload: LeadCreate, db: Session = Depends(get_db)):
    lead = Lead(**payload.model_dump())
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return lead


@router.post("/upload-csv", response_model=list[LeadRead], status_code=201)
async def upload_leads_csv(
    campaign_id: uuid.UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    raw = (await file.read()).decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(raw))

    if reader.fieldnames is None or not REQUIRED_CSV_COLUMNS.issubset(set(reader.fieldnames)):
        raise HTTPException(
            status_code=400,
            detail=f"CSV must contain columns: {sorted(REQUIRED_CSV_COLUMNS)}",
        )

    created: list[Lead] = []
    for row in reader:
        if not row.get("email"):
            continue
        lead = Lead(
            campaign_id=campaign_id,
            company_name=row["company_name"].strip(),
            founder_name=row["founder_name"].strip(),
            email=row["email"].strip(),
            company_url=row["company_url"].strip(),
        )
        db.add(lead)
        created.append(lead)

    db.commit()
    for lead in created:
        db.refresh(lead)
    return created


@router.get("", response_model=list[LeadRead])
def list_leads(campaign_id: uuid.UUID | None = None, db: Session = Depends(get_db)):
    query = db.query(Lead)
    if campaign_id:
        query = query.filter(Lead.campaign_id == campaign_id)
    return query.order_by(Lead.created_at.desc()).all()


@router.get("/{lead_id}", response_model=LeadRead)
def get_lead(lead_id: uuid.UUID, db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead


@router.post("/{lead_id}/research", response_model=ResearchResponse)
def run_research(lead_id: uuid.UUID, db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    result = research_lead(lead_id, db)
    db.refresh(lead)
    return ResearchResponse(
        success=result.success,
        chunk_count=result.chunk_count,
        errors=result.errors,
        low_content=result.low_content,
        lead=lead,
    )


@router.post("/{lead_id}/draft", response_model=DraftResponse)
def run_draft(lead_id: uuid.UUID, db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    result = draft_email_for_lead(lead_id, db)
    return DraftResponse(
        success=result.success,
        confidence=result.confidence,
        reasoning=result.reasoning,
        error=result.error,
        lead=result.lead,
    )


@router.get("/{lead_id}/context", response_model=list[LeadChunkRead])
def get_lead_context(lead_id: uuid.UUID, query: str, top_k: int = 5, db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return retrieve_top_chunks(lead_id, query, db, top_k=top_k)


@router.patch("/{lead_id}", response_model=LeadRead)
def update_lead(lead_id: uuid.UUID, payload: LeadUpdate, db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(lead, field, value)

    db.commit()
    db.refresh(lead)
    return lead
