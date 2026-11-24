"""Command line for the Growth Engine pilot.

  python -m growth login                          log the scraping account in (once)
  python -m growth discover "tours hunza" ...      find candidate pages, keep 500-10,000 followers
  python -m growth scan URL [URL ...]              crawl pages, extract trips, write listings, report
  python -m growth scan --file pages.txt
  python -m growth process out/run-...             re-run extraction on a saved crawl (no Facebook visit)
  python -m growth models                          check the configured AI models exist on your key
"""
from __future__ import annotations

import argparse
import asyncio
import json
import sys
from datetime import datetime
from pathlib import Path

from .config import SETTINGS


def _urls(args) -> list[str]:
    urls = list(args.urls or [])
    if args.file:
        urls += [ln.strip() for ln in Path(args.file).read_text(encoding="utf-8").splitlines()
                 if ln.strip() and not ln.startswith("#")]
    return list(dict.fromkeys(urls))


def main() -> int:
    # Page names carry Urdu and emoji; the Windows console's default code page can't print them.
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    ap = argparse.ArgumentParser(prog="growth")
    sub = ap.add_subparsers(dest="cmd", required=True)
    lg = sub.add_parser("login")
    lg.add_argument("--minutes", type=int, default=15)
    d = sub.add_parser("discover")
    d.add_argument("queries", nargs="+")
    d.add_argument("--per-query", type=int, default=25)
    s = sub.add_parser("scan")
    s.add_argument("urls", nargs="*")
    s.add_argument("--file")
    s.add_argument("--posts", type=int, default=SETTINGS.posts_per_page)
    s.add_argument("--screen", type=int, default=0,
                   help="after crawling, keep only the N pages most actively posting trips")
    p = sub.add_parser("process")
    p.add_argument("run_dir")
    sub.add_parser("models")
    dr = sub.add_parser("directory", help="read TourHub's operator directory (facts only) -> out/directory/")
    dr.add_argument("--limit", type=int, default=0)
    st = sub.add_parser("sites", help="check each directory operator's own website: alive? active?")
    st.add_argument("--limit", type=int, default=0)
    ws = sub.add_parser("webscan", help="read trips from active operators' own websites, then process + report")
    ws.add_argument("--limit", type=int, default=10, help="how many operators")
    ws.add_argument("--tours", type=int, default=10, help="tour pages per operator, newest first")
    ws.add_argument("--status", default="active,recently_updated",
                    help="which website-check statuses to include")
    ws.add_argument("--names", nargs="*", help="only these operators (substring match)")
    ws.add_argument("--fresh-tours", action="store_true",
                    help="only operators whose tour pages changed on/after GROWTH_ACTIVE_SINCE")
    ws.add_argument("--crawl-only", action="store_true", help="fetch pages now; run `process` on the folder later")
    pb = sub.add_parser("publish", help="list a processed run's trips on TripAvail (dry run unless --apply)")
    pb.add_argument("run_dir")
    pb.add_argument("--apply", action="store_true", help="actually write to the database")
    pb.add_argument("--include-review", action="store_true", help="also publish trips marked 'review'")
    pb.add_argument("--only", nargs="*", help="only these operators (substring match)")
    args = ap.parse_args()

    if args.cmd == "publish":
        from .publish import publish_run
        publish_run(Path(args.run_dir), apply=args.apply, include_review=args.include_review, only=args.only)
        return 0

    if args.cmd == "webscan":
        import glob

        from .crawl import _safe
        from .sources.website import fetch_site
        latest = sorted(glob.glob(str(SETTINGS.out_dir / "directory" / "sites-*.json")))[-1]
        rows = json.loads(Path(latest).read_text(encoding="utf-8"))
        want = set(args.status.split(","))
        picked = [r for r in rows if (r.get("site") or {}).get("status") in want]
        if args.names:
            picked = [r for r in picked if any(n.lower() in r["name"].lower() for n in args.names)]
        if args.fresh_tours:
            picked = [r for r in picked if ((r.get("site") or {}).get("tour_pages_newest") or "") >= SETTINGS.active_since]
        # Most tours on the directory first: the busiest operators are the best first listings.
        picked.sort(key=lambda r: r.get("tours_on_directory") or 0, reverse=True)
        picked = picked[: args.limit]
        run_dir = SETTINGS.out_dir / f"run-web-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
        (run_dir / "raw").mkdir(parents=True, exist_ok=True)
        print(f"{len(picked)} operators from {Path(latest).name} -> {run_dir.name}")

        async def crawl_all():
            sem = asyncio.Semaphore(4)  # four different sites at a time; one request at a time per site

            async def one(r):
                async with sem:
                    try:
                        raw = await fetch_site(r, SETTINGS.active_since, args.tours)
                    except Exception as e:  # noqa: BLE001
                        print(f"  {r['name'][:40]}: failed ({type(e).__name__})")
                        return
                    if raw and raw.posts:
                        (run_dir / "raw" / f"{_safe(raw.handle)}.json").write_text(
                            raw.model_dump_json(indent=1), encoding="utf-8")
            await asyncio.gather(*(one(r) for r in picked))

        asyncio.run(crawl_all())
        crawled = list((run_dir / "raw").glob("*.json"))
        print(f"crawled {len(crawled)} operators with tour pages -> {run_dir}")
        if args.crawl_only:
            print(f"Next: python -m growth process {run_dir}")
            return 0
        from .pipeline import process_run
        from .report import build_report
        summary = process_run(run_dir)
        report = build_report(run_dir)
        print(json.dumps({k: v for k, v in summary.items() if k != "ai_usage"}, indent=1))
        print(f"\nReport: {report}")
        return 0

    if args.cmd in ("directory", "sites"):
        import re as _re

        import httpx

        from .directory import UA, check_sites, tourhub_companies
        ddir = SETTINGS.out_dir / "directory"
        ddir.mkdir(parents=True, exist_ok=True)
        companies_path = ddir / "tourhub-companies.json"
        if args.cmd == "directory":
            idx = httpx.get("https://tourhub.pk/sitemap.xml", headers={"User-Agent": UA}, timeout=30).text
            urls: set[str] = set()
            for loc in _re.findall(r"<loc>(.*?)</loc>", idx):
                if loc.endswith(".xml"):
                    body = httpx.get(loc, headers={"User-Agent": UA}, timeout=30).text
                    urls |= set(_re.findall(r"<loc>(https://tourhub\.pk/companies/[^/?<]+)</loc>", body))
                elif _re.match(r"https://tourhub\.pk/companies/[^/?]+$", loc):
                    urls.add(loc)
            urls_sorted = sorted(urls)[: args.limit or None]
            rows = tourhub_companies(urls_sorted, companies_path)
            with_site = sum(1 for r in rows if r.get("website"))
            print(f"\n{len(rows)} operators; {with_site} list their own website -> {companies_path}")
            return 0
        rows = json.loads(companies_path.read_text(encoding="utf-8"))[: args.limit or None]
        checked = asyncio.run(check_sites(rows))
        out = ddir / f"sites-{datetime.now().strftime('%Y%m%d-%H%M')}.json"
        out.write_text(json.dumps(checked, indent=1, ensure_ascii=False), encoding="utf-8")
        from collections import Counter
        counts = Counter(r["site"]["status"] for r in checked)
        print("\n" + "  ".join(f"{k}: {v}" for k, v in counts.most_common()) + f"\n-> {out}")
        return 0

    if args.cmd == "models":
        from .ai import list_models
        print(f"provider: {SETTINGS.ai_provider}   reader: {SETTINGS.reader_model}   writer: {SETTINGS.writer_model}")
        available = list_models()
        for m in (SETTINGS.reader_model, SETTINGS.writer_model):
            print(f"  {m}: {'available' if m in available else 'NOT available on this key'}")
        print("\nAll models on this key:\n  " + "\n  ".join(available))
        return 0

    if args.cmd == "login":
        from .crawl import login
        return 0 if asyncio.run(login(timeout_min=args.minutes)) else 1

    if args.cmd == "discover":
        from .crawl import discover
        found = asyncio.run(discover(args.queries, args.per_query))
        lo, hi = SETTINGS.followers_min, SETTINGS.followers_max
        in_range = [c for c in found if c.get("followers") and lo <= c["followers"] <= hi]
        SETTINGS.out_dir.mkdir(parents=True, exist_ok=True)
        stamp = datetime.now().strftime("%Y%m%d-%H%M")
        (SETTINGS.out_dir / f"discover-{stamp}.json").write_text(json.dumps(found, indent=1, ensure_ascii=False),
                                                                encoding="utf-8")
        (SETTINGS.out_dir / f"pages-{stamp}.txt").write_text("\n".join(c["url"] for c in in_range), encoding="utf-8")
        for c in sorted(found, key=lambda c: c.get("followers") or 0, reverse=True):
            mark = "IN " if c in in_range else "   "
            print(f"{mark}{(c.get('followers') or 0):>9,}  {c['name'][:50]:50}  {c['url']}")
        print(f"\n{len(in_range)} of {len(found)} pages have {lo:,}-{hi:,} followers -> pages-{stamp}.txt")
        return 0

    from .pipeline import process_run
    from .report import build_report

    if args.cmd == "scan":
        urls = _urls(args)
        if not urls:
            print("No page URLs given.", file=sys.stderr)
            return 2
        from .crawl import crawl_pages
        run_dir = SETTINGS.out_dir / f"run-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
        asyncio.run(crawl_pages(urls, run_dir, args.posts))
        if args.screen:
            from .screen import screen_run
            screen_run(run_dir, keep=args.screen)
    else:
        run_dir = Path(args.run_dir)

    summary = process_run(run_dir)
    report = build_report(run_dir)
    print(json.dumps({k: v for k, v in summary.items() if k != "ai_usage"}, indent=1))
    print(f"\nReport: {report}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
