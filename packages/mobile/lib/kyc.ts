import { supabase } from '@/lib/supabase'

/**
 * KYC identity verification — port of web kycSessionService + MobileKYCPage.
 * Same pipeline end-to-end: a kyc_sessions row (auto session_token, 30-min TTL),
 * images POSTed to the `kyc-mobile-upload` edge function (which writes the
 * private `kyc` bucket, versions kyc_documents, and kicks off server-side OCR),
 * then `partner_submit_verification` RPC files it for admin review.
 * Biometric/face scanning is disabled platform-wide — document photos only.
 */

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!
const ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

export type KycRole = 'tour_operator' | 'hotel_manager'
export type KycField = 'id_front' | 'id_back'

export interface KycSession {
  id: string
  session_token: string
  user_id: string
  role: KycRole
  status:
    | 'pending'
    | 'uploading'
    | 'processing'
    | 'pending_admin_review'
    | 'approved'
    | 'rejected'
    | 'failed'
    | 'expired'
    | 'revoked'
  id_front_path: string | null
  id_back_path: string | null
  failure_code: string | null
  failure_reason: string | null
  review_notes: string | null
  expires_at: string
  created_at: string
}

/** Newest non-expired in-flight session, else a progressed one we can resume. */
export async function getActiveKycSession(userId: string, role: KycRole): Promise<KycSession | null> {
  const nowIso = new Date().toISOString()
  const { data: active, error: activeErr } = await supabase
    .from('kyc_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('role', role)
    .in('status', ['pending', 'uploading', 'processing', 'pending_admin_review'])
    .gt('expires_at', nowIso)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (!activeErr && active) return active as KycSession

  const { data: progressed } = await supabase
    .from('kyc_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('role', role)
    .in('status', ['processing', 'pending_admin_review', 'approved'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return (progressed as KycSession) ?? null
}

export async function getLatestRejectedSession(userId: string, role: KycRole): Promise<KycSession | null> {
  const { data } = await supabase
    .from('kyc_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('role', role)
    .eq('status', 'rejected')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return (data as KycSession) ?? null
}

export async function createKycSession(userId: string, role: KycRole): Promise<KycSession> {
  const { data, error } = await supabase
    .from('kyc_sessions')
    .insert({ user_id: userId, role })
    .select()
    .single()
  if (error) throw new Error(`Failed to create KYC session: ${error.message}`)
  return data as KycSession
}

/**
 * Upload a captured ID photo through the same edge function the web's
 * QR-handoff mobile page uses (multipart: session_token, field, image).
 */
export async function uploadKycImage(
  sessionToken: string,
  field: KycField,
  localUri: string,
): Promise<{ path: string; status: string }> {
  const form = new FormData()
  form.append('session_token', sessionToken)
  form.append('field', field)
  // RN FormData file part: { uri, name, type } (not a web File object).
  form.append('image', { uri: localUri, name: `${field}.jpg`, type: 'image/jpeg' } as any)

  const res = await fetch(`${SUPABASE_URL}/functions/v1/kyc-mobile-upload`, {
    method: 'POST',
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
    body: form,
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(body?.error || body?.message || `Upload failed (${res.status})`)
  }
  return body as { path: string; status: string }
}

/** Poll the session row until OCR settles (processing → pending_admin_review / failed). */
export async function fetchSessionByToken(sessionToken: string): Promise<KycSession | null> {
  const { data } = await supabase
    .from('kyc_sessions')
    .select('*')
    .eq('session_token', sessionToken)
    .maybeSingle()
  return (data as KycSession) ?? null
}

/** File the verification with admins — same RPC as the web hub's final step. */
export async function submitForReview(params: {
  partnerType: KycRole
  email: string | null
  fullName: string | null
  phone: string | null
  businessName: string | null
  kycSessionToken: string
  kycStatus: string
}): Promise<void> {
  const { error } = await supabase.rpc('partner_submit_verification', {
    p_partner_type: params.partnerType,
    p_submission_data: {
      email: params.email,
      first_name: params.fullName?.split(' ')[0] ?? null,
      last_name: params.fullName?.split(' ').slice(1).join(' ') || null,
      phone: params.phone,
      business_name: params.businessName,
      verification_documents: {
        kyc_session_token: params.kycSessionToken,
        kyc_status: params.kycStatus,
        idCardUrl: 'uploaded',
        idBackUrl: 'uploaded',
      },
      submitted_at: new Date().toISOString(),
      source: 'mobile_app',
    },
  })
  if (error) throw new Error(error.message)
}
