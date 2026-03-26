/**
 * Admin Service Functions
 * Helper functions for admin operations
 * Used by admin pages until they can be fully migrated to query hooks
 */

import { supabase } from '@/lib/supabase'

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
