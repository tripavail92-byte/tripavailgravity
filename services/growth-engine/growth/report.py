"""A single HTML page for reviewing a run: operators, trips, verdicts and the evidence behind them."""
from __future__ import annotations

import json
import os
from html import escape
from pathlib import Path

# $ per million tokens (input, output). Output includes thinking tokens.
PRICES = {"claude-haiku-5-5": (0.10, 0.50), "claude-opus-5-5": (4.00, 20.00), "claude-sonnet-5-5": (2.00, 10.00)}

CSS = """
:root{--ink:#16201e;--muted:#5d6b67;--line:#e4ded3;--bg:#f6f4ef;--card:#fff;--rose:#e11d48;
--ok:#0f7a5f;--okbg:#dff0e9;--warn:#a5601a;--warnbg:#f6e8d4;--bad:#b42318;--badbg:#fbe3e0}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);
font:15px/1.55 system-ui,-apple-system,'Segoe UI',sans-serif}
.wrap{max-width:1100px;margin:0 auto;padding:28px 18px 60px}
h1{font-size:28px;margin:0 0 4px}h2{font-size:20px;margin:0}h3{font-size:16px;margin:0 0 4px}
.muted{color:var(--muted);font-size:13.5px}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin:18px 0 28px}
.stat{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:12px 14px}
.stat b{display:block;font-size:24px;font-variant-numeric:tabular-nums}
.op{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:18px;margin-bottom:22px}
.ophead{display:flex;gap:14px;align-items:center;flex-wrap:wrap}
.logo{width:64px;height:64px;border-radius:50%;object-fit:cover;border:1px solid var(--line);background:#eee}
.chip{display:inline-block;font-size:11.5px;font-weight:700;padding:3px 9px;border-radius:999px;
background:#eef0f3;color:#475467;margin-right:6px}
.chip.unv{background:#fff4e5;color:#a5601a}
.trips{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:14px;margin-top:16px}
.trip{border:1px solid var(--line);border-radius:14px;overflow:hidden;background:#fff;display:flex;flex-direction:column}
.trip .imgs{display:flex;gap:2px;height:170px;background:#ddd}
.trip .imgs img{flex:1;min-width:0;height:100%;object-fit:cover}
.trip .body{padding:12px 14px;flex:1}
.price{font-weight:700;font-size:15px}.ask{color:var(--rose)}
.badge{font-size:11px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;padding:3px 8px;border-radius:999px}
.publish_ready{background:var(--okbg);color:var(--ok)}.review{background:var(--warnbg);color:var(--warn)}
.reject{background:var(--badbg);color:var(--bad)}
details{margin-top:8px;border-top:1px solid var(--line);padding-top:8px}
summary{cursor:pointer;font-weight:600;font-size:13.5px}
ul{margin:6px 0;padding-left:18px}li{margin-bottom:3px}
.day{margin:8px 0;padding:8px 10px;background:#faf8f4;border-radius:8px}
.act{font-size:13px}.act time{font-variant-numeric:tabular-nums;color:var(--muted);margin-right:6px}
.check{font-size:12.5px}.check.no{color:var(--bad)}.check.soft.no{color:var(--warn)}
.note{font-size:12px;color:var(--muted);font-style:italic}
.skip{opacity:.7}
table{border-collapse:collapse;font-size:13px}td,th{padding:4px 10px;border-bottom:1px solid var(--line);text-align:left}
"""


def _rel(path: str | None, base: Path) -> str:
    if not path:
        return ""
    try:
        return escape(os.path.relpath(path, base).replace("\\", "/"))
    except ValueError:  # different Windows drive: no relative path exists
        return escape(Path(path).resolve().as_uri())


def _money(amount, currency="PKR") -> str:
    return f"{currency} {amount:,.0f}"


def _trip_card(t: dict, base: Path) -> str:
    facts = t.get("facts") or {}
    tour = t.get("tour") or {}
    listing = t.get("listing") or {}
    imgs = "".join(f'<img src="{_rel(m["stored_path"], base)}" alt="">' for m in (t.get("media") or [])[:3])
    title = escape(listing.get("title") or facts.get("title_as_posted") or "(untitled)")
    if facts.get("price_amount"):
        basis = escape(facts.get("price_basis") or "per person")
        price = f'<span class="price">{_money(facts["price_amount"], (tour.get("currency") or "PKR"))}</span> <span class="muted">{basis}</span>'
    else:
        price = '<span class="price ask">Ask for price</span>'
    deps = t.get("upcoming") or []
    dep_txt = ", ".join(deps[:4]) + (f" +{len(deps) - 4} more" if len(deps) > 4 else "") if deps else "Dates on request"
    dur = escape(tour.get("duration") or (f"{facts.get('duration_days')} days" if facts.get("duration_days") else "Duration to confirm"))

    full = ""
    if listing:
        hl = "".join(f"<li>{escape(h)}</li>" for h in listing.get("highlights", []))
        inc = "".join(f"<li>{escape(x)}</li>" for x in listing.get("inclusions", [])) or "<li class='muted'>Not stated</li>"
        exc = "".join(f"<li>{escape(x)}</li>" for x in listing.get("exclusions", [])) or "<li class='muted'>Not stated</li>"
        days = ""
        for d in listing.get("itinerary", []):
            acts = "".join(
                f'<div class="act"><time>{escape(a.get("time") or "")}</time>{escape(a["title"])} — '
                f'<span class="muted">{escape(a.get("description") or "")}</span></div>'
                for a in d.get("activities", []))
            stay = f'<div class="muted">Overnight: {escape(d["overnight"])}</div>' if d.get("overnight") else ""
            days += f'<div class="day"><b>Day {d["day"]}: {escape(d["title"])}</b><div>{escape(d.get("summary") or "")}</div>{acts}{stay}</div>'
        src = "Operator's own day plan, enhanced" if tour.get("itinerary_source") == "operator_enhanced" else "Suggested itinerary by TripAvail"
        desc = "".join(f"<p>{escape(p)}</p>" for p in (listing.get("description") or "").split("\n") if p.strip())
        full = f"""<details><summary>Full listing</summary>{desc}
          <h3>Highlights</h3><ul>{hl}</ul>
          <h3>Included</h3><ul>{inc}</ul><h3>Not included</h3><ul>{exc}</ul>
          <h3>Itinerary</h3><div class="note">{src}</div>{days}
          <div class="muted">Type: {escape(listing.get('tour_type',''))} · Difficulty: {escape(listing.get('difficulty_level',''))}
          · Requirements: {escape(', '.join(tour.get('requirements') or []) or 'none')}</div></details>"""

    checks = "".join(
        f'<div class="check {c["severity"]} {"" if c["ok"] else "no"}">{"✓" if c["ok"] else "✗"} {escape(c["name"])}'
        f'{" — " + escape(str(c["detail"])) if c.get("detail") else ""}</div>'
        for c in (t.get("validation") or {}).get("checks", []))
    evidence = "".join(f"<li>{escape(e)}</li>" for e in facts.get("evidence") or [])
    is_web = t.get("source") == "website"
    src_label = "Source page" if is_web else "Source post"
    when_label = "Page updated" if is_web else "Posted on Facebook"
    link = f'<a href="{escape(t["post_url"])}" target="_blank" rel="noopener">{src_label}</a>' if t.get("post_url") else ""
    reasons = "".join(f"<li>{escape(r)}</li>" for r in t.get("reasons") or [])
    return f"""<div class="trip"><div class="imgs">{imgs}</div><div class="body">
      <span class="badge {t['decision']}">{t['decision'].replace('_', ' ')}</span>
      <h3 style="margin-top:6px">{title}</h3>
      <div>{price}</div><div class="muted">{dur} · {escape(dep_txt)}</div>
      <div class="muted">{when_label}: {escape(t.get('posted_at') or 'date not read')}</div>
      <p>{escape(listing.get('short_description') or '')}</p>
      {f'<p class="note">{escape(tour["operator_note"].replace(" ({claim_url})", ""))}</p>' if tour.get("operator_note") else ""}
      {f'<ul class="muted">{reasons}</ul>' if reasons else ''}
      {full}
      <details><summary>Evidence &amp; checks</summary>
        <div class="muted">confidence {facts.get('confidence', 0):.2f} · price from {escape(str(facts.get('price_found_in')))} · {link}</div>
        <ul>{evidence}</ul>{checks}
        <details><summary>Original caption</summary><pre style="white-space:pre-wrap;font-size:12px">{escape(t.get('caption') or '')}</pre></details>
      </details></div></div>"""


def build_report(run_dir: Path) -> Path:
    load = lambda n: json.loads((run_dir / f"{n}.json").read_text(encoding="utf-8"))  # noqa: E731
    summary, operators, trips, changes = load("summary"), load("operators"), load("trips"), load("changes")

    cost = 0.0
    unpriced = False
    usage_rows = ""
    for model, u in (summary.get("ai_usage") or summary.get("claude_usage") or {}).items():
        if model in PRICES:
            pin, pout = PRICES[model]
            c = u["input_tokens"] / 1e6 * pin + u["output_tokens"] / 1e6 * pout
            cost += c
            cell = f"${c:.2f}"
        else:
            unpriced = True
            cell = "see provider billing"
        usage_rows += f"<tr><td>{escape(model)}</td><td>{u['calls']}</td><td>{u['input_tokens']:,}</td><td>{u['output_tokens']:,}</td><td>{cell}</td></tr>"

    stats = [("Operators scanned", summary["operators_scanned"]), ("Eligible (500–10k)", summary["operators_eligible"]),
             ("Posts read", summary["posts_read"]), ("Trips found", summary["trips"]),
             ("Publish-ready", summary["publish_ready"]), ("Needs review", summary["needs_review"]),
             ("Duplicates merged", summary["duplicates_collapsed"]),
             ("AI cost", "see usage below" if unpriced else f"${cost:.2f}")]
    stat_html = "".join(f'<div class="stat"><b>{v}</b><span class="muted">{escape(k)}</span></div>' for k, v in stats)

    ops_html = ""
    for op in operators:
        mine = [t for t in trips if t.get("operator_handle") == op["handle"]]
        proof = escape(op["social_proof"]["label"]) if op.get("social_proof") else ("Website" if op.get("source") == "website" else "No Facebook rating shown")
        page_label = "Website" if op.get("source") == "website" else "Facebook page"
        logo = f'<img class="logo" src="{_rel((op.get("logo") or {}).get("stored_path"), run_dir)}" alt="">' if op.get("logo") else '<div class="logo"></div>'
        cards = "".join(_trip_card(t, run_dir) for t in mine) or '<p class="muted">No trips found.</p>'
        skip = f'<p class="muted">Skipped: {escape(op["ineligible_reason"])}</p>' if not op["eligible"] else ""
        ops_html += f"""<section class="op {'skip' if not op['eligible'] else ''}"><div class="ophead">{logo}<div>
          <h2>{escape(op['name'])}</h2>
          <div><span class="chip unv">Unverified · Unclaimed</span><span class="chip">{(op.get('followers') or 0):,} followers</span>
          <span class="chip">{proof}</span></div>
          <div class="muted">{escape(op.get('city') or '')} · {escape(op.get('phone_e164') or 'no phone found')} ·
          <a href="{escape(op['page_url'])}" target="_blank" rel="noopener">{page_label}</a></div></div></div>
          {skip}<div class="trips">{cards}</div></section>"""

    change_html = "".join(f"<li>{escape(json.dumps(c, ensure_ascii=False))}</li>" for c in changes) or "<li>First scan — nothing to compare yet.</li>"
    html = f"""<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Growth Engine run {escape(summary['run'])}</title><style>{CSS}</style></head><body><div class="wrap">
<h1>Growth Engine — proof of concept</h1>
<div class="muted">Run {escape(summary['run'])} · scanned {escape(summary['scanned_on'])} · nothing here is published</div>
<div class="stats">{stat_html}</div>
{ops_html}
<section class="op"><h2>Changes since the last scan</h2><ul>{change_html}</ul></section>
<section class="op"><h2>AI usage</h2><table><tr><th>Model</th><th>Calls</th><th>Input</th><th>Output</th><th>Cost</th></tr>{usage_rows}</table></section>
</div></body></html>"""
    out = run_dir / "report.html"
    out.write_text(html, encoding="utf-8")
    return out
