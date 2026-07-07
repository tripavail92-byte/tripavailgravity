import { useQuery } from '@tanstack/react-query'
import { type Href, router } from 'expo-router'
import { Image, Pressable, ScrollView, Text, View } from 'react-native'

import { CalendarDays, CircleAlert, Clock, MapPin, Users } from '@/components/icons/lucide'
import { AppHeader, Badge, Button, Card, EmptyState, Screen, Skeleton } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { useRoleTheme, useThemeColors } from '@/theme'
import {
  fetchOperatorCalendar,
  groupSchedulesByDay,
  type OperatorSchedule,
} from '@/lib/operatorCalendar'

function formatDay(key: string): string {
  const d = new Date(`${key}T12:00:00`)
  const today = new Date()
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  if (sameDay(d, today)) return 'Today'
  if (sameDay(d, tomorrow)) return 'Tomorrow'
  return d.toLocaleDateString('en-PK', { weekday: 'long', day: 'numeric', month: 'short' })
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-PK', { hour: 'numeric', minute: '2-digit' })
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <View className="min-w-[150px] flex-1 rounded-2xl border border-line bg-surface p-4">
      <Text className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{label}</Text>
      <Text className="mt-2 text-xl font-black text-ink">{value}</Text>
    </View>
  )
}

function DepartureCard({ schedule }: { schedule: OperatorSchedule }) {
  const theme = useRoleTheme()
  const c = useThemeColors()
  const seatsLeft = Math.max(0, schedule.capacity - schedule.booked_count)
  const fillRatio = schedule.capacity > 0 ? schedule.booked_count / schedule.capacity : 0
  const destination = [schedule.tour.city, schedule.tour.country].filter(Boolean).join(', ')

  return (
    <Pressable className="mb-2" onPress={() => router.push(`/tours/${schedule.tour.id}` as Href)}>
      <Card className="p-4">
        <View className="flex-row items-center">
          {schedule.tour.image ? (
            <Image source={{ uri: schedule.tour.image }} style={{ width: 48, height: 48, borderRadius: 12 }} />
          ) : (
            <View className="h-12 w-12 items-center justify-center rounded-xl bg-primary-100">
              <CalendarDays size={20} color={theme.primary} />
            </View>
          )}
          <View className="ml-3 flex-1">
            <Text className="font-semibold text-ink" numberOfLines={1}>
              {schedule.tour.title}
            </Text>
            <View className="mt-0.5 flex-row items-center">
              <Clock size={11} color={c.inkSoft} />
              <Text className="ml-1 text-xs text-ink-soft">{formatTime(schedule.start_time)}</Text>
              {destination ? (
                <>
                  <MapPin size={11} color={c.inkSoft} style={{ marginLeft: 8 }} />
                  <Text className="ml-1 flex-1 text-xs text-ink-soft" numberOfLines={1}>
                    {destination}
                  </Text>
                </>
              ) : null}
            </View>
          </View>
          <Badge
            label={seatsLeft === 0 ? 'Sold out' : `${seatsLeft} left`}
            tone={seatsLeft === 0 ? 'danger' : seatsLeft <= 3 ? 'warning' : 'success'}
          />
        </View>
        <View className="mt-3 flex-row items-center">
          <Users size={13} color={c.inkMuted} />
          <Text className="ml-1.5 text-xs font-semibold text-ink-muted">
            {schedule.booked_count} / {schedule.capacity} seats sold
          </Text>
        </View>
        <View className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-sunken">
          <View
            className="h-full rounded-full bg-primary-700"
            style={{ width: `${Math.min(100, Math.round(fillRatio * 100))}%` }}
          />
        </View>
      </Card>
    </Pressable>
  )
}

export default function OperatorCalendarScreen() {
  const { user } = useAuth()

  const { data, isLoading } = useQuery({
    queryKey: ['operator', 'calendar', user?.id],
    queryFn: () => fetchOperatorCalendar(user!.id),
    enabled: !!user,
  })

  if (!user) {
    return (
      <Screen>
        <AppHeader showBack title="Calendar" />
        <EmptyState icon="person-circle-outline" title="Sign in" description="Sign in to see your departures.">
          <Button label="Sign In" onPress={() => router.push('/(auth)/login')} />
        </EmptyState>
      </Screen>
    )
  }

  const summary = data?.summary
  const sections = data ? groupSchedulesByDay(data.schedules) : []

  return (
    <Screen>
      <AppHeader showBack title="Calendar & availability" subtitle="Departures and seat pressure" />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View>
            <View className="flex-row gap-3">
              <View className="flex-1"><Skeleton height={84} radius={16} /></View>
              <View className="flex-1"><Skeleton height={84} radius={16} /></View>
            </View>
            <View className="mt-4"><Skeleton height={110} radius={16} /></View>
            <View className="mt-2"><Skeleton height={110} radius={16} /></View>
          </View>
        ) : (
          <>
            {summary?.bookingsPaused ? (
              <Card className="mb-4 border-2 border-warning p-4">
                <View className="flex-row items-start">
                  <View className="h-10 w-10 items-center justify-center rounded-2xl bg-warning-bg">
                    <CircleAlert size={18} color="#d97706" />
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="font-bold text-ink">Bookings are paused</Text>
                    <Text className="mt-0.5 text-xs leading-5 text-ink-muted">
                      Travellers can browse your tours but can't book until you resume in Settings.
                    </Text>
                    <Pressable onPress={() => router.push('/operator/settings' as Href)}>
                      <Text className="mt-1 text-xs font-bold text-warning">Open settings →</Text>
                    </Pressable>
                  </View>
                </View>
              </Card>
            ) : null}

            <View className="flex-row flex-wrap gap-3">
              <StatTile label="Upcoming" value={String(summary?.upcomingDepartures ?? 0)} />
              <StatTile label="Seats sold" value={String(summary?.seatsSold ?? 0)} />
              <StatTile label="Occupancy" value={`${summary?.occupancyRate ?? 0}%`} />
              <StatTile label="Active days" value={String(summary?.activeDays ?? 0)} />
            </View>

            {sections.length === 0 ? (
              <View className="mt-8">
                <EmptyState
                  icon="calendar-outline"
                  title="No upcoming departures"
                  description="Publish a tour with scheduled dates and they'll show up here."
                >
                  <Button label="Create a tour" onPress={() => router.push('/operator/tours/create' as Href)} />
                </EmptyState>
              </View>
            ) : (
              sections.map((section) => (
                <View key={section.day}>
                  <Text className="mb-2 mt-6 text-base font-bold text-ink">{formatDay(section.day)}</Text>
                  {section.items.map((s) => (
                    <DepartureCard key={s.id} schedule={s} />
                  ))}
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>
    </Screen>
  )
}
