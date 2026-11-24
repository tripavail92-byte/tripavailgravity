"""Duplicate detection and change detection between scans.

Operators repost the same trip every few days, often with the same poster. Two signals:
an identical poster image (byte hash), or the same destinations + duration with overlapping
departures / a near-identical title. The newest, most complete post wins and absorbs the
others' departure dates.
"""
from __future__ import annotations

from datetime import date
from difflib import SequenceMatcher


def _norm(s: str | None) -> str:
    return " ".join((s or "").lower().split())


def _title_similarity(a: str | None, b: str | None) -> float:
    return SequenceMatcher(None, _norm(a), _norm(b)).ratio()


def _completeness(trip: dict) -> int:
    f = trip.get("facts") or {}  # None when the post couldn't be read; it goes to review as-is
    return (
        (2 if f.get("price_amount") else 0)
        + len(f.get("departure_dates") or [])
        + (1 if f.get("itinerary_as_posted") else 0)
        + len(trip.get("media") or [])
    )


def is_duplicate(a: dict, b: dict) -> bool:
    if set(a.get("image_hashes") or []) & set(b.get("image_hashes") or []):
        return True
    fa, fb = a.get("facts"), b.get("facts")
    if not fa or not fb:
        return False  # an unread post can't be matched on facts; shared photos were checked above
    same_route = {_norm(d) for d in fa.get("destinations") or []} == {_norm(d) for d in fb.get("destinations") or []}
    same_length = fa.get("duration_days") == fb.get("duration_days")
    if not (same_route and same_length):
        return False
    dates_overlap = bool(set(a.get("upcoming") or []) & set(b.get("upcoming") or []))
    return dates_overlap or _title_similarity(fa.get("title_as_posted"), fb.get("title_as_posted")) >= 0.6


def collapse_duplicates(trips: list[dict]) -> tuple[list[dict], list[dict]]:
    """Returns (kept, dropped). Kept trips absorb departures from their duplicates."""
    kept: list[dict] = []
    dropped: list[dict] = []
    for trip in sorted(trips, key=_completeness, reverse=True):
        twin = next((k for k in kept if is_duplicate(k, trip)), None)
        if twin is None:
            kept.append(trip)
            continue
        twin["upcoming"] = sorted(set(twin.get("upcoming") or []) | set(trip.get("upcoming") or []))
        twin.setdefault("duplicate_of_posts", []).append(trip.get("post_url"))
        dropped.append({**trip, "duplicate_of": twin.get("post_url")})
    return kept, dropped


def diff_scans(previous: list[dict], current: list[dict], today: date) -> list[dict]:
    """What changed since the last scan of the same operators: new trips, price changes,
    cancellations, new or dropped departures. Matching is by post URL, then by duplicate rules."""
    changes: list[dict] = []
    prev_by_url = {t.get("post_url"): t for t in previous if t.get("post_url")}
    for cur in current:
        old = prev_by_url.get(cur.get("post_url")) or next((p for p in previous if is_duplicate(p, cur)), None)
        if old is None:
            changes.append({"type": "new_trip", "post_url": cur.get("post_url"),
                            "title": cur.get("listing_title") or (cur.get("facts") or {}).get("title_as_posted")})
            continue
        fo, fc = old.get("facts") or {}, cur.get("facts") or {}
        if fo.get("price_amount") != fc.get("price_amount"):
            changes.append({"type": "price_changed", "post_url": cur.get("post_url"),
                            "from": fo.get("price_amount"), "to": fc.get("price_amount")})
        if fc.get("status") in ("cancelled", "postponed", "sold_out") and fo.get("status") != fc.get("status"):
            changes.append({"type": f"status_{fc['status']}", "post_url": cur.get("post_url")})
        added = sorted(set(cur.get("upcoming") or []) - set(old.get("upcoming") or []))
        if added:
            changes.append({"type": "departures_added", "post_url": cur.get("post_url"), "dates": added})
    current_urls = {c.get("post_url") for c in current}
    for old in previous:
        future = [d for d in old.get("upcoming") or [] if d >= today.isoformat()]
        if old.get("post_url") not in current_urls and future:
            changes.append({"type": "post_disappeared", "post_url": old.get("post_url"),
                            "note": "Post no longer on the page while departures were still upcoming - "
                                    "possible cancellation; hold for review"})
    return changes
