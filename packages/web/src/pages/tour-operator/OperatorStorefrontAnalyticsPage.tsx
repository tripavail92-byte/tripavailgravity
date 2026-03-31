import {
  Download,
  BarChart2,
  Clock,
  ExternalLink,
  Eye,
  MapPin,
  MousePointer,
  TrendingUp,
  Users,
} from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/PageHeader'
import {
  operatorPublicService,
  type OperatorPublicProfile,
  type OperatorStorefrontAnalytics,
  type OperatorStorefrontEvent,
  type OperatorStorefrontResponseMetrics,
} from '@/features/tour-operator/services/operatorPublicService'
import { useAuth } from '@/hooks/useAuth'

const DAY_FILTERS = [7, 30, 90] as const

function downloadCsv(filename: string, rows: string[][]) {
  if (typeof window === 'undefined') return
  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = window.URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  window.URL.revokeObjectURL(url)
}

function formatEventLabel(eventType: OperatorStorefrontEvent['event_type']) {
  switch (eventType) {
    case 'profile_view':
      return 'Profile view'
    case 'cta_click':
      return 'CTA click'
    case 'tour_click':
      return 'Tour click'
    case 'booking_start':
      return 'Booking start'
    default:
      return eventType
  }
}

function eventIcon(eventType: OperatorStorefrontEvent['event_type']) {
  switch (eventType) {
    case 'profile_view':
      return Eye
    case 'cta_click':
      return MousePointer
    case 'tour_click':
      return MapPin
    case 'booking_start':
      return TrendingUp
    default:
      return BarChart2
  }
}

function formatPercentage(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return '0%'
  const rounded = Math.round(value * 10) / 10
  return Number.isInteger(rounded) ? `${rounded}%` : `${rounded.toFixed(1)}%`
}

type TourJourneyRow = {
  tourId: string
  tourTitle: string
  tourClicks: number
  bookingStarts: number
  bookingsAfterProfileView: number
  lastActivityAt: string | null
}

export default function OperatorStorefrontAnalyticsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [days, setDays] = useState<(typeof DAY_FILTERS)[number]>(30)
  const [profile, setProfile] = useState<OperatorPublicProfile | null>(null)
  const [analytics, setAnalytics] = useState<OperatorStorefrontAnalytics | null>(null)
  const [responseMetrics, setResponseMetrics] = useState<OperatorStorefrontResponseMetrics | null>(null)
  const [events, setEvents] = useState<OperatorStorefrontEvent[]>([])
  const [tourTitles, setTourTitles] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return

    let alive = true
    setLoading(true)

    Promise.all([
      operatorPublicService.getProfileById(user.id),
      operatorPublicService.getStorefrontAnalytics(user.id, days),
      operatorPublicService.getStorefrontResponseMetrics(user.id),
      operatorPublicService.listStorefrontEvents(user.id, 250),
      operatorPublicService.getPublishedTours(user.id),
    ])
      .then(([currentProfile, currentAnalytics, currentResponseMetrics, currentEvents, tours]) => {
        if (!alive) return
        setProfile(currentProfile)
        setAnalytics(currentAnalytics)
        setResponseMetrics(currentResponseMetrics)
        setEvents(currentEvents)
        setTourTitles(
          Object.fromEntries(
            tours.map((tour: any) => [tour.id as string, tour.title as string]),
          ),
        )
      })
      .catch(console.error)
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [days, user?.id])

  const filteredEvents = useMemo(() => {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    return events.filter((event) => new Date(event.created_at) >= cutoff)
  }, [days, events])

  const breakdown = useMemo(() => {
    const counts = {
      profile_view: 0,
      cta_click: 0,
      tour_click: 0,
      booking_start: 0,
    }

    filteredEvents.forEach((event) => {
      counts[event.event_type] += 1
    })

    return counts
  }, [filteredEvents])

  const dailySeries = useMemo(() => {
    const buckets = new Map<string, { label: string; profile_view: number; cta_click: number; tour_click: number; booking_start: number }>()

    for (let offset = days - 1; offset >= 0; offset -= 1) {
      const day = new Date()
      day.setDate(day.getDate() - offset)
      const key = day.toISOString().slice(0, 10)
      buckets.set(key, {
        label: day.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        profile_view: 0,
        cta_click: 0,
        tour_click: 0,
        booking_start: 0,
      })
    }

    filteredEvents.forEach((event) => {
      const key = event.created_at.slice(0, 10)
      const bucket = buckets.get(key)
      if (!bucket) return
      bucket[event.event_type] += 1
    })

    return Array.from(buckets.values())
  }, [days, filteredEvents])

  const busiestDay = useMemo(() => {
    return dailySeries.reduce<{ label: string; total: number } | null>((best, day) => {
      const total = day.profile_view + day.cta_click + day.tour_click + day.booking_start
      if (!best || total > best.total) return { label: day.label, total }
      return best
    }, null)
  }, [dailySeries])

  const recentEvents = filteredEvents.slice(0, 24)
  const engagementRate = analytics?.engagement_rate ?? 0

  const tourJourneyRows = useMemo(() => {
    const orderedEvents = [...filteredEvents].sort(
      (left, right) => new Date(left.created_at).getTime() - new Date(right.created_at).getTime(),
    )
    const profileSeenBySession = new Map<string, boolean>()
    const rows = new Map<string, TourJourneyRow>()

    for (const event of orderedEvents) {
      const sessionKey = event.session_id || event.id

      if (event.event_type === 'profile_view') {
        profileSeenBySession.set(sessionKey, true)
      }

      if (!event.tour_id) continue

      const existing = rows.get(event.tour_id) || {
        tourId: event.tour_id,
        tourTitle: tourTitles[event.tour_id] ?? 'Untitled tour',
        tourClicks: 0,
        bookingStarts: 0,
        bookingsAfterProfileView: 0,
        lastActivityAt: null,
      }

      if (event.event_type === 'tour_click') existing.tourClicks += 1
      if (event.event_type === 'booking_start') {
        existing.bookingStarts += 1
        if (profileSeenBySession.get(sessionKey)) {
          existing.bookingsAfterProfileView += 1
        }
      }

      existing.lastActivityAt = event.created_at
      rows.set(event.tour_id, existing)
    }

    return [...rows.values()].sort(
      (left, right) =>
        right.bookingsAfterProfileView - left.bookingsAfterProfileView ||
        right.bookingStarts - left.bookingStarts ||
        right.tourClicks - left.tourClicks,
    )
  }, [filteredEvents, tourTitles])

  const chartMax = useMemo(() => {
    return dailySeries.reduce((max, day) => {
      return Math.max(max, day.profile_view, day.cta_click, day.tour_click, day.booking_start, 1)
    }, 1)
  }, [dailySeries])

  const exportEvents = () => {
    downloadCsv(`storefront-events-${days}d.csv`, [
      ['event_type', 'created_at', 'session_id', 'slug', 'tour_id', 'tour_title'],
      ...filteredEvents.map((event) => [
        event.event_type,
        event.created_at,
        event.session_id ?? '',
        event.slug ?? '',
        event.tour_id ?? '',
        event.tour_id ? tourTitles[event.tour_id] ?? '' : '',
      ]),
    ])
  }

  const exportSummary = () => {
    downloadCsv(`storefront-summary-${days}d.csv`, [
      ['window_days', 'profile_views', 'unique_visitors', 'engaged_visitors', 'cta_clicks', 'tour_clicks', 'booking_starts', 'attributed_booking_starts', 'engagement_rate', 'attributed_conversion_rate', 'response_rate', 'avg_response_minutes'],
      [
        String(days),
        String(analytics?.profile_views ?? 0),
        String(analytics?.unique_visitors ?? 0),
        String(analytics?.engaged_visitors ?? 0),
        String(analytics?.cta_clicks ?? 0),
        String(analytics?.tour_clicks ?? 0),
        String(analytics?.booking_starts ?? 0),
        String(analytics?.attributed_booking_starts ?? 0),
        String(engagementRate),
        String(analytics?.attributed_conversion_rate ?? 0),
        String(responseMetrics?.response_rate ?? 0),
        String(responseMetrics?.avg_response_minutes ?? 0),
      ],
      [],
      ['date_label', 'profile_views', 'cta_clicks', 'tour_clicks', 'booking_starts'],
      ...dailySeries.map((day) => [
        day.label,
        String(day.profile_view),
        String(day.cta_click),
        String(day.tour_click),
        String(day.booking_start),
      ]),
      [],
      ['tour_title', 'tour_id', 'tour_clicks', 'booking_starts', 'bookings_after_profile_view', 'last_activity_at'],
      ...tourJourneyRows.map((row) => [
        row.tourTitle,
        row.tourId,
        String(row.tourClicks),
        String(row.bookingStarts),
        String(row.bookingsAfterProfileView),
        row.lastActivityAt ?? '',
      ]),
    ])
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-primary/20 blur-[120px] opacity-60" />
        <div className="absolute bottom-0 right-0 w-[520px] h-[520px] rounded-full bg-emerald-500/10 blur-[110px] opacity-60" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="space-y-4"
        >
          <PageHeader
            title="Storefront Analytics"
            subtitle="Track public profile views, traveler interest, and bookings that follow a profile visit."
            showBackButton={false}
          />

          <div className="flex flex-wrap items-center gap-2">
            {DAY_FILTERS.map((option) => (
              <Button
                key={option}
                type="button"
                size="sm"
                variant={days === option ? 'default' : 'outline'}
                onClick={() => setDays(option)}
                className="rounded-xl"
              >
                {option} days
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={exportSummary}
              className="rounded-xl gap-2"
            >
              <Download className="w-4 h-4" />
              Export Summary
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportEvents}
              className="rounded-xl gap-2"
            >
              <Download className="w-4 h-4" />
              Export Events
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/operator/reputation')}
              className="rounded-xl gap-2"
            >
              <TrendingUp className="w-4 h-4" />
              Reputation
            </Button>
            {profile?.slug ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/operators/${profile.slug}`)}
                className="rounded-xl gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Public Profile
              </Button>
            ) : null}
          </div>
        </motion.div>

        {loading ? (
          <div className="glass-card border border-border/50 rounded-3xl p-20 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.05 }}
              className="grid grid-cols-2 lg:grid-cols-6 gap-4"
            >
              {[
                {
                  label: 'Profile Views',
                  value: analytics?.profile_views ?? 0,
                  icon: Eye,
                },
                {
                  label: 'Unique Visitors',
                  value: analytics?.unique_visitors ?? 0,
                  icon: Users,
                },
                {
                  label: 'Engaged Visitors',
                  value: analytics?.engaged_visitors ?? 0,
                  icon: TrendingUp,
                },
                {
                  label: 'Booking Starts',
                  value: analytics?.booking_starts ?? 0,
                  icon: MousePointer,
                },
                {
                  label: 'Bookings After A Profile View',
                  value: analytics?.attributed_booking_starts ?? 0,
                  icon: MapPin,
                },
                {
                  label: 'Profile View To Booking Rate',
                  value: formatPercentage(analytics?.attributed_conversion_rate ?? 0),
                  icon: TrendingUp,
                },
              ].map((stat) => (
                <div key={stat.label} className="glass-card border border-border/50 rounded-2xl p-5 shadow-xl">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
                      {stat.label}
                    </p>
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-background/40">
                      <stat.icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <p className="text-3xl font-black text-foreground">{stat.value}</p>
                </div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.1 }}
              className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.9fr)]"
            >
              <Card className="glass-card border-border/50 rounded-3xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest">
                    <BarChart2 className="h-4 w-4 text-primary" />
                    Daily Funnel Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {dailySeries.every((day) => day.profile_view + day.cta_click + day.tour_click + day.booking_start === 0) ? (
                    <p className="py-8 text-sm font-medium text-muted-foreground">
                      No storefront activity recorded in this window.
                    </p>
                  ) : (
                    dailySeries.map((day) => {
                      const max = Math.max(day.profile_view, day.cta_click, day.tour_click, day.booking_start, 1)
                      return (
                        <div key={day.label} className="grid grid-cols-[72px_minmax(0,1fr)] gap-4 items-center">
                          <div>
                            <p className="text-xs font-bold text-foreground">{day.label}</p>
                            <p className="text-[11px] text-muted-foreground">
                              {day.profile_view + day.cta_click + day.tour_click + day.booking_start} events
                            </p>
                          </div>
                          <div className="space-y-2">
                            {[
                              { key: 'profile_view', label: 'Views', value: day.profile_view, className: 'bg-primary' },
                              { key: 'cta_click', label: 'CTA', value: day.cta_click, className: 'bg-emerald-400' },
                              { key: 'tour_click', label: 'Tours', value: day.tour_click, className: 'bg-amber-400' },
                              { key: 'booking_start', label: 'Bookings', value: day.booking_start, className: 'bg-rose-400' },
                            ].map((series) => (
                              <div key={series.key} className="flex items-center gap-3 text-xs">
                                <span className="w-10 shrink-0 font-medium text-muted-foreground">{series.label}</span>
                                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted/40">
                                  <div
                                    className={`h-full rounded-full ${series.className}`}
                                    style={{ width: `${(series.value / max) * 100}%` }}
                                  />
                                </div>
                                <span className="w-6 shrink-0 text-right font-bold text-foreground">{series.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })
                  )}
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card className="glass-card border-border/50 rounded-3xl">
                  <CardHeader>
                    <CardTitle className="text-sm font-black uppercase tracking-widest">Trend Chart</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {dailySeries.every((day) => day.profile_view + day.cta_click + day.tour_click + day.booking_start === 0) ? (
                      <p className="py-8 text-sm font-medium text-muted-foreground">
                        No chart data recorded in this window.
                      </p>
                    ) : (
                      <div className="space-y-4">
                        <svg viewBox="0 0 420 220" className="w-full overflow-visible">
                          {[0, 1, 2, 3].map((step) => {
                            const y = 24 + step * 52
                            return (
                              <line
                                key={step}
                                x1="24"
                                y1={y}
                                x2="396"
                                y2={y}
                                stroke="currentColor"
                                opacity="0.12"
                              />
                            )
                          })}

                          {[
                            { key: 'profile_view', color: '#14b8a6' },
                            { key: 'cta_click', color: '#34d399' },
                            { key: 'tour_click', color: '#fbbf24' },
                            { key: 'booking_start', color: '#fb7185' },
                          ].map((series) => {
                            const points = dailySeries
                              .map((day, index) => {
                                const x = 24 + (index * 372) / Math.max(dailySeries.length - 1, 1)
                                const value = day[series.key as 'profile_view' | 'cta_click' | 'tour_click' | 'booking_start']
                                const y = 180 - (value / chartMax) * 156
                                return `${x},${y}`
                              })
                              .join(' ')

                            return (
                              <polyline
                                key={series.key}
                                fill="none"
                                stroke={series.color}
                                strokeWidth="3"
                                strokeLinejoin="round"
                                strokeLinecap="round"
                                points={points}
                              />
                            )
                          })}

                          {dailySeries.map((day, index) => {
                            const x = 24 + (index * 372) / Math.max(dailySeries.length - 1, 1)
                            return (
                              <text
                                key={day.label}
                                x={x}
                                y="208"
                                textAnchor="middle"
                                fontSize="10"
                                fill="currentColor"
                                opacity="0.7"
                              >
                                {day.label}
                              </text>
                            )
                          })}
                        </svg>

                        <div className="flex flex-wrap gap-3 text-xs font-medium text-muted-foreground">
                          <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-teal-500" />Profile views</span>
                          <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />CTA clicks</span>
                          <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-amber-400" />Tour clicks</span>
                          <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-rose-400" />Booking starts</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="glass-card border-border/50 rounded-3xl">
                  <CardHeader>
                    <CardTitle className="text-sm font-black uppercase tracking-widest">Event Mix</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {([
                      { label: 'Profile views', value: breakdown.profile_view, tone: 'bg-primary/15 text-primary border-primary/30' },
                      { label: 'CTA clicks', value: breakdown.cta_click, tone: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
                      { label: 'Tour clicks', value: breakdown.tour_click, tone: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
                      { label: 'Booking starts', value: breakdown.booking_start, tone: 'bg-rose-500/15 text-rose-300 border-rose-500/30' },
                    ]).map((row) => (
                      <div key={row.label} className="flex items-center justify-between rounded-2xl border border-border/50 bg-background/30 px-4 py-3">
                        <span className="text-sm font-medium text-foreground">{row.label}</span>
                        <Badge variant="outline" className={row.tone}>{row.value}</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="glass-card border-border/50 rounded-3xl">
                  <CardHeader>
                    <CardTitle className="text-sm font-black uppercase tracking-widest">Highlights</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-muted-foreground">
                    <div className="rounded-2xl border border-border/50 bg-background/30 p-4">
                      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Engaged visitors</p>
                      <p className="mt-2 font-medium text-foreground">
                        {analytics?.engaged_visitors ?? 0} of {analytics?.unique_visitors ?? 0} visitors clicked deeper into the storefront.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-border/50 bg-background/30 p-4">
                      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Bookings after a profile view</p>
                      <p className="mt-2 font-medium text-foreground">
                        {analytics?.attributed_booking_starts ?? 0} bookings started after travelers viewed this profile in this window.
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Profile view to booking rate: {formatPercentage(analytics?.attributed_conversion_rate ?? 0)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-border/50 bg-background/30 p-4">
                      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Reply behavior</p>
                      <p className="mt-2 font-medium text-foreground">
                        Replies to {formatPercentage(responseMetrics?.response_rate ?? 0)} of traveler messages
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {responseMetrics?.avg_response_minutes
                          ? `Usually replies in about ${Math.round(responseMetrics.avg_response_minutes)} minutes`
                          : 'Reply time will appear after travelers start messaging.'}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-border/50 bg-background/30 p-4">
                      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Last public visit</p>
                      <p className="mt-2 font-medium text-foreground">
                        {analytics?.last_viewed_at ? new Date(analytics.last_viewed_at).toLocaleString() : 'No views recorded'}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-border/50 bg-background/30 p-4">
                      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Busiest day</p>
                      <p className="mt-2 font-medium text-foreground">
                        {busiestDay && busiestDay.total > 0 ? `${busiestDay.label} · ${busiestDay.total} events` : 'No active day yet'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.15 }}
            >
              <Card className="glass-card border-border/50 rounded-3xl mb-6">
                <CardHeader>
                  <CardTitle className="text-sm font-black uppercase tracking-widest">Per-Tour Booking Journey</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {tourJourneyRows.length === 0 ? (
                    <p className="py-6 text-sm font-medium text-muted-foreground">
                      No tour-specific activity has been recorded in this window.
                    </p>
                  ) : (
                    tourJourneyRows.map((row) => (
                      <div key={row.tourId} className="rounded-2xl border border-border/50 bg-background/30 p-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="font-medium text-foreground">{row.tourTitle}</p>
                            <p className="text-xs text-muted-foreground">
                              {row.lastActivityAt ? `Last activity ${new Date(row.lastActivityAt).toLocaleString()}` : 'No recent activity'}
                            </p>
                          </div>
                          <Badge variant="outline" className="w-fit">{row.bookingsAfterProfileView} bookings after profile views</Badge>
                        </div>
                        <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground/80">Tour clicks</p>
                            <p className="font-semibold text-foreground">{row.tourClicks}</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground/80">Booking starts</p>
                            <p className="font-semibold text-foreground">{row.bookingStarts}</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground/80">After profile view</p>
                            <p className="font-semibold text-foreground">{row.bookingsAfterProfileView}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card className="glass-card border-border/50 rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-sm font-black uppercase tracking-widest">Recent Events</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {recentEvents.length === 0 ? (
                    <p className="py-8 text-sm font-medium text-muted-foreground">
                      No recent storefront events in this window.
                    </p>
                  ) : (
                    recentEvents.map((event) => {
                      const Icon = eventIcon(event.event_type)
                      const tourLabel = event.tour_id ? tourTitles[event.tour_id] ?? event.tour_id : null
                      return (
                        <div key={event.id} className="flex flex-col gap-3 rounded-2xl border border-border/50 bg-background/30 p-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-background/50">
                              <Icon className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{formatEventLabel(event.event_type)}</p>
                              <p className="text-xs text-muted-foreground">
                                {tourLabel ? `Tour: ${tourLabel}` : profile?.slug ? `Slug: ${profile.slug}` : 'Storefront event'}
                              </p>
                              {event.session_id ? (
                                <p className="mt-1 text-[11px] text-muted-foreground">Session {event.session_id.slice(0, 8)}</p>
                              ) : null}
                            </div>
                          </div>
                          <p className="text-xs font-medium text-muted-foreground">
                            {new Date(event.created_at).toLocaleString()}
                          </p>
                        </div>
                      )
                    })
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </div>
    </div>
  )
}
