import { format } from 'date-fns'
import {
  AlertTriangle,
  CalendarDays,
  Clock3,
  Compass,
  Loader2,
  MapPin,
  Plus,
  Users,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { GlassCard } from '@/components/ui/glass'
import { Input } from '@/components/ui/input'
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

  // Departure management (add / cancel).
  const [actioningId, setActioningId] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [adding, setAdding] = useState(false)
  const [addForm, setAddForm] = useState({ tourId: '', date: '', time: '09:00', capacity: '15' })

  // `loading` only fires on the first paint (nothing on screen yet). After an add/cancel we
  // background-refresh — keeping the calendar visible instead of blanking it with a spinner.
  const load = useCallback(async (options: { background?: boolean } = {}) => {
    if (!user?.id) return
    try {
      if (!options.background) setLoading(true)
      const response = await operatorPortalService.getCalendarData(user.id)
      setSchedules(response.schedules)
      setSummary(response.summary)
      setBookingsPaused(response.summary.bookingsPaused)
      setError(null)
    } catch (loadError) {
      console.error('Failed to load operator calendar:', loadError)
      setError(loadError instanceof Error ? loadError.message : 'Failed to load calendar')
    } finally {
      if (!options.background) setLoading(false)
    }
  }, [user?.id])

  const refresh = useCallback(() => load({ background: true }), [load])

  useEffect(() => {
    void load()
  }, [load])

  // Distinct tours the operator already has departures for — the "add another date" targets.
  const operatorTours = useMemo(() => {
    const seen = new Map<string, string>()
    for (const s of schedules) if (!seen.has(s.tours.id)) seen.set(s.tours.id, s.tours.title)
    return [...seen.entries()].map(([id, title]) => ({ id, title }))
  }, [schedules])

  const handleCancelDeparture = async (schedule: OperatorScheduleRecord) => {
    if (schedule.booked_count > 0) {
      if (!window.confirm(`This departure has ${schedule.booked_count} booking(s). Cancelling stops new bookings but keeps existing travellers — continue?`)) return
    } else if (!window.confirm('Cancel this departure? It will stop being sold.')) {
      return
    }
    try {
      setActioningId(schedule.id)
      await operatorPortalService.manageDeparture({
        tourId: schedule.tours.id,
        action: 'cancel',
        scheduleId: schedule.id,
      })
      toast.success('Departure cancelled')
      await refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not cancel the departure')
    } finally {
      setActioningId(null)
    }
  }

  const openAddDialog = () => {
    setAddForm({
      tourId: operatorTours[0]?.id ?? '',
      date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '',
      time: '09:00',
      capacity: '15',
    })
    setAddOpen(true)
  }

  const handleAddDeparture = async () => {
    if (!addForm.tourId) return toast.error('Choose a tour')
    if (!addForm.date) return toast.error('Choose a date')
    const capacity = Math.max(1, Number(addForm.capacity) || 0)
    const startIso = new Date(`${addForm.date}T${addForm.time || '09:00'}`).toISOString()
    try {
      setAdding(true)
      await operatorPortalService.manageDeparture({
        tourId: addForm.tourId,
        action: 'add',
        startTime: startIso,
        capacity,
      })
      toast.success('Departure added')
      setAddOpen(false)
      await refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not add the departure')
    } finally {
      setAdding(false)
    }
  }

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
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        <PageHeader
          title="Calendar & Availability"
          subtitle="Plan departures, watch demand, and keep an eye on remaining seats across your tours."
          showBackButton={false}
          actions={
            <Button
              onClick={openAddDialog}
              disabled={operatorTours.length === 0}
              title={operatorTours.length === 0 ? 'Create a scheduled tour first' : undefined}
              className="rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add departure
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
          <GlassCard variant="card" className="rounded-3xl p-16 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          </GlassCard>
        ) : schedules.length === 0 ? (
          <GlassCard variant="card" className="rounded-3xl p-10 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
              <CalendarDays className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-black text-foreground">No departures yet</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
              Publish departures on a predictable rhythm, keep seat counts current, and travellers will find you earlier.
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
                    <p className="text-sm text-muted-foreground">Your live departure board.</p>
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
                          {schedule.status === 'scheduled' && (
                            <div className="mt-3 flex justify-end border-t border-border/40 pt-3">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCancelDeparture(schedule)}
                                disabled={actioningId === schedule.id}
                                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                              >
                                {actioningId === schedule.id ? (
                                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <X className="mr-1.5 h-3.5 w-3.5" />
                                )}
                                Cancel departure
                              </Button>
                            </div>
                          )}
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

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogTitle className="text-xl font-black text-foreground">Add a departure</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Open a new date for one of your tours. It goes on sale immediately.
          </DialogDescription>
          <div className="mt-4 space-y-4">
            <div>
              <label htmlFor="add-tour" className="mb-1.5 block text-sm font-semibold text-foreground">
                Tour
              </label>
              <select
                id="add-tour"
                value={addForm.tourId}
                onChange={(e) => setAddForm((f) => ({ ...f, tourId: e.target.value }))}
                className="w-full rounded-xl border border-border/60 bg-background px-4 py-3 text-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
              >
                {operatorTours.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="add-date" className="mb-1.5 block text-sm font-semibold text-foreground">
                  Date
                </label>
                <Input
                  id="add-date"
                  type="date"
                  value={addForm.date}
                  onChange={(e) => setAddForm((f) => ({ ...f, date: e.target.value }))}
                  className="h-12 rounded-xl"
                />
              </div>
              <div>
                <label htmlFor="add-time" className="mb-1.5 block text-sm font-semibold text-foreground">
                  Time
                </label>
                <Input
                  id="add-time"
                  type="time"
                  value={addForm.time}
                  onChange={(e) => setAddForm((f) => ({ ...f, time: e.target.value }))}
                  className="h-12 rounded-xl"
                />
              </div>
            </div>
            <div>
              <label htmlFor="add-capacity" className="mb-1.5 block text-sm font-semibold text-foreground">
                Seats (capacity)
              </label>
              <Input
                id="add-capacity"
                type="number"
                min={1}
                value={addForm.capacity}
                onChange={(e) => setAddForm((f) => ({ ...f, capacity: e.target.value }))}
                className="h-12 rounded-xl"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setAddOpen(false)} className="rounded-xl">
                <X className="mr-1.5 h-4 w-4" />
                Cancel
              </Button>
              <Button onClick={handleAddDeparture} disabled={adding} className="gap-2 rounded-xl">
                {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Add departure
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}