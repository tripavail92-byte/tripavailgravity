import { useQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
import { FlatList, Pressable, Text, View } from 'react-native'

import { AppHeader, Avatar, Button, EmptyState, Screen } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { timeAgo } from '@/lib/format'
import { type ConversationSummary, listConversations } from '@/lib/messaging'

function partnerName(c: ConversationSummary): string {
  const name = c.participant_role === 'traveler' ? c.partner_name : c.traveler_name
  return name || c.booking_label || 'Conversation'
}

export default function MessagesInbox() {
  const { user } = useAuth()
  const { data: convos = [], isLoading } = useQuery({
    queryKey: ['messaging', 'conversations'],
    queryFn: () => listConversations(),
    enabled: !!user,
    staleTime: 15 * 1000,
  })

  if (!user) {
    return (
      <Screen>
        <AppHeader showBack title="Messages" />
        <EmptyState
          icon="person-circle-outline"
          title="Sign in to message"
          description="Chat with operators about your bookings."
        >
          <Button label="Sign In" onPress={() => router.push('/(auth)/login')} />
        </EmptyState>
      </Screen>
    )
  }

  return (
    <Screen>
      <AppHeader showBack title="Messages" />
      <FlatList
        data={convos}
        keyExtractor={(c) => c.conversation_id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          isLoading ? (
            <Text className="mt-12 text-center text-ink-soft">Loading…</Text>
          ) : (
            <EmptyState
              icon="sparkles-outline"
              title="No messages yet"
              description="Conversations about your bookings will appear here."
            />
          )
        }
        renderItem={({ item }) => {
          const name = partnerName(item)
          return (
            <Pressable
              className="flex-row items-center rounded-2xl px-2 py-3"
              onPress={() => router.push(`/messages/${item.conversation_id}`)}
            >
              <Avatar name={name} size={48} />
              <View className="ml-3 flex-1">
                <View className="flex-row items-center justify-between">
                  <Text className="flex-1 font-bold text-ink" numberOfLines={1}>
                    {name}
                  </Text>
                  {item.last_message_at ? (
                    <Text className="ml-2 text-xs text-ink-soft">{timeAgo(item.last_message_at)}</Text>
                  ) : null}
                </View>
                {item.booking_label ? (
                  <Text className="text-xs text-ink-soft" numberOfLines={1}>
                    {item.booking_label}
                  </Text>
                ) : null}
                <View className="mt-0.5 flex-row items-center">
                  <Text
                    className={`flex-1 text-sm ${
                      item.unread_count > 0 ? 'font-semibold text-ink' : 'text-ink-muted'
                    }`}
                    numberOfLines={1}
                  >
                    {item.last_message_preview ?? 'No messages yet'}
                  </Text>
                  {item.unread_count > 0 ? (
                    <View className="ml-2 h-5 min-w-[20px] items-center justify-center rounded-full bg-primary-700 px-1.5">
                      <Text className="text-[11px] font-bold text-white">{item.unread_count}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </Pressable>
          )
        }}
      />
    </Screen>
  )
}
