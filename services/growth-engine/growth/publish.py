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


def publish_run(run_dir: Path, apply: bool = False, include_review: bool = False, only: list[str] | None = None,
                log=print) -> dict:
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
