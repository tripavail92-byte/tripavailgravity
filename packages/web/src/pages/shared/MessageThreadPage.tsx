import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Link, useParams } from 'react-router-dom'
import { format, formatDistanceToNow } from 'date-fns'
import {
  Archive,
  Bell,
  BellOff,
  CornerUpLeft,
  Loader2,
  MoreHorizontal,
  Pencil,
  Send,
  ShieldAlert,
  SmilePlus,
  Trash2,
} from 'lucide-react'

import { PageHeader } from '@/components/ui/PageHeader'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { GlassCard } from '@/components/ui/glass'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/hooks/useAuth'
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription'
import { queryClient } from '@/lib/queryClient'
import { cn } from '@/lib/utils'
import {
  messagingKeys,
  useBookingConversationMessages,
  useBookingConversations,
  useEditBookingMessage,
  useEscalateConversationSupport,
  useMarkConversationRead,
  useReportConversationMessage,
  useSendBookingMessage,
  useToggleMessageReaction,
  useUnsendBookingMessage,
  useUpdateConversationPreferences,
} from '@/queries/messagingQueries'
import type {
  BookingConversationMessage,
  BookingConversationSummary,
} from '@/features/messaging/services/bookingMessengerService'

const QUICK_REACTIONS = ['👍', '❤️', '🙏', '😄']

export default function MessageThreadPage() {
  const { user } = useAuth()
  const { conversationId } = useParams<{ conversationId: string }>()
  const [composerValue, setComposerValue] = useState('')
  const [replyToMessage, setReplyToMessage] = useState<BookingConversationMessage | null>(null)
  const [editingMessage, setEditingMessage] = useState<BookingConversationMessage | null>(null)
  const [reportTarget, setReportTarget] = useState<BookingConversationMessage | null | undefined>(undefined)
  const [reportReason, setReportReason] = useState('')
  const [reportDetails, setReportDetails] = useState('')
  const [showEscalationDialog, setShowEscalationDialog] = useState(false)
  const [escalationReason, setEscalationReason] = useState('')

  const conversationsQuery = useBookingConversations({ includeArchived: true, limit: 200 })
  const messagesQuery = useBookingConversationMessages(conversationId)

  const sendMessage = useSendBookingMessage({
    onSuccess: () => {
      setComposerValue('')
      setReplyToMessage(null)
    },
    onError: (error) => {
      toast.error(error.message || 'Message could not be sent')
    },
  })
  const markRead = useMarkConversationRead()
  const updatePreferences = useUpdateConversationPreferences({
    onSuccess: (data) => {
      toast.success(data.isArchived ? 'Conversation archived' : 'Conversation updated')
    },
    onError: (error) => toast.error(error.message || 'Conversation preference update failed'),
  })
  const editMessage = useEditBookingMessage({
    onSuccess: () => {
      toast.success('Message updated')
      setComposerValue('')
      setEditingMessage(null)
    },
    onError: (error) => toast.error(error.message || 'Message could not be edited'),
  })
  const unsendMessage = useUnsendBookingMessage({
    onSuccess: () => toast.success('Message unsent'),
    onError: (error) => toast.error(error.message || 'Message could not be unsent'),
  })
  const toggleReaction = useToggleMessageReaction({
    onError: (error) => toast.error(error.message || 'Reaction update failed'),
  })
  const reportMessage = useReportConversationMessage({
    onSuccess: () => {
      toast.success('Conversation report submitted')
      setReportTarget(null)
      setReportReason('')
      setReportDetails('')
    },
    onError: (error) => toast.error(error.message || 'Report could not be submitted'),
  })
  const escalateSupport = useEscalateConversationSupport({
    onSuccess: () => {
      toast.success('Support escalation sent')
      setShowEscalationDialog(false)
      setEscalationReason('')
    },
    onError: (error) => toast.error(error.message || 'Support escalation failed'),
  })

  const conversation = useMemo(
    () => (conversationsQuery.data ?? []).find((item) => item.conversation_id === conversationId),
    [conversationId, conversationsQuery.data],
  )

  const messages = useMemo(() => {
    return [...(messagesQuery.data ?? [])].reverse()
  }, [messagesQuery.data])

  const messagesById = useMemo(() => {
    return new Map(messages.map((message) => [message.message_id, message]))
  }, [messages])

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
    const lastMessage = messages[messages.length - 1]

    if (!conversationId || !lastMessage || lastMessage.sender_id === user?.id || markRead.isPending) {
      return
    }

    markRead.mutate({
      conversationId,
      throughMessageId: lastMessage.message_id,
    })
  }, [conversationId, markRead, messages, user?.id])

  const handleSubmit = async () => {
    if (!conversationId || !composerValue.trim()) {
      return
    }

    if (editingMessage) {
      editMessage.mutate({
        messageId: editingMessage.message_id,
        body: composerValue.trim(),
      })
      return
    }

    sendMessage.mutate({
      conversationId,
      body: composerValue.trim(),
      replyToMessageId: replyToMessage?.message_id ?? null,
    })
  }

  const counterpartName = getCounterpartName(conversation, user?.id)

  return (
    <div className="min-h-screen bg-background pb-16">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          title={counterpartName || 'Conversation'}
          subtitle={conversation ? `${conversation.booking_label} · ${conversation.subject || 'Reservation thread'}` : 'Reservation thread'}
          backPath="/messages"
          actions={
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-2xl border-border/60 bg-background/80"
                onClick={() => setShowEscalationDialog(true)}
                disabled={!conversationId || escalateSupport.isPending}
              >
                <ShieldAlert className="mr-2 h-4 w-4" />
                Escalate support
              </Button>
              <Button asChild variant="outline" className="rounded-2xl border-border/60 bg-background/80">
                <Link to="/messages">Inbox</Link>
              </Button>
            </div>
          }
        />

        {!conversationId ? (
          <GlassCard variant="card" className="rounded-3xl border border-border/60 p-10 text-center">
            <p className="text-sm text-muted-foreground">Select a conversation from your inbox.</p>
          </GlassCard>
        ) : messagesQuery.isLoading || conversationsQuery.isLoading ? (
          <GlassCard variant="card" className="rounded-3xl border border-border/60 p-10 text-center">
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
            <p className="mt-4 text-sm text-muted-foreground">Loading the booking thread.</p>
          </GlassCard>
        ) : messagesQuery.isError ? (
          <GlassCard variant="card" className="rounded-3xl border border-border/60 p-10 text-center">
            <h2 className="text-lg font-semibold text-foreground">Thread unavailable</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {messagesQuery.error.message || 'The conversation could not be loaded.'}
            </p>
          </GlassCard>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <GlassCard variant="card" className="rounded-3xl border border-border/60 p-0 overflow-hidden">
              <ThreadToolbar
                conversation={conversation}
                onToggleArchived={() => {
                  if (!conversationId || !conversation) return
                  updatePreferences.mutate({
                    conversationId,
                    isArchived: !conversation.is_archived,
                  })
                }}
                onToggleMuted={() => {
                  if (!conversationId || !conversation) return
                  updatePreferences.mutate({
                    conversationId,
                    isMuted: !conversation.is_muted,
                  })
                }}
                onReportConversation={() => setReportTarget(null)}
              />

              <Separator />

              <div className="max-h-[62vh] space-y-4 overflow-y-auto px-4 py-5 sm:px-6">
                {messages.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-border/60 bg-muted/30 px-6 py-10 text-center">
                    <p className="text-sm text-muted-foreground">
                      No messages yet. Start the booking thread with arrival details, timing updates, or support needs.
                    </p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <MessageBubble
                      key={message.message_id}
                      message={message}
                      currentUserId={user?.id}
                      summary={conversation}
                      replyToMessage={message.reply_to_message_id ? messagesById.get(message.reply_to_message_id) : undefined}
                      onReply={() => {
                        setEditingMessage(null)
                        setReplyToMessage(message)
                      }}
                      onEdit={() => {
                        setReplyToMessage(null)
                        setEditingMessage(message)
                        setComposerValue(message.body || '')
                      }}
                      onUnsend={() => unsendMessage.mutate({ messageId: message.message_id })}
                      onReaction={(emoji) => toggleReaction.mutate({ messageId: message.message_id, emoji })}
                      onReport={() => {
                        setReportTarget(message)
                        setReportReason('')
                        setReportDetails('')
                      }}
                    />
                  ))
                )}
              </div>

              <Separator />

              <div className="space-y-4 p-4 sm:p-6">
                {replyToMessage ? (
                  <ComposerNotice
                    label="Replying to"
                    value={previewBody(replyToMessage)}
                    onClear={() => setReplyToMessage(null)}
                  />
                ) : null}
                {editingMessage ? (
                  <ComposerNotice
                    label="Editing message"
                    value={previewBody(editingMessage)}
                    onClear={() => {
                      setEditingMessage(null)
                      setComposerValue('')
                    }}
                  />
                ) : null}

                <div className="rounded-3xl border border-border/60 bg-background/90 p-3">
                  <Textarea
                    value={composerValue}
                    onChange={(event) => setComposerValue(event.target.value)}
                    placeholder="Share arrival details, pickup notes, or booking questions"
                    className="min-h-[120px] border-0 bg-transparent px-1 py-1 shadow-none focus-visible:ring-0"
                  />
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <p className="text-xs text-muted-foreground">
                      Edit window: 15 minutes. Unsend window: 24 hours.
                    </p>
                    <Button
                      type="button"
                      className="rounded-2xl"
                      onClick={handleSubmit}
                      disabled={sendMessage.isPending || editMessage.isPending || !composerValue.trim()}
                    >
                      <Send className="mr-2 h-4 w-4" />
                      {editingMessage ? 'Save edit' : 'Send'}
                    </Button>
                  </div>
                </div>
              </div>
            </GlassCard>

            <GlassCard variant="card" className="rounded-3xl border border-border/60 p-5">
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14 rounded-2xl">
                  <AvatarFallback className="rounded-2xl bg-primary/10 text-lg font-black text-primary">
                    {initials(counterpartName || 'TripAvail')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-lg font-semibold text-foreground">{counterpartName || 'TripAvail'}</p>
                  <p className="text-sm text-muted-foreground">
                    {conversation?.booking_label || 'Booking thread'}
                  </p>
                </div>
              </div>

              <Separator className="my-5" />

              <div className="space-y-4 text-sm">
                <MetaRow label="Booking scope" value={conversation?.booking_scope?.replace('_', ' ') || 'Unknown'} />
                <MetaRow label="Last activity" value={conversation?.last_message_at ? formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: true }) : 'No messages yet'} />
                <MetaRow label="Unread" value={String(conversation?.unread_count ?? 0)} />
                <MetaRow label="Participant mode" value={conversation?.participant_role?.replace('_', ' ') || 'Unknown'} />
              </div>

              <Separator className="my-5" />

              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Thread controls
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start rounded-2xl border-border/60 bg-background/80"
                  onClick={() => {
                    if (!conversationId || !conversation) return
                    updatePreferences.mutate({
                      conversationId,
                      isMuted: !conversation.is_muted,
                    })
                  }}
                >
                  {conversation?.is_muted ? <Bell className="mr-2 h-4 w-4" /> : <BellOff className="mr-2 h-4 w-4" />}
                  {conversation?.is_muted ? 'Turn notifications back on' : 'Mute notifications'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start rounded-2xl border-border/60 bg-background/80"
                  onClick={() => {
                    if (!conversationId || !conversation) return
                    updatePreferences.mutate({
                      conversationId,
                      isArchived: !conversation.is_archived,
                    })
                  }}
                >
                  <Archive className="mr-2 h-4 w-4" />
                  {conversation?.is_archived ? 'Move back to inbox' : 'Archive conversation'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start rounded-2xl border-border/60 bg-background/80"
                  onClick={() => {
                    setReportTarget(null)
                    setReportReason('')
                    setReportDetails('')
                  }}
                >
                  <ShieldAlert className="mr-2 h-4 w-4" />
                  Report this thread
                </Button>
              </div>
            </GlassCard>
          </div>
        )}
      </div>

      <Dialog open={reportTarget !== undefined} onOpenChange={(open) => {
        if (!open) {
          setReportTarget(undefined)
          setReportReason('')
          setReportDetails('')
        }
      }}>
        <DialogContent className="rounded-3xl border-border/60 bg-background/95 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Report message</DialogTitle>
            <DialogDescription>
              Send this booking thread to support review with the specific issue and any context moderators should see.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Input
              value={reportReason}
              onChange={(event) => setReportReason(event.target.value)}
              placeholder="Reason, for example harassment or unsafe request"
              className="rounded-2xl border-border/60 bg-background/80"
            />
            <Textarea
              value={reportDetails}
              onChange={(event) => setReportDetails(event.target.value)}
              placeholder="Add supporting detail for the moderation team"
              className="min-h-[120px] rounded-2xl border-border/60 bg-background/80"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" className="rounded-2xl" onClick={() => setReportTarget(undefined)}>
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-2xl"
              disabled={!conversationId || !reportReason.trim() || reportMessage.isPending}
              onClick={() => {
                if (!conversationId) return
                reportMessage.mutate({
                  conversationId,
                  messageId: reportTarget?.message_id ?? null,
                  reason: reportReason.trim(),
                  details: reportDetails.trim() || null,
                })
              }}
            >
              Submit report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEscalationDialog} onOpenChange={setShowEscalationDialog}>
        <DialogContent className="rounded-3xl border-border/60 bg-background/95 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Escalate to TripAvail support</DialogTitle>
            <DialogDescription>
              Bring support into the booking thread for payment disputes, safety concerns, or coordination issues that need intervention.
            </DialogDescription>
          </DialogHeader>

          <Textarea
            value={escalationReason}
            onChange={(event) => setEscalationReason(event.target.value)}
            placeholder="Summarize what support should step in on"
            className="min-h-[140px] rounded-2xl border-border/60 bg-background/80"
          />

          <DialogFooter>
            <Button type="button" variant="outline" className="rounded-2xl" onClick={() => setShowEscalationDialog(false)}>
              Keep thread private
            </Button>
            <Button
              type="button"
              className="rounded-2xl"
              disabled={!conversationId || !escalationReason.trim() || escalateSupport.isPending}
              onClick={() => {
                if (!conversationId) return
                escalateSupport.mutate({
                  conversationId,
                  reason: escalationReason.trim(),
                })
              }}
            >
              Invite support
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ThreadToolbar({
  conversation,
  onToggleArchived,
  onToggleMuted,
  onReportConversation,
}: {
  conversation?: BookingConversationSummary
  onToggleArchived: () => void
  onToggleMuted: () => void
  onReportConversation: () => void
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="rounded-full px-3 py-1 text-xs capitalize">
          {conversation?.booking_scope?.replace('_', ' ') || 'Conversation'}
        </Badge>
        {conversation?.is_muted ? (
          <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">Muted</Badge>
        ) : null}
        {conversation?.is_archived ? (
          <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">Archived</Badge>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" className="rounded-2xl border-border/60 bg-background/80" onClick={onToggleMuted}>
          {conversation?.is_muted ? <Bell className="mr-2 h-4 w-4" /> : <BellOff className="mr-2 h-4 w-4" />}
          {conversation?.is_muted ? 'Unmute' : 'Mute'}
        </Button>
        <Button type="button" variant="outline" className="rounded-2xl border-border/60 bg-background/80" onClick={onToggleArchived}>
          <Archive className="mr-2 h-4 w-4" />
          {conversation?.is_archived ? 'Unarchive' : 'Archive'}
        </Button>
        <Button type="button" variant="outline" className="rounded-2xl border-border/60 bg-background/80" onClick={onReportConversation}>
          <ShieldAlert className="mr-2 h-4 w-4" />
          Report
        </Button>
      </div>
    </div>
  )
}

function MessageBubble({
  message,
  currentUserId,
  summary,
  replyToMessage,
  onReply,
  onEdit,
  onUnsend,
  onReaction,
  onReport,
}: {
  message: BookingConversationMessage
  currentUserId?: string
  summary?: BookingConversationSummary
  replyToMessage?: BookingConversationMessage
  onReply: () => void
  onEdit: () => void
  onUnsend: () => void
  onReaction: (emoji: string) => void
  onReport: () => void
}) {
  const isOwnMessage = message.sender_id === currentUserId
  const reactions = aggregateReactions(message)

  return (
    <div className={cn('flex', isOwnMessage ? 'justify-end' : 'justify-start')}>
      <div className={cn('max-w-[85%] sm:max-w-[72%]', isOwnMessage ? 'items-end' : 'items-start')}>
        <div className={cn('mb-1 flex items-center gap-2 text-xs text-muted-foreground', isOwnMessage ? 'justify-end' : 'justify-start')}>
          <span>{senderName(message, summary, currentUserId)}</span>
          <span>{format(new Date(message.created_at), 'MMM d, h:mm a')}</span>
          {message.edited_at ? <span>edited</span> : null}
        </div>

        <div
          className={cn(
            'rounded-3xl border px-4 py-3 shadow-sm',
            isOwnMessage
              ? 'border-primary/30 bg-primary text-primary-foreground'
              : 'border-border/60 bg-background',
            message.unsent_at ? 'italic opacity-80' : '',
          )}
        >
          {replyToMessage ? (
            <div className={cn('mb-3 rounded-2xl px-3 py-2 text-xs', isOwnMessage ? 'bg-primary-foreground/15' : 'bg-muted/60')}>
              <p className="font-semibold">Replying to {senderName(replyToMessage, summary, currentUserId)}</p>
              <p className="mt-1 line-clamp-2">{previewBody(replyToMessage)}</p>
            </div>
          ) : null}

          <p className="whitespace-pre-wrap text-sm leading-6">{previewBody(message)}</p>
        </div>

        <div className={cn('mt-2 flex flex-wrap items-center gap-2', isOwnMessage ? 'justify-end' : 'justify-start')}>
          {reactions.map((reaction) => (
            <button
              key={reaction.emoji}
              type="button"
              className="rounded-full border border-border/60 bg-background px-2.5 py-1 text-xs text-foreground transition-colors hover:bg-muted"
              onClick={() => onReaction(reaction.emoji)}
            >
              {reaction.emoji} {reaction.count}
            </button>
          ))}

          {QUICK_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className="rounded-full border border-border/60 bg-background px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => onReaction(emoji)}
            >
              {emoji}
            </button>
          ))}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isOwnMessage ? 'end' : 'start'}>
              <DropdownMenuItem onClick={onReply}>
                <CornerUpLeft className="h-4 w-4" />
                Reply
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onReaction('👍')}>
                <SmilePlus className="h-4 w-4" />
                Add reaction
              </DropdownMenuItem>
              {isOwnMessage ? (
                <DropdownMenuItem onClick={onEdit} disabled={Boolean(message.unsent_at)}>
                  <Pencil className="h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              ) : null}
              {isOwnMessage ? (
                <DropdownMenuItem onClick={onUnsend} disabled={Boolean(message.unsent_at)}>
                  <Trash2 className="h-4 w-4" />
                  Unsend
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuItem onClick={onReport}>
                <ShieldAlert className="h-4 w-4" />
                Report
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  )
}

function ComposerNotice({ label, value, onClear }: { label: string; value: string; onClear: () => void }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl border border-border/60 bg-muted/40 px-4 py-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
        <p className="mt-1 text-sm text-foreground">{value}</p>
      </div>
      <Button type="button" variant="ghost" className="rounded-full" onClick={onClear}>
        Clear
      </Button>
    </div>
  )
}

function aggregateReactions(message: BookingConversationMessage) {
  const counts = new Map<string, number>()

  for (const reaction of message.reactions) {
    const emoji = String(reaction.emoji || '')
    if (!emoji) continue
    counts.set(emoji, (counts.get(emoji) ?? 0) + 1)
  }

  return Array.from(counts.entries()).map(([emoji, count]) => ({ emoji, count }))
}

function senderName(
  message: BookingConversationMessage,
  summary: BookingConversationSummary | undefined,
  currentUserId?: string,
) {
  if (message.sender_id === currentUserId) {
    return 'You'
  }

  if (message.sender_role === 'traveler') {
    return summary?.traveler_name || 'Traveler'
  }

  if (message.sender_role === 'support') {
    return 'TripAvail support'
  }

  return summary?.partner_name || 'Partner'
}

function getCounterpartName(summary: BookingConversationSummary | undefined, currentUserId?: string) {
  if (!summary) {
    return ''
  }

  if (summary.participant_role === 'traveler') {
    return summary.partner_name
  }

  if (!currentUserId) {
    return summary.traveler_name
  }

  return summary.traveler_name
}

function previewBody(message: BookingConversationMessage) {
  return message.body || `[${message.message_kind.replace('_', ' ')}]`
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'TA'
}