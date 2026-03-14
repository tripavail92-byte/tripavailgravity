import { format } from 'date-fns'
import {
  Calendar,
  CreditCard,
  Loader2,
  MapPin,
  MessageSquare,
  Receipt,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'

import { BookingConversationPanel } from '@/components/messaging/BookingConversationPanel'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/glass'
import { PageHeader } from '@/components/ui/PageHeader'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { bookingService } from '@/features/booking/services/bookingService'
import { tourService } from '@/features/tour-operator/services/tourService'
import { useAuth } from '@/hooks/useAuth'
import type { BookingConversationScope } from '@/features/messaging/services/bookingMessengerService'

const BOOKING_TABS = ['overview', 'messages'] as const

type BookingTab = (typeof BOOKING_TABS)[number]

export default function TravelerBookingDetailPage() {
  const { bookingId } = useParams<{ bookingId: string }>()
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [booking, setBooking] = useState<any | null>(null)
  const [schedule, setSchedule] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const activeTab = (searchParams.get('tab') as BookingTab) || 'overview'
  const safeActiveTab = BOOKING_TABS.includes(activeTab) ? activeTab : 'overview'

  useEffect(() => {
    const loadBooking = async () => {
      if (!user?.id || !bookingId) {
        return
      }

      try {
        setLoading(true)
        const loadedBooking = await bookingService.getTravelerBookingById(user.id, bookingId)

        if (!loadedBooking) {
          setBooking(null)
          setError('Booking not found')
          return
        }

        setBooking(loadedBooking)
        setError(null)

        if (loadedBooking.tours?.id && loadedBooking.schedule_id) {
          const schedules = await tourService.getTourSchedules(loadedBooking.tours.id)
          setSchedule(schedules.find((item) => item.id === loadedBooking.schedule_id) || null)
        } else {
          setSchedule(null)
        }
      } catch (loadError) {
        console.error('Failed to load traveller booking details:', loadError)
        setError(loadError instanceof Error ? loadError.message : 'Unable to load this booking')
      } finally {
        setLoading(false)
      }
    }

    loadBooking()
  }, [bookingId, user?.id])

  const scope = useMemo<BookingConversationScope | null>(() => {
    if (!booking) return null
    return booking.tours ? 'tour_booking' : 'package_booking'
  }, [booking])

  const details = booking?.tours || booking?.packages || null
  const imageSrc = booking?.tours
    ? booking.tours.images?.[0]
    : booking?.packages?.cover_image || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1'
  const locationLabel = details?.location?.city || details?.location || 'Location confirmed after booking'
  const dateLabel = booking?.check_in_date || schedule?.start_time || booking?.booking_date || null
  const totalGuests = booking?.pax_count ?? booking?.guest_count ?? 0
  const totalPaid = Number(booking?.total_price || 0)
  const counterpartLabel = scope === 'tour_booking' ? 'tour operator' : 'host'
  const bookingLabel = details?.title || details?.name || 'Booked reservation'
  const messagingUnlocked = Boolean(booking && booking.status !== 'pending' && booking.status !== 'expired')

  const setTab = (value: string) => {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('tab', value)
    setSearchParams(nextParams, { replace: true })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">Loading your booking workspace.</p>
        </div>
      </div>
    )
  }

  if (!booking || error) {
    return (
      <div className="min-h-screen bg-muted/30 px-4 py-10">
        <div className="mx-auto max-w-5xl">
          <PageHeader title="Booking" subtitle="Traveller reservation workspace" backPath="/trips" />
          <GlassCard variant="card" className="rounded-3xl border border-border/60 p-10 text-center">
            <h2 className="text-xl font-semibold text-foreground">Booking unavailable</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              {error || 'We could not find that reservation in your account.'}
            </p>
            <Button asChild className="mt-6 rounded-2xl">
              <Link to="/trips">Back to My Trips</Link>
            </Button>
          </GlassCard>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30 pb-16">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          title={bookingLabel}
          subtitle="Reservation workspace with secure operator messaging for this booked trip."
          backPath="/trips"
          actions={
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" className="rounded-2xl border-border/60 bg-background/80">
                <Link to="/trips">All bookings</Link>
              </Button>
              <Button
                type="button"
                className="rounded-2xl"
                onClick={() => setTab('messages')}
                disabled={!messagingUnlocked}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Message {scope === 'tour_booking' ? 'operator' : 'host'}
              </Button>
            </div>
          }
        />

        <GlassCard variant="card" className="overflow-hidden rounded-[32px] border border-border/60 p-0 shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[340px_minmax(0,1fr)]">
            <div className="relative min-h-[260px] overflow-hidden bg-muted">
              <img src={imageSrc} alt={bookingLabel} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
              <div className="absolute left-5 top-5">
                <Badge className="rounded-full border-0 bg-background/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-foreground shadow-sm">
                  {booking.status}
                </Badge>
              </div>
              <div className="absolute bottom-5 left-5 right-5 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
                  Confirmation
                </p>
                <p className="mt-2 text-2xl font-black">#{booking.id.slice(0, 8).toUpperCase()}</p>
              </div>
            </div>

            <div className="p-6 md:p-8">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <SummaryTile
                  icon={Calendar}
                  label={scope === 'tour_booking' ? 'Departure' : 'Arrival'}
                  value={dateLabel ? format(new Date(dateLabel), 'EEE, MMM d, yyyy') : 'TBA'}
                />
                <SummaryTile icon={MapPin} label="Location" value={locationLabel} />
                <SummaryTile icon={Users} label="Guests" value={String(totalGuests)} />
                <SummaryTile icon={CreditCard} label="Paid" value={`PKR ${totalPaid.toLocaleString()}`} />
              </div>

              <div className="mt-6 rounded-3xl border border-border/60 bg-background/80 p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Messaging access
                    </p>
                    <h2 className="mt-1 text-xl font-semibold text-foreground">
                      {messagingUnlocked
                        ? `You can message your ${counterpartLabel}`
                        : 'Messaging unlocks after payment clears'}
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                      TripAvail keeps traveler and partner communication inside this booked reservation so itinerary changes, pickup notes, and support evidence stay attached to the booking.
                    </p>
                  </div>
                  <Badge variant="outline" className="w-fit rounded-full border-border/60 bg-background/70 px-3 py-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Post-booking only
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>

        <Tabs value={safeActiveTab} onValueChange={setTab} className="mt-8">
          <TabsList className="mb-6 h-auto rounded-2xl bg-muted/60 p-1">
            <TabsTrigger value="overview" className="rounded-2xl px-5">
              Overview
            </TabsTrigger>
            <TabsTrigger value="messages" className="rounded-2xl px-5">
              Messages
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
              <GlassCard variant="card" className="rounded-3xl border border-border/60 p-6">
                <div className="space-y-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Reservation summary
                    </p>
                    <h3 className="mt-1 text-lg font-semibold text-foreground">What this booking covers</h3>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <InfoRow label="Reservation type" value={scope === 'tour_booking' ? 'Tour booking' : 'Package booking'} />
                    <InfoRow label="Booking status" value={booking.status} />
                    <InfoRow label="Booked on" value={format(new Date(booking.booking_date), 'MMM d, yyyy')} />
                    <InfoRow label="Payment status" value={booking.payment_status || 'paid'} />
                    <InfoRow label="Guests" value={String(totalGuests)} />
                    <InfoRow label="Total" value={`PKR ${totalPaid.toLocaleString()}`} />
                    {schedule?.start_time ? (
                      <InfoRow label="Start time" value={format(new Date(schedule.start_time), 'MMM d, yyyy h:mm a')} />
                    ) : null}
                    {schedule?.end_time ? (
                      <InfoRow label="End time" value={format(new Date(schedule.end_time), 'MMM d, yyyy h:mm a')} />
                    ) : null}
                    {booking.check_in_date ? (
                      <InfoRow label="Check-in" value={format(new Date(booking.check_in_date), 'MMM d, yyyy')} />
                    ) : null}
                    {booking.check_out_date ? (
                      <InfoRow label="Check-out" value={format(new Date(booking.check_out_date), 'MMM d, yyyy')} />
                    ) : null}
                  </div>
                </div>
              </GlassCard>

              <GlassCard variant="card" className="rounded-3xl border border-border/60 p-6">
                <div className="space-y-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Secure operations
                    </p>
                    <h3 className="mt-1 text-lg font-semibold text-foreground">Use the booking thread for changes</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Keep pickup notes, itinerary clarifications, and dispute-ready communication inside the reservation thread so support can inspect the full history if needed.
                  </p>
                  <Button
                    type="button"
                    className="w-full rounded-2xl"
                    onClick={() => setTab('messages')}
                    disabled={!messagingUnlocked}
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Open Messages
                  </Button>
                </div>
              </GlassCard>
            </div>
          </TabsContent>

          <TabsContent value="messages" className="space-y-6">
            {scope ? (
              <BookingConversationPanel
                bookingId={booking.id}
                scope={scope}
                counterpartLabel={counterpartLabel}
                bookingLabel={bookingLabel}
                allowMessaging={messagingUnlocked}
                lockedReason="This thread is reserved for confirmed reservations so operators only receive messages tied to paid bookings."
              />
            ) : null}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function SummaryTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Calendar
  label: string
  value: string
}) {
  return (
    <div className="rounded-3xl border border-border/60 bg-muted/30 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-background text-primary shadow-sm">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
          <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/80 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm font-semibold capitalize text-foreground">{value}</p>
    </div>
  )
}