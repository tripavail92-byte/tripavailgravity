import { useQuery } from '@tanstack/react-query'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { ScrollView, Text, View } from 'react-native'

import { Check, Gem, Map, Sparkles, Ticket, X } from '@/components/icons/lucide'
import { AppHeader, Button, Card, EmptyState, Screen, Skeleton } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { useThemeColors } from '@/theme'
import {
  DEFAULT_MEMBERSHIP_TIER_CONFIGS,
  fetchOperatorCommercial,
  type TierCode,
} from '@/lib/operatorCommercial'

const TIER_META: Record<TierCode, { label: string; gradient: [string, string]; blurb: string }> = {
  gold: { label: 'Gold', gradient: ['#f59e0b', '#d97706'], blurb: 'Starter tier for new operators' },
  diamond: { label: 'Diamond', gradient: ['#38bdf8', '#2563eb'], blurb: 'Growth tier with maps & AI tools' },
  platinum: { label: 'Platinum', gradient: ['#94a3b8', '#475569'], blurb: 'Top tier for high-volume operators' },
}

function FeatureRow({ label, enabled, last }: { label: string; enabled: boolean; last?: boolean }) {
  return (
    <View className={`flex-row items-center py-3 ${last ? '' : 'border-b border-line'}`}>
      <View
        className={`h-7 w-7 items-center justify-center rounded-full ${enabled ? 'bg-success-bg' : 'bg-surface-sunken'}`}
      >
        {enabled ? <Check size={14} color="#15803d" /> : <X size={14} color="#94a3b8" />}
      </View>
      <Text className={`ml-3 text-[15px] ${enabled ? 'font-medium text-ink' : 'text-ink-soft'}`}>{label}</Text>
    </View>
  )
}

export default function OperatorCommercialScreen() {
  const { user } = useAuth()
  const c = useThemeColors()

  const { data, isLoading } = useQuery({
    queryKey: ['operator', 'commercial', user?.id],
    queryFn: () => fetchOperatorCommercial(user!.id),
    enabled: !!user,
  })

  if (!user) {
    return (
      <Screen>
        <AppHeader showBack title="Membership" />
        <EmptyState icon="person-circle-outline" title="Sign in" description="Sign in to view your membership.">
          <Button label="Sign In" onPress={() => router.push('/(auth)/login')} />
        </EmptyState>
      </Screen>
    )
  }

  const meta = data ? TIER_META[data.tier] : TIER_META.gold
  const usedRatio = data && data.monthlyPublishLimit > 0 ? data.publishedCount / data.monthlyPublishLimit : 0

  return (
    <Screen>
      <AppHeader showBack title="Membership & commercial" subtitle="Your tier, limits and features" />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        {isLoading || !data ? (
          <View>
            <Skeleton height={150} radius={24} />
            <View className="mt-4"><Skeleton height={200} radius={16} /></View>
          </View>
        ) : (
          <>
            {/* Tier hero */}
            <LinearGradient
              colors={meta.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 24, padding: 20 }}
            >
              <View className="flex-row items-center">
                <View className="h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
                  <Gem size={24} color="#ffffff" />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-xl font-black text-white">{meta.label} member</Text>
                  <Text className="text-xs text-white/80">{meta.blurb}</Text>
                </View>
              </View>
              <View className="mt-5">
                <View className="flex-row items-end justify-between">
                  <Text className="text-xs font-semibold uppercase tracking-wide text-white/80">
                    Published this month
                  </Text>
                  <Text className="text-sm font-black text-white">
                    {data.publishedCount} / {data.monthlyPublishLimit}
                  </Text>
                </View>
                <View className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/25">
                  <View
                    className="h-full rounded-full bg-white"
                    style={{ width: `${Math.min(100, Math.round(usedRatio * 100))}%` }}
                  />
                </View>
                {!data.canPublishMore ? (
                  <Text className="mt-2 text-xs font-semibold text-white">
                    Monthly publish limit reached — resets next month.
                  </Text>
                ) : null}
              </View>
            </LinearGradient>

            {/* Commercial terms */}
            <Card className="mt-4 p-4">
              <View className="flex-row items-center justify-between border-b border-line py-3">
                <Text className="text-[15px] text-ink-muted">Monthly publish limit</Text>
                <Text className="text-[15px] font-bold text-ink">{data.monthlyPublishLimit} tours</Text>
              </View>
              <View className="flex-row items-center justify-between py-3">
                <Text className="text-[15px] text-ink-muted">Minimum deposit</Text>
                <Text className="text-[15px] font-bold text-ink">{data.minimumDepositPercent}%</Text>
              </View>
            </Card>

            {/* Features */}
            <Text className="mb-2 mt-6 text-base font-bold text-ink">Tier features</Text>
            <Card className="p-4">
              <FeatureRow label="Multi-city pickup points" enabled={data.pickupMultiCity} />
              <FeatureRow label="Google Maps locations" enabled={data.googleMaps} />
              <FeatureRow label="AI itinerary assistant" enabled={data.aiItinerary} last />
            </Card>

            {/* Tier ladder */}
            <Text className="mb-2 mt-6 text-base font-bold text-ink">All tiers</Text>
            {(Object.keys(DEFAULT_MEMBERSHIP_TIER_CONFIGS) as TierCode[]).map((tier) => {
              const cfg = DEFAULT_MEMBERSHIP_TIER_CONFIGS[tier]
              const current = tier === data.tier
              return (
                <Card key={tier} className={`mb-2 p-4 ${current ? 'border-2 border-primary-700' : ''}`}>
                  <View className="flex-row items-center">
                    <LinearGradient
                      colors={TIER_META[tier].gradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{ width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Gem size={16} color="#ffffff" />
                    </LinearGradient>
                    <View className="ml-3 flex-1">
                      <Text className="font-bold text-ink">
                        {TIER_META[tier].label}
                        {current ? '  ·  current' : ''}
                      </Text>
                      <Text className="text-xs text-ink-soft">
                        {cfg.monthlyPublishLimit} tours/mo · {cfg.minimumDepositPercent}% min deposit
                      </Text>
                    </View>
                    <View className="flex-row gap-1.5">
                      <Map size={14} color={cfg.googleMaps ? '#16a34a' : c.inkSoft} />
                      <Sparkles size={14} color={cfg.aiItinerary ? '#16a34a' : c.inkSoft} />
                      <Ticket size={14} color={cfg.pickupMultiCity ? '#16a34a' : c.inkSoft} />
                    </View>
                  </View>
                </Card>
              )
            })}

            <Text className="mt-4 text-center text-xs leading-5 text-ink-soft">
              Tier upgrades, payout reports, billing and disputes are managed on the web dashboard.
            </Text>
          </>
        )}
      </ScrollView>
    </Screen>
  )
}
