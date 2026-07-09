/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  mapTierRowToConfig,
  type MembershipTierCode,
  type MembershipTierConfig,
  type MembershipTierRow,
} from '@tripavail/shared/commercial/engine'

import { supabase } from '@/lib/supabase'

/**
 * The membership tier catalogue. `commercial_membership_tiers` is the single source of
 * truth: admins edit it from the dashboard, operators read it to see their plan and what
 * an upgrade unlocks. The engine's `DEFAULT_MEMBERSHIP_TIER_CONFIGS` are only a fallback
 * for when the row can't be read.
 */

/** Every tier field an admin is allowed to change. Tier `code` is immutable. */
export interface TierConfigPatch {
  display_name?: string
  tagline?: string | null
  badge_hex?: string | null
  monthly_fee?: number
  commission_rate?: number
  minimum_deposit_percent?: number
  monthly_publish_limit?: number
  ai_monthly_credits?: number
  support_priority?: number
  ranking_weight?: number
  pickup_multi_city_enabled?: boolean
  google_maps_enabled?: boolean
  ai_itinerary_enabled?: boolean
  perks?: string[]
  currency?: string
  sort_order?: number
  is_active?: boolean
  is_publicly_listed?: boolean
}

export interface TierConfigLogEntry {
  id: string
  tier_code: MembershipTierCode
  changed_by: string | null
  changed_fields: string[]
  previous_values: Record<string, unknown>
  new_values: Record<string, unknown>
  changed_at: string
}

function sortTiers(tiers: MembershipTierConfig[]): MembershipTierConfig[] {
  return [...tiers].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.monthlyFee - b.monthlyFee,
  )
}

export const membershipTierService = {
  /** The full catalogue, cheapest first. Includes inactive tiers (admins need to see them). */
  async listTiers(): Promise<MembershipTierConfig[]> {
    const { data, error } = await (supabase.from('commercial_membership_tiers' as any) as any)
      .select('*')

    if (error) throw error
    return sortTiers(((data ?? []) as MembershipTierRow[]).map(mapTierRowToConfig))
  },

  /** Only the tiers an operator may be offered / upgraded to. */
  async listPublicTiers(): Promise<MembershipTierConfig[]> {
    const tiers = await membershipTierService.listTiers()
    return tiers.filter((tier) => tier.isActive !== false && tier.isPubliclyListed !== false)
  },

  async getTier(code: MembershipTierCode): Promise<MembershipTierConfig | null> {
    const { data, error } = await (supabase.from('commercial_membership_tiers' as any) as any)
      .select('*')
      .eq('code', code)
      .maybeSingle()

    if (error) throw error
    return data ? mapTierRowToConfig(data as MembershipTierRow) : null
  },

  /**
   * Admin-only (enforced by RLS). Returns the saved row so the UI renders exactly what the
   * database accepted rather than what was optimistically typed.
   */
  async updateTier(code: MembershipTierCode, patch: TierConfigPatch): Promise<MembershipTierConfig> {
    const { data, error } = await (supabase.from('commercial_membership_tiers' as any) as any)
      .update(patch)
      .eq('code', code)
      .select('*')
      .maybeSingle()

    if (error) throw error
    if (!data) {
      // RLS returns zero rows rather than an error when the caller isn't an admin.
      throw new Error('Tier not updated — you may not have admin permission.')
    }
    return mapTierRowToConfig(data as MembershipTierRow)
  },

  async listConfigChangeLog(limit = 25): Promise<TierConfigLogEntry[]> {
    const { data, error } = await (supabase.from('commercial_tier_config_log' as any) as any)
      .select('*')
      .order('changed_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return (data ?? []) as TierConfigLogEntry[]
  },
}
