import { describe, expect, it, vi } from 'vitest'

// packageService imports @/lib/supabase at module load, which pulls in env at test time. The
// helper under test is a pure function of the payload, so a lightweight mock is enough.
vi.mock('@/lib/supabase', () => ({ supabase: {} }))

// Exercising the module-private helper via its only public consumer would need the whole publish
// path mocked; a re-export for tests is simpler and more honest. Import via the same module barrel
// the app uses.
import { derivePackageBasePrice } from './packageService'

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
