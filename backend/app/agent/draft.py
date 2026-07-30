import uuid
from dataclasses import dataclass

from google.genai import types
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.agent.client import GENERATION_MODEL, get_client
from app.agent.product_summary import get_or_create_product_summary
from app.models import Campaign, Lead
from app.rag.retrieve import retrieve_top_chunks

CONFIDENCE_THRESHOLD = 0.6
RETRIEVAL_QUERY_TEMPLATE = "{company_name} product, mission, customers, recent activity"
TOP_K_CHUNKS = 6

SYSTEM_INSTRUCTION = """You are an SDR agent drafting a single cold outreach email.
Hard rules:
- Reference at least one concrete, specific detail from the research context provided (a real product feature, a stated mission, a named customer, a recent update). Never write a generic email that could apply to any company.
- Never invent facts that aren't supported by the research context. If the context is too thin, sparse, or generic (e.g. only nav links, cookie notices, boilerplate) to write something genuinely specific, set confidence low and explain why in `reasoning` rather than fabricating detail.
- Connect the specific detail you found to why the sender's product is relevant to THIS company, not a generic pitch.
- Keep the body under 150 words, plain text, no markdown, sign off with just the sender's product name.
- No generic filler phrases like "I hope this email finds you well" or "I came across your company".
- confidence is your honest 0.0-1.0 estimate of how genuinely personalized (vs generic) this draft is, based on the specificity of the research context available.
"""

USER_PROMPT_TEMPLATE = """SENDER'S PRODUCT (what we're pitching):
{product_summary}

TARGET LEAD:
Company: {company_name}
Founder: {founder_name}

RESEARCH CONTEXT (retrieved from the target company's website):
{context_text}

Draft the outreach email now.
"""


class DraftOutput(BaseModel):
    subject: str = Field(description="Email subject line, specific to this lead")
    body: str = Field(description="Email body, under 150 words")
    confidence: float = Field(description="0.0-1.0 confidence this draft is genuinely personalized, not generic")
    reasoning: str = Field(description="One sentence on what specific detail was used, or why confidence is low")


@dataclass
class DraftResult:
    success: bool
    lead: Lead
    confidence: float | None
    reasoning: str | None
    error: str | None = None


def _build_context_text(chunks) -> str:
    return "\n---\n".join(f"[source: {c.source_url}]\n{c.content}" for c in chunks)


def draft_email_for_lead(lead_id: uuid.UUID, db: Session) -> DraftResult:
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if lead is None:
        raise ValueError(f"Lead {lead_id} not found")

    campaign = db.query(Campaign).filter(Campaign.id == lead.campaign_id).first()
    if campaign is None:
        raise ValueError(f"Campaign {lead.campaign_id} not found for lead {lead_id}")

    chunks = retrieve_top_chunks(
        lead.id,
        RETRIEVAL_QUERY_TEMPLATE.format(company_name=lead.company_name),
        db,
        top_k=TOP_K_CHUNKS,
    )
    if not chunks:
        lead.status = "needs_review"
        lead.failure_reason = "No research context available — run research before drafting"
        db.commit()
        return DraftResult(success=False, lead=lead, confidence=None, reasoning=None, error=lead.failure_reason)

    try:
        product_summary = get_or_create_product_summary(campaign, db)
    except Exception as exc:
        lead.status = "failed"
        lead.failure_reason = f"Failed to summarize sender's product: {exc}"
        db.commit()
        return DraftResult(success=False, lead=lead, confidence=None, reasoning=None, error=lead.failure_reason)

    context_text = _build_context_text(chunks)
    prompt = USER_PROMPT_TEMPLATE.format(
        product_summary=product_summary,
        company_name=lead.company_name,
        founder_name=lead.founder_name,
        context_text=context_text,
    )

    try:
        client = get_client()
        response = client.models.generate_content(
            model=GENERATION_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_INSTRUCTION,
                response_mime_type="application/json",
                response_schema=DraftOutput,
                temperature=0.7,
            ),
        )
        draft: DraftOutput = response.parsed
        if draft is None:
            raise ValueError("Model returned no parseable output")
    except Exception as exc:
        lead.status = "failed"
        lead.failure_reason = f"Drafting failed: {exc}"
        db.commit()
        return DraftResult(success=False, lead=lead, confidence=None, reasoning=None, error=lead.failure_reason)

    lead.draft_subject = draft.subject
    lead.draft_body = draft.body
    lead.confidence_score = draft.confidence
    lead.confidence_reasoning = draft.reasoning
    lead.failure_reason = None

    if draft.confidence < CONFIDENCE_THRESHOLD:
        lead.status = "needs_review"
    else:
        lead.status = "drafted"

    db.commit()
    return DraftResult(success=True, lead=lead, confidence=draft.confidence, reasoning=draft.reasoning)
