"""Instagram source — deliberately not built in the pilot.

Planned implementation: Instaloader (public business profiles) behind the same Source interface,
so the reader, validation, writer and pipeline need no changes when it is added.
"""
from __future__ import annotations

from playwright.async_api import Page

from ..models import RawPage
from .base import Candidate


class InstagramSource:
    name = "instagram"

    async def fetch_page(self, page: Page, url: str, posts_wanted: int, since: str | None = None) -> RawPage:
        raise NotImplementedError("Instagram is phase 2 - Facebook first")

    async def search(self, page: Page, query: str, limit: int) -> list[Candidate]:
        raise NotImplementedError("Instagram is phase 2 - Facebook first")
