"""Read active operators' own websites into a new run folder (crawl only; `process_run` reads it).

Used by `python -m growth webscan` and by the weekly `refresh`.
"""
from __future__ import annotations

import asyncio
import glob
import json
from datetime import datetime
from pathlib import Path

from .config import SETTINGS


def latest_sites_file() -> Path:
    files = sorted(glob.glob(str(SETTINGS.out_dir / "directory" / "sites-*.json")))
    if not files:
        raise SystemExit("No site check yet: run `python -m growth sites` first.")
    return Path(files[-1])


def webscan(statuses: list[str], limit: int = 10, tours: int = 10, names: list[str] | None = None,
            fresh_tours: bool = False, log=print) -> Path:
    from .crawl import _safe
    from .sources.website import fetch_site

    latest = latest_sites_file()
    rows = json.loads(latest.read_text(encoding="utf-8"))
    want = set(statuses)
    picked = [r for r in rows if (r.get("site") or {}).get("status") in want]
    if names:
        picked = [r for r in picked if any(n.lower() in r["name"].lower() for n in names)]
    if fresh_tours:
        picked = [r for r in picked if ((r.get("site") or {}).get("tour_pages_newest") or "") >= SETTINGS.active_since]
    # Most tours on the directory first: the busiest operators are the best first listings.
    picked.sort(key=lambda r: r.get("tours_on_directory") or 0, reverse=True)
    picked = picked[:limit]
    run_dir = SETTINGS.out_dir / f"run-web-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
    (run_dir / "raw").mkdir(parents=True, exist_ok=True)
    log(f"{len(picked)} operators from {latest.name} -> {run_dir.name}")

    async def crawl_all():
        sem = asyncio.Semaphore(4)  # four different sites at a time; one request at a time per site

        async def one(r):
            async with sem:
                try:
                    raw = await fetch_site(r, SETTINGS.active_since, tours)
                except Exception as e:  # noqa: BLE001
                    log(f"  {r['name'][:40]}: failed ({type(e).__name__})")
                    return
                if raw and raw.posts:
                    (run_dir / "raw" / f"{_safe(raw.handle)}.json").write_text(
                        raw.model_dump_json(indent=1), encoding="utf-8")
        await asyncio.gather(*(one(r) for r in picked))

    asyncio.run(crawl_all())
    return run_dir
