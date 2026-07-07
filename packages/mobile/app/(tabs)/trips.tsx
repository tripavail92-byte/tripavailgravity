import { useQuery } from '@tanstack/react-query'
import { type Href, router } from 'expo-router'
import { useEffect, useState } from 'react'
import { FlatList, Image, Pressable, Text, View } from 'react-native'

import { Calendar, Users } from '@/components/icons/lucide'
import { AppHeader, Badge, Button, Card, EmptyState, Screen, TourCardSkeleton } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { useThemeColors } from '@/theme'
import { fetchMyTrips, splitTrips, type TripItem } from '@/lib/trips'

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=300&q=80'

const STATUS_TONE: Record<string, 'success' | 'warning' | 'danger' | 'neutral' | 'primary'> = {
  confirmed: 'success',
  pending: 'warning',
  cancelled: 'danger',
  completed: 'primary',
}

function formatTripDate(iso: string | null): string {
  if (!iso) return 'Date TBD'
  return new Date(iso).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })
}

function TripCard({ trip }: { trip: TripItem }) {
  const c = useThemeColors()
  const tone = STATUS_TONE[trip.status ?? 'pending'] ?? 'neutral'
  const isDeposit = trip.remaining > 0 && trip.status !== 'cancelled'

  const open = () => {
    if (trip.kind === 'tour') router.push(`/trips/${trip.id}` as Href)
    else if (trip.refId) router.push(`/packages/${trip.refId}` as Href)
  }

  return (
    <Pressable className="mb-3" onPress={open}>
      <Card className="overflow-hidden">
        <View className="flex-row">
          <Image
            source={{ uri: trip.image ?? FALLBACK_IMAGE }}
            style={{ width: 104, height: '100%', minHeight: 116 }}
            resizeMode="cover"
          />
          <View className="flex-1 p-3">
            <View className="flex-row items-center justify-between">
              <Badge label={trip.kind === 'tour' ? 'Tour' : 'Stay'} tone="primary" />
              <Badge label={trip.status ?? 'pending'} tone={tone} />
            </View>
            <Text className="mt-1.5 font-semibold text-ink" numberOfLines={1}>
              {trip.title}
            </Text>
            <View className="mt-1 flex-row items-center">
              <Calendar size={11} color={c.inkSoft} />
              <Text className="ml-1 text-xs text-ink-soft">
                {formatTripDate(trip.tripDate)}
                {trip.durationLabel ? ` · ${trip.durationLabel}` : ''}
              </Text>
              {trip.guests ? (
                <>
                  <Users size={11} color={c.inkSoft} style={{ marginLeft: 8 }} />
                  <Text className="ml-1 text-xs text-ink-soft">{trip.guests}</Text>
                </>
              ) : null}
            </View>
            <View className="mt-2 flex-row items-end justify-between">
              <View>
                {isDeposit ? (
                  <Text className="text-[11px] text-ink-soft">
                    Paid {trip.currency} {trip.paidOnline.toLocaleString()} · Remaining{' '}
                    {trip.currency} {trip.remaining.toLocaleString()}
                  </Text>
                ) : null}
                <Text className="font-bold text-primary-700">
                  {trip.currency} {trip.total.toLocaleString()}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Card>
    </Pressable>
  )
}

export default function TripsScreen() {
  const { user } = useAuth()
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming')
  const [autoTabbed, setAutoTabbed] = useState(false)

  const { data: trips = [], isLoading } = useQuery({
    queryKey: ['trips', 'my', user?.id],
    queryFn: () => fetchMyTrips(user!.id),
    enabled: !!user,
  })

  const { upcoming, past } = splitTrips(trips)

  // Smart default — an empty Upcoming over a full Past reads as "trips didn't load".
  useEffect(() => {
    if (!autoTabbed && !isLoading && trips.length > 0 && upcoming.length === 0) {
      setTab('past')
      setAutoTabbed(true)
    }
  }, [autoTabbed, isLoading, trips.length, upcoming.length])

  if (!user) {
    return (
      <Screen>
        <AppHeader title="My Trips" />
        <EmptyState
          icon="briefcase-outline"
          title="Sign in to see your trips"
          description="Your confirmed bookings will appear here."
        >
          <Button label="Sign In" onPress={() => router.push('/(auth)/login')} />
        </EmptyState>
      </Screen>
    )
  }

  const shown = tab === 'upcoming' ? upcoming : past

  return (
    <Screen>
      <AppHeader title="My Trips" subtitle={trips.length ? `${trips.length} total bookings` : undefined} />

      {/* Upcoming / Past segmented control with counts */}
      <View className="mx-5 mb-2 flex-row rounded-2xl border border-line bg-surface p-1">
        {(['upcoming', 'past'] as const).map((t) => {
          const active = tab === t
          const count = t === 'upcoming' ? upcoming.length : past.length
          return (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              className={`flex-1 items-center rounded-xl py-2 ${active ? 'bg-primary-700' : ''}`}
            >
              <Text className={`text-sm font-semibold capitalize ${active ? 'text-white' : 'text-ink-muted'}`}>
                {t} ({count})
              </Text>
            </Pressable>
          )
        })}
      </View>

      <FlatList
        data={shown}
        keyExtractor={(item) => `${item.kind}_${item.id}`}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          isLoading ? (
            <View className="gap-3">
              <TourCardSkeleton />
              <TourCardSkeleton />
              <TourCardSkeleton />
            </View>
          ) : (
            <EmptyState
              icon="briefcase-outline"
              title={tab === 'upcoming' ? 'No upcoming trips' : 'No past trips'}
              description={
                tab === 'upcoming'
                  ? past.length > 0
                    ? `Your ${past.length} previous trip${past.length === 1 ? '' : 's'} are under Past. Time to plan the next one!`
                    : 'Start exploring and book your first adventure!'
                  : 'Trips you complete will appear here.'
              }
            >
              {tab === 'upcoming' ? (
                <Button label="Explore tours" onPress={() => router.push('/(tabs)/tours')} />
              ) : null}
            </EmptyState>
          )
        }
        renderItem={({ item }) => <TripCard trip={item} />}
      />
    </Screen>
  )
}
