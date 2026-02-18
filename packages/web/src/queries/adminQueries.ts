import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from '@tanstack/react-query'
import type { Database } from '@/types/database.types'
import { supabase } from '@/lib/supabase'

type Profile = Database['public']['Tables']['profiles']['Row']
type AdminUser = Database['public']['Tables']['admin_users']['Row']

// Custom type for users list with subset of fields
type UserListItem = {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  account_status: string | null
  created_at: string
}

/**
 * Query Keys for Admin Operations
 */
export const adminKeys = {
  all: ['admin'] as const,
  users: () => [...adminKeys.all, 'users'] as const,
  auditLogs: () => [...adminKeys.all, 'audit-logs'] as const,
  reports: () => [...adminKeys.all, 'reports'] as const,
  listings: () => [...adminKeys.all, 'listings'] as const,
  partners: () => [...adminKeys.all, 'partners'] as const,
  role: (userId: string) => [...adminKeys.all, 'role', userId] as const,
}

/**
 * Fetch users/profiles (Admin Users Page)
 */
async function fetchUsers(limit = 50): Promise<UserListItem[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, first_name, last_name, account_status, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[adminQueries] Error fetching users:', error)
    throw error
  }

  return data || []
}

/**
 * Hook: Fetch Admin Users
 * StaleTime: 30 seconds (admin data changes moderately)
 */
export function useAdminUsers(
  limit = 50,
  options?: Omit<UseQueryOptions<UserListItem[], Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: adminKeys.users(),
    queryFn: () => fetchUsers(limit),
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  })
}

/**
 * Fetch admin role for a user (AdminGuard)
 */
async function fetchAdminRole(userId: string): Promise<Partial<AdminUser> | null> {
  const { data, error } = await supabase.rpc('get_admin_role', {
    p_user_id: userId,
  })

  if (error) {
    console.error('[adminQueries] Error fetching admin role via RPC:', error)
    throw error
  }

  if (!data) return null

  // Return partial object satisfying the needs of AdminGuard (which only needs .role)
  // We mock the other required fields if strictly getting AdminUser type, 
  // but changing return type to Partial<AdminUser> is safer if TS allows.
  // AdminGuard checks !adminUser.role, so this works.
  return {
    id: userId,
    email: 'hidden@admin.com', // Placeholder as RPC doesn't return email
    role: data,
    created_at: new Date().toISOString(),
  } as AdminUser
}

/**
 * Hook: Check if user has admin role
 * StaleTime: 5 minutes (role rarely changes mid-session)
 */
export function useAdminRole(
  userId: string | undefined,
  options?: Omit<UseQueryOptions<AdminUser | null, Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: adminKeys.role(userId || ''),
    queryFn: () => fetchAdminRole(userId!),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
    enabled: !!userId, // Only run if userId exists
    ...options,
  })
}

/**
 * Fetch audit logs (Admin Audit Logs Page)
 */
async function fetchAuditLogs(limit = 100): Promise<any[]> {
  const { data, error } = await supabase
    .from('admin_action_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[adminQueries] Error fetching audit logs:', error)
    throw error
  }

  return data || []
}

/**
 * Hook: Fetch Audit Logs
 * StaleTime: 10 seconds (audit logs should be fresh)
 */
export function useAuditLogs(
  limit = 100,
  options?: Omit<UseQueryOptions<any[], Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: adminKeys.auditLogs(),
    queryFn: () => fetchAuditLogs(limit),
    staleTime: 10 * 1000, // 10 seconds
    gcTime: 1 * 60 * 1000,
    ...options,
  })
}

/**
 * Fetch admin reports (Admin Reports Page)
 */
async function fetchReports(): Promise<any> {
  // This would fetch aggregated data for reports
  // For now, return a placeholder structure
  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('id, total_price, status, created_at')
    .order('created_at', { ascending: false })
    .limit(100)

  if (bookingsError) {
    console.error('[adminQueries] Error fetching report data:', bookingsError)
    throw bookingsError
  }

  return { bookings: bookings || [] }
}

/**
 * Hook: Fetch Admin Reports
 * StaleTime: 1 minute (reports don't need real-time updates)
 */
export function useAdminReports(
  options?: Omit<UseQueryOptions<any, Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: adminKeys.reports(),
    queryFn: fetchReports,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000,
    ...options,
  })
}

/**
 * Fetch admin listings (Admin Listings Page)
 */
async function fetchListings(): Promise<any[]> {
  const { data, error } = await supabase
    .from('packages')
    .select('id, name, status, is_published, created_at, hotels(name, city)')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    console.error('[adminQueries] Error fetching listings:', error)
    throw error
  }

  return data || []
}

/**
 * Hook: Fetch Admin Listings
 * StaleTime: 30 seconds
 */
export function useAdminListings(
  options?: Omit<UseQueryOptions<any[], Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: adminKeys.listings(),
    queryFn: fetchListings,
    staleTime: 30 * 1000,
    gcTime: 2 * 60 * 1000,
    ...options,
  })
}

/**
 * Fetch partners (Admin Partners Page)
 */
async function fetchPartners(): Promise<any[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, first_name, last_name, account_type, created_at')
    .in('account_type', ['tour_operator', 'hotel_manager'])
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    console.error('[adminQueries] Error fetching partners:', error)
    throw error
  }

  return data || []
}

/**
 * Hook: Fetch Admin Partners
 * StaleTime: 1 minute
 */
export function useAdminPartners(
  options?: Omit<UseQueryOptions<any[], Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: adminKeys.partners(),
    queryFn: fetchPartners,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    ...options,
  })
}

/**
 * Mutation: Update user account status
 */
export function useUpdateUserStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      userId,
      status,
      reason,
    }: {
      userId: string
      status: string
      reason: string
    }) => {
      const { data, error } = await supabase.rpc('admin_update_account_status', {
        target_user_id: userId,
        new_status: status,
        reason_text: reason,
      })

      if (error) throw error
      return data
    },
    onSuccess: () => {
      // Surgical invalidation: only users list
      queryClient.invalidateQueries({ queryKey: adminKeys.users() })
    },
  })
}
