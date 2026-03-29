/**
 * Admin Service Functions
 * Helper functions for admin operations
 * Used by admin pages until they can be fully migrated to query hooks
 */

import { supabase } from '@/lib/supabase'

function isMissingRpcError(error: any) {
  const message = String(error?.message || error || '').toLowerCase()
  return message.includes('schema cache') || message.includes('could not find the function')
}

export type OperatorVerificationFlagKey =
  | 'businessRegistrationVerified'
  | 'insuranceVerified'
  | 'vehicleDocsVerified'
  | 'guideLicenseVerified'

export type AdminOperatorVerificationReview = {
  id: string
  operator_id: string
  verification_key: string
  decision: 'verified' | 'rejected' | 'cleared'
  notes: string | null
  reviewed_by: string | null
  reviewed_at: string
}

export type AdminOperatorVerificationProfile = {
  user_id: string
  company_name: string | null
  business_name: string | null
  verification_documents: Record<string, any> | null
  verification_urls: Record<string, any> | null
  gallery_media: Array<Record<string, any>> | null
  fleet_assets: Array<Record<string, any>> | null
  guide_profiles: Array<Record<string, any>> | null
}

export type AdminOperatorAward = {
  id: string
  operator_id: string
  award_code: string
  award_name: string
  awarded_at: string
  expires_at: string | null
  metadata: Record<string, unknown> | null
  award_source: 'system' | 'admin'
  admin_note: string | null
}

export type AdminOperatorAwardOverride = {
  id: string
  operator_id: string
  award_code: string
  override_mode: 'grant' | 'revoke'
  award_name: string | null
  expires_at: string | null
  metadata: Record<string, unknown> | null
  admin_note: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type AdminOperatorStorefrontAnalytics = {
  profile_views: number
  unique_visitors: number
  engaged_visitors: number
  cta_clicks: number
  tour_clicks: number
  booking_starts: number
  attributed_booking_starts: number
  engagement_rate: number
  attributed_conversion_rate: number
  last_viewed_at: string | null
}

export type AdminOperatorResponseMetrics = {
  traveler_messages: number
  responded_messages: number
  response_rate: number
  avg_response_minutes: number
}

export type AdminOperatorQualityScore = {
  operator_id: string
  total_score: number
  review_quality_score: number
  verification_score: number
  responsiveness_score: number
  reliability_score: number
  completeness_score: number
  performance_score: number
  avg_rating: number
  total_reviews: number
  verified_badge_count: number
  response_rate: number
  avg_response_minutes: number
  cancellation_rate: number
  open_report_count: number
  total_report_count: number
  storefront_completion_rate: number
  engagement_rate: number
  attributed_conversion_rate: number
  booking_starts: number
  attributed_booking_starts: number
  score_policy_version: string
  score_reason_codes: Record<string, string[]>
  score_input_snapshot: Record<string, unknown>
}

export type AdminStorefrontOverviewRow = {
  operator_id: string
  operator_name: string
  slug: string | null
  profile_views: number
  unique_visitors: number
  engaged_visitors: number
  cta_clicks: number
  tour_clicks: number
  booking_starts: number
  attributed_booking_starts: number
  engagement_rate: number
  attributed_conversion_rate: number
  quality_score: number
  last_viewed_at: string | null
}

export type AdminBookingRow = {
  id: string
  tour_id: string | null
  traveler_id: string | null
  status: string | null
  total_price: number | null
  pax_count: number | null
  booking_date: string | null
  payment_status: string | null
  payment_method: string | null
  stripe_payment_intent_id: string | null
  expires_at: string | null
  paid_at: string | null
  tour_title: string | null
  traveler_email: string | null
  traveler_first_name: string | null
  traveler_last_name: string | null
}

export type AdminCancellationRequestState = 'requested' | 'declined' | 'approved' | 'refunded'

export type AdminCancellationRequestRow = {
  booking_scope: 'tour_booking' | 'package_booking'
  booking_id: string
  conversation_id: string | null
  booking_label: string
  subject: string | null
  traveler_name: string
  partner_name: string
  booking_status: string
  payment_status: string | null
  total_amount: number
  paid_online: number
  refund_amount: number
  cancellation_request_state: AdminCancellationRequestState
  traveler_cancellation_reason: string | null
  cancellation_requested_at: string | null
  cancellation_reviewed_at: string | null
  cancellation_reviewed_by: string | null
  cancellation_reviewed_role: string | null
  cancellation_review_reason: string | null
  support_escalated_at: string | null
  support_review_status: string | null
  support_review_reason: string | null
  support_review_notes: string | null
  support_reviewed_at: string | null
  last_message_preview: string | null
  requires_support_intervention: boolean
  support_attention_reason: string | null
}

/**
 * Fetch reports for moderation
 */
export async function fetchReports(limit = 50) {
  const { data, error } = await supabase
    .from('reports')
    .select(
      'id, reporter_id, target_entity_type, target_entity_id, report_reason, details, status, status_reason, created_at',
    )
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data || []
}

export async function fetchMessagingReports(limit = 100, status: string | null = null) {
  const { data, error } = await (supabase as any).rpc('admin_list_messaging_reports', {
    p_status: status,
    p_limit: limit,
  })

  if (error) throw error
  return data || []
}

export async function fetchSupportEscalations(limit = 100, status: string | null = null) {
  const { data, error } = await (supabase as any).rpc('admin_list_support_escalations', {
    p_status: status,
    p_limit: limit,
  })

  if (error) throw error
  return data || []
}

export async function fetchAdminCancellationRequests(
  limit = 200,
  state: AdminCancellationRequestState | null = null,
) {
  const { data, error } = await (supabase as any).rpc('admin_list_booking_cancellation_requests', {
    p_state: state,
    p_limit: limit,
  })

  if (error) throw error
  return (data || []) as AdminCancellationRequestRow[]
}

export async function reviewAdminCancellationRequest(
  scope: 'tour_booking' | 'package_booking',
  params: {
    bookingId: string
    action: 'approve' | 'decline' | 'refund'
    reason?: string
    refundAmount?: number
    internalNote?: string
  },
) {
  const rpcName = scope === 'tour_booking'
    ? 'admin_review_tour_cancellation_request'
    : 'admin_review_package_cancellation_request'

  const { data, error } = await (supabase as any).rpc(rpcName, {
    p_booking_id: params.bookingId,
    p_action: params.action,
    p_reason: params.reason?.trim() || null,
    p_refund_amount: params.action === 'refund' ? params.refundAmount ?? null : null,
    p_internal_note: params.internalNote?.trim() || null,
  })

  if (error) throw error
  return data || []
}

export async function fetchAdminConversationMessages(conversationId: string, limit = 100) {
  const { data, error } = await (supabase as any).rpc('admin_get_booking_conversation_messages', {
    p_conversation_id: conversationId,
    p_limit: limit,
  })

  if (error) throw error
  return data || []
}

export async function fetchAdminBookings(limit = 100): Promise<AdminBookingRow[]> {
  const { data, error } = await (supabase as any).rpc('admin_list_tour_bookings', {
    p_limit: limit,
  })

  if (error) throw error
  return data || []
}

/**
 * Fetch packages for listing moderation
 */
export async function fetchPackagesForModeration(limit = 100) {
  const { data, error } = await supabase
    .from('packages')
    .select('id, name, package_type, is_published, status, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data || []
}

/**
 * Fetch tours for listing moderation
 */
export async function fetchToursForModeration(limit = 100) {
  const { data, error } = await supabase
    .from('tours')
    .select('id, title, tour_type, is_active, status, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data || []
}

/**
 * Fetch hotel managers — uses SECURITY DEFINER RPC to bypass RLS and see
 * ALL account statuses (active / suspended / deleted).
 * Falls back to direct table query if the RPC is not yet deployed.
 *
 * @param limit max rows to return
 * @param status  Optional filter: 'active' | 'suspended' | 'deleted' | null = all
 */
export async function fetchHotelManagers(limit = 100, status: string | null = null) {
  try {
    const { data, error } = await (supabase as any).rpc('admin_list_hotel_managers', {
      p_status: status,
    })
    if (error) throw error
    return (data || []).slice(0, limit)
  } catch {
    // Fallback: direct query (may miss suspended rows if RLS filters them)
    const { data, error } = await supabase
      .from('hotel_manager_profiles')
      .select('user_id, business_name, account_status, created_at')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  }
}

/**
 * Fetch tour operators — uses SECURITY DEFINER RPC to bypass RLS and see
 * ALL account statuses (active / suspended / deleted).
 *
 * @param limit max rows to return
 * @param status  Optional filter: 'active' | 'suspended' | 'deleted' | null = all
 */
export async function fetchTourOperators(limit = 100, status: string | null = null) {
  try {
    const { data, error } = await (supabase as any).rpc('admin_list_tour_operators', {
      p_status: status,
    })
    if (error) throw error
    return (data || []).slice(0, limit)
  } catch {
    // Fallback: direct query (may miss suspended rows if RLS filters them)
    const { data, error } = await supabase
      .from('tour_operator_profiles')
      .select('user_id, company_name, account_status, created_at')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  }
}

/**
 * Fetch profiles by user IDs
 */
export async function fetchProfilesByIds(userIds: string[]) {
  if (!userIds || !userIds.length) return []
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, first_name, last_name')
    .in('id', userIds)

  if (error) throw error
  return data || []
}

export async function fetchOperatorVerificationProfile(userId: string) {
  const { data, error } = await supabase
    .from('tour_operator_profiles')
    .select('user_id, company_name, business_name, verification_documents, verification_urls, gallery_media, fleet_assets, guide_profiles')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  return (data ?? null) as AdminOperatorVerificationProfile | null
}

export async function fetchOperatorVerificationReviews(userId: string) {
  const { data, error } = await supabase
    .from('operator_verification_reviews')
    .select('id, operator_id, verification_key, decision, notes, reviewed_by, reviewed_at')
    .eq('operator_id', userId)
    .order('reviewed_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as AdminOperatorVerificationReview[]
}

export async function setOperatorVerificationFlag(params: {
  operatorId: string
  verificationKey: OperatorVerificationFlagKey
  verified: boolean
  notes?: string
}) {
  const { error } = await (supabase as any).rpc('admin_set_operator_verification_flag', {
    p_operator_id: params.operatorId,
    p_verification_key: params.verificationKey,
    p_verified: params.verified,
    p_notes: params.notes?.trim() || null,
  })

  if (error) throw error
  return { success: true }
}

export async function fetchOperatorAwards(userId: string) {
  const { data, error } = await supabase
    .from('operator_awards')
    .select('id, operator_id, award_code, award_name, awarded_at, expires_at, metadata, award_source, admin_note')
    .eq('operator_id', userId)
    .order('awarded_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as AdminOperatorAward[]
}

export async function fetchOperatorAwardOverrides(userId: string) {
  const { data, error } = await supabase
    .from('operator_award_overrides')
    .select('id, operator_id, award_code, override_mode, award_name, expires_at, metadata, admin_note, is_active, created_at, updated_at')
    .eq('operator_id', userId)
    .order('updated_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as AdminOperatorAwardOverride[]
}

export async function fetchOperatorStorefrontAnalytics(userId: string, days = 30) {
  const { data, error } = await (supabase as any).rpc('get_operator_storefront_analytics', {
    p_operator_id: userId,
    p_days: days,
  })

  if (error) throw error
  const row = Array.isArray(data) ? data[0] : data
  return (row ?? null) as AdminOperatorStorefrontAnalytics | null
}

export async function fetchOperatorResponseMetrics(userId: string, days = 90) {
  const { data, error } = await (supabase as any).rpc('get_operator_storefront_response_metrics', {
    p_operator_id: userId,
    p_days: days,
  })

  if (error) {
    if (isMissingRpcError(error)) return null
    throw error
  }
  const row = Array.isArray(data) ? data[0] : data
  return (row ?? null) as AdminOperatorResponseMetrics | null
}

export async function fetchOperatorQualityScore(userId: string, days = 90) {
  const { data, error } = await (supabase as any).rpc('admin_get_operator_quality_score', {
    p_operator_id: userId,
    p_days: days,
  })

  if (error) {
    if (isMissingRpcError(error)) return null
    throw error
  }
  const row = Array.isArray(data) ? data[0] : data
  return (row ?? null) as AdminOperatorQualityScore | null
}

export async function fetchAdminStorefrontAnalyticsOverview(limit = 5, days = 30) {
  const { data, error } = await supabase
    .from('tour_operator_profiles')
    .select('user_id, business_name, company_name, slug, is_public')
    .eq('is_public', true)
    .order('updated_at', { ascending: false })
    .limit(limit)

  if (error) throw error

  const profiles = data ?? []
  const analyticsRows = await Promise.all(
    profiles.map(async (profile: any) => {
      const [analytics, quality] = await Promise.all([
        fetchOperatorStorefrontAnalytics(profile.user_id, days),
        fetchOperatorQualityScore(profile.user_id, 90),
      ])
      return {
        operator_id: profile.user_id,
        operator_name: profile.business_name || profile.company_name || 'Unknown operator',
        slug: profile.slug ?? null,
        profile_views: analytics?.profile_views ?? 0,
        unique_visitors: analytics?.unique_visitors ?? 0,
        engaged_visitors: analytics?.engaged_visitors ?? 0,
        cta_clicks: analytics?.cta_clicks ?? 0,
        tour_clicks: analytics?.tour_clicks ?? 0,
        booking_starts: analytics?.booking_starts ?? 0,
        attributed_booking_starts: analytics?.attributed_booking_starts ?? 0,
        engagement_rate: analytics?.engagement_rate ?? 0,
        attributed_conversion_rate: analytics?.attributed_conversion_rate ?? 0,
        quality_score: quality?.total_score ?? 0,
        last_viewed_at: analytics?.last_viewed_at ?? null,
      } as AdminStorefrontOverviewRow
    }),
  )

  return analyticsRows.sort((left, right) => right.quality_score - left.quality_score || right.profile_views - left.profile_views)
}

export async function setOperatorAwardOverride(params: {
  operatorId: string
  awardCode: string
  overrideMode: 'grant' | 'revoke'
  awardName?: string
  expiresAt?: string | null
  metadata?: Record<string, unknown>
  adminNote?: string
  isActive?: boolean
}) {
  const { error } = await (supabase as any).rpc('admin_set_operator_award_override', {
    p_operator_id: params.operatorId,
    p_award_code: params.awardCode.trim(),
    p_override_mode: params.overrideMode,
    p_award_name: params.awardName?.trim() || null,
    p_expires_at: params.expiresAt || null,
    p_metadata: params.metadata ?? {},
    p_admin_note: params.adminNote?.trim() || null,
    p_is_active: params.isActive ?? true,
  })

  if (error) throw error
  return { success: true }
}

export async function clearOperatorAwardOverride(params: {
  operatorId: string
  awardCode: string
}) {
  const { error } = await (supabase as any).rpc('admin_clear_operator_award_override', {
    p_operator_id: params.operatorId,
    p_award_code: params.awardCode.trim(),
  })

  if (error) throw error
  return { success: true }
}
