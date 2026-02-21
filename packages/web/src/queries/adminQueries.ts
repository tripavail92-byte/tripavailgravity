import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query'
import { useEffect } from 'react'

import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database.types'

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

export type VerificationRequest = {
  id: string
  user_id: string
  partner_type: 'hotel_manager' | 'tour_operator'
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'info_requested'
  submitted_at: string
  reviewed_at: string | null
  reviewed_by: string | null
  decision_reason: string | null
  submission_data: Record<string, unknown>
  version: number
  // joined
  profile?: { email: string; first_name: string | null; last_name: string | null } | null
}

export type AppNotification = {
  id: string
  user_id: string
  type: string
  title: string
  body: string | null
  read: boolean
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
  verificationQueue: (status?: string) =>
    [...adminKeys.all, 'verification-queue', status ?? 'all'] as const,
  notifications: (userId: string) => ['notifications', userId] as const,
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
  return useQuery<AdminUser | null, Error>({
    queryKey: adminKeys.role(userId || ''),
    queryFn: () => fetchAdminRole(userId!) as Promise<AdminUser | null>,
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
  // 1. Get all partner roles
  const { data: roles, error: rolesError } = await supabase
    .from('user_roles')
    .select('user_id, role_type, created_at')
    .in('role_type', ['tour_operator', 'hotel_manager'])
    .order('created_at', { ascending: false })
    .limit(100)

  if (rolesError) {
    console.error('[adminQueries] Error fetching partner roles:', rolesError)
    throw rolesError
  }

  if (!roles || roles.length === 0) return []

  // 2. Fetch the base profiles for these users
  const userIds = Array.from(new Set(roles.map((r) => r.user_id)))
  const { data: profiles, error: profError } = await supabase
    .from('profiles')
    .select('id, email, first_name, last_name, created_at')
    .in('id', userIds)

  if (profError) {
    throw profError
  }

  // 3. Map the roles back to a profile structure that the UI expects
  const profileMap = new Map((profiles || []).map((p) => [p.id, p]))

  return roles.map((r) => {
    const prof = profileMap.get(r.user_id)
    return {
      ...(prof || {}),
      id: r.user_id,
      account_type: r.role_type,
      // Use the role created_at as the "joined as partner" date
      created_at: r.created_at || prof?.created_at,
    }
  })
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
      queryClient.invalidateQueries({ queryKey: adminKeys.users() })
    },
  })
}

// ============================================================
// Verification Queue
// ============================================================

async function fetchVerificationQueue(status?: string): Promise<VerificationRequest[]> {
  let query = supabase
    .from('partner_verification_requests')
    .select('*')
    .order('submitted_at', { ascending: true }) // oldest first (FIFO queue)

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  const { data, error } = await query
  if (error) throw error
  return (data || []) as VerificationRequest[]
}

/**
 * useVerificationQueue
 * Fetches the partner approval queue and keeps it live via Supabase Realtime.
 * Subscribes to postgres_changes on partner_verification_requests — any INSERT
 * or UPDATE instantly invalidates the cache so the admin sees the new row
 * without polling.
 */
export function useVerificationQueue(
  status?: string,
  options?: Omit<UseQueryOptions<VerificationRequest[], Error>, 'queryKey' | 'queryFn'>,
) {
  const queryClient = useQueryClient()

  // Realtime subscription — replace 30s poll
  useEffect(() => {
    const channelName = `verification-queue-${status ?? 'all'}`
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT | UPDATE | DELETE
          schema: 'public',
          table: 'partner_verification_requests',
          ...(status && status !== 'all' ? { filter: `status=eq.${status}` } : {}),
        },
        () => {
          // Invalidate both the filtered and the 'all' query — sidebar badge updates too
          queryClient.invalidateQueries({ queryKey: adminKeys.verificationQueue(status) })
          queryClient.invalidateQueries({ queryKey: adminKeys.verificationQueue('all') })
          queryClient.invalidateQueries({ queryKey: adminKeys.verificationQueue() })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [status, queryClient])

  return useQuery<VerificationRequest[], Error>({
    queryKey: adminKeys.verificationQueue(status),
    queryFn: () => fetchVerificationQueue(status),
    staleTime: 15 * 1000, // 15s stale — Realtime keeps it fresh
    // refetchInterval removed — Realtime channel handles live updates
    ...options,
  })
}

export function useApprovePartner() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      userId,
      partnerType,
      requestId,
    }: {
      userId: string
      partnerType: string
      requestId: string
    }) => {
      const { error } = await supabase.rpc('admin_approve_partner' as any, {
        p_user_id: userId,
        p_partner_type: partnerType,
        p_request_id: requestId,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.verificationQueue() })
      queryClient.invalidateQueries({ queryKey: adminKeys.partners() })
    },
  })
}

export function useRejectPartner() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      userId,
      partnerType,
      requestId,
      reason,
    }: {
      userId: string
      partnerType: string
      requestId: string
      reason: string
    }) => {
      const { error } = await supabase.rpc('admin_reject_partner' as any, {
        p_user_id: userId,
        p_partner_type: partnerType,
        p_request_id: requestId,
        p_reason: reason,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.verificationQueue() })
      queryClient.invalidateQueries({ queryKey: adminKeys.partners() })
    },
  })
}

export function useRequestPartnerInfo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      userId,
      partnerType,
      requestId,
      message,
    }: {
      userId: string
      partnerType: string
      requestId: string
      message: string
    }) => {
      const { error } = await supabase.rpc('admin_request_partner_info' as any, {
        p_user_id: userId,
        p_partner_type: partnerType,
        p_request_id: requestId,
        p_message: message,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.verificationQueue() })
    },
  })
}

// ============================================================
// Notifications (partner bell)
// ============================================================

/**
 * useNotifications
 * Fetches the partner's in-app notification bell and keeps it live via Realtime.
 * Subscribes to postgres_changes on notifications table filtered by user_id.
 * Every new notification (INSERT) immediately invalidates and refetches —
 * the bell badge increments in real time without any polling.
 */
export function useNotifications(userId: string | undefined) {
  const queryClient = useQueryClient()

  // Realtime subscription per-user — replaces 30s poll
  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT', // only new notifications trigger the bell
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: adminKeys.notifications(userId) })
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE', // catch mark-as-read updates too
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: adminKeys.notifications(userId) })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, queryClient])

  return useQuery<AppNotification[], Error>({
    queryKey: adminKeys.notifications(userId || ''),
    queryFn: async () => {
      if (!userId) return []
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) throw error
      return (data || []) as AppNotification[]
    },
    enabled: !!userId,
    staleTime: 30 * 1000,
    // refetchInterval removed — Realtime channel handles live updates
  })
}

export function useMarkNotificationsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (notificationIds?: string[]) => {
      const { error } = await supabase.rpc('mark_notifications_read' as any, {
        p_notification_ids: notificationIds ?? null,
      })
      if (error) throw error
    },
    onSuccess: (_data, _vars, _ctx) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}
