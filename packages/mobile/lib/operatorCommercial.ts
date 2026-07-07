import { supabase } from '@/lib/supabase'

/**
 * Operator commercial tier config + publish gates — mirrors the web
 * DEFAULT_MEMBERSHIP_TIER_CONFIGS + operator_commercial_profiles read.
 * The DB triggers are the authoritative gate; this is for UI gating/preview.
 */

export type TierCode = 'gold' | 'diamond' | 'platinum'

export interface TierConfig {
  monthlyPublishLimit: number
  minimumDepositPercent: number
  pickupMultiCity: boolean
  googleMaps: boolean
  aiItinerary: boolean
}

export const DEFAULT_MEMBERSHIP_TIER_CONFIGS: Record<TierCode, TierConfig> = {
  gold: { monthlyPublishLimit: 5, minimumDepositPercent: 20, pickupMultiCity: false, googleMaps: false, aiItinerary: false },
  diamond: { monthlyPublishLimit: 25, minimumDepositPercent: 15, pickupMultiCity: true, googleMaps: true, aiItinerary: true },
  platinum: { monthlyPublishLimit: 100, minimumDepositPercent: 10, pickupMultiCity: true, googleMaps: true, aiItinerary: true },
}

export interface OperatorCommercialGates {
  tier: TierCode
  publishedCount: number
  monthlyPublishLimit: number
  minimumDepositPercent: number
  pickupMultiCity: boolean
  googleMaps: boolean
  aiItinerary: boolean
  canPublishMore: boolean
}

export async function fetchOperatorCommercial(userId: string): Promise<OperatorCommercialGates> {
  let tier: TierCode = 'gold'
  let publishedCount = 0
  let overrides: Record<string, any> = {}

  try {
    const { data } = await supabase
      .from('operator_commercial_profiles')
      .select('membership_tier_code, monthly_published_tours_count, feature_overrides')
      .eq('operator_user_id', userId)
      .maybeSingle()
    if (data) {
      const row = data as Record<string, any>
      const code = String(row.membership_tier_code || 'gold').toLowerCase()
      tier = (['gold', 'diamond', 'platinum'].includes(code) ? code : 'gold') as TierCode
      publishedCount = Number(row.monthly_published_tours_count || 0)
      overrides = (row.feature_overrides as Record<string, any>) || {}
    }
  } catch {
    // Auto-provisioned server-side; fall back to gold on any error.
  }

  const base = DEFAULT_MEMBERSHIP_TIER_CONFIGS[tier]
  const resolveBool = (fallback: boolean, ...keys: string[]): boolean => {
    for (const k of keys) {
      if (typeof overrides[k] === 'boolean') return overrides[k]
    }
    return fallback
  }

  return {
    tier,
    publishedCount,
    monthlyPublishLimit: base.monthlyPublishLimit,
    minimumDepositPercent: base.minimumDepositPercent,
    pickupMultiCity: resolveBool(base.pickupMultiCity, 'pickup_multi_city_enabled', 'pickup_multi_city'),
    googleMaps: resolveBool(base.googleMaps, 'google_maps_enabled', 'google_maps'),
    aiItinerary: resolveBool(base.aiItinerary, 'ai_itinerary_enabled', 'ai_itinerary'),
    canPublishMore: publishedCount < base.monthlyPublishLimit,
  }
}

/** Parse a publish error from the DB enforcement triggers into a friendly message. */
export function parsePublishError(error: any): string | null {
  const blob = `${error?.message ?? ''} ${error?.details ?? ''} ${error?.hint ?? ''}`.toLowerCase()
  if (blob.includes('publish_limit_reached') || blob.includes('publish limit')) {
    return 'You have reached the maximum number of published trips for your membership tier.'
  }
  if (blob.includes('minimum_deposit_not_met') || (blob.includes('deposit') && blob.includes('membership'))) {
    return error?.details || 'Your deposit percentage is below your membership tier minimum.'
  }
  return null
}
