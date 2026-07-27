import { describe, expect, it, vi } from 'vitest'

// packageService imports @/lib/supabase at module load, which pulls in env at test time. The
// helper under test is a pure function of the payload, so a lightweight mock is enough.
vi.mock('@/lib/supabase', () => ({ supabase: {} }))

// Exercising the module-private helper via its only public consumer would need the whole publish
// path mocked; a re-export for tests is simpler and more honest. Import via the same module barrel
// the app uses.
import { derivePackageBasePrice, deriveStayLimits, normalizeBlackoutDates } from './packageService'

describe('derivePackageBasePrice', () => {
  it('takes an explicit basePricePerNight if the payload sets one', () => {
    expect(derivePackageBasePrice({ basePricePerNight: 12500 } as any)).toBe(12500)
  })

  it('otherwise uses the cheapest configured room per night', () => {
    // This is the shape PricingStep writes to wizard state — Object.fromEntries(selectedRooms).
    expect(
      derivePackageBasePrice({
        selectedRooms: {
          'r-1': { packagePrice: 18000 },
          'r-2': { packagePrice: 12000 },
          'r-3': { packagePrice: 15000 },
        },
      } as any),
    ).toBe(12000)
  })

  it('falls back to priceRange.min for older payloads without selectedRooms', () => {
    expect(
      derivePackageBasePrice({
        priceRange: { min: 8000, max: 20000, currency: 'PKR' },
      } as any),
    ).toBe(8000)
  })

  it('ignores non-positive room prices — those should never anchor a listing', () => {
    expect(
      derivePackageBasePrice({
        selectedRooms: {
          'r-1': { packagePrice: 0 },
          'r-2': { packagePrice: NaN },
          'r-3': { packagePrice: 9500 },
        },
      } as any),
    ).toBe(9500)
  })

  it('returns undefined when there is nothing to base a price on — the DB guard blocks the publish', () => {
    // The whole point of the DB guard: if the client cannot even name a nightly rate, it must not
    // publish, rather than shipping a "Price on request" card that only errors when clicked.
    expect(derivePackageBasePrice({} as any)).toBeUndefined()
    expect(derivePackageBasePrice({ selectedRooms: {} } as any)).toBeUndefined()
    expect(
      derivePackageBasePrice({
        selectedRooms: { 'r-1': { packagePrice: 0 } },
        priceRange: null,
      } as any),
    ).toBeUndefined()
  })
})

describe('normalizeBlackoutDates', () => {
  it('keeps the dates AvailabilityStep actually writes', () => {
    // toggleBlackoutDate stores date.toISOString().split('T')[0].
    expect(normalizeBlackoutDates(['2026-08-14', '2026-08-15'])).toEqual([
      '2026-08-14',
      '2026-08-15',
    ])
  })

  it('deduplicates and sorts, so the stored value is stable across republishes', () => {
    expect(normalizeBlackoutDates(['2026-08-15', '2026-08-14', '2026-08-15'])).toEqual([
      '2026-08-14',
      '2026-08-15',
    ])
  })

  it('accepts a full ISO timestamp and keeps only the day', () => {
    expect(normalizeBlackoutDates(['2026-08-14T00:00:00.000Z'])).toEqual(['2026-08-14'])
  })

  it('drops entries Postgres would reject, rather than failing the whole publish', () => {
    // A single bad element makes the DATE[] cast fail, which would lose the entire listing. These
    // are worth dropping silently; the partner still sees the count they blocked for the valid ones.
    expect(
      normalizeBlackoutDates([
        '2026-02-31', // matches the shape, is not a real day
        '2026-13-01', // month 13
        'tomorrow',
        '',
        null,
        undefined,
        42,
        '2026-08-14',
      ]),
    ).toEqual(['2026-08-14'])
  })

  it('returns an empty array for anything that is not a list of dates', () => {
    expect(normalizeBlackoutDates(undefined)).toEqual([])
    expect(normalizeBlackoutDates(null)).toEqual([])
    expect(normalizeBlackoutDates([])).toEqual([])
    expect(normalizeBlackoutDates('2026-08-14')).toEqual([])
  })
})

describe('deriveStayLimits', () => {
  it('persists what the availability step collected, not the ignored aliases', () => {
    // The bug this covers: the payload read minimumNights/maximumNights, which nothing assigns, so
    // every package published at 1/30 no matter what the partner typed.
    expect(deriveStayLimits({ minStay: 3, maxStay: 14 } as any)).toEqual({
      minimumNights: 3,
      maximumNights: 14,
    })
  })

  it('falls back to the same 1/30 defaults when the step was left alone', () => {
    expect(deriveStayLimits({} as any)).toEqual({ minimumNights: 1, maximumNights: 30 })
  })

  it('still honours an explicit minimumNights/maximumNights payload', () => {
    expect(deriveStayLimits({ minimumNights: 2, maximumNights: 10 } as any)).toEqual({
      minimumNights: 2,
      maximumNights: 10,
    })
  })

  it('raises the maximum to meet the minimum rather than publishing an unbookable package', () => {
    // min 5 / max 1 passes every check in the wizard and makes create_package_booking_atomic reject
    // every possible date range: nights < 5 fails the minimum, nights > 1 fails the maximum.
    expect(deriveStayLimits({ minStay: 5, maxStay: 1 } as any)).toEqual({
      minimumNights: 5,
      maximumNights: 5,
    })
  })

  it('keeps a minimum above 30 bookable when no maximum was set', () => {
    expect(deriveStayLimits({ minStay: 45 } as any)).toEqual({
      minimumNights: 45,
      maximumNights: 45,
    })
  })

  it('ignores junk and non-positive values', () => {
    expect(deriveStayLimits({ minStay: 0, maxStay: -4 } as any)).toEqual({
      minimumNights: 1,
      maximumNights: 30,
    })
    expect(deriveStayLimits({ minStay: NaN, maxStay: 'ten' } as any)).toEqual({
      minimumNights: 1,
      maximumNights: 30,
    })
  })

  it('floors fractional input — nights are whole', () => {
    expect(deriveStayLimits({ minStay: 2.7, maxStay: 9.9 } as any)).toEqual({
      minimumNights: 2,
      maximumNights: 9,
    })
  })
})
