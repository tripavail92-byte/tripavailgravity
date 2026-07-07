import { useQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
import { ScrollView, Text, View } from 'react-native'

import { Star } from '@/components/icons/lucide'
import { AppHeader, Button, Card, EmptyState, Screen } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { computeOperatorStats, fetchOperatorBookings, fetchOperatorTours } from '@/lib/operator'

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <View className="min-w-[150px] flex-1 rounded-2xl border border-line bg-surface p-4">
      <Text className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{label}</Text>
      <Text className="mt-2 text-xl font-black text-ink">{value}</Text>
    </View>
  )
}

export default function OperatorAnalytics() {
  const { user } = useAuth()
  const { data: tours = [] } = useQuery({
    queryKey: ['operator', 'tours', user?.id],
    queryFn: () => fetchOperatorTours(user!.id),
    enabled: !!user,
  })
  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['operator', 'bookings', user?.id],
    queryFn: () => fetchOperatorBookings(user!.id),
    enabled: !!user,
  })

  if (!user) {
    return (
      <Screen>
        <AppHeader showBack title="Analytics" />
        <EmptyState icon="person-circle-outline" title="Sign in" description="Sign in to view analytics.">
          <Button label="Sign In" onPress={() => router.push('/(auth)/login')} />
        </EmptyState>
      </Screen>
    )
  }

  const stats = computeOperatorStats(tours, bookings)
  const earning = bookings.filter((b) => b.status === 'confirmed' || b.status === 'completed')
  const revenue = earning.reduce((s, b) => s + (Number(b.total_price) || 0), 0)
  const currency = earning[0]?.tour?.currency ?? bookings[0]?.tour?.currency ?? 'PKR'
  const pending = bookings.filter((b) => b.status === 'pending').length
  const topTours = [...tours]
    .filter((t) => (t.rating ?? 0) > 0)
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, 5)

  return (
    <Screen>
      <AppHeader showBack title="Analytics" subtitle="Your storefront at a glance" />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <View className="flex-row flex-wrap gap-3">
          <StatTile label="Revenue (confirmed)" value={`${currency} ${Math.round(revenue).toLocaleString()}`} />
          <StatTile label="Confirmed bookings" value={String(stats.bookings)} />
          <StatTile label="Pending" value={String(pending)} />
          <StatTile label="Active tours" value={String(stats.activeTours)} />
          <StatTile label="Drafts" value={String(stats.drafts)} />
          <StatTile label="Avg rating" value={stats.avgRating ? `${stats.avgRating.toFixed(1)} ★` : 'New'} />
        </View>

        <Text className="mb-3 mt-7 text-lg font-bold text-ink">Top-rated tours</Text>
        {isLoading ? (
          <Text className="text-ink-soft">Loading…</Text>
        ) : topTours.length === 0 ? (
          <Text className="text-sm text-ink-soft">No rated tours yet — ratings appear after travellers review your tours.</Text>
        ) : (
          topTours.map((t) => (
            <Card key={t.id} className="mb-2 flex-row items-center justify-between p-4">
              <Text className="flex-1 font-semibold text-ink" numberOfLines={1}>{t.title}</Text>
              <View className="ml-3 flex-row items-center">
                <Star size={14} color="#f59e0b" fill="#f59e0b" />
                <Text className="ml-1 text-sm font-bold text-ink">{Number(t.rating).toFixed(1)}</Text>
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </Screen>
  )
}
