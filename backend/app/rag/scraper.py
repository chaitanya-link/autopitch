import urllib.robotparser
from dataclasses import dataclass, field
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup

USER_AGENT = "AutoPitchBot/0.1 (+https://github.com/chaitanya-link/autopitch)"
REQUEST_TIMEOUT = 10
MAX_PAGES_PER_LEAD = 3
PRIORITY_LINK_KEYWORDS = ("about", "product", "team", "mission", "company")


@dataclass
class ScrapedPage:
    url: str
    text: str


@dataclass
class ScrapeResult:
    pages: list[ScrapedPage] = field(default_factory=list)
    errors: list[str] = field(default_factory=list)

    @property
    def ok(self) -> bool:
        return len(self.pages) > 0


def _robots_allows(base_url: str, target_url: str) -> bool:
    parsed = urlparse(base_url)
    robots_url = f"{parsed.scheme}://{parsed.netloc}/robots.txt"
    rp = urllib.robotparser.RobotFileParser()
    try:
        rp.set_url(robots_url)
        rp.read()
    except Exception:
        # No readable robots.txt -> default to allow
        return True
    return rp.can_fetch(USER_AGENT, target_url)


def _fetch(url: str) -> str | None:
    try:
        resp = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=REQUEST_TIMEOUT)
        resp.raise_for_status()
        return resp.text
    except requests.RequestException:
        return None


def _extract_text(html: str) -> str:
    soup = BeautifulSoup(html, "lxml")
    for tag in soup(["script", "style", "nav", "footer", "noscript"]):
        tag.decompose()
    text = soup.get_text(separator=" ", strip=True)
    return " ".join(text.split())


def _find_priority_links(html: str, base_url: str) -> list[str]:
    soup = BeautifulSoup(html, "lxml")
    base_domain = urlparse(base_url).netloc
    candidates: list[str] = []
    for a in soup.find_all("a", href=True):
        href = urljoin(base_url, a["href"])
        parsed = urlparse(href)
        if parsed.netloc != base_domain:
            continue
        if any(kw in href.lower() for kw in PRIORITY_LINK_KEYWORDS):
            candidates.append(href.split("#")[0])
    # de-dupe, preserve order
    seen = set()
    unique = []
    for c in candidates:
        if c not in seen:
            seen.add(c)
            unique.append(c)
    return unique


def scrape_company_site(url: str) -> ScrapeResult:
    result = ScrapeResult()

    if not _robots_allows(url, url):
        result.errors.append(f"robots.txt disallows scraping {url}")
        return result

    homepage_html = _fetch(url)
    if homepage_html is None:
        result.errors.append(f"Failed to fetch {url}")
        return result

    result.pages.append(ScrapedPage(url=url, text=_extract_text(homepage_html)))

    for link in _find_priority_links(homepage_html, url):
        if len(result.pages) >= MAX_PAGES_PER_LEAD:
            break
        if not _robots_allows(url, link):
            result.errors.append(f"robots.txt disallows {link}")
            continue
        page_html = _fetch(link)
        if page_html is None:
            result.errors.append(f"Failed to fetch {link}")
            continue
        result.pages.append(ScrapedPage(url=link, text=_extract_text(page_html)))

    return result
