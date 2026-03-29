import {
  ArrowLeft,
  Award,
  BadgeCheck,
  Building2,
  Camera,
  CheckCircle2,
  Clock,
  FileBadge2,
  Flag,
  Globe,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Share2,
  Shield,
  Star,
  Truck,
  UserCheck,
  Users,
  XCircle,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

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
  GlassCard,
  GlassContent,
  GlassHeader,
  GlassTitle,
} from '@/components/ui/glass'
import { Textarea } from '@/components/ui/textarea'
import { type TourReviewWithReply } from '@/features/booking/services/reviewService'
import {
  operatorPublicService,
  type OperatorPublicMetrics,
  type OperatorPublicProfile,
  type OperatorStorefrontResponseMetrics,
} from '@/features/tour-operator/services/operatorPublicService'
import type {
  OperatorAward,
  OperatorFleetAsset,
  OperatorGalleryItem,
  OperatorGuideProfile,
  OperatorPublicPolicies,
  OperatorVerificationBadge,
} from '@/features/tour-operator/types/operatorProfile'
import { useAuth } from '@/hooks/useAuth'

function parseAssets(value: OperatorFleetAsset[] | null | undefined): OperatorFleetAsset[] {
  if (!Array.isArray(value)) return []
  return value.filter((row) => row && (row.name || row.type || row.details))
}

function parseGuides(value: OperatorGuideProfile[] | null | undefined): OperatorGuideProfile[] {
  if (!Array.isArray(value)) return []
  return value.filter((row) => row && (row.name || row.bio || row.languages?.length || row.specialties?.length))
}

function parseGallery(value: OperatorGalleryItem[] | null | undefined): OperatorGalleryItem[] {
  if (!Array.isArray(value)) return []
  return value.filter((row) => row && row.url)
}

function parsePolicies(value: OperatorPublicPolicies | null | undefined): OperatorPublicPolicies {
  return {
    cancellation: value?.cancellation || '',
    deposit: value?.deposit || '',
    pickup: value?.pickup || '',
    child: value?.child || '',
    refund: value?.refund || '',
    weather: value?.weather || '',
    emergency: value?.emergency || '',
    supportHours: value?.supportHours || '',
  }
}

function formatYearsExperience(value: string | null | undefined): string {
  const trimmed = value?.trim()
  if (!trimmed) return ''
  return /years?/i.test(trimmed) ? trimmed : `${trimmed} years experience`
}

function formatTeamSize(value: string | null | undefined): string {
  const trimmed = value?.trim()
  if (!trimmed) return ''
  return /^team\s+of\b/i.test(trimmed) ? trimmed : `Team of ${trimmed}`
}

function createVerificationBadges(profile: OperatorPublicProfile): OperatorVerificationBadge[] {
  const verification = profile.verification_documents || {}
  const links = profile.verification_urls || null
  const guideProfiles = parseGuides(profile.guide_profiles)
  const fleetAssets = parseAssets(profile.fleet_assets)
  const badges: OperatorVerificationBadge[] = []

  if (verification.kycStatus === 'approved' || verification.kycVerifiedAt) {
    badges.push({
      id: 'identity-verified',
      label: 'Identity verified',
      tone: 'verified',
      description: 'Government identity verification has been approved by TripAvail.',
    })
  }

  if (verification.businessRegistrationVerified) {
    badges.push({
      id: 'business-registration-verified',
      label: 'Business registration verified',
      tone: 'verified',
      description: 'Business registration has been reviewed and confirmed by the admin team.',
    })
  } else if (profile.registration_number || links?.businessRegistration) {
    badges.push({
      id: 'business-registration-submitted',
      label: 'Business registration on file',
      tone: 'submitted',
      description: 'Business registration details are available for review.',
    })
  }

  if (verification.insuranceVerified) {
    badges.push({
      id: 'insurance-verified',
      label: 'Insurance verified',
      tone: 'verified',
      description: 'Insurance documents were reviewed and marked valid.',
    })
  } else if (links?.insurance) {
    badges.push({
      id: 'insurance-on-file',
      label: 'Insurance on file',
      tone: 'submitted',
      description: 'Insurance paperwork has been submitted for admin verification.',
    })
  }

  if (verification.vehicleDocsVerified) {
    badges.push({
      id: 'fleet-verified',
      label: 'Fleet docs verified',
      tone: 'verified',
      description: 'Vehicle documentation has been reviewed for listed fleet assets.',
    })
  } else if (links?.vehicleDocs || fleetAssets.length > 0) {
    badges.push({
      id: 'fleet-listed',
      label: 'Fleet details listed',
      tone: 'submitted',
      description: 'Transport resources are disclosed on the public profile.',
    })
  }

  if (verification.guideLicenseVerified) {
    badges.push({
      id: 'guide-license-verified',
      label: 'Guide credentials verified',
      tone: 'verified',
      description: 'Guide credentials have been reviewed by the admin team.',
    })
  } else if (links?.guideLicense || guideProfiles.some((guide) => guide.certifications.length > 0)) {
    badges.push({
      id: 'guide-credentials-listed',
      label: 'Guide credentials listed',
      tone: 'submitted',
      description: 'Guide certifications or licenses are included on the storefront.',
    })
  }

  if (profile.phone_number) {
    badges.push({
      id: 'phone-active',
      label: 'Support phone active',
      tone: 'basic',
      description: 'Travelers can reach the operator through a public phone line.',
    })
  }

  if (profile.email) {
    badges.push({
      id: 'email-active',
      label: 'Support email active',
      tone: 'basic',
      description: 'Travelers can send pre-booking questions through email.',
    })
  }

  return badges
}

function displayName(operator: OperatorPublicProfile): string {
  return operator.business_name?.trim() || operator.company_name?.trim() || 'Tour Operator'
}

function badgeToneClasses(tone: OperatorVerificationBadge['tone']): string {
  if (tone === 'verified') return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700'
  if (tone === 'submitted') return 'border-sky-500/20 bg-sky-500/10 text-sky-700'
  return 'border-border/60 bg-muted/40 text-foreground'
}

function badgeToneLabel(tone: OperatorVerificationBadge['tone']): string {
  if (tone === 'verified') return 'Verified'
  if (tone === 'submitted') return 'On file'
  return 'Public'
}

function awardDescription(award: OperatorAward): string {
  switch (award.award_code) {
    case 'top_rated':
      return 'Strong traveler satisfaction and sustained review quality.'
    case 'low_cancellation':
      return 'Reliable operational delivery with a low cancellation rate.'
    case 'verified_premium':
      return 'Multiple verified trust signals are active on this profile.'
    case 'trusted_fleet':
      return 'Fleet assets and vehicle documentation support transport confidence.'
    case 'review_ready':
      return 'Guide qualifications and reviews support experience quality.'
    case 'media_showcase':
      return 'The profile includes a strong gallery that helps travelers evaluate the operator.'
    default:
      return 'Recognition generated from current storefront and reputation signals.'
  }
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

function StatCard({ label, value, icon: Icon }: { label: string; value: string; icon: LucideIcon }) {
  return (
    <div className="rounded-3xl border border-border/60 bg-muted/30 p-5 text-center">
      <Icon className="mx-auto mb-2 h-6 w-6 text-primary/70" />
      <p className="text-2xl font-black text-foreground">{value}</p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
    </div>
  )
}

function CategoryBar({ label, value }: { label: string; value: number | null }) {
  if (value == null || value <= 0) return null
  const pct = (value / 5) * 100
  return (
    <div className="flex items-center gap-3">
      <span className="w-36 shrink-0 text-sm text-muted-foreground">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 shrink-0 text-right text-sm font-semibold text-foreground">{value.toFixed(1)}</span>
    </div>
  )
}

function RatingHistogram({ reviews }: { reviews: TourReviewWithReply[] }) {
  const counts = useMemo(() => {
    const result = [0, 0, 0, 0, 0]
    reviews.forEach((review) => {
      if (review.rating >= 1 && review.rating <= 5) result[review.rating - 1] += 1
    })
    return result
  }, [reviews])

  const max = Math.max(...counts, 1)

  return (
    <div className="space-y-1.5">
      {[5, 4, 3, 2, 1].map((star) => (
        <div key={star} className="flex items-center gap-2 text-xs">
          <span className="w-3 shrink-0 text-right text-muted-foreground">{star}</span>
          <Star className="h-3 w-3 shrink-0 fill-amber-400 text-amber-400" />
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-amber-400 transition-all"
              style={{ width: `${(counts[star - 1] / max) * 100}%` }}
            />
          </div>
          <span className="w-5 shrink-0 text-muted-foreground">{counts[star - 1]}</span>
        </div>
      ))}
    </div>
  )
}

function BadgeCard({ badge }: { badge: OperatorVerificationBadge }) {
  const Icon = badge.tone === 'verified' ? BadgeCheck : badge.tone === 'submitted' ? FileBadge2 : Shield
  return (
    <div className={`rounded-3xl border p-4 ${badgeToneClasses(badge.tone)}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-background/80 p-2">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold">{badge.label}</p>
            <p className="text-xs opacity-75">{badge.description}</p>
          </div>
        </div>
        <Badge variant="outline" className="rounded-full border-current/20 bg-background/70 text-[10px] uppercase tracking-widest">
          {badgeToneLabel(badge.tone)}
        </Badge>
      </div>
    </div>
  )
}

function FleetCard({ asset }: { asset: OperatorFleetAsset }) {
  return (
    <div className="rounded-3xl border border-border/60 bg-muted/20 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-primary/70">{asset.type || 'Asset'}</p>
          <p className="mt-1 text-lg font-bold text-foreground">{asset.name || 'Listed asset'}</p>
        </div>
        <Truck className="h-6 w-6 text-primary/70" />
      </div>
      <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span className="rounded-full border border-border/60 bg-background px-3 py-1">Qty {asset.quantity}</span>
        {asset.capacity ? <span className="rounded-full border border-border/60 bg-background px-3 py-1">Capacity {asset.capacity}</span> : null}
      </div>
      {asset.details ? <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{asset.details}</p> : null}
    </div>
  )
}

function GuideCard({ guide }: { guide: OperatorGuideProfile }) {
  return (
    <div className="rounded-3xl border border-border/60 bg-muted/20 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-lg font-bold text-foreground">{guide.name || 'Guide profile'}</p>
          {guide.yearsExperience != null ? <p className="text-sm text-muted-foreground">{guide.yearsExperience} years experience</p> : null}
        </div>
        <UserCheck className="h-6 w-6 text-primary/70" />
      </div>
      {guide.languages.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {guide.languages.map((language) => (
            <Badge key={language} variant="outline" className="rounded-full text-xs">
              {language}
            </Badge>
          ))}
        </div>
      ) : null}
      {guide.specialties.length > 0 ? <p className="mt-4 text-sm text-muted-foreground"><span className="font-semibold text-foreground">Specialties:</span> {guide.specialties.join(', ')}</p> : null}
      {guide.certifications.length > 0 ? <p className="mt-2 text-sm text-muted-foreground"><span className="font-semibold text-foreground">Certifications:</span> {guide.certifications.join(', ')}</p> : null}
      {guide.bio ? <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{guide.bio}</p> : null}
    </div>
  )
}

function PolicyCard({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-border/60 bg-muted/20 p-5">
      <div className="mb-3 flex items-center gap-3">
        <div className="rounded-2xl bg-primary/10 p-2">
          <Icon className="h-4 w-4 text-primary/70" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">{value}</p>
    </div>
  )
}

function AwardCard({ award }: { award: OperatorAward }) {
  return (
    <div className="rounded-3xl border border-amber-500/20 bg-amber-500/5 p-5">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl bg-amber-400/15 p-2 text-amber-700">
          <Award className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-bold text-foreground">{award.award_name}</p>
          <p className="text-sm leading-relaxed text-muted-foreground">{awardDescription(award)}</p>
          <p className="text-xs font-medium uppercase tracking-widest text-amber-700/80">
            Awarded {new Date(award.awarded_at).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function OperatorProfilePage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [profile, setProfile] = useState<OperatorPublicProfile | null>(null)
  const [metrics, setMetrics] = useState<OperatorPublicMetrics | null>(null)
  const [responseMetrics, setResponseMetrics] = useState<OperatorStorefrontResponseMetrics | null>(null)
  const [tours, setTours] = useState<any[]>([])
  const [reviews, setReviews] = useState<TourReviewWithReply[]>([])
  const [awards, setAwards] = useState<OperatorAward[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [starFilter, setStarFilter] = useState<number | null>(null)
  const [reviewSort, setReviewSort] = useState<'newest' | 'top_rated'>('newest')
  const [reportDialogOpen, setReportDialogOpen] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportSubmitting, setReportSubmitting] = useState(false)

  const trackStorefrontEvent = (
    eventType: 'profile_view' | 'cta_click' | 'tour_click',
    options?: { tourId?: string; metadata?: Record<string, unknown> },
  ) => {
    if (!profile) return

    void operatorPublicService.recordStorefrontEvent({
      operatorId: profile.user_id,
      eventType,
      slug,
      tourId: options?.tourId,
      metadata: options?.metadata,
    }).catch((error) => {
      console.error('Storefront analytics error:', error)
    })
  }

  useEffect(() => {
    if (!slug) return

    const load = async () => {
      setLoading(true)
      setNotFound(false)
      try {
        const currentProfile = await operatorPublicService.getProfileBySlug(slug)
        if (!currentProfile) {
          setNotFound(true)
          return
        }

        setProfile(currentProfile)

        const [currentMetrics, currentTours, currentReviews, currentAwards, currentResponseMetrics] = await Promise.all([
          operatorPublicService.getMetrics(currentProfile.user_id),
          operatorPublicService.getPublishedTours(currentProfile.user_id),
          operatorPublicService.getAllReviewsWithReplies(currentProfile.user_id),
          operatorPublicService.getAwards(currentProfile.user_id),
          operatorPublicService.getStorefrontResponseMetrics(currentProfile.user_id),
        ])

        setMetrics(currentMetrics)
        setTours(currentTours)
        setReviews(currentReviews)
        setAwards(currentAwards)
        setResponseMetrics(currentResponseMetrics)
      } catch (error) {
        console.error('OperatorProfilePage load error:', error)
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [slug])

  useEffect(() => {
    if (!profile || !slug || typeof window === 'undefined') return

    const viewKey = `tripavail.operator-profile-viewed.${slug}`
    if (window.sessionStorage.getItem(viewKey) === '1') return

    window.sessionStorage.setItem(viewKey, '1')
    trackStorefrontEvent('profile_view', {
      metadata: {
        source: document.referrer || null,
      },
    })
  }, [profile, slug])

  const filteredReviews = useMemo(() => {
    let result = starFilter == null ? reviews : reviews.filter((review) => review.rating === starFilter)
    if (reviewSort === 'newest') {
      result = [...result].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    } else {
      result = [...result].sort((a, b) => b.rating - a.rating)
    }
    return result
  }, [reviews, starFilter, reviewSort])

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
  const fleetAssets = parseAssets(profile.fleet_assets)
  const guideProfiles = parseGuides(profile.guide_profiles)
  const galleryMedia = parseGallery(profile.gallery_media)
  const publicPolicies = parsePolicies(profile.public_policies)
  const verificationBadges = createVerificationBadges(profile)
  const activePolicies = [
    { key: 'cancellation', label: 'Cancellation policy', icon: Shield, value: publicPolicies.cancellation },
    { key: 'deposit', label: 'Deposit policy', icon: CheckCircle2, value: publicPolicies.deposit },
    { key: 'pickup', label: 'Pickup rules', icon: MapPin, value: publicPolicies.pickup },
    { key: 'child', label: 'Child policy', icon: Users, value: publicPolicies.child },
    { key: 'refund', label: 'Refund policy', icon: FileBadge2, value: publicPolicies.refund },
    { key: 'weather', label: 'Weather disruption', icon: Globe, value: publicPolicies.weather },
    { key: 'emergency', label: 'Emergency contact', icon: Shield, value: publicPolicies.emergency },
    { key: 'supportHours', label: 'Support hours', icon: Mail, value: publicPolicies.supportHours },
  ].filter((row) => row.value.trim().length > 0)
  const categoryScores = [
    { label: 'Communication', value: metrics?.avg_communication ?? null },
    { label: 'Punctuality', value: metrics?.avg_punctuality ?? null },
    { label: 'Transport', value: metrics?.avg_transport ?? null },
    { label: 'Guide quality', value: metrics?.avg_guide ?? null },
    { label: 'Safety', value: metrics?.avg_safety ?? null },
    { label: 'Cleanliness', value: metrics?.avg_cleanliness ?? null },
    { label: 'Value', value: metrics?.avg_value ?? null },
    { label: 'Itinerary', value: metrics?.avg_itinerary ?? null },
  ].filter((row) => row.value != null && row.value > 0)

  const handleShareProfile = async () => {
    if (typeof window === 'undefined') return

    const shareUrl = window.location.href
    trackStorefrontEvent('cta_click', { metadata: { cta: 'share_profile' } })

    if (navigator.share) {
      try {
        await navigator.share({
          title: name,
          text: `View ${name} on TripAvail.`,
          url: shareUrl,
        })
        return
      } catch {
        // Fall back to clipboard below.
      }
    }

    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(shareUrl)
    }
  }

  const handleSubmitReport = async () => {
    if (!profile) return

    if (!user) {
      navigate(
        '/auth?mode=signup&notice=report&redirect=' +
          encodeURIComponent(window.location.pathname + window.location.search),
      )
      return
    }

    const trimmedReason = reportReason.trim()
    if (!trimmedReason) return

    try {
      setReportSubmitting(true)
      await operatorPublicService.submitOperatorReport({ operatorId: profile.user_id, reason: trimmedReason })
      trackStorefrontEvent('cta_click', { metadata: { cta: 'report_operator' } })
      setReportDialogOpen(false)
      setReportReason('')
    } finally {
      setReportSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background pb-28 lg:pb-10">
      <div className="glass-liquid sticky top-0 z-30 border-b border-border/50">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
          <Button variant="ghost" size="sm" className="rounded-2xl" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <span className="text-sm font-semibold text-foreground">{name}</span>
        </div>
      </div>

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-10">
        <GlassCard variant="card" className="relative overflow-hidden rounded-[2.5rem] border-none shadow-2xl shadow-primary/10">
          <div className="pointer-events-none absolute right-0 top-0 h-48 w-48 -translate-y-12 translate-x-12 rounded-full bg-primary/10 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-32 w-32 -translate-x-8 translate-y-8 rounded-full bg-primary/5 blur-3xl" />
          <GlassContent className="relative z-10 flex flex-col gap-6 p-8 sm:flex-row sm:items-start">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-border/60 bg-muted/30 shadow-xl">
              {profile.company_logo_url ? (
                <img src={profile.company_logo_url} alt={name} className="h-full w-full object-cover" />
              ) : (
                <Building2 className="h-10 w-10 text-muted-foreground/50" />
              )}
            </div>

            <div className="flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-black text-foreground">{name}</h1>
                {profile.setup_completed ? (
                  <Badge variant="secondary" className="flex items-center gap-1 rounded-full px-3 py-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    Verified Operator
                  </Badge>
                ) : null}
                {metrics?.verified_badge_count ? (
                  <Badge variant="outline" className="rounded-full border-emerald-500/20 bg-emerald-500/10 text-emerald-700">
                    {metrics.verified_badge_count} trust badge{metrics.verified_badge_count === 1 ? '' : 's'}
                  </Badge>
                ) : null}
              </div>

              {profile.primary_city ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{profile.primary_city}</span>
                </div>
              ) : null}

              {avgRating != null && avgRating > 0 ? <StarBar rating={avgRating} count={totalReviews} /> : <p className="text-sm text-muted-foreground">No reviews yet</p>}

              {responseMetrics ? (
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1">
                    <Clock className="h-4 w-4 text-primary/70" />
                    Replies to {Math.round(responseMetrics.response_rate ?? 0)}% of traveler messages
                  </span>
                  <span>
                    {responseMetrics.avg_response_minutes != null
                      ? `Usually replies in about ${Math.round(responseMetrics.avg_response_minutes)} min`
                      : 'Reply time will appear once travelers start messaging'}
                  </span>
                </div>
              ) : null}

              {profile.categories?.length ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {profile.categories.map((category) => (
                    <Badge key={category} variant="outline" className="rounded-full text-xs">
                      {category}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="hidden shrink-0 flex-col gap-2 lg:flex">
              <Button asChild className="rounded-2xl">
                <a
                  href="#tours"
                  onClick={() => trackStorefrontEvent('cta_click', { metadata: { cta: 'hero_view_tours' } })}
                >
                  View tours
                </a>
              </Button>
              <Button type="button" variant="outline" className="rounded-2xl" onClick={() => void handleShareProfile()}>
                <Share2 className="mr-2 h-4 w-4" /> Share profile
              </Button>
              {profile.phone_number ? (
                <Button asChild variant="outline" className="rounded-2xl">
                  <a
                    href={`tel:${profile.phone_number}`}
                    onClick={() => trackStorefrontEvent('cta_click', { metadata: { cta: 'hero_call_operator' } })}
                  >
                    Call operator
                  </a>
                </Button>
              ) : null}
              <Button type="button" variant="outline" className="rounded-2xl" onClick={() => setReportDialogOpen(true)}>
                <Flag className="mr-2 h-4 w-4" /> Report a concern
              </Button>
            </div>
          </GlassContent>
        </GlassCard>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-8">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 xl:grid-cols-5">
              <StatCard label="Avg Rating" value={avgRating ? `${avgRating.toFixed(1)} ★` : '—'} icon={Star} />
              <StatCard label="Reviews" value={String(totalReviews)} icon={Star} />
              <StatCard label="Completed Trips" value={String(completedBookings)} icon={CheckCircle2} />
              <StatCard label="Travelers Served" value={String(travelersServed)} icon={Users} />
              {metrics?.cancellation_rate != null && (
                <StatCard label="Cancellation Rate" value={`${metrics.cancellation_rate.toFixed(0)}%`} icon={XCircle} />
              )}
            </div>

            {(profile.description || profile.coverage_range || profile.years_experience) ? (
              <GlassCard variant="card" className="rounded-3xl border-none shadow-xl">
                <GlassHeader>
                  <GlassTitle className="text-2xl font-bold">About {name}</GlassTitle>
                </GlassHeader>
                <GlassContent className="space-y-4">
                  {profile.description ? <p className="whitespace-pre-line text-base leading-relaxed text-muted-foreground">{profile.description}</p> : null}
                  <div className="flex flex-wrap gap-6 pt-2 text-sm text-muted-foreground">
                    {profile.coverage_range ? <div className="flex items-center gap-2"><Globe className="h-4 w-4 text-primary/60" /><span>{profile.coverage_range}</span></div> : null}
                    {profile.years_experience ? <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary/60" /><span>{formatYearsExperience(profile.years_experience)}</span></div> : null}
                    {profile.team_size ? <div className="flex items-center gap-2"><Users className="h-4 w-4 text-primary/60" /><span>{formatTeamSize(profile.team_size)}</span></div> : null}
                  </div>
                </GlassContent>
              </GlassCard>
            ) : null}

            {galleryMedia.length > 0 ? (
              <GlassCard variant="card" className="rounded-3xl border-none shadow-xl">
                <GlassHeader>
                  <GlassTitle className="text-2xl font-bold">Gallery & media</GlassTitle>
                </GlassHeader>
                <GlassContent>
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {galleryMedia.map((item) => (
                      <div key={item.id} className="overflow-hidden rounded-3xl border border-border/60 bg-muted/20">
                        <div className="aspect-[4/3] overflow-hidden bg-muted/40">
                          <img src={item.url} alt={item.title || name} className="h-full w-full object-cover" loading="lazy" />
                        </div>
                        <div className="space-y-2 p-4">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-foreground">{item.title || 'Operator media'}</p>
                            <Badge variant="outline" className="rounded-full text-[10px] uppercase tracking-widest">{item.category}</Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </GlassContent>
              </GlassCard>
            ) : null}

            {awards.length > 0 ? (
              <GlassCard variant="card" className="rounded-3xl border-none shadow-xl">
                <GlassHeader>
                  <GlassTitle className="text-2xl font-bold">Awards & recognition</GlassTitle>
                </GlassHeader>
                <GlassContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    {awards.map((award) => (
                      <AwardCard key={award.id} award={award} />
                    ))}
                  </div>
                </GlassContent>
              </GlassCard>
            ) : null}

            {verificationBadges.length > 0 ? (
              <GlassCard variant="card" className="rounded-3xl border-none shadow-xl">
                <GlassHeader>
                  <GlassTitle className="text-2xl font-bold">Why travelers trust this operator</GlassTitle>
                </GlassHeader>
                <GlassContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    {verificationBadges.map((badge) => (
                      <BadgeCard key={badge.id} badge={badge} />
                    ))}
                  </div>
                </GlassContent>
              </GlassCard>
            ) : null}

            {(fleetAssets.length > 0 || guideProfiles.length > 0) ? (
              <GlassCard variant="card" className="rounded-3xl border-none shadow-xl">
                <GlassHeader>
                  <GlassTitle className="text-2xl font-bold">Fleet & guide capability</GlassTitle>
                </GlassHeader>
                <GlassContent className="space-y-8">
                  {fleetAssets.length > 0 ? (
                    <section className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Truck className="h-5 w-5 text-primary/70" />
                        <h3 className="text-lg font-semibold text-foreground">Fleet and transport resources</h3>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {fleetAssets.map((asset) => (
                          <FleetCard key={asset.id} asset={asset} />
                        ))}
                      </div>
                    </section>
                  ) : null}

                  {guideProfiles.length > 0 ? (
                    <section className="space-y-4">
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-5 w-5 text-primary/70" />
                        <h3 className="text-lg font-semibold text-foreground">Guide team</h3>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        {guideProfiles.map((guide) => (
                          <GuideCard key={guide.id} guide={guide} />
                        ))}
                      </div>
                    </section>
                  ) : null}
                </GlassContent>
              </GlassCard>
            ) : null}

            {activePolicies.length > 0 ? (
              <GlassCard variant="card" className="rounded-3xl border-none shadow-xl">
                <GlassHeader>
                  <GlassTitle className="text-2xl font-bold">Policies & business standards</GlassTitle>
                </GlassHeader>
                <GlassContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    {activePolicies.map((policy) => (
                      <PolicyCard key={policy.key} icon={policy.icon} label={policy.label} value={policy.value} />
                    ))}
                  </div>
                </GlassContent>
              </GlassCard>
            ) : null}

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
                          onClick={() => trackStorefrontEvent('tour_click', { tourId: tour.id, metadata: { title: tour.title } })}
                          className="group overflow-hidden rounded-3xl border border-border/60 bg-background transition-all duration-300 hover:border-primary/30 hover:shadow-lg"
                        >
                          {tour.cover_image_url ? (
                            <img src={tour.cover_image_url} alt={tour.title} className="h-40 w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                          ) : (
                            <div className="flex h-40 items-center justify-center bg-muted/40 text-muted-foreground/30">
                              <Building2 className="h-10 w-10" />
                            </div>
                          )}
                          <div className="space-y-2 p-4">
                            <p className="line-clamp-2 text-sm font-semibold text-foreground">{tour.title}</p>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>{tour.currency} {Number(tour.price_per_person).toLocaleString()} / person</span>
                              {tour.rating > 0 ? <span className="flex items-center gap-1 font-semibold text-amber-500"><Star className="h-3 w-3 fill-current" />{Number(tour.rating).toFixed(1)}</span> : null}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </GlassContent>
                </GlassCard>
              </section>
            ) : null}

            {reviews.length > 0 ? (
              <GlassCard variant="card" className="rounded-3xl border-none shadow-xl">
                <GlassHeader>
                  <GlassTitle className="text-2xl font-bold">Traveler reviews</GlassTitle>
                </GlassHeader>
                <GlassContent className="space-y-6">
                  <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
                    <div className="space-y-4 rounded-3xl border border-border/60 bg-muted/20 p-5">
                      {avgRating != null && avgRating > 0 ? <StarBar rating={avgRating} count={totalReviews} /> : null}
                      <RatingHistogram reviews={reviews} />
                      <div className="space-y-2 pt-2">
                        {categoryScores.map((score) => (
                          <CategoryBar key={score.label} label={score.label} value={score.value} />
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-2 pt-3">
                        <Button size="sm" variant={starFilter == null ? 'default' : 'outline'} onClick={() => setStarFilter(null)}>All</Button>
                        {[5, 4, 3, 2, 1].map((star) => (
                          <Button key={star} size="sm" variant={starFilter === star ? 'default' : 'outline'} onClick={() => setStarFilter(star)}>
                            {star}★
                          </Button>
                        ))}
                      </div>
                      <div className="flex gap-2 border-t border-border/40 pt-3">
                        <Button size="sm" variant={reviewSort === 'newest' ? 'default' : 'outline'} onClick={() => setReviewSort('newest')}>Newest</Button>
                        <Button size="sm" variant={reviewSort === 'top_rated' ? 'default' : 'outline'} onClick={() => setReviewSort('top_rated')}>Top Rated</Button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {filteredReviews.map((review) => (
                        <div key={review.id} className="space-y-3 rounded-2xl border border-border/60 bg-muted/20 p-5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">T</div>
                            <div className="space-y-0.5">
                              <div className="flex gap-0.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star key={star} className={`h-3.5 w-3.5 ${star <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`} />
                                ))}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {(review as any).tour_title ? `${(review as any).tour_title} · ` : ''}
                                {new Date(review.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                              </p>
                            </div>
                          </div>

                          {review.title ? <p className="text-sm font-semibold text-foreground">{review.title}</p> : null}
                          {review.body ? <p className="text-sm leading-relaxed text-muted-foreground">{review.body}</p> : null}

                          {review.reply ? (
                            <div className="space-y-1 rounded-2xl border border-primary/20 bg-primary/5 p-4">
                              <div className="flex items-center gap-2">
                                <MessageSquare className="h-3.5 w-3.5 text-primary/60" />
                                <p className="text-xs font-semibold uppercase tracking-widest text-primary/70">Operator reply</p>
                              </div>
                              <p className="text-sm leading-relaxed text-muted-foreground">{review.reply.body}</p>
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                </GlassContent>
              </GlassCard>
            ) : null}
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-4">
              <GlassCard variant="card" className="rounded-3xl border-none shadow-xl">
                <GlassContent className="space-y-4 p-6">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-primary/70">Ready to book?</p>
                    <h2 className="mt-2 text-2xl font-black text-foreground">Start with this operator</h2>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      Review tours, contact the operator directly, and compare trust signals before committing.
                    </p>
                  </div>
                  <Button asChild className="w-full rounded-2xl">
                    <a
                      href="#tours"
                      onClick={() => trackStorefrontEvent('cta_click', { metadata: { cta: 'sticky_browse_tours' } })}
                    >
                      Browse tours
                    </a>
                  </Button>
                  <Button type="button" variant="outline" className="w-full rounded-2xl" onClick={() => void handleShareProfile()}>
                    <Share2 className="mr-2 h-4 w-4" /> Share profile
                  </Button>
                  {profile.phone_number ? (
                    <Button asChild variant="outline" className="w-full rounded-2xl">
                      <a
                        href={`tel:${profile.phone_number}`}
                        onClick={() => trackStorefrontEvent('cta_click', { metadata: { cta: 'sticky_call_operator' } })}
                      >
                        <Phone className="mr-2 h-4 w-4" /> Call operator
                      </a>
                    </Button>
                  ) : null}
                  {profile.email ? (
                    <Button asChild variant="outline" className="w-full rounded-2xl">
                      <a
                        href={`mailto:${profile.email}`}
                        onClick={() => trackStorefrontEvent('cta_click', { metadata: { cta: 'sticky_email_operator' } })}
                      >
                        <Mail className="mr-2 h-4 w-4" /> Email operator
                      </a>
                    </Button>
                  ) : null}
                  <Button type="button" variant="outline" className="w-full rounded-2xl" onClick={() => setReportDialogOpen(true)}>
                    <Flag className="mr-2 h-4 w-4" /> Report a concern
                  </Button>
                </GlassContent>
              </GlassCard>

              <GlassCard variant="card" className="rounded-3xl border-none shadow-xl">
                <GlassContent className="space-y-3 p-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <BadgeCheck className="h-4 w-4 text-emerald-600" />
                    <span>{verificationBadges.filter((badge) => badge.tone === 'verified').length} verified signals</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Camera className="h-4 w-4 text-primary/70" />
                    <span>{galleryMedia.length} gallery items</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Award className="h-4 w-4 text-amber-600" />
                    <span>{awards.length} active awards</span>
                  </div>
                </GlassContent>
              </GlassCard>
            </div>
          </aside>
        </div>
      </main>

      <div className="glass-liquid fixed inset-x-0 bottom-0 z-40 border-t border-border/50 p-4 rounded-t-2xl lg:hidden">
        <div className="mx-auto flex max-w-6xl gap-3">
          <Button asChild className="flex-1 rounded-2xl">
            <a
              href="#tours"
              onClick={() => trackStorefrontEvent('cta_click', { metadata: { cta: 'mobile_browse_tours' } })}
            >
              Browse tours
            </a>
          </Button>
          <Button type="button" variant="outline" className="rounded-2xl" onClick={() => void handleShareProfile()}>
            <Share2 className="h-4 w-4" />
          </Button>
          <Button type="button" variant="outline" className="rounded-2xl" onClick={() => setReportDialogOpen(true)}>
            <Flag className="h-4 w-4" />
          </Button>
          {profile.phone_number ? (
            <Button asChild variant="outline" className="rounded-2xl">
              <a
                href={`tel:${profile.phone_number}`}
                onClick={() => trackStorefrontEvent('cta_click', { metadata: { cta: 'mobile_call_operator' } })}
              >
                <Phone className="h-4 w-4" />
              </a>
            </Button>
          ) : null}
        </div>
      </div>

      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report a concern</DialogTitle>
            <DialogDescription>
              Tell TripAvail what feels misleading, unsafe, or concerning and the team will review it.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={reportReason}
            onChange={(event) => setReportReason(event.target.value)}
            placeholder="Describe what happened or what feels concerning."
            className="min-h-[120px]"
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setReportDialogOpen(false)} disabled={reportSubmitting}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void handleSubmitReport()} disabled={reportSubmitting || reportReason.trim().length < 10}>
              {reportSubmitting ? 'Sending…' : 'Send concern'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
