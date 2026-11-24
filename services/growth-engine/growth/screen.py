"""Free pre-screen of crawled pages: is this company actively posting trips?

Active means at least one trip post dated on or after SETTINGS.active_since. Follower count says
nothing about this — many pages' newest trip posts are years old. Trip posts are recognised on
plain-text signals (a price, a length in days/nights, a departure or date, trip words), before
any AI spend. Inactive pages are set aside, untouched, in raw_skipped/.
"""
from __future__ import annotations

import json
import re
import shutil
from pathlib import Path

from .config import SETTINGS
from .models import RawPage

PRICE = re.compile(r"\b(rs\.?|pkr|rupees)\s*[\d,]{3,}|[\d,]{4,}\s*(/-|rs\b|pkr)|per\s*(person|head|couple|pax)"
                   r"|\b\d{2,3}\s*k\b", re.I)
LENGTH = re.compile(r"\b\d{1,2}\s*(days?|nights?)\b|\b\d\s*d\s*/\s*\d\s*n\b|day\s*trip", re.I)
WHEN = re.compile(r"depart|departure|leaving|dates?\s*:|every\s+(mon|tue|wed|thu|fri|sat|sun)"
                  r"|\b\d{1,2}(st|nd|rd|th)?\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)", re.I)
TRIPWORD = re.compile(r"\b(trip|tour|package|booking|seats?|itinerary|inclu(des|ded|sions?))\b", re.I)


def trip_signals(caption: str) -> int:
    return sum(bool(rx.search(caption)) for rx in (PRICE, LENGTH, WHEN, TRIPWORD))


def is_trip_post(caption: str) -> bool:
    return trip_signals(caption) >= 2


def screen_run(run_dir: Path, keep: int, log=print) -> list[dict]:
    since = SETTINGS.active_since
    rows = []
    for f in sorted((run_dir / "raw").glob("*.json")):
        raw = RawPage.model_validate_json(f.read_text(encoding="utf-8"))
        trips = [p for p in raw.posts if is_trip_post(p.caption)]
        recent = [p for p in trips if p.posted_at and p.posted_at >= since]
        dated = sorted(p.posted_at for p in trips if p.posted_at)
        rows.append({"file": f.name, "handle": raw.handle, "posts": len(raw.posts), "trip_posts": len(trips),
                     "recent_trip_posts": len(recent), "latest_trip_post": dated[-1] if dated else None})
    rows.sort(key=lambda r: (r["recent_trip_posts"], r["latest_trip_post"] or ""), reverse=True)
    active = [r for r in rows if r["recent_trip_posts"] > 0][:keep]
    chosen = {r["file"] for r in active}

    skipped_dir = run_dir / "raw_skipped"
    for r in rows:
        r["selected"] = r["file"] in chosen
        if not r["selected"]:
            skipped_dir.mkdir(exist_ok=True)
            shutil.move(str(run_dir / "raw" / r["file"]), skipped_dir / r["file"])
        log(f"{'KEEP' if r['selected'] else 'skip'}  {r['recent_trip_posts']:>2} trip posts since {since}"
            f"  (latest trip post {r['latest_trip_post'] or 'none found'})  {r['handle']}")
    (run_dir / "screening.json").write_text(json.dumps(rows, indent=1), encoding="utf-8")
    log(f"{len(active)} active operators kept (of {len(rows)} crawled)")
    return rows
