import { useQuery } from '@tanstack/react-query'
import { LinearGradient } from 'expo-linear-gradient'
import { router, useLocalSearchParams } from 'expo-router'
import { ScrollView, Text, View } from 'react-native'

import {
  AppHeader,
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  Screen,
  Skeleton,
  TourCard,
  TourCardSkeleton,
  type TourCardData,
} from '@/components/ui'
import { fetchOperatorStorefront } from '@/lib/operatorPublic'
import { formatTourLocation, getDurationLabel, type DiscoveryTour } from '@/lib/tourDiscovery'
import { useRoleTheme } from '@/theme'

function formatYearsExperience(value: string | null) {
  if (!value) return null
  return value.includes('year') ? value : `${value} years experience`
}

function formatTeamSize(value: string | null) {
  if (!value) return null
  return value.toLowerCase().includes('team') ? value : `${value} team members`
}

function toCardData(t: DiscoveryTour): TourCardData {
  return {
    id: t.id,
    slug: t.slug,
    title: t.title,
    price: t.price,
    currency: t.currency,
    images: t.images,
    rating: t.rating,
    locationLabel: formatTourLocation(t),
    durationLabel: getDurationLabel(t.duration_days),
    tourType: t.tour_type,
    shortDescription: t.short_description,
  }
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <View className="min-w-[120px] flex-1 rounded-2xl border border-line bg-surface-sunken px-4 py-3">
      <Text className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{label}</Text>
      <Text className="mt-2 text-lg font-black text-ink">{value}</Text>
    </View>
  )
}

export default function OperatorProfileScreen() {
  const { slug } = useLocalSearchParams<{ slug?: string }>()
  const theme = useRoleTheme()

  const { data, isLoading, error } = useQuery({
    queryKey: ['operator', 'public', slug ?? 'unknown'],
    queryFn: () => fetchOperatorStorefront(slug!),
    enabled: Boolean(slug),
    staleTime: 5 * 60 * 1000,
  })

  if (isLoading) {
    return (
      <Screen>
        <AppHeader showBack title="" />
        <View className="px-5">
          <Skeleton height={170} radius={28} />
          <View className="mt-5 flex-row gap-3">
            <Skeleton height={70} width="48%" radius={16} />
            <Skeleton height={70} width="48%" radius={16} />
          </View>
          <View className="mt-6 gap-4">
            <TourCardSkeleton layout="list" />
            <TourCardSkeleton layout="list" />
          </View>
        </View>
      </Screen>
    )
  }

  if (error || !data) {
    return (
      <Screen>
        <AppHeader showBack title="" />
        <EmptyState
          icon="business-outline"
          title="Operator not found"
          description="This public operator profile is unavailable right now."
        >
          <Button label="Go back" onPress={() => router.back()} />
        </EmptyState>
      </Screen>
    )
  }

  const { profile, metrics, qualityScore, tours } = data
  const name = profile.business_name ?? profile.company_name ?? 'TripAvail Operator'
  const stats = [
    {
      label: 'Avg rating',
      value:
        metrics?.avg_rating != null && metrics.avg_rating > 0
          ? `${metrics.avg_rating.toFixed(1)} ★`
          : 'New',
    },
    { label: 'Quality score', value: qualityScore != null ? qualityScore.toFixed(1) : 'Pending' },
    { label: 'Completed trips', value: String(metrics?.total_completed_bookings ?? 0) },
    { label: 'Travelers served', value: String(metrics?.total_travelers_served ?? 0) },
  ]
  const aboutChips = [
    profile.coverage_range,
    formatYearsExperience(profile.years_experience),
    formatTeamSize(profile.team_size),
  ].filter(Boolean) as string[]

  return (
    <Screen>
      <AppHeader showBack title="" />
      <ScrollView contentContainerStyle={{ paddingBottom: 36 }} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <LinearGradient
          colors={[theme.primary, theme.primaryLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ marginHorizontal: 20, borderRadius: 28, padding: 20 }}
        >
          <View className="flex-row items-start justify-between">
            <View className="flex-1">
              <Avatar uri={profile.company_logo_url} name={name} size={72} />
              <Text className="mt-3 text-2xl font-black text-white">{name}</Text>
              {profile.primary_city ? (
                <Text className="mt-1 text-sm text-white/75">{profile.primary_city}</Text>
              ) : null}
              <View className="mt-3 flex-row flex-wrap gap-2">
                {profile.setup_completed ? (
                  <View className="rounded-full bg-white/15 px-3 py-1.5">
                    <Text className="text-xs font-semibold text-white">Verified operator</Text>
                  </View>
                ) : null}
                {metrics?.verified_badge_count ? (
                  <View className="rounded-full bg-white/15 px-3 py-1.5">
                    <Text className="text-xs font-semibold text-white">
                      {metrics.verified_badge_count} trust badge
                      {metrics.verified_badge_count === 1 ? '' : 's'}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Stats */}
        <View className="mt-5 flex-row flex-wrap gap-3 px-5">
          {stats.map((stat) => (
            <StatTile key={stat.label} label={stat.label} value={stat.value} />
          ))}
        </View>

        {/* About */}
        {profile.description ? (
          <View className="mt-6 px-5">
            <Card className="p-5">
              <Text className="text-lg font-bold text-ink">About {name}</Text>
              <Text className="mt-3 text-sm leading-6 text-ink-muted">{profile.description}</Text>
              {aboutChips.length > 0 ? (
                <View className="mt-4 flex-row flex-wrap gap-2">
                  {aboutChips.map((item) => (
                    <Badge key={item} label={item} tone="neutral" />
                  ))}
                </View>
              ) : null}
            </Card>
          </View>
        ) : null}

        {/* Specialties */}
        {profile.categories?.length ? (
          <View className="mt-6 px-5">
            <Text className="mb-3 text-lg font-bold text-ink">Specialties</Text>
            <View className="flex-row flex-wrap gap-2">
              {profile.categories.map((category) => (
                <Badge key={category} label={category} tone="primary" />
              ))}
            </View>
          </View>
        ) : null}

        {/* Tours */}
        <View className="mt-8 px-5">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-lg font-bold text-ink">Published tours</Text>
            <Text className="text-xs text-ink-soft">{tours.length} live</Text>
          </View>

          {tours.length === 0 ? (
            <Text className="text-sm text-ink-soft">This operator has no live tours yet.</Text>
          ) : (
            tours.map((tour) => (
              <View key={tour.id} className="mb-4">
                <TourCard tour={toCardData(tour)} layout="list" />
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </Screen>
  )
}
