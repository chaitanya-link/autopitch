from sqlalchemy.orm import Session

from app.agent.client import GENERATION_MODEL, get_client
from app.models import Campaign
from app.rag.scraper import scrape_company_site

MAX_SOURCE_CHARS = 6000

SUMMARY_PROMPT = """You are researching a company so a salesperson can pitch it accurately.
Company name: {product_name}
Raw scraped website text follows. Write a concise 3-4 sentence summary covering:
what the product/service does, who it's for, and its core value proposition.
Be specific and factual — no marketing fluff, no invented details not supported by the text.

Website text:
{content}
"""


def get_or_create_product_summary(campaign: Campaign, db: Session) -> str:
    if campaign.product_summary:
        return campaign.product_summary

    scrape_result = scrape_company_site(campaign.product_url)
    if scrape_result.ok:
        content = " ".join(page.text for page in scrape_result.pages)[:MAX_SOURCE_CHARS]
    else:
        content = "(site could not be scraped; rely on the product name only)"

    client = get_client()
    response = client.models.generate_content(
        model=GENERATION_MODEL,
        contents=SUMMARY_PROMPT.format(product_name=campaign.product_name, content=content),
    )
    summary = (response.text or "").strip() or f"{campaign.product_name}: no summary available."

    campaign.product_summary = summary
    db.commit()
    return summary
