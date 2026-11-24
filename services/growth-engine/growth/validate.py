"""Deterministic checks that sit beside Claude's confidence score.

Claude's confidence says how sure the model is; these rules say whether the facts hold up on
their own — dates in the future, a price that actually appears in the caption, an itinerary as
long as the trip. A listing goes live only when both agree.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from datetime import date, timedelta
from typing import Literal

from .config import REQUIREMENT_IDS, SETTINGS
from .models import TripFacts, TripListing

Decision = Literal["publish_ready", "review", "reject"]

PRICE_MIN_PKR = 1_000
PRICE_MAX_PKR = 2_000_000
PER_DAY_MIN_PKR = 800
MAX_DAYS_AHEAD = 540
MAX_DURATION_DAYS = 30


@dataclass
class Check:
    name: str
    ok: bool
    severity: Literal["hard", "soft"]
    detail: str = ""


@dataclass
class ValidationReport:
    decision: Decision
    checks: list[Check] = field(default_factory=list)
    reasons: list[str] = field(default_factory=list)

    def as_dict(self) -> dict:
        return {
            "decision": self.decision,
            "reasons": self.reasons,
            "checks": [c.__dict__ for c in self.checks],
        }


def _digits(s: str) -> str:
    return re.sub(r"\D", "", s or "")


def normalise_pk_phone(raw: str | None) -> str | None:
    """'0300-1234567' / '+92 300 1234567' / '923001234567' -> '+923001234567'."""
    d = _digits(raw or "")
    if d.startswith("0092"):
        d = d[4:]
    elif d.startswith("92"):
        d = d[2:]
    elif d.startswith("0"):
        d = d[1:]
    if re.fullmatch(r"3\d{9}", d):
        return "+92" + d
    if re.fullmatch(r"[2-9]\d{8,9}", d):  # landline with area code
        return "+92" + d
    return None


def _parse_iso(s: str) -> date | None:
    try:
        return date.fromisoformat(s)
    except (TypeError, ValueError):
        return None


def expand_recurrence(weekdays: list[int], today: date, horizon_days: int = 60,
                      starts_on: date | None = None, ends_on: date | None = None) -> list[date]:
    """'Every Friday' -> the concrete Fridays in the next `horizon_days`."""
    start = max(today, starts_on or today)
    end = min(today + timedelta(days=horizon_days), ends_on or date.max)
    out, d = [], start
    while d <= end:
        if d.weekday() in weekdays:
            out.append(d)
        d += timedelta(days=1)
    return out


def upcoming_departures(facts: TripFacts, today: date) -> list[date]:
    dated = sorted({d for d in (_parse_iso(x) for x in facts.departure_dates) if d and d >= today})
    if facts.recurrence and facts.recurrence.weekdays:
        dated = sorted(set(dated) | set(expand_recurrence(
            facts.recurrence.weekdays, today,
            starts_on=_parse_iso(facts.recurrence.starts_on or ""),
            ends_on=_parse_iso(facts.recurrence.ends_on or ""),
        )))
    return dated


def validate_facts(facts: TripFacts, caption: str, usable_images: int, today: date) -> ValidationReport:
    checks: list[Check] = []

    def add(name: str, ok: bool, severity: Literal["hard", "soft"], detail: str = "") -> None:
        checks.append(Check(name, ok, severity, detail))

    is_trip = facts.is_trip and facts.trip_kind != "not_a_trip"
    add("is_a_trip", is_trip, "hard", facts.trip_kind)
    if not is_trip:
        return ValidationReport("reject", checks, ["Not a trip post"])

    if facts.status == "cancelled":
        add("not_cancelled", False, "hard", "Post says the trip is cancelled")
        return ValidationReport("reject", checks, ["Trip cancelled"])
    add("not_cancelled", True, "hard")
    add("not_postponed", facts.status != "postponed", "soft", facts.status)
    add("not_sold_out", facts.status != "sold_out", "soft", facts.status)

    add("has_destination", bool(facts.destinations), "hard", ", ".join(facts.destinations))

    dur_ok = facts.duration_days is not None and 1 <= facts.duration_days <= MAX_DURATION_DAYS
    add("duration_known", dur_ok, "hard", str(facts.duration_days))

    # Dates: every stated date must parse; at least one departure must be bookable.
    stated = [(_parse_iso(s), s) for s in facts.departure_dates]
    bad = [raw for parsed, raw in stated if parsed is None]
    add("dates_parse", not bad, "hard", ", ".join(bad))
    upcoming = upcoming_departures(facts, today)
    too_far = [d for d in upcoming if d > today + timedelta(days=MAX_DAYS_AHEAD)]
    add("dates_not_absurd", not too_far, "hard", ", ".join(map(str, too_far)))
    if facts.trip_kind in ("scheduled_departure", "recurring_departure"):
        if stated and not upcoming:
            add("has_upcoming_departure", False, "hard", "All stated dates are in the past")
            return ValidationReport("reject", checks, ["Every departure has already left"])
        add("has_upcoming_departure", bool(upcoming), "hard",
            ", ".join(map(str, upcoming[:5])) or "no dates stated")
    else:  # on_request: no dates is legitimate
        add("has_upcoming_departure", True, "soft", "On request")

    # Price: never invented. If it came from the caption, the digits must be in the caption.
    if facts.price_amount is not None:
        amount = facts.price_amount
        cur = (facts.price_currency or "PKR").upper()
        if cur in ("PKR", "RS", "RS.", "RUPEES"):
            add("price_plausible", PRICE_MIN_PKR <= amount <= PRICE_MAX_PKR, "hard", f"{amount:,.0f} PKR")
            if dur_ok:
                per_day = amount / facts.duration_days
                add("price_per_day_plausible", per_day >= PER_DAY_MIN_PKR, "soft", f"{per_day:,.0f}/day")
        price_digits = str(int(amount))
        if facts.price_found_in in ("caption", "both"):
            in_caption = price_digits in _digits(caption) or price_digits[:-3] + "k" in caption.lower().replace(" ", "")
            add("price_in_caption", in_caption, "hard", price_digits)
        elif facts.price_found_in == "image":
            # Can't string-match a poster; require the model to quote it and be confident.
            quoted = price_digits in _digits(facts.price_evidence or "")
            add("price_quoted_from_poster", quoted, "hard", facts.price_evidence or "")
            add("poster_price_confident", facts.confidence >= 0.8, "soft", f"{facts.confidence:.2f}")
        else:
            add("price_has_source", False, "hard", "price given but price_found_in='none'")
    else:
        add("price_on_request", True, "soft", "No price shown - listing says 'Ask for price'")

    add("has_usable_image", usable_images >= 1, "hard", f"{usable_images} usable")
    add("has_evidence", bool(facts.evidence), "soft")
    add("has_title", bool(facts.title_as_posted), "soft")

    return _decide(checks, facts.confidence)


def validate_listing(listing: TripListing, facts: TripFacts) -> list[Check]:
    """Checks on what Claude wrote, so the copy can't drift from the facts."""
    checks: list[Check] = []

    if facts.duration_days:
        checks.append(Check("itinerary_length_matches", len(listing.itinerary) == facts.duration_days,
                            "hard", f"{len(listing.itinerary)} days vs {facts.duration_days}"))
        days = [d.day for d in listing.itinerary]
        checks.append(Check("itinerary_days_sequential", days == list(range(1, len(days) + 1)), "hard",
                            str(days)))

    # No money in the copy except the real price. Catches a model "helpfully" quoting a price.
    allowed = {str(int(facts.price_amount))} if facts.price_amount else set()
    allowed |= {str(int(v.amount)) for v in facts.price_variants}
    text = " ".join([listing.description, listing.short_description, *listing.highlights,
                     *(f"{d.title} {d.summary}" for d in listing.itinerary),
                     *(f"{a.title} {a.description}" for d in listing.itinerary for a in d.activities)])
    money = re.findall(r"(?:PKR|Rs\.?|Rupees|USD|\$)\s*(\d[\d,]*)", text, flags=re.I)  # "USD," is not a price
    rogue = sorted({_digits(m) for m in money} - allowed)
    checks.append(Check("no_invented_prices", not rogue, "hard", ", ".join(rogue)))

    unknown_reqs = [r for r in listing.requirements if r not in REQUIREMENT_IDS]
    checks.append(Check("requirements_known", not unknown_reqs, "soft", ", ".join(unknown_reqs)))

    checks.append(Check("title_length", len(listing.title) <= 70, "soft", str(len(listing.title))))
    checks.append(Check("highlights_count", 3 <= len(listing.highlights) <= 8, "soft",
                        str(len(listing.highlights))))
    return checks


def _decide(checks: list[Check], confidence: float) -> ValidationReport:
    hard_fail = [c for c in checks if c.severity == "hard" and not c.ok]
    soft_fail = [c for c in checks if c.severity == "soft" and not c.ok]
    reasons = [f"{c.name}: {c.detail}".strip(": ") for c in hard_fail + soft_fail]
    if hard_fail:
        return ValidationReport("review", checks, reasons)
    if confidence < SETTINGS.review_min_confidence:
        return ValidationReport("review", checks, reasons + [f"low confidence {confidence:.2f}"])
    if confidence < SETTINGS.publish_min_confidence or len(soft_fail) >= 2:
        return ValidationReport("review", checks, reasons)
    return ValidationReport("publish_ready", checks, reasons)


def merge_listing_checks(report: ValidationReport, extra: list[Check], confidence: float) -> ValidationReport:
    if report.decision == "reject":
        return report
    return _decide(report.checks + extra, confidence)
