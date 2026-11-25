/**
 * Destination hubs — one page per place travellers search for ("Hunza tours").
 *
 * MUST stay in step with server.mjs (destKey / DEST_STOP / HUB_MIN / hubFacts / hubFaq): the
 * server renders the same page for crawlers, and both must agree on which places have a page and
 * what the numbers are. Everything here is computed from live listings — no invented facts.
 */

export const HUB_MIN = 4

// Departure cities and overnight stops — where trips start or sleep, not where people go.
const DEST_STOP = new Set([
  'islamabad', 'rawalpindi', 'lahore', 'karachi', 'peshawar', 'multan', 'faisalabad', 'sialkot', 'quetta',
  'hyderabad', 'gujranwala', 'mirpur', 'besham', 'chilas', 'dassu', 'raikot-bridge', 'jaglot', 'mansehra',
  'abbottabad', 'balakot', 'pakistan', 'northern-pakistan', 'north-pakistan', 'northern-areas',
])

const plainLatin = (s: string) =>
  s.normalize('NFD').replace(/(\p{Script=Latin})\p{M}+/gu, '$1').normalize('NFC')

// Same as server.mjs titleCase: only an all-lowercase name is capitalised; anything else is kept.
const titleCase = (s: string) => {
  const t = s.replace(/\s+/g, ' ').trim()
  return t && t === t.toLowerCase() ? t.replace(/(^|[\s(/-])(\p{L})/gu, (_, a, c) => a + c.toUpperCase()) : t
}

export function destKey(name: string | null | undefined): string {
  return plainLatin(String(name || ''))
    .toLowerCase()
    .replace(/\(.*?\)/g, ' ')
    .replace(/\b(valley|city|national park|plains|district|pass|top)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const destLabel = (name: string) => titleCase(plainLatin(name.replace(/\s*\(.*?\)\s*/g, ' ').trim()))

export interface DestinationTour {
  id: string
  slug: string | null
  title: string
  location: { city?: string; country?: string } | string | null
  destination_cities: string[] | null
  price: number | null
  currency: string | null
  price_on_request: boolean | null
  duration_days: number | null
  images: string[] | null
  rating: number | null
  review_count?: number | null
  tour_type: string | null
  availability: 'scheduled' | 'on_request' | null
  booking_mode: 'instant' | 'enquiry' | null
  short_description: string | null
  operator_id: string
}

export function tourDestKeys(t: DestinationTour): Map<string, string> {
  const loc = t.location
  const raw = [typeof loc === 'string' ? loc : loc?.city, ...(t.destination_cities || [])]
  const keys = new Map<string, string>()
  for (const r of raw) {
    if (!r) continue
    const k = destKey(r)
    if (k && !DEST_STOP.has(k) && !keys.has(k)) keys.set(k, destLabel(r))
  }
  return keys
}

export interface DestinationHub {
  slug: string
  name: string
  tours: DestinationTour[]
}

export function buildHubs(tours: DestinationTour[]): DestinationHub[] {
  const hubs = new Map<string, { slug: string; labels: Map<string, number>; tours: DestinationTour[] }>()
  for (const t of tours) {
    for (const [k, label] of tourDestKeys(t)) {
      if (!hubs.has(k)) hubs.set(k, { slug: k, labels: new Map(), tours: [] })
      const h = hubs.get(k)!
      h.tours.push(t)
      h.labels.set(label, (h.labels.get(label) || 0) + 1)
    }
  }
  return [...hubs.values()]
    .filter((h) => h.tours.length >= HUB_MIN)
    .map((h) => ({
      slug: h.slug,
      tours: h.tours,
      name: [...h.labels.entries()].sort((a, b) => b[1] - a[1] || a[0].length - b[0].length)[0][0],
    }))
    .sort((a, b) => b.tours.length - a.tours.length || a.name.localeCompare(b.name))
}

export const tourPrice = (t: DestinationTour) => (t.price_on_request ? 0 : Number(t.price) || 0)

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b)
  if (!s.length) return 0
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2
}
const mostCommon = (xs: number[]) => {
  const c = new Map<number, number>()
  for (const x of xs) c.set(x, (c.get(x) || 0) + 1)
  return [...c.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0]?.[0] || 0
}

export interface PriceRange {
  currency: string
  min: number
  max: number
  median: number
  n: number
}

export function hubFacts(h: DestinationHub) {
  const priced = h.tours.filter((t) => tourPrice(t) > 0)
  const byCur = new Map<string, number[]>()
  for (const t of priced) {
    const c = (t.currency || 'PKR').toUpperCase()
    byCur.set(c, [...(byCur.get(c) || []), tourPrice(t)])
  }
  const currencies: PriceRange[] = [...byCur.entries()]
    .map(([currency, xs]) => ({ currency, min: Math.min(...xs), max: Math.max(...xs), median: median(xs), n: xs.length }))
    .sort((a, b) => Number(b.currency === 'PKR') - Number(a.currency === 'PKR') || b.n - a.n)
  const days = h.tours.map((t) => Number(t.duration_days) || 0).filter((d) => d > 0)
  return {
    currencies,
    onRequest: h.tours.length - priced.length,
    days: days.length ? { min: Math.min(...days), max: Math.max(...days), common: mostCommon(days) } : null,
    operators: new Set(h.tours.map((t) => t.operator_id)).size,
    enquiry: h.tours.filter((t) => t.booking_mode === 'enquiry').length,
  }
}
