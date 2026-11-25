"""Process a crawl: raw pages -> operator profiles, validated trips, written listings.

Runs entirely on files in the run folder, so it can be re-run after a prompt change without
visiting Facebook again. Nothing here touches the TripAvail database.
"""
from __future__ import annotations

import json
import re
import uuid
from concurrent.futures import ThreadPoolExecutor
from datetime import date
from pathlib import Path

from . import media
from .config import REQUIREMENT_IDS, SETTINGS
from .dedupe import collapse_duplicates, diff_scans
from .geocode import pickup_locations
from .models import PageProfile, RawPage, RawPost, TripFacts, TripListing
from .ai import USAGE, ModelDeclined, is_fatal
from .reader import read_post, read_profile

WORKERS = 6  # posts read / listings written in parallel per operator
OPERATOR_WORKERS = 3  # operators processed at once
from .validate import (
    ValidationReport,
    merge_listing_checks,
    normalise_pk_phone,
    upcoming_departures,
    validate_facts,
    validate_listing,
)
from .writer import write_listing

OPERATOR_KINDS = {"tour_operator", "travel_agency"}
CREDIT_WHERE = {"facebook": "on Facebook", "website": "on their website"}


def _credit(name: str, source: str) -> str:
    return f"Photo: {name} {CREDIT_WHERE.get(source, '')}".strip()


def _social_proof(profile: PageProfile) -> dict | None:
    r = profile.facebook_rating
    if not r or (r.recommend_percent is None and r.review_count is None):
        return None
    parts = []
    if r.recommend_percent is not None:
        parts.append(f"{r.recommend_percent}% recommend")
    if r.review_count is not None:
        parts.append(f"{r.review_count} reviews")
    return {
        "source": "facebook",
        "recommend_percent": r.recommend_percent,
        "review_count": r.review_count,
        # Shown with attribution, never converted into TripAvail star ratings.
        "label": " · ".join(parts) + " on Facebook",
    }


def _duration_label(days: int, nights: int | None) -> str:
    if days == 1:
        return "Day trip"
    n = nights if nights is not None else days - 1
    return f"{days} days / {n} night{'' if n == 1 else 's'}"


_GROUP = re.compile(
    r"\b(?:for|per)\s*(0?\d|two|three|four|five|six)\s*(?:persons?|people|adults|pax|travell?ers|guests)\b"
    r"|\b(?:price|total)\s+for\s+(0?\d|two)\b|\bper\s+couple\b|\bfor\s+(?:a|the|one)\s+couple\b"
    r"|\bcouple\s*\((?:total|price)", re.I)
_NUM = {"two": 2, "three": 3, "four": 4, "five": 5, "six": 6}


def group_size(text: str | None) -> int:
    """How many people a quoted amount covers, from the operator's own words ('For 02 Persons',
    'for two adults', 'per couple'). 1 when it doesn't say — the amount is taken as per person."""
    m = _GROUP.search(text or "")
    if not m:
        return 1
    word = next((g for g in m.groups() if g), None)
    if word is None:  # per couple / for a couple
        return 2
    n = _NUM.get(word.lower()) or int(word)
    return n if 1 <= n <= 20 else 1


SHOWS_MONEY = re.compile(r"(?:PKR|PRK|Rs\.?|₨|€|\$|USD|US\$|EUR)\s?\d[\d,]{2,}|\d[\d,]{3,}\s?(?:PKR|USD|/-)")


def per_person(amount: float | None, basis: str | None = None, evidence: str | None = None) -> float | None:
    """TripAvail shows every price per person, so a total for N people is divided by N. The stated
    basis decides ('per person' stays as is); the quoted evidence is used only when no basis is
    given, since it can mention other prices on the page ('couple: Rs 57,000')."""
    if not amount:
        return amount
    if basis and basis.strip():
        n = 1 if re.search(r"\bper\s+(?:person|head|pax|adult)\b|\bpp\b", basis, re.I) else group_size(basis)
    else:
        n = group_size(evidence)
    return round(amount / n, 2)


def price_currency(facts: TripFacts) -> str | None:
    """The currency the operator shows next to the price: a '€' or '$' in the quoted text wins over
    a model's guess (a page showing '€2,730' was once stored as USD). None when the page never says
    which currency — a bare '1180' for 'International Tourists' must not be shown as PKR 1,180."""
    ev = facts.price_evidence or ""
    # Several currencies quoted ('US$2,290 €2,020'): take the one written next to THIS amount.
    if facts.price_amount:
        n = int(facts.price_amount)
        num = rf"(?:{n:,}|{n})(?![\d,])"
        near = re.search(rf"(US\$|USD|\$|€|EUR|£|GBP|PKR|PRK|Rs\.?|₨)\s?{num}|{num}\s?(USD|EUR|PKR|€|\$)", ev)
        if near:
            sym = (near.group(1) or near.group(2) or "").upper()
            if sym in ("€", "EUR"):
                return "EUR"
            if sym in ("£", "GBP"):
                return "GBP"
            if sym in ("US$", "USD", "$"):
                return "USD"
            return "PKR"
    if "€" in ev or re.search(r"\bEUR\b", ev):
        return "EUR"
    if "£" in ev or re.search(r"\bGBP\b", ev):
        return "GBP"
    if re.search(r"US\$|\bUSD\b|\$\s?\d", ev):
        return "USD"
    if re.search(r"\b(?:PKR|PRK|Rs\.?)|₨", ev, re.I):
        return "PKR"
    if not facts.price_currency:
        return None
    return facts.price_currency.upper().replace("RS.", "PKR").replace("RS", "PKR")


def _accommodation_pricing(facts: TripFacts) -> dict:
    """Map 'Quad / Triple / Double' price variants onto TripAvail's room-sharing tiers, per person
    ('Double Sharing (Price for 2 adults) Rs 104,000' is 52,000 each)."""
    words = {"quad": "quad", "triple": "triple", "double": "double", "twin": "double",
             "couple": "double", "single": "solo", "solo": "solo"}
    tiers: list[dict] = []
    for v in facts.price_variants:
        key = next((k for w, k in words.items() if w in v.label.lower()), None)
        if key and all(t["key"] != key for t in tiers):
            # "Couple: PKR 80,000" is the price for the two of them.
            n_basis = v.label if not re.search(r"\bcouple\b", v.label, re.I) or \
                re.search(r"per\s+person", v.label, re.I) else "per couple"
            tiers.append({"key": key, "label": v.label, "pricePerPerson": per_person(v.amount, n_basis)})
    return {"enabled": True, "tiers": tiers} if len(tiers) >= 2 else {}


def _tour_record(facts: TripFacts, listing: TripListing, item: dict) -> dict:
    """The trip in the shape of TripAvail's `tours` table (plus provenance fields)."""
    return {
        "title": listing.title,
        "tour_type": listing.tour_type,
        "custom_category_label": listing.custom_category_label,
        "location": {"city": listing.primary_city, "country": listing.primary_country},
        "destination_cities": listing.destination_cities,
        "duration": _duration_label(facts.duration_days, facts.duration_nights),
        "duration_days": facts.duration_days,
        # No stated currency means no price we can show honestly: it becomes "price on request".
        "price": (per_person(facts.price_amount, facts.price_basis, facts.price_evidence) or 0)
        if price_currency(facts) else 0,
        "currency": price_currency(facts) or "PKR",
        "price_on_request": facts.price_amount is None or price_currency(facts) is None,
        "accommodation_pricing": _accommodation_pricing(facts),
        "short_description": listing.short_description,
        "description": listing.description,
        "highlights": listing.highlights,
        "inclusions": listing.inclusions,
        "exclusions": listing.exclusions,
        "itinerary": [
            {
                "day": d.day,
                "title": d.title,
                "activities": [
                    {"id": str(uuid.uuid4()), "type": a.type, "title": a.title,
                     "time": a.time, "description": a.description}
                    for a in d.activities
                ],
            }
            for d in listing.itinerary
        ],
        "itinerary_source": "operator_enhanced" if facts.itinerary_as_posted else "suggested",
        "difficulty_level": listing.difficulty_level,
        "requirements": [r for r in listing.requirements if r in REQUIREMENT_IDS],
        "physical_requirements": listing.physical_requirements,
        "departures": item["upcoming"],
        # Only a meeting point the operator names, found on the map; otherwise none (never guessed).
        "pickup_locations": pickup_locations(facts, item.get("caption") or "", listing.primary_country),
        "images": [m["stored_path"] for m in item["media"]],
        # Not stated by the operator, so the listing shows "Confirm with the operator".
        "cancellation_policy": None,
        "languages": [],
        "booking_mode": "whatsapp",
        "source": item.get("source", "facebook"),
        "source_url": item.get("post_url"),
        "source_posted_at": item.get("posted_at"),
        "status_signal": facts.status,
        # Shown on every unclaimed listing; {claim_url} becomes TripAvail's claim page for the operator.
        "operator_note": ("Prices and dates are set by the operator. Tour operators: claim your listing "
                          "({claim_url}) to edit details or write to us at contact@tripavail.com"),
    }


def _process_operator(raw: RawPage, media_dir: Path) -> dict:
    profile = read_profile(raw.page_text, raw.page_url, raw.source)
    followers = profile.follower_count
    in_range = followers is not None and SETTINGS.followers_min <= followers <= SETTINGS.followers_max
    is_operator = profile.operator_kind in OPERATOR_KINDS
    reason = None
    if not is_operator:
        reason = f"Not a tour operator ({profile.operator_kind})"
    elif SETTINGS.enforce_followers and followers is None:
        reason = "Follower count not visible"
    elif SETTINGS.enforce_followers and not in_range:
        reason = f"{followers:,} followers is outside {SETTINGS.followers_min:,}-{SETTINGS.followers_max:,}"
    band = "unknown" if followers is None else ("small" if followers < SETTINGS.followers_min
                                                else "sme" if followers <= SETTINGS.followers_max else "large")

    attribution = _credit(profile.display_name, raw.source)
    logo = cover = None
    if raw.profile_image_url and (data := media.fetch(raw.profile_image_url)):
        logo = media.store(data, raw.profile_image_url, media_dir, attribution)
    if raw.cover_image_url and (data := media.fetch(raw.cover_image_url)):
        cover = media.store(data, raw.cover_image_url, media_dir, attribution)

    phone = normalise_pk_phone(profile.whatsapp) or normalise_pk_phone(profile.phone)
    return {
        "handle": raw.handle,
        "page_url": raw.page_url,
        "source": raw.source,
        "name": profile.display_name,
        "category": profile.category,
        "bio": profile.bio,
        "followers": followers,
        "follower_band": band,
        "likes": profile.like_count,
        "phone_as_shown": profile.phone,
        "phone_e164": phone,
        "email": profile.email,
        "website": profile.website or (raw.page_url if raw.source == "website" else None),
        "address": profile.address,
        "city": profile.city,
        "operator_kind": profile.operator_kind,
        "social_proof": _social_proof(profile),
        "logo": logo.model_dump() if logo else None,
        "cover": cover.model_dump() if cover else None,
        "listing_status": "unverified_unclaimed",
        "eligible": reason is None,
        "ineligible_reason": reason,
        "profile_confidence": profile.confidence,
        # The row this becomes in TripAvail's tour_operator_profiles (on a placeholder account).
        "tour_operator_profile": {
            "business_name": profile.display_name,
            "company_name": profile.display_name,
            "description": profile.bio,
            "phone_number": phone,
            "primary_city": profile.city,
            "profile_picture_url": logo.stored_path if logo else None,
            "company_logo_url": logo.stored_path if logo else None,
            "country_code": "PK",
            "is_public": True,
            "setup_completed": False,
        },
    }


def _process_post(post: RawPost, operator: dict, media_dir: Path, today: date) -> dict:
    images: list[bytes] = []
    assets = []
    attribution = _credit(operator["name"], post.source)
    for url in post.image_urls[: SETTINGS.max_images_per_post]:
        for cand in media.candidates(url):
            if (data := media.fetch(cand)) and (asset := media.store(data, cand, media_dir, attribution)):
                images.append(data)
                assets.append(asset)
                break

    base = {
        "source": post.source,
        "operator_handle": operator["handle"],
        "post_url": post.post_url,
        "posted_text": post.posted_text,
        "posted_at": post.posted_at,
        "caption": post.caption,
        "media": [a.model_dump() for a in assets],
        "image_hashes": [a.sha256 for a in assets],
    }
    try:
        facts = read_post(post.caption, images, operator["name"], today, post.source)
        # The small model at low effort sometimes misses a price that is plainly on the page. When
        # the page text shows money but no price came back, read that one page again more carefully.
        if facts.is_trip and facts.price_amount is None and SHOWS_MONEY.search(post.caption or ""):
            retry = read_post(post.caption, images, operator["name"], today, post.source, effort="medium")
            if retry.price_amount is not None:
                facts = retry
    except Exception as e:  # one unreadable post goes to review; it must not stop the run
        if is_fatal(e):
            raise
        return {**base, "decision": "review", "reasons": [f"could not read post: {type(e).__name__}: {e}"[:300]],
                "facts": None}

    report = validate_facts(facts, post.caption, sum(media.usable(a) for a in assets), today)
    return {
        **base,
        "facts": facts.model_dump(),
        "upcoming": [d.isoformat() for d in upcoming_departures(facts, today)],
        "decision": report.decision,
        "reasons": report.reasons,
        "_report": report,
    }


def _write(item: dict, operator: dict) -> None:
    facts = TripFacts.model_validate(item["facts"])
    report: ValidationReport = item.pop("_report")
    if not facts.duration_days or not facts.destinations:
        # Can't write an honest itinerary without a length and a place; a person fills these in.
        item.update(validation=report.as_dict())
        return
    try:
        listing = write_listing(facts, item["caption"], operator["name"])
    except Exception as e:
        if is_fatal(e):
            raise
        item.update(decision="review", reasons=report.reasons + [f"could not write listing: {e}"[:300]],
                    validation=report.as_dict())
        return
    final = merge_listing_checks(report, validate_listing(listing, facts, item["caption"]), facts.confidence)
    item.update(
        listing=listing.model_dump(),
        listing_title=listing.title,
        tour=_tour_record(facts, listing, item),
        decision=final.decision,
        reasons=final.reasons,
        validation=final.as_dict(),
    )


def _previous_trips(run_dir: Path, handles: set[str]) -> list[dict]:
    earlier = sorted(p for p in run_dir.parent.iterdir()
                     if p.is_dir() and p.name < run_dir.name and (p / "trips.json").exists())
    if not earlier:
        return []
    prev = json.loads((earlier[-1] / "trips.json").read_text(encoding="utf-8"))
    return [t for t in prev if t.get("operator_handle") in handles]


def process_run(run_dir: Path, today: date | None = None, log=print) -> dict:
    today = today or date.today()
    media_dir = run_dir / "media"
    operators: list[dict] = []
    trips: list[dict] = []
    not_trips: list[dict] = []
    rejected: list[dict] = []
    duplicates: list[dict] = []

    def one_operator(raw_file: Path) -> dict:
        # One operator's failure is logged and skipped; only fatal errors (bad key, no quota) stop the run.
        try:
            return _one_operator(raw_file)
        except Exception as e:  # noqa: BLE001
            if is_fatal(e):
                raise
            log(f"  [{raw_file.stem[:24]}] FAILED, skipped: {type(e).__name__}: {e}"[:300])
            return {"op": None, "trips": [], "not_trips": [], "rejected": [], "duplicates": [],
                    "failed": {"file": raw_file.name, "error": f"{type(e).__name__}: {e}"[:500]}}

    def _one_operator(raw_file: Path) -> dict:
        res: dict = {"op": None, "trips": [], "not_trips": [], "rejected": [], "duplicates": []}
        raw = RawPage.model_validate_json(raw_file.read_text(encoding="utf-8"))
        log(f"operator  {raw.handle}  ({len(raw.posts)} posts)")
        op = _process_operator(raw, media_dir)
        res["op"] = op
        if not op["eligible"]:
            log(f"  [{raw.handle[:24]}] skipped: {op['ineligible_reason']}")
            return res

        candidates = []
        # Posts older than the activity cutoff never reach the AI: their trips have long left.
        fresh = [p for p in raw.posts if not (p.posted_at and p.posted_at < SETTINGS.active_since)]
        for p in raw.posts:
            if p not in fresh:
                res["not_trips"].append({"post_url": p.post_url, "decision": "reject",
                                         "reasons": [f"posted {p.posted_at}, before {SETTINGS.active_since}"],
                                         "caption_excerpt": p.caption[:200]})
        with ThreadPoolExecutor(WORKERS) as pool:
            items = list(pool.map(lambda p: _process_post(p, op, media_dir, today), fresh))
        for item in items:
            facts = item.get("facts") or {}
            if item["decision"] == "reject" and not facts.get("is_trip"):
                res["not_trips"].append({k: item[k] for k in ("post_url", "decision", "reasons")}
                                        | {"caption_excerpt": item["caption"][:200]})
            elif item["decision"] == "reject":
                item.pop("_report", None)
                res["rejected"].append(item)
            else:
                candidates.append(item)

        kept, dups = collapse_duplicates(candidates)
        for d in dups:
            d.pop("_report", None)
        res["duplicates"] += dups
        with ThreadPoolExecutor(WORKERS) as pool:
            list(pool.map(lambda it: _write(it, op) if it.get("facts") else None, kept))
        for item in kept:
            item.pop("_report", None)
            title = item.get("listing_title") or (item.get("facts") or {}).get("title_as_posted")
            log(f"  [{raw.handle[:24]}] trip  {item['decision']:13}  {title}")
        res["trips"] += kept
        return res

    # Several operators at once (each also reads its posts in parallel); results are merged in
    # file order so output files are stable between runs.
    with ThreadPoolExecutor(OPERATOR_WORKERS) as pool:
        results = list(pool.map(one_operator, sorted((run_dir / "raw").glob("*.json"))))
    failed = [r["failed"] for r in results if r.get("failed")]
    for r in results:
        if r["op"] is None:
            continue
        operators.append(r["op"])
        trips += r["trips"]
        not_trips += r["not_trips"]
        rejected += r["rejected"]
        duplicates += r["duplicates"]

    handles = {o["handle"] for o in operators}
    changes = diff_scans(_previous_trips(run_dir, handles), trips, today)

    summary = {
        "run": run_dir.name,
        "scanned_on": today.isoformat(),
        "operators_scanned": len(operators),
        "operators_eligible": sum(o["eligible"] for o in operators),
        "posts_read": len(trips) + len(not_trips) + len(rejected) + len(duplicates),
        "trips": len(trips),
        "publish_ready": sum(t["decision"] == "publish_ready" for t in trips),
        "needs_review": sum(t["decision"] == "review" for t in trips),
        "rejected_trips": len(rejected),
        "not_trips": len(not_trips),
        "duplicates_collapsed": len(duplicates),
        "changes_since_last_scan": len(changes),
        "operators_failed": failed,
        "ai_provider": SETTINGS.ai_provider,
        "ai_usage": USAGE,
    }
    for name, data in {"operators": operators, "trips": trips, "rejected": rejected,
                       "not_trips": not_trips, "duplicates": duplicates, "changes": changes,
                       "summary": summary}.items():
        (run_dir / f"{name}.json").write_text(json.dumps(data, indent=1, ensure_ascii=False, default=str),
                                              encoding="utf-8")
    return summary
