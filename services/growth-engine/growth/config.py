from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")


def _provider() -> str:
    chosen = os.getenv("GROWTH_AI_PROVIDER", "").strip().lower()
    if chosen in ("openai", "anthropic"):
        return chosen
    if os.getenv("OPENAI_API_KEY") and not os.getenv("ANTHROPIC_API_KEY"):
        return "openai"
    return "anthropic"


AI_PROVIDER = _provider()
# (reader, writer). OpenAI runs both on the small model at low effort — the owner's call (Nov 25 2026)
# to cut cost: the facts that matter (price, dates, pickup) are checked deterministically in
# validate.py anyway. Override with GROWTH_READER_MODEL / GROWTH_WRITER_MODEL / GROWTH_*_EFFORT.
DEFAULT_MODELS = {
    "anthropic": ("claude-haiku-5-5", "claude-opus-5-5"),
    "openai": ("gpt-5-mini", "gpt-5-mini"),
}


@dataclass(frozen=True)
class Settings:
    ai_provider: str = AI_PROVIDER
    reader_model: str = os.getenv("GROWTH_READER_MODEL") or DEFAULT_MODELS[AI_PROVIDER][0]
    writer_model: str = os.getenv("GROWTH_WRITER_MODEL") or DEFAULT_MODELS[AI_PROVIDER][1]
    writer_effort: str = os.getenv("GROWTH_WRITER_EFFORT", "low" if AI_PROVIDER == "openai" else "medium")
    reader_effort: str = os.getenv("GROWTH_READER_EFFORT", "low" if AI_PROVIDER == "openai" else "medium")

    session_dir: Path = ROOT / "session" / "facebook"
    out_dir: Path = ROOT / "out"

    # An operator counts as active only with a trip post on or after this date; older posts are
    # never sent to the AI.
    active_since: str = os.getenv("GROWTH_ACTIVE_SINCE", "2026-08-01")

    # The follower band is reported but only filters when GROWTH_ENFORCE_FOLLOWERS=1: the brief
    # is any company actively posting trips.
    enforce_followers: bool = os.getenv("GROWTH_ENFORCE_FOLLOWERS", "0") == "1"
    followers_min: int = int(os.getenv("GROWTH_FOLLOWERS_MIN", "500"))
    followers_max: int = int(os.getenv("GROWTH_FOLLOWERS_MAX", "10000"))
    posts_per_page: int = int(os.getenv("GROWTH_POSTS_PER_PAGE", "15"))
    max_images_per_post: int = 4
    min_image_side_px: int = 400

    # Human pace between pages, so the scraping account doesn't look like a bot.
    page_delay_s: tuple[int, int] = field(default=(20, 45))
    headless: bool = os.getenv("GROWTH_HEADLESS", "0") == "1"
    # The installed, signed Chrome (or 'msedge'). Windows' app control blocks Playwright's own
    # unsigned Chromium on this machine; a real branded browser also looks ordinary to Facebook.
    browser_channel: str = os.getenv("GROWTH_BROWSER", "chrome")

    # Decision thresholds for the publish gate (validate.py).
    publish_min_confidence: float = 0.75
    review_min_confidence: float = 0.5


SETTINGS = Settings()

# Vocabulary the TripAvail wizard uses — generated listings must stay inside it.
TOUR_TYPES = ["Adventure", "Nature", "Cultural", "Family", "Historical", "Custom"]
DIFFICULTY_LEVELS = ["easy", "moderate", "difficult"]
REQUIREMENT_IDS = {
    "req_fitness_moderate": "Moderate fitness level",
    "req_altitude": "High-altitude tolerance",
    "req_no_heart": "No heart/respiratory conditions",
    "req_not_pregnant": "Not recommended for pregnant travelers",
    "req_mobility": "Not suitable for mobility impairments",
    "req_walk_5km": "Able to walk 5+ km",
    "req_gear_boots": "Hiking boots required",
    "req_gear_swimwear": "Swimwear required",
    "req_gear_helmet": "Helmet provided on-site",
    "req_gear_warm_clothing": "Warm clothing required",
    "req_gear_rain": "Rain protection required",
    "req_gear_medication": "Personal medication required",
    "req_doc_passport": "Valid passport required",
    "req_doc_visa": "Visa required",
    "req_doc_id": "National ID required",
    "req_doc_insurance": "Travel insurance mandatory",
    "req_doc_age": "Age verification required",
    "req_safe_no_pets": "No pets allowed",
    "req_safe_no_bags": "No large luggage",
    "req_safe_no_alcohol": "No alcohol consumption allowed",
    "req_safe_waiver": "Safety waiver required",
    "req_safe_weather": "Weather-dependent activity",
    "req_cond_early": "Early morning departure",
    "req_cond_overnight": "Overnight stay included",
    "req_cond_shared": "Shared accommodation",
    "req_cond_boat": "Boat transfer involved",
    "req_cond_offroad": "Off-road travel involved",
    "req_cond_remote": "Remote area (limited signal)",
}
