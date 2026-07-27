import { describe, expect, it, vi } from 'vitest'

// The flow module pulls in supabase (and the whole step tree) at import time. The function under
// test is pure, so stubbing the client is enough to load it.
vi.mock('@/lib/supabase', () => ({ supabase: {} }))
vi.mock('@/lib/authCache', () => ({ getUserCached: vi.fn() }))

const { calculateStartingStep } = await import('./CompletePackageCreationFlow')

/** A draft with every step satisfied — tests below remove one field at a time. */
const complete = {
  hotelId: 'h-1',
  packageType: 'weekend-getaway',
  name: 'Weekend Bliss',
  description: 'A restful two nights.',
  photos: ['data:image/jpeg;base64,x'],
  highlights: ['Breakfast included'],
  inclusions: ['Airport pickup'],
  exclusions: ['Personal expenses'],
  selectedRooms: { 'r-1': { packagePrice: 12000 } },
  cancellationPolicy: 'flexible',
} as any

describe('calculateStartingStep', () => {
  it('starts a brand-new package at step 1', () => {
    expect(calculateStartingStep(undefined)).toBe(1)
    expect(calculateStartingStep({} as any)).toBe(1)
  })

  it('opens a complete draft on Review', () => {
    expect(calculateStartingStep(complete)).toBe(11)
  })

  it.each([
    ['hotelId', 1],
    ['packageType', 2],
    ['name', 3],
    ['description', 3],
    ['photos', 4],
    ['highlights', 5],
    ['inclusions', 6],
    ['exclusions', 7],
    ['selectedRooms', 8],
    ['cancellationPolicy', 10],
  ])('missing %s resumes at step %i', (field, expected) => {
    const draft = { ...complete }
    delete draft[field as keyof typeof draft]
    expect(calculateStartingStep(draft)).toBe(expected)
  })

  it('returns the EARLIEST gap, not the furthest progress', () => {
    // A partner who filled later steps and then cleared an early one must be taken back to the
    // early one — that is the field actually blocking a publish.
    const draft = { ...complete }
    delete (draft as any).packageType
    expect(calculateStartingStep(draft)).toBe(2)
  })

  it('treats empty collections as missing, not as answered', () => {
    // [] is what a step returns when the partner visited it and chose nothing. Resuming past it
    // would skip a step they never actually completed.
    expect(calculateStartingStep({ ...complete, highlights: [] })).toBe(5)
    expect(calculateStartingStep({ ...complete, photos: [] })).toBe(4)
    expect(calculateStartingStep({ ...complete, selectedRooms: {} })).toBe(8)
  })

  it('never returns a step outside the wizard', () => {
    const variants = [undefined, {}, complete, { hotelId: 'h-1' }, { ...complete, name: '' }]
    for (const v of variants) {
      const step = calculateStartingStep(v as any)
      expect(step).toBeGreaterThanOrEqual(1)
      expect(step).toBeLessThanOrEqual(11)
    }
  })
})
