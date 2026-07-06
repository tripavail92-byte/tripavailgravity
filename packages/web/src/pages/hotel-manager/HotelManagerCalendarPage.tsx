import { format, startOfDay } from 'date-fns'
import { BedDouble, CalendarDays, Clock3, Users } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { GlassCard } from '@/components/ui/glass'
import { PageHeader } from '@/components/ui/PageHeader'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

interface ManagerStayRecord {
  id: string
  status: string | null
  check_in_date: string
  check_out_date: string | null
  guest_count: number | null
  total_price: number | null
  package: {
    id: string
    name: string | null
    currency: string | null
  }
}

async function fetchManagerStays(ownerId: string): Promise<ManagerStayRecord[]> {
  const { data, error } = await supabase
    .from('package_bookings')
    .select(
      'id, status, check_in_date, check_out_date, guest_count, total_price, packages!inner(id, name, currency, owner_id)',
    )
    .eq('packages.owner_id', ownerId)
    .not('check_in_date', 'is', null)
    .order('check_in_date', { ascending: true })

  if (error) throw error

  return (data ?? []).map((row: any) => {
    const pkg = Array.isArray(row.packages) ? row.packages[0] : row.packages
    return {
      id: row.id,
      status: row.status ?? null,
      check_in_date: row.check_in_date,
      check_out_date: row.check_out_date ?? null,
      guest_count: row.guest_count != null ? Number(row.guest_count) : null,
      total_price: row.total_price != null ? Number(row.total_price) : null,
      package: {
        id: pkg?.id,
        name: pkg?.name ?? 'Package stay',
        currency: pkg?.currency ?? 'PKR',
      },
    }
  })
}

function nightsOf(stay: ManagerStayRecord): number | null {
  if (!stay.check_out_date) return null
  const ms = new Date(stay.check_out_date).getTime() - new Date(stay.check_in_date).getTime()
  if (!Number.isFinite(ms) || ms <= 0) return null
  return Math.round(ms / (24 * 60 * 60 * 1000))
}

export default function HotelManagerCalendarPage() {
  const { user } = useAuth()
  const [stays, setStays] = useState<ManagerStayRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())

  useEffect(() => {
    document.documentElement.setAttribute('data-role', 'hotel_manager')
    return () => document.documentElement.removeAttribute('data-role')
  }, [])

  useEffect(() => {
    const load = async () => {
      if (!user?.id) return
      try {
        setLoading(true)
        const records = await fetchManagerStays(user.id)
        setStays(records.filter((s) => s.status !== 'cancelled'))
        setError(null)
      } catch (loadError) {
        console.error('Failed to load manager calendar:', loadError)
        setError(loadError instanceof Error ? loadError.message : 'Failed to load calendar')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [user?.id])

  const now = new Date()
  const upcoming = useMemo(
    () => stays.filter((s) => new Date(s.check_out_date ?? s.check_in_date) >= now),
    [stays],
  )
  const summary = useMemo(() => {
    const upcomingCheckIns = stays.filter((s) => new Date(s.check_in_date) >= now)
    const guestsArriving = upcomingCheckIns.reduce((sum, s) => sum + (s.guest_count ?? 0), 0)
    const nightsBooked = upcomingCheckIns.reduce((sum, s) => sum + (nightsOf(s) ?? 0), 0)
    const activeDays = new Set(
      upcoming.map((s) => startOfDay(new Date(s.check_in_date)).toISOString()),
    ).size
    return {
      upcomingCheckIns: upcomingCheckIns.length,
      guestsArriving,
      nightsBooked,
      activeDays,
    }
  }, [stays, upcoming])

  const checkInDays = useMemo(() => stays.map((s) => new Date(s.check_in_date)), [stays])

  const selectedKey = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null
  const dayStays = useMemo(() => {
    if (!selectedKey) return []
    return stays.filter((s) => format(new Date(s.check_in_date), 'yyyy-MM-dd') === selectedKey)
  }, [stays, selectedKey])

  const nextStays = useMemo(() => upcoming.slice(0, 8), [upcoming])

  return (
    <div className="min-h-screen relative overflow-hidden bg-background pb-16">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-primary/20 blur-[120px] opacity-60" />
        <div className="absolute bottom-0 right-0 w-[520px] h-[520px] rounded-full bg-indigo-500/10 blur-[110px] opacity-60" />
      </div>
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        <PageHeader
          title="Calendar & Check-ins"
          subtitle="Arrival board for your properties — guests, nights, and stay pressure across upcoming package bookings."
          showBackButton={false}
          actions={
            <Button asChild className="rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90">
              <Link to="/manager/list-package">Create package</Link>
            </Button>
          }
        />

        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <GlassCard variant="card" className="rounded-3xl p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-primary/12 p-3 text-primary"><CalendarDays className="h-5 w-5" /></div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Upcoming check-ins</p>
                <p className="mt-1 text-2xl font-black text-foreground">{summary.upcomingCheckIns}</p>
              </div>
            </div>
          </GlassCard>
          <GlassCard variant="card" className="rounded-3xl p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-primary/12 p-3 text-primary"><Users className="h-5 w-5" /></div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Guests arriving</p>
                <p className="mt-1 text-2xl font-black text-foreground">{summary.guestsArriving}</p>
              </div>
            </div>
          </GlassCard>
          <GlassCard variant="card" className="rounded-3xl p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-primary/12 p-3 text-primary"><BedDouble className="h-5 w-5" /></div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Nights booked</p>
                <p className="mt-1 text-2xl font-black text-foreground">{summary.nightsBooked}</p>
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
        ) : stays.length === 0 ? (
          <GlassCard variant="card" className="rounded-3xl p-10 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
              <CalendarDays className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-black text-foreground">No stays scheduled yet</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
              When travellers book your packages, their check-ins land here so your team can prepare arrivals in advance.
            </p>
            <Button asChild className="mt-6 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90">
              <Link to="/manager/list-package">Create a bookable package</Link>
            </Button>
          </GlassCard>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[minmax(360px,420px)_minmax(0,1fr)]">
            <GlassCard variant="card" className="rounded-3xl p-4">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                modifiers={{ checkins: checkInDays }}
                modifiersClassNames={{
                  checkins: 'bg-primary/10 text-primary font-bold',
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
                    <p className="text-sm text-muted-foreground">Check-ins arriving on this day.</p>
                  </div>
                  <Badge variant="outline" className="border-border/60 bg-background/60 text-foreground">
                    {dayStays.length} check-in{dayStays.length === 1 ? '' : 's'}
                  </Badge>
                </div>

                <div className="space-y-3">
                  {dayStays.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border/60 px-5 py-10 text-center text-sm text-muted-foreground">
                      No check-ins on this day.
                    </div>
                  ) : (
                    dayStays.map((stay) => {
                      const nights = nightsOf(stay)
                      return (
                        <div key={stay.id} className="rounded-2xl border border-border/60 bg-background/40 p-4">
                          <div className="flex items-start justify-between gap-4">
                            <p className="font-semibold text-foreground">{stay.package.name}</p>
                            <Badge
                              variant={stay.status === 'confirmed' ? 'default' : 'outline'}
                              className={
                                stay.status === 'confirmed'
                                  ? 'bg-primary text-primary-foreground'
                                  : 'border-border/60 bg-background text-foreground'
                              }
                            >
                              {stay.status ?? 'pending'}
                            </Badge>
                          </div>
                          <div className="mt-4 grid gap-3 sm:grid-cols-3">
                            <div>
                              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Guests</p>
                              <p className="mt-1 text-sm font-semibold text-foreground">{stay.guest_count ?? '—'}</p>
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Nights</p>
                              <p className="mt-1 text-sm font-semibold text-foreground">{nights ?? '—'}</p>
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Total</p>
                              <p className="mt-1 text-sm font-semibold text-foreground">
                                {stay.package.currency} {Number(stay.total_price ?? 0).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </GlassCard>

              <GlassCard variant="card" className="rounded-3xl p-6">
                <div className="mb-4">
                  <h2 className="text-lg font-black text-foreground">Next arrivals</h2>
                  <p className="text-sm text-muted-foreground">The next few stays across all your properties.</p>
                </div>
                <div className="space-y-3">
                  {nextStays.map((stay) => (
                    <div key={stay.id} className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/40 px-4 py-3">
                      <div>
                        <p className="font-semibold text-foreground">{stay.package.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(stay.check_in_date), 'EEE, MMM d')}
                          {stay.check_out_date ? ` → ${format(new Date(stay.check_out_date), 'MMM d')}` : ''}
                        </p>
                      </div>
                      <Badge variant="outline" className="border-border/60 bg-background/60 text-foreground">
                        {stay.guest_count ?? 1} guest{(stay.guest_count ?? 1) === 1 ? '' : 's'}
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
