import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * A resolved visitor country. `name` must match how country is stored on listings
 * (tours.location.country) so a "Popular in {country}" rail can query it directly.
 */
export interface VisitorCountry {
  /** ISO-3166 alpha-2 code. */
  code: string
  /** Display + listing-match name (e.g. "Pakistan", "United Arab Emirates"). */
  name: string
  /** Regional grouping used for softer messaging. */
  region?: string
}

// A small, curated catalogue — the markets we can confidently resolve offline (no IP
// lookup) and speak to by name. Anything outside this set resolves to null, and the home
// simply shows its global default rather than guessing a country (no false personalization).
const COUNTRIES: Record<string, VisitorCountry> = {
  PK: { code: 'PK', name: 'Pakistan', region: 'South Asia' },
  AE: { code: 'AE', name: 'United Arab Emirates', region: 'Gulf' },
  SA: { code: 'SA', name: 'Saudi Arabia', region: 'Gulf' },
  QA: { code: 'QA', name: 'Qatar', region: 'Gulf' },
  BH: { code: 'BH', name: 'Bahrain', region: 'Gulf' },
  KW: { code: 'KW', name: 'Kuwait', region: 'Gulf' },
  OM: { code: 'OM', name: 'Oman', region: 'Gulf' },
  GB: { code: 'GB', name: 'United Kingdom', region: 'Europe' },
  IN: { code: 'IN', name: 'India', region: 'South Asia' },
  US: { code: 'US', name: 'United States', region: 'North America' },
}

// Timezone → country for the markets above. Cheap, offline, no-API; an IP-geo lookup can
// refine this later. The visitor can always browse worldwide regardless.
const TZ_COUNTRY: Record<string, string> = {
  'Asia/Karachi': 'PK',
  'Asia/Dubai': 'AE',
  'Asia/Riyadh': 'SA',
  'Asia/Qatar': 'QA',
  'Asia/Bahrain': 'BH',
  'Asia/Kuwait': 'KW',
  'Asia/Muscat': 'OM',
  'Europe/London': 'GB',
  'Asia/Kolkata': 'IN',
  'Asia/Calcutta': 'IN',
}

export function countryByCode(code: string | null | undefined): VisitorCountry | null {
  if (!code) return null
  return COUNTRIES[code.toUpperCase()] ?? null
}

/** Best-effort visitor country from the browser timezone. Null when unsure. */
export function detectVisitorCountry(): VisitorCountry | null {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''
    const code = TZ_COUNTRY[tz]
    if (code) return COUNTRIES[code]
    // Broad North-America fallback → United States (largest catalogued market there).
    if (tz.startsWith('America/')) return COUNTRIES.US
  } catch {
    // ignore — resolve to null (global default)
  }
  return null
}

/**
 * The visitor's country for geo-adaptive UI. Detected from timezone, with a `?geo=`
 * query override for QA (`?geo=AE` forces UAE, `?geo=none` forces the global default).
 */
export function useVisitorCountry(): VisitorCountry | null {
  const { search } = useLocation()
  return useMemo(() => {
    const override = new URLSearchParams(search).get('geo')
    if (override) {
      if (override.toLowerCase() === 'none') return null
      return countryByCode(override) ?? { code: override.toUpperCase(), name: override }
    }
    return detectVisitorCountry()
  }, [search])
}
