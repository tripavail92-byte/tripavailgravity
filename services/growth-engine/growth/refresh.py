"""Weekly refresh: keep listed trips current without anyone touching them.

  python -m growth refresh            does everything below, unattended
  python -m growth refresh --dry-run  same, but publishes and archives nothing

1. Re-check which operators' sites are alive and active (no AI).
2. Re-read active operators' newest tour pages into a new run folder.
3. Process it: unchanged pages come from the AI cache at no cost; only new or edited pages are read.
4. Check every page we list; a page the operator removed (404/410) becomes a past trip.
5. Publish through the operator Create Tour flow and archive removed pages — in a SEPARATE process,
   so the service key is never loaded into the process that reads the open web.
6. Tell search engines (IndexNow) about the updated sitemap.
Prices, pickups and dates follow the same rules as any run; overrides.json is always applied.
"""
from __future__ import annotations

import asyncio
import glob
import json
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path
from urllib.parse import urlparse

import httpx

from .config import SETTINGS

INDEXNOW_KEY = "ada2f5474f9ee30902c9f86bc3e5e9e3"
SITE = "https://tripavail.com"


def listed_source_urls() -> list[str]:
    urls: set[str] = set()
    for f in glob.glob(str(SETTINGS.out_dir / "run-*" / "published.json")):
        for op in json.loads(Path(f).read_text(encoding="utf-8")).get("operators") or []:
            for t in op.get("trips") or []:
                if t.get("source_url"):
                    urls.add(t["source_url"])
    return sorted(urls)


async def gone_pages(urls: list[str], log=print) -> list[str]:
    """Pages that now answer 404 or 410. Anything else (including errors) is left alone."""
    by_host: dict[str, list[str]] = {}
    for u in urls:
        by_host.setdefault(urlparse(u).netloc, []).append(u)
    gone: list[str] = []
    headers = {"User-Agent": "Mozilla/5.0 (compatible; TripListingBot/1.0)"}

    async def host(client, items):
        for u in items:  # one request at a time per site
            try:
                r = await client.get(u)
                if r.status_code in (404, 410):
                    gone.append(u)
                    log(f"  gone ({r.status_code}): {u}")
            except Exception:  # noqa: BLE001 — a flaky site is not a removed page
                pass
            await asyncio.sleep(1.0)

    async with httpx.AsyncClient(headers=headers, timeout=20, follow_redirects=True) as client:
        sem = asyncio.Semaphore(6)

        async def guarded(items):
            async with sem:
                await host(client, items)
        await asyncio.gather(*(guarded(v) for v in by_host.values()))
    return sorted(gone)


def ping_indexnow(log=print) -> None:
    xml = httpx.get(f"{SITE}/sitemap.xml", timeout=30).text
    import re
    urls = re.findall(r"<loc>([^<]+)</loc>", xml)
    r = httpx.post("https://api.indexnow.org/indexnow", timeout=30, json={
        "host": urlparse(SITE).netloc, "key": INDEXNOW_KEY,
        "keyLocation": f"{SITE}/{INDEXNOW_KEY}.txt", "urlList": urls})
    log(f"IndexNow: {r.status_code} for {len(urls)} URLs")


def refresh(dry_run: bool = False, log=print) -> int:
    from .directory import check_sites
    from .pipeline import process_run
    from .report import build_report
    from .webscan import webscan

    started = datetime.now()
    ddir = SETTINGS.out_dir / "directory"
    rows = json.loads((ddir / "tourhub-companies.json").read_text(encoding="utf-8"))
    log(f"[{started:%Y-%m-%d %H:%M}] 1/6 checking {len(rows)} operator sites")
    checked = asyncio.run(check_sites(rows))
    (ddir / f"sites-{started:%Y%m%d-%H%M}.json").write_text(json.dumps(checked, indent=1, ensure_ascii=False),
                                                           encoding="utf-8")

    log("2/6 reading active operators' newest tour pages")
    run_dir = webscan(["active", "recently_updated"], limit=1000, tours=10, fresh_tours=True, log=log)

    log("3/6 processing (cached pages are free)")
    summary = process_run(run_dir, log=log)
    build_report(run_dir)
    log(json.dumps({k: v for k, v in summary.items() if k not in ("ai_usage",)}, indent=1))

    log("4/6 checking listed pages for removals")
    gone = asyncio.run(gone_pages(listed_source_urls(), log=log))
    (run_dir / "gone.json").write_text(json.dumps(gone, indent=1), encoding="utf-8")
    log(f"  {len(gone)} listed pages were removed by their operators")

    log("5/6 publishing (separate process holds the database key)")
    py = sys.executable
    flags = [] if dry_run else ["--apply"]
    rc1 = subprocess.call([py, "-m", "growth", "publish", str(run_dir), *flags])
    rc2 = subprocess.call([py, "-m", "growth", "archive", str(run_dir / "gone.json"), *flags])

    if not dry_run:
        log("6/6 waiting for the sitemap to refresh, then telling search engines")
        time.sleep(360)
        try:
            ping_indexnow(log)
        except Exception as e:  # noqa: BLE001
            log(f"  IndexNow failed: {e}")
    log(f"done in {(datetime.now() - started).seconds // 60} min -> {run_dir}")
    return rc1 or rc2
