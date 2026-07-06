import { useEffect, useState } from 'react'
import {
  getMembershipTierConfig,
  type MembershipTierCode,
} from '@tripavail/shared/commercial/engine'

import { supabase } from '@/lib/supabase'

export interface OperatorCommercialGate {
  tierCode: MembershipTierCode
  tierLabel: string
  minimumDepositPercent: number
  monthlyPublishLimit: number
  publishedToursThisCycle: number
  pickupMultiCityEnabled: boolean
  googleMapsEnabled: boolean
  aiItineraryEnabled: boolean
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

function fallbackGate(): OperatorCommercialGate {
  const fallback = getMembershipTierConfig('gold')
  return {
    tierCode: fallback.code,
    tierLabel: fallback.label,
    minimumDepositPercent: fallback.minimumDepositPercent,
    monthlyPublishLimit: fallback.monthlyPublishLimit,
    publishedToursThisCycle: 0,
    pickupMultiCityEnabled: fallback.pickupMultiCityEnabled,
    googleMapsEnabled: fallback.googleMapsEnabled,
    aiItineraryEnabled: fallback.aiItineraryEnabled,
  }
}

/**
 * The operator's resolved membership-tier feature gate (Google Maps, multi-city pickups, AI
 * itinerary, publish limits…), shared by every wizard that needs to know what a tier unlocks —
 * the tour-creation wizard AND the onboarding wizard should both reflect the SAME gate, so a
 * feature doesn't appear to "work" on one and vanish on the other.
 */
export function useOperatorCommercialGate(userId: string | null | undefined): OperatorCommercialGate {
  const [gate, setGate] = useState<OperatorCommercialGate>(fallbackGate)

  useEffect(() => {
    if (!userId) return

    let cancelled = false

    const load = async () => {
      try {
        const { data, error } = await (supabase.from('operator_commercial_profiles' as any) as any)
          .select('membership_tier_code, monthly_published_tours_count, feature_overrides')
          .eq('operator_user_id', userId)
          .maybeSingle()

        if (error) throw error

        const tierCode = (data?.membership_tier_code ?? 'gold') as MembershipTierCode
        const tierConfig = getMembershipTierConfig(tierCode)
        const featureOverrides =
          data?.feature_overrides && typeof data.feature_overrides === 'object'
            ? (data.feature_overrides as Record<string, unknown>)
            : null

        if (!cancelled) {
          setGate({
            tierCode,
            tierLabel: tierConfig.label,
            minimumDepositPercent: tierConfig.minimumDepositPercent,
            monthlyPublishLimit: tierConfig.monthlyPublishLimit,
            publishedToursThisCycle: Number(data?.monthly_published_tours_count ?? 0),
            pickupMultiCityEnabled: resolveBooleanFeatureOverride(
              featureOverrides,
              ['pickup_multi_city_enabled', 'pickup_multi_city'],
              tierConfig.pickupMultiCityEnabled,
            ),
            googleMapsEnabled: resolveBooleanFeatureOverride(
              featureOverrides,
              ['google_maps_enabled', 'google_maps'],
              tierConfig.googleMapsEnabled,
            ),
            aiItineraryEnabled: resolveBooleanFeatureOverride(
              featureOverrides,
              ['ai_itinerary_enabled', 'ai_itinerary'],
              tierConfig.aiItineraryEnabled,
            ),
          })
        }
      } catch (error) {
        console.error('[useOperatorCommercialGate] Failed to load commercial tier gate', error)
        if (!cancelled) setGate(fallbackGate())
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [userId])

  return gate
}
