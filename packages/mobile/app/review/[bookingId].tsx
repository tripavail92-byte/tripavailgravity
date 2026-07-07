import { useQuery } from '@tanstack/react-query'
import { router, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native'

import { Star } from '@/components/icons/lucide'
import { AppHeader, Button, Card, Screen } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { useRoleTheme } from '@/theme'
import { fetchBookingForReview, getTravelerReviewForBooking, submitTourReview } from '@/lib/reviews'

function StarsRow({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <View className="flex-row">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={size} color="#f59e0b" fill={i <= Math.round(rating) ? '#f59e0b' : 'transparent'} />
      ))}
    </View>
  )
}

export default function ReviewScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>()
  const { user } = useAuth()
  const theme = useRoleTheme()
  const [rating, setRating] = useState(5)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { data: booking, isLoading } = useQuery({
    queryKey: ['review', 'booking', bookingId],
    queryFn: () => fetchBookingForReview(bookingId),
    enabled: !!bookingId,
  })
  const { data: existing } = useQuery({
    queryKey: ['review', 'existing', bookingId],
    queryFn: () => getTravelerReviewForBooking(bookingId),
    enabled: !!bookingId,
  })

  if (isLoading || !booking) {
    return (
      <Screen>
        <AppHeader showBack title="Review" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </Screen>
    )
  }

  if (existing) {
    return (
      <Screen>
        <AppHeader showBack title="Your review" />
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <Card className="p-4">
            <StarsRow rating={existing.rating} size={18} />
            {existing.title ? <Text className="mt-2 font-bold text-ink">{existing.title}</Text> : null}
            {existing.body ? (
              <Text className="mt-1 text-sm leading-5 text-ink-muted">{existing.body}</Text>
            ) : null}
          </Card>
          <Text className="mt-4 text-center text-xs text-ink-soft">You've already reviewed this trip.</Text>
        </ScrollView>
      </Screen>
    )
  }

  const submit = async () => {
    if (!user) {
      router.push('/(auth)/login')
      return
    }
    setSubmitting(true)
    try {
      await submitTourReview({
        bookingId,
        tourId: booking.tour_id,
        travelerId: user.id,
        rating,
        title,
        body,
      })
      Alert.alert('Thank you!', 'Your review has been posted.', [
        { text: 'Done', onPress: () => router.back() },
      ])
    } catch (e: any) {
      Alert.alert('Could not post review', e?.message ?? 'Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Screen>
      <AppHeader showBack title="Leave a review" />
      <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
        <Text className="text-base font-bold text-ink">{booking.tourTitle ?? 'Your trip'}</Text>
        <Text className="mb-5 mt-1 text-sm text-ink-muted">How was your experience?</Text>

        <View className="flex-row gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Pressable key={i} onPress={() => setRating(i)} hitSlop={4}>
              <Star size={38} color="#f59e0b" fill={i <= rating ? '#f59e0b' : 'transparent'} />
            </Pressable>
          ))}
        </View>

        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Title (optional)"
          placeholderTextColor="#94a3b8"
          maxLength={120}
          className="mt-6 rounded-2xl border border-line bg-surface px-4 py-3 text-base text-ink"
        />
        <TextInput
          value={body}
          onChangeText={setBody}
          placeholder="Tell other travellers about your experience…"
          placeholderTextColor="#94a3b8"
          multiline
          maxLength={2000}
          style={{ textAlignVertical: 'top' }}
          className="mt-3 h-36 rounded-2xl border border-line bg-surface px-4 py-3 text-base text-ink"
        />

        <View className="mt-6">
          <Button label="Post review" loading={submitting} onPress={submit} />
        </View>
      </ScrollView>
    </Screen>
  )
}
