/* eslint-disable @typescript-eslint/no-explicit-any */

import { useCallback, useEffect, useState } from 'react'
import {
  getMembershipTierConfig,
  mapTierRowToConfig,
  type MembershipTierCode,
  type MembershipTierConfig,
  type MembershipTierRow,
} from '@tripavail/shared/commercial/engine'

import { supabase } from '@/lib/supabase'

export type OperatorGateStatus = 'loading' | 'ready' | 'error'

export interface OperatorCommercialGate {
  status: OperatorGateStatus
  /** The operator's live tier, as configured by an admin in `commercial_membership_tiers`. */
  tier: MembershipTierConfig
  tierCode: MembershipTierCode
  tierLabel: string
  minimumDepositPercent: number

  monthlyPublishLimit: number
  publishedToursThisCycle: number
  publishSlotsRemaining: number
  canPublish: boolean

  aiMonthlyCredits: number
  aiCreditsUsed: number

  pickupMultiCityEnabled: boolean
  googleMapsEnabled: boolean
  aiItineraryEnabled: boolean

  commissionRate: number
  monthlyFee: number
  currency: string
  /** ISO date the current billing cycle ends — i.e. when publish slots reset. */
  cycleEndDate: string | null
  membershipStatus: string | null

  refresh: () => void
}

function resolveBooleanFeatureOverride(
  featureOverrides: Record<string, unknown> | null | undefined,
  keys: string[],
  fallback: boolean,
) {
  if (!featureOverrides) return fallback

  for (const key of keys) {
    const value = featureOverrides[key]
    if (typeof value === 'boolean') return value
  }

  return fallback
}

interface GateProfileRow {
  monthly_published_tours_count?: number | null
  ai_credits_used_current_cycle?: number | null
  current_cycle_end?: string | null
  membership_status?: string | null
  commission_rate?: number | null
}

function buildGate(
  tier: MembershipTierConfig,
  overrides: Record<string, unknown> | null,
  profile: GateProfileRow | null,
  status: OperatorGateStatus,
  refresh: () => void,
): OperatorCommercialGate {
  const publishedToursThisCycle = Number(profile?.monthly_published_tours_count ?? 0)

  return {
    status,
    tier,
    tierCode: tier.code,
    tierLabel: tier.label,
    minimumDepositPercent: tier.minimumDepositPercent,

    monthlyPublishLimit: tier.monthlyPublishLimit,
    publishedToursThisCycle,
    publishSlotsRemaining: Math.max(0, tier.monthlyPublishLimit - publishedToursThisCycle),
    canPublish: publishedToursThisCycle < tier.monthlyPublishLimit,

    aiMonthlyCredits: tier.aiMonthlyCredits,
    aiCreditsUsed: Number(profile?.ai_credits_used_current_cycle ?? 0),

    // A per-operator override beats the tier default — sales sometimes unlocks a single
    // feature without moving the operator onto a whole new tier.
    pickupMultiCityEnabled: resolveBooleanFeatureOverride(
      overrides,
      ['pickup_multi_city_enabled', 'pickup_multi_city'],
      tier.pickupMultiCityEnabled,
    ),
    googleMapsEnabled: resolveBooleanFeatureOverride(
      overrides,
      ['google_maps_enabled', 'google_maps'],
      tier.googleMapsEnabled,
    ),
    aiItineraryEnabled: resolveBooleanFeatureOverride(
      overrides,
      ['ai_itinerary_enabled', 'ai_itinerary'],
      tier.aiItineraryEnabled,
    ),

    commissionRate: Number(profile?.commission_rate ?? tier.commissionRate),
    monthlyFee: tier.monthlyFee,
    currency: tier.currency ?? 'PKR',
    cycleEndDate: profile?.current_cycle_end ?? null,
    membershipStatus: profile?.membership_status ?? null,

    refresh,
  }
}

/**
 * The operator's resolved membership-tier gate (Google Maps, multi-city pickups, AI itinerary,
 * publish limits…), shared by every surface that needs to know what a tier unlocks — the
 * dashboard, the tour-creation wizard, and the onboarding wizard read the SAME gate, so a
 * feature can't appear to work on one and vanish on the other.
 *
 * Tier values are read from the database, so an admin editing a limit takes effect without a
 * deploy. On a load failure the gate reports `status: 'error'` rather than silently applying
 * Gold limits to a Platinum operator — callers should surface that instead of gating on it.
 * Publish limits are enforced server-side regardless, so a permissive client gate is not a hole.
 */
export function useOperatorCommercialGate(userId: string | null | undefined): OperatorCommercialGate {
  const [nonce, setNonce] = useState(0)
  const refresh = useCallback(() => setNonce((n) => n + 1), [])

  const [gate, setGate] = useState<OperatorCommercialGate>(() =>
    buildGate(getMembershipTierConfig('gold'), null, null, 'loading', refresh),
  )

  useEffect(() => {
    if (!userId) return

    let cancelled = false

    const load = async () => {
      try {
        const { data: profile, error: profileError } = await (
          supabase.from('operator_commercial_profiles' as any) as any
        )
          .select(
            'membership_tier_code, membership_status, commission_rate, monthly_published_tours_count, ai_credits_used_current_cycle, current_cycle_end, feature_overrides',
          )
          .eq('operator_user_id', userId)
          .maybeSingle()

        if (profileError) throw profileError

        const tierCode = (profile?.membership_tier_code ?? 'gold') as MembershipTierCode

        const { data: tierRow, error: tierError } = await (
          supabase.from('commercial_membership_tiers' as any) as any
        )
          .select('*')
          .eq('code', tierCode)
          .maybeSingle()

        if (tierError) throw tierError

        // A missing row (un-seeded tier, or RLS before the tier-read migration landed) falls
        // back to the built-in config instead of blocking the wizard.
        const tier = tierRow
          ? mapTierRowToConfig(tierRow as MembershipTierRow)
          : getMembershipTierConfig(tierCode)

        const overrides =
          profile?.feature_overrides && typeof profile.feature_overrides === 'object'
            ? (profile.feature_overrides as Record<string, unknown>)
            : null

        if (!cancelled) setGate(buildGate(tier, overrides, profile as GateProfileRow, 'ready', refresh))
      } catch (error) {
        console.error('[useOperatorCommercialGate] Failed to load commercial tier gate', error)
        if (!cancelled) {
          setGate(buildGate(getMembershipTierConfig('gold'), null, null, 'error', refresh))
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [userId, nonce, refresh])

  return gate
}
