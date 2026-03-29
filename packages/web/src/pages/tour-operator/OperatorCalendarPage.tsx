import { format } from 'date-fns'
import {
  AlertTriangle,
  CalendarDays,
  Clock3,
  Compass,
  MapPin,
  Plus,
  Users,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { GlassCard } from '@/components/ui/glass'
import { PageHeader } from '@/components/ui/PageHeader'
import { useAuth } from '@/hooks/useAuth'
import { operatorPortalService, type OperatorScheduleRecord } from '@/features/tour-operator/services/operatorPortalService'

function formatDestination(schedule: OperatorScheduleRecord) {
  const city = schedule.tours.location?.city
  const country = schedule.tours.location?.country
  return [city, country].filter(Boolean).join(', ') || 'Destination TBD'
}

export default function OperatorCalendarPage() {
  const { user } = useAuth()
  const [schedules, setSchedules] = useState<OperatorScheduleRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [bookingsPaused, setBookingsPaused] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [summary, setSummary] = useState({
    totalDepartures: 0,
    upcomingDepartures: 0,
    seatsSold: 0,
    totalCapacity: 0,
    occupancyRate: 0,
    activeDays: 0,
    bookingsPaused: false,
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-role', 'tour_operator')
    return () => document.documentElement.removeAttribute('data-role')
  }, [])

  useEffect(() => {
    const load = async () => {
      if (!user?.id) return

      try {
        setLoading(true)
        const response = await operatorPortalService.getCalendarData(user.id)
        setSchedules(response.schedules)
        setSummary(response.summary)
        setBookingsPaused(response.summary.bookingsPaused)
        setError(null)
      } catch (loadError) {
        console.error('Failed to load operator calendar:', loadError)
        setError(loadError instanceof Error ? loadError.message : 'Failed to load calendar')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [user?.id])

  const departureDays = useMemo(
    () => schedules.map((schedule) => new Date(schedule.start_time)),
    [schedules],
  )

  const selectedKey = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null
  const daySchedules = useMemo(() => {
    if (!selectedKey) return []
    return schedules.filter((schedule) => format(new Date(schedule.start_time), 'yyyy-MM-dd') === selectedKey)
  }, [schedules, selectedKey])

  const nextSchedules = useMemo(
    () => schedules.filter((schedule) => new Date(schedule.end_time) >= new Date()).slice(0, 8),
    [schedules],
  )

  return (
    <div className="min-h-screen relative overflow-hidden bg-background pb-16">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-primary/20 blur-[120px] opacity-60" />
        <div className="absolute bottom-0 right-0 w-[520px] h-[520px] rounded-full bg-emerald-500/10 blur-[110px] opacity-60" />
      </div>
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          title="Calendar & Availability"
          subtitle="Airbnb-style departure planning with booking pressure and seat visibility across your upcoming tours."
          showBackButton={false}
          actions={
            <Button asChild className="rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90">
              <Link to="/operator/tours/new?returnTo=%2Foperator%2Fcalendar">
                <Plus className="mr-2 h-4 w-4" />
                Add Departure
              </Link>
            </Button>
          }
        />

        {bookingsPaused && (
          <GlassCard variant="card" className="mb-6 rounded-3xl border border-warning/30 px-6 py-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-warning/15 p-3 text-warning">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Bookings are currently paused</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Travellers can still browse your tours, but they cannot book until you resume availability.
                  </p>
                </div>
              </div>
              <Button asChild variant="outline" className="rounded-2xl border-warning/30 text-warning hover:bg-warning/10">
                <Link to="/operator/settings">Open Settings</Link>
              </Button>
            </div>
          </GlassCard>
        )}

        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <GlassCard variant="card" className="rounded-3xl p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-primary/12 p-3 text-primary"><CalendarDays className="h-5 w-5" /></div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Upcoming departures</p>
                <p className="mt-1 text-2xl font-black text-foreground">{summary.upcomingDepartures}</p>
              </div>
            </div>
          </GlassCard>
          <GlassCard variant="card" className="rounded-3xl p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-primary/12 p-3 text-primary"><Users className="h-5 w-5" /></div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Seats sold</p>
                <p className="mt-1 text-2xl font-black text-foreground">{summary.seatsSold}</p>
              </div>
            </div>
          </GlassCard>
          <GlassCard variant="card" className="rounded-3xl p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-primary/12 p-3 text-primary"><Compass className="h-5 w-5" /></div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Occupancy</p>
                <p className="mt-1 text-2xl font-black text-foreground">{summary.occupancyRate}%</p>
              </div>
            </div>
          </GlassCard>
          <GlassCard variant="card" className="rounded-3xl p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-primary/12 p-3 text-primary"><Clock3 className="h-5 w-5" /></div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Active days</p>
                <p className="mt-1 text-2xl font-black text-foreground">{summary.activeDays}</p>
              </div>
            </div>
          </GlassCard>
        </div>

        {error ? (
          <GlassCard variant="card" className="rounded-3xl p-8 text-center">
            <p className="text-sm font-semibold text-destructive">{error}</p>
          </GlassCard>
        ) : loading ? (
          <GlassCard variant="card" className="rounded-3xl p-8 text-center text-muted-foreground">
            Loading availability calendar...
          </GlassCard>
        ) : schedules.length === 0 ? (
          <GlassCard variant="card" className="rounded-3xl p-10 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
              <CalendarDays className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-black text-foreground">No departures yet</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
              Follow the Booking.com availability pattern: publish predictable departure slots, keep seat counts current, and surface demand early.
            </p>
            <Button asChild className="mt-6 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90">
              <Link to="/operator/tours/new?returnTo=%2Foperator%2Fcalendar">Create your first scheduled tour</Link>
            </Button>
          </GlassCard>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[minmax(360px,420px)_minmax(0,1fr)]">
            <GlassCard variant="card" className="rounded-3xl p-4">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                modifiers={{ departures: departureDays }}
                modifiersClassNames={{
                  departures: 'bg-primary/10 text-primary font-bold',
                }}
                className="w-full rounded-3xl"
              />
            </GlassCard>

            <div className="space-y-6">
              <GlassCard variant="card" className="rounded-3xl p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-black text-foreground">
                      {selectedDate ? format(selectedDate, 'EEEE, MMM d') : 'Selected day'}
                    </h2>
                    <p className="text-sm text-muted-foreground">Live departure board inspired by Airbnb experience host calendars.</p>
                  </div>
                  <Badge variant="outline" className="border-border/60 bg-background/60 text-foreground">
                    {daySchedules.length} departure{daySchedules.length === 1 ? '' : 's'}
                  </Badge>
                </div>

                <div className="space-y-3">
                  {daySchedules.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border/60 px-5 py-10 text-center text-sm text-muted-foreground">
                      No departures planned for this day.
                    </div>
                  ) : (
                    daySchedules.map((schedule) => {
                      const seatsLeft = Math.max(0, schedule.capacity - schedule.booked_count)
                      return (
                        <div key={schedule.id} className="rounded-2xl border border-border/60 bg-background/40 p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-semibold text-foreground">{schedule.tours.title}</p>
                              <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                                <MapPin className="h-3.5 w-3.5" />
                                {formatDestination(schedule)}
                              </p>
                            </div>
                            <Badge variant={schedule.status === 'scheduled' ? 'default' : 'outline'} className={schedule.status === 'scheduled' ? 'bg-primary text-primary-foreground' : 'border-border/60 bg-background text-foreground'}>
                              {schedule.status}
                            </Badge>
                          </div>
                          <div className="mt-4 grid gap-3 sm:grid-cols-3">
                            <div>
                              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Departure</p>
                              <p className="mt-1 text-sm font-semibold text-foreground">{format(new Date(schedule.start_time), 'h:mm a')}</p>
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Seats sold</p>
                              <p className="mt-1 text-sm font-semibold text-foreground">{schedule.booked_count} / {schedule.capacity}</p>
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Seats left</p>
                              <p className="mt-1 text-sm font-semibold text-foreground">{seatsLeft}</p>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </GlassCard>

              <GlassCard variant="card" className="rounded-3xl p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-black text-foreground">Next departures</h2>
                    <p className="text-sm text-muted-foreground">High-signal agenda view for the next few sellable departures.</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {nextSchedules.map((schedule) => (
                    <div key={schedule.id} className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/40 px-4 py-3">
                      <div>
                        <p className="font-semibold text-foreground">{schedule.tours.title}</p>
                        <p className="text-sm text-muted-foreground">{format(new Date(schedule.start_time), 'EEE, MMM d · h:mm a')}</p>
                      </div>
                      <Badge variant="outline" className="border-border/60 bg-background/60 text-foreground">
                        {Math.max(0, schedule.capacity - schedule.booked_count)} seats left
                      </Badge>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}