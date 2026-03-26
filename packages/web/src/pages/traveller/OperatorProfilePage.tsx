import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Globe,
  Loader2,
  MapPin,
  MessageSquare,
  Star,
  Users,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  GlassCard,
  GlassContent,
  GlassHeader,
  GlassTitle,
} from '@/components/ui/glass'
import { type TourReviewWithReply } from '@/features/booking/services/reviewService'
import {
  operatorPublicService,
  type OperatorPublicMetrics,
  type OperatorPublicProfile,
} from '@/features/tour-operator/services/operatorPublicService'

function displayName(operator: OperatorPublicProfile): string {
  return operator.business_name?.trim() || operator.company_name?.trim() || 'Tour Operator'
}

function StarBar({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${i <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`}
          />
        ))}
      </div>
      <span className="text-sm font-bold text-foreground">{rating.toFixed(1)}</span>
      <span className="text-sm text-muted-foreground">({count} reviews)</span>
    </div>
  )
}

function StatCard({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
  return (
    <div className="rounded-3xl border border-border/60 bg-muted/30 p-5 text-center">
      <Icon className="mx-auto mb-2 h-6 w-6 text-primary/70" />
      <p className="text-2xl font-black text-foreground">{value}</p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
    </div>
  )
}

export default function OperatorProfilePage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()

  const [profile, setProfile] = useState<OperatorPublicProfile | null>(null)
  const [metrics, setMetrics] = useState<OperatorPublicMetrics | null>(null)
  const [tours, setTours] = useState<any[]>([])
  const [reviews, setReviews] = useState<TourReviewWithReply[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!slug) return

    const load = async () => {
      setLoading(true)
      try {
        const prof = await operatorPublicService.getProfileBySlug(slug)
        if (!prof) { setNotFound(true); return }
        setProfile(prof)

        const [m, t, r] = await Promise.all([
          operatorPublicService.getMetrics(prof.user_id),
          operatorPublicService.getPublishedTours(prof.user_id),
          operatorPublicService.getAllReviewsWithReplies(prof.user_id),
        ])
        setMetrics(m)
        setTours(t)
        setReviews(r)
      } catch (err) {
        console.error('OperatorProfilePage load error:', err)
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [slug])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (notFound || !profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <Building2 className="h-16 w-16 text-muted-foreground/40" />
        <h1 className="text-2xl font-bold text-foreground">Operator not found</h1>
        <p className="text-muted-foreground">This operator profile does not exist or is not public.</p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Go back
        </Button>
      </div>
    )
  }

  const name = displayName(profile)
  const avgRating = metrics?.avg_rating ?? null
  const totalReviews = metrics?.total_reviews ?? 0
  const completedBookings = metrics?.total_completed_bookings ?? 0
  const travelersServed = metrics?.total_travelers_served ?? 0

  return (
    <div className="min-h-screen bg-background">
      {/* Back nav */}
      <div className="sticky top-0 z-30 border-b border-border/60 bg-background/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
          <Button variant="ghost" size="sm" className="rounded-2xl" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <span className="text-sm font-semibold text-foreground">{name}</span>
        </div>
      </div>

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-10">

        {/* ── Hero ── */}
        <GlassCard variant="card" className="relative overflow-hidden rounded-[2.5rem] border-none shadow-2xl shadow-primary/10">
          <div className="pointer-events-none absolute right-0 top-0 h-48 w-48 -translate-y-12 translate-x-12 rounded-full bg-primary/10 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-32 w-32 -translate-x-8 translate-y-8 rounded-full bg-primary/5 blur-3xl" />
          <GlassContent className="relative z-10 flex flex-col gap-6 p-8 sm:flex-row sm:items-start">
            {/* Logo */}
            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-border/60 bg-muted/30 shadow-xl">
              {profile.company_logo_url ? (
                <img
                  src={profile.company_logo_url}
                  alt={name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Building2 className="h-10 w-10 text-muted-foreground/50" />
              )}
            </div>

            {/* Name + meta */}
            <div className="flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-black text-foreground">{name}</h1>
                {profile.setup_completed && (
                  <Badge variant="secondary" className="flex items-center gap-1 rounded-full px-3 py-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    Verified Operator
                  </Badge>
                )}
              </div>

              {profile.primary_city && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{profile.primary_city}</span>
                </div>
              )}

              {avgRating !== null && avgRating > 0 ? (
                <StarBar rating={avgRating} count={totalReviews} />
              ) : (
                <p className="text-sm text-muted-foreground">No reviews yet</p>
              )}

              {profile.categories?.length ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {profile.categories.map((cat) => (
                    <Badge key={cat} variant="outline" className="rounded-full text-xs">
                      {cat}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </div>

            {/* CTA */}
            <div className="flex shrink-0 flex-col gap-2">
              <Button asChild className="rounded-2xl">
                <a href="#tours">View tours</a>
              </Button>
            </div>
          </GlassContent>
        </GlassCard>

        {/* ── Quick stats ── */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Avg Rating"           value={avgRating ? `${avgRating.toFixed(1)} ★` : '—'}  icon={Star} />
          <StatCard label="Reviews"              value={String(totalReviews)}        icon={Star} />
          <StatCard label="Completed Trips"      value={String(completedBookings)}   icon={CheckCircle2} />
          <StatCard label="Travelers Served"     value={String(travelersServed)}     icon={Users} />
        </div>

        {/* ── About ── */}
        {(profile.description || profile.coverage_range || profile.years_experience) ? (
          <GlassCard variant="card" className="rounded-3xl border-none shadow-xl">
            <GlassHeader>
              <GlassTitle className="text-2xl font-bold">About {name}</GlassTitle>
            </GlassHeader>
            <GlassContent className="space-y-4">
              {profile.description ? (
                <p className="text-base leading-relaxed text-muted-foreground whitespace-pre-line">
                  {profile.description}
                </p>
              ) : null}
              <div className="flex flex-wrap gap-6 pt-2 text-sm text-muted-foreground">
                {profile.coverage_range ? (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-primary/60" />
                    <span>{profile.coverage_range}</span>
                  </div>
                ) : null}
                {profile.years_experience ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary/60" />
                    <span>{profile.years_experience} years experience</span>
                  </div>
                ) : null}
                {profile.team_size ? (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary/60" />
                    <span>Team of {profile.team_size}</span>
                  </div>
                ) : null}
              </div>
            </GlassContent>
          </GlassCard>
        ) : null}

        {/* ── Tours ── */}
        {tours.length > 0 ? (
          <section id="tours">
            <GlassCard variant="card" className="rounded-3xl border-none shadow-xl">
              <GlassHeader>
                <GlassTitle className="text-2xl font-bold">Tours by {name}</GlassTitle>
              </GlassHeader>
              <GlassContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {tours.map((tour) => (
                    <Link
                      key={tour.id}
                      to={`/tours/${tour.id}`}
                      className="group overflow-hidden rounded-3xl border border-border/60 bg-background transition-all duration-300 hover:border-primary/30 hover:shadow-lg"
                    >
                      {tour.cover_image_url ? (
                        <img
                          src={tour.cover_image_url}
                          alt={tour.title}
                          className="h-40 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-40 items-center justify-center bg-muted/40 text-muted-foreground/30">
                          <Building2 className="h-10 w-10" />
                        </div>
                      )}
                      <div className="space-y-2 p-4">
                        <p className="text-sm font-semibold text-foreground line-clamp-2">{tour.title}</p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            {tour.currency} {Number(tour.price_per_person).toLocaleString()} / person
                          </span>
                          {tour.rating > 0 ? (
                            <span className="flex items-center gap-1 font-semibold text-amber-500">
                              <Star className="h-3 w-3 fill-current" />
                              {Number(tour.rating).toFixed(1)}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </GlassContent>
            </GlassCard>
          </section>
        ) : null}

        {/* ── Reviews ── */}
        {reviews.length > 0 ? (
          <GlassCard variant="card" className="rounded-3xl border-none shadow-xl">
            <GlassHeader>
              <GlassTitle className="text-2xl font-bold">
                Traveler reviews
                {avgRating && avgRating > 0 ? (
                  <span className="ml-3 text-base font-semibold text-muted-foreground">
                    {avgRating.toFixed(1)} ★ · {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
                  </span>
                ) : null}
              </GlassTitle>
            </GlassHeader>
            <GlassContent>
              <div className="space-y-5">
                {reviews.map((review) => (
                  <div key={review.id} className="rounded-2xl border border-border/60 bg-muted/20 p-5 space-y-3">
                    {/* Review header */}
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        T
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <Star
                              key={i}
                              className={`h-3.5 w-3.5 ${i <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {(review as any).tour_title ? `${(review as any).tour_title} · ` : ''}
                          {new Date(review.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    {review.title ? <p className="text-sm font-semibold text-foreground">{review.title}</p> : null}
                    {review.body ? <p className="text-sm text-muted-foreground leading-relaxed">{review.body}</p> : null}

                    {/* Operator reply */}
                    {review.reply ? (
                      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-1">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-3.5 w-3.5 text-primary/60" />
                          <p className="text-xs font-semibold uppercase tracking-widest text-primary/70">Operator reply</p>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{review.reply.body}</p>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </GlassContent>
          </GlassCard>
        ) : null}
      </main>
    </div>
  )
}
