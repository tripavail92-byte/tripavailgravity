"""Operator discovery from public directories, then a check of each operator's own website.

  1. tourhub_companies(): read TourHub's public operator directory (tourhub.pk/companies/*) for
     FACTS only — operator name, city, their own website and WhatsApp, how many tours TourHub
     lists. TourHub's robots.txt allows /companies and sets use=reference: we use it to find
     operators, never to copy its listing text. /out/ (its tracking redirect) is never fetched.
  2. check_sites(): visit each operator's OWN website (respecting that site's robots.txt) and
     decide whether it is alive and actively selling trips: newest sitemap date, trip dates on
     the homepage, links to tour pages. "Active" uses the same rule as Facebook: evidence of a
     trip on or after SETTINGS.active_since.

Trips are later read from the operator's own pages (see sources/website.py), not from TourHub.
"""
from __future__ import annotations

import asyncio
import json
import random
import re
import time
from datetime import date
from pathlib import Path
from urllib.parse import urljoin, urlparse
from urllib.robotparser import RobotFileParser

import httpx

from .config import SETTINGS

UA = "Mozilla/5.0 (compatible; research-bot/1.0)"
TOURHUB_OWN = {"923364565061", "tourhubpakistan"}  # TourHub's own phone / social handle on every page

# ─── 1. TourHub directory ──────────────────────────────────────────────────────


def _json_after(html: str, key: str):
    """Decode the JSON value that follows `"key":` in an embedded page-props blob."""
    i = html.find(f'"{key}":')
    if i < 0:
        return None
    try:
        value, _ = json.JSONDecoder().raw_decode(html, i + len(key) + 3)
        return value
    except ValueError:
        return None


_MONTHS = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split()


def _month_year(text: str | None) -> str | None:
    m = re.search(r"\b([A-Z][a-z]{2})[a-z]*\.? (\d{4})", text or "")
    if not m or m.group(1) not in _MONTHS:
        return None
    return f"{m.group(2)}-{_MONTHS.index(m.group(1)) + 1:02d}"


def parse_tourhub_company(url: str, html: str) -> dict | None:
    co = _json_after(html, "company")
    if not isinstance(co, dict) or not co.get("name"):
        return None
    stats = _json_after(html, "stats") or {}
    contact = co.get("contact") or {}
    desc = co.get("description") or ""
    listed = re.search(r"Listed since ([A-Z][a-z]+ \d{4})", desc)
    checked = re.search(r"last checked (\d{1,2} [A-Z][a-z]+ \d{4})", desc)
    socials = [s for s in (co.get("socials") or []) if isinstance(s, str) and not any(t in s for t in TOURHUB_OWN)]
    wa = re.sub(r"\D", "", contact.get("whatsapp") or "")
    return {
        "source": "tourhub",
        "directory_url": url,
        "name": co["name"].strip(),
        "city": (co.get("city") or "").strip() or None,
        "address": (co.get("address") or "").strip() or None,
        "website": (contact.get("website") or "").strip() or None,
        "whatsapp": f"+{wa}" if wa and wa not in TOURHUB_OWN else None,
        "socials": socials,
        "tours_on_directory": stats.get("tours"),
        "destinations": stats.get("destinationNames") or [],
        "directory_verified": bool(co.get("verified")),
        "directory_claimed": bool(co.get("claimed")),
        "listed_since": _month_year(listed.group(1)) if listed else None,
        "last_checked": checked.group(1) if checked else None,
    }


def tourhub_companies(urls: list[str], out_path: Path, delay=(1.5, 3.0)) -> list[dict]:
    """Fetch each company page politely (one at a time) and keep the facts. Resumable."""
    done: dict[str, dict] = {}
    if out_path.exists():
        done = {c["directory_url"]: c for c in json.loads(out_path.read_text(encoding="utf-8"))}
    todo = [u for u in urls if u not in done]
    print(f"{len(done)} already fetched, {len(todo)} to go")
    with httpx.Client(headers={"User-Agent": UA}, timeout=30, follow_redirects=True) as client:
        for n, url in enumerate(todo, 1):
            try:
                r = client.get(url)
                row = parse_tourhub_company(url, r.text) if r.status_code == 200 else None
                if row:
                    done[url] = row
                    print(f"[{n}/{len(todo)}] {row['name'][:45]:45} {row['website'] or '-'}")
                else:
                    print(f"[{n}/{len(todo)}] {url} -> HTTP {r.status_code}, no company data")
            except httpx.HTTPError as e:
                print(f"[{n}/{len(todo)}] {url} -> {type(e).__name__}")
            if n % 10 == 0 or n == len(todo):
                out_path.write_text(json.dumps(list(done.values()), indent=1, ensure_ascii=False), encoding="utf-8")
            time.sleep(random.uniform(*delay))
    out_path.write_text(json.dumps(list(done.values()), indent=1, ensure_ascii=False), encoding="utf-8")
    return list(done.values())


# ─── 2. Operator websites: alive? actively selling trips? ─────────────────────

PARKED = re.compile(
    r"(?i)domain (is )?for sale|buy this domain|this domain (has expired|is parked)|parked (free|domain)|"
    r"account (has been )?suspended|website (is )?under construction|coming soon|index of /|"
    r"default web site page|hostinger.{0,40}(parked|domain)",
)
TOUR_PATH = re.compile(r"(?i)/(tours?|trips?|packages?|itinerar(y|ies)|expeditions?|treks?|holidays?)(/|-|$)")
_MON = {m.lower(): i + 1 for i, m in enumerate(_MONTHS)}
_DATE_PATTERNS = [
    # 15 Dec 2026 / 15th December, 2026
    (re.compile(r"\b(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]{3,9})\.?,?\s+(20\d\d)\b"), ("d", "m", "y")),
    # Dec 15, 2026
    (re.compile(r"\b([A-Za-z]{3,9})\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(20\d\d)\b"), ("m", "d", "y")),
    # 2026-12-15
    (re.compile(r"\b(20\d\d)-(\d{2})-(\d{2})\b"), ("y", "mn", "d")),
    # 15/12/2026 or 15-12-2026 (Pakistan writes day first)
    (re.compile(r"\b(\d{1,2})[/.-](\d{1,2})[/.-](20\d\d)\b"), ("d", "mn", "y")),
]


def find_dates(text: str) -> list[date]:
    out = []
    for rx, order in _DATE_PATTERNS:
        for m in rx.finditer(text):
            parts = dict(zip(order, m.groups()))
            try:
                month = int(parts["mn"]) if "mn" in parts else _MON.get(parts["m"][:3].lower())
                if not month:
                    continue
                out.append(date(int(parts["y"]), month, int(parts["d"])))
            except (ValueError, KeyError):
                continue
    return [d for d in out if 2018 <= d.year <= 2028]


def _text(html: str) -> str:
    from html import unescape

    html = re.sub(r"(?is)<(script|style|noscript|svg)[^>]*>.*?</\1>", " ", html)
    return re.sub(r"\s+", " ", unescape(re.sub(r"<[^>]+>", " ", html)))


def _links(html: str, base: str) -> list[str]:
    return [urljoin(base, h) for h in re.findall(r'href=["\']([^"\'#]+)', html)]


async def _robots(client: httpx.AsyncClient, root: str) -> tuple[RobotFileParser, list[str]]:
    rp = RobotFileParser()
    sitemaps: list[str] = []
    try:
        r = await client.get(urljoin(root, "/robots.txt"))
        body = r.text if r.status_code == 200 else ""
    except httpx.HTTPError:
        body = ""
    rp.parse(body.splitlines())
    sitemaps = re.findall(r"(?im)^\s*sitemap:\s*(\S+)", body)
    return rp, sitemaps


async def _sitemap_info(client: httpx.AsyncClient, root: str, declared: list[str]) -> dict:
    """Newest <lastmod> and tour-like URLs across the site's sitemaps (one level of index)."""
    candidates = declared or [urljoin(root, p) for p in ("/sitemap.xml", "/sitemap_index.xml", "/wp-sitemap.xml")]
    seen, lastmods, urls, tour_lastmods = set(), [], [], []
    lastmod_of: dict[str, str | None] = {}
    queue = list(dict.fromkeys(candidates))[:6]
    while queue and len(seen) < 12:
        sm = queue.pop(0)
        if sm in seen:
            continue
        seen.add(sm)
        try:
            r = await client.get(sm)
        except httpx.HTTPError:
            continue
        if r.status_code != 200 or "<" not in r.text[:200]:
            continue
        body = r.text
        lastmods += re.findall(r"<lastmod>\s*(\d{4}-\d{2}-\d{2})", body)
        locs = re.findall(r"<loc>\s*([^<\s]+)", body)
        if "<sitemapindex" in body:
            # Prefer child sitemaps that hold tours/posts/pages; skip images/authors.
            kids = sorted(locs, key=lambda u: (not TOUR_PATH.search(u) and "post" not in u and "page" not in u))
            queue += [k for k in kids if not re.search(r"(?i)image|author|category|tag", k)][:6]
        else:
            urls += locs
            for block in re.findall(r"(?s)<url>(.*?)</url>", body):
                loc = re.search(r"<loc>\s*([^<\s]+)", block)
                mod = re.search(r"<lastmod>\s*(\d{4}-\d{2}-\d{2})", block)
                if loc and TOUR_PATH.search(urlparse(loc.group(1)).path):
                    lastmod_of[loc.group(1)] = mod.group(1) if mod else None
                    if mod:
                        tour_lastmods.append(mod.group(1))
    tourish = [u for u in dict.fromkeys(urls) if TOUR_PATH.search(urlparse(u).path)]
    return {
        "sitemap_found": bool(seen and (lastmods or urls)),
        "sitemap_newest": max(lastmods) if lastmods else None,
        "tour_pages_newest": max(tour_lastmods) if tour_lastmods else None,
        "sitemap_urls": len(set(urls)),
        "tour_urls": tourish[:300],
        "tour_lastmod": lastmod_of,
    }


async def check_site(client: httpx.AsyncClient, row: dict, since: date) -> dict:
    site = row.get("website")
    res: dict = {"status": "no_website", "checked_on": date.today().isoformat()}
    if not site:
        return res
    if not site.startswith("http"):
        site = "https://" + site
    host = urlparse(site).netloc.lower()
    if any(s in host for s in ("facebook.com", "instagram.com", "wa.me", "linktr.ee", "tiktok.com")):
        return {**res, "status": "social_only", "final_url": site}
    try:
        r = await client.get(site)
    except httpx.HTTPError as e:
        return {**res, "status": "dead", "error": type(e).__name__}
    final = str(r.url)
    res.update(final_url=final, http=r.status_code)
    if r.status_code >= 400:
        return {**res, "status": "dead"}
    html = r.text
    text = _text(html)
    title = re.search(r"(?is)<title[^>]*>(.*?)</title>", html)
    res["title"] = re.sub(r"\s+", " ", title.group(1)).strip()[:120] if title else None
    # Only a near-empty page counts as parked; real sites can say "coming soon" about a new tour.
    if len(text) < 1500 and PARKED.search(text):
        return {**res, "status": "parked"}

    root = f"{urlparse(final).scheme}://{urlparse(final).netloc}"
    rp, declared = await _robots(client, root)
    if not rp.can_fetch(UA, final):
        return {**res, "status": "robots_disallow"}

    links = _links(html, final)
    same = [u for u in links if urlparse(u).netloc == urlparse(final).netloc]
    res["socials"] = sorted({
        u if "profile.php" in u else u.split("?")[0].rstrip("/")
        for u in links
        if re.search(r"(?i)(facebook|instagram|tiktok|youtube)\.com/(?!sharer|share|intent|plugins|tr\?|$)[\w@.\-]{2,}", u)
    })[:6]
    sm = await _sitemap_info(client, root, declared)
    tour_links = list(dict.fromkeys([u for u in same if TOUR_PATH.search(urlparse(u).path)] + sm["tour_urls"]))
    tour_links = [u for u in tour_links if rp.can_fetch(UA, u)]
    dates = find_dates(text)
    upcoming = sorted({d for d in dates if d >= since})
    copyright_year = max((int(y) for y in re.findall(r"(?i)(?:©|&copy;|copyright)\s*(?:\d{4}\s*[-–]\s*)?(20\d\d)", html)), default=None)
    res.update(
        sitemap_found=sm["sitemap_found"],
        sitemap_newest=sm["sitemap_newest"],
        tour_pages_newest=sm["tour_pages_newest"],
        sitemap_urls=sm["sitemap_urls"],
        tour_links=len(tour_links),
        sample_tour_links=tour_links[:15],
        dates_on_home=[d.isoformat() for d in upcoming[:8]],
        newest_date_on_home=max(dates).isoformat() if dates else None,
        copyright_year=copyright_year,
    )
    # Activity: the same bar as Facebook — some evidence of a trip on/after `since`.
    s = since.isoformat()
    trip_evidence, site_evidence = [], []
    if sm["tour_pages_newest"] and sm["tour_pages_newest"] >= s:
        trip_evidence.append(f"tour pages updated {sm['tour_pages_newest']}")
    if upcoming:
        trip_evidence.append(f"trip dates on home page up to {upcoming[-1].isoformat()}")
    if re.search(r"\b2027\b", text):
        trip_evidence.append("mentions 2027")
    if sm["sitemap_newest"] and sm["sitemap_newest"] >= s:
        site_evidence.append(f"site updated {sm['sitemap_newest']}")
    res["evidence"] = trip_evidence + site_evidence
    newest = max(filter(None, [sm["sitemap_newest"], sm["tour_pages_newest"]]), default=None)
    if not tour_links:
        res["status"] = "live_no_tours"
    elif trip_evidence:
        res["status"] = "active"
    elif site_evidence:
        res["status"] = "recently_updated"  # site edited since `since`; the trip reader confirms dates
    elif newest and newest < s:
        res["status"] = "stale"
    else:
        res["status"] = "unclear"  # live with tour pages, no dates on the surface: the trip reader decides
    return res


async def check_sites(rows: list[dict], since: date | None = None, concurrency: int = 8) -> list[dict]:
    since = since or date.fromisoformat(SETTINGS.active_since)
    sem = asyncio.Semaphore(concurrency)
    limits = httpx.Limits(max_connections=concurrency * 2)
    async with httpx.AsyncClient(headers={"User-Agent": UA}, timeout=20, follow_redirects=True,
                                 limits=limits, verify=False) as client:
        async def one(row):
            async with sem:
                try:
                    row["site"] = await asyncio.wait_for(check_site(client, row, since), timeout=90)
                except Exception as e:  # noqa: BLE001 — one bad site must not stop the batch
                    row["site"] = {"status": "error", "error": f"{type(e).__name__}: {e}"[:200]}
                s = row["site"]
                print(f"{s['status']:16} {row['name'][:40]:40} {row.get('website') or ''}  {'; '.join(s.get('evidence', []))}")
                return row
        return await asyncio.gather(*(one(r) for r in rows))
