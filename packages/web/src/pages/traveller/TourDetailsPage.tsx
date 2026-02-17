import {
  AlertCircle,
  Calendar,
  Camera,
  Check,
  ChevronLeft,
  Clock,
  Heart,
  Info,
  Loader2,
  Map,
  MapPin,
  Share,
  ShieldCheck,
  Star,
  Users,
  X,
} from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { ImageWithFallback } from '@/components/ImageWithFallback'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
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
    <div className="min-h-screen bg-background pb-20">
      {/* Header / Nav (match Hotel details layout) */}
      <header className="fixed top-16 left-0 right-0 h-16 bg-background z-40 border-b border-border/50 flex items-center justify-between px-4 lg:px-20">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" className="rounded-full">
            <Share className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full">
            <Heart className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto max-w-6xl pt-36 px-4 lg:px-6">
        {/* Title Section */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2 mb-3">
            <Badge variant="secondary" className="font-semibold">
              {tour.tour_type}
            </Badge>
            <Badge variant="outline" className="font-semibold">
              Verified Operator
            </Badge>
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl md:text-3xl font-bold mb-2 break-words"
          >
            {tour.title}
          </motion.h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-primary text-primary" />
              <span className="font-medium text-foreground">{tour.rating}</span>
              <span className="underline cursor-pointer">{tour.review_count} reviews</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span className="underline cursor-pointer">
                {tour.location.city}, {tour.location.country}
              </span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{tour.duration}</span>
            </div>
          </div>
        </div>

        {/* Image Gallery Grid (Airbnb Style) */}
        <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-2 h-[300px] md:h-[450px] rounded-2xl overflow-hidden mb-10 relative group">
          <div className="col-span-2 row-span-2 relative cursor-pointer">
            <ImageWithFallback
              src={tourImages[0]}
              alt={tour.title}
              className="w-full h-full object-cover hover:brightness-95 transition-all"
            />
          </div>

          <div className="hidden md:block relative cursor-pointer">
            <ImageWithFallback
              src={tourImages[1]}
              alt="Tour photo 2"
              className="w-full h-full object-cover hover:brightness-95 transition-all"
            />
          </div>
          <div className="hidden md:block relative cursor-pointer rounded-tr-2xl">
            <ImageWithFallback
              src={tourImages[2]}
              alt="Tour photo 3"
              className="w-full h-full object-cover hover:brightness-95 transition-all"
            />
          </div>
          <div className="hidden md:block relative cursor-pointer">
            <ImageWithFallback
              src={tourImages[3]}
              alt="Tour photo 4"
              className="w-full h-full object-cover hover:brightness-95 transition-all"
            />
          </div>
          <div className="hidden md:block relative cursor-pointer rounded-br-2xl">
            <ImageWithFallback
              src={tourImages[4]}
              alt="Tour photo 5"
              className="w-full h-full object-cover hover:brightness-95 transition-all"
            />
            <Button
              variant="secondary"
              size="sm"
              className="absolute bottom-4 right-4 shadow-md opacity-90 hover:opacity-100"
            >
              <span className="flex items-center gap-2">
                <Camera className="w-4 h-4" />
                Show all photos
              </span>
            </Button>
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left Column: Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Operator Info (hotel-style host row) */}
            <div className="flex items-center justify-between border-b pb-6">
              <div>
                <h2 className="text-xl font-semibold mb-1">Hosted by Premium Tour Operator</h2>
                <p className="text-muted-foreground text-sm">Verified Operator • Small groups</p>
              </div>
              <div className="w-12 h-12 rounded-full overflow-hidden bg-muted flex items-center justify-center font-bold">
                {(tour.operator_id?.slice(0, 1) || 'T').toUpperCase()}
              </div>
            </div>

            {/* Highlights */}
            <div className="border-b pb-6">
              <h3 className="text-xl font-semibold mb-4">Experience highlights</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tour.highlights.map((h, i) => (
                  <div key={i} className="flex items-start gap-3 text-foreground/80">
                    <Check className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <span className="leading-relaxed">{h}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="border-b pb-6">
              <h3 className="text-xl font-semibold mb-3">Description</h3>
              <p className="text-foreground/80 leading-relaxed">{tour.description}</p>
              <Button variant="link" className="px-0 mt-2 font-semibold underline">
                Show more
              </Button>
            </div>

            {/* Inclusions / Exclusions */}
            <div className="border-b pb-6">
              <h3 className="text-xl font-semibold mb-4">What&apos;s included</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  {tour.inclusions.map((inc, i) => (
                    <div key={i} className="flex items-center gap-3 text-foreground/80">
                      <Check className="w-5 h-5 text-muted-foreground" />
                      <span>{inc}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  <h4 className="text-base font-semibold">Exclusions</h4>
                  {tour.exclusions.map((exc, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 text-muted-foreground line-through"
                    >
                      <X className="w-5 h-5" />
                      <span>{exc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Itinerary */}
            {tour.itinerary?.length ? (
              <div className="border-b pb-6">
                <h3 className="text-xl font-semibold mb-4">Itinerary</h3>
                <div className="space-y-8">
                  {tour.itinerary.map((day: any, idx: number) => (
                    <div
                      key={idx}
                      className="relative pl-10 pb-8 last:pb-0 border-l-2 border-border/50 last:border-transparent"
                    >
                      <div className="absolute left-[-11px] top-0 w-5 h-5 rounded-full bg-primary ring-4 ring-background" />
                      <div className="space-y-4">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <h4 className="text-lg font-semibold text-foreground">
                            Day {day.day}: {day.title}
                          </h4>
                          <Badge variant="outline" className="border-border text-muted-foreground">
                            {day.activities?.length || 0} Activities
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                          {day.activities?.map((act: any, ai: number) => (
                            <div
                              key={ai}
                              className="bg-background border border-border/50 p-4 rounded-2xl shadow-sm"
                            >
                              <div className="flex items-start gap-4">
                                <div className="bg-muted/40 p-3 rounded-xl text-foreground font-semibold text-xs">
                                  {act.time}
                                </div>
                                <div className="flex-1 space-y-1 min-w-0">
                                  <p className="font-semibold text-foreground">{act.activity}</p>
                                  <p className="text-sm text-muted-foreground">{act.description}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {/* Right Column: Booking Card (Sticky) */}
          <div className="relative">
            <Card className="sticky top-20 z-30 p-6 shadow-lg border-border/50">
              <div className="flex justify-between items-end mb-6 gap-4">
                <div>
                  <span className="text-2xl font-bold">
                    {tour.currency} {tour.price}
                  </span>
                  <span className="text-muted-foreground"> / person</span>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <Star className="w-3 h-3 fill-primary text-primary" />
                  <span className="font-semibold">{tour.rating}</span>
                  <span className="text-muted-foreground">({tour.review_count})</span>
                </div>
              </div>

              {/* Schedule */}
              <div className="border rounded-xl mb-4 overflow-hidden">
                {schedule ? (
                  <>
                    <div className="p-3 border-b hover:bg-muted/50">
                      <div className="text-[10px] uppercase font-bold text-muted-foreground">
                        Departure
                      </div>
                      <div className="text-sm flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium text-foreground">
                          {formatDate(schedule.start_time)} at {formatTime(schedule.start_time)}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Returns: {formatDate(schedule.end_time)}
                      </div>
                    </div>
                    <div className="p-3 hover:bg-muted/50">
                      <div className="text-[10px] uppercase font-bold text-muted-foreground">
                        Seats available
                      </div>
                      <div className="text-sm flex justify-between items-center">
                        <span className="text-foreground font-medium">Availability</span>
                        <span className="font-semibold text-foreground">
                          {availableSlots !== null ? availableSlots : '—'}
                        </span>
                      </div>
                      {availableSlots !== null && availableSlots < 3 && availableSlots > 0 && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                          <AlertCircle className="w-4 h-4" />
                          <span>
                            Only {availableSlots} seat{availableSlots > 1 ? 's' : ''} left
                          </span>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="p-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <AlertCircle className="w-4 h-4" />
                      <span>No departure dates available</span>
                    </div>
                  </div>
                )}
              </div>

              <Button
                onClick={handleBookNow}
                disabled={!schedule || (availableSlots !== null && availableSlots <= 0)}
                className="w-full bg-primary hover:bg-primary/90 text-lg py-6 mb-4"
              >
                {!schedule
                  ? 'No Dates Available'
                  : schedule && availableSlots === 0
                    ? 'Sold Out'
                    : 'Continue to Booking'}
              </Button>

              <div className="text-center text-sm text-muted-foreground mb-4">
                Free cancellation up to 48h before
              </div>

              <div className="pt-4 border-t border-border/50 space-y-3 text-sm">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Secure booking with instant confirmation</span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>Small group guarantee (max {tour.max_participants})</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
