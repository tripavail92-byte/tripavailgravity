import { formatDistanceToNow } from 'date-fns'
import { Loader2, Lock, MessageSquare, Send } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/glass'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/hooks/useAuth'
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription'
import { queryClient } from '@/lib/queryClient'
import { cn } from '@/lib/utils'
import type { BookingConversationScope } from '@/features/messaging/services/bookingMessengerService'
import {
  messagingKeys,
  useBookingConversationMessages,
  useBookingConversations,
  useEnsureBookingConversation,
  useMarkConversationRead,
  useSendBookingMessage,
} from '@/queries/messagingQueries'

interface BookingConversationPanelProps {
  bookingId: string
  scope: BookingConversationScope
  counterpartLabel: string
  bookingLabel: string
  allowMessaging: boolean
  lockedReason?: string
}

export function BookingConversationPanel({
  bookingId,
  scope,
  counterpartLabel,
  bookingLabel,
  allowMessaging,
  lockedReason,
}: BookingConversationPanelProps) {
  const { user } = useAuth()
  const [conversationId, setConversationId] = useState<string | undefined>(undefined)
  const [composerValue, setComposerValue] = useState('')

  const conversationsQuery = useBookingConversations({ limit: 200 })

  const conversation = useMemo(
    () =>
      (conversationsQuery.data ?? []).find(
        (item) => item.booking_id === bookingId && item.booking_scope === scope,
      ),
    [bookingId, conversationsQuery.data, scope],
  )

  useEffect(() => {
    if (conversation?.conversation_id) {
      setConversationId(conversation.conversation_id)
    }
  }, [conversation?.conversation_id])

  const ensureConversation = useEnsureBookingConversation({
    onSuccess: ({ conversationId: ensuredConversationId }) => {
      setConversationId(ensuredConversationId)
    },
    onError: (error) => {
      toast.error(error.message || 'Unable to open the secure booking thread')
    },
  })

  const messagesQuery = useBookingConversationMessages(conversationId)
  const sendMessage = useSendBookingMessage({
    onSuccess: () => {
      setComposerValue('')
    },
    onError: (error) => {
      toast.error(error.message || 'Message could not be sent')
    },
  })
  const markRead = useMarkConversationRead()

  const invalidateMessaging = useCallback(() => {
    if (!conversationId) {
      return
    }

    queryClient.invalidateQueries({ queryKey: messagingKeys.messages(conversationId) })
    queryClient.invalidateQueries({ queryKey: messagingKeys.all })
  }, [conversationId])

  useRealtimeSubscription<{ conversation_id: string }>({
    table: 'booking_conversation_messages',
    filter: conversationId ? `conversation_id=eq.${conversationId}` : undefined,
    onData: invalidateMessaging,
  })

  useRealtimeSubscription<{ user_id: string }>({
    table: 'booking_conversation_participants',
    filter: user?.id ? `user_id=eq.${user.id}` : undefined,
    onData: invalidateMessaging,
  })

  useEffect(() => {
    if (
      !allowMessaging ||
      !user?.id ||
      conversationId ||
      conversationsQuery.isLoading ||
      ensureConversation.isPending
    ) {
      return
    }

    if (conversation?.conversation_id) {
      return
    }

    ensureConversation.mutate({ scope, bookingId })
  }, [
    allowMessaging,
    bookingId,
    conversation?.conversation_id,
    conversationId,
    conversationsQuery.isLoading,
    ensureConversation,
    scope,
    user?.id,
  ])

  const messages = useMemo(() => [...(messagesQuery.data ?? [])].reverse(), [messagesQuery.data])

  useEffect(() => {
    const lastMessage = messages[messages.length - 1]

    if (!conversationId || !lastMessage || lastMessage.sender_id === user?.id || markRead.isPending) {
      return
    }

    markRead.mutate({
      conversationId,
      throughMessageId: lastMessage.message_id,
    })
  }, [conversationId, markRead, messages, user?.id])

  const handleSend = () => {
    if (!conversationId || !composerValue.trim()) {
      return
    }

    sendMessage.mutate({
      conversationId,
      body: composerValue.trim(),
    })
  }

  if (!allowMessaging) {
    return (
      <GlassCard variant="card" className="rounded-3xl border border-border/60 p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <Lock className="h-5 w-5" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">Messaging unlocks after booking confirmation</h3>
            <p className="text-sm text-muted-foreground">
              {lockedReason || 'This reservation thread opens once payment is confirmed so only real booked trips create operator workload.'}
            </p>
          </div>
        </div>
      </GlassCard>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
      <GlassCard variant="card" className="rounded-3xl border border-border/60 p-0 overflow-hidden">
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Secure booking thread
            </p>
            <h3 className="mt-1 text-lg font-semibold text-foreground">Talk to your {counterpartLabel}</h3>
          </div>
          <Button asChild variant="outline" className="rounded-2xl border-border/60 bg-background/80">
            <Link to={conversationId ? `/messages/${conversationId}` : `/messages?scope=${scope}&bookingId=${bookingId}`}>
              Open full thread
            </Link>
          </Button>
        </div>

        <div className="max-h-[56vh] space-y-4 overflow-y-auto px-4 py-5 sm:px-5">
          {ensureConversation.isPending || (conversationsQuery.isLoading && !conversationId) || messagesQuery.isLoading ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="mt-3 text-sm text-muted-foreground">Loading your secure booking thread.</p>
            </div>
          ) : messagesQuery.isError ? (
            <div className="rounded-3xl border border-destructive/20 bg-destructive/5 px-5 py-6 text-sm text-destructive">
              {messagesQuery.error.message || 'This conversation could not be loaded.'}
            </div>
          ) : messages.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border/60 bg-muted/20 px-6 py-10 text-center">
              <MessageSquare className="mx-auto h-10 w-10 text-primary/70" />
              <p className="mt-4 text-sm text-muted-foreground">
                Start the conversation with pickup details, timing questions, or anything the operator should know for this booking.
              </p>
            </div>
          ) : (
            messages.map((message) => {
              const isCurrentUser = message.sender_id === user?.id

              return (
                <div
                  key={message.message_id}
                  className={cn('flex', isCurrentUser ? 'justify-end' : 'justify-start')}
                >
                  <div
                    className={cn(
                      'max-w-[85%] rounded-3xl px-4 py-3 shadow-sm',
                      isCurrentUser
                        ? 'bg-primary text-primary-foreground'
                        : 'border border-border/60 bg-background text-foreground',
                    )}
                  >
                    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] opacity-80">
                      <span>{isCurrentUser ? 'You' : counterpartLabel}</span>
                      <span>•</span>
                      <span>
                        {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
                      {message.unsent_at ? 'This message was removed.' : message.body || 'Sent a message'}
                    </p>
                  </div>
                </div>
              )
            })
          )}
        </div>

        <div className="border-t border-border/60 p-4 sm:p-5">
          <div className="rounded-3xl border border-border/60 bg-background/90 p-3">
            <Textarea
              value={composerValue}
              onChange={(event) => setComposerValue(event.target.value)}
              placeholder={`Message your ${counterpartLabel} about this booking`}
              className="min-h-[120px] border-0 bg-transparent px-1 py-1 shadow-none focus-visible:ring-0"
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                Reservation-only messaging. Contact details stay protected inside the thread.
              </p>
              <Button
                type="button"
                className="rounded-2xl"
                onClick={handleSend}
                disabled={!conversationId || sendMessage.isPending || !composerValue.trim()}
              >
                <Send className="mr-2 h-4 w-4" />
                Send
              </Button>
            </div>
          </div>
        </div>
      </GlassCard>

      <GlassCard variant="card" className="rounded-3xl border border-border/60 p-5">
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Messaging policy
            </p>
            <h3 className="mt-1 text-lg font-semibold text-foreground">Enterprise reservation rules</h3>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="rounded-full border-border/60 bg-background/70 px-3 py-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Booking scoped
            </Badge>
            <Badge variant="outline" className="rounded-full border-border/60 bg-background/70 px-3 py-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">
              No pre-booking chat
            </Badge>
          </div>

          <div className="space-y-3 text-sm text-muted-foreground">
            <p>This thread belongs only to this reservation and is the source of truth for operator communication.</p>
            <p>Use it for pickup timing, itinerary coordination, change requests, and support-ready evidence if something goes wrong.</p>
            <p>{bookingLabel}</p>
          </div>
        </div>
      </GlassCard>
    </div>
  )
}