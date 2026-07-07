import { useQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
import { useState } from 'react'
import { FlatList, Pressable, ScrollView, Text, View } from 'react-native'

import { AppHeader, Badge, Button, Card, EmptyState, Screen } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { fetchManagerBookings } from '@/lib/managerBookings'

const FILTERS = ['all', 'pending', 'confirmed', 'completed', 'cancelled'] as const
type Filter = (typeof FILTERS)[number]

function tone(status: string | null): 'success' | 'warning' | 'danger' | 'primary' | 'neutral' {
  if (status === 'confirmed') return 'success'
  if (status === 'cancelled' || status === 'refunded') return 'danger'
  if (status === 'completed') return 'primary'
  if (status === 'pending') return 'warning'
  return 'neutral'
}

function fmtDate(d: string | null): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })
}

export default function ManagerBookings() {
  const { user } = useAuth()
  const [filter, setFilter] = useState<Filter>('all')

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['manager', 'bookings', user?.id],
    queryFn: () => fetchManagerBookings(user!.id),
    enabled: !!user,
  })

  if (!user) {
    return (
      <Screen>
        <AppHeader showBack title="Bookings" />
        <EmptyState icon="person-circle-outline" title="Sign in" description="Sign in to view bookings.">
          <Button label="Sign In" onPress={() => router.push('/(auth)/login')} />
        </EmptyState>
      </Screen>
    )
  }

  const filtered = filter === 'all' ? bookings : bookings.filter((b) => b.status === filter)

  return (
    <Screen>
      <AppHeader showBack title="Package bookings" />
      <View className="pb-2">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
          {FILTERS.map((f) => (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              className={`mr-2 rounded-full px-4 py-1.5 ${filter === f ? 'bg-primary-700' : 'bg-surface-sunken'}`}
            >
              <Text className={`text-xs font-semibold capitalize ${filter === f ? 'text-white' : 'text-ink-muted'}`}>{f}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(b) => b.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 6, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          isLoading ? (
            <Text className="mt-12 text-center text-ink-soft">Loading…</Text>
          ) : (
            <EmptyState icon="briefcase-outline" title="No bookings" description={`No ${filter === 'all' ? '' : `${filter} `}package bookings yet.`} />
          )
        }
        renderItem={({ item: b }) => (
          <Card className="mb-2 flex-row items-center p-4">
            <View className="flex-1">
              <Text className="font-semibold text-ink" numberOfLines={1}>{b.packageName}</Text>
              <Text className="text-xs text-ink-soft">
                {fmtDate(b.check_in_date)} → {fmtDate(b.check_out_date)} · {b.guest_count ?? 1} guest(s) · {b.payment_status ?? 'unpaid'}
              </Text>
            </View>
            <View className="items-end">
              <Text className="font-bold text-primary-700">{b.currency} {b.total_price.toLocaleString()}</Text>
              <View className="mt-1"><Badge label={b.status ?? 'pending'} tone={tone(b.status)} /></View>
            </View>
          </Card>
        )}
      />
    </Screen>
  )
}
