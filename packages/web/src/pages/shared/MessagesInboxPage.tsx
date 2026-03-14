import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { Archive, BellOff, Inbox, Loader2, MessageSquare, Search } from 'lucide-react'

import { PageHeader } from '@/components/ui/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/glass'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { useAuth } from '@/hooks/useAuth'
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription'
import { cn } from '@/lib/utils'
import {
  useBookingConversations,
  useEnsureBookingConversation,
  messagingKeys,
} from '@/queries/messagingQueries'
import { queryClient } from '@/lib/queryClient'
import type { BookingConversationScope, BookingConversationSummary } from '@/features/messaging/services/bookingMessengerService'

const VALID_SCOPES: BookingConversationScope[] = ['tour_booking', 'package_booking']

export default function MessagesInboxPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [searchTerm, setSearchTerm] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const deferredSearchTerm = useDeferredValue(searchTerm)
  const scope = searchParams.get('scope')
  const bookingId = searchParams.get('bookingId')

  const conversationsQuery = useBookingConversations({
    includeArchived: showArchived,
    limit: 100,
  })

  const ensureConversation = useEnsureBookingConversation({
    onSuccess: ({ conversationId }) => {
      navigate(`/messages/${conversationId}`, { replace: true })
    },
    onError: (error) => {
      toast.error(error.message || 'Unable to open that booking conversation')
    },
  })

  useEffect(() => {
    if (!scope || !bookingId || ensureConversation.isPending) {
      return
    }

    if (!VALID_SCOPES.includes(scope as BookingConversationScope)) {
      return
    }

    ensureConversation.mutate({
      scope: scope as BookingConversationScope,
      bookingId,
    })
  }, [bookingId, ensureConversation, scope])

  useRealtimeSubscription<{ user_id: string }>({
    table: 'booking_conversation_participants',
    filter: user?.id ? `user_id=eq.${user.id}` : undefined,
    onData: () => {
      queryClient.invalidateQueries({ queryKey: messagingKeys.all })
    },
  })

  const filteredConversations = useMemo(() => {
    const needle = deferredSearchTerm.trim().toLowerCase()

    if (!needle) {
      return conversationsQuery.data ?? []
    }

    return (conversationsQuery.data ?? []).filter((conversation) => {
      return [
        conversation.subject,
        conversation.booking_label,
        conversation.traveler_name,
        conversation.partner_name,
        conversation.last_message_preview,
      ]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(needle))
    })
  }, [conversationsQuery.data, deferredSearchTerm])

  const isRedirecting = Boolean(scope && bookingId && ensureConversation.isPending)

  return (
    <div className="min-h-screen bg-background pb-16">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          title="Messages"
          subtitle="Reservation-scoped inbox with unread state, archive and mute controls, and direct booking context for every conversation."
          showBackButton={false}
          actions={
            <Button asChild variant="outline" className="rounded-2xl border-border/60 bg-background/80">
              <Link to="/help">Help hub</Link>
            </Button>
          }
        />

        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <GlassCard variant="card" className="rounded-3xl border border-border/60 p-5">
            <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background/80 px-3 py-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search bookings, people, or recent messages"
                className="border-0 bg-transparent px-0 py-0 shadow-none focus-visible:ring-0"
              />
            </div>

            <div className="mt-4 flex items-center justify-between rounded-2xl bg-muted/50 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Show archived</p>
                <p className="text-xs text-muted-foreground">Keep active threads front and center.</p>
              </div>
              <Switch checked={showArchived} onCheckedChange={setShowArchived} />
            </div>

            <Separator className="my-5" />

            <div className="space-y-3">
              <SummaryTile
                icon={MessageSquare}
                label="Active threads"
                value={String((conversationsQuery.data ?? []).filter((item) => !item.is_archived).length)}
              />
              <SummaryTile
                icon={Inbox}
                label="Unread"
                value={String((conversationsQuery.data ?? []).reduce((sum, item) => sum + item.unread_count, 0))}
              />
              <SummaryTile
                icon={BellOff}
                label="Muted"
                value={String((conversationsQuery.data ?? []).filter((item) => item.is_muted).length)}
              />
              <SummaryTile
                icon={Archive}
                label="Archived"
                value={String((conversationsQuery.data ?? []).filter((item) => item.is_archived).length)}
              />
            </div>
          </GlassCard>

          <GlassCard variant="card" className="rounded-3xl border border-border/60 p-0 overflow-hidden">
            {conversationsQuery.isLoading || isRedirecting ? (
              <div className="flex min-h-[540px] flex-col items-center justify-center gap-4 text-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <div>
                  <p className="text-base font-semibold text-foreground">
                    {isRedirecting ? 'Opening your booking thread' : 'Loading inbox'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {isRedirecting
                      ? 'We are finding the reservation thread and syncing the latest state.'
                      : 'Pulling conversation state, unread counts, and booking context.'}
                  </p>
                </div>
              </div>
            ) : conversationsQuery.isError ? (
              <div className="flex min-h-[540px] flex-col items-center justify-center px-6 text-center">
                <h2 className="text-lg font-semibold text-foreground">Inbox unavailable</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {conversationsQuery.error.message || 'We could not load your conversations.'}
                </p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex min-h-[540px] flex-col items-center justify-center px-6 text-center">
                <div className="rounded-full bg-primary/10 p-4 text-primary">
                  <Inbox className="h-8 w-8" />
                </div>
                <h2 className="mt-4 text-lg font-semibold text-foreground">No conversations yet</h2>
                <p className="mt-2 max-w-md text-sm text-muted-foreground">
                  Booking conversations appear automatically once a traveler or partner opens the reservation thread.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {filteredConversations.map((conversation) => (
                  <button
                    key={conversation.conversation_id}
                    type="button"
                    onClick={() => navigate(`/messages/${conversation.conversation_id}`)}
                    className="w-full px-5 py-4 text-left transition-colors hover:bg-muted/30"
                  >
                    <ConversationRow conversation={conversation} />
                  </button>
                ))}
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  )
}

function SummaryTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Inbox
  label: string
  value: string
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-border/50 bg-background/70 px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-primary/10 p-2 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-sm font-medium text-foreground">{label}</span>
      </div>
      <span className="text-lg font-black text-foreground">{value}</span>
    </div>
  )
}

function ConversationRow({ conversation }: { conversation: BookingConversationSummary }) {
  const counterpartName = conversation.participant_role === 'traveler'
    ? conversation.partner_name
    : conversation.traveler_name

  return (
    <div className="flex items-start gap-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-sm font-black text-primary">
        {initials(counterpartName)}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{counterpartName}</p>
            <p className="truncate text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {conversation.booking_label}
            </p>
          </div>
          <span className="shrink-0 text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(conversation.last_message_at || conversation.updated_at), {
              addSuffix: true,
            })}
          </span>
        </div>

        <p className="mt-2 truncate text-sm text-muted-foreground">
          {conversation.last_message_preview || 'Conversation ready to start'}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {conversation.unread_count > 0 ? (
            <Badge className="rounded-full bg-primary px-2.5 py-1 text-[11px] font-bold text-primary-foreground">
              {conversation.unread_count} unread
            </Badge>
          ) : null}
          {conversation.is_muted ? (
            <Badge variant="outline" className="rounded-full px-2.5 py-1 text-[11px]">
              Muted
            </Badge>
          ) : null}
          {conversation.is_archived ? (
            <Badge variant="outline" className="rounded-full px-2.5 py-1 text-[11px]">
              Archived
            </Badge>
          ) : null}
          <Badge
            variant="outline"
            className={cn(
              'rounded-full px-2.5 py-1 text-[11px] capitalize',
              conversation.participant_role === 'traveler' ? 'text-info' : 'text-success',
            )}
          >
            {conversation.participant_role.replace('_', ' ')}
          </Badge>
        </div>
      </div>
    </div>
  )
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'TA'
}