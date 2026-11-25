"""Publish reviewed Growth Engine trips to TripAvail as UNCLAIMED operator listings.

  python -m growth publish out/run-web-...            dry run: prints what would be written
  python -m growth publish out/run-web-... --apply    writes to the database

What it writes, per operator with at least one publish-ready trip:
  - a placeholder account that cannot log in (no password; email at unclaimed.tripavail.com, which
    TripAvail controls) with email notifications switched off, so nothing is ever sent to it;
  - a tour_operator_profiles row with listing_status='unclaimed', their public WhatsApp and website,
    and setup_completed=false (which keeps the "Verified Operator" badge off);
  - each trip as a live tour with booking_mode='enquiry' (WhatsApp enquiry, no TripAvail checkout),
    its photos copied to TripAvail storage, and its upcoming departures.

Safety:
  - Reads only local files from a processed run. It never crawls and never calls an AI model, so the
    service key it needs is never inside a process that reads the open web.
  - Idempotent: operators are matched by listing_source_url and tours by source_url, so a re-run
    updates instead of duplicating.
  - Never touches a MEMBER: if a member profile already uses the operator's phone number, the
    operator is skipped and reported.
"""
from __future__ import annotations

import json
import mimetypes
import re
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

import httpx
from urllib.parse import quote

from .config import SETTINGS

TOUR_COLUMNS = {
    "title", "tour_type", "custom_category_label", "location", "destination_cities", "duration",
    "duration_days", "price", "currency", "price_on_request", "accommodation_pricing", "short_description",
    "description", "highlights", "inclusions", "exclusions", "itinerary", "difficulty_level",
    "requirements", "physical_requirements",
}


class Supabase:
    def __init__(self, url: str, service_key: str, apply: bool, log=print):
        self.url = url.rstrip("/")
        self.apply = apply
        self.log = log
        self.h = {"apikey": service_key, "Authorization": f"Bearer {service_key}"}
        self.http = httpx.Client(timeout=60)

    def get(self, table: str, qs: str) -> list[dict]:
        r = self.http.get(f"{self.url}/rest/v1/{table}?{qs}", headers=self.h)
        r.raise_for_status()
        return r.json()

    def write(self, method: str, table: str, body, qs: str = "", label: str = "") -> list[dict]:
        if not self.apply:
            self.log(f"    [dry] {method} {table} {label}")
            return [{"id": "dry-run", "user_id": "dry-run", "slug": "dry-run"}]
        r = self.http.request(method, f"{self.url}/rest/v1/{table}{'?' + qs if qs else ''}",
                              headers={**self.h, "Content-Type": "application/json", "Prefer": "return=representation"},
                              content=json.dumps(body, default=str))
        if r.status_code >= 400:
            raise RuntimeError(f"{method} {table} {label}: {r.status_code} {r.text[:400]}")
        return r.json() if r.text else []

    def create_placeholder_user(self, email: str, name: str) -> str:
        if not self.apply:
            self.log(f"    [dry] create placeholder account {email}")
            return "dry-run"
        r = self.http.post(f"{self.url}/auth/v1/admin/users", headers={**self.h, "Content-Type": "application/json"},
                           json={"email": email, "email_confirm": True,
                                 "user_metadata": {"full_name": name},
                                 "app_metadata": {"unclaimed_listing": True}})
        if r.status_code >= 400:
            raise RuntimeError(f"create user {email}: {r.status_code} {r.text[:300]}")
        return r.json()["id"]

    def upload(self, bucket: str, key: str, path: Path) -> str:
        public = f"{self.url}/storage/v1/object/public/{bucket}/{key}"
        if not self.apply:
            return public
        ctype = mimetypes.guess_type(path.name)[0] or "image/jpeg"
        r = self.http.post(f"{self.url}/storage/v1/object/{bucket}/{key}",
                           headers={**self.h, "Content-Type": ctype, "x-upsert": "true"}, content=path.read_bytes())
        if r.status_code >= 400:
            raise RuntimeError(f"upload {bucket}/{key}: {r.status_code} {r.text[:200]}")
        return public


def _slugify(s: str) -> str:
    return re.sub(r"-+", "-", re.sub(r"[^a-z0-9]+", "-", (s or "").lower())).strip("-")[:60] or "operator"


# ── The operator Create Tour flow, step for step ─────────────────────────────
# Mirrors packages/web: tourService.createTour + CreateTourPage.handlePublish, so a listed trip is
# stored exactly as if the operator had posted it through the wizard (Basics → Pickup → Media →
# Itinerary → Details → Pricing → Scheduling → Publish). Keep these in step with the web app.

# TourIconRegistry.INCLUDED_FEATURE_OPTIONS / EXCLUDED_FEATURE_OPTIONS
INCLUDED_FEATURE_OPTIONS = [("Professional Tour Guide", "guide"), ("Transportation", "bus"), ("Entrance Fees", "ticket"),
                            ("Meals (as specified)", "meal"), ("Accommodation", "hotel"), ("Travel Insurance", "insurance"),
                            ("Photography", "camera"), ("Local Taxes", "taxes")]
EXCLUDED_FEATURE_OPTIONS = [("Personal Expenses", "expense"), ("Tips and Gratuities", "tips"),
                            ("International Flights", "flight"), ("Visa Fees", "visa"),
                            ("Optional Activities", "optional_activity"), ("Alcoholic Beverages", "alcohol"),
                            ("Shopping", "shopping"), ("Emergency Expenses", "emergency")]
# CreateTourPage.collectMissingFields: MIN_PRICE_BY_CURRENCY
MIN_PRICE = {"PKR": 300, "INR": 300, "BDT": 300, "USD": 5, "AED": 15, "SAR": 15, "EUR": 5, "GBP": 5}


def structured_features(labels, catalog, explicit=None) -> list[dict]:
    """buildStructuredFeaturesFromLabels: explicit icons win, then a catalog match, else 'generic'."""
    if explicit:
        return [{"label": f["label"], "icon_key": f.get("icon_key") or "generic"} for f in explicit if f.get("label")]
    by = {label.lower(): (label, icon) for label, icon in catalog}
    return [{"label": by[l.lower()][0], "icon_key": by[l.lower()][1]} if l.lower() in by else {"label": l, "icon_key": "generic"}
            for l in labels or []]


def slugify_title(title: str) -> str:
    """tourService.slugifyTitle — keeps hyphens, so '8-Day' stays '8-day'."""
    s = re.sub(r"[^a-z0-9\s-]", "", (title or "").lower()).strip()
    return re.sub(r"^-+|-+$", "", re.sub(r"-+", "-", re.sub(r"\s+", "-", s)))


def completion_percentage(row: dict, schedules: list) -> int:
    """tourService.calculateCompletionPercentage."""
    checks = [bool((row.get("title") or "").strip()), bool(row.get("tour_type")),
              bool((row.get("location") or {}).get("city")), bool(row.get("duration")), bool(row.get("images")),
              bool((row.get("description") or "").strip()), bool(row.get("itinerary")),
              bool(row.get("price")) and row["price"] > 0, bool(row.get("cancellation_policy")), bool(schedules)]
    return round(sum(checks) / len(checks) * 100)


def wizard_itinerary(itin: list) -> list[dict]:
    """TourItineraryStep shape: [{day, title, activities:[{id,type,title,time,description}]}]."""
    import uuid
    out = []
    for i, d in enumerate(itin or [], start=1):
        acts = d.get("activities")
        if not acts:  # an AI day ({title, description}) becomes one activity, as an operator would type it
            acts = [{"type": "custom", "title": d.get("title") or f"Day {i}", "description": d.get("description") or ""}]
        out.append({"day": int(d.get("day") or i), "title": d.get("title") or "",
                    "activities": [{"id": str(uuid.uuid4()), "type": a.get("type") or "custom",
                                    "title": a.get("title") or "", "time": a.get("time") or "",
                                    "description": a.get("description") or ""} for a in acts]})
    return out


def wizard_schedules(rec: dict, today: date) -> list[dict]:
    """Basics/Scheduling shape: [{id, date, time, capacity, end_time}] — future departures only.

    Only stated facts: the date always; the time and return only when the operator gives them (the
    JSON then leaves 'time' empty, and the slot's timestamp is an internal 08:00 that enquiry pages
    never show). Capacity is inventory, the one thing we may fill: the operator's stated seats,
    else the group size, else 10."""
    import uuid
    days = max(1, int(rec.get("duration_days") or 1))
    tz = timezone(timedelta(hours=5))  # the wizard stores the operator's local time; these are Pakistani trips
    out = []
    for dep in rec.get("schedules") or [{"date": d} for d in rec.get("departures") or []]:
        if not dep.get("date") or dep["date"] < today.isoformat():
            continue
        start = datetime.fromisoformat(f"{dep['date']}T{dep.get('time') or '08:00'}:00").replace(tzinfo=tz)
        end = (datetime.fromisoformat(dep["end_time"]) if dep.get("end_time")
               else start + timedelta(days=days - 1, hours=12))
        out.append({"id": str(uuid.uuid4()), "date": dep["date"], "time": dep.get("time") or "",
                    "capacity": int(dep.get("capacity") or rec.get("max_participants") or 10),
                    "start_time": start.isoformat(), "end_time": end.isoformat() if dep.get("end_time") else ""})
    return out


def preflight(rec: dict, images: list, schedules: list) -> list[str]:
    """CreateTourPage.collectMissingFields — the checks the wizard runs before Publish now.

    Rule for listings we post for an operator: only what the operator states, never invented. So a
    field the wizard would make the operator fill (pickup point, itinerary, cancellation policy) is
    left empty when the operator didn't give it — that does not block the listing. What we still
    require is what makes it a real, bookable trip: title, place, photos, a future date, a price
    (or 'price on request')."""
    missing = []
    if not (rec.get("title") or "").strip():
        missing.append("Tour title")
    loc = rec.get("location") or {}
    if not (loc.get("city") or "").strip():
        missing.append("Tour destination city")
    if not (loc.get("country") or "").strip():
        missing.append("Tour country")
    if not images:
        missing.append("At least one image")
    if not schedules:
        missing.append("A departure date in the future")
    price = float(rec.get("price") or 0)
    floor = MIN_PRICE.get((rec.get("currency") or "PKR").upper(), 5)
    if not rec.get("price_on_request") and price < floor:
        missing.append(f"A realistic price (at least {floor})")
    acc = rec.get("accommodation_pricing") or {}
    if acc.get("enabled") and not [t for t in acc.get("tiers") or [] if float(t.get("pricePerPerson") or 0) > 0]:
        missing.append("Room-sharing prices")
    return missing


def _local(run_dir: Path, stored_path: str | None) -> Path | None:
    if not stored_path:
        return None
    p = Path(stored_path)
    p = p if p.is_absolute() else run_dir / p
    return p if p.exists() else (run_dir / "media" / p.name if (run_dir / "media" / p.name).exists() else None)


def _profile_description(op: dict, trips: list[dict]) -> str:
    places = []
    for t in trips:
        for c in (t.get("tour") or {}).get("destination_cities") or []:
            if c not in places:
                places.append(c)
    bits = [f"{op['name']} is a tour operator" + (f" based in {op['city']}" if op.get("city") else "") + "."]
    if places:
        bits.append(f"Trips listed on TripAvail go to {', '.join(places[:6])}.")
    bits.append("This profile was set up by TripAvail from the operator's public listings and has not been "
                "claimed yet. Prices and dates are set by the operator; enquire on WhatsApp to book.")
    return " ".join(bits)


def post_via_wizard_flow(sb: "Supabase", run_dir: Path, uid: str, rec: dict, today: date, log=print) -> dict | None:
    """Post one trip the way an operator does in Create Tour: a draft first, then each step's data,
    then Publish. Nothing goes live unless the wizard's own publish checks pass."""
    images_local = [f for f in (_local(run_dir, sp) for sp in rec.get("images") or []) if f]
    schedules = wizard_schedules(rec, today)
    missing = preflight(rec, images_local, schedules)
    if missing:
        log(f"  HOLD  {rec.get('title')}: the wizard would block Publish — missing {', '.join(missing)}")
        return None

    price = float(rec.get("price") or 0)
    inclusions, exclusions = rec.get("inclusions") or [], rec.get("exclusions") or []
    pickups = rec.get("pickup_locations") or []  # only a meeting point the operator states
    row = {k: rec[k] for k in TOUR_COLUMNS if k in rec}
    row.update(
        operator_id=uid,
        # Basics
        min_participants=rec.get("min_participants"), max_participants=rec.get("max_participants"),
        # Itinerary
        itinerary=wizard_itinerary(rec.get("itinerary")),
        # Details — only what the operator states; blank beats invented
        min_age=rec.get("min_age"), max_age=rec.get("max_age"),
        **({"languages": rec["languages"]} if rec.get("languages") else {}),
        # Pricing (createTour normalisation: aliases + structured feature icons)
        price=price, base_price=price,
        inclusions=inclusions, included=inclusions,
        exclusions=exclusions, excluded=exclusions,
        included_features=structured_features(inclusions, INCLUDED_FEATURE_OPTIONS, rec.get("included_features")),
        excluded_features=structured_features(exclusions, EXCLUDED_FEATURE_OPTIONS, rec.get("excluded_features")),
        accommodation_pricing=rec.get("accommodation_pricing") or {},
        require_deposit=False, deposit_required=False, deposit_percentage=0,
        cancellation_policy=None, cancellation_policy_type=None,  # the operator's own terms apply
        # Scheduling (the JSON the wizard keeps; tour_schedules rows are synced from it below)
        schedules=[{k: s[k] for k in ("id", "date", "time", "capacity", "end_time") if s[k] != ""} for s in schedules],
        draft_data={"pickup_locations_count": len(pickups), "posted_by": "growth-engine",
                    "source_url": rec.get("source_url")},
        # Enquiry listing provenance
        booking_mode="enquiry", source=rec.get("source"), source_url=rec.get("source_url"),
        source_checked_at=datetime.now(timezone.utc).isoformat(),
    )

    # 1 · Basics — save a draft (the wizard creates the draft before media can be added)
    found = sb.get("tours", f"source_url=eq.{quote(rec['source_url'], safe='')}&select=id,slug") \
        if rec.get("source_url") else []
    if found:
        tour_id, slug = found[0]["id"], found[0]["slug"]
        sb.write("PATCH", "tours", row, qs=f"id=eq.{tour_id}", label=f"basics/details/pricing '{row['title']}'")
    else:
        slug = slugify_title(row["title"]) or _slugify(row["title"])
        if sb.get("tours", f"slug=eq.{quote(slug, safe='')}&select=id"):
            slug = f"{slug}-{datetime.now().strftime('%y%m%d')}"  # buildFallbackSlug's job
        draft = sb.write("POST", "tours", {**row, "slug": slug, "is_active": False, "is_published": False,
                                           "workflow_status": "draft"}, label=f"draft '{row['title']}'")
        tour_id = draft[0]["id"]
    log(f"  1 basics      draft saved  /tours/{slug}")

    # 2 · Pickup — same rows TourPickupLocationsStep writes (replace-all)
    if tour_id != "dry-run":
        sb.write("DELETE", "tour_pickup_locations", None, qs=f"tour_id=eq.{tour_id}", label="clear pickups")
    if pickups:
        sb.write("POST", "tour_pickup_locations", [{
            "tour_id": tour_id, "title": p["title"], "formatted_address": p.get("formatted_address") or p["title"],
            "city": p.get("city"), "country": p.get("country"), "latitude": p["latitude"], "longitude": p["longitude"],
            "google_place_id": p.get("google_place_id"), "pickup_time": p.get("pickup_time"), "notes": p.get("notes"),
            "is_primary": bool(p.get("is_primary", i == 0))} for i, p in enumerate(pickups)],
            label=f"{len(pickups)} pickup(s)")
    log(f"  2 pickup      {pickups[0]['title'] if pickups else 'not stated by the operator — left empty'}")

    # 3 · Media — uploadTourMediaAtomic: storage at <operator>/<tour>/, a tour_media row each, first is main
    if tour_id != "dry-run":
        sb.write("DELETE", "tour_media", None, qs=f"tour_id=eq.{tour_id}", label="clear media")
    urls = []
    for i, f in enumerate(images_local):
        key = f"{uid}/{tour_id}/{f.name}"
        url = sb.upload("tour-images", key, f)
        sb.write("POST", "tour_media", {"tour_id": tour_id, "url": url, "storage_path": key, "sort_order": i,
                                        "is_main": i == 0}, label=f"media {i + 1}")
        urls.append(url)
    log(f"  3 media       {len(urls)} photos")
    log(f"  4 itinerary   {len(row['itinerary'])} days, {sum(len(d['activities']) for d in row['itinerary'])} activities")
    log(f"  5 details     difficulty {row.get('difficulty_level')}, ages {row.get('min_age')}+, "
        f"group max {row.get('max_participants')}, {len(row.get('requirements') or [])} requirements")
    log(f"  6 pricing     {row['currency']} {price:,.0f} pp, {len(inclusions)} included / {len(exclusions)} excluded")

    # 7 · Scheduling — the wizard's syncTourSchedulesFromJson RPC
    sb.write("POST", "rpc/sync_tour_schedules_from_json",
             {"p_tour_id": tour_id, "p_default_capacity": max(1, int(rec.get("max_participants") or 10)),
              "p_schedules": [{"start_time": s["start_time"], "capacity": s["capacity"], "status": "scheduled",
                               "end_time": s["end_time"] or (datetime.fromisoformat(s["start_time"]) + timedelta(
                                   days=max(1, int(rec.get("duration_days") or 1)) - 1, hours=12)).isoformat()}
                              for s in schedules]}, label=f"{len(schedules)} departures")
    log(f"  7 scheduling  {', '.join(s['date'] for s in schedules)}")

    # 8 · Publish now — handlePublish's flags, with images synced from tour_media (syncTourImagesFromMedia)
    final = {"images": urls, "is_active": True, "is_published": True, "is_verified": False, "is_featured": False,
             "status": "live", "workflow_status": "approved", "approved_at": datetime.now(timezone.utc).isoformat(),
             "completion_percentage": completion_percentage({**row, "images": urls}, schedules)}
    sb.write("PATCH", "tours", final, qs=f"id=eq.{tour_id}", label="publish")
    log(f"  8 published   https://tripavail.com/tours/{slug}")
    return {"title": row["title"], "tour_id": tour_id, "slug": slug, "source_url": rec.get("source_url")}


def publish_run(run_dir: Path, apply: bool = False, include_review: bool = False, only: list[str] | None = None,
                log=print, wizard: bool = True) -> dict:
    # The service key lives in its own file, read only here — never loaded into the environment of
    # the crawling / AI processes that read the open web.
    from dotenv import dotenv_values
    creds = dotenv_values(Path(__file__).resolve().parent.parent / ".env.publish")
    url, key = creds.get("SUPABASE_URL"), creds.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        raise SystemExit("Put SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in services/growth-engine/.env.publish first.")
    sb = Supabase(url, key, apply, log)
    operators = json.loads((run_dir / "operators.json").read_text(encoding="utf-8"))
    trips = json.loads((run_dir / "trips.json").read_text(encoding="utf-8"))
    wanted = {"publish_ready", "review"} if include_review else {"publish_ready"}
    today = date.today()
    out = {"run": run_dir.name, "applied": apply, "operators": [], "skipped": []}

    for op in operators:
        if not op or not op.get("eligible"):
            continue
        if only and not any(o.lower() in (op.get("name") or "").lower() for o in only):
            continue
        mine = [t for t in trips if t.get("operator_handle") == op["handle"] and t.get("decision") in wanted
                and t.get("tour")]
        if not mine:
            continue
        source_url = op["page_url"]
        phone = op.get("phone_e164")
        log(f"\n{op['name']}  ({len(mine)} trips)  {source_url}")

        if phone:
            member = sb.get("tour_operator_profiles",
                            f"phone_number=eq.{quote(phone, safe='')}&listing_status=eq.member&select=user_id,slug")
            if member:
                log(f"  SKIP: a TripAvail member already uses {phone} (/operators/{member[0].get('slug')})")
                out["skipped"].append({"operator": op["name"], "reason": f"member {member[0].get('slug')} has this phone"})
                continue

        existing = sb.get("tour_operator_profiles",
                          f"listing_source_url=eq.{quote(source_url, safe='')}&select=user_id,slug,listing_status")
        if existing and existing[0]["listing_status"] != "unclaimed":
            log("  SKIP: this profile has been claimed; the operator manages it now")
            out["skipped"].append({"operator": op["name"], "reason": "claimed"})
            continue

        if existing:
            uid = existing[0]["user_id"]
            log(f"  existing unclaimed profile /operators/{existing[0]['slug']}")
        else:
            email = f"{_slugify(op['handle'])}@unclaimed.tripavail.com"
            uid = sb.create_placeholder_user(email, op["name"])
            sb.write("POST", "account_settings", {"user_id": uid, "email_notifications_enabled": False,
                                                  "marketing_emails": False, "booking_reminders": False},
                     qs="on_conflict=user_id", label="notifications off")

        logo_url = None
        logo = _local(run_dir, (op.get("logo") or {}).get("stored_path"))
        if logo:
            logo_url = sb.upload("tour-operator-assets", f"{uid}/logo/{logo.name}", logo)
        profile = {
            "user_id": uid,
            "business_name": op["name"],
            "company_name": op["name"],
            "description": _profile_description(op, mine),
            "primary_city": op.get("city"),
            "phone_number": phone,
            "public_whatsapp": phone,
            "website_url": op.get("website"),
            "company_logo_url": logo_url,
            "profile_picture_url": logo_url,
            "country_code": "PK",
            "is_public": True,
            "setup_completed": False,  # keeps the "Verified Operator" badge off
            "listing_status": "unclaimed",
            "listing_source": op.get("source"),
            "listing_source_url": source_url,
        }
        if existing:
            sb.write("PATCH", "tour_operator_profiles", {k: v for k, v in profile.items() if k != "user_id"},
                     qs=f"user_id=eq.{uid}", label="update profile")
        else:
            sb.write("POST", "tour_operator_profiles", profile, label="create profile")

        published = []
        for t in mine:
            rec = t["tour"]
            if wizard:
                res = post_via_wizard_flow(sb, run_dir, uid, rec, today, log)
                if res:
                    published.append(res)
                else:
                    out["skipped"].append({"operator": op["name"], "trip": rec.get("title"), "reason": "wizard pre-flight"})
                continue
            row = {k: rec[k] for k in TOUR_COLUMNS if k in rec}
            images = []
            for i, sp in enumerate(rec.get("images") or []):
                f = _local(run_dir, sp)
                if f:
                    images.append(sb.upload("tour-images", f"{uid}/growth/{f.name}", f))
            row.update(
                operator_id=uid,
                images=images,
                booking_mode="enquiry",
                require_deposit=False,
                deposit_required=False,
                # Column defaults ('flexible' cancellation, 20 travellers, ages 0-100) are TripAvail
                # member settings; for an operator's own listing they would be invented facts.
                cancellation_policy=None,
                cancellation_policy_type=None,
                max_participants=None,
                min_participants=None,
                min_age=None,
                max_age=None,
                is_active=True,
                is_published=True,
                status="live",
                workflow_status="approved",
                completion_percentage=100,
                source=rec.get("source"),
                source_url=rec.get("source_url"),
                source_checked_at=datetime.now(timezone.utc).isoformat(),
            )
            found = sb.get("tours", f"source_url=eq.{quote(rec['source_url'], safe='')}&select=id,slug") \
                if rec.get("source_url") else []
            if found:
                tour = sb.write("PATCH", "tours", row, qs=f"id=eq.{found[0]['id']}", label=f"update '{row['title']}'")
                tour_id = found[0]["id"]
            else:
                tour = sb.write("POST", "tours", row, label=f"create '{row['title']}'")
                tour_id = tour[0]["id"] if tour else None

            # Departures we list are the operator's stated dates; nobody books them here (capacity 0).
            if tour_id and tour_id != "dry-run":
                sb.write("DELETE", "tour_schedules", None,
                         qs=f"tour_id=eq.{tour_id}&start_time=gte.{today.isoformat()}&booked_count=eq.0",
                         label="clear future departures")
            days = max(1, int(rec.get("duration_days") or 1))
            deps = [d for d in rec.get("departures") or [] if d >= today.isoformat()]
            if deps and tour_id:
                rows = []
                for d in deps:
                    start = datetime.fromisoformat(d).replace(hour=3, tzinfo=timezone.utc)  # 08:00 in Pakistan
                    rows.append({"tour_id": tour_id, "start_time": start.isoformat(),
                                 "end_time": (start + timedelta(days=days - 1, hours=12)).isoformat(),
                                 "capacity": 0, "booked_count": 0, "status": "scheduled"})
                sb.write("POST", "tour_schedules", rows, label=f"{len(rows)} departures")
            slug = (tour[0].get("slug") if tour else None) or (found[0]["slug"] if found else None)
            log(f"  {'updated' if found else 'listed '}  {row['title']}  ->  /tours/{slug}")
            published.append({"title": row["title"], "tour_id": tour_id, "slug": slug, "source_url": rec.get("source_url")})
        out["operators"].append({"name": op["name"], "user_id": uid, "trips": published})

    name = "published.json" if apply else "publish-dry-run.json"
    (run_dir / name).write_text(json.dumps(out, indent=1, ensure_ascii=False), encoding="utf-8")
    n = sum(len(o["trips"]) for o in out["operators"])
    log(f"\n{'Published' if apply else 'Dry run:'} {n} trips from {len(out['operators'])} operators; "
        f"{len(out['skipped'])} operators skipped -> {run_dir / name}")
    return out
