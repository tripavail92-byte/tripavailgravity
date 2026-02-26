import { describe, expect, it } from 'vitest'

import { buildMobileKycUrl } from './kycSessionService'

describe('KYC QR link contract', () => {
  it('buildMobileKycUrl produces /kyc/mobile?session=<token>', () => {
    // jsdom forbids changing the origin; just move to a local path.
    const origin = window.location.origin
    window.history.pushState({}, '', '/somewhere')

    const token = 'tok_12345'
    const url = buildMobileKycUrl(token)
    const parsed = new URL(url)

    expect(parsed.origin).toBe(origin)
    expect(parsed.pathname).toBe('/kyc/mobile')
    expect(parsed.searchParams.get('session')).toBe(token)
  })
})
