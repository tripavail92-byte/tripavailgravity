/* eslint-disable @typescript-eslint/no-explicit-any */

import type { MembershipTierCode } from '@tripavail/shared/commercial/engine'

import { supabase } from '@/lib/supabase'

/**
 * Membership tier change requests. Operators ask; admins approve or reject.
 *
 * Every write goes through a SECURITY DEFINER RPC — there are no INSERT/UPDATE RLS
 * policies on `tier_change_requests` — so the state machine and the "one pending
 * request per operator" rule are enforced server-side, not by this client.
 */

export type TierChangeRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'

export interface TierChangeRequest {
  id: string
  operator_user_id: string
  current_tier_code: MembershipTierCode
  requested_tier_code: MembershipTierCode
  status: TierChangeRequestStatus
  operator_note: string | null
  admin_note: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
}

/** A queue row joined with enough operator context for an admin to decide. */
export interface AdminTierChangeRequest extends TierChangeRequest {
  business_name: string | null
}

export const tierChangeRequestService = {
  /** The operator's own requests, newest first. */
  async listOwn(operatorUserId: string): Promise<TierChangeRequest[]> {
    const { data, error } = await (supabase.from('tier_change_requests' as any) as any)
      .select('*')
      .eq('operator_user_id', operatorUserId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data ?? []) as TierChangeRequest[]
  },

  /** The operator's open request, if any. */
  async getPending(operatorUserId: string): Promise<TierChangeRequest | null> {
    const { data, error } = await (supabase.from('tier_change_requests' as any) as any)
      .select('*')
      .eq('operator_user_id', operatorUserId)
      .eq('status', 'pending')
      .maybeSingle()

    if (error) throw error
    return (data ?? null) as TierChangeRequest | null
  },

  async request(requestedTier: MembershipTierCode, note?: string): Promise<TierChangeRequest> {
    const { data, error } = await supabase.rpc('request_membership_tier_change' as any, {
      p_requested_tier: requestedTier,
      p_note: note?.trim() || null,
    })

    if (error) throw error
    return (Array.isArray(data) ? data[0] : data) as TierChangeRequest
  },

  async cancel(requestId: string): Promise<TierChangeRequest> {
    const { data, error } = await supabase.rpc('cancel_membership_tier_change_request' as any, {
      p_request_id: requestId,
    })

    if (error) throw error
    return (Array.isArray(data) ? data[0] : data) as TierChangeRequest
  },

  /** Admin queue. Pending first, then most recently resolved. */
  async listForAdmin(status?: TierChangeRequestStatus): Promise<AdminTierChangeRequest[]> {
    let query = (supabase.from('tier_change_requests' as any) as any)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (status) query = query.eq('status', status)

    const { data, error } = await query
    if (error) throw error

    const rows = (data ?? []) as TierChangeRequest[]
    if (rows.length === 0) return []

    // Resolve business names separately — tour_operator_profiles isn't FK-joinable
    // from this table through PostgREST's embedding.
    const ids = [...new Set(rows.map((row) => row.operator_user_id))]
    const { data: profiles } = await (supabase.from('tour_operator_profiles' as any) as any)
      .select('user_id, business_name')
      .in('user_id', ids)

    const names = new Map<string, string | null>(
      ((profiles ?? []) as any[]).map((p) => [p.user_id, p.business_name ?? null]),
    )

    return rows.map((row) => ({ ...row, business_name: names.get(row.operator_user_id) ?? null }))
  },

  async review(requestId: string, approve: boolean, note?: string): Promise<TierChangeRequest> {
    const { data, error } = await supabase.rpc('admin_review_membership_tier_change' as any, {
      p_request_id: requestId,
      p_approve: approve,
      p_note: note?.trim() || null,
    })

    if (error) throw error
    return (Array.isArray(data) ? data[0] : data) as TierChangeRequest
  },
}
