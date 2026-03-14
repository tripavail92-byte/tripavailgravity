/**
 * Admin Service Functions
 * Helper functions for admin operations
 * Used by admin pages until they can be fully migrated to query hooks
 */

import { supabase } from '@/lib/supabase'

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

export async function fetchAdminConversationMessages(conversationId: string, limit = 100) {
  const { data, error } = await (supabase as any).rpc('admin_get_booking_conversation_messages', {
    p_conversation_id: conversationId,
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
