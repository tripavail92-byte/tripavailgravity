import { useQuery, useQueryClient } from '@tanstack/react-query'
import { type Href, router, useLocalSearchParams } from 'expo-router'
import { ActivityIndicator, Alert, Image, ScrollView, Text, View } from 'react-native'

import { AppHeader, Badge, Button, Card, EmptyState, Screen } from '@/components/ui'
import { requestBookingCancellation } from '@/lib/booking'
import { useRoleTheme } from '@/theme'
import { getOrCreateConversation } from '@/lib/messaging'
import { supabase } from '@/lib/supabase'

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1488085061387-422e29b40080?auto=format&fit=crop&w=800&q=80'

interface BookingDetail {
  id: string
  status: string | null
  booking_date: string | null
  created_at: string | null
  total_price: number
  tour: { title: string; currency: string; images: string[] } | null
}

async function fetchBooking(id: string): Promise<BookingDetail> {
  const { data, error } = await supabase
    .from('tour_bookings')
    .select('id,status,booking_date,created_at,total_price,tour:tours(title,currency,images)')
    .eq('id', id)
    .single()
  if (error) throw error
  const row = data as any
  return {
    id: row.id,
    status: row.status,
    booking_date: row.booking_date,
    created_at: row.created_at,
    total_price: row.total_price,
    tour: Array.isArray(row.tour) ? (row.tour[0] ?? null) : row.tour,
  }
}

function statusTone(status: string): 'success' | 'warning' | 'danger' | 'neutral' {
  if (status === 'confirmed') return 'success'
  if (status === 'pending') return 'warning'
  if (status === 'cancelled') return 'danger'
  return 'neutral'
}

function DetailRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View className={`flex-row items-center justify-between py-3 ${last ? '' : 'border-b border-line'}`}>
      <Text className="text-sm text-ink-muted">{label}</Text>
      <Text className="text-sm font-semibold text-ink">{value}</Text>
    </View>
  )
}

export default function BookingDetailScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>()
  const qc = useQueryClient()
  const theme = useRoleTheme()

  const { data: booking, isLoading, error } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => fetchBooking(bookingId),
    enabled: !!bookingId,
  })

  if (isLoading) {
    return (
      <Screen>
        <AppHeader showBack title="Booking" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </Screen>
    )
  }

  if (error || !booking) {
    return (
      <Screen>
        <AppHeader showBack title="Booking" />
        <EmptyState
          icon="alert-circle-outline"
          title="Booking not found"
          description="We couldn't load this booking. It may have been removed."
        >
          <Button label="Go back" onPress={() => router.back()} />
        </EmptyState>
      </Screen>
    )
  }

  const status = booking.status ?? 'pending'
  const dateStr = booking.booking_date
    ? new Date(booking.booking_date).toLocaleDateString('en-PK', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '—'
  const currency = booking.tour?.currency ?? 'PKR'

  return (
    <Screen>
      <AppHeader showBack title="Booking details" />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 32 }}>
        <Card className="overflow-hidden">
          <Image
            source={{ uri: booking.tour?.images?.[0] ?? FALLBACK_IMAGE }}
            style={{ height: 180 }}
            className="w-full"
            resizeMode="cover"
          />
          <View className="p-4">
            <View className="flex-row items-start justify-between gap-3">
              <Text className="flex-1 text-lg font-bold text-ink" numberOfLines={2}>
                {booking.tour?.title ?? 'Tour booking'}
              </Text>
              <Badge label={status} tone={statusTone(status)} />
            </View>
          </View>
        </Card>

        <Card className="mt-4 px-4 py-1">
          <DetailRow label="Date" value={dateStr} />
          <DetailRow
            label="Amount paid"
            value={`${currency} ${Number(booking.total_price).toLocaleString()}`}
          />
          <DetailRow label="Reference" value={booking.id.slice(0, 8).toUpperCase()} last />
        </Card>

        <View className="mt-6 gap-3">
          {status === 'completed' ? (
            <Button label="Leave a review" onPress={() => router.push(`/review/${booking.id}` as Href)} />
          ) : null}
          <Button
            label="Message operator"
            variant="secondary"
            onPress={async () => {
              try {
                const { conversationId } = await getOrCreateConversation('tour_booking', booking.id)
                router.push(`/messages/${conversationId}`)
              } catch {
                Alert.alert('Could not open chat', 'Please try again in a moment.')
              }
            }}
          />
          {status !== 'cancelled' && status !== 'completed' ? (
            <Button
              label="Request cancellation"
              variant="ghost"
              onPress={() =>
                Alert.alert('Request cancellation?', 'The operator will review your request.', [
                  { text: 'Keep booking', style: 'cancel' },
                  {
                    text: 'Request',
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        await requestBookingCancellation(booking.id)
                        qc.invalidateQueries({ queryKey: ['booking', bookingId] })
                        Alert.alert('Request sent', 'Your cancellation request was submitted.')
                      } catch (e: any) {
                        Alert.alert('Could not cancel', e?.message ?? 'Please try again.')
                      }
                    },
                  },
                ])
              }
            />
          ) : null}
        </View>
      </ScrollView>
    </Screen>
  )
}
