import { describe, expect, it, vi } from 'vitest'
import { decodeJwtPayload, diagnoseSupabaseJwt } from './jwtDiagnostics'

function makeJwt(payload: Record<string, unknown>): string {
  const header = { alg: 'none', typ: 'JWT' }
  const encode = (obj: unknown) => {
    const json = JSON.stringify(obj)
    const bytes = new TextEncoder().encode(json)
    let binary = ''
    bytes.forEach((b) => (binary += String.fromCharCode(b)))
    // btoa produces base64; convert to base64url
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
  }

  return `${encode(header)}.${encode(payload)}.`
}

describe('jwtDiagnostics', () => {
  it('decodes payload', () => {
    const token = makeJwt({ sub: 'u1', iss: 'https://example.supabase.co/auth/v1' })
    const payload = decodeJwtPayload(token)
    expect(payload?.sub).toBe('u1')
  })

  it('detects missing token', () => {
    const result = diagnoseSupabaseJwt(null, 'https://zkhppxjeaizpyinfpecj.supabase.co')
    expect(result).toEqual({ ok: false, reason: 'missing-token' })
  })

  it('detects malformed token', () => {
    const result = diagnoseSupabaseJwt('not-a-jwt', 'https://zkhppxjeaizpyinfpecj.supabase.co')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('malformed-token')
  })

  it('detects expired token', () => {
    vi.setSystemTime(new Date('2026-02-11T00:00:00Z'))
    const nowSeconds = Math.floor(Date.now() / 1000)
    const token = makeJwt({
      exp: nowSeconds - 1,
      iss: 'https://zkhppxjeaizpyinfpecj.supabase.co/auth/v1',
    })
    const result = diagnoseSupabaseJwt(token, 'https://zkhppxjeaizpyinfpecj.supabase.co')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('expired')
    vi.useRealTimers()
  })

  it('detects wrong-project issuer (common source of "Invalid JWT")', () => {
    const token = makeJwt({ iss: 'https://OTHERPROJECT.supabase.co/auth/v1', exp: 9999999999 })
    const result = diagnoseSupabaseJwt(token, 'https://zkhppxjeaizpyinfpecj.supabase.co')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('wrong-project')
  })

  it('treats correct issuer as valid', () => {
    const token = makeJwt({
      iss: 'https://zkhppxjeaizpyinfpecj.supabase.co/auth/v1',
      exp: 9999999999,
    })
    const result = diagnoseSupabaseJwt(token, 'https://zkhppxjeaizpyinfpecj.supabase.co')
    expect(result).toEqual({ ok: true, reason: 'valid' })
  })
})
