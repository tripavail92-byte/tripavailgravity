import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import sirv from 'sirv'

const port = Number.parseInt(process.env.PORT || '4173', 10)
const distDir = path.join(process.cwd(), 'packages', 'web', 'dist')
const SITE = (process.env.PUBLIC_SITE_URL || 'https://tripavail.com').replace(/\/+$/, '')
// Mirror of packages/web/src/config/company.ts (plain Node server, no workspace imports).
const SUPPORT_EMAIL = 'support@tripavail.com'

// Supabase REST (anon) — used to render public pages for crawlers, inject per-page meta and
// build the sitemap / llms.txt. Optional: if unset (or a fetch fails) we fall back to the
// default SPA shell, never erroring.
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || ''
const SUPABASE_ANON = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ''
const seoEnabled = Boolean(SUPABASE_URL && SUPABASE_ANON)

// Launch scope (Trips-only): mirror of packages/shared launchScope.hotels. This is a
// plain Node server (no workspace import at runtime), so the flag is duplicated here —
// flip BOTH to true in Phase 3. Gates the default share title + what the sitemap
// advertises (hotels/packages routes now redirect to /tours, so we don't crawl them).
const LAUNCH_HOTELS = false

const indexHtmlPath = path.join(distDir, 'index.html')
let INDEX_HTML = ''
try {
  INDEX_HTML = fs.readFileSync(indexHtmlPath, 'utf8')
} catch {
  // built later / missing — sirv will still serve once present
}

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-XSS-Protection': '0',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self), payment=(self)',
}

// Public pages may be quoted at any length and shown with large images in results.
const PUBLIC_ROBOTS = 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1'

// ─── Formatting helpers ─────────────────────────────────────────────────────

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const clean = (s) => String(s ?? '').replace(/\s+/g, ' ').trim()
const clip = (s, n) => {
  const t = clean(s)
  return t.length <= n ? t : `${t.slice(0, n - 1).replace(/\s+\S*$/, '')}…`
}
const capital = (s) => {
  const t = clean(s)
  return t ? t[0].toUpperCase() + t.slice(1) : ''
}
// Operators type "siran valley"; show "Siran Valley". Leave mixed-case input alone.
const titleCase = (s) => {
  const t = clean(s)
  return t && t === t.toLowerCase() ? t.replace(/(^|[\s(/-])(\p{L})/gu, (_, a, c) => a + c.toUpperCase()) : t
}
const arr = (v) => (Array.isArray(v) ? v : [])
const strList = (v) =>
  arr(v)
    .map((x) => clean(typeof x === 'string' ? x : x?.label || x?.name || ''))
    .filter(Boolean)
const fmtMoney = (amount, currency) =>
  `${currency || 'PKR'} ${Math.round(Number(amount) || 0).toLocaleString('en-US')}`
const DATE_FMT = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'Asia/Karachi',
})
const fmtDate = (iso) => DATE_FMT.format(new Date(iso))
const paragraphs = (text) =>
  String(text ?? '')
    .split(/\n\s*\n/)
    .map(clean)
    .filter(Boolean)
    .map((p) => `<p>${esc(p)}</p>`)
    .join('\n')
const link = (href, text) => (href ? `<a href="${esc(href)}">${esc(text)}</a>` : esc(text))
const mdText = (s) => clean(s).replace(/\[/g, '(').replace(/\]/g, ')')
const ldJson = (obj) => JSON.stringify(obj).replace(/</g, '\\u003c')

// ─── Supabase reads, cached ─────────────────────────────────────────────────

async function sbFetch(qs) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${qs}`, {
    headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` },
    signal: AbortSignal.timeout(6000),
  })
  if (!res.ok) throw new Error(`supabase ${res.status}`)
  return res.json()
}

// Stale-while-revalidate: an expired entry is served immediately while one refresh runs in the
// background, and a failed refresh keeps serving the last good value. Bounded so random slugs
// can't grow it without limit.
const CACHE_TTL_MS = 5 * 60 * 1000
const CACHE_MAX = 500
const cache = new Map()

function cached(key, loader, ttl = CACHE_TTL_MS) {
  const entry = cache.get(key)
  if (entry?.hasValue && entry.expires > Date.now()) return Promise.resolve(entry.value)
  if (entry?.pending) return entry.hasValue ? Promise.resolve(entry.value) : entry.pending

  const pending = loader()
    .then((value) => {
      cache.delete(key)
      if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value)
      cache.set(key, { hasValue: true, value, expires: Date.now() + ttl, pending: null })
      return value
    })
    .catch((err) => {
      const cur = cache.get(key)
      if (cur?.hasValue) {
        cur.pending = null
        cur.expires = Date.now() + 30_000
        return cur.value
      }
      cache.delete(key)
      throw err
    })
  cache.set(key, { ...(entry || {}), pending })
  return entry?.hasValue ? Promise.resolve(entry.value) : pending
}

const LIVE_TOURS = 'is_active=eq.true&is_published=eq.true&status=eq.live'
const TOUR_FIELDS = [
  'id', 'title', 'slug', 'short_description', 'description', 'location', 'destination_cities',
  'duration', 'duration_days', 'price', 'currency', 'difficulty_level', 'tour_type', 'operator_id',
  'images', 'rating', 'review_count', 'updated_at', 'highlights', 'inclusions', 'exclusions',
  'itinerary', 'languages', 'max_participants', 'min_age', 'cancellation_policy_type',
].join(',')
const OPERATOR_FIELDS =
  'user_id,slug,company_name,business_name,company_logo_url,description,primary_city,years_experience,has_identity_verified'

// booking_mode / price_on_request arrive with migration 20261125000001; until then, the old shape.
const LISTING_FIELDS = 'booking_mode,price_on_request,availability'
const loadTours = () =>
  cached('tours', () =>
    sbFetch(`tours?${LIVE_TOURS}&select=${TOUR_FIELDS},${LISTING_FIELDS}&order=updated_at.desc&limit=1000`).catch(() =>
      sbFetch(`tours?${LIVE_TOURS}&select=${TOUR_FIELDS}&order=updated_at.desc&limit=1000`),
    ),
  )

/** Unclaimed (not-yet-joined) operators' public contact, keyed by user id. Empty before the migration. */
const loadListingContacts = () =>
  cached('listing-contacts', () =>
    sbFetch('operator_public_listing_v?select=user_id,listing_status,public_whatsapp,website_url&limit=5000')
      .then((rows) => new Map(rows.map((r) => [r.user_id, r])))
      .catch(() => new Map()),
  )

const loadOperators = () =>
  cached('operators', () =>
    sbFetch(`operator_public_storefront_v?is_public=eq.true&select=${OPERATOR_FIELDS}&limit=5000`),
  )

/** Upcoming scheduled departures, grouped by tour id, soonest first. */
const loadDepartures = () =>
  cached('departures', async () => {
    const from = encodeURIComponent(new Date().toISOString())
    const rows = await sbFetch(
      `tour_schedules?status=eq.scheduled&start_time=gte.${from}` +
        `&select=tour_id,start_time,capacity,booked_count,price_override&order=start_time.asc&limit=5000`,
    )
    const byTour = new Map()
    for (const r of rows) {
      if (!byTour.has(r.tour_id)) byTour.set(r.tour_id, [])
      byTour.get(r.tour_id).push(r)
    }
    return byTour
  })

/** Where an operator's old URL now lives (see migration 20261124000001). */
const loadSlugRedirect = (slug) =>
  cached(
    `redirect:${slug}`,
    () =>
      sbFetch(`operator_slug_redirects?old_slug=eq.${encodeURIComponent(slug)}&select=new_slug&limit=1`)
        .then((rows) => rows[0]?.new_slug || null)
        .catch(() => null),
    10 * 60 * 1000,
  )

async function loadSite() {
  const [tours, baseOperators, departures, contacts] = await Promise.all([
    loadTours(),
    loadOperators().catch(() => []),
    loadDepartures().catch(() => new Map()),
    loadListingContacts(),
  ])
  const operators = baseOperators.map((o) => ({ ...o, ...(contacts.get(o.user_id) || {}) }))
  const opById = new Map(operators.map((o) => [o.user_id, o]))
  const toursByOp = new Map()
  for (const t of tours) {
    if (!toursByOp.has(t.operator_id)) toursByOp.set(t.operator_id, [])
    toursByOp.get(t.operator_id).push(t)
  }
  const now = Date.now()
  return {
    tours,
    operators,
    opById,
    toursByOp,
    // Only operators with something to book are worth a crawler's time.
    liveOperators: operators.filter((o) => o.slug && toursByOp.has(o.user_id)),
    upcoming: (t) => (departures.get(t.id) || []).filter((d) => Date.parse(d.start_time) > now),
  }
}

/** A live tour by slug or id. Falls back to a direct read for tours published since the last cache fill. */
async function findTour(site, slugOrId) {
  const isId = UUID_RE.test(slugOrId)
  const needle = slugOrId.toLowerCase()
  const hit = site.tours.find((t) => (isId ? t.id === needle : t.slug === needle))
  if (hit) return hit
  const key = isId ? 'id' : 'slug'
  const rows = await cached(
    `tour:${key}:${needle}`,
    () =>
      sbFetch(`tours?${key}=eq.${encodeURIComponent(needle)}&${LIVE_TOURS}&select=${TOUR_FIELDS},${LISTING_FIELDS}&limit=1`).catch(
        () => sbFetch(`tours?${key}=eq.${encodeURIComponent(needle)}&${LIVE_TOURS}&select=${TOUR_FIELDS}&limit=1`),
      ),
    60_000,
  )
  return rows[0] || null
}

/** A public operator by slug or user id, with the same fallback. */
async function findOperator(site, slugOrId) {
  const isId = UUID_RE.test(slugOrId)
  const needle = slugOrId.toLowerCase()
  const hit = site.operators.find((o) => (isId ? o.user_id === needle : o.slug === needle))
  if (hit) return hit
  const key = isId ? 'user_id' : 'slug'
  const rows = await cached(
    `operator:${key}:${needle}`,
    () =>
      sbFetch(
        `operator_public_storefront_v?${key}=eq.${encodeURIComponent(needle)}&is_public=eq.true&select=${OPERATOR_FIELDS}&limit=1`,
      ),
    60_000,
  )
  return rows[0] || null
}

// ─── Listing facts ──────────────────────────────────────────────────────────

const tourPath = (t) => `/tours/${t.slug || t.id}`
const opPath = (o) => (o?.slug ? `/operators/${o.slug}` : null)
const opName = (o) => clean(o?.business_name) || clean(o?.company_name) || 'Tour operator'

// Places API names carry diacritics ("Harīpur"); people search "Haripur".
const plainLatin = (s) => String(s ?? '').normalize('NFD').replace(/(\p{Script=Latin})\p{M}+/gu, '$1').normalize('NFC')

function tourCity(t) {
  const loc = t.location
  const city = typeof loc === 'string' ? loc : loc?.city
  return titleCase(plainLatin(city || arr(t.destination_cities)[0] || ''))
}
function tourCountry(t) {
  return titleCase(t.location && typeof t.location === 'object' ? t.location.country || '' : '')
}
function tourPlace(t) {
  const city = tourCity(t)
  const country = tourCountry(t)
  return [city, country && country !== city ? country : ''].filter(Boolean).join(', ')
}
function tourDays(t) {
  const n = Number(t.duration_days) || Number.parseInt(t.duration, 10) || 0
  return n > 0 ? n : 0
}
const daysLabel = (n) => (n === 1 ? '1 day' : `${n} days`)
// Listed from an operator who hasn't joined TripAvail: booked directly with them on WhatsApp.
const isEnquiry = (t) => t.booking_mode === 'enquiry'
// Runs on dates the traveller chooses (no fixed departures); never a past trip.
const anyDate = (t) => t.availability === 'on_request'
const tourPrice = (t) => (t.price_on_request ? 0 : Number(t.price) || 0)
const priceLabel = (t) =>
  tourPrice(t) > 0 ? `from ${fmtMoney(tourPrice(t), t.currency)} per person` : 'price on request'
function tourImages(t) {
  return arr(t.images)
    .map((i) => (typeof i === 'string' ? i : i?.url))
    .filter((u) => typeof u === 'string' && /^https?:\/\//.test(u))
}
const LANGUAGE_NAMES = { en: 'English', ur: 'Urdu', ar: 'Arabic', zh: 'Chinese', fr: 'French', de: 'German' }
function tourLanguages(t) {
  const seen = new Map()
  for (const l of strList(t.languages)) {
    const name = LANGUAGE_NAMES[l.toLowerCase()] || capital(l)
    seen.set(name.toLowerCase(), name)
  }
  return [...seen.values()]
}
function itineraryDays(t) {
  return arr(t.itinerary)
    .filter((d) => d && typeof d === 'object')
    .map((d, i) => ({
      day: Number(d.day) || i + 1,
      title: clean(d.title),
      activities: arr(d.activities)
        .filter((a) => a && typeof a === 'object' && clean(a.title))
        .map((a) => ({ time: clean(a.time), title: clean(a.title), description: clean(a.description) })),
    }))
}
const seatsLeft = (d) => {
  const cap = Number(d.capacity) || 0
  return cap > 0 ? Math.max(0, cap - (Number(d.booked_count) || 0)) : null
}

function mainCountry(tours) {
  const counts = new Map()
  for (const t of tours) {
    const c = tourCountry(t)
    if (c) counts.set(c, (counts.get(c) || 0) + 1)
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || 'Pakistan'
}

function byDestination(tours) {
  const groups = new Map()
  for (const t of tours) {
    const city = tourCity(t) || 'Other destinations'
    if (!groups.has(city)) groups.set(city, [])
    groups.get(city).push(t)
  }
  // Most tours first; ties go to the destination with the longest trips (Skardu and Hunza ahead of
  // a one-day stop), which also reads as the better-known name in titles and descriptions.
  const totalDays = (list) => list.reduce((n, t) => n + tourDays(t), 0)
  return [...groups.entries()].sort(
    (a, b) => b[1].length - a[1].length || totalDays(b[1]) - totalDays(a[1]) || a[0].localeCompare(b[0]),
  )
}

/** One-line plain-text summary of a tour, shared by the HTML lists and llms.txt. */
function tourFacts(site, t, { withOperator = true } = {}) {
  const parts = []
  const days = tourDays(t)
  if (days) parts.push(daysLabel(days))
  const place = tourPlace(t)
  if (place) parts.push(place)
  parts.push(priceLabel(t))
  if (t.difficulty_level) parts.push(capital(t.difficulty_level))
  const next = site.upcoming(t)[0]
  if (next) parts.push(`next departure ${fmtDate(next.start_time)}`)
  const op = site.opById.get(t.operator_id)
  if (withOperator && op) parts.push(`operator ${opName(op)}`)
  if (isEnquiry(t)) parts.push('booked directly with the operator')
  return parts.join(' · ')
}

function tourItem(site, t, { withOperator = true } = {}) {
  const op = site.opById.get(t.operator_id)
  const opBit = withOperator && op ? ` · by ${link(opPath(op), opName(op))}` : ''
  return `<li>${link(tourPath(t), t.title)} — ${esc(tourFacts(site, t, { withOperator: false }))}${opBit}</li>`
}

// ─── Page shell ─────────────────────────────────────────────────────────────

// Server-rendered content sits inside #root so crawlers that don't run JavaScript (most AI
// crawlers, link-preview bots, Google's first pass) read the real page. React's createRoot
// clears #root on first render; browsers that will run the app hide it until then.
const SSR_HEAD =
  `\n  <style>.ta-js #ssr-content{display:none}</style>` +
  `\n  <script>if('noModule' in HTMLScriptElement.prototype)document.documentElement.classList.add('ta-js')</script>`

function chrome(main) {
  return `<div id="ssr-content">
<header>
<p><a href="/">TripAvail</a></p>
<nav aria-label="Main"><a href="/">Home</a> · <a href="/tours">All tours</a> · <a href="/destinations">Destinations</a> · <a href="/partner/onboarding">List your tours</a> · <a href="/contact">Contact</a></nav>
</header>
<main>
${main}
</main>
<footer>
<nav aria-label="Footer"><a href="/tours">Tours</a> · <a href="/contact">Contact</a> · <a href="/refunds">Cancellations and refunds</a> · <a href="/terms">Terms</a> · <a href="/privacy">Privacy</a></nav>
<p>Questions? <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>
</footer>
</div>`
}

/** Replace the shell's default head tags with page-specific ones, inject JSON-LD and the page body. */
function renderShell(meta) {
  const {
    title,
    fullTitle: explicitFullTitle,
    description,
    canonical,
    image,
    jsonLd,
    ogType = 'website',
    robots = PUBLIC_ROBOTS,
    body,
  } = meta
  let html = INDEX_HTML
  const fullTitle =
    explicitFullTitle ||
    (title
      ? `${title} · TripAvail`
      : LAUNCH_HOTELS
        ? 'TripAvail — Find Your Perfect Stay'
        : 'TripAvail — Find Your Next Adventure')
  // Callback replacements: operator-written text may contain "$&" / "$'", which a string
  // replacement would expand.
  const rep = (re, str) => {
    html = re.test(html) ? html.replace(re, () => str) : html
  }
  rep(/<title>[\s\S]*?<\/title>/, `<title>${esc(fullTitle)}</title>`)
  if (description) {
    rep(/<meta name="description"[^>]*>/, `<meta name="description" content="${esc(description)}" />`)
    rep(/<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${esc(description)}" />`)
  }
  rep(/<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${esc(title || fullTitle)}" />`)
  rep(/<meta property="og:type"[^>]*>/, `<meta property="og:type" content="${esc(ogType)}" />`)
  if (canonical) rep(/<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${esc(canonical)}" />`)
  if (image) rep(/<meta property="og:image"[^>]*>/, `<meta property="og:image" content="${esc(image)}" />`)

  const inject =
    `\n  <meta name="robots" content="${esc(robots)}" />` +
    `\n  <meta property="og:site_name" content="TripAvail" />` +
    (canonical ? `\n  <link rel="canonical" href="${esc(canonical)}" />` : '') +
    `\n  <meta name="twitter:title" content="${esc(title || fullTitle)}" />` +
    (description ? `\n  <meta name="twitter:description" content="${esc(description)}" />` : '') +
    (image ? `\n  <meta name="twitter:image" content="${esc(image)}" />` : '') +
    (jsonLd ? `\n  <script type="application/ld+json">${ldJson(jsonLd)}</script>` : '') +
    (body ? SSR_HEAD : '') +
    '\n</head>'
  html = html.replace('</head>', () => inject)
  if (body) html = html.replace(/<div id="root">\s*<\/div>/, () => `<div id="root">${body}</div>`)
  return html
}

const ORG_ID = `${SITE}/#org`
const ORGANIZATION = {
  '@type': 'Organization',
  '@id': ORG_ID,
  name: 'TripAvail',
  url: `${SITE}/`,
  logo: `${SITE}/brand/logo-emblem-256.png`,
  email: SUPPORT_EMAIL,
  contactPoint: { '@type': 'ContactPoint', contactType: 'customer support', email: SUPPORT_EMAIL },
}
const WEBSITE = { '@type': 'WebSite', '@id': `${SITE}/#website`, name: 'TripAvail', url: `${SITE}/`, publisher: { '@id': ORG_ID } }

const itemList = (tours) => ({
  '@type': 'ItemList',
  itemListElement: tours.map((t, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    url: `${SITE}${tourPath(t)}`,
    name: t.title,
  })),
})

const breadcrumbs = (crumbs) => ({
  '@type': 'BreadcrumbList',
  itemListElement: crumbs.map(([name, url], i) => ({ '@type': 'ListItem', position: i + 1, name, item: url })),
})

// ─── Pages ──────────────────────────────────────────────────────────────────

function destinationSections(site, groups, heading = 'h2') {
  return groups
    .map(
      ([city, list]) =>
        `<section>\n<${heading}>${esc(city)} (${list.length} ${list.length === 1 ? 'tour' : 'tours'})</${heading}>\n<ul>\n${list
          .map((t) => tourItem(site, t))
          .join('\n')}\n</ul>\n</section>`,
    )
    .join('\n')
}

function operatorItems(site) {
  return site.liveOperators
    .map((o) => {
      const n = site.toursByOp.get(o.user_id)?.length || 0
      const bits = [clean(o.primary_city), `${n} ${n === 1 ? 'tour' : 'tours'}`]
      if (o.has_identity_verified) bits.push('ID verified')
      return `<li>${link(opPath(o), opName(o))} — ${esc(bits.filter(Boolean).join(' · '))}</li>`
    })
    .join('\n')
}

function homePage(site) {
  const { liveOperators } = site
  // The front page lists trips with a departure still ahead; past trips stay on their own pages
  // and under their operator (archived). Fall back to everything if nothing is upcoming.
  const upcoming = site.tours.filter((t) => site.upcoming(t).length > 0)
  const tours = upcoming.length ? upcoming : site.tours
  const country = mainCountry(tours)
  const groups = byDestination(tours)
  const topCities = groups.map(([c]) => c).filter((c) => c !== 'Other destinations').slice(0, 5)
  const soon = tours
    .flatMap((t) => site.upcoming(t).slice(0, 2).map((d) => ({ t, d })))
    .sort((a, b) => Date.parse(a.d.start_time) - Date.parse(b.d.start_time))
    .slice(0, 12)

  const main = `<h1>Tours and trips in ${esc(country)}, with prices and dates</h1>
<p>TripAvail lists ${tours.length} ${upcoming.length ? 'upcoming ' : ''}tours from ${liveOperators.length} local tour operators. Each listing shows the price (or that it is on request), a day-by-day itinerary, what is included and the departure dates, so you can compare trips before you book. Past trips stay on each operator's page.</p>
${topCities.length ? `<p>Destinations: ${topCities.map(esc).join(', ')}${groups.length > topCities.length ? ' and more' : ''}.</p>` : ''}
${
  soon.length
    ? `<section>\n<h2>Departing soon</h2>\n<ul>\n${soon
        .map(({ t, d }) => {
          const left = seatsLeft(d)
          const price = Number(d.price_override) || tourPrice(t)
          const bits = [fmtDate(d.start_time), tourPlace(t), price > 0 ? `${fmtMoney(price, t.currency)} per person` : '', left !== null ? `${left} seats left` : '']
          return `<li>${link(tourPath(t), t.title)} — ${esc(bits.filter(Boolean).join(' · '))}</li>`
        })
        .join('\n')}\n</ul>\n</section>`
    : ''
}
${(() => {
  const hubs = destinationHubs(site).list.slice(0, 16)
  return hubs.length
    ? `<section>
<h2>Popular destinations</h2>
<ul>
${hubs.map((h) => `<li>${link(destPath(h), `${h.name} tours`)} (${h.tours.length} trips)</li>`).join('\n')}
</ul>
<p>${link('/destinations', 'All destinations')}</p>
</section>`
    : ''
})()}
<section>
<h2>Tours by destination</h2>
${destinationSections(site, groups, 'h3')}
</section>
${liveOperators.length ? `<section>\n<h2>Tour operators on TripAvail</h2>\n<ul>\n${operatorItems(site)}\n</ul>\n</section>` : ''}
<section>
<h2>How booking works</h2>
<ol>
<li>Compare tours by destination, length, price and date.</li>
<li>Open a tour to read the full itinerary, what is included and the operator's cancellation policy.</li>
<li>Pick a departure date and book on TripAvail. Your booking and trip voucher appear under My Trips.</li>
</ol>
${tours.some(isEnquiry) ? '<p>Some trips are listed from operators who are not on TripAvail yet. Those you book directly with the operator on WhatsApp; the listing says so.</p>' : ''}
<p>Prices, dates and itineraries are set by each tour operator. See <a href="/refunds">cancellations and refunds</a>.</p>
</section>
<section>
<h2>For tour operators</h2>
<p>Run tours? <a href="/partner/onboarding">List your tours on TripAvail</a>.</p>
</section>`

  const description = clip(
    `Compare ${tours.length} tours from ${liveOperators.length} local tour operators in ${country}` +
      (topCities.length ? `: ${topCities.slice(0, 4).join(', ')} and more` : '') +
      '. Prices per person, day-by-day itineraries and departure dates.',
    160,
  )
  return {
    title: `Book tours and trips in ${country}`,
    fullTitle: `TripAvail — Book tours and trips in ${country}`,
    description,
    canonical: `${SITE}/`,
    jsonLd: { '@context': 'https://schema.org', '@graph': [ORGANIZATION, WEBSITE] },
    body: chrome(main),
  }
}

// ─── Destination hubs (/destinations/:slug) ─────────────────────────────────
// One page per place travellers search for ("Hunza tours"), listing every live trip that visits
// it. Facts only: counts, price ranges, lengths and dates are computed from the listings below, and
// the FAQ answers are built from the same numbers. Big departure cities and overnight stops are not
// destinations; spelling variants ("Hunza Valley", "Karimabad (Hunza)") are merged by key. A place
// needs HUB_MIN trips to get a page, so no thin pages are published.
const HUB_MIN = 4
const DEST_STOP = new Set([
  'islamabad', 'rawalpindi', 'lahore', 'karachi', 'peshawar', 'multan', 'faisalabad', 'sialkot', 'quetta',
  'hyderabad', 'gujranwala', 'mirpur', 'besham', 'chilas', 'dassu', 'raikot-bridge', 'jaglot', 'mansehra',
  'abbottabad', 'balakot', 'pakistan', 'northern-pakistan', 'north-pakistan', 'northern-areas',
])
function destKey(name) {
  return plainLatin(String(name || ''))
    .toLowerCase()
    .replace(/\(.*?\)/g, ' ')
    .replace(/\b(valley|city|national park|plains|district|pass|top)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
const destLabel = (name) => titleCase(plainLatin(String(name || '').replace(/\s*\(.*?\)\s*/g, ' ').trim()))
function tourDestKeys(t) {
  const loc = t.location
  const raw = [typeof loc === 'string' ? loc : loc?.city, ...arr(t.destination_cities)]
  const keys = new Map()
  for (const r of raw) {
    const k = destKey(r)
    if (k && !DEST_STOP.has(k) && !keys.has(k)) keys.set(k, destLabel(r))
  }
  return keys
}
function destinationHubs(site) {
  if (site._hubs) return site._hubs
  const hubs = new Map()
  for (const t of site.tours) {
    for (const [k, label] of tourDestKeys(t)) {
      if (!hubs.has(k)) hubs.set(k, { slug: k, labels: new Map(), tours: [] })
      const h = hubs.get(k)
      h.tours.push(t)
      h.labels.set(label, (h.labels.get(label) || 0) + 1)
    }
  }
  const list = [...hubs.values()]
    .filter((h) => h.tours.length >= HUB_MIN)
    .map((h) => ({ ...h, name: [...h.labels.entries()].sort((a, b) => b[1] - a[1] || a[0].length - b[0].length)[0][0] }))
    .sort((a, b) => b.tours.length - a.tours.length || a.name.localeCompare(b.name))
  site._hubs = { list, bySlug: new Map(list.map((h) => [h.slug, h])) }
  return site._hubs
}
const destPath = (h) => `/destinations/${h.slug}`
const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b)
  return s.length ? (s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : 0
}
const mode = (xs) => {
  const c = new Map()
  for (const x of xs) c.set(x, (c.get(x) || 0) + 1)
  return [...c.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0]?.[0] || 0
}

/** The numbers a destination page and its FAQ are built from — all computed from live listings. */
function hubFacts(site, h) {
  const priced = h.tours.filter((t) => tourPrice(t) > 0)
  const byCur = new Map()
  for (const t of priced) {
    const c = (t.currency || 'PKR').toUpperCase()
    if (!byCur.has(c)) byCur.set(c, [])
    byCur.get(c).push(tourPrice(t))
  }
  const currencies = [...byCur.entries()]
    .map(([currency, xs]) => ({ currency, min: Math.min(...xs), max: Math.max(...xs), median: median(xs), n: xs.length }))
    // Rupee prices lead for a Pakistani audience; then whichever currency most trips use.
    .sort((a, b) => (b.currency === 'PKR') - (a.currency === 'PKR') || b.n - a.n)
  const days = h.tours.map(tourDays).filter((d) => d > 0)
  const departures = h.tours
    .flatMap((t) => site.upcoming(t).slice(0, 3).map((d) => ({ t, d })))
    .sort((a, b) => Date.parse(a.d.start_time) - Date.parse(b.d.start_time))
  const anyDateTrips = h.tours.filter((t) => anyDate(t) && !site.upcoming(t).length)
  const ops = [...new Set(h.tours.map((t) => t.operator_id))].map((id) => site.opById.get(id)).filter(Boolean)
  return {
    currencies,
    onRequest: h.tours.length - priced.length,
    days: days.length ? { min: Math.min(...days), max: Math.max(...days), common: mode(days) } : null,
    departures,
    anyDateTrips,
    ops,
  }
}

function hubFaq(site, h, f) {
  const qa = []
  const name = h.name
  if (f.currencies.length) {
    const main = f.currencies[0]
    const others = f.currencies.slice(1).map((c) => `${c.n} priced in ${c.currency} from ${fmtMoney(c.min, c.currency)}`)
    qa.push([
      `How much does a ${name} tour cost?`,
      `${name} trips listed on TripAvail cost from ${fmtMoney(main.min, main.currency)} to ${fmtMoney(main.max, main.currency)} per person; ` +
        `the median price is ${fmtMoney(main.median, main.currency)} (${main.n} priced in ${main.currency}).` +
        (others.length ? ` International trips: ${others.join('; ')}.` : '') +
        (f.onRequest ? ` ${f.onRequest} more ${f.onRequest === 1 ? 'trip quotes' : 'trips quote'} the price on request.` : '') +
        ' Prices are set by each tour operator.',
    ])
  }
  if (f.days) {
    qa.push([
      `How many days do you need for a ${name} trip?`,
      f.days.min === f.days.max
        ? `The listed ${name} trips run ${daysLabel(f.days.min)}.`
        : `Listed ${name} trips run from ${daysLabel(f.days.min)} to ${daysLabel(f.days.max)}; the most common length is ${daysLabel(f.days.common)}.`,
    ])
  }
  const soon = f.departures.slice(0, 4).map(({ t, d }) => `${fmtDate(d.start_time)} (${t.title})`)
  qa.push([
    `When do ${name} trips depart?`,
    (soon.length ? `The next listed departures are ${soon.join(', ')}.` : 'None of the listed trips has a fixed departure coming up right now.') +
      (f.anyDateTrips.length
        ? ` ${f.anyDateTrips.length} private ${f.anyDateTrips.length === 1 ? 'trip runs' : 'trips run'} on the dates you choose.`
        : ''),
  ])
  if (f.ops.length) {
    const names = f.ops.slice(0, 8).map(opName)
    qa.push([
      `Which tour operators run ${name} trips?`,
      `${f.ops.length} ${f.ops.length === 1 ? 'operator lists' : 'operators list'} ${name} trips on TripAvail: ${names.join(', ')}${f.ops.length > 8 ? ` and ${f.ops.length - 8} more` : ''}.`,
    ])
  }
  const enquiry = h.tours.filter(isEnquiry).length
  qa.push([
    `How do I book a ${name} trip?`,
    enquiry === h.tours.length
      ? `Each ${name} trip here is booked directly with its tour operator on WhatsApp; the trip page has the button. Confirm the price and dates with them before you pay.`
      : enquiry
        ? `Trips from operators on TripAvail are booked on the site. Trips from operators not on TripAvail yet are booked directly with the operator on WhatsApp; each trip page says which.`
        : `Pick a trip and a departure date, then book on TripAvail.`,
  ])
  return qa
}
const faqLd = (qa, id) => ({
  '@type': 'FAQPage',
  '@id': id,
  mainEntity: qa.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
})
const faqHtml = (qa, heading) =>
  `<section>\n<h2>${esc(heading)}</h2>\n${qa.map(([q, a]) => `<h3>${esc(q)}</h3>\n<p>${esc(a)}</p>`).join('\n')}\n</section>`

function destinationPage(site, h) {
  const f = hubFacts(site, h)
  const qa = hubFaq(site, h, f)
  const canonical = `${SITE}${destPath(h)}`
  const main0 = f.currencies[0]
  const upcomingTrips = h.tours.filter((t) => site.upcoming(t).length)
  const pastTrips = h.tours.filter((t) => !site.upcoming(t).length && !anyDate(t))
  const others = destinationHubs(site).list.filter((x) => x.slug !== h.slug).slice(0, 12)
  const summary = [
    `${h.tours.length} trips to ${h.name} from ${f.ops.length} local tour ${f.ops.length === 1 ? 'operator' : 'operators'}.`,
    main0 ? `Prices from ${fmtMoney(main0.min, main0.currency)} per person.` : '',
    f.days ? `Trips run ${f.days.min === f.days.max ? daysLabel(f.days.min) : `${f.days.min}–${f.days.max} days`}.` : '',
    f.departures.length ? `Next departure ${fmtDate(f.departures[0].d.start_time)}.` : '',
  ].filter(Boolean)
  const main = `<nav aria-label="Breadcrumb"><a href="/">Home</a> › <a href="/destinations">Destinations</a> › ${esc(h.name)}</nav>
<h1>${esc(h.name)} tours: ${h.tours.length} trips with prices and dates</h1>
<p>${esc(summary.join(' '))}</p>
${
  f.departures.length
    ? `<section>\n<h2>${esc(h.name)} trips departing soon</h2>\n<ul>\n${f.departures
        .slice(0, 12)
        .map(({ t, d }) => {
          const price = Number(d.price_override) || tourPrice(t)
          return `<li>${esc(fmtDate(d.start_time))} — ${link(tourPath(t), t.title)}${price > 0 ? ` — ${esc(fmtMoney(price, t.currency))} per person` : ''}</li>`
        })
        .join('\n')}\n</ul>\n</section>`
    : ''
}
${upcomingTrips.length ? `<section>\n<h2>${esc(h.name)} trips with upcoming dates</h2>\n<ul>\n${upcomingTrips.map((t) => tourItem(site, t)).join('\n')}\n</ul>\n</section>` : ''}
${f.anyDateTrips.length ? `<section>\n<h2>Private ${esc(h.name)} trips on dates you choose</h2>\n<ul>\n${f.anyDateTrips.map((t) => tourItem(site, t)).join('\n')}\n</ul>\n</section>` : ''}
${pastTrips.length ? `<section>\n<h2>Past ${esc(h.name)} trips</h2>\n<p>No departures coming up; ask the operator about new dates.</p>\n<ul>\n${pastTrips.map((t) => tourItem(site, t)).join('\n')}\n</ul>\n</section>` : ''}
${faqHtml(qa, `${h.name} trips: common questions`)}
${f.ops.length ? `<section>\n<h2>Tour operators for ${esc(h.name)}</h2>\n<ul>\n${f.ops.map((o) => `<li>${link(opPath(o), opName(o))}</li>`).join('\n')}\n</ul>\n</section>` : ''}
${others.length ? `<section>\n<h2>Other destinations</h2>\n<ul>\n${others.map((x) => `<li>${link(destPath(x), `${x.name} tours`)} (${x.tours.length})</li>`).join('\n')}\n</ul>\n</section>` : ''}`

  return {
    title: `${h.name} tours — ${h.tours.length} trips with prices and dates`,
    description: clip(
      `Compare ${h.tours.length} ${h.name} tours from ${f.ops.length} local operators.` +
        (main0 ? ` Prices from ${fmtMoney(main0.min, main0.currency)} per person.` : '') +
        (f.days ? ` ${f.days.min}–${f.days.max} days.` : '') +
        (f.departures.length ? ` Next departure ${fmtDate(f.departures[0].d.start_time)}.` : ''),
      160,
    ),
    canonical,
    image: tourImages(h.tours[0])[0],
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'CollectionPage', '@id': `${canonical}#page`, url: canonical, name: `${h.name} tours`, isPartOf: { '@id': `${SITE}/#website` }, mainEntity: itemList(h.tours) },
        faqLd(qa, `${canonical}#faq`),
        breadcrumbs([['Home', `${SITE}/`], ['Destinations', `${SITE}/destinations`], [h.name, canonical]]),
      ],
    },
    body: chrome(main),
  }
}

function destinationsIndexPage(site) {
  const { list } = destinationHubs(site)
  const canonical = `${SITE}/destinations`
  const item = (h) => {
    const m = hubFacts(site, h).currencies[0]
    return `<li>${link(destPath(h), `${h.name} tours`)} — ${h.tours.length} trips${m ? `, from ${esc(fmtMoney(m.min, m.currency))} per person` : ''}</li>`
  }
  const main = `<nav aria-label="Breadcrumb"><a href="/">Home</a> › Destinations</nav>
<h1>Tour destinations: ${list.length} places with trips, prices and dates</h1>
<p>Every destination with at least ${HUB_MIN} live trips on TripAvail. Each page lists the trips that go there, their prices per person, how many days they take and the next departure dates.</p>
<ul>\n${list.map(item).join('\n')}\n</ul>`
  return {
    title: `Tour destinations — ${list.length} places with trips, prices and dates`,
    description: clip(`Trips to ${list.slice(0, 6).map((h) => h.name).join(', ')} and more — compare prices per person, trip length and departure dates from local tour operators.`, 160),
    canonical,
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'CollectionPage', '@id': `${canonical}#page`, url: canonical, name: 'Tour destinations', isPartOf: { '@id': `${SITE}/#website` } },
        breadcrumbs([['Home', `${SITE}/`], ['Destinations', canonical]]),
      ],
    },
    body: chrome(main),
  }
}

/** A trip's own FAQ, from its listing: price, dates, inclusions, how to book. */
function tourFaq(site, t, op) {
  const qa = []
  const price = tourPrice(t)
  const upcoming = site.upcoming(t)
  qa.push([
    `How much does ${t.title} cost?`,
    price > 0
      ? `${capital(priceLabel(t))}, as listed by ${op ? opName(op) : 'the operator'}.`
      : `The operator quotes the price on request; ask them on WhatsApp.`,
  ])
  qa.push([
    `When does ${t.title} depart?`,
    upcoming.length
      ? `Upcoming departures: ${upcoming.slice(0, 6).map((d) => fmtDate(d.start_time)).join(', ')}.`
      : anyDate(t)
        ? 'It runs on the dates you choose; tell the operator your dates.'
        : 'There are no departures coming up right now; ask the operator about new dates.',
  ])
  const inc = strList(t.inclusions)
  if (inc.length) qa.push([`What is included in ${t.title}?`, `${inc.slice(0, 8).join('; ')}.`])
  qa.push([
    `How do I book ${t.title}?`,
    isEnquiry(t)
      ? `You book it directly with ${op ? opName(op) : 'the operator'} on WhatsApp; the operator is not on TripAvail yet. Confirm the price and dates before you pay.`
      : 'Choose a departure date on TripAvail and book online.',
  ])
  return qa
}

function toursIndexPage(site) {
  const { tours } = site
  const country = mainCountry(tours)
  const groups = byDestination(tours)
  const main = `<nav aria-label="Breadcrumb"><a href="/">Home</a> › Tours</nav>
<h1>Tours in ${esc(country)}: ${tours.length} trips with prices and dates</h1>
<p>Every live tour on TripAvail, grouped by destination. Each one shows the length, the price per person, the difficulty and the next departure date.</p>
${destinationSections(site, groups)}
${site.liveOperators.length ? `<section>\n<h2>Tour operators</h2>\n<ul>\n${operatorItems(site)}\n</ul>\n</section>` : ''}`

  const canonical = `${SITE}/tours`
  return {
    title: `Tours in ${country} — ${tours.length} trips with prices and dates`,
    description: clip(
      `${tours.length} tours in ${country} from local operators, grouped by destination: ` +
        `${groups.slice(0, 5).map(([c]) => c).join(', ')}. Compare prices per person, trip length and departure dates.`,
      160,
    ),
    canonical,
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'CollectionPage', '@id': `${canonical}#page`, url: canonical, name: `Tours in ${country}`, isPartOf: { '@id': `${SITE}/#website` }, mainEntity: itemList(tours) },
        breadcrumbs([['Home', `${SITE}/`], ['Tours', canonical]]),
      ],
    },
    body: chrome(main),
  }
}

function tourPage(site, t) {
  const canonical = `${SITE}${tourPath(t)}`
  const op = site.opById.get(t.operator_id)
  const city = tourCity(t)
  const place = tourPlace(t)
  const days = tourDays(t)
  const price = tourPrice(t)
  const upcoming = site.upcoming(t)
  const images = tourImages(t)
  const highlights = strList(t.highlights)
  const included = strList(t.inclusions)
  const excluded = strList(t.exclusions)
  const itinerary = itineraryDays(t)
  const languages = tourLanguages(t)
  const rating = Number(t.rating) || 0
  const reviews = Number(t.review_count) || 0

  const facts = [
    place && ['Destination', esc(place)],
    days && ['Length', esc(daysLabel(days))],
    ['Price', esc(capital(priceLabel(t)))],
    t.difficulty_level && ['Difficulty', esc(capital(t.difficulty_level))],
    t.tour_type && ['Type', esc(capital(t.tour_type))],
    Number(t.max_participants) > 0 && ['Group size', `Up to ${Number(t.max_participants)} travellers`],
    Number(t.min_age) > 0 && ['Minimum age', String(Number(t.min_age))],
    languages.length && ['Languages', esc(languages.join(', '))],
    // Enquiry trips aren't sold through TripAvail; a trigger fills a 'flexible' default that isn't theirs.
    isEnquiry(t)
      ? ['Cancellation', 'Set by the operator; ask them before you pay']
      : t.cancellation_policy_type && [
          'Cancellation',
          `${esc(capital(t.cancellation_policy_type))} (<a href="/refunds">how cancellations work</a>)`,
        ],
    reviews > 0 && rating > 0 && ['Rating', `${rating.toFixed(1)} out of 5 from ${reviews} ${reviews === 1 ? 'review' : 'reviews'}`],
    op && ['Operator', `${link(opPath(op), opName(op))}${op.has_identity_verified ? ' (ID verified)' : ''}`],
    isEnquiry(t) && [
      'How to book',
      op?.public_whatsapp
        ? `Directly with the operator on <a href="https://wa.me/${esc(String(op.public_whatsapp).replace(/\D/g, ''))}" rel="nofollow noopener">WhatsApp</a>`
        : 'Directly with the operator',
    ],
  ].filter(Boolean)

  const sameCity = site.tours.filter((x) => x.id !== t.id && city && tourCity(x) === city).slice(0, 6)
  const sameOp = site.tours
    .filter((x) => x.id !== t.id && x.operator_id === t.operator_id && !sameCity.includes(x))
    .slice(0, 6)

  const main = `<nav aria-label="Breadcrumb"><a href="/">Home</a> › <a href="/tours">Tours</a> › ${esc(t.title)}</nav>
<article>
<h1>${esc(t.title)}</h1>
${t.short_description ? `<p>${esc(clean(t.short_description))}</p>` : ''}
<dl>
${facts.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('\n')}
</dl>
${t.description ? `<section>\n<h2>About this tour</h2>\n${paragraphs(t.description)}\n</section>` : ''}
${highlights.length ? `<section>\n<h2>Highlights</h2>\n<ul>\n${highlights.map((h) => `<li>${esc(h)}</li>`).join('\n')}\n</ul>\n</section>` : ''}
${
  itinerary.length
    ? `<section>\n<h2>Itinerary</h2>\n${itinerary
        .map(
          (d) =>
            `<h3>Day ${d.day}${d.title ? `: ${esc(d.title)}` : ''}</h3>` +
            (d.activities.length
              ? `\n<ul>\n${d.activities
                  .map(
                    (a) =>
                      `<li>${a.time ? `${esc(a.time)} — ` : ''}${esc(a.title)}${a.description ? `: ${esc(a.description)}` : ''}</li>`,
                  )
                  .join('\n')}\n</ul>`
              : ''),
        )
        .join('\n')}\n</section>`
    : ''
}
${included.length ? `<section>\n<h2>What's included</h2>\n<ul>\n${included.map((x) => `<li>${esc(x)}</li>`).join('\n')}\n</ul>\n</section>` : ''}
${excluded.length ? `<section>\n<h2>Not included</h2>\n<ul>\n${excluded.map((x) => `<li>${esc(x)}</li>`).join('\n')}\n</ul>\n</section>` : ''}
<section>
<h2>Departure dates</h2>
${
  upcoming.length
    ? `<ul>\n${upcoming
        .slice(0, 20)
        .map((d) => {
          const left = seatsLeft(d)
          const p = Number(d.price_override) || price
          const bits = [p > 0 ? `${fmtMoney(p, t.currency)} per person` : '', left !== null ? `${left} seats left` : '']
          return `<li>${esc(fmtDate(d.start_time))}${bits.some(Boolean) ? ` — ${esc(bits.filter(Boolean).join(' · '))}` : ''}</li>`
        })
        .join('\n')}\n</ul>`
    : anyDate(t)
      ? '<p>Runs on dates you choose: the operator runs this trip on request, so ask them for your dates.</p>'
      : '<p>No departure dates are listed right now.</p>'
}
</section>
${
  op
    ? `<section>\n<h2>About the operator</h2>\n<p>This tour is run by ${link(opPath(op), opName(op))}${op.primary_city ? `, based in ${esc(clean(op.primary_city))}` : ''}.${op.has_identity_verified ? ' TripAvail has verified the operator\'s identity.' : ''}${isEnquiry(t) ? ' The operator is not on TripAvail yet: TripAvail lists this trip from their public listings, and you book it directly with them. Confirm the price and dates before you pay.' : ''}</p>\n</section>`
    : ''
}
${(() => {
  const hubs = [...tourDestKeys(t).keys()].map((k) => destinationHubs(site).bySlug.get(k)).filter(Boolean)
  return hubs.length ? `<section>
<h2>Destinations on this trip</h2>
<p>${hubs.map((h) => link(destPath(h), `${h.name} tours`)).join(' · ')}</p>
</section>` : ''
})()}
${faqHtml(tourFaq(site, t, op), 'Questions about this trip')}
</article>
${sameCity.length ? `<section>\n<h2>More tours in ${esc(city)}</h2>\n<ul>\n${sameCity.map((x) => tourItem(site, x)).join('\n')}\n</ul>\n</section>` : ''}
${op && sameOp.length ? `<section>\n<h2>More tours from ${esc(opName(op))}</h2>\n<ul>\n${sameOp.map((x) => tourItem(site, x, { withOperator: false })).join('\n')}\n</ul>\n</section>` : ''}`

  // Title: name plus the facts people search with, without repeating a city the name already has.
  const titleBits = [days ? `${days}-day trip` : '', city && !t.title.toLowerCase().includes(city.toLowerCase()) ? `in ${city}` : '']
    .filter(Boolean)
    .join(' ')
  const title = [t.title, [titleBits, price > 0 ? `from ${fmtMoney(price, t.currency)}` : ''].filter(Boolean).join(', ')]
    .filter(Boolean)
    .join(' — ')

  const next = upcoming[0]
  const description = clip(
    [
      `${days ? `${days}-day ` : ''}${t.tour_type ? `${clean(t.tour_type).toLowerCase()} ` : ''}trip${place ? ` to ${place}` : ''}.`,
      price > 0 ? `From ${fmtMoney(price, t.currency)} per person.` : '',
      next ? `Next departure ${fmtDate(next.start_time)}.` : '',
      op ? `Run by ${opName(op)}.` : '',
      clean(t.short_description),
    ]
      .filter(Boolean)
      .join(' '),
    160,
  )

  const trip = {
    '@type': price > 0 ? ['Product', 'TouristTrip'] : 'TouristTrip',
    '@id': `${canonical}#trip`,
    name: t.title,
    description: clip(t.description || t.short_description || description, 500),
    url: canonical,
    ...(images.length ? { image: images.slice(0, 6) } : {}),
    ...(t.tour_type ? { touristType: clean(t.tour_type) } : {}),
    ...(itinerary.length
      ? {
          itinerary: {
            '@type': 'ItemList',
            itemListElement: itinerary.map((d, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              name: `Day ${d.day}${d.title ? `: ${d.title}` : ''}`,
              ...(d.activities.length ? { description: d.activities.map((a) => a.title).join('; ') } : {}),
            })),
          },
        }
      : {}),
    ...(op ? { provider: { '@type': 'TravelAgency', name: opName(op), ...(opPath(op) ? { url: `${SITE}${opPath(op)}` } : {}) } } : {}),
    ...(price > 0
      ? {
          offers: {
            '@type': 'Offer',
            price,
            priceCurrency: t.currency || 'PKR',
            url: canonical,
            ...(upcoming.length ? { availability: 'https://schema.org/InStock' } : {}),
          },
        }
      : {}),
    ...(reviews > 0 && rating > 0
      ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: rating, reviewCount: reviews } }
      : {}),
  }

  return {
    title,
    description,
    canonical,
    image: images[0],
    ogType: 'product',
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        trip,
        faqLd(tourFaq(site, t, op), `${canonical}#faq`),
        breadcrumbs([['Home', `${SITE}/`], ['Tours', `${SITE}/tours`], [t.title, canonical]]),
      ],
    },
    body: chrome(main),
  }
}

function operatorPage(site, o) {
  const name = opName(o)
  const city = clean(o.primary_city)
  const canonical = `${SITE}${opPath(o) || `/operators/${o.user_id}`}`
  const tours = site.toursByOp.get(o.user_id) || []
  const verified = Boolean(o.has_identity_verified)
  const years = Number(o.years_experience) || 0

  const main = `<nav aria-label="Breadcrumb"><a href="/">Home</a> › <a href="/tours">Tours</a> › ${esc(name)}</nav>
<h1>${esc(name)}</h1>
<p>Tour operator${city ? ` based in ${esc(city)}` : ''}.${years > 0 ? ` ${years} ${years === 1 ? 'year' : 'years'} of experience.` : ''}${verified ? ' TripAvail has verified this operator\'s identity.' : ''}</p>
${o.listing_status === 'unclaimed' ? `<p>Not on TripAvail yet: TripAvail set up this profile from ${esc(name)}'s public listings. Their trips are booked directly with them${o.public_whatsapp ? ` on <a href="https://wa.me/${esc(String(o.public_whatsapp).replace(/\D/g, ''))}" rel="nofollow noopener">WhatsApp</a>` : ''}.</p>` : ''}
${o.description ? `<section>\n<h2>About ${esc(name)}</h2>\n${paragraphs(o.description)}\n</section>` : ''}
<section>
<h2>Tours by ${esc(name)}</h2>
${tours.length ? `<ul>\n${tours.map((t) => tourItem(site, t, { withOperator: false })).join('\n')}\n</ul>` : '<p>No tours are live right now.</p>'}
</section>`

  const titleTail = `${verified ? 'ID-verified ' : ''}tour operator${city ? ` in ${city}` : ''}`
  const description = clip(
    `${name} is a tour operator${city ? ` based in ${city}` : ''}` +
      (tours.length
        ? ` with ${tours.length} ${tours.length === 1 ? 'tour' : 'tours'} on TripAvail: ${tours
            .slice(0, 3)
            .map((t) => clean(t.title))
            .join(', ')}.`
        : '.') +
      (o.description ? ` ${clean(o.description)}` : ''),
    160,
  )
  return {
    title: `${name} — ${titleTail}`,
    description,
    canonical,
    image: o.company_logo_url || undefined,
    // A profile with nothing to book is a thin page; keep it out of the index until it has tours.
    robots: tours.length ? PUBLIC_ROBOTS : 'noindex, follow',
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'TravelAgency',
          '@id': `${canonical}#operator`,
          name,
          url: canonical,
          ...(city ? { address: { '@type': 'PostalAddress', addressLocality: city } } : {}),
          ...(o.company_logo_url ? { image: o.company_logo_url, logo: o.company_logo_url } : {}),
          ...(o.description ? { description: clip(o.description, 500) } : {}),
          ...(tours.length
            ? {
                makesOffer: tours.map((t) => ({
                  '@type': 'Offer',
                  url: `${SITE}${tourPath(t)}`,
                  itemOffered: { '@type': 'TouristTrip', name: t.title },
                  ...(tourPrice(t) > 0 ? { price: tourPrice(t), priceCurrency: t.currency || 'PKR' } : {}),
                })),
              }
            : {}),
        },
        breadcrumbs([['Home', `${SITE}/`], ['Tours', `${SITE}/tours`], [name, canonical]]),
      ],
    },
    body: chrome(main),
  }
}

// Hotel packages (Phase 3): head meta only, as before.
async function fetchPackage(slugOrId) {
  const isUuid = UUID_RE.test(slugOrId)
  const key = isUuid ? 'id' : 'slug'
  const rows = await sbFetch(
    `packages?${key}=eq.${encodeURIComponent(slugOrId)}&is_published=eq.true&status=eq.live` +
      `&select=name,description,media_urls,cover_image,base_price_per_night,currency,slug&limit=1`,
  )
  return rows[0] || null
}
function packageMeta(row) {
  const canonical = `${SITE}/packages/${row.slug || ''}`
  const description = clip(row.description, 200) || undefined
  const image = (arr(row.media_urls).find((u) => typeof u === 'string')) || row.cover_image || undefined
  const price = Number(row.base_price_per_night) || 0
  return {
    title: row.name,
    description,
    canonical,
    image,
    ogType: 'product',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: row.name,
      ...(description ? { description } : {}),
      ...(image ? { image: [image] } : {}),
      ...(price > 0
        ? { offers: { '@type': 'Offer', price, priceCurrency: row.currency || 'PKR', url: canonical } }
        : {}),
    },
  }
}

// ─── Machine-readable files ─────────────────────────────────────────────────

async function buildSitemap() {
  const site = await loadSite()
  const pkgs = LAUNCH_HOTELS
    ? await sbFetch('packages?is_published=eq.true&status=eq.live&select=slug,id&limit=5000')
    : []
  const day = (iso) => (iso ? String(iso).slice(0, 10) : '')
  const newest = (tours) => tours.map((t) => day(t.updated_at)).sort().pop() || ''
  // /explore redirects to / until hotels launch; /help and /legal need a login.
  const statics = [
    ['/', '1.0', newest(site.tours)],
    ['/tours', '0.9', newest(site.tours)],
    ['/destinations', '0.8', newest(site.tours)],
    ...(LAUNCH_HOTELS ? [['/hotels', '0.7', ''], ['/explore', '0.7', '']] : []),
    ['/contact', '0.3', ''],
    ['/refunds', '0.3', ''],
    ['/terms', '0.2', ''],
    ['/privacy', '0.2', ''],
  ]
  const urls = [
    ...statics.map(([p, priority, lastmod]) => ({ loc: `${SITE}${p}`, priority, lastmod })),
    ...site.tours.map((t) => ({ loc: `${SITE}${tourPath(t)}`, priority: '0.8', lastmod: day(t.updated_at) })),
    ...destinationHubs(site).list.map((h) => ({ loc: `${SITE}${destPath(h)}`, priority: '0.8', lastmod: newest(h.tours) })),
    ...pkgs.map((p) => ({ loc: `${SITE}/packages/${p.slug || p.id}`, priority: '0.8', lastmod: '' })),
    ...site.liveOperators.map((o) => ({
      loc: `${SITE}${opPath(o)}`,
      priority: '0.6',
      lastmod: newest(site.toursByOp.get(o.user_id) || []),
    })),
  ]
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls
      .map(
        (u) =>
          `  <url><loc>${esc(u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}<priority>${u.priority}</priority></url>`,
      )
      .join('\n') +
    `\n</urlset>\n`
  )
}

// llms.txt (llmstxt.org): a plain-language map of the site for AI assistants.
function buildLlmsTxt(site) {
  const { tours, liveOperators } = site
  const country = mainCountry(tours)
  const host = SITE.replace(/^https?:\/\//, '')
  const out = [
    '# TripAvail',
    '',
    `> TripAvail (${host}) is a website for finding and booking tours and trips in ${country}. Local tour operators list their trips with the price per person, a day-by-day itinerary and departure dates; travellers compare them and book on TripAvail.`,
    '',
    `Prices, dates and itineraries are set by each tour operator. This file is generated from the live listings: ${tours.length} tours from ${liveOperators.length} operators, updated ${new Date().toISOString().slice(0, 10)}.`,
    '',
    '## Main pages',
    '',
    `- [All tours](${SITE}/tours): every live tour, grouped by destination, with length, price and next departure`,
    `- [Destinations](${SITE}/destinations): one page per destination with its trips, price range, trip lengths and next departures`,
    `- [Cancellations and refunds](${SITE}/refunds): how cancellations and refunds work on TripAvail`,
    `- [Contact](${SITE}/contact): support for travellers and tour operators (${SUPPORT_EMAIL})`,
    `- [List your tours](${SITE}/partner/onboarding): for tour operators who want to sell on TripAvail`,
    '',
    '## Tours',
    '',
  ]
  for (const [, list] of byDestination(tours)) {
    for (const t of list) out.push(`- [${mdText(t.title)}](${SITE}${tourPath(t)}): ${tourFacts(site, t)}`)
  }
  const hubs = destinationHubs(site).list
  if (hubs.length) {
    out.push('', '## Destinations', '')
    for (const h of hubs) {
      const m = hubFacts(site, h).currencies[0]
      out.push(`- [${mdText(h.name)} tours](${SITE}${destPath(h)}): ${h.tours.length} trips${m ? `, from ${fmtMoney(m.min, m.currency)} per person` : ''}`)
    }
  }
  if (liveOperators.length) {
    out.push('', '## Tour operators', '')
    for (const o of liveOperators) {
      const n = site.toursByOp.get(o.user_id)?.length || 0
      const bits = [clean(o.primary_city), `${n} ${n === 1 ? 'tour' : 'tours'}`, o.has_identity_verified ? 'ID verified' : '']
      out.push(`- [${mdText(opName(o))}](${SITE}${opPath(o)}): ${bits.filter(Boolean).join(' · ')}`)
    }
  }
  out.push(
    '',
    '## Optional',
    '',
    `- [Full tour details](${SITE}/llms-full.txt): itinerary, inclusions, exclusions and departure dates for every tour`,
    `- [Sitemap](${SITE}/sitemap.xml)`,
  )
  return `${out.join('\n')}\n`
}

function buildLlmsFullTxt(site) {
  const { tours } = site
  const country = mainCountry(tours)
  const out = [
    '# TripAvail — full tour details',
    '',
    `> Every live tour on TripAvail (tours and trips in ${country}), with itinerary, inclusions and departure dates. Prices, dates and itineraries are set by each tour operator. Generated ${new Date().toISOString().slice(0, 10)}.`,
    '',
  ]
  for (const [city, list] of byDestination(tours)) {
    out.push(`## ${mdText(city)}`, '')
    for (const t of list) {
      const op = site.opById.get(t.operator_id)
      const days = tourDays(t)
      const upcoming = site.upcoming(t)
      const languages = tourLanguages(t)
      out.push(`### ${mdText(t.title)}`, '')
      out.push(`- Page: ${SITE}${tourPath(t)}`)
      if (tourPlace(t)) out.push(`- Destination: ${tourPlace(t)}`)
      if (days) out.push(`- Length: ${daysLabel(days)}`)
      out.push(`- Price: ${priceLabel(t)}`)
      if (t.difficulty_level) out.push(`- Difficulty: ${capital(t.difficulty_level)}`)
      if (t.tour_type) out.push(`- Type: ${capital(t.tour_type)}`)
      if (Number(t.max_participants) > 0) out.push(`- Group size: up to ${Number(t.max_participants)}`)
      if (Number(t.min_age) > 0) out.push(`- Minimum age: ${Number(t.min_age)}`)
      if (languages.length) out.push(`- Languages: ${languages.join(', ')}`)
      if (isEnquiry(t)) out.push('- Booking: directly with the operator (not through TripAvail); cancellation terms are set by the operator')
      else if (t.cancellation_policy_type) out.push(`- Cancellation policy: ${capital(t.cancellation_policy_type)}`)
      if (op) out.push(`- Operator: ${opName(op)}${opPath(op) ? ` (${SITE}${opPath(op)})` : ''}${op.has_identity_verified ? ', ID verified' : ''}`)
      out.push(
        `- Departures: ${
          upcoming.length
            ? upcoming
                .slice(0, 10)
                .map((d) => {
                  const left = seatsLeft(d)
                  return `${fmtDate(d.start_time)}${left !== null ? ` (${left} seats left)` : ''}`
                })
                .join('; ')
            : anyDate(t) ? 'any date you choose (runs on request)' : 'none scheduled right now'
        }`,
      )
      out.push('')
      const about = clean(t.description || t.short_description)
      if (about) out.push(about, '')
      const highlights = strList(t.highlights)
      if (highlights.length) out.push('Highlights:', ...highlights.map((h) => `- ${h}`), '')
      const itinerary = itineraryDays(t)
      if (itinerary.length) {
        out.push('Itinerary:')
        for (const d of itinerary) {
          const acts = d.activities
            .map((a) => `${a.time ? `${a.time} ` : ''}${a.title}${a.description ? ` (${a.description})` : ''}`)
            .join('; ')
          out.push(`- Day ${d.day}${d.title ? `, ${d.title}` : ''}${acts ? `: ${acts}` : ''}`)
        }
        out.push('')
      }
      const included = strList(t.inclusions)
      if (included.length) out.push(`Included: ${included.join('; ')}`)
      const excluded = strList(t.exclusions)
      if (excluded.length) out.push(`Not included: ${excluded.join('; ')}`)
      out.push('')
    }
  }
  return `${out.join('\n')}\n`
}

// ─── HTTP ───────────────────────────────────────────────────────────────────

const serve = sirv(distDir, {
  dev: false,
  single: true,
  etag: true,
  setHeaders(res, pathname) {
    for (const [k, v] of Object.entries(SECURITY_HEADERS)) res.setHeader(k, v)
    if (pathname.startsWith('/assets/')) {
      // Content-hashed build assets — safe to cache forever.
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
    } else if (/\.(svg|png|jpe?g|webp|gif|ico|txt|xml|woff2?)$/i.test(pathname)) {
      res.setHeader('Cache-Control', 'public, max-age=86400')
    } else {
      // The HTML shell (and SPA fallback) must always fetch the newest asset hashes.
      res.setHeader('Cache-Control', 'no-store')
    }
  },
})

function sendHtml(res, html, { status = 200, cache = 'no-store' } = {}) {
  res.writeHead(status, {
    ...SECURITY_HEADERS,
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': cache,
  })
  res.end(html)
}

function sendText(res, body, type) {
  res.writeHead(200, {
    ...SECURITY_HEADERS,
    'Content-Type': `${type}; charset=utf-8`,
    'Cache-Control': 'public, max-age=3600',
  })
  res.end(body)
}

function redirect(res, location) {
  res.writeHead(301, { ...SECURITY_HEADERS, Location: location, 'Cache-Control': 'public, max-age=3600' })
  res.end()
}

// The app still loads (it shows its own "not found" screen); crawlers get a real 404.
const sendNotFound = (res) => sendHtml(res, renderShell({ title: 'Page not found', robots: 'noindex, follow' }), { status: 404 })

/** Server-side answers for public, crawlable URLs. Returns false to let sirv serve the SPA. */
async function handlePublicRoute(pathname, search, res) {
  if (pathname === '/sitemap.xml') {
    sendText(res, await buildSitemap(), 'application/xml')
    return true
  }
  if (pathname === '/llms.txt') {
    sendText(res, buildLlmsTxt(await loadSite()), 'text/plain')
    return true
  }
  if (pathname === '/llms-full.txt') {
    sendText(res, buildLlmsFullTxt(await loadSite()), 'text/plain')
    return true
  }
  if (!INDEX_HTML) return false

  // Until hotels launch the app sends /explore to the home page; tell crawlers the same.
  if (!LAUNCH_HOTELS && /^\/explore\/?$/.test(pathname)) {
    redirect(res, `/${search}`)
    return true
  }
  if (pathname === '/') {
    sendHtml(res, renderShell(homePage(await loadSite())))
    return true
  }
  if (/^\/destinations\/?$/.test(pathname)) {
    sendHtml(res, renderShell(destinationsIndexPage(await loadSite())))
    return true
  }
  const dm = pathname.match(/^\/destinations\/([^/]+)\/?$/)
  if (dm) {
    const site = await loadSite()
    const want = destKey(decodeURIComponent(dm[1]))
    const hub = destinationHubs(site).bySlug.get(want)
    if (!hub) {
      sendNotFound(res)
      return true
    }
    if (dm[1] !== hub.slug) {
      redirect(res, `${destPath(hub)}${search}`)
      return true
    }
    sendHtml(res, renderShell(destinationPage(site, hub)))
    return true
  }
  if (/^\/tours\/?$/.test(pathname)) {
    sendHtml(res, renderShell(toursIndexPage(await loadSite())))
    return true
  }

  const tm = pathname.match(/^\/tours\/([^/]+)\/?$/)
  if (tm) {
    const site = await loadSite()
    const tour = await findTour(site, tm[1])
    if (!tour) {
      sendNotFound(res)
      return true
    }
    if (tour.slug && tm[1] !== tour.slug) {
      redirect(res, `${tourPath(tour)}${search}`)
      return true
    }
    sendHtml(res, renderShell(tourPage(site, tour)))
    return true
  }

  const om = pathname.match(/^\/operators\/([^/]+)\/?$/)
  if (om) {
    const site = await loadSite()
    const op = await findOperator(site, om[1])
    if (op) {
      if (op.slug && om[1] !== op.slug) {
        redirect(res, `${opPath(op)}${search}`)
        return true
      }
      sendHtml(res, renderShell(operatorPage(site, op)))
      return true
    }
    // Renamed profile (e.g. /operators/operator-8): send people and crawlers to the new URL.
    const moved = await loadSlugRedirect(om[1].toLowerCase())
    if (moved) {
      redirect(res, `/operators/${encodeURIComponent(moved)}${search}`)
      return true
    }
    sendNotFound(res)
    return true
  }

  if (LAUNCH_HOTELS) {
    const pm = pathname.match(/^\/packages\/([^/]+)\/?$/)
    if (pm) {
      const row = await fetchPackage(pm[1])
      if (row) {
        sendHtml(res, renderShell(packageMeta(row)))
        return true
      }
    }
  }
  return false
}

const server = http.createServer(async (req, res) => {
  if (seoEnabled && (req.method === 'GET' || req.method === 'HEAD')) {
    try {
      const url = new URL(req.url, SITE)
      const pathname = decodeURIComponent(url.pathname)
      if (await handlePublicRoute(pathname, url.search, res)) return
    } catch {
      // Supabase down, bad URL encoding, etc. — the plain SPA shell still works.
      if (res.headersSent) return
    }
  }
  serve(req, res)
})

server.listen(port, '0.0.0.0', () => {
  // eslint-disable-next-line no-console
  console.log(`[web] serving ${distDir} on :${port} (seo ${seoEnabled ? 'on' : 'off'})`)
})
