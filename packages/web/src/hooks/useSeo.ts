import { useEffect } from 'react'

/**
 * Dependency-free per-route SEO. Imperatively sets <title>, meta description, canonical,
 * Open Graph / Twitter tags, robots, and a JSON-LD structured-data block. Google renders
 * client JS, so this covers organic SEO; server.mjs mirrors it into the initial HTML for
 * listing detail routes so non-JS social crawlers get correct share previews too.
 */
export interface SeoInput {
  /** Page title (without the brand suffix). */
  title?: string
  description?: string
  /** Absolute path for the canonical/og:url, e.g. "/tours/hunza-valley". Defaults to the site root. */
  canonicalPath?: string
  /** Absolute image URL for og:image / twitter:image. */
  image?: string
  /** og:type — "website" | "article" | "product" etc. */
  type?: string
  /** schema.org JSON-LD object(s). */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[]
  /** When true, emit robots noindex,nofollow (e.g. filtered search result pages). */
  noindex?: boolean
}

const SITE = 'https://tripavail.com'
const DEFAULT_TITLE = 'TripAvail — Find Your Perfect Stay'
const DEFAULT_DESC =
  'Discover and book tours, hotels, and travel packages across Pakistan and beyond. Verified operators, secure payments, real-time availability.'
const DEFAULT_IMAGE = `${SITE}/og-cover.png`

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

export function useSeo(input: SeoInput) {
  const { title, description, canonicalPath, image, type = 'website', jsonLd, noindex } = input

  useEffect(() => {
    const fullTitle = title ? `${title} · TripAvail` : DEFAULT_TITLE
    const desc = description || DEFAULT_DESC
    const canonical = canonicalPath ? `${SITE}${canonicalPath}` : SITE
    const img = image || DEFAULT_IMAGE

    document.title = fullTitle
    upsertMeta('name', 'description', desc)
    upsertMeta('name', 'robots', noindex ? 'noindex,nofollow' : 'index,follow')
    upsertMeta('property', 'og:title', title || DEFAULT_TITLE)
    upsertMeta('property', 'og:description', desc)
    upsertMeta('property', 'og:type', type)
    upsertMeta('property', 'og:url', canonical)
    upsertMeta('property', 'og:image', img)
    upsertMeta('name', 'twitter:card', 'summary_large_image')
    upsertMeta('name', 'twitter:title', title || DEFAULT_TITLE)
    upsertMeta('name', 'twitter:description', desc)
    upsertMeta('name', 'twitter:image', img)
    upsertLink('canonical', canonical)

    const id = 'seo-jsonld'
    const existing = document.getElementById(id)
    if (jsonLd) {
      const script = (existing as HTMLScriptElement | null) ?? document.createElement('script')
      script.id = id
      script.setAttribute('type', 'application/ld+json')
      script.textContent = JSON.stringify(jsonLd)
      if (!existing) document.head.appendChild(script)
    } else if (existing) {
      existing.remove()
    }
  }, [title, description, canonicalPath, image, type, noindex, JSON.stringify(jsonLd)])
}
