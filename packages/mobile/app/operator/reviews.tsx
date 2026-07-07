import { useQuery, useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { useState } from 'react'
import { Alert, FlatList, Text, TextInput, View } from 'react-native'

import { Star } from '@/components/icons/lucide'
import { AppHeader, Button, Card, EmptyState, Screen } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { fetchOperatorReviews, type OperatorReview, submitReviewReply } from '@/lib/operator'

function StarsRow({ rating }: { rating: number }) {
  return (
    <View className="flex-row">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={14} color="#f59e0b" fill={i <= Math.round(rating) ? '#f59e0b' : 'transparent'} />
      ))}
    </View>
  )
}

function ReplyBox({ reviewId, operatorId, onReplied }: { reviewId: string; operatorId: string; onReplied: () => void }) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const submit = async () => {
    if (!text.trim() || sending) return
    setSending(true)
    try {
      await submitReviewReply(reviewId, text, operatorId)
      setText('')
      onReplied()
    } catch (e: any) {
      Alert.alert('Could not reply', e?.message ?? 'Please try again.')
    } finally {
      setSending(false)
    }
  }
  return (
    <View className="mt-3 flex-row items-end gap-2">
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="Write a reply…"
        placeholderTextColor="#94a3b8"
        multiline
        className="max-h-20 flex-1 rounded-2xl border border-line bg-surface-sunken px-3 py-2 text-sm text-ink"
      />
      <Button label={sending ? '…' : 'Reply'} variant="secondary" fullWidth={false} onPress={submit} />
    </View>
  )
}

export default function OperatorReviews() {
  const { user } = useAuth()
  const qc = useQueryClient()

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['operator', 'reviews', user?.id],
    queryFn: () => fetchOperatorReviews(user!.id),
    enabled: !!user,
  })

  if (!user) {
    return (
      <Screen>
        <AppHeader showBack title="Reviews" />
        <EmptyState icon="person-circle-outline" title="Sign in" description="Sign in to view your reviews.">
          <Button label="Sign In" onPress={() => router.push('/(auth)/login')} />
        </EmptyState>
      </Screen>
    )
  }

  const refresh = () => qc.invalidateQueries({ queryKey: ['operator', 'reviews', user.id] })

  return (
    <Screen>
      <AppHeader showBack title="Reviews & replies" />
      <FlatList
        data={reviews}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          isLoading ? (
            <Text className="mt-12 text-center text-ink-soft">Loading…</Text>
          ) : (
            <EmptyState
              icon="sparkles-outline"
              title="No reviews yet"
              description="Reviews from travellers on your tours will appear here."
            />
          )
        }
        renderItem={({ item }: { item: OperatorReview }) => (
          <Card className="mb-3 p-4">
            <View className="flex-row items-center justify-between">
              <StarsRow rating={item.rating} />
              <Text className="text-xs text-ink-soft">
                {item.created_at
                  ? new Date(item.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })
                  : ''}
              </Text>
            </View>
            {item.tour?.title ? (
              <Text className="mt-1 text-xs font-semibold text-ink-soft">{item.tour.title}</Text>
            ) : null}
            {item.title ? <Text className="mt-2 text-sm font-bold text-ink">{item.title}</Text> : null}
            {item.body ? <Text className="mt-1 text-sm leading-5 text-ink-muted">{item.body}</Text> : null}

            {item.reply ? (
              <View className="mt-3 rounded-2xl bg-surface-sunken p-3">
                <Text className="text-xs font-semibold text-primary-700">Your reply</Text>
                <Text className="mt-1 text-sm leading-5 text-ink-muted">{item.reply.body}</Text>
              </View>
            ) : (
              <ReplyBox reviewId={item.id} operatorId={user.id} onReplied={refresh} />
            )}
          </Card>
        )}
      />
    </Screen>
  )
}
