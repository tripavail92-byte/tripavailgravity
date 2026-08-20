import { normalizeCurrencyAmount } from './tourPaymentTerms'

/**
 * Room-sharing / accommodation pricing for multi-day tours.
 *
 * A multi-day trip's per-person price varies by room sharing (fewer people per room ⇒ higher hotel
 * cost per head), and children are charged a fraction of the adult rate. This module is the single
 * source of truth for that math — used by the booking card, checkout, and the server-side booking
 * insert so the displayed total and the charged total always agree.
 *
 * When a tour's `accommodation_pricing` is empty / not enabled, `normalizeAccommodationPricing`
 * returns null and callers fall back to the ordinary single per-person price — existing tours are
 * unaffected.
 */

export interface RoomSharingTier {
  /** Stable key: one of the standard tiers below, e.g. 'quad'. */
  key: string
  /** Human label, e.g. "Quad sharing". */
  label: string
  /** Per-person price for an adult in this sharing tier. */
  pricePerPerson: number
}

export interface ChildRates {
  /** Fraction (0–1) of the adult tier price charged for a child WITH their own bed. */
  withBed: number
  /** Fraction for a child sharing a bed (no extra bed). */
  noBed: number
  /** Fraction for an infant (usually 0). */
  infant: number
}

export interface AccommodationPricing {
  enabled: boolean
  tiers: RoomSharingTier[]
  childRates: ChildRates
}

export interface TravellerCounts {
  adults: number
  childrenWithBed: number
  childrenNoBed: number
  infants: number
}

/** The standard sharing tiers, cheapest (most people per room) first. Operators price the ones
 *  they offer; the rest are simply omitted. */
export const STANDARD_ROOM_TIERS: { key: string; label: string; occupancy: number }[] = [
  { key: 'quad', label: 'Quad sharing', occupancy: 4 },
  { key: 'triple', label: 'Triple sharing', occupancy: 3 },
  { key: 'double', label: 'Double sharing', occupancy: 2 },
  { key: 'solo', label: 'Solo', occupancy: 1 },
]

export const DEFAULT_CHILD_RATES: ChildRates = { withBed: 0.8, noBed: 0.6, infant: 0 }

export const EMPTY_TRAVELLER_COUNTS: TravellerCounts = {
  adults: 1,
  childrenWithBed: 0,
  childrenNoBed: 0,
  infants: 0,
}

function clampRate(value: unknown, fallback: number): number {
  const n = Number(value)
  return Number.isFinite(n) && n >= 0 && n <= 1 ? Math.round(n * 100) / 100 : fallback
}

/**
 * Parse the raw `accommodation_pricing` jsonb into a usable shape, or null when the tour is a
 * plain single-price tour (not enabled / no valid tiers).
 */
export function normalizeAccommodationPricing(raw: unknown): AccommodationPricing | null {
  if (!raw || typeof raw !== 'object') return null
  const obj = raw as Record<string, unknown>
  if (!obj.enabled) return null

  const tiers: RoomSharingTier[] = Array.isArray(obj.tiers)
    ? (obj.tiers as unknown[])
        .map((t) => {
          const tier = (t ?? {}) as Record<string, unknown>
          const key = String(tier.key ?? '')
          const standard = STANDARD_ROOM_TIERS.find((s) => s.key === key)
          return {
            key,
            label: String(tier.label ?? standard?.label ?? key),
            pricePerPerson: normalizeCurrencyAmount(Number(tier.pricePerPerson ?? 0)),
          }
        })
        .filter((t) => t.key && t.pricePerPerson > 0)
    : []

  if (tiers.length === 0) return null

  // Keep tiers in the canonical cheapest-first order regardless of how they were stored.
  tiers.sort(
    (a, b) =>
      STANDARD_ROOM_TIERS.findIndex((s) => s.key === a.key) -
      STANDARD_ROOM_TIERS.findIndex((s) => s.key === b.key),
  )

  const cr = (obj.childRates ?? {}) as Record<string, unknown>
  const childRates: ChildRates = {
    withBed: clampRate(cr.withBed, DEFAULT_CHILD_RATES.withBed),
    noBed: clampRate(cr.noBed, DEFAULT_CHILD_RATES.noBed),
    infant: clampRate(cr.infant, DEFAULT_CHILD_RATES.infant),
  }

  return { enabled: true, tiers, childRates }
}

export function getSharingTier(
  pricing: AccommodationPricing,
  tierKey: string | null | undefined,
): RoomSharingTier | null {
  if (!tierKey) return pricing.tiers[0] ?? null
  return pricing.tiers.find((t) => t.key === tierKey) ?? pricing.tiers[0] ?? null
}

/** Cheapest per-person tier price — the "from / person" figure for cards and headers. */
export function cheapestTierPrice(pricing: AccommodationPricing): number {
  return pricing.tiers.reduce(
    (min, t) => (t.pricePerPerson < min ? t.pricePerPerson : min),
    pricing.tiers[0]?.pricePerPerson ?? 0,
  )
}

/** Seats a booking consumes against capacity — infants ride on a lap, so they take none. */
export function seatsUsed(counts: TravellerCounts): number {
  return (
    Math.max(0, counts.adults) +
    Math.max(0, counts.childrenWithBed) +
    Math.max(0, counts.childrenNoBed)
  )
}

/** Everyone on the booking, infants included — for "N travellers" labels and pax_count. */
export function totalTravellers(counts: TravellerCounts): number {
  return seatsUsed(counts) + Math.max(0, counts.infants)
}

/** Total price for a chosen sharing tier and traveller mix. */
export function computeAccommodationTotal(
  tier: RoomSharingTier,
  counts: TravellerCounts,
  childRates: ChildRates,
): number {
  const p = tier.pricePerPerson
  return normalizeCurrencyAmount(
    p * Math.max(0, counts.adults) +
      p * childRates.withBed * Math.max(0, counts.childrenWithBed) +
      p * childRates.noBed * Math.max(0, counts.childrenNoBed) +
      p * childRates.infant * Math.max(0, counts.infants),
  )
}

/** A compact per-line breakdown for the booking card ("Adults × 2 · PKR 124,000"). */
export function accommodationLineItems(
  tier: RoomSharingTier,
  counts: TravellerCounts,
  childRates: ChildRates,
): { label: string; count: number; unit: number; subtotal: number }[] {
  const p = tier.pricePerPerson
  const rows: { label: string; count: number; unit: number }[] = [
    { label: 'Adults', count: counts.adults, unit: p },
    {
      label: 'Child (with bed)',
      count: counts.childrenWithBed,
      unit: normalizeCurrencyAmount(p * childRates.withBed),
    },
    {
      label: 'Child (no bed)',
      count: counts.childrenNoBed,
      unit: normalizeCurrencyAmount(p * childRates.noBed),
    },
    {
      label: 'Infants',
      count: counts.infants,
      unit: normalizeCurrencyAmount(p * childRates.infant),
    },
  ]
  return rows
    .filter((r) => r.count > 0)
    .map((r) => ({ ...r, subtotal: normalizeCurrencyAmount(r.unit * r.count) }))
}
