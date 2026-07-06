import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import sirv from 'sirv'

const port = Number.parseInt(process.env.PORT || '4173', 10)
const distDir = path.join(process.cwd(), 'packages', 'web', 'dist')
const SITE = process.env.PUBLIC_SITE_URL || 'https://tripavail.com'

// Supabase REST (anon) — used to inject per-listing meta + build the sitemap. Optional:
// if unset (or a fetch fails) we fall back to the default SPA shell, never erroring.
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || ''
const SUPABASE_ANON = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ''
const seoEnabled = Boolean(SUPABASE_URL && SUPABASE_ANON)

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

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function sbFetch(qs) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${qs}`, {
    headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` },
  })
  if (!res.ok) throw new Error(`supabase ${res.status}`)
  return res.json()
}

/** Fetch a single live listing by slug (or UUID). Returns null when not found/hidden. */
async function fetchListing(kind, slugOrId) {
  const isUuid = UUID_RE.test(slugOrId)
  const key = isUuid ? 'id' : 'slug'
  const val = isUuid ? slugOrId : encodeURIComponent(slugOrId)
  if (kind === 'tours') {
    const rows = await sbFetch(
      `tours?${key}=eq.${val}&is_active=eq.true&is_published=eq.true&status=eq.live` +
        `&select=title,short_description,description,images,price,currency,rating,review_count,slug,location&limit=1`,
    )
    return rows[0] || null
  }
  const rows = await sbFetch(
    `packages?${key}=eq.${val}&is_published=eq.true&status=eq.live` +
      `&select=name,description,media_urls,cover_image,base_price_per_night,currency,slug&limit=1`,
  )
  return rows[0] || null
}

/** Replace the shell's default head tags with page-specific ones + inject JSON-LD. */
function renderShell(meta) {
  const { title, description, canonical, image, jsonLd } = meta
  let html = INDEX_HTML
  const fullTitle = title ? `${title} · TripAvail` : 'TripAvail — Find Your Perfect Stay'
  const rep = (re, str) => {
    html = re.test(html) ? html.replace(re, str) : html
  }
  rep(/<title>[\s\S]*?<\/title>/, `<title>${esc(fullTitle)}</title>`)
  if (description) {
    rep(/<meta name="description"[^>]*>/, `<meta name="description" content="${esc(description)}" />`)
    rep(/<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${esc(description)}" />`)
  }
  rep(/<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${esc(title || 'TripAvail')}" />`)
  rep(/<meta property="og:type"[^>]*>/, `<meta property="og:type" content="product" />`)
  rep(/<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${esc(canonical)}" />`)
  if (image) rep(/<meta property="og:image"[^>]*>/, `<meta property="og:image" content="${esc(image)}" />`)

  const inject =
    `\n  <link rel="canonical" href="${esc(canonical)}" />` +
    `\n  <meta name="twitter:title" content="${esc(title || 'TripAvail')}" />` +
    (description ? `\n  <meta name="twitter:description" content="${esc(description)}" />` : '') +
    (image ? `\n  <meta name="twitter:image" content="${esc(image)}" />` : '') +
    (jsonLd
      ? `\n  <script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>`
      : '') +
    '\n</head>'
  html = html.replace('</head>', inject)
  return html
}

function listingMeta(kind, row) {
  const title = kind === 'tours' ? row.title : row.name
  const description = (row.short_description || row.description || '').slice(0, 200) || undefined
  const slug = row.slug || ''
  const canonical = `${SITE}/${kind}/${slug}`
  const imgs = kind === 'tours' ? row.images : row.media_urls
  const image =
    (Array.isArray(imgs) && typeof imgs[0] === 'string' ? imgs[0] : undefined) || row.cover_image || undefined
  const price = Number(kind === 'tours' ? row.price : row.base_price_per_night) || 0
  const rating = Number(row.rating) || 0
  const reviews = Number(row.review_count) || 0
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: title,
    ...(description ? { description } : {}),
    ...(image ? { image: [image] } : {}),
    ...(price > 0
      ? {
          offers: {
            '@type': 'Offer',
            price,
            priceCurrency: row.currency || 'PKR',
            availability: 'https://schema.org/InStock',
            url: canonical,
          },
        }
      : {}),
    ...(reviews > 0 && rating > 0
      ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: rating, reviewCount: reviews } }
      : {}),
  }
  return { title, description, canonical, image, jsonLd }
}

async function buildSitemap() {
  const [tours, pkgs] = await Promise.all([
    sbFetch('tours?is_active=eq.true&is_published=eq.true&status=eq.live&select=slug,id&limit=5000'),
    sbFetch('packages?is_published=eq.true&status=eq.live&select=slug,id&limit=5000'),
  ])
  const statics = ['/', '/hotels', '/tours', '/explore']
  const urls = [
    ...statics.map((p) => ({ loc: `${SITE}${p}`, priority: p === '/' ? '1.0' : '0.7' })),
    ...tours.map((t) => ({ loc: `${SITE}/tours/${t.slug || t.id}`, priority: '0.8' })),
    ...pkgs.map((p) => ({ loc: `${SITE}/packages/${p.slug || p.id}`, priority: '0.8' })),
  ]
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls
      .map((u) => `  <url><loc>${esc(u.loc)}</loc><priority>${u.priority}</priority></url>`)
      .join('\n') +
    `\n</urlset>\n`
  )
}

const serve = sirv(distDir, {
  dev: true,
  single: true,
  etag: true,
  setHeaders(res, servedPath) {
    for (const [k, v] of Object.entries(SECURITY_HEADERS)) res.setHeader(k, v)
    if (servedPath.endsWith('.html')) res.setHeader('Cache-Control', 'no-store')
  },
})

function sendHtml(res, html, cache = 'no-store') {
  res.writeHead(200, {
    ...SECURITY_HEADERS,
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': cache,
  })
  res.end(html)
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, SITE)
    const pathname = decodeURIComponent(url.pathname)

    // Dynamic sitemap
    if (pathname === '/sitemap.xml' && seoEnabled) {
      try {
        const xml = await buildSitemap()
        res.writeHead(200, {
          ...SECURITY_HEADERS,
          'Content-Type': 'application/xml; charset=utf-8',
          'Cache-Control': 'public, max-age=3600',
        })
        res.end(xml)
        return
      } catch {
        // fall through to sirv (which will 404 the sitemap)
      }
    }

    // Per-listing meta injection for shareable detail routes
    const m = pathname.match(/^\/(tours|packages)\/([^/]+)\/?$/)
    if (m && seoEnabled && INDEX_HTML) {
      try {
        const row = await fetchListing(m[1], m[2])
        if (row) {
          sendHtml(res, renderShell(listingMeta(m[1], row)))
          return
        }
      } catch {
        // fall through to the default shell
      }
    }
  } catch {
    // any parsing error → default serving
  }

  serve(req, res)
})

server.listen(port, '0.0.0.0', () => {
  // eslint-disable-next-line no-console
  console.log(`[web] serving ${distDir} on :${port} (seo ${seoEnabled ? 'on' : 'off'})`)
})
