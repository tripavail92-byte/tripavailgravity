"""Reads a page into an operator profile, and a post (caption + poster images) into trip facts."""
from __future__ import annotations

from datetime import date

from . import ai
from .ai import USAGE, ModelDeclined  # noqa: F401  (re-exported for the pipeline)
from .config import SETTINGS
from .models import PageProfile, TripFacts

PROFILE_SYSTEM = """You read the visible text of a business's {where} and return the business's profile.

Rules:
- Copy facts only from the text. If a field is not there, return null. Never guess.
- Follower counts: '5.2K followers' -> 5200, '1.1M' -> 1100000. Same for likes.
- facebook_rating: only when the page shows a recommendation or review line, such as
  '92% recommend (143 Reviews)'. 'Not yet rated' means null.
- operator_kind: 'tour_operator' when the page sells trips it runs itself; 'travel_agency' when it
  mainly books tickets, visas or hotels; otherwise the closest value.
- The page may mix English, Urdu and Roman Urdu.
- Websites have no followers, likes or Facebook rating: return null for those."""

POST_INTRO = {
    "facebook": """You read one Facebook post from a Pakistani tour operator — the caption plus any images,
which are often a poster with the trip details printed on it — and extract the trip it advertises.""",
    "website": """You read one tour page from a Pakistani tour operator's own website — the page text plus
photos — and extract the trip it sells. In this case "the caption" means the page text.
- The page describes ONE main trip. Ignore other tours shown as related tours, sidebars, menus,
  footers or "you may also like" lists; never mix their prices or dates into this trip.
- Fixed-departure tables and date pickers on the page count as departure dates. Pages with no dates
  that take bookings on request are 'on_request'.
- Prices may be in PKR and also in USD for foreign travellers: take the PKR per-person price when it
  is shown, otherwise the price as shown with its currency.""",
}

POST_SYSTEM = """{intro}

Today's date is {today}. Resolve dates written without a year to the next occurrence on or after today.

Rules:
- Extract only what the caption or the images actually say. Never estimate or fill in a price, date,
  duration, inclusion or exclusion. A missing fact stays null or empty.
- price_amount: the per-person base price exactly as shown. When several sharing options are listed,
  put each in price_variants and the lowest per-person option in price_amount. When no price appears
  anywhere, price_amount is null and price_found_in is 'none'.
- price_evidence: copy the exact words and numbers where the price appears, including its currency
  symbol (Rs, $, €) and who it covers.
- price_basis: who the price covers, in the operator's words: 'per person', 'For 02 Persons',
  'for two adults', 'per couple'. A total for several people is NOT per person — say so here.
- Look everywhere for the price: price tables, 'Dates & Prices', 'Starting from', booking boxes,
  sidebars of the same tour. Only when none appears for THIS tour is it null.
- meeting_point: only when the operator names a specific pickup or meeting place ('we gather at I-8
  Markaz', 'pickup from Faizabad'). A departure city on its own ('from Islamabad'), 'hotel pickup' with
  no place, or 'pickup on request' is NOT a meeting point — leave it null. Never guess one.
- Recurring trips ('every Friday', 'har Jumma') go in recurrence, weekdays 0=Monday ... 6=Sunday.
- '3 Days 2 Nights' -> duration_days 3, duration_nights 2. A day trip is 1 day.
- status is 'cancelled', 'postponed', 'sold_out' or 'few_seats_left' only when the post says so.
- Memories of past trips, reviews, greetings, giveaways and general promotions with no specific trip
  are not_a_trip.
- Text may be English, Urdu or Roman Urdu; write the extracted fields in English.
- evidence: up to 5 short quotes backing the key fields.
- confidence: low when the post is ambiguous or the poster is hard to read."""


WHERE = {"facebook": "Facebook business page", "website": "own website (home and about pages)"}


def read_profile(page_text: str, page_url: str, source: str = "facebook") -> PageProfile:
    return ai.parse(
        model=SETTINGS.reader_model,
        system=PROFILE_SYSTEM.format(where=WHERE.get(source, WHERE["facebook"])),
        text=f"Page URL: {page_url}\n\nVisible page text:\n{page_text[:12000]}",
        schema=PageProfile,
        effort="low",
        max_tokens=8000,
    )


def read_post(caption: str, images: list[bytes], operator_name: str, today: date,
              source: str = "facebook", effort: str | None = None) -> TripFacts:
    return ai.parse(
        model=SETTINGS.reader_model,
        system=POST_SYSTEM.format(intro=POST_INTRO.get(source, POST_INTRO["facebook"]), today=today.isoformat()),
        text=f"Operator: {operator_name}\n\nPost caption:\n{caption or '(no caption)'}",
        schema=TripFacts,
        images=images,
        effort=effort or SETTINGS.reader_effort,
    )
