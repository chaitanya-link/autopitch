import uuid
from dataclasses import dataclass

from sqlalchemy.orm import Session

from app.models import Lead, LeadChunk
from app.rag.chunker import chunk_text
from app.rag.embeddings import embed_texts
from app.rag.scraper import scrape_company_site

MIN_TOTAL_CONTENT_CHARS = 200  # below this, we consider the site too thin to research well


@dataclass
class ResearchResult:
    success: bool
    chunk_count: int
    errors: list[str]
    low_content: bool


def research_lead(lead_id: uuid.UUID, db: Session) -> ResearchResult:
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if lead is None:
        raise ValueError(f"Lead {lead_id} not found")

    lead.status = "researching"
    db.commit()

    scrape_result = scrape_company_site(lead.company_url)

    if not scrape_result.ok:
        lead.status = "failed"
        lead.failure_reason = "; ".join(scrape_result.errors) or "Scrape returned no content"
        db.commit()
        return ResearchResult(success=False, chunk_count=0, errors=scrape_result.errors, low_content=False)

    # Clear any prior chunks for this lead (re-research overwrites)
    db.query(LeadChunk).filter(LeadChunk.lead_id == lead_id).delete()

    all_chunks: list[tuple[str, str]] = []  # (source_url, chunk_text)
    for page in scrape_result.pages:
        for chunk in chunk_text(page.text):
            all_chunks.append((page.url, chunk))

    total_content_chars = sum(len(c) for _, c in all_chunks)
    low_content = total_content_chars < MIN_TOTAL_CONTENT_CHARS

    if not all_chunks:
        lead.status = "needs_review"
        lead.failure_reason = "Site scraped but no usable text content found"
        db.commit()
        return ResearchResult(success=False, chunk_count=0, errors=scrape_result.errors, low_content=True)

    embeddings = embed_texts([c for _, c in all_chunks])

    for (source_url, content), embedding in zip(all_chunks, embeddings):
        db.add(LeadChunk(lead_id=lead_id, source_url=source_url, content=content, embedding=embedding))

    if low_content:
        lead.status = "needs_review"
        lead.failure_reason = "Site content too thin for confident personalization"
    else:
        lead.status = "researched"
        if scrape_result.errors:
            lead.failure_reason = "; ".join(scrape_result.errors)
    db.commit()

    return ResearchResult(
        success=True,
        chunk_count=len(all_chunks),
        errors=scrape_result.errors,
        low_content=low_content,
    )
