import { router } from 'expo-router'
import { FlatList, Pressable, Text, View } from 'react-native'

import { AppHeader, Button, Card, EmptyState, Screen } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { useNotifications } from '@/hooks/useNotifications'
import type { AppNotification } from '@/lib/notifications'

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime()
  const mins = Math.floor((Date.now() - then) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })
}

function navigate(n: AppNotification) {
  const meta = n.metadata ?? {}
  if (meta.booking_id) router.push(`/trips/${meta.booking_id}`)
  // messaging deep-link wired once Messaging ships
}

export default function NotificationsScreen() {
  const { user } = useAuth()
  const { notifications, unread, markAll } = useNotifications()

  if (!user) {
    return (
      <Screen>
        <AppHeader showBack title="Notifications" />
        <EmptyState
          icon="person-circle-outline"
          title="Sign in for updates"
          description="Booking confirmations, messages and replies show up here."
        >
          <Button label="Sign In" onPress={() => router.push('/(auth)/login')} />
        </EmptyState>
      </Screen>
    )
  }

  return (
    <Screen>
      <AppHeader
        showBack
        title="Notifications"
        right={
          unread > 0 ? (
            <Pressable onPress={markAll} hitSlop={8}>
              <Text className="text-sm font-semibold text-primary-700">Mark all read</Text>
            </Pressable>
          ) : undefined
        }
      />
      <FlatList
        data={notifications}
        keyExtractor={(n) => n.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="sparkles-outline"
            title="You're all caught up"
            description="New booking and message updates will appear here."
          />
        }
        renderItem={({ item }) => (
          <Pressable className="mb-2" onPress={() => navigate(item)}>
            <Card className="flex-row items-start p-4" flat={item.read}>
              <View
                className={`mr-3 mt-1.5 h-2 w-2 rounded-full ${item.read ? 'bg-transparent' : 'bg-primary-700'}`}
              />
              <View className="flex-1">
                <Text className="text-sm font-bold text-ink">{item.title}</Text>
                {item.body ? (
                  <Text className="mt-0.5 text-sm leading-5 text-ink-muted">{item.body}</Text>
                ) : null}
                <Text className="mt-1 text-xs text-ink-soft">{timeAgo(item.created_at)}</Text>
              </View>
            </Card>
          </Pressable>
        )}
      />
    </Screen>
  )
}
