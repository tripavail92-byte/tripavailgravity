import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Camera,
  Check,
  Clock,
  Heart,
  Info,
  Loader2,
  Map,
  MapPin,
  Share2,
  ShieldCheck,
  Star,
  Users,
  X,
} from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { GlassBadge } from '@/components/ui/glass'
import { tourBookingService } from '@/features/booking'
import { Tour, TourSchedule, tourService } from '@/features/tour-operator/services/tourService'

export default function TourDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [tour, setTour] = useState<Tour | null>(null)
  const [schedule, setSchedule] = useState<TourSchedule | null>(null)
  const [availableSlots, setAvailableSlots] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'itinerary' | 'policies'>('overview')

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

  return (
    <div className="bg-background min-h-screen pb-20">
      {/* Top Navigation */}
      <div className="sticky top-0 z-50 bg-background border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-muted/60 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-muted/60 rounded-full transition-colors">
              <Share2 className="w-5 h-5" />
            </button>
            <button className="p-2 hover:bg-muted/60 rounded-full transition-colors">
              <Heart className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Hero Image Section */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:h-[500px]">
          <div className="md:col-span-2 rounded-3xl overflow-hidden shadow-xl aspect-[16/10] md:aspect-auto">
            <img
              src={
                tour.images?.[0] ||
                'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200'
              }
              alt={tour.title}
              className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
            />
          </div>
          <div className="hidden md:flex flex-col gap-4">
            <div className="flex-1 rounded-3xl overflow-hidden shadow-lg">
              <img
                src={
                  tour.images?.[1] ||
                  'https://images.unsplash.com/photo-1512100356956-c122ecc598a8?w=800'
                }
                alt="Tour detail 1"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 rounded-3xl overflow-hidden shadow-lg relative cursor-pointer group">
              <img
                src={
                  tour.images?.[2] ||
                  'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800'
                }
                alt="Tour detail 2"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 glass-overlay flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-8 h-8 text-white mb-2" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-4 pt-2">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left Column: Details */}
          <div className="lg:col-span-2 space-y-10">
            <div className="space-y-5 isolate">
              <div className="flex flex-wrap gap-2">
                <GlassBadge variant="primary" size="default" className="font-bold">
                  {tour.tour_type}
                </GlassBadge>
                <GlassBadge variant="success" size="default" className="font-bold">
                  Verified Operator
                </GlassBadge>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground leading-tight break-words">
                {tour.title}
              </h1>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 font-medium">
                <div className="flex items-center gap-2 bg-background/90 backdrop-blur-sm border border-border/50 rounded-xl px-3 py-2 min-w-0 text-foreground/90">
                  <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="min-w-0 truncate">
                    {tour.location.city}, {tour.location.country}
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-background/90 backdrop-blur-sm border border-border/50 rounded-xl px-3 py-2 min-w-0 text-foreground/90">
                  <Clock className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="min-w-0 truncate">{tour.duration}</span>
                </div>
                <div className="flex items-center gap-2 bg-background/90 backdrop-blur-sm border border-border/50 rounded-xl px-3 py-2 min-w-0">
                  <Star className="w-5 h-5 text-warning fill-current flex-shrink-0" />
                  <span className="text-foreground font-bold">{tour.rating}</span>
                  <span className="min-w-0 text-sm font-medium truncate text-muted-foreground">
                    ({tour.review_count} reviews)
                  </span>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="mt-1 border-b border-border/50 overflow-x-auto">
              <div className="flex min-w-max">
              {[
                { id: 'overview', label: 'Overview', icon: Info },
                { id: 'itinerary', label: 'Itinerary', icon: Map },
                { id: 'policies', label: 'Policies', icon: ShieldCheck },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 sm:px-6 py-4 font-bold text-sm whitespace-nowrap shrink-0 transition-all border-b-2 ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground/70 hover:text-foreground'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="py-6 min-h-[400px]">
              {activeTab === 'overview' && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-10"
                >
                  <div className="space-y-4">
                    <h3 className="text-2xl font-bold text-foreground">Experience Highlights</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {tour.highlights.map((h, i) => (
                        <div key={i} className="flex items-start gap-3 bg-muted/50 p-4 rounded-2xl">
                          <div className="bg-primary/10 p-2 rounded-xl">
                            <Check className="w-4 h-4 text-primary" />
                          </div>
                          <span className="text-foreground/90 font-medium">{h}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="max-w-none space-y-4">
                    <h3 className="text-2xl font-bold text-foreground">Description</h3>
                    <p className="text-muted-foreground leading-relaxed font-medium">
                      {tour.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-border/50">
                    <div className="space-y-4">
                      <h4 className="text-lg font-bold text-foreground">What's Included</h4>
                      <ul className="space-y-3">
                        {tour.inclusions.map((inc, i) => (
                          <li
                            key={i}
                            className="flex items-center gap-3 text-muted-foreground font-medium"
                          >
                            <Check className="w-4 h-4 text-success" />
                            {inc}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-lg font-bold text-foreground">Exclusions</h4>
                      <ul className="space-y-3">
                        {tour.exclusions.map((exc, i) => (
                          <li
                            key={i}
                            className="flex items-center gap-3 text-muted-foreground/70 font-medium line-through"
                          >
                            <X className="w-4 h-4 text-error" />
                            {exc}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'itinerary' && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-8"
                >
                  {tour.itinerary?.map((day: any, idx: number) => (
                    <div
                      key={idx}
                      className="relative pl-10 pb-8 last:pb-0 border-l-2 border-border/50 last:border-transparent"
                    >
                      <div className="absolute left-[-11px] top-0 w-5 h-5 rounded-full bg-primary ring-4 ring-background" />
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-lg font-bold text-foreground">
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
                              className="bg-background border border-border/50 p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
                            >
                              <div className="flex items-start gap-4">
                                <div className="bg-primary/5 p-3 rounded-xl text-primary font-bold text-xs">
                                  {act.time}
                                </div>
                                <div className="flex-1 space-y-1">
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
                </motion.div>
              )}
            </div>
          </div>

          {/* Right Column: Booking Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 z-30 space-y-6">
              <div className="bg-background border border-border/50 rounded-[2.5rem] p-8 shadow-lg space-y-6">
                <div className="flex items-baseline justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-muted-foreground/70 uppercase tracking-widest">
                      Price per person
                    </p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-foreground">
                        {tour.currency} {tour.price}
                      </span>
                      <span className="text-sm font-medium text-muted-foreground">all inclusive</span>
                    </div>
                  </div>
                  <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-black">
                    BEST VALUE
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Schedule Information */}
                  <div className="p-4 bg-info/10 rounded-2xl border border-info/20 space-y-3">
                    {schedule ? (
                      <>
                        <div className="flex items-start gap-3">
                          <Calendar className="w-5 h-5 text-info flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-info uppercase tracking-widest mb-1">
                              Departure Date
                            </p>
                            <p className="text-foreground font-bold text-sm">
                              {formatDate(schedule.start_time)} at {formatTime(schedule.start_time)}
                            </p>
                            <p className="text-xs text-muted-foreground font-medium mt-1">
                              Returns: {formatDate(schedule.end_time)}
                            </p>
                          </div>
                        </div>
                        <div className="h-px bg-info/20" />
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2 text-info font-bold uppercase text-[10px] tracking-wider">
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
                        <p className="text-sm text-warning font-medium">
                          No departure dates available
                        </p>
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={handleBookNow}
                    disabled={!schedule || (availableSlots !== null && availableSlots <= 0)}
                    className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-lg shadow-xl shadow-primary/25 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {!schedule
                      ? 'No Dates Available'
                      : schedule && availableSlots === 0
                        ? 'Sold Out'
                        : 'Continue to Booking'}
                  </Button>

                  <p className="text-center text-[10px] text-muted-foreground/70 font-bold uppercase tracking-widest">
                    Free cancellation up to 48h before
                  </p>
                </div>

                <div className="pt-6 border-t border-border/50 space-y-4">
                  <h5 className="text-sm font-bold text-foreground">Why choose this tour?</h5>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground">
                      <div className="w-6 h-6 bg-success/10 rounded-full flex items-center justify-center">
                        <ShieldCheck className="w-3.5 h-3.5 text-success" />
                      </div>
                      Secure booking with instant confirmation
                    </div>
                    <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground">
                      <div className="w-6 h-6 bg-info/10 rounded-full flex items-center justify-center">
                        <Info className="w-3.5 h-3.5 text-info" />
                      </div>
                      Small group guarantee (max {tour.max_participants})
                    </div>
                  </div>
                </div>
              </div>

              {/* Operator Info */}
              <div className="bg-foreground rounded-[2rem] p-6 text-background flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-background/20 flex items-center justify-center font-bold text-xl">
                  {tour.operator_id?.slice(0, 1).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-background/50 uppercase tracking-widest">
                    Hosted by
                  </p>
                  <h6 className="font-bold truncate">Premium Tour Operator</h6>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary font-bold hover:bg-background/10 p-0 h-auto"
                >
                  Contact
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
