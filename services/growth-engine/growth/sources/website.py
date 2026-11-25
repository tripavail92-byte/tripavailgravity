"""Operator websites as a trip source.

Reads an operator's own site the way their customers see it: the home and about pages for the
business profile, and each tour page as one "post" (page text + photos). Produces the same RawPage
the Facebook crawler produces, so extraction, validation, de-duplication and listing-writing run
unchanged. Plain HTTP (no browser): most operator sites are WordPress and render server-side.

Politeness: the site's robots.txt is honoured for every URL, one request at a time per site with a
pause between pages, and at most `max_tours` tour pages per operator (newest first).
"""
from __future__ import annotations

import asyncio
import random
import re
from datetime import date
from html import unescape
from urllib.parse import urljoin, urlparse

import httpx

from ..directory import TOUR_PATH, UA, _links, _robots, _sitemap_info, _text
from ..models import RawPage, RawPost

# Listing/archive pages, not a single trip.
NOT_A_TOUR = re.compile(
    r"(?i)/(tags?|tour-tags?|categor(y|ies)|tour-categor(y|ies)|tour-types?|destinations?|regions?|"
    r"page/\d+|author|feed|wp-json|cart|checkout|my-account|search)(/|$)|\?",
)
LISTING_ROOT = re.compile(r"(?i)^/(tours?|trips?|packages?|tour-packages?|expeditions?|treks?|holidays?)/?$")
CHROME = re.compile(r"(?is)<(header|nav|footer|aside|form)\b[^>]*>.*?</\1>")
JUNK_IMG = re.compile(r"(?i)logo|icon|avatar|sprite|placeholder|loader|payment|flag|badge|\.svg|\.gif|data:")
# A site-wide sharing image (og.png, og-image.jpg, social-share.png, default.jpg) is branding, not a
# photo of this trip — it put a big logo on a trip card.
GENERIC_SHARE_IMG = re.compile(r"(?i)/(og|og[-_]?image|opengraph|social([-_]share)?|share|default([-_]image)?|cover[-_]?image|site[-_]?image)[-_0-9]*\.(png|jpe?g|webp)(\?|$)")


def _meta(html: str, prop: str) -> str | None:
    m = re.search(rf'(?i)<meta[^>]+(?:property|name)=["\']{re.escape(prop)}["\'][^>]+content=["\']([^"\']+)', html) \
        or re.search(rf'(?i)<meta[^>]+content=["\']([^"\']+)["\'][^>]+(?:property|name)=["\']{re.escape(prop)}["\']', html)
    return unescape(m.group(1)).strip() if m else None


def _images(html: str, base: str, limit: int) -> list[str]:
    found: list[str] = []
    og = _meta(html, "og:image")
    if og and not JUNK_IMG.search(og) and not GENERIC_SHARE_IMG.search(urljoin(base, og)):
        found.append(urljoin(base, og))
    body = CHROME.sub(" ", html)
    for tag in re.findall(r"(?is)<img\b[^>]*>", body):
        src = None
        for attr in ("data-lazy-src", "data-src", "data-original", "src"):
            m = re.search(rf'{attr}=["\']([^"\']+)', tag)
            if m and not m.group(1).startswith("data:"):
                src = m.group(1)
                break
        if not src:
            m = re.search(r'srcset=["\']([^"\'\s,]+)', tag)
            src = m.group(1) if m else None
        if not src or JUNK_IMG.search(src) or JUNK_IMG.search(tag[:300]):
            continue
        w = re.search(r'width=["\']?(\d+)', tag)
        if w and int(w.group(1)) < 300:
            continue
        found.append(urljoin(base, src))
    return list(dict.fromkeys(found))[:limit]


def _logo(html: str, base: str) -> str | None:
    for tag in re.findall(r"(?is)<img\b[^>]*>", html):
        if re.search(r"(?i)logo", tag):
            m = re.search(r'(?:data-src|src)=["\']([^"\']+)', tag)
            if m and not m.group(1).startswith("data:"):
                return urljoin(base, m.group(1))
    m = re.search(r'(?i)<link[^>]+rel=["\'][^"\']*apple-touch-icon[^"\']*["\'][^>]+href=["\']([^"\']+)', html)
    return urljoin(base, m.group(1)) if m else None


def pick_tour_urls(home_links: list[str], sitemap: dict, host: str, since: str, max_tours: int) -> tuple[list[tuple[str, str | None]], int]:
    """Single-trip pages, newest first. Returns ([(url, lastmod)], skipped_as_old)."""
    lastmod = sitemap.get("tour_lastmod", {})
    pool = list(dict.fromkeys([*lastmod.keys(), *home_links]))
    picked, old = [], 0
    for u in pool:
        p = urlparse(u)
        if p.netloc.lower() != host or not TOUR_PATH.search(p.path) or NOT_A_TOUR.search(u) or LISTING_ROOT.match(p.path):
            continue
        slug = p.path.rstrip("/").rsplit("/", 1)[-1]
        if len(slug) < 6 or "-" not in slug:
            continue  # "/tours/asia" style listing pages, not one trip
        lm = lastmod.get(u)
        if lm and lm < since:
            old += 1
            continue
        picked.append((u.split("#")[0], lm))
    picked.sort(key=lambda x: x[1] or "", reverse=True)
    return picked[:max_tours], old


async def fetch_site(row: dict, since: str, max_tours: int = 10, delay=(1.0, 2.5), log=print) -> RawPage | None:
    site = (row.get("site") or {}).get("final_url") or row.get("website")
    if not site:
        return None
    async with httpx.AsyncClient(headers={"User-Agent": UA}, timeout=25, follow_redirects=True, verify=False) as client:
        r = await client.get(site)
        if r.status_code >= 400:
            return None
        home_url, home = str(r.url), r.text
        host = urlparse(home_url).netloc.lower()
        root = f"{urlparse(home_url).scheme}://{host}"
        rp, declared = await _robots(client, root)
        sitemap = await _sitemap_info(client, root, declared)

        about_text = ""
        about = next((u for u in _links(home, home_url) if urlparse(u).netloc.lower() == host
                      and re.search(r"(?i)/(about|about-us|who-we-are|company)/?$", urlparse(u).path)), None)
        if about and rp.can_fetch(UA, about):
            await asyncio.sleep(random.uniform(*delay))
            try:
                ar = await client.get(about)
                if ar.status_code == 200:
                    about_text = _text(CHROME.sub(" ", ar.text))[:5000]
            except httpx.HTTPError:
                pass

        # Facts the directory listed for this operator (their own contact details), then their site.
        known = [f"Business name: {row['name']}"]
        if row.get("city"):
            known.append(f"City: {row['city']}")
        if row.get("address"):
            known.append(f"Address: {row['address']}")
        if row.get("whatsapp"):
            known.append(f"WhatsApp: {row['whatsapp']}")
        known.append(f"Website: {home_url}")
        page_text = ("Contact details listed for this business:\n" + "\n".join(known)
                     + f"\n\nHome page ({home_url}):\n{_text(home)[:7000]}"
                     + (f"\n\nAbout page ({about}):\n{about_text}" if about_text else ""))

        tour_urls, skipped_old = pick_tour_urls(_links(home, home_url), sitemap, host, since, max_tours)
        log(f"  {row['name'][:40]}: {len(tour_urls)} tour pages to read ({skipped_old} older than {since} skipped)")
        posts: list[RawPost] = []
        for url, lm in tour_urls:
            if not rp.can_fetch(UA, url):
                continue
            await asyncio.sleep(random.uniform(*delay))
            try:
                tr = await client.get(url)
            except httpx.HTTPError:
                continue
            if tr.status_code != 200 or "text/html" not in tr.headers.get("content-type", "text/html"):
                continue
            html = tr.text
            title = _meta(html, "og:title") or (re.search(r"(?is)<h1[^>]*>(.*?)</h1>", html) or [None, ""])[1]
            title = re.sub(r"<[^>]+>|\s+", " ", unescape(title or "")).strip()
            modified = (_meta(html, "article:modified_time") or "")[:10] or lm
            main = _text(CHROME.sub(" ", html))[:9000]
            posts.append(RawPost(
                source="website",
                post_url=str(tr.url),
                posted_text=f"page updated {modified}" if modified else None,
                posted_at=modified or None,
                caption=f"Tour page: {title}\nURL: {tr.url}\n\n{main}",
                image_urls=_images(html, str(tr.url), 6),
            ))
    return RawPage(
        source="website",
        page_url=home_url,
        handle=host.removeprefix("www."),
        page_text=page_text,
        profile_image_url=_logo(home, home_url),
        cover_image_url=_meta(home, "og:image") and urljoin(home_url, _meta(home, "og:image")),
        posts=posts,
    )


def today_iso() -> str:
    return date.today().isoformat()
