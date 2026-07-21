import { describe, expect, it, vi } from 'vitest'

// fetchFragments is not exercised here — it is a thin Supabase query. Mocking the client keeps the
// module importable so the pure composition logic can be tested.
vi.mock('@/lib/supabase', () => ({ supabase: { from: vi.fn() } }))

const { buildPropertyDetail, buildRoomDetail, composeSuggestions, describeBeds, fillTemplate } =
  await import('./listingCopy')

const frag = (slot: 'opener' | 'closer', body: string) => ({ category: 'guesthouse', slot, body })

describe('fillTemplate', () => {
  it('substitutes values it has', () => {
    expect(fillTemplate('A guesthouse in {city}.', { city: 'Hunza' })).toBe(
      'A guesthouse in Hunza.',
    )
  })

  it('returns null when a placeholder has no value, rather than leaving a gap', () => {
    // The whole point: rendering this fragment would publish "A guesthouse in , run with care."
    expect(fillTemplate('A guesthouse in {city}.', {})).toBeNull()
    expect(fillTemplate('A guesthouse in {city}.', { city: '   ' })).toBeNull()
  })

  it('rejects the fragment if ANY of several placeholders is missing', () => {
    expect(fillTemplate('{name} in {city}.', { name: 'Serena' })).toBeNull()
  })
})

describe('composeSuggestions', () => {
  const fragments = [
    frag('opener', 'Opener one.'),
    frag('opener', 'Opener two.'),
    frag('opener', 'Opener three.'),
    frag('opener', '{name} is opener four.'),
    frag('closer', 'Closer one.'),
    frag('closer', 'Closer two.'),
    frag('closer', 'Closer three.'),
  ]

  const base = {
    kind: 'property' as const,
    fragments,
    vars: { name: 'Serena' },
    detail: 'A 4-star property.',
    seed: 'Serena',
  }

  it('builds three suggestions of opener + detail + closer', () => {
    const out = composeSuggestions(base)
    expect(out).toHaveLength(3)
    for (const s of out) expect(s).toContain('A 4-star property.')
  })

  it('never emits an unfilled placeholder', () => {
    // No `name` supplied, so the fourth opener must be dropped entirely.
    const out = composeSuggestions({ ...base, vars: {} })
    for (const s of out) {
      expect(s).not.toContain('{')
      expect(s).not.toContain('opener four')
    }
  })

  it('gives different properties different openers — the anti-duplicate guarantee', () => {
    // Two guesthouses in the same category must not both lead with fragment #1.
    const a = composeSuggestions({ ...base, seed: 'Hunza Guest House' })
    const b = composeSuggestions({ ...base, seed: 'Karimabad Lodge' })
    expect(a[0]).not.toBe(b[0])
  })

  it('is stable for the same property across presses', () => {
    expect(composeSuggestions(base)).toEqual(composeSuggestions(base))
  })

  it('produces new combinations when cycled', () => {
    const first = composeSuggestions(base)
    const second = composeSuggestions({ ...base, cycle: 1 })
    expect(second).not.toEqual(first)
  })

  it('falls back to bundled fragments when the library is unreachable', () => {
    const out = composeSuggestions({ ...base, fragments: [] })
    expect(out).toHaveLength(3)
    for (const s of out) expect(s.length).toBeGreaterThan(20)
  })

  it('never repeats an opening sentence, even across different closers', () => {
    // Regression: dropping placeholder fragments can leave 2 openers for 3 slots. The full-text
    // dedupe missed it because the closers differed, so two suggestions began identically.
    const out = composeSuggestions({
      ...base,
      fragments: [
        frag('opener', 'Only opener A.'),
        frag('opener', 'Only opener B.'),
        frag('closer', 'Closer one.'),
        frag('closer', 'Closer two.'),
        frag('closer', 'Closer three.'),
      ],
    })
    const openings = out.map((s) => s.split('.')[0])
    expect(new Set(openings).size).toBe(openings.length)
    expect(out).toHaveLength(2)
  })

  it('falls back when every fragment needs a value the wizard lacks', () => {
    const out = composeSuggestions({
      ...base,
      fragments: [frag('opener', '{name} only.'), frag('closer', '{city} only.')],
      vars: {},
    })
    expect(out).toHaveLength(3)
    for (const s of out) expect(s).not.toContain('{')
  })

  it('lets the detail depend on the opener, so the city is not said twice', () => {
    const out = composeSuggestions({
      ...base,
      fragments: [frag('opener', 'A hotel in Hunza.'), frag('closer', 'Closer.')],
      detail: (opener) => (opener.includes('Hunza') ? '' : 'Located in Hunza.'),
    })
    expect(out[0]).toBe('A hotel in Hunza. Closer.')
  })
})

describe('describeBeds', () => {
  it('pluralises and joins', () => {
    expect(describeBeds([{ type: 'king', quantity: 1 }])).toBe('a king bed')
    expect(describeBeds([{ type: 'twin', quantity: 2 }])).toBe('2 twin beds')
    expect(
      describeBeds([
        { type: 'king', quantity: 1 },
        { type: 'sofaBed', quantity: 1 },
      ]),
    ).toBe('a king bed and a sofa bed')
  })

  it('ignores zero-quantity rows and empty input', () => {
    expect(describeBeds([{ type: 'king', quantity: 0 }])).toBe('')
    expect(describeBeds([])).toBe('')
    expect(describeBeds(undefined)).toBe('')
  })
})

describe('buildRoomDetail', () => {
  it('states only the facts it has', () => {
    expect(buildRoomDetail({ beds: [{ type: 'king', quantity: 1 }], size: 28, maxGuests: 3 })).toBe(
      'Spanning 28 m², it features a king bed and sleeps up to 3 guests comfortably.',
    )
    expect(buildRoomDetail({ size: 28 })).toBe('It measures 28 m².')
    expect(buildRoomDetail({ maxGuests: 1 })).toBe('It sleeps one guest comfortably.')
  })

  it('returns nothing when the wizard has collected nothing', () => {
    expect(buildRoomDetail({})).toBe('')
    // A zero size is "not entered", not a 0 m² room.
    expect(buildRoomDetail({ size: 0, maxGuests: 0 })).toBe('')
  })
})

describe('buildPropertyDetail', () => {
  it('combines rating, city and amenities', () => {
    expect(
      buildPropertyDetail({ starRating: 4, city: 'Hunza', amenities: ['wifi', 'restaurant'] }),
    ).toBe('A 4-star property in Hunza. Guests have access to a restaurant and WiFi.')
  })

  it('omits what it does not have', () => {
    expect(buildPropertyDetail({ city: 'Skardu' })).toBe('Located in Skardu.')
    expect(buildPropertyDetail({})).toBe('')
  })

  it('gives count nouns an article so the list reads as a sentence', () => {
    // 'restaurant' → 'a restaurant', but 'parking' must NOT become 'a parking'.
    const out = buildPropertyDetail({ amenities: ['restaurant', 'free_parking'] })
    expect(out).toBe('Guests have access to a restaurant and free parking.')
  })

  it('accepts camelCase and kebab keys as well as snake_case', () => {
    expect(buildPropertyDetail({ amenities: ['hotTub'] })).toContain('a hot tub')
    expect(buildPropertyDetail({ amenities: ['hot-tub'] })).toContain('a hot tub')
  })

  it('falls back safely for an unrecognised amenity', () => {
    expect(buildPropertyDetail({ amenities: ['rooftop_cinema'] })).toBe(
      'Guests have access to rooftop cinema.',
    )
  })

  it('names the four best amenities, not the first four stored', () => {
    // Grid order would surface the dryer and the refrigerator; the pool and views are the draw.
    const out = buildPropertyDetail({
      amenities: ['dryer', 'refrigerator', 'wifi', 'pool', 'mountain_view', 'restaurant'],
    })
    expect(out).toContain('mountain views')
    expect(out).toContain('a pool')
    expect(out).toContain('a restaurant')
    expect(out).not.toContain('dryer')
  })
})

describe('buildRoomDetail — conjunction handling', () => {
  it('does not double up "and" when several beds are listed', () => {
    const out = buildRoomDetail({
      beds: [
        { type: 'king', quantity: 1 },
        { type: 'sofaBed', quantity: 1 },
      ],
      size: 42,
      maxGuests: 4,
    })
    expect(out).toBe(
      'Spanning 42 m², it features a king bed and a sofa bed, and sleeps up to 4 guests comfortably.',
    )
    expect(out).not.toContain('bed and sleeps')
    expect(out).not.toContain(' ,')
  })

  it('uses a plain "and" for a single bed', () => {
    expect(buildRoomDetail({ beds: [{ type: 'king', quantity: 1 }], size: 20, maxGuests: 2 })).toBe(
      'Spanning 20 m², it features a king bed and sleeps up to 2 guests comfortably.',
    )
  })
})
