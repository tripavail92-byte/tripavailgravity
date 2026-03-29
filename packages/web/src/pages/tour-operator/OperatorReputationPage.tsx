import {
  Award,
  BarChart2,
  ExternalLink,
  MessageSquare,
  Star,
  TrendingUp,
  Users,
} from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { operatorReviewService } from '@/features/booking/services/reviewService'
import type { TourReviewWithReply } from '@/features/booking/services/reviewService'
import {
  operatorPublicService,
  type OperatorPublicMetrics,
  type OperatorPublicProfile,
  type OperatorStorefrontAnalytics,
  type OperatorStorefrontResponseMetrics,
} from '@/features/tour-operator/services/operatorPublicService'
import { useAuth } from '@/hooks/useAuth'

// ─── tiny helpers ────────────────────────────────────────────────────────────

function fmt(n: number | null | undefined, decimals = 1): string {
  if (n == null) return '—'
  return Number(n).toFixed(decimals)
}

function formatPercent(value: number | null | undefined, decimals = 1): string {
  if (value == null) return '—'
  const rounded = Number(value)
  if (Number.isNaN(rounded)) return '—'
  return `${Number(rounded.toFixed(decimals))}%`
}

function StarBar({ value, max = 5 }: { value: number | null; max?: number }) {
  const pct = value ? Math.min(100, (value / max) * 100) : 0
  return (
    <div className="flex items-center gap-2 flex-1 min-w-0">
      <div className="flex-1 h-1.5 bg-muted/40 rounded-full overflow-hidden">
        <div
          className="h-full bg-yellow-400 rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-bold text-foreground tabular-nums w-8 text-right shrink-0">
        {value ? `${fmt(value)}★` : '—'}
      </span>
    </div>
  )
}

function CategoryBar({ label, value }: { label: string; value: number | null }) {
  const pct = value ? Math.min(100, (value / 5) * 100) : 0
  return (
    <div className="flex items-center gap-3 py-1">
      <span className="text-xs font-medium text-muted-foreground w-28 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-muted/40 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="h-full bg-primary rounded-full"
        />
      </div>
      <span className="text-xs font-bold text-foreground tabular-nums w-8 text-right shrink-0">
        {value ? fmt(value) : '—'}
      </span>
    </div>
  )
}

function HistogramBar({
  star,
  count,
  total,
}: {
  star: number
  count: number
  total: number
}) {
  const pct = total > 0 ? (count / total) * 100 : 0
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-4 text-right font-medium text-muted-foreground shrink-0">{star}</span>
      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400 shrink-0" />
      <div className="flex-1 h-2 bg-muted/40 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="h-full bg-yellow-400 rounded-full"
        />
      </div>
      <span className="w-6 text-right font-medium text-muted-foreground shrink-0">{count}</span>
    </div>
  )
}

// ─── main page ───────────────────────────────────────────────────────────────

export default function OperatorReputationPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [metrics, setMetrics] = useState<OperatorPublicMetrics | null>(null)
  const [profile, setProfile] = useState<OperatorPublicProfile | null>(null)
  const [reviews, setReviews] = useState<TourReviewWithReply[]>([])
  const [storefrontAnalytics, setStorefrontAnalytics] = useState<OperatorStorefrontAnalytics | null>(null)
  const [responseMetrics, setResponseMetrics] = useState<OperatorStorefrontResponseMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return
    let alive = true
    setLoading(true)
    Promise.all([
      operatorPublicService.getMetrics(user.id),
      operatorPublicService.getProfileById(user.id),
      operatorReviewService.listMyReviews(),
      operatorPublicService.getStorefrontAnalytics(user.id),
      operatorPublicService.getStorefrontResponseMetrics(user.id),
    ])
      .then(([m, p, r, analytics, response]) => {
        if (!alive) return
        setMetrics(m)
        setProfile(p)
        setReviews(r)
        setStorefrontAnalytics(analytics)
        setResponseMetrics(response)
      })
      .catch(console.error)
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [user?.id])

  // histogram buckets
  const histogram = useMemo(() => {
    const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    reviews.forEach((r) => {
      const s = Math.round(r.rating ?? 0)
      if (s >= 1 && s <= 5) counts[s]++
    })
    return counts
  }, [reviews])

  // last 30 days reviews
  const recentCount = useMemo(() => {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 30)
    return reviews.filter((r) => new Date(r.created_at) >= cutoff).length
  }, [reviews])

  // reply rate
  const replyRate = useMemo(() => {
    if (reviews.length === 0) return null
    const replied = reviews.filter((r) => r.reply != null).length
    return Math.round((replied / reviews.length) * 100)
  }, [reviews])

  const unanswered = useMemo(() => reviews.filter((r) => r.reply == null).length, [reviews])

  const categories: { label: string; key: keyof OperatorPublicMetrics }[] = [
    { label: 'Communication', key: 'avg_communication' },
    { label: 'Punctuality', key: 'avg_punctuality' },
    { label: 'Transport', key: 'avg_transport' },
    { label: 'Tour Guide', key: 'avg_guide' },
    { label: 'Safety', key: 'avg_safety' },
    { label: 'Cleanliness', key: 'avg_cleanliness' },
    { label: 'Value for Money', key: 'avg_value' },
    { label: 'Itinerary', key: 'avg_itinerary' },
  ]

  const hasCategories = categories.some((c) => metrics?.[c.key] != null)

  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      {/* ambient blobs  */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-primary/20 blur-[120px] opacity-60" />
        <div className="absolute top-1/3 -right-32 w-[500px] h-[500px] rounded-full bg-yellow-500/10 blur-[100px] opacity-50" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* ── PAGE HEADER ── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
              <Award className="w-6 h-6 text-yellow-400" />
              Reputation
            </h1>
            <p className="text-sm text-muted-foreground font-medium mt-1">
              How travellers rate your service across all tours
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/operator/analytics')}
              className="rounded-xl gap-2 font-bold border-border/50 h-10"
            >
              <BarChart2 className="w-4 h-4" />
              Analytics
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/operator/reviews')}
              className="rounded-xl gap-2 font-bold border-border/50 h-10"
            >
              <MessageSquare className="w-4 h-4" />
              Review Inbox
              {unanswered > 0 && (
                <span className="bg-primary text-primary-foreground text-[10px] font-black rounded-full px-1.5 py-0.5 leading-none">
                  {unanswered}
                </span>
              )}
            </Button>
            {profile?.slug && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/operators/${profile.slug}`)}
                className="rounded-xl gap-2 font-bold border-border/50 h-10"
              >
                <ExternalLink className="w-4 h-4" />
                Public Profile
              </Button>
            )}
          </div>
        </motion.div>

        {loading ? (
          <div className="glass-card-dark border border-border/50 rounded-3xl p-20 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* ── TOP STATS ROW ── */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.08 }}
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4"
            >
              {[
                {
                  label: 'Avg Rating',
                  value:
                    metrics?.avg_rating != null ? `${fmt(metrics.avg_rating)}★` : '—',
                  icon: Star,
                  glow: 'shadow-yellow-500/20',
                  iconCls: 'text-yellow-400',
                },
                {
                  label: 'Reviews',
                  value: metrics?.total_reviews ?? '—',
                  icon: MessageSquare,
                  glow: 'shadow-primary/20',
                  iconCls: 'text-primary',
                },
                {
                  label: 'Completed Trips',
                  value: metrics?.total_completed_bookings ?? '—',
                  icon: TrendingUp,
                  glow: 'shadow-green-500/20',
                  iconCls: 'text-green-400',
                },
                {
                  label: 'Travelers Served',
                  value: metrics?.total_travelers_served ?? '—',
                  icon: Users,
                  glow: 'shadow-blue-500/20',
                  iconCls: 'text-blue-400',
                },
                {
                  label: 'Cancellation Rate',
                  value:
                    metrics?.cancellation_rate != null
                      ? `${fmt(metrics.cancellation_rate, 0)}%`
                      : '—',
                  icon: BarChart2,
                  glow: 'shadow-rose-500/20',
                  iconCls: 'text-rose-400',
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className={`glass-card-dark border border-border/50 rounded-2xl p-5 shadow-xl ${stat.glow}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
                      {stat.label}
                    </p>
                    <div className="w-7 h-7 rounded-lg bg-background/40 flex items-center justify-center">
                      <stat.icon className={`w-3.5 h-3.5 ${stat.iconCls}`} />
                    </div>
                  </div>
                  <p className="text-2xl font-black text-foreground">{stat.value}</p>
                </div>
              ))}
            </motion.div>

            {/* ── RATING DISTRIBUTION + CATEGORY SCORES ── */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.14 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              {/* Rating Distribution */}
              <div className="glass-card-dark border border-border/50 rounded-3xl p-6 space-y-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-foreground flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  Rating Distribution
                </h3>
                {reviews.length === 0 ? (
                  <p className="text-sm text-muted-foreground font-medium py-4">
                    No reviews yet — distribution will appear once travellers leave feedback.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {[5, 4, 3, 2, 1].map((star) => (
                      <HistogramBar
                        key={star}
                        star={star}
                        count={histogram[star]}
                        total={reviews.length}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Category Scores */}
              <div className="glass-card-dark border border-border/50 rounded-3xl p-6 space-y-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-foreground flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-primary" />
                  Category Scores
                </h3>
                {!hasCategories ? (
                  <p className="text-sm text-muted-foreground font-medium py-4">
                    Category scores appear after travellers use the detailed rating form.
                  </p>
                ) : (
                  <div className="space-y-1">
                    {categories.map((cat) => (
                      <CategoryBar
                        key={cat.key}
                        label={cat.label}
                        value={metrics?.[cat.key] as number | null}
                      />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>

            {/* ── ACTIVITY SNAPSHOT ── */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.2 }}
              className="glass-card-dark border border-border/50 rounded-3xl p-6"
            >
              <h3 className="text-sm font-black uppercase tracking-widest text-foreground flex items-center gap-2 mb-5">
                <ExternalLink className="w-4 h-4 text-primary" />
                Storefront Analytics (30 Days)
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-8 gap-5 mb-6">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80 mb-1">
                    Profile Views
                  </p>
                  <p className="text-3xl font-black text-foreground">{storefrontAnalytics?.profile_views ?? 0}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80 mb-1">
                    Unique Visitors
                  </p>
                  <p className="text-3xl font-black text-foreground">{storefrontAnalytics?.unique_visitors ?? 0}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80 mb-1">
                    Engaged Visitors
                  </p>
                  <p className="text-3xl font-black text-foreground">{storefrontAnalytics?.engaged_visitors ?? 0}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80 mb-1">
                    CTA Clicks
                  </p>
                  <p className="text-3xl font-black text-foreground">{storefrontAnalytics?.cta_clicks ?? 0}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80 mb-1">
                    Tour Clicks
                  </p>
                  <p className="text-3xl font-black text-foreground">{storefrontAnalytics?.tour_clicks ?? 0}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80 mb-1">
                    Booking Starts
                  </p>
                  <p className="text-3xl font-black text-foreground">{storefrontAnalytics?.booking_starts ?? 0}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80 mb-1">
                    Bookings After Profile Views
                  </p>
                  <p className="text-3xl font-black text-foreground">{storefrontAnalytics?.attributed_booking_starts ?? 0}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80 mb-1">
                    Engagement Rate
                  </p>
                  <p className="text-3xl font-black text-foreground">{formatPercent(storefrontAnalytics?.engagement_rate, 2)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80 mb-1">
                    Profile View To Booking Rate
                  </p>
                  <p className="text-3xl font-black text-foreground">{formatPercent(storefrontAnalytics?.attributed_conversion_rate, 2)}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground font-medium">
                <p>
                  {storefrontAnalytics?.engaged_visitors != null && storefrontAnalytics?.unique_visitors != null
                    ? `${storefrontAnalytics.engaged_visitors} of ${storefrontAnalytics.unique_visitors} visitors clicked a CTA or tour in the last 30 days.`
                    : 'No engagement data recorded yet.'}
                </p>
                <p>
                  {storefrontAnalytics?.attributed_booking_starts != null
                    ? `${storefrontAnalytics.attributed_booking_starts} bookings started after travelers viewed this profile in the last 30 days.`
                    : 'No bookings after profile views recorded yet.'}
                </p>
                <p>
                  {responseMetrics?.response_rate != null
                    ? `Replies to ${formatPercent(responseMetrics.response_rate, 2)} of traveler messages · Usually replies in about ${responseMetrics.avg_response_minutes ? `${Math.round(responseMetrics.avg_response_minutes)} minutes` : 'the available window'}`
                    : 'No reply behavior data recorded yet.'}
                </p>
                <p>
                  {storefrontAnalytics?.last_viewed_at
                    ? `Last public profile view: ${new Date(storefrontAnalytics.last_viewed_at).toLocaleString()}`
                    : 'No public storefront traffic recorded yet.'}
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.24 }}
              className="glass-card-dark border border-border/50 rounded-3xl p-6"
            >
              <h3 className="text-sm font-black uppercase tracking-widest text-foreground flex items-center gap-2 mb-5">
                <TrendingUp className="w-4 h-4 text-green-400" />
                Activity Snapshot
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80 mb-1">
                    Reviews (last 30 days)
                  </p>
                  <p className="text-3xl font-black text-foreground">{recentCount}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80 mb-1">
                    Reply Rate
                  </p>
                  <p className="text-3xl font-black text-foreground">
                    {replyRate != null ? `${replyRate}%` : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80 mb-1">
                    Awaiting Reply
                  </p>
                  <p className={`text-3xl font-black ${unanswered > 0 ? 'text-primary' : 'text-foreground'}`}>
                    {unanswered}
                  </p>
                </div>
              </div>

              {unanswered > 0 && (
                <div className="mt-5 pt-5 border-t border-border/40 flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">
                    <span className="font-bold text-primary">{unanswered}</span>{' '}
                    {unanswered === 1 ? 'review needs' : 'reviews need'} a reply. Operators who
                    respond promptly get better visibility.
                  </p>
                  <Button
                    size="sm"
                    onClick={() => navigate('/operator/reviews')}
                    className="ml-4 h-9 px-5 rounded-xl font-bold gap-2 bg-primary text-primary-foreground hover:bg-primary/90 flex-shrink-0"
                  >
                    Reply Now <MessageSquare className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </div>
    </div>
  )
}
