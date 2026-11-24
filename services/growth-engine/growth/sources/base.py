"""The one interface every data source implements. Facebook is the first; Instagram, operator
websites and directories plug in by implementing the same two methods."""
from __future__ import annotations

from typing import Protocol

from playwright.async_api import Page

from ..models import RawPage


class Candidate(dict):
    """A page found by search: {source, name, url, followers, snippet}."""


class Source(Protocol):
    name: str

    async def fetch_page(self, page: Page, url: str, posts_wanted: int, since: str | None = None) -> RawPage:
        """Open one business page and return its profile text, images and recent posts.
        `since` (YYYY-MM-DD) lets a source stop early once posts are older than it."""
        ...

    async def search(self, page: Page, query: str, limit: int) -> list[Candidate]:
        """Find candidate business pages for a search phrase."""
        ...
