"""One structured call, two providers. Prompts live in reader.py and writer.py; this only sends them.

GROWTH_AI_PROVIDER picks the provider ('openai' or 'anthropic'); without it, OpenAI is used when
only OPENAI_API_KEY is set. Both return the same validated Pydantic objects, so validation,
dedupe and the report never know which model answered.
"""
from __future__ import annotations

import base64
import threading
from typing import TypeVar

from pydantic import BaseModel

from .config import SETTINGS

T = TypeVar("T", bound=BaseModel)


class ModelDeclined(Exception):
    """The model refused — the item goes to manual review."""


# Real token usage per model across a run, so the pilot reports its actual cost.
USAGE: dict[str, dict[str, int]] = {}
_usage_lock = threading.Lock()  # posts are read in parallel threads


def _track(model: str, input_tokens: int | None, output_tokens: int | None) -> None:
    with _usage_lock:
        u = USAGE.setdefault(model, {"calls": 0, "input_tokens": 0, "output_tokens": 0})
        u["calls"] += 1
        u["input_tokens"] += input_tokens or 0
        u["output_tokens"] += output_tokens or 0


def is_fatal(exc: Exception) -> bool:
    """Errors that will hit every call (bad key, no access) — stop the run rather than
    sending every post to review."""
    if type(exc).__name__ in ("AuthenticationError", "PermissionDeniedError", "NotFoundError"):
        return True
    # An empty account (OpenAI "insufficient_quota" / "no credits", Anthropic "credit balance") fails
    # every later call too; plain rate limiting is retried by the SDK and is not fatal.
    msg = str(exc).lower()
    return any(s in msg for s in ("insufficient_quota", "no credits remaining", "credit balance is too low"))


def _media_type(data: bytes) -> str | None:
    if data[:3] == b"\xff\xd8\xff":
        return "image/jpeg"
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        return "image/png"
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "image/webp"
    if data[:6] in (b"GIF87a", b"GIF89a"):
        return "image/gif"
    return None


def _images(images: list[bytes]) -> list[tuple[str, str]]:
    out = []
    for data in images:
        mt = _media_type(data)
        if mt and len(data) <= 5_000_000:
            out.append((mt, base64.standard_b64encode(data).decode()))
    return out


def _cache_path(model, system, text, schema, images, effort):
    import hashlib
    import json as _json

    h = hashlib.sha256()
    for part in (SETTINGS.ai_provider, model, system, text, effort or "",
                 _json.dumps(schema.model_json_schema(), sort_keys=True)):
        h.update(part.encode("utf-8"))
        h.update(b"\0")
    for data in images:
        h.update(hashlib.sha256(data).digest())
    return SETTINGS.out_dir / ".ai-cache" / f"{h.hexdigest()}.json"


def parse(*, model: str, system: str, text: str, schema: type[T], images: list[bytes] | None = None,
          effort: str | None = None, fallback: bool = False, max_tokens: int = 16000) -> T:
    """Structured call, cached on disk by exact input: re-running a crawl after a code fix costs
    nothing, while any prompt or schema change misses the cache and re-asks the model."""
    images = images or []
    path = _cache_path(model, system, text, schema, images, effort)
    if path.exists():
        try:
            return schema.model_validate_json(path.read_text(encoding="utf-8"))
        except ValueError:
            pass  # stale shape: ask again
    if SETTINGS.ai_provider == "openai":
        out = _openai(model, system, text, schema, images, effort, max_tokens)
    else:
        out = _anthropic(model, system, text, schema, images, effort, fallback, max_tokens)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(out.model_dump_json(), encoding="utf-8")
    return out


# ── OpenAI (Responses API) ──────────────────────────────────────────────────

_openai_client = None


def _openai(model, system, text, schema, images, effort, max_tokens):
    global _openai_client
    if _openai_client is None:
        from openai import OpenAI
        _openai_client = OpenAI(max_retries=4)
    content = [{"type": "input_image", "image_url": f"data:{mt};base64,{b64}", "detail": "high"}
               for mt, b64 in _images(images)]
    content.append({"type": "input_text", "text": text})
    kwargs = dict(model=model, instructions=system, input=[{"role": "user", "content": content}],
                  text_format=schema, max_output_tokens=max_tokens)
    if effort:
        kwargs["reasoning"] = {"effort": effort}
    response = _openai_client.responses.parse(**kwargs)
    _track(model, getattr(response.usage, "input_tokens", 0), getattr(response.usage, "output_tokens", 0))
    for item in response.output:
        if getattr(item, "type", None) == "message":
            for part in item.content:
                if getattr(part, "type", None) == "refusal":
                    raise ModelDeclined(f"{model} declined: {part.refusal}")
    if response.output_parsed is None:
        raise ValueError(f"{model}: no structured output (status={response.status})")
    return response.output_parsed


# ── Anthropic (Messages API) ────────────────────────────────────────────────

_anthropic_client = None


def _anthropic(model, system, text, schema, images, effort, fallback, max_tokens):
    global _anthropic_client
    if _anthropic_client is None:
        import anthropic
        _anthropic_client = anthropic.Anthropic(max_retries=4)
    content = [{"type": "image", "source": {"type": "base64", "media_type": mt, "data": b64}}
               for mt, b64 in _images(images)]
    content.append({"type": "text", "text": text})
    kwargs = dict(model=model, max_tokens=max_tokens, system=system,
                  messages=[{"role": "user", "content": content}], output_format=schema)
    if effort:
        kwargs["output_config"] = {"effort": effort}
    if fallback:
        # Server-side fallback: a declined request is re-run on a fallback model in the same call.
        response = _anthropic_client.beta.messages.parse(
            **kwargs, betas=["server-side-fallback-2026-07-01"], fallbacks="default")
    else:
        response = _anthropic_client.messages.parse(**kwargs)
    _track(model, getattr(response.usage, "input_tokens", 0), getattr(response.usage, "output_tokens", 0))
    if response.stop_reason == "refusal":
        raise ModelDeclined(f"{model} declined")
    if response.parsed_output is None:
        raise ValueError(f"{model}: no structured output (stop_reason={response.stop_reason})")
    return response.parsed_output


def list_models() -> list[str]:
    if SETTINGS.ai_provider == "openai":
        from openai import OpenAI
        return sorted(m.id for m in OpenAI().models.list())
    import anthropic
    return sorted(m.id for m in anthropic.Anthropic().models.list())
