import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Camera,
  Check,
  Heart,
  Loader2,
  MapPin,
  Share2,
  Shield,
  Sparkles,
  Star,
  Users,
  X,
} from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import {
  GlassBadge,
  GlassButton,
  GlassCard,
  GlassContent,
  GlassHeader,
  GlassTitle,
} from '@/components/ui/glass'
import { tourBookingService } from '@/features/booking'
import { Tour, TourSchedule, tourService } from '@/features/tour-operator/services/tourService'

export default function TourDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [tour, setTour] = useState<Tour | null>(null)
  const [schedule, setSchedule] = useState<TourSchedule | null>(null)
  const [availableSlots, setAvailableSlots] = useState<number | null>(null)
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
    // Navigate using the ID/Slug from URL is fine, but for consistency let's use the actual tour ID if we have it
    // Checkout page also handles both ID and Slug, but it's safer to use the UUID if possible
    navigate(`/checkout/tour/${id}`)
  }

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

  return (
    <div className="min-h-screen bg-muted/30 pb-20">
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
                <GlassButton variant="secondary" size="sm" className="gap-2">
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

                  <h1 className="text-4xl md:text-5xl font-black text-foreground mb-4 tracking-tight leading-tight break-words">
                    {tour.title}
                  </h1>

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
                        {tour.location.city}, {tour.location.country}
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
                <GlassTitle className="text-2xl font-bold">Hosted by Premium Tour Operator</GlassTitle>
              </GlassHeader>
              <GlassContent>
                <p className="text-muted-foreground">Verified Operator • Small groups</p>
              </GlassContent>
            </GlassCard>

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

            {/* Inclusions / Exclusions */}
            <GlassCard variant="card" className="rounded-3xl border-none shadow-xl">
              <GlassHeader>
                <GlassTitle className="text-2xl font-bold">What&apos;s included</GlassTitle>
              </GlassHeader>
              <GlassContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    {tour.inclusions?.map((inc, i) => (
                      <div key={i} className="flex items-center gap-3 text-muted-foreground">
                        <Check className="w-5 h-5 text-muted-foreground" />
                        <span>{inc}</span>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-base font-semibold text-foreground">Exclusions</h4>
                    {tour.exclusions?.map((exc, i) => (
                      <div key={i} className="flex items-center gap-3 text-muted-foreground line-through">
                        <X className="w-5 h-5" />
                        <span>{exc}</span>
                      </div>
                    ))}
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
                          <div className="flex items-center justify-between gap-3 flex-wrap">
                            <h4 className="text-lg font-bold text-foreground">
                              Day {day.day}: {day.title}
                            </h4>
                            <GlassBadge variant="info" size="sm">
                              {day.activities?.length || 0} Activities
                            </GlassBadge>
                          </div>
                          <div className="grid grid-cols-1 gap-4">
                            {day.activities?.map((act: any, ai: number) => (
                              <div
                                key={ai}
                                className="bg-background/40 border border-border/40 p-4 rounded-2xl"
                              >
                                <div className="flex items-start gap-4">
                                  <div className="bg-muted/40 p-3 rounded-xl text-foreground font-bold text-xs">
                                    {act.time}
                                  </div>
                                  <div className="flex-1 space-y-1 min-w-0">
                                    <p className="font-bold text-foreground">{act.activity}</p>
                                    <p className="text-sm text-muted-foreground font-medium">
                                      {act.description}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
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
              <GlassCard variant="card" className="rounded-3xl border-none shadow-xl">
                <GlassHeader>
                  <GlassTitle className="text-2xl font-black">
                    {tour.currency} {tour.price}
                    <span className="text-sm font-semibold text-muted-foreground"> / person</span>
                  </GlassTitle>
                </GlassHeader>
                <GlassContent className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Star size={16} className="text-warning fill-current" />
                    <span className="font-bold text-foreground">
                      {tour.rating} ({tour.review_count})
                    </span>
                  </div>

                  <div className="p-4 bg-muted/40 rounded-2xl border border-border/50 space-y-3">
                    {schedule ? (
                      <>
                        <div className="flex items-start gap-3">
                          <Calendar className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">
                              Departure
                            </p>
                            <p className="text-foreground font-bold text-sm">
                              {formatDate(schedule.start_time)} at {formatTime(schedule.start_time)}
                            </p>
                            <p className="text-xs text-muted-foreground font-medium mt-1">
                              Returns: {formatDate(schedule.end_time)}
                            </p>
                          </div>
                        </div>
                        <div className="h-px bg-border/60" />
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2 text-muted-foreground font-bold uppercase text-[10px] tracking-wider">
                            <Users className="w-4 h-4" />
                            Seats Available
                          </span>
                          <span className="text-foreground font-black text-lg">
                            {availableSlots !== null ? availableSlots : '—'}
                          </span>
                        </div>
                        {availableSlots !== null && availableSlots < 3 && availableSlots > 0 && (
                          <div className="flex items-center gap-2 p-2 bg-warning/10 rounded-lg border border-warning/20">
                            <AlertCircle className="w-4 h-4 text-warning flex-shrink-0" />
                            <p className="text-xs text-warning font-medium">
                              Only {availableSlots} seat{availableSlots > 1 ? 's' : ''} left!
                            </p>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center gap-2 p-3 bg-warning/10 rounded-lg border border-warning/20">
                        <AlertCircle className="w-5 h-5 text-warning" />
                        <p className="text-sm text-warning font-medium">No departure dates available</p>
                      </div>
                    )}
                  </div>

                  <GlassButton
                    onClick={handleBookNow}
                    disabled={!schedule || (availableSlots !== null && availableSlots <= 0)}
                    className="w-full h-14 rounded-2xl font-black text-lg"
                  >
                    {!schedule
                      ? 'No Dates Available'
                      : schedule && availableSlots === 0
                        ? 'Sold Out'
                        : 'Continue to Booking'}
                  </GlassButton>

                  <p className="text-center text-[10px] text-muted-foreground/70 font-bold uppercase tracking-widest">
                    Free cancellation up to 48h before
                  </p>
                </GlassContent>
              </GlassCard>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
