import { supabase } from '../../../../../shared/src/core/client'

export interface KycSession {
  id: string
  session_token: string
  user_id: string
  role: 'tour_operator' | 'hotel_manager'
  status: 'pending' | 'uploading' | 'processing' | 'complete' | 'expired' | 'failed'
  id_front_url: string | null
  id_back_url: string | null
  selfie_url: string | null
  ocr_result: Record<string, any> | null
  match: boolean | null
  match_score: number | null
  match_reason: string | null
  expires_at: string
  created_at: string
}

/**
 * Create a new KYC handoff session for the authenticated user.
 * Returns the full session row (including the auto-generated session_token).
 */
export async function createKycSession(
  userId: string,
  role: 'tour_operator' | 'hotel_manager',
): Promise<KycSession> {
  const { data, error } = await supabase
    .from('kyc_sessions')
    .insert({ user_id: userId, role })
    .select()
    .single()

  if (error) throw new Error(`Failed to create KYC session: ${error.message}`)
  return data as KycSession
}

/**
 * Load a session by its public token (used by the mobile capture page — no auth required).
 */
export async function getKycSessionByToken(token: string): Promise<KycSession | null> {
  const { data, error } = await supabase
    .from('kyc_sessions')
    .select('*')
    .eq('session_token', token)
    .single()

  if (error) return null
  return data as KycSession
}

/**
 * Load all sessions for the current authenticated user (to resume an in-progress session).
 */
export async function getActiveKycSession(
  userId: string,
  role: 'tour_operator' | 'hotel_manager',
): Promise<KycSession | null> {
  const { data } = await supabase
    .from('kyc_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('role', role)
    .in('status', ['pending', 'uploading'])
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return data as KycSession | null
}

/**
 * Patch a session by token (called from the mobile page).
 */
export async function updateKycSession(
  token: string,
  patch: Partial<
    Pick<
      KycSession,
      | 'status'
      | 'id_front_url'
      | 'id_back_url'
      | 'selfie_url'
      | 'ocr_result'
      | 'match'
      | 'match_score'
      | 'match_reason'
    >
  >,
): Promise<void> {
  const { error } = await supabase
    .from('kyc_sessions')
    .update(patch)
    .eq('session_token', token)

  if (error) throw new Error(`Failed to update KYC session: ${error.message}`)
}

/**
 * Expire a session immediately (e.g. when user starts over).
 */
export async function expireKycSession(token: string): Promise<void> {
  await supabase
    .from('kyc_sessions')
    .update({ status: 'expired' })
    .eq('session_token', token)
}

/**
 * Subscribe to realtime changes on a session (used by the desktop waiting screen).
 * Returns an unsubscribe function.
 */
export function subscribeToKycSession(
  token: string,
  onChange: (session: KycSession) => void,
): () => void {
  const channel = supabase
    .channel(`kyc_session_${token}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'kyc_sessions',
        filter: `session_token=eq.${token}`,
      },
      (payload) => {
        onChange(payload.new as KycSession)
      },
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

/**
 * Build the mobile capture URL for a session token.
 */
export function buildMobileKycUrl(token: string): string {
  const base = window.location.origin
  return `${base}/kyc/mobile?session=${token}`
}
