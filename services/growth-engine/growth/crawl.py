"""Browser work: logging the scraping account in once, searching for pages, crawling them.

All three use the same persistent Chromium profile, so Facebook sees one ordinary device
for one account — not a new device per run.
"""
from __future__ import annotations

import asyncio
import random
import re
from datetime import timedelta
from pathlib import Path

from crawlee import ConcurrencySettings
from crawlee.crawlers import PlaywrightCrawler, PlaywrightCrawlingContext
from playwright.async_api import BrowserContext, async_playwright
from playwright.async_api import Error as PlaywrightError

from .config import SETTINGS
from .sources import SOURCES

PROFILE_DIR = SETTINGS.session_dir / "profile"
FB = "https://www.facebook.com"


async def _logged_in(context: BrowserContext) -> bool:
    return any(c["name"] == "c_user" for c in await context.cookies(FB))


async def login(timeout_min: int = 15, log=print) -> bool:
    """Opens a browser window; the account owner logs in by hand. Credentials never pass
    through this code — only the resulting session is kept, in session/ (git-ignored)."""
    PROFILE_DIR.mkdir(parents=True, exist_ok=True)
    async with async_playwright() as p:
        ctx = await p.chromium.launch_persistent_context(PROFILE_DIR, headless=False,
                                                         channel=SETTINGS.browser_channel)
        page = ctx.pages[0] if ctx.pages else await ctx.new_page()
        if await _logged_in(ctx):
            log("Already logged in.")
            await ctx.close()
            return True
        await page.goto(f"{FB}/login")
        log("Log in to the scraping Facebook account in the browser window...")
        try:
            for _ in range(timeout_min * 30):
                if await _logged_in(ctx):
                    await page.wait_for_timeout(4000)  # let Facebook finish setting the session
                    log("Logged in. Session saved.")
                    await ctx.close()
                    return True
                await asyncio.sleep(2)
        except PlaywrightError:
            log("The browser window was closed before the login finished. Run 'login' again when ready.")
            return False
        await ctx.close()
        log("Timed out waiting for login.")
        return False


async def discover(queries: list[str], per_query: int, log=print) -> list[dict]:
    source = SOURCES["facebook"]
    async with async_playwright() as p:
        ctx = await p.chromium.launch_persistent_context(PROFILE_DIR, headless=SETTINGS.headless,
                                                         channel=SETTINGS.browser_channel)
        if not await _logged_in(ctx):
            await ctx.close()
            raise RuntimeError("Not logged in - run: python -m growth login")
        page = ctx.pages[0] if ctx.pages else await ctx.new_page()
        found: dict[str, dict] = {}
        for q in queries:
            for c in await source.search(page, q, per_query):
                c["query"] = q
                found.setdefault(c["url"], dict(c))
            log(f"'{q}': {len(found)} pages so far")
            await asyncio.sleep(random.uniform(8, 15))
        await ctx.close()
    return list(found.values())


def _safe(name: str) -> str:
    return re.sub(r"[^A-Za-z0-9._-]+", "_", name)[:80] or "page"


async def crawl_pages(urls: list[str], run_dir: Path, posts_wanted: int, source_name: str = "facebook",
                      log=print) -> None:
    source = SOURCES[source_name]
    raw_dir = run_dir / "raw"
    raw_dir.mkdir(parents=True, exist_ok=True)

    crawler = PlaywrightCrawler(
        browser_type="chromium",
        browser_launch_options={"channel": SETTINGS.browser_channel},
        # Crawlee otherwise adds generated headers (User-Agent, Accept-Language, sec-ch-ua) to every
        # request. On Facebook's script CDN that turns script loads into failed CORS preflights and
        # the page never renders. The real Chrome's own headers are the right ones anyway.
        browser_new_context_options={"extra_http_headers": {}},
        user_data_dir=PROFILE_DIR,
        headless=SETTINGS.headless,
        use_incognito_pages=False,
        # Keep the real browser fingerprint: the account logged in on this device.
        fingerprint_generator=None,
        concurrency_settings=ConcurrencySettings(min_concurrency=1, max_concurrency=1,
                                                 desired_concurrency=1, max_tasks_per_minute=2),
        max_request_retries=2,
        retry_on_blocked=False,
        request_handler_timeout=timedelta(minutes=8),
    )

    @crawler.router.default_handler
    async def handle(ctx: PlaywrightCrawlingContext) -> None:
        if not await _logged_in(ctx.page.context):
            raise RuntimeError("Not logged in - run: python -m growth login")
        raw = await source.fetch_page(ctx.page, ctx.request.url, posts_wanted, since=SETTINGS.active_since)
        (raw_dir / f"{_safe(raw.handle)}.json").write_text(raw.model_dump_json(indent=1), encoding="utf-8")
        dated = sorted(p.posted_at for p in raw.posts if p.posted_at)
        log(f"crawled  {raw.handle}: {len(raw.posts)} posts, newest {dated[-1] if dated else 'undated'}")
        await asyncio.sleep(random.uniform(*SETTINGS.page_delay_s))

    await crawler.run(urls)
