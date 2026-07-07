import { useQuery } from '@tanstack/react-query'
import { type Href, router } from 'expo-router'
import { Image, Pressable, ScrollView, Text, View } from 'react-native'

import { Menu } from '@/components/icons/lucide'
import { AppHeader, Badge, Button, Card, EmptyState, Screen } from '@/components/ui'
import { GlassBar, GlassPanel } from '@/components/ui/Glass'
import { useAuth } from '@/hooks/useAuth'
import { useDrawer } from '@/hooks/useDrawer'
import { useThemeColors } from '@/theme'
import {
  computeOperatorStats,
  fetchOperatorBookings,
  fetchOperatorTours,
  type OperatorBooking,
} from '@/lib/operator'

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=300&q=80'

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <GlassPanel radius={16} intensity={35} style={{ minWidth: 150, flex: 1 }} contentStyle={{ padding: 16 }}>
      <Text className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{label}</Text>
      <Text className="mt-2 text-xl font-black text-ink">{value}</Text>
    </GlassPanel>
  )
}

function bookingTone(status: string | null): 'success' | 'warning' | 'danger' | 'primary' | 'neutral' {
  if (status === 'confirmed') return 'success'
  if (status === 'cancelled') return 'danger'
  if (status === 'completed') return 'primary'
  if (status === 'pending') return 'warning'
  return 'neutral'
}

function ageLabel(iso: string | null): string {
  if (!iso) return ''
  const days = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / (24 * 60 * 60 * 1000)))
  if (days === 0) return 'today'
  if (days === 1) return '1d ago'
  return `${days}d ago`
}

export default function OperatorDashboard() {
  const { user } = useAuth()
  const openDrawer = useDrawer((s) => s.openDrawer)
  const c = useThemeColors()

  const { data: tours = [], isLoading: toursLoading } = useQuery({
    queryKey: ['operator', 'tours', user?.id],
    queryFn: () => fetchOperatorTours(user!.id),
    enabled: !!user,
  })
  const { data: bookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ['operator', 'bookings', user?.id],
    queryFn: () => fetchOperatorBookings(user!.id),
    enabled: !!user,
  })

  const stats = computeOperatorStats(tours, bookings)

  if (!user) {
    return (
      <Screen>
        <AppHeader showBack title="Operator" />
        <EmptyState icon="person-circle-outline" title="Sign in" description="Sign in to manage your tours.">
          <Button label="Sign In" onPress={() => router.push('/(auth)/login')} />
        </EmptyState>
      </Screen>
    )
  }

  return (
    <Screen>
      <View style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingTop: 86, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
        <View className="flex-row flex-wrap gap-3">
          <StatTile label="Active tours" value={String(stats.activeTours)} />
          <StatTile label="Drafts" value={String(stats.drafts)} />
          <StatTile label="Bookings" value={String(stats.bookings)} />
          <StatTile label="Avg rating" value={stats.avgRating ? `${stats.avgRating.toFixed(1)} ★` : 'New'} />
        </View>

        <View className="mt-4 flex-row gap-3">
          <View className="flex-1">
            <Button
              label="Create a tour"
              gradient
              onPress={() => router.push('/operator/tours/create' as Href)}
            />
          </View>
          <View className="flex-1">
            <Button
              label="Edit setup"
              variant="secondary"
              onPress={() => router.push('/operator/setup' as Href)}
            />
          </View>
        </View>

        <View className="mt-3 flex-row gap-3">
          <View className="flex-1">
            <Button label="Calendar" variant="secondary" onPress={() => router.push('/operator/calendar' as Href)} />
          </View>
          <View className="flex-1">
            <Button label="Reviews" variant="secondary" onPress={() => router.push('/operator/reviews' as Href)} />
          </View>
        </View>
        <View className="mt-3 flex-row gap-3">
          <View className="flex-1">
            <Button label="Membership" variant="secondary" onPress={() => router.push('/operator/commercial' as Href)} />
          </View>
          <View className="flex-1">
            <Button label="Settings" variant="secondary" onPress={() => router.push('/operator/settings' as Href)} />
          </View>
        </View>

        {/* Continue editing — drafts with completion, like the web dashboard rail */}
        {tours.some((t) => !t.is_published) ? (
          <View>
            <Text className="mb-3 mt-7 text-lg font-bold text-ink">Pick up where you left off</Text>
            {tours
              .filter((t) => !t.is_published)
              .slice(0, 3)
              .map((t) => {
                const pct = Math.max(0, Math.min(100, Number(t.completion_percentage ?? 0)))
                return (
                  <Pressable
                    key={`draft_${t.id}`}
                    className="mb-2"
                    onPress={() => router.push(`/operator/tours/create?id=${t.id}` as Href)}
                  >
                    <Card className="p-4">
                      <View className="flex-row items-center justify-between">
                        <Text className="flex-1 font-semibold text-ink" numberOfLines={1}>
                          {t.title || 'Untitled tour'}
                        </Text>
                        <Text className="ml-2 text-xs text-ink-soft">{ageLabel(t.last_edited_at)}</Text>
                      </View>
                      <View className="mt-2 flex-row items-center">
                        <View className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-sunken">
                          <View className="h-full rounded-full bg-primary-700" style={{ width: `${pct}%` }} />
                        </View>
                        <Text className="ml-2 text-xs font-bold text-primary-700">{pct}%</Text>
                      </View>
                      <View className="mt-2 flex-row items-center justify-between">
                        <Badge label="in progress" tone="warning" />
                        <Text className="text-sm font-bold text-primary-700">Resume →</Text>
                      </View>
                    </Card>
                  </Pressable>
                )
              })}
          </View>
        ) : null}

        <Text className="mb-3 mt-7 text-lg font-bold text-ink">Your tours</Text>
        {toursLoading ? (
          <Text className="text-ink-soft">Loading…</Text>
        ) : tours.length === 0 ? (
          <EmptyState
            icon="map-outline"
            title="No tours yet"
            description="Tap 'Create a tour' above to publish your first tour."
          />
        ) : (
          tours.map((t) => (
            <Pressable
              key={t.id}
              className="mb-2"
              onPress={() =>
                t.is_published
                  ? router.push(`/tours/${t.id}`)
                  : router.push(`/operator/tours/create?id=${t.id}` as Href)
              }
            >
              <Card className="flex-row items-center p-3">
                <Image
                  source={{ uri: t.images?.[0] ?? FALLBACK_IMAGE }}
                  style={{ width: 56, height: 56, borderRadius: 10 }}
                />
                <View className="ml-3 flex-1">
                  <Text className="font-semibold text-ink" numberOfLines={1}>
                    {t.title || 'Untitled tour'}
                  </Text>
                  <Text className="text-xs text-ink-soft">
                    {t.currency} {Number(t.price).toLocaleString()}
                    {t.rating ? ` · ${Number(t.rating).toFixed(1)}★` : ''}
                  </Text>
                </View>
                <Badge
                  label={t.is_published ? (t.status ?? 'live') : 'draft'}
                  tone={t.is_published ? 'success' : 'neutral'}
                />
              </Card>
            </Pressable>
          ))
        )}

        <View className="mb-3 mt-7 flex-row items-center justify-between">
          <Text className="text-lg font-bold text-ink">Recent bookings</Text>
          {bookings.length > 0 ? (
            <Pressable onPress={() => router.push('/operator/bookings')}>
              <Text className="text-sm font-semibold text-primary-700">See all</Text>
            </Pressable>
          ) : null}
        </View>
        {bookingsLoading ? (
          <Text className="text-ink-soft">Loading…</Text>
        ) : bookings.length === 0 ? (
          <EmptyState
            icon="briefcase-outline"
            title="No bookings yet"
            description="Bookings for your tours will appear here."
          />
        ) : (
          bookings.slice(0, 8).map((b: OperatorBooking) => (
            <Card key={b.id} className="mb-2 flex-row items-center p-4">
              <View className="flex-1">
                <Text className="font-semibold text-ink" numberOfLines={1}>
                  {b.tour?.title ?? 'Tour booking'}
                </Text>
                <Text className="text-xs text-ink-soft">
                  {b.booking_date
                    ? new Date(b.booking_date).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })
                    : '—'}{' '}
                  · {b.pax_count ?? 1} pax
                </Text>
              </View>
              <View className="items-end">
                <Text className="font-bold text-primary-700">
                  {b.tour?.currency ?? 'PKR'} {Number(b.total_price).toLocaleString()}
                </Text>
                <View className="mt-1">
                  <Badge label={b.status ?? 'pending'} tone={bookingTone(b.status)} />
                </View>
              </View>
            </Card>
          ))
        )}
        </ScrollView>

        {/* Frosted header — content scrolls beneath the glass */}
        <GlassBar style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}>
          <AppHeader
            showBack
            title="Operator dashboard"
            subtitle="Your tours & bookings"
            right={
              <Pressable
                onPress={openDrawer}
                hitSlop={8}
                className="h-9 w-9 items-center justify-center rounded-full bg-surface-sunken"
              >
                <Menu size={20} color={c.ink} />
              </Pressable>
            }
          />
        </GlassBar>
      </View>
    </Screen>
  )
}
