import uuid

from sqlalchemy.orm import Session

from app.models import LeadChunk
from app.rag.embeddings import embed_query

DEFAULT_TOP_K = 5


def retrieve_top_chunks(lead_id: uuid.UUID, query: str, db: Session, top_k: int = DEFAULT_TOP_K) -> list[LeadChunk]:
    query_embedding = embed_query(query)
    return (
        db.query(LeadChunk)
        .filter(LeadChunk.lead_id == lead_id)
        .order_by(LeadChunk.embedding.cosine_distance(query_embedding))
        .limit(top_k)
        .all()
    )
