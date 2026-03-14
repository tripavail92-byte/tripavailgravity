import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Camera,
  Check,
  ClipboardList,
  Globe,
  Heart,
  Loader2,
  MapPin,
  Navigation,
  Minus,
  Share2,
  Shield,
  Sparkles,
  Star,
  Plus,
  Users,
  X,
} from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { TourPickupLocation } from '@tripavail/shared/types/tourPickup'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import {
  GlassBadge,
  GlassButton,
  GlassCard,
  GlassContent,
  GlassHeader,
  GlassTitle,
} from '@/components/ui/glass'
import { tourBookingService } from '@/features/booking'
import {
  CANCELLATION_ICON_BY_POLICY,
  getTourIconComponent,
  TourFeatureItem,
} from '@/features/tour-operator/assets/TourIconRegistry'
import { Tour, TourSchedule, tourService } from '@/features/tour-operator/services/tourService'
import { groupTourRequirementsByCategory } from '@/config/tourRequirements'

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''

function isValidLatLng(lat: number, lng: number) {
  return Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
}

function buildStaticMapPreviewUrl(lat: number, lng: number) {
  if (!GOOGLE_MAPS_API_KEY || !isValidLatLng(lat, lng)) return null

  const params = new URLSearchParams({
    center: `${lat},${lng}`,
    zoom: '14',
    size: '640x320',
    scale: '2',
    maptype: 'roadmap',
    markers: `color:0x0f766e|${lat},${lng}`,
    key: GOOGLE_MAPS_API_KEY,
  })

  return `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`
}

function buildGoogleDirectionsUrl(lat: number, lng: number) {
  if (!isValidLatLng(lat, lng)) return null

  const params = new URLSearchParams({
    api: '1',
    destination: `${lat},${lng}`,
    travelmode: 'driving',
  })

  return `https://www.google.com/maps/dir/?${params.toString()}`
}

function formatPickupTime(value: string | null | undefined) {
  if (!value) return null
  const normalized = value.length === 5 ? `${value}:00` : value
  const parsed = new Date(`1970-01-01T${normalized}`)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function useCountUp(target: number, duration = 320) {
  const safeTarget = Number.isFinite(target) ? target : 0
  const [value, setValue] = useState(safeTarget)
  const currentValueRef = useRef(safeTarget)

  useEffect(() => {
    const startValue = currentValueRef.current
    const delta = safeTarget - startValue

    if (delta === 0) {
      setValue(safeTarget)
      return
    }

    let rafId = 0
    const startTime = performance.now()

    const tick = (now: number) => {
      const progress = Math.min(1, (now - startTime) / duration)
      const eased = 1 - Math.pow(1 - progress, 3)
      const nextValue = Math.round(startValue + delta * eased)
      currentValueRef.current = nextValue
      setValue(nextValue)

      if (progress < 1) {
        rafId = requestAnimationFrame(tick)
      }
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [safeTarget, duration])

  useEffect(() => {
    currentValueRef.current = value
  }, [value])

  return value
}

function useValuePulse(value: number, duration = 260) {
  const [pulsing, setPulsing] = useState(false)

  useEffect(() => {
    setPulsing(true)
    const timer = setTimeout(() => setPulsing(false), duration)
    return () => clearTimeout(timer)
  }, [value, duration])

  return pulsing
}

export default function TourDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [tour, setTour] = useState<Tour | null>(null)
  const [schedule, setSchedule] = useState<TourSchedule | null>(null)
  const [availableSlots, setAvailableSlots] = useState<number | null>(null)
  const [selectedSeats, setSelectedSeats] = useState(1)
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTourDetails = async () => {
      if (!id) return
      try {
        // Fetch tour
        const foundTour = await tourService.getTourById(id)
        setTour(foundTour || null)

        if (foundTour) {
          // Fetch schedule for this tour
          // IMPORTANT: Use foundTour.id (UUID) instead of id (which might be a slug)
          const tourSchedules = await tourService.getTourSchedules(foundTour.id)
          const mainSchedule = tourSchedules[0] || null
          setSchedule(mainSchedule)

          // Fetch available slots for this schedule
          if (mainSchedule) {
            try {
              const slots = await tourBookingService.getAvailableSlots(mainSchedule.id)
              setAvailableSlots(slots)
            } catch (slotError) {
              console.error('Error fetching available slots:', slotError)
              setAvailableSlots(0)
            }
          }
        }
      } catch (error) {
        console.error('Error fetching tour details:', error)
        setTour(null)
      } finally {
        setLoading(false)
      }
    }

    fetchTourDetails()
  }, [id])

  const handleBookNow = () => {
    if (!tour?.id) return
    const guests = Math.max(1, selectedSeats)
    navigate(`/checkout/tour/${tour.id || id}?guests=${guests}&autostart=1`)
  }

  const handleOpenBookingDialog = () => {
    if (!tour?.id) return
    if (schedule && availableSlots === 0) return
    if (!schedule) return
    setIsBookingDialogOpen(true)
  }

  const handleBookFromDialog = () => {
    setIsBookingDialogOpen(false)
    handleBookNow()
  }

  const maxSelectableSeats = Math.max(1, availableSlots ?? schedule?.capacity ?? 1)

  useEffect(() => {
    setSelectedSeats((prev) => Math.min(prev, maxSelectableSeats))
  }, [maxSelectableSeats])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const formatMoney = (value: number) => {
    const normalized = Number.isFinite(value) ? value : 0
    return new Intl.NumberFormat('en-PK').format(normalized)
  }

  const cancellationPolicy = (tour?.cancellation_policy || 'flexible') as
    | 'flexible'
    | 'moderate'
    | 'strict'
    | 'non-refundable'

  const cancellationMeta = {
    flexible: {
      iconKey: CANCELLATION_ICON_BY_POLICY.flexible,
      title: 'Free Cancellation',
      description: 'Cancel up to 48 hours before departure.',
    },
    moderate: {
      iconKey: CANCELLATION_ICON_BY_POLICY.moderate,
      title: 'Moderate Cancellation',
      description: 'Cancel up to 5 days before departure for free.',
    },
    strict: {
      iconKey: CANCELLATION_ICON_BY_POLICY.strict,
      title: 'Strict Cancellation',
      description: '50% refund if cancelled 14 days before departure.',
    },
    'non-refundable': {
      iconKey: CANCELLATION_ICON_BY_POLICY['non-refundable'],
      title: 'Non-Refundable',
      description: 'No refund after booking confirmation.',
    },
  }[cancellationPolicy]

  const CancellationPolicyIcon = getTourIconComponent(cancellationMeta.iconKey)
  const includedFeatures =
    (Array.isArray((tour as any)?.included_features) && (tour as any)?.included_features.length > 0
      ? (((tour as any)?.included_features as TourFeatureItem[]) || [])
      : []) || []
  const excludedFeatures =
    (Array.isArray((tour as any)?.excluded_features) && (tour as any)?.excluded_features.length > 0
      ? (((tour as any)?.excluded_features as TourFeatureItem[]) || [])
      : []) || []
  const includedItems =
    (Array.isArray(tour?.inclusions) && tour.inclusions.length > 0
      ? tour.inclusions
      : Array.isArray((tour as any)?.included)
        ? (((tour as any)?.included as string[]) || [])
        : []) || []
  const excludedItems =
    (Array.isArray(tour?.exclusions) && tour.exclusions.length > 0
      ? tour.exclusions
      : Array.isArray((tour as any)?.excluded)
        ? (((tour as any)?.excluded as string[]) || [])
        : []) || []
  const basePrice = Number((tour as any)?.base_price ?? tour?.price ?? 0) || 0
  const depositPercentage = Math.max(0, Math.min(50, tour?.deposit_percentage || 0))
  const requiresDeposit = Boolean(tour?.deposit_required)
  const payToday = requiresDeposit ? Math.round((basePrice * depositPercentage) / 100) : basePrice
  const groupPricingTiers = Array.isArray(tour?.pricing_tiers)
    ? [...tour.pricing_tiers]
        .map((tier: any, index: number) => ({
          key: `${tier?.id || tier?.name || 'tier'}-${index}`,
          name: tier?.name || `Tier ${index + 1}`,
          minPeople: Number(tier?.minPeople || 1),
          maxPeople: Number(tier?.maxPeople || 0),
          pricePerPerson: Number(tier?.pricePerPerson || 0),
        }))
        .filter((tier: any) => tier.pricePerPerson > 0)
        .sort((a: any, b: any) => a.minPeople - b.minPeople)
    : []
  const rangeMatchedTier = groupPricingTiers
    .filter((tier: any) => {
      const meetsMin = selectedSeats >= tier.minPeople
      const withinMax = tier.maxPeople > 0 ? selectedSeats <= tier.maxPeople : true
      return meetsMin && withinMax
    })
    .sort((a: any, b: any) => b.minPeople - a.minPeople)[0]
  const fallbackThresholdTier = groupPricingTiers
    .filter((tier: any) => selectedSeats >= tier.minPeople)
    .sort((a: any, b: any) => b.minPeople - a.minPeople)[0]
  const activeGroupTier = rangeMatchedTier || fallbackThresholdTier
  const effectiveUnitPrice = activeGroupTier?.pricePerPerson || basePrice
  const liveTotalPrice = effectiveUnitPrice * selectedSeats
  const standardTotalPrice = basePrice * selectedSeats
  const currentSavingsPerPerson = Math.max(0, basePrice - effectiveUnitPrice)
  const currentTotalSavings = Math.max(0, standardTotalPrice - liveTotalPrice)
  const nextGroupTier = groupPricingTiers
    .filter((tier: any) => tier.minPeople > selectedSeats)
    .sort((a: any, b: any) => a.minPeople - b.minPeople)[0]
  const seatsToNextTier = nextGroupTier ? Math.max(0, nextGroupTier.minPeople - selectedSeats) : 0
  const seatsCountedTowardNextTier = nextGroupTier
    ? Math.min(selectedSeats, nextGroupTier.minPeople)
    : selectedSeats
  const nextTierExtraSavingsPerPerson = nextGroupTier
    ? Math.max(0, effectiveUnitPrice - nextGroupTier.pricePerPerson)
    : 0
  const nextTierTotalSavingsAtUnlock = nextGroupTier
    ? Math.max(0, (basePrice - nextGroupTier.pricePerPerson) * nextGroupTier.minPeople)
    : 0
  const animatedLiveTotalPrice = useCountUp(liveTotalPrice)
  const animatedCurrentTotalSavings = useCountUp(currentTotalSavings)
  const animatedCurrentSavingsPerPerson = useCountUp(currentSavingsPerPerson)
  const isTotalPulsing = useValuePulse(animatedLiveTotalPrice)
  const isSavingsPulsing = useValuePulse(animatedCurrentTotalSavings)
  const canBookNow = Boolean(schedule) && (availableSlots === null || availableSlots > 0)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    )
  }

  if (!tour) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold text-foreground mb-2">Tour not found</h1>
        <p className="text-muted-foreground mb-8 text-center max-w-md">
          The tour you're looking for might have been removed or is no longer available.
        </p>
        <Button
          onClick={() => navigate('/')}
          variant="default"
          className="rounded-2xl px-8 h-12 font-bold"
        >
          Back to Homepage
        </Button>
      </div>
    )
  }

  const tourImages = [
    tour.images?.[0] || 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200',
    tour.images?.[1] || 'https://images.unsplash.com/photo-1512100356956-c122ecc598a8?w=800',
    tour.images?.[2] || 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800',
    tour.images?.[3] || 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800',
    tour.images?.[4] || 'https://images.unsplash.com/photo-1528127269322-539801943592?w=800',
  ]
  const pickupLocations = Array.isArray(tour.pickup_locations) ? tour.pickup_locations : []
  const includedExcludedSection = (
    <GlassCard variant="card" className="rounded-3xl border-none shadow-xl">
      <GlassHeader>
        <GlassTitle className="text-2xl font-bold">Included & Excluded</GlassTitle>
      </GlassHeader>
      <GlassContent>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="space-y-4">
            <h4 className="text-base font-semibold text-foreground">Included</h4>
            {includedFeatures.length > 0 ? includedFeatures.map((item, i) => {
              const Icon = getTourIconComponent(item.icon_key)
              return (
                <motion.div
                  key={`${item.label}-${i}`}
                  whileHover={{ x: 4 }}
                  className="flex items-center gap-3 rounded-2xl border border-border/60 bg-muted/20 px-4 py-3 text-muted-foreground transition-all duration-300 hover:border-success/20 hover:bg-success/5"
                >
                  <Icon className="h-5 w-5 text-success" />
                  <span>{item.label}</span>
                </motion.div>
              )
            }) : includedItems.length > 0 ? includedItems.map((inc, i) => (
              <motion.div
                key={i}
                whileHover={{ x: 4 }}
                className="flex items-center gap-3 rounded-2xl border border-border/60 bg-muted/20 px-4 py-3 text-muted-foreground transition-all duration-300 hover:border-success/20 hover:bg-success/5"
              >
                <Check className="h-5 w-5 text-success" />
                <span>{inc}</span>
              </motion.div>
            )) : (
              <p className="text-sm text-muted-foreground">Not specified</p>
            )}
          </div>

          <div className="space-y-4">
            <h4 className="text-base font-semibold text-foreground">Excluded</h4>
            {excludedFeatures.length > 0 ? excludedFeatures.map((item, i) => {
              const Icon = getTourIconComponent(item.icon_key)
              return (
                <motion.div
                  key={`${item.label}-${i}`}
                  whileHover={{ x: 4 }}
                  className="flex items-center gap-3 rounded-2xl border border-border/60 bg-muted/20 px-4 py-3 text-muted-foreground transition-all duration-300 hover:border-destructive/20 hover:bg-destructive/5"
                >
                  <Icon className="h-5 w-5 text-destructive" />
                  <span>{item.label}</span>
                </motion.div>
              )
            }) : excludedItems.length > 0 ? excludedItems.map((exc, i) => (
              <motion.div
                key={i}
                whileHover={{ x: 4 }}
                className="flex items-center gap-3 rounded-2xl border border-border/60 bg-muted/20 px-4 py-3 text-muted-foreground transition-all duration-300 hover:border-destructive/20 hover:bg-destructive/5"
              >
                <X className="h-5 w-5 text-destructive" />
                <span>{exc}</span>
              </motion.div>
            )) : (
              <p className="text-sm text-muted-foreground">Not specified</p>
            )}
          </div>
        </div>
      </GlassContent>
    </GlassCard>
  )

  const renderBookingCard = ({
    onPayNow,
    inDialog = false,
  }: {
    onPayNow: () => void
    inDialog?: boolean
  }) => (
    <GlassCard
      variant="card"
      className={inDialog ? 'relative overflow-hidden rounded-[2.5rem] border-none shadow-2xl shadow-primary/10' : 'relative overflow-hidden rounded-[2.5rem] border-none shadow-2xl shadow-primary/10'}
    >
      <div className="pointer-events-none absolute right-0 top-0 h-32 w-32 -translate-y-8 translate-x-8 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-24 w-24 -translate-x-6 translate-y-6 rounded-full bg-primary/5 blur-3xl" />
      <GlassHeader>
        <GlassTitle className="type-h2 text-foreground">
          {tour.currency} {formatMoney(effectiveUnitPrice)}
          <span className="type-body-sm text-muted-foreground"> / person</span>
        </GlassTitle>
      </GlassHeader>
      <GlassContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Star size={16} className="text-warning fill-current" />
          <span className="font-bold text-foreground">
            {tour.rating} ({tour.review_count})
          </span>
        </div>

        <div className="space-y-3 rounded-3xl border border-primary/10 bg-primary/5 p-4 backdrop-blur-sm">
          {schedule ? (
            <>
              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary/80" />
                <div className="min-w-0 flex-1">
                  <p className="mb-1 text-xs font-bold uppercase tracking-widest text-primary/75">
                    Departure
                  </p>
                  <p className="text-sm font-bold text-foreground">
                    {formatDate(schedule.start_time)} at {formatTime(schedule.start_time)}
                  </p>
                  <p className="mt-1 text-xs font-medium text-muted-foreground">
                    Returns: {formatDate(schedule.end_time)}
                  </p>
                </div>
              </div>
              <div className="h-px bg-primary/10" />
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-primary/75">
                  <Users className="h-4 w-4" />
                  Seats Available
                </span>
                <span className="text-lg font-black text-foreground">
                  {availableSlots !== null ? availableSlots : '—'}
                </span>
              </div>
              {availableSlots !== null && availableSlots < 3 && availableSlots > 0 && (
                <div className="flex items-center gap-2 rounded-lg border border-warning/20 bg-warning/10 p-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 text-warning" />
                  <p className="text-xs font-medium text-warning">
                    Only {availableSlots} seat{availableSlots > 1 ? 's' : ''} left!
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center gap-2 rounded-lg border border-warning/20 bg-warning/10 p-3">
              <AlertCircle className="h-5 w-5 text-warning" />
              <p className="text-sm font-medium text-warning">No departure dates available</p>
            </div>
          )}
        </div>

        <div className="space-y-3 rounded-3xl border border-primary/10 bg-background/80 p-4 backdrop-blur-sm">
          <p className="type-overline text-primary/75">Number of Seats</p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSelectedSeats((prev) => Math.max(1, prev - 1))}
              disabled={selectedSeats <= 1}
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/10 bg-primary/5 text-primary transition-all duration-300 hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Minus className="h-4 w-4" />
            </button>
            <div className="flex-1 text-center">
              <p className="text-2xl font-black text-foreground">{selectedSeats}</p>
              <p className="type-caption text-muted-foreground">
                {selectedSeats === 1 ? 'Seat' : 'Seats'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedSeats((prev) => Math.min(maxSelectableSeats, prev + 1))}
              disabled={selectedSeats >= maxSelectableSeats}
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/10 bg-primary/5 text-primary transition-all duration-300 hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-2 rounded-2xl border border-primary/10 bg-gradient-to-br from-background/90 to-primary/5 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              {activeGroupTier ? (
                <p className="type-overline text-primary">
                  {activeGroupTier.name} applied for {selectedSeats}{' '}
                  {selectedSeats === 1 ? 'seat' : 'seats'}
                </p>
              ) : (
                <p className="type-overline text-primary/75">Standard rate</p>
              )}
              {currentTotalSavings > 0 ? (
                <GlassBadge variant="light" size="sm" className="border-primary/15 bg-primary/10 text-primary">
                  Traveller rate live
                </GlassBadge>
              ) : null}
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-muted-foreground">
                {tour.currency} {formatMoney(effectiveUnitPrice)} × {selectedSeats}
              </span>
              <span
                className={`font-black tabular-nums text-foreground transition-all duration-200 ${
                  isTotalPulsing ? 'scale-[1.03] text-primary' : ''
                }`}
              >
                {tour.currency} {formatMoney(animatedLiveTotalPrice)}
              </span>
            </div>
            {currentTotalSavings > 0 ? (
              <div className="rounded-lg border border-success/30 bg-success/10 p-2.5">
                <p
                  className={`type-overline tabular-nums text-success transition-all duration-200 ${
                    isSavingsPulsing ? 'scale-[1.02]' : ''
                  }`}
                >
                  Discount Applied · You save {tour.currency} {formatMoney(animatedCurrentTotalSavings)}
                </p>
                <p className="mt-1 type-caption tabular-nums text-success/90">
                  {tour.currency} {formatMoney(animatedCurrentSavingsPerPerson)} saved per person vs standard rate
                </p>
              </div>
            ) : null}
            {nextGroupTier && seatsToNextTier > 0 ? (
              <div className="rounded-2xl border border-primary/20 bg-primary/8 p-2.5">
                <p className="type-overline text-primary">
                  Add {seatsToNextTier} more {seatsToNextTier === 1 ? 'seat' : 'seats'} to unlock {nextGroupTier.name}
                </p>
                <p className="mt-1 type-caption text-muted-foreground">
                  Save up to {tour.currency} {formatMoney(nextTierTotalSavingsAtUnlock)} at {nextGroupTier.minPeople} people
                  {nextTierExtraSavingsPerPerson > 0
                    ? ` (${tour.currency} ${formatMoney(nextTierExtraSavingsPerPerson)} more per person)`
                    : ''}
                </p>
              </div>
            ) : null}
          </div>
        </div>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={onPayNow}
            disabled={!canBookNow}
            className="h-16 w-full rounded-3xl bg-primary text-primary-foreground shadow-xl shadow-primary/25 transition-all duration-300 hover:bg-primary/90"
          >
            {!schedule ? 'No Dates Available' : schedule && availableSlots === 0 ? 'Sold Out' : 'Pay Now'}
          </Button>
        </motion.div>

        <p className="text-center type-overline text-muted-foreground/70">{cancellationMeta.title}</p>
      </GlassContent>
    </GlassCard>
  )

  return (
    <div className="min-h-screen bg-muted/30 pb-36">
      {/* Header / Nav (match PackageDetailsPage) */}
      <GlassCard variant="nav" blur="md" className="sticky top-0 z-40 border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="gap-2 hover:bg-muted/40"
          >
            <ArrowLeft size={16} />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <GlassButton variant="ghost" size="icon" className="rounded-full">
              <Share2 size={18} />
            </GlassButton>
            <GlassButton variant="ghost" size="icon" className="rounded-full">
              <Heart size={18} className="text-primary" />
            </GlassButton>
          </div>
        </div>
      </GlassCard>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Gallery (match PackageDetailsPage grid) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-3 h-[300px] md:h-[500px] rounded-3xl overflow-hidden mb-12 shadow-2xl"
        >
          <div className="md:col-span-2 h-full bg-muted/60 relative group overflow-hidden">
            <motion.img
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.8 }}
              src={tourImages[0]}
              alt={tour.title}
              className="w-full h-full object-cover cursor-pointer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
          </div>

          <div className="hidden md:grid grid-rows-2 gap-3 h-full">
            <div className="bg-muted/60 h-full relative overflow-hidden group">
              <motion.img
                whileHover={{ scale: 1.1 }}
                src={tourImages[1]}
                alt={`${tour.title} photo 2`}
                className="w-full h-full object-cover cursor-pointer"
              />
            </div>
            <div className="bg-muted/60 h-full relative overflow-hidden group">
              <motion.img
                whileHover={{ scale: 1.1 }}
                src={tourImages[2]}
                alt={`${tour.title} photo 3`}
                className="w-full h-full object-cover cursor-pointer"
              />
            </div>
          </div>
          <div className="hidden md:grid grid-rows-2 gap-3 h-full">
            <div className="bg-muted/60 h-full relative overflow-hidden group">
              <motion.img
                whileHover={{ scale: 1.1 }}
                src={tourImages[3]}
                alt={`${tour.title} photo 4`}
                className="w-full h-full object-cover cursor-pointer"
              />
            </div>
            <div className="bg-muted/60 h-full relative overflow-hidden group">
              <motion.img
                whileHover={{ scale: 1.1 }}
                src={tourImages[4]}
                alt={`${tour.title} photo 5`}
                className="w-full h-full object-cover cursor-pointer"
              />
              <div className="absolute bottom-4 right-4">
                <GlassButton
                  variant="light"
                  size="sm"
                  className="gap-2 bg-background/70 hover:bg-background/80"
                >
                  <Camera size={16} />
                  Show all photos
                </GlassButton>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-12">
            {/* Title Section (match PackageDetailsPage) */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <GlassBadge variant="primary" size="lg" className="capitalize">
                      {tour.tour_type?.replace('-', ' ') || 'Tour'}
                    </GlassBadge>
                    <GlassBadge variant="success" size="lg" icon={<Sparkles size={14} />}>
                      Verified Operator
                    </GlassBadge>
                  </div>

                  <h1 className="type-display text-foreground mb-2 break-words">
                    {tour.title}
                  </h1>

                  {/* Short description teaser */}
                  {tour.short_description && (
                    <p className="text-base text-muted-foreground italic mb-4 leading-relaxed">
                      {tour.short_description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground font-medium">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-warning/10 rounded-full">
                        <Star size={16} className="text-warning fill-current" />
                      </div>
                      <span className="font-bold text-foreground">
                        {tour.rating} ({tour.review_count} reviews)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-info/10 rounded-full">
                        <MapPin size={16} className="text-info" />
                      </div>
                      <span className="font-bold text-foreground">
                        {(() => {
                          const cities: string[] = Array.isArray((tour as any).destination_cities) && (tour as any).destination_cities.length > 0
                            ? (tour as any).destination_cities
                            : [tour.location.city].filter(Boolean)
                          return cities.length > 1
                            ? cities.join(' · ')
                            : `${tour.location.city}, ${tour.location.country}`
                        })()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-success/10 rounded-full">
                        <Shield size={16} className="text-success" />
                      </div>
                      <span className="font-bold text-foreground">Secure Booking</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Description (glass card like package page) */}
            <GlassCard variant="card" className="rounded-3xl border-none shadow-xl">
              <GlassHeader>
                <GlassTitle className="text-2xl font-bold">About the Journey</GlassTitle>
              </GlassHeader>
              <GlassContent>
                <p className="text-muted-foreground leading-relaxed text-lg whitespace-pre-line">
                  {tour.description}
                </p>
              </GlassContent>
            </GlassCard>

            {/* Hosted by */}
            <GlassCard variant="card" className="rounded-3xl border-none shadow-xl">
              <GlassHeader>
                <GlassTitle className="text-2xl font-bold">
                  Hosted by Premium Tour Operator
                </GlassTitle>
              </GlassHeader>
              <GlassContent>
                <p className="text-muted-foreground">Verified Operator • Small groups</p>
              </GlassContent>
            </GlassCard>

            {includedExcludedSection}

            <GlassCard variant="card" className="rounded-3xl border-none shadow-xl">
              <GlassHeader>
                <GlassTitle className="text-2xl font-bold">Experience level</GlassTitle>
              </GlassHeader>
              <GlassContent>
                <div className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-muted/30 px-3 py-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Difficulty
                  </span>
                  <span className="text-sm font-bold text-foreground capitalize">
                    {tour.difficulty_level || 'Not specified'}
                  </span>
                </div>
              </GlassContent>
            </GlassCard>

            {/* Languages + Requirements */}
            <GlassCard variant="card" className="rounded-3xl border-none shadow-xl">
              <GlassHeader>
                <GlassTitle className="text-2xl font-bold">Before you go</GlassTitle>
              </GlassHeader>
              <GlassContent>
                <div className="space-y-8">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-info/10 rounded-full">
                        <Globe size={16} className="text-info" />
                      </div>
                      <h4 className="text-base font-semibold text-foreground">Languages</h4>
                    </div>

                    {tour.languages?.length ? (
                      <div className="flex flex-wrap gap-3">
                        {tour.languages.map((lang) => (
                          <motion.span
                            key={lang}
                            whileHover={{ y: -2, scale: 1.03 }}
                            className="inline-flex items-center rounded-xl border border-border/60 bg-background px-3 py-2 text-sm font-bold text-foreground shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-lg"
                          >
                            {lang}
                          </motion.span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Not specified</p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-success/10 rounded-full">
                        <ClipboardList size={16} className="text-success" />
                      </div>
                      <h4 className="text-base font-semibold text-foreground">Requirements</h4>
                    </div>

                    {tour.requirements?.length ? (
                      <div className="space-y-5">
                        {groupTourRequirementsByCategory(tour.requirements).map((group) => (
                          <div
                            key={group.category}
                            className="rounded-2xl border border-border/60 bg-muted/20 p-4"
                          >
                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                              {group.category}
                            </p>
                            <div className="mt-3 flex flex-wrap gap-3">
                              {group.items.map((item) => {
                                const RequirementIcon = getTourIconComponent(item.icon_key)

                                return (
                                <motion.div
                                  key={item.id}
                                  whileHover={{ y: -3, scale: 1.03 }}
                                  className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background px-3.5 py-3 text-sm font-semibold text-foreground shadow-sm transition-all duration-300 hover:border-primary/20 hover:shadow-lg"
                                >
                                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                    <RequirementIcon className="h-4 w-4" />
                                  </span>
                                  <span>{item.label}</span>
                                </motion.div>
                              )})}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No special requirements listed</p>
                    )}
                  </div>
                </div>
              </GlassContent>
            </GlassCard>

            {pickupLocations.length > 0 ? (
              <GlassCard variant="card" className="rounded-3xl border-none shadow-xl">
                <GlassHeader>
                  <GlassTitle className="text-2xl font-bold">Pickup points</GlassTitle>
                </GlassHeader>
                <GlassContent>
                  <div className="space-y-4">
                    {pickupLocations.map((pickup: TourPickupLocation, index: number) => {
                      const previewUrl = buildStaticMapPreviewUrl(pickup.latitude, pickup.longitude)
                      const directionsUrl = buildGoogleDirectionsUrl(pickup.latitude, pickup.longitude)
                      const pickupTime = formatPickupTime(pickup.pickup_time)

                      return (
                        <motion.div
                          key={pickup.id}
                          whileHover={{ y: -4, scale: 1.01 }}
                          transition={{ duration: 0.22 }}
                          className="group overflow-hidden rounded-3xl border border-border/60 bg-background shadow-sm transition-all duration-300 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/10"
                        >
                          <div className="grid gap-0 md:grid-cols-[220px_minmax(0,1fr)]">
                            <div className="relative min-h-[180px] bg-muted/40">
                              {previewUrl ? (
                                <img
                                  src={previewUrl}
                                  alt={pickup.title}
                                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="flex h-full min-h-[180px] items-center justify-center bg-muted/40 text-muted-foreground">
                                  <MapPin className="h-8 w-8" />
                                </div>
                              )}
                              <div className="absolute left-4 top-4 flex items-center gap-2">
                                <GlassBadge variant={pickup.is_primary ? 'primary' : 'light'} size="sm">
                                  {pickup.is_primary ? 'Primary pickup' : `Stop ${index + 1}`}
                                </GlassBadge>
                              </div>
                            </div>

                            <div className="space-y-4 p-5 md:p-6">
                              <div className="space-y-2">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                  <div>
                                    <h4 className="text-lg font-bold text-foreground">{pickup.title}</h4>
                                    <p className="text-sm leading-6 text-muted-foreground">{pickup.formatted_address}</p>
                                  </div>
                                  {directionsUrl ? (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      className="gap-2 rounded-2xl border-border/60 bg-background hover:border-primary/20 hover:bg-muted/30"
                                      onClick={() => window.open(directionsUrl, '_blank', 'noopener,noreferrer')}
                                    >
                                      <Navigation className="h-4 w-4" />
                                      Directions
                                    </Button>
                                  ) : null}
                                </div>
                              </div>

                              <div className="grid gap-3 sm:grid-cols-3">
                                <div className="rounded-2xl border border-border/60 bg-muted/20 p-3">
                                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                                    Pickup time
                                  </p>
                                  <p className="mt-1 text-sm font-semibold text-foreground">
                                    {pickupTime || 'Not specified'}
                                  </p>
                                </div>
                                <div className="rounded-2xl border border-border/60 bg-muted/20 p-3">
                                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                                    City
                                  </p>
                                  <p className="mt-1 text-sm font-semibold text-foreground">
                                    {pickup.city || tour.location.city || 'Not specified'}
                                  </p>
                                </div>
                                <div className="rounded-2xl border border-border/60 bg-muted/20 p-3">
                                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                                    Coordinates
                                  </p>
                                  <p className="mt-1 text-sm font-semibold text-foreground">
                                    {pickup.latitude.toFixed(4)}, {pickup.longitude.toFixed(4)}
                                  </p>
                                </div>
                              </div>

                              {pickup.notes?.trim() ? (
                                <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                                    Pickup notes
                                  </p>
                                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{pickup.notes}</p>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </GlassContent>
              </GlassCard>
            ) : null}

            {/* Experience highlights */}
            {tour.highlights?.length ? (
              <GlassCard variant="card" className="rounded-3xl border-none shadow-xl">
                <GlassHeader>
                  <GlassTitle className="text-2xl font-bold">Experience highlights</GlassTitle>
                </GlassHeader>
                <GlassContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {tour.highlights.map((h, i) => (
                      <div key={i} className="flex items-start gap-3 text-muted-foreground">
                        <Check className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <span className="leading-relaxed">{h}</span>
                      </div>
                    ))}
                  </div>
                </GlassContent>
              </GlassCard>
            ) : null}

            {/* Pricing, Cancellation, Inclusions / Exclusions */}
            <GlassCard variant="card" className="rounded-3xl border-none shadow-xl">
              <GlassHeader>
                <GlassTitle className="text-2xl font-bold">Pricing & Policies</GlassTitle>
              </GlassHeader>
              <GlassContent>
                <div className="space-y-8">
                  <div className="space-y-3">
                    <h4 className="text-base font-semibold text-foreground">Pricing</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
                          Starting From
                        </p>
                        <p className="text-lg font-black text-foreground">
                          {tour.currency} {formatMoney(basePrice)}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
                          Deposit Required
                        </p>
                        <p className="text-lg font-black text-foreground">
                          {requiresDeposit ? `${depositPercentage}%` : 'No'}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-border/60 bg-primary/10 p-4">
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
                          Pay Today
                        </p>
                        <p className="text-lg font-black text-foreground">
                          {tour.currency} {formatMoney(payToday)}
                        </p>
                      </div>
                    </div>
                    {tour.group_discounts && groupPricingTiers.length > 0 ? (
                      <div className="relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-background/80 via-background/65 to-primary/10 backdrop-blur-md p-4 md:p-5 space-y-4 shadow-sm">
                        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.35),transparent_55%)]" />

                        <div className="relative flex items-center justify-between gap-3 flex-wrap">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center">
                              <Users className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                                Group Pricing Tiers
                              </p>
                              <p className="text-[11px] text-muted-foreground font-medium">
                                Better rates unlock for larger groups
                              </p>
                            </div>
                          </div>
                          <GlassBadge variant="info" size="sm" icon={<Sparkles size={12} />}>
                            Active Offers
                          </GlassBadge>
                        </div>

                        <div className="relative space-y-2.5">
                          {groupPricingTiers.map((tier: any) => {
                            const savings = Math.max(0, basePrice - tier.pricePerPerson)
                            const isActive = activeGroupTier?.key === tier.key
                            return (
                              <div
                                key={tier.key}
                                className={`rounded-xl backdrop-blur-sm px-3.5 py-3 flex items-center justify-between gap-3 transition-all duration-200 ${
                                  isActive
                                    ? 'border border-primary/40 bg-primary/10 shadow-md shadow-primary/10'
                                    : 'border border-border/50 bg-background/60'
                                }`}
                              >
                                <div className="min-w-0">
                                  <p className={`text-sm font-bold truncate ${isActive ? 'text-primary' : 'text-foreground'}`}>
                                    {tier.name} • {tier.minPeople}+
                                  </p>
                                  {savings > 0 ? (
                                    <p className="text-xs text-success font-semibold">
                                      Save {tour.currency} {formatMoney(savings)} per person
                                    </p>
                                  ) : (
                                    <p className="text-xs text-muted-foreground font-medium">
                                      Base rate applied
                                    </p>
                                  )}
                                </div>
                                <div className="text-right shrink-0">
                                  {isActive ? (
                                    <div className="text-[10px] font-black uppercase tracking-wider text-primary mb-0.5">
                                      Active for {selectedSeats} {selectedSeats === 1 ? 'seat' : 'seats'}
                                    </div>
                                  ) : null}
                                  {savings > 0 ? (
                                    <p className="text-[11px] text-muted-foreground line-through font-semibold">
                                      {tour.currency} {formatMoney(basePrice)}
                                    </p>
                                  ) : null}
                                  <p className="text-sm md:text-base font-black text-primary">
                                    {tour.currency} {formatMoney(tier.pricePerPerson)}
                                  </p>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-base font-semibold text-foreground">Cancellation Policy</h4>
                    <div className="rounded-2xl border border-primary/30 bg-primary/10 p-4 flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0">
                        <CancellationPolicyIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{cancellationMeta.title}</p>
                        <p className="text-sm text-muted-foreground">{cancellationMeta.description}</p>
                      </div>
                    </div>
                  </div>

                </div>
              </GlassContent>
            </GlassCard>

            {/* Itinerary */}
            {tour.itinerary?.length ? (
              <GlassCard variant="card" className="rounded-3xl border-none shadow-xl">
                <GlassHeader>
                  <GlassTitle className="text-2xl font-bold">Itinerary</GlassTitle>
                </GlassHeader>
                <GlassContent>
                  <div className="space-y-8">
                    {tour.itinerary.map((day: any, idx: number) => (
                      <div
                        key={idx}
                        className="relative pl-10 pb-8 last:pb-0 border-l-2 border-border/50 last:border-transparent"
                      >
                        <div className="absolute left-[-11px] top-0 w-5 h-5 rounded-full bg-primary ring-4 ring-background" />
                        <div className="space-y-4">
                          <h4 className="text-lg font-bold text-foreground">
                            Day {day.day}{day.title ? `: ${day.title}` : ''}
                          </h4>
                          {/* Activity-based itinerary */}
                          {Array.isArray(day.activities) && day.activities.length > 0 ? (
                            <div className="space-y-2">
                              {day.activities.map((act: any, ai: number) => (
                                <div
                                  key={ai}
                                  className="flex items-start gap-3 p-3 rounded-xl bg-background/40 border border-border/40"
                                >
                                  <span className="text-lg flex-shrink-0 leading-tight mt-0.5">
                                    {act.type === 'transport' ? '🚐'
                                      : act.type === 'departure_arrival' ? '✈️'
                                      : act.type === 'meal' ? '🍽️'
                                      : act.type === 'tea_break' ? '🍵'
                                      : act.type === 'sightseeing' ? '🏞️'
                                      : act.type === 'guided_tour' ? '🧭'
                                      : act.type === 'adventure' ? '🏄'
                                      : act.type === 'photo_stop' ? '📸'
                                      : act.type === 'shopping' ? '🛍️'
                                      : act.type === 'cultural' ? '🎭'
                                      : act.type === 'free_time' ? '⏳'
                                      : act.type === 'accommodation' ? '🏨'
                                      : '✏️'}
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-bold text-sm text-foreground">
                                        {act.title ?? act.activity}
                                      </span>
                                      {act.time && (
                                        <span className="text-xs font-semibold text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-full">
                                          {act.time}
                                        </span>
                                      )}
                                    </div>
                                    {(act.description) && (
                                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                                        {act.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : typeof day.description === 'string' && day.description.trim().length > 0 ? (
                            /* Fallback: legacy plain-text description */
                            <div className="rounded-2xl border border-border/40 bg-muted/20 p-4">
                              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                                {day.description}
                              </p>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </GlassContent>
              </GlassCard>
            ) : null}
          </div>

          {/* Booking Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 z-30 space-y-6">
              {renderBookingCard({ onPayNow: handleBookNow })}
            </div>
          </div>
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={handleOpenBookingDialog}
            disabled={!canBookNow}
            className="flex flex-1 items-center justify-between rounded-2xl border border-border/60 bg-muted/20 px-4 py-3 text-left transition-all duration-300 hover:border-primary/20 hover:bg-muted/30 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Ready to book</p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {schedule ? `${selectedSeats} ${selectedSeats === 1 ? 'seat' : 'seats'} · ${tour.currency} ${formatMoney(animatedLiveTotalPrice)}` : 'No departure dates available'}
              </p>
            </div>
            {schedule ? (
              <p className="text-xs font-medium text-muted-foreground">
                {formatDate(schedule.start_time)} at {formatTime(schedule.start_time)}
              </p>
            ) : null}
          </button>

          <Button
            onClick={handleOpenBookingDialog}
            disabled={!canBookNow}
            className="h-14 min-w-[220px] rounded-2xl bg-primary text-primary-foreground shadow-xl shadow-primary/20 hover:bg-primary/90"
          >
            {!schedule ? 'No Dates Available' : availableSlots === 0 ? 'Sold Out' : 'Pay Now'}
          </Button>
        </div>
      </div>

      <Dialog open={isBookingDialogOpen} onOpenChange={setIsBookingDialogOpen}>
        <DialogContent className="max-w-xl border-none bg-transparent p-0 shadow-none sm:rounded-[2rem]">
          {renderBookingCard({ onPayNow: handleBookFromDialog, inDialog: true })}
        </DialogContent>
      </Dialog>
    </div>
  )
}
