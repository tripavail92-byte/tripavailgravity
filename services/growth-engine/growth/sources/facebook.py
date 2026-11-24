"""Facebook pages via a logged-in browser.

Relies on ARIA roles and meta tags, which Facebook keeps stable for accessibility, rather than
its generated CSS class names, which change constantly. Everything content-specific (what is a
phone number, what is a trip) is left to Claude.
"""
from __future__ import annotations

import calendar
import random
import re
import unicodedata
from datetime import date
from urllib.parse import parse_qs, quote, urlparse

from playwright.async_api import Page

from ..models import RawPage, RawPost
from .base import Candidate

FB = "https://www.facebook.com"

_EXPAND_SEE_MORE_JS = r"""
() => {
  let n = 0;
  for (const b of document.querySelectorAll('[role="button"]')) {
    if (/^\s*See more\s*$/i.test(b.innerText || '') && b.closest('[role="article"], [aria-posinset]')) {
      b.click(); n++;
    }
  }
  return n;
}
"""

_PROFILE_PIC_JS = r"""
() => {
  const main = document.querySelector('[role="main"]') || document.body;
  const img = main.querySelector('svg image');
  return img ? (img.getAttribute('xlink:href') || img.getAttribute('href')) : null;
}
"""

# Logged in, the cover has no alt text: it is the widest Facebook image at the top of the page.
_COVER_JS = r"""
() => {
  const main = document.querySelector('[role="main"]') || document.body;
  const top = [...main.querySelectorAll('img')]
    .filter(i => /scontent|fbcdn/.test(i.src) && i.naturalWidth >= 600 && i.getBoundingClientRect().top < 600)
    .sort((a, b) => b.naturalWidth - a.naturalWidth);
  return top.length ? top[0].src : null;
}
"""

# Lines Facebook mixes into post text: obfuscated labels, buttons, and the viewer's own name
# ("Comment as ...") — which must never be stored.
_NOISE_LINES = {"facebook", "·", "like", "comment", "share", "send", "follow", "see more", "see less",
                "ai content", "all reactions:", "most relevant", "write a comment…", "write a comment..."}


def clean_text(text: str) -> str:
    # NFKC turns the 'fancy' Unicode operators use for emphasis (𝟓 𝐃𝐚𝐲𝐬) into plain text, so
    # prices and day counts are readable by the deterministic checks. U+034F is the invisible
    # joiner Facebook uses to scramble its labels into one-character lines.
    text = unicodedata.normalize("NFKC", text or "").replace("͏", "")
    keep = []
    for line in text.splitlines():
        s = line.strip()
        if len(s) <= 2 or s.lower() in _NOISE_LINES or s.lower().startswith(("comment as ", "reply as ")):
            continue
        keep.append(s)
    return "\n".join(keep)

_SEARCH_RESULTS_JS = r"""
() => {
  const main = document.querySelector('[role="main"]') || document.body;
  const out = [];
  for (const a of main.querySelectorAll('a[href*="facebook.com/"]')) {
    const name = (a.innerText || '').trim();
    if (!name || name.length > 120) continue;
    let box = a;
    for (let i = 0; i < 8 && box && !/followers/i.test(box.innerText || ''); i++) box = box.parentElement;
    if (!box || !/followers/i.test(box.innerText || '')) continue;
    out.push({ name, href: a.href.split('?')[0], snippet: (box.innerText || '').slice(0, 400) });
  }
  return out;
}
"""


_POST_DATA_JS = r"""
el => {
  const imgs = [...el.querySelectorAll('img')]
    .filter(i => (i.naturalWidth || i.width) >= 300 && /scontent|fbcdn/.test(i.src)).map(i => i.src);
  const photo = [...el.querySelectorAll('a[href]')].find(a => /\/photos?\/|photo\.php|\/videos\/|\/reel\//.test(a.href));
  return { text: (el.innerText || '').slice(0, 8000), imgs: [...new Set(imgs)], photo: photo ? photo.href : null };
}
"""

_MONTHS = {m.lower(): i for i, m in enumerate(calendar.month_name) if m}
_MONTHS.update({m.lower(): i for i, m in enumerate(calendar.month_abbr) if m})


def parse_fb_date(text: str | None) -> date | None:
    """'Thursday, July 14, 2022 at 11:41 PM' or '14 July 2022 at 23:41' -> date."""
    s = (text or "").replace(" ", " ")
    for rx, order in ((r"([A-Za-z]+)\.?\s+(\d{1,2}),?\s+(\d{4})", "mdy"), (r"(\d{1,2})\s+([A-Za-z]+)\.?,?\s+(\d{4})", "dmy")):
        for m in re.finditer(rx, s):
            mon, day = (m.group(1), m.group(2)) if order == "mdy" else (m.group(2), m.group(1))
            if mon.lower() in _MONTHS:
                try:
                    return date(int(m.group(3)), _MONTHS[mon.lower()], int(day))
                except ValueError:
                    continue
    return None


def _clean_url(href: str | None) -> str | None:
    if not href:
        return None
    try:
        u = urlparse(href)
        keep = {k: v for k, v in parse_qs(u.query).items() if k in ("fbid", "story_fbid", "id", "v", "set")}
        q = "&".join(f"{k}={v[0]}" for k, v in keep.items())
        return f"{u.scheme}://{u.netloc}{u.path}" + (f"?{q}" if q else "")
    except ValueError:
        return href


async def _read_timestamp(page: Page, post) -> tuple[str | None, str | None]:
    """Facebook scrambles the visible timestamp; hovering its link reveals the full date in a
    tooltip and swaps in the real post URL. Returns (tooltip text, post URL)."""
    for a in (await post.query_selector_all("a"))[:6]:
        href = await a.get_attribute("href") or ""
        if not (href.startswith("?") or href.startswith("#") or "/posts/" in href
                or "/permalink/" in href or "story_fbid" in href):
            continue
        try:
            await a.hover(timeout=3000)
            await page.wait_for_timeout(700)
            tip = await page.query_selector('[role="tooltip"]')
            tip_text = (await tip.inner_text()).strip() if tip else None
            real = await a.get_attribute("href")
            await page.mouse.move(5, 5)
            if tip_text and parse_fb_date(tip_text):
                return tip_text, _clean_url(real) if real and real.startswith("http") else None
        except Exception:
            continue
    return None, None


def _handle(url: str) -> str:
    path = urlparse(url).path.strip("/")
    if path.startswith("profile.php"):
        return url
    return path.split("/")[0] if path else url


def parse_followers(text: str) -> int | None:
    m = re.search(r"([\d.,]+)\s*([KkMm])?\s*followers", text)
    if not m:
        return None
    n = float(m.group(1).replace(",", ""))
    mult = {"k": 1_000, "m": 1_000_000}.get((m.group(2) or "").lower(), 1)
    return int(n * mult)


async def _pause(page: Page, lo: float = 1.2, hi: float = 2.8) -> None:
    await page.wait_for_timeout(int(random.uniform(lo, hi) * 1000))


async def _meta(page: Page, prop: str) -> str | None:
    el = await page.query_selector(f'meta[property="{prop}"]')
    return await el.get_attribute("content") if el else None


class FacebookSource:
    name = "facebook"

    async def fetch_page(self, page: Page, url: str, posts_wanted: int, since: str | None = None) -> RawPage:
        await page.goto(url, wait_until="domcontentloaded", timeout=60_000)
        # Facebook only renders posts near the visible screen; a background tab renders none.
        await page.bring_to_front()
        await _pause(page, 4, 6)

        profile_image = await page.evaluate(_PROFILE_PIC_JS) or await _meta(page, "og:image")
        cover_image = await page.evaluate(_COVER_JS)
        page_text = clean_text(await page.evaluate(
            "() => ((document.querySelector('[role=\"main\"]') || document.body).innerText || '').slice(0, 15000)"
        ))

        # The feed is virtualised: posts render only near the screen and leave the DOM as you
        # scroll, so collect (and date) them while scrolling. Posts are newest-first after any
        # pinned ones, so a run of posts older than the cutoff means the rest are older too.
        cutoff = date.fromisoformat(since) if since else None
        seen: dict[str, RawPost] = {}
        stale_rounds = old_in_a_row = 0
        for _ in range(30):
            await page.evaluate(_EXPAND_SEE_MORE_JS)
            await _pause(page, 0.6, 1.2)
            before = len(seen)
            posts = await page.query_selector_all('[aria-posinset]') or await page.query_selector_all('[role="article"]')
            for el in posts:
                p = await el.evaluate(_POST_DATA_JS)
                text = clean_text(p.get("text") or "")
                if len(text) < 40 and not p.get("imgs"):
                    continue  # an unrendered placeholder
                key = _clean_url(p.get("photo")) or str(hash(text[:400]))
                if key in seen:
                    continue
                tip, real_url = await _read_timestamp(page, el)
                posted = parse_fb_date(tip)
                seen[key] = RawPost(
                    source=self.name,
                    post_url=real_url or _clean_url(p.get("photo")),
                    posted_text=tip,
                    posted_at=posted.isoformat() if posted else None,
                    caption=text,
                    image_urls=p.get("imgs") or [],
                )
                if cutoff and posted:
                    old_in_a_row = old_in_a_row + 1 if posted < cutoff else 0
            if len(seen) >= posts_wanted or (cutoff and old_in_a_row >= 3):
                break
            stale_rounds = stale_rounds + 1 if len(seen) == before else 0
            if stale_rounds >= 4:
                break
            await page.mouse.wheel(0, random.randint(700, 1100))
            await _pause(page)

        return RawPage(
            source=self.name,
            page_url=page.url.split("?")[0],
            handle=_handle(page.url),
            page_text=page_text,
            profile_image_url=profile_image,
            cover_image_url=cover_image,
            posts=list(seen.values())[:posts_wanted],
        )

    async def search(self, page: Page, query: str, limit: int) -> list[Candidate]:
        await page.goto(f"{FB}/search/pages/?q={quote(query)}", wait_until="domcontentloaded", timeout=60_000)
        await _pause(page, 3, 5)
        found: dict[str, Candidate] = {}
        for _ in range(12):
            for r in await page.evaluate(_SEARCH_RESULTS_JS):
                href = r["href"]
                if "/search/" in href or href in found:
                    continue
                found[href] = Candidate(
                    source=self.name,
                    name=r["name"],
                    url=href,
                    followers=parse_followers(r["snippet"]),
                    snippet=r["snippet"],
                )
            if len(found) >= limit:
                break
            await page.mouse.wheel(0, random.randint(800, 1200))
            await _pause(page, 1.5, 3)
        return list(found.values())[:limit]
