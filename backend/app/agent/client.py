import os
import time

from google import genai

GENERATION_MODEL = "gemini-3.6-flash"
FALLBACK_MODELS = ["gemini-2.5-flash", "gemini-flash-latest"]
RETRY_DELAYS = [2, 5]

_client: genai.Client | None = None


def get_client() -> genai.Client:
    global _client
    if _client is None:
        _client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
    return _client


def _is_transient(exc: Exception) -> bool:
    code = getattr(exc, "code", None)
    if code in (429, 500, 503, 504):
        return True
    text = str(exc)
    return any(m in text for m in ("503", "UNAVAILABLE", "429", "RESOURCE_EXHAUSTED", "high demand", "overloaded"))


def _is_model_missing(exc: Exception) -> bool:
    text = str(exc)
    return getattr(exc, "code", None) == 404 or "NOT_FOUND" in text or "404" in text


def generate_with_fallback(contents, config=None):
    client = get_client()
    last_exc: Exception | None = None
    for model in [GENERATION_MODEL] + FALLBACK_MODELS:
        for attempt in range(len(RETRY_DELAYS) + 1):
            try:
                return client.models.generate_content(model=model, contents=contents, config=config)
            except Exception as exc:
                last_exc = exc
                if _is_model_missing(exc):
                    break
                if not _is_transient(exc):
                    raise
                if attempt < len(RETRY_DELAYS):
                    time.sleep(RETRY_DELAYS[attempt])
    raise last_exc