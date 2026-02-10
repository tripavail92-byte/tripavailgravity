type JwtPayload = Record<string, unknown> & {
  exp?: number
  iss?: string
  aud?: string | string[]
}

function base64UrlToUtf8(input: string): string {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)

  // atob expects standard base64
  const binary = atob(padded)
  const bytes = Uint8Array.from(binary, c => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

export function decodeJwtPayload(token: string): JwtPayload | null {
  const parts = token.split('.')
  if (parts.length < 2) return null
  try {
    const json = base64UrlToUtf8(parts[1]!)
    const payload = JSON.parse(json)
    if (!payload || typeof payload !== 'object') return null
    return payload as JwtPayload
  } catch {
    return null
  }
}

export type SupabaseJwtDiagnosis =
  | { ok: true; reason: 'valid' }
  | { ok: false; reason: 'missing-token' }
  | { ok: false; reason: 'malformed-token' }
  | { ok: false; reason: 'expired'; exp?: number }
  | { ok: false; reason: 'wrong-project'; iss?: string; expectedHost?: string }

function hostFromSupabaseUrl(supabaseUrl: string): string | null {
  try {
    return new URL(supabaseUrl).host
  } catch {
    return null
  }
}

/**
 * Diagnoses a Supabase Auth JWT (access_token) for the most common causes of
 * Edge Function auth failures like `{ code: 401, message: "Invalid JWT" }`.
 */
export function diagnoseSupabaseJwt(token: string | null | undefined, supabaseUrl: string): SupabaseJwtDiagnosis {
  if (!token) return { ok: false, reason: 'missing-token' }

  const payload = decodeJwtPayload(token)
  if (!payload) return { ok: false, reason: 'malformed-token' }

  const nowSeconds = Math.floor(Date.now() / 1000)
  if (typeof payload.exp === 'number' && payload.exp <= nowSeconds) {
    return { ok: false, reason: 'expired', exp: payload.exp }
  }

  const expectedHost = hostFromSupabaseUrl(supabaseUrl)
  const iss = typeof payload.iss === 'string' ? payload.iss : undefined
  if (expectedHost && iss && !iss.includes(expectedHost)) {
    return { ok: false, reason: 'wrong-project', iss, expectedHost }
  }

  return { ok: true, reason: 'valid' }
}
