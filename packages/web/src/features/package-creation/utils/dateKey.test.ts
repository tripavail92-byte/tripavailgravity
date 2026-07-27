// Asia/Karachi (UTC+5) is the platform's home market and the offset that exposes the bug this
// module exists to prevent. Set before the first Date is constructed in this file — Node
// invalidates its cached timezone when process.env.TZ changes.
process.env.TZ = 'Asia/Karachi'

import { describe, expect, it } from 'vitest'

import { toDateKey } from './dateKey'

describe('toDateKey', () => {
  it('is running under a positive UTC offset, or the rest of this file proves nothing', () => {
    // The guard for the guard: at UTC there is no divergence between local and UTC days, so the
    // assertions below would pass against the very implementation they are meant to reject.
    expect(new Date(2026, 7, 14).getTimezoneOffset()).toBeLessThan(0)
  })

  it('records the calendar day that was clicked, not the UTC day it maps to', () => {
    const clicked = new Date(2026, 7, 14) // 14 August 2026, local midnight
    expect(toDateKey(clicked)).toBe('2026-08-14')
    // What the availability calendar used to store for that same click.
    expect(clicked.toISOString().split('T')[0]).toBe('2026-08-13')
  })

  it('pads single-digit months and days', () => {
    expect(toDateKey(new Date(2026, 0, 5))).toBe('2026-01-05')
    expect(toDateKey(new Date(2026, 11, 31))).toBe('2026-12-31')
  })

  it('holds across a year boundary, where the UTC shift also changes the year', () => {
    expect(toDateKey(new Date(2027, 0, 1))).toBe('2027-01-01')
  })

  it('is stable at a time of day where local and UTC dates agree', () => {
    // Midday is well clear of the offset, so this is the same answer either way — the point is that
    // toDateKey does not disturb the cases that were already correct.
    expect(toDateKey(new Date(2026, 7, 14, 12, 0, 0))).toBe('2026-08-14')
  })
})
