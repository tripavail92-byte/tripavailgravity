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
    .select('id, reporter_id, target_entity_type, target_entity_id, report_reason, details, status, status_reason, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)

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
 * Fetch hotel managers for partner management
 */
export async function fetchHotelManagers(limit = 100) {
  const { data, error } = await supabase
    .from('hotel_manager_profiles')
    .select('user_id, business_name, account_status, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data || []
}

/**
 * Fetch tour operators for partner management
 */
export async function fetchTourOperators(limit = 100) {
  const { data, error } = await supabase
    .from('tour_operator_profiles')
    .select('user_id, company_name, account_status, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data || []
}

/**
 * Fetch profile by user ID
 */
export async function fetchProfileById(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, first_name, last_name')
    .eq('id', userId)
    .single()

  if (error) throw error
  return data
}
