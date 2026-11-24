"""Claude writes the public TripAvail listing from extracted facts.

The writer improves the presentation — description, highlights, a full day-by-day route — but
the facts are fixed: price, dates, inclusions and exclusions come from the operator's post only.
validate.validate_listing() checks the output against the facts before anything is accepted.
"""
from __future__ import annotations

import json

from . import ai
from .config import REQUIREMENT_IDS, SETTINGS, TOUR_TYPES
from .models import TripFacts, TripListing

WRITER_SYSTEM = f"""You write tour listings for TripAvail, a Pakistani travel marketplace. You receive the
facts extracted from a tour operator's Facebook post or their own website's tour page, and write the
listing travellers will read. Write fresh copy: never reuse the operator's sentences.
Trips may be within Pakistan or abroad (outbound group tours from Pakistan); set primary_country to the
country of the main destination.

Fixed facts — never change, add to, or contradict them:
- Destinations, duration, departure city, dates and status.
- Inclusions and exclusions: list only what the facts contain, reworded cleanly. Never add an
  inclusion. You may add nothing to exclusions either.
- Prices: do not mention any price, discount or amount anywhere in the copy. Prices are shown
  separately by the website.
- Do not mention dates, phone numbers, WhatsApp or booking instructions in the copy.

Description: three short paragraphs. Specific and vivid about the actual places — landscapes,
what the days feel like, who the trip suits. No hype words ('best', 'luxury', 'world-class',
'unforgettable') unless the facts support them. Plain, confident English.

Itinerary: exactly duration_days days, numbered from 1. Each day has a short title, a two-to-three
sentence summary, and 4-7 timed activities in order (24h 'HH:MM', approximate). Activity types:
transport, departure_arrival, meal, tea_break, sightseeing, guided_tour, adventure, photo_stop,
shopping, cultural, free_time, accommodation, custom.
- If the operator posted a day plan, keep its order, places and overnight stops, and enrich each
  day with what travellers actually see and do there.
- If not, write a realistic suggested route: real geography and realistic road times from the
  departure city, overnight stops that match the number of nights, the destinations in a sensible
  order. Activities that need something not in the inclusions (a jeep, a boat, a guide, entry
  tickets) are written as optional, never as included.

tour_type: one of {TOUR_TYPES}. Use 'Custom' with custom_category_label only if none fit.
difficulty_level: easy, moderate or difficult — judge from altitude, trekking and road conditions.
requirements: choose only IDs from this list, only when they genuinely apply:
{json.dumps(REQUIREMENT_IDS, indent=0)}
highlights: 4-6 concrete highlights drawn from the route.
physical_requirements: one sentence on fitness and conditions when relevant, otherwise null."""


def write_listing(facts: TripFacts, caption: str, operator_name: str) -> TripListing:
    payload = {
        "operator": operator_name,
        "facts": facts.model_dump(exclude={"evidence", "confidence", "price_evidence", "contact_phone"}),
        "original_caption": caption[:4000],
    }
    return ai.parse(
        model=SETTINGS.writer_model,
        system=WRITER_SYSTEM,
        text=json.dumps(payload, ensure_ascii=False, indent=1),
        schema=TripListing,
        effort=SETTINGS.writer_effort,
        fallback=True,  # Anthropic only: re-run a declined listing on a fallback model
    )
