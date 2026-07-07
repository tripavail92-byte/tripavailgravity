import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import { FlatList, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Send } from '@/components/icons/lucide'
import { AppHeader, Screen } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { getMessages, markConversationRead, sendMessage } from '@/lib/messaging'
import { supabase } from '@/lib/supabase'

export default function MessageThread() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>()
  const { user } = useAuth()
  const qc = useQueryClient()
  const insets = useSafeAreaInsets()
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const key = ['messaging', 'messages', conversationId] as const

  const { data: messages = [] } = useQuery({
    queryKey: key,
    queryFn: () => getMessages(conversationId),
    enabled: !!conversationId,
    staleTime: 10 * 1000,
  })

  // Realtime: refetch on any new/edited message in this conversation.
  useEffect(() => {
    if (!conversationId) return
    const ch = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'booking_conversation_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => qc.invalidateQueries({ queryKey: key }),
      )
      .subscribe()
    return () => {
      supabase.removeChannel(ch)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId])

  // Mark read whenever the message set changes.
  useEffect(() => {
    if (conversationId && messages.length) {
      markConversationRead(conversationId)
        .then(() => qc.invalidateQueries({ queryKey: ['messaging', 'conversations'] }))
        .catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, messages.length])

  const ordered = [...messages].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )

  const onSend = async () => {
    const body = text.trim()
    if (!body || sending) return
    setSending(true)
    setText('')
    try {
      await sendMessage(conversationId, body)
      await qc.invalidateQueries({ queryKey: key })
      qc.invalidateQueries({ queryKey: ['messaging', 'conversations'] })
    } catch {
      setText(body)
    } finally {
      setSending(false)
    }
  }

  return (
    <Screen>
      <AppHeader showBack title="Conversation" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 44 : 0}
      >
        <FlatList
          data={ordered}
          inverted
          keyExtractor={(m) => m.message_id}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="mt-20 items-center">
              <Text className="text-sm text-ink-soft">No messages yet. Say hello 👋</Text>
            </View>
          }
          renderItem={({ item }) => {
            const mine = item.sender_id === user?.id
            const unsent = !!item.unsent_at
            return (
              <View className={`mb-2 max-w-[80%] ${mine ? 'self-end' : 'self-start'}`}>
                <View
                  className={`rounded-2xl px-3.5 py-2.5 ${
                    mine ? 'bg-primary-700' : 'border border-line bg-surface'
                  }`}
                >
                  <Text
                    className={`text-sm ${mine ? 'text-white' : 'text-ink'} ${
                      unsent ? 'italic opacity-60' : ''
                    }`}
                  >
                    {unsent ? 'This message was unsent' : item.body}
                  </Text>
                </View>
                <Text className={`mt-0.5 text-[10px] text-ink-soft ${mine ? 'text-right' : ''}`}>
                  {new Date(item.created_at).toLocaleTimeString('en-PK', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            )
          }}
        />
        <View
          className="flex-row items-end gap-2 border-t border-line bg-surface px-4 pt-2.5"
          style={{ paddingBottom: insets.bottom + 8 }}
        >
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Message…"
            placeholderTextColor="#94a3b8"
            multiline
            className="max-h-24 flex-1 rounded-2xl bg-surface-sunken px-4 py-2.5 text-base text-ink"
          />
          <Pressable
            onPress={onSend}
            disabled={!text.trim() || sending}
            className={`h-10 w-10 items-center justify-center rounded-full ${
              text.trim() ? 'bg-primary-700' : 'bg-surface-sunken'
            }`}
          >
            <Send size={18} color={text.trim() ? '#ffffff' : '#94a3b8'} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  )
}
