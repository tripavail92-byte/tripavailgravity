import { describe, expect, it } from 'vitest'

import { isValidEmail } from './validators'

describe('isValidEmail', () => {
  it('rejects the value that caused this to be written', () => {
    // A partner typed their name into "Contact Email *" and the wizard accepted it, because the
    // only check was truthiness. The property was published with that as its booking address.
    expect(isValidEmail('khayam ali shujhat')).toBe(false)
  })

  it('accepts ordinary addresses', () => {
    for (const value of [
      'contact@yourhotel.com',
      'bookings@hunza-serena.com.pk',
      'first.last+tag@example.co.uk',
      'a@b.io',
    ]) {
      expect(isValidEmail(value), value).toBe(true)
    }
  })

  it('rejects the mistakes people actually make', () => {
    for (const value of [
      '',
      '   ',
      'nope',
      'no-at-sign.com',
      '@example.com',
      'user@',
      'user@host', // no dot-something
      'user@host.c', // single-char TLD
      'two spaces@example.com',
      'user@exam ple.com',
      'a@b.com,c@d.com',
    ]) {
      expect(isValidEmail(value), value).toBe(false)
    }
  })

  it('handles null and undefined without throwing', () => {
    expect(isValidEmail(undefined)).toBe(false)
    expect(isValidEmail(null)).toBe(false)
  })

  it('tolerates surrounding whitespace, since inputs collect it', () => {
    expect(isValidEmail('  contact@yourhotel.com  ')).toBe(true)
  })

  it('rejects absurdly long values rather than running the regex on them', () => {
    expect(isValidEmail(`${'a'.repeat(250)}@example.com`)).toBe(false)
  })
})
