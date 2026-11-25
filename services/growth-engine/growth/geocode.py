"""Map pins for meeting points the operator names — and only those.

OpenStreetMap Nominatim (free, no key): at most one request a second, a generic User-Agent, and every
answer cached on disk. No result means no pickup point; a pin is never guessed.
"""
from __future__ import annotations

import json
import re
import threading
import time
from hashlib import sha256

import httpx

from .config import SETTINGS
from .models import TripFacts

_lock = threading.Lock()
_last = [0.0]


def geocode(query: str) -> dict | None:
    path = SETTINGS.out_dir / ".geo-cache" / f"{sha256(query.lower().encode()).hexdigest()[:24]}.json"
    if path.exists():
        return json.loads(path.read_text(encoding="utf-8")) or None
    with _lock:  # Nominatim's usage policy: one request per second
        wait = 1.1 - (time.monotonic() - _last[0])
        if wait > 0:
            time.sleep(wait)
        r = httpx.get("https://nominatim.openstreetmap.org/search",
                      params={"q": query, "format": "jsonv2", "limit": 1},
                      headers={"User-Agent": "TripListingBot/1.0"}, timeout=20)
        _last[0] = time.monotonic()
    hit = (r.json() or [None])[0] if r.status_code == 200 else None
    out = {"lat": float(hit["lat"]), "lng": float(hit["lon"]), "name": hit.get("display_name")} if hit else {}
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(out), encoding="utf-8")
    return out or None


def _norm(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", (s or "").lower()).strip()


def pickup_locations(facts: TripFacts, caption: str, country: str, operator: str = "the operator") -> list[dict]:
    """The wizard's pickup row for a meeting point the operator states, or [] — never a guess:
    the place must appear in the operator's own text, and the map must find it."""
    mp = facts.meeting_point
    if not mp or not mp.place.strip():
        return []
    if _norm(mp.place) not in _norm(caption):  # the reader must not have made the place up
        return []
    city = mp.city or facts.departure_city
    # "Pickups: Lahore (10 pm)" names a city, not a spot: a pin at the city centre would send people
    # to the wrong place. Only a named place within the city (a Markaz, an interchange, a hotel) is pinned.
    if _norm(mp.place) in {_norm(city or ""), _norm(facts.departure_city or "")} or \
            _norm(mp.place.split(",")[0]) in {_norm(city or ""), _norm(facts.departure_city or "")}:
        return []
    hit = geocode(", ".join(x for x in (mp.place, city, country) if x))
    if not hit:
        return []
    return [{"title": mp.place.strip() + (f", {city}" if city and city.lower() not in mp.place.lower() else ""),
             "formatted_address": ", ".join(x for x in (mp.place, city, country) if x),
             "city": city, "country": country, "latitude": hit["lat"], "longitude": hit["lng"],
             "google_place_id": None, "pickup_time": mp.time,
             "notes": f"Confirm the exact spot with {operator} on WhatsApp.", "is_primary": True}]
