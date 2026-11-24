"""Download and keep media. Facebook CDN links expire within days, so listings must use our copy,
and every copy carries its source, attribution and rights status so it can be removed on request."""
from __future__ import annotations

import hashlib
import io
from pathlib import Path

import re

import httpx
from PIL import Image

from .config import SETTINGS
from .models import MediaAsset

_EXT = {"JPEG": "jpg", "PNG": "png", "WEBP": "webp", "GIF": "gif"}
_http = httpx.Client(
    timeout=30,
    follow_redirects=True,
    headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                           "(KHTML, like Gecko) Chrome/131.0 Safari/537.36"},
)


# Some CDNs (e.g. Hostinger's) refuse a browser user agent that sends no client hints but serve
# a plain one; Facebook's CDN prefers the browser one. Try both.
_plain = httpx.Client(timeout=30, follow_redirects=True,
                      headers={"User-Agent": "Mozilla/5.0 (compatible; research-bot/1.0)"})
_WP_SIZE = re.compile(r"-\d{2,4}x\d{2,4}(?=\.(?:jpe?g|png|webp)$)", re.I)


def candidates(url: str) -> list[str]:
    """WordPress serves '-300x200' thumbnails; try the original upload first, then the thumbnail."""
    original = _WP_SIZE.sub("", url)
    return [original, url] if original != url else [url]


def fetch(url: str) -> bytes | None:
    for client in (_http, _plain):
        try:
            r = client.get(url)
            r.raise_for_status()
            if r.headers.get("content-type", "image/").startswith(("image/", "application/octet-stream")):
                return r.content
        except httpx.HTTPError:
            continue
    return None


def store(data: bytes, source_url: str, media_dir: Path, attribution: str) -> MediaAsset | None:
    """Saves an image under its content hash, so the same poster posted twice is stored once
    and duplicate posts can be matched by hash."""
    try:
        img = Image.open(io.BytesIO(data))
        width, height = img.size
        fmt = img.format or "JPEG"
    except Exception:
        return None
    sha = hashlib.sha256(data).hexdigest()
    media_dir.mkdir(parents=True, exist_ok=True)
    path = media_dir / f"{sha[:20]}.{_EXT.get(fmt, 'jpg')}"
    if not path.exists():
        path.write_bytes(data)
    return MediaAsset(
        source_url=source_url,
        sha256=sha,
        stored_path=str(path),
        width=width,
        height=height,
        attribution=attribution,
    )


def usable(asset: MediaAsset) -> bool:
    return min(asset.width or 0, asset.height or 0) >= SETTINGS.min_image_side_px
