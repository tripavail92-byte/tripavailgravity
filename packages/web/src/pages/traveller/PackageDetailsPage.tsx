import { format } from 'date-fns'
import {
  AlertCircle,
  ArrowLeft,
  Calendar as CalendarIcon,
  Check,
  ChevronDown,
  Clock,
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
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { DateRange } from 'react-day-picker'
import { useNavigate, useParams } from 'react-router-dom'

import { SiteFooter } from '@/components/layout/SiteFooter'
import { Button } from '@/components/ui/button'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import {
  GlassBadge,
  GlassButton,
  GlassCard,
  GlassContent,
  GlassDescription,
  GlassHeader,
  GlassTitle,
} from '@/components/ui/glass'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { packageBookingService } from '@/features/booking'
import { getAmenityIcon } from '@/features/hotel-listing/assets/AnimatedAmenityIcons'
import { getPackageById } from '@/features/package-creation/services/packageService'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

// Helper to normalize amenity strings to kebab-case for centralized icon lookup
const normalizeAmenityId = (amenityStr: string): string => {
  return amenityStr
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Helper to get amenity display config using centralized icon system
const getAmenityConfig = (amenityStr: string) => {
  const normalizedId = normalizeAmenityId(amenityStr)
  const IconComponent = getAmenityIcon(normalizedId)

  return {
    Icon: IconComponent,
    label: amenityStr,
  }
}

export default function PackageDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [packageData, setPackageData] = useState<any>(null)
  const [roomData, setRoomData] = useState<any[]>([])
  const [aggregatedAmenities, setAggregatedAmenities] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Booking State
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [guests, setGuests] = useState(2)
  const [isGuestOpen, setIsGuestOpen] = useState(false)
  const [priceQuote, setPriceQuote] = useState<{
    total_price: number
    price_per_night: number
    number_of_nights: number
  } | null>(null)
  const [availabilityError, setAvailabilityError] = useState<string | null>(null)
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false)

  useEffect(() => {
    let isMounted = true
    const fetchData = async () => {
      if (!id) {
        console.warn('PackageDetailsPage: No ID found in params')
        if (isMounted) setLoading(false)
        return
      }

      console.log(`PackageDetailsPage: Fetching package ${id}...`)

      // Timeout safety valve
      const timeoutId = setTimeout(() => {
        if (isMounted && loading) {
          console.error('PackageDetailsPage: Fetch timed out')
          setError('Request timed out. Please check your connection.')
          setLoading(false)
        }
      }, 10000) // 10 seconds

      try {
        // 1. Fetch Package Data
        const pkg = await getPackageById(id)

        if (!isMounted) return

        console.log('PackageDetailsPage: Package loaded', pkg)
        setPackageData(pkg)

        // 2. Fetch Linked Hotel & Room Amenities
        const amenitiesSet = new Set<string>()

        // Add Package Highlights first
        if (pkg.highlights) pkg.highlights.forEach((h: string) => amenitiesSet.add(h))

        // Fetch Hotel Details & Amenities
        if (pkg.hotel_id) {
          const { data: hotel, error: hError } = await supabase
            .from('hotels')
            .select('name, amenities')
            .eq('id', pkg.hotel_id)
            .maybeSingle()

          if (hError) {
            console.warn('PackageDetailsPage: Hotel fetch warning', hError)
          }

          if (hotel) {
            if (hotel.amenities) {
              ;(hotel.amenities as string[]).forEach((a) => amenitiesSet.add(a))
            }
            setPackageData((prev: any) => ({ ...prev, hotel }))
          }
        }

        // Fetch Room Details & Amenities (if linked)
        const roomConfig = pkg.room_configuration as any
        const roomIds = roomConfig?.rooms?.map((r: any) => r.room_id) || []
        if (roomIds.length > 0) {
          const { data: rooms, error: rError } = await supabase
            .from('rooms')
            .select('name, description, amenities')
            .in('id', roomIds)

          if (rError) {
            console.warn('PackageDetailsPage: Room fetch warning', rError)
          }

          if (rooms) {
            setRoomData(rooms)
            rooms.forEach((room) => {
              if (room.amenities && Array.isArray(room.amenities)) {
                ;(room.amenities as string[]).forEach((a) => amenitiesSet.add(a))
              }
            })
          }
        }

        if (isMounted) {
          setAggregatedAmenities(Array.from(amenitiesSet))
        }
      } catch (err: any) {
        console.error('PackageDetailsPage: Error fetching data:', err)
        if (isMounted) setError(err.message || 'Failed to load package details')
      } finally {
        clearTimeout(timeoutId)
        if (isMounted) setLoading(false)
      }
    }

    fetchData()

    return () => {
      isMounted = false
    }
  }, [id])

  const formatDateParam = (date: Date) => format(date, 'yyyy-MM-dd')

  useEffect(() => {
    const checkAvailabilityAndPrice = async () => {
      if (!packageData?.id || !dateRange?.from || !dateRange?.to) {
        setPriceQuote(null)
        setAvailabilityError(null)
        return
      }

      const minNightsLocal = Number(packageData?.minimum_nights ?? 1)
      const maxNightsLocal = Number(packageData?.maximum_nights ?? 30)
      const nightsLocal = Math.round(
        (dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24),
      )

      if (nightsLocal > 0 && (nightsLocal < minNightsLocal || nightsLocal > maxNightsLocal)) {
        setPriceQuote(null)
        setAvailabilityError(
          nightsLocal < minNightsLocal
            ? `Minimum ${minNightsLocal} nights required`
            : `Maximum ${maxNightsLocal} nights allowed`,
        )
        return
      }

      const checkIn = formatDateParam(dateRange.from)
      const checkOut = formatDateParam(dateRange.to)

      setIsCheckingAvailability(true)
      setAvailabilityError(null)

      try {
        const isAvailable = await packageBookingService.checkAvailability(
          packageData.id,
          checkIn,
          checkOut,
        )

        if (!isAvailable) {
          setPriceQuote(null)
          setAvailabilityError('Selected dates are not available. Please choose different dates.')
          return
        }

        const pricing =
          priceQuote ||
          (await packageBookingService.calculatePrice(packageData.id, checkIn, checkOut))

        setPriceQuote(pricing)
      } catch (err: any) {
        setPriceQuote(null)
        setAvailabilityError(err?.message || 'Failed to check availability')
      } finally {
        setIsCheckingAvailability(false)
      }
    }

    checkAvailabilityAndPrice()
  }, [
    dateRange?.from,
    dateRange?.to,
    packageData?.id,
    packageData?.minimum_nights,
    packageData?.maximum_nights,
  ])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading package details...</p>
      </div>
    )
  }

  // DEBUG: Show specific error if fetch failed
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold text-destructive mb-2">Error Loading Package</h1>
        <div className="bg-destructive/10 p-4 rounded-lg border border-destructive/20 max-w-md w-full overflow-auto">
          <p className="font-mono text-sm text-destructive">{String(error)}</p>
          {/* Show more details if available */}
          <pre className="text-xs text-destructive mt-2 whitespace-pre-wrap">
            {JSON.stringify(error, null, 2)}
          </pre>
        </div>
        <Button className="mt-6" onClick={() => navigate('/')}>
          Return Home
        </Button>
      </div>
    )
  }

  if (error || !packageData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold text-foreground mb-2">Package Not Found</h1>
        <p className="text-muted-foreground mb-6">
          {error || "The package you're looking for doesn't exist or has been removed."}
        </p>
        <Button onClick={() => navigate('/')}>Return Home</Button>
      </div>
    )
  }

  const {
    name,
    description,
    media_urls,
    cover_image,
    inclusions,
    exclusions,
    package_type,
    cancellation_policy,
    payment_terms,
    hotel, // We need hotel name/location
  } = packageData || {}

  const allImages =
    media_urls && media_urls.length > 0 ? media_urls : cover_image ? [cover_image] : []

  // ... rest of the component

  // Calculate nights if dates selected
  const nights =
    dateRange?.from && dateRange?.to
      ? Math.round((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24))
      : 0
  const minNights = Number(packageData?.minimum_nights ?? 1)
  const maxNights = Number(packageData?.maximum_nights ?? 30)
  const isStayLengthValid = nights <= 0 || (nights >= minNights && nights <= maxNights)
  const stayLengthMessage =
    nights <= 0
      ? `Minimum ${minNights} night${minNights !== 1 ? 's' : ''} · Maximum ${maxNights} nights`
      : isStayLengthValid
        ? `Minimum ${minNights} night${minNights !== 1 ? 's' : ''} · Maximum ${maxNights} nights`
        : nights < minNights
          ? `Minimum ${minNights} nights required`
          : `Maximum ${maxNights} nights allowed`
  const basePrice = Number(packageData?.base_price_per_night || 0)
  const displayBasePrice = priceQuote?.price_per_night || basePrice
  const totalPrice = priceQuote?.total_price || 0
  const maxGuests = packageData?.max_guests || 4

  const handleRequestToBook = async () => {
    if (!id || !dateRange?.from || !dateRange?.to) {
      setAvailabilityError('Please select check-in and check-out dates.')
      return
    }

    if (!isStayLengthValid) {
      setAvailabilityError(stayLengthMessage)
      return
    }

    const checkIn = formatDateParam(dateRange.from)
    const checkOut = formatDateParam(dateRange.to)

    setIsCheckingAvailability(true)
    setAvailabilityError(null)

    try {
      const isAvailable = await packageBookingService.checkAvailability(
        packageData.id,
        checkIn,
        checkOut,
      )

      if (!isAvailable) {
        setAvailabilityError('Selected dates are not available. Please choose different dates.')
        return
      }

      const pricing = await packageBookingService.calculatePrice(packageData.id, checkIn, checkOut)

      navigate(`/checkout/package/${packageData.id}`, {
        state: {
          checkIn,
          checkOut,
          guestCount: guests,
          pricing,
        },
      })
    } catch (err: any) {
      setAvailabilityError(err?.message || 'Unable to start booking')
    } finally {
      setIsCheckingAvailability(false)
    }
  }

  return (
    <div className="min-h-screen bg-muted/30 pb-20">
      {/* Header / Nav */}
      <GlassCard
        variant="nav"
        blur="md"
        className="sticky top-0 z-40 border-b border-border/40"
      >
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
        {/* Hero Gallery */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-3 h-[300px] md:h-[500px] rounded-3xl overflow-hidden mb-12 shadow-2xl"
        >
          <div className="md:col-span-2 h-full bg-muted/60 relative group overflow-hidden">
            {allImages[0] ? (
              <motion.img
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.8 }}
                src={allImages[0]}
                alt={name}
                className="w-full h-full object-cover cursor-pointer"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground/60">
                No Image
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
          </div>
          <div className="hidden md:grid grid-rows-2 gap-3 h-full">
            <div className="bg-muted/60 h-full relative overflow-hidden group">
              {allImages[1] && (
                <motion.img
                  whileHover={{ scale: 1.1 }}
                  src={allImages[1]}
                  alt={name}
                  className="w-full h-full object-cover cursor-pointer"
                />
              )}
            </div>
            <div className="bg-muted/60 h-full relative overflow-hidden group">
              {allImages[2] && (
                <motion.img
                  whileHover={{ scale: 1.1 }}
                  src={allImages[2]}
                  alt={name}
                  className="w-full h-full object-cover cursor-pointer"
                />
              )}
            </div>
          </div>
          <div className="hidden md:grid grid-rows-2 gap-3 h-full">
            <div className="bg-muted/60 h-full relative overflow-hidden group">
              {allImages[3] && (
                <motion.img
                  whileHover={{ scale: 1.1 }}
                  src={allImages[3]}
                  alt={name}
                  className="w-full h-full object-cover cursor-pointer"
                />
              )}
            </div>
            <div className="bg-muted/60 h-full relative overflow-hidden group">
              {allImages[4] && (
                <motion.img
                  whileHover={{ scale: 1.1 }}
                  src={allImages[4]}
                  alt={name}
                  className="w-full h-full object-cover cursor-pointer"
                />
              )}
              {allImages.length > 5 && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center text-white font-bold cursor-pointer hover:bg-black/30 transition-colors">
                  <div className="text-center">
                    <div className="text-2xl">+{allImages.length - 5}</div>
                    <div className="text-xs uppercase tracking-wider">More Photos</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-12">
            {/* Title Section */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <GlassBadge variant="primary" size="lg" className="capitalize">
                      {package_type?.replace('-', ' ') || 'Custom Package'}
                    </GlassBadge>
                    <GlassBadge variant="success" size="lg" icon={<Sparkles size={14} />}>
                      Top Choice
                    </GlassBadge>
                  </div>
                  <h1 className="text-4xl md:text-5xl font-black text-foreground mb-4 tracking-tight leading-tight">
                    {name}
                  </h1>
                  <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground font-medium">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-warning/10 rounded-full">
                        <Star size={16} className="text-warning fill-current" />
                      </div>
                      <span className="font-bold text-foreground">New Experience</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-info/10 rounded-full">
                        <MapPin size={16} className="text-info" />
                      </div>
                      <span className="font-bold text-foreground">Premium Destination</span>
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

            {/* Description */}
            <GlassCard
              variant="card"
              className="rounded-3xl border-none shadow-xl"
            >
              <GlassHeader>
                <GlassTitle className="text-2xl font-bold">About the Journey</GlassTitle>
              </GlassHeader>
              <GlassContent>
                <p className="text-muted-foreground leading-relaxed text-lg whitespace-pre-line">
                  {description ||
                    'Experience the ultimate getaway with our curated premium package designed for discerning travelers.'}
                </p>
              </GlassContent>
            </GlassCard>

            {/* Accommodation Details (Room) */}
            {roomData && roomData.length > 0 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-foreground px-2">Accommodation</h2>
                {roomData.map((room: any, idx: number) => (
                  <GlassCard
                    key={idx}
                    variant="card"
                    className="rounded-3xl border-none shadow-xl overflow-hidden"
                  >
                    <GlassHeader className="bg-muted/40 border-b border-border/50 mb-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <GlassTitle className="text-xl font-bold text-primary">
                            {room.name}
                          </GlassTitle>
                          <GlassDescription className="font-medium text-muted-foreground flex items-center gap-1 mt-1">
                            <MapPin size={14} /> {hotel?.name || 'Partner Hotel'}
                          </GlassDescription>
                        </div>
                        <GlassBadge variant="info">Premium Room</GlassBadge>
                      </div>
                    </GlassHeader>
                    <GlassContent>
                      {room.description && (
                        <p className="text-muted-foreground mb-8 leading-relaxed italic border-l-4 border-primary/20 pl-4">
                          "{room.description}"
                        </p>
                      )}

                      {/* Room Specific Amenities */}
                      {room.amenities && room.amenities.length > 0 && (
                        <div className="space-y-4">
                          <h4 className="text-sm font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
                            <div className="w-1 h-4 bg-primary rounded-full" />
                            Room Excellence
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {room.amenities.map((amenity: string, i: number) => {
                              const { Icon, label } = getAmenityConfig(amenity)
                              return (
                                <motion.div
                                  key={i}
                                  whileHover={{ y: -5 }}
                                  className="flex flex-col items-center justify-center p-4 bg-background rounded-2xl border border-border/60 hover:border-primary/20 hover:shadow-lg transition-all group"
                                >
                                  <div className="mb-3 text-primary">
                                    <Icon size={32} isHovered={true} />
                                  </div>
                                  <span className="text-xs font-bold text-foreground text-center uppercase tracking-tight">
                                    {label}
                                  </span>
                                </motion.div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </GlassContent>
                  </GlassCard>
                ))}
              </div>
            )}

            {/* Free Inclusions & Exclusive Offers Grid */}
            {(packageData.free_inclusions?.length > 0 ||
              packageData.discount_offers?.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Free Inclusions */}
                {packageData.free_inclusions?.length > 0 && (
                  <GlassCard
                    variant="card"
                    className="rounded-3xl border-none shadow-xl"
                  >
                    <GlassHeader>
                      <GlassTitle className="text-xl font-bold flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                        Included Perks
                      </GlassTitle>
                    </GlassHeader>
                    <GlassContent>
                      <div className="space-y-3">
                        {packageData.free_inclusions.map((item: any, idx: number) => (
                          <motion.div
                            key={idx}
                            whileHover={{ x: 5 }}
                            className="flex items-center gap-3 p-4 bg-success/10 border border-success/20 rounded-2xl"
                          >
                            <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center text-success shrink-0 shadow-sm">
                              <Check size={14} strokeWidth={3} />
                            </div>
                            <span className="font-bold text-foreground text-sm">{item.name}</span>
                          </motion.div>
                        ))}
                      </div>
                    </GlassContent>
                  </GlassCard>
                )}

                {/* Exclusive Discount Offers */}
                {packageData.discount_offers?.length > 0 && (
                  <GlassCard
                    variant="card"
                    className="rounded-3xl border-none shadow-xl"
                  >
                    <GlassHeader>
                      <GlassTitle className="text-xl font-bold flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-warning/10 text-warning flex items-center justify-center font-black text-xs">
                          %
                        </div>
                        Limited Offers
                      </GlassTitle>
                    </GlassHeader>
                    <GlassContent>
                      <div className="space-y-3">
                        {packageData.discount_offers.map((offer: any, idx: number) => (
                          <motion.div
                            key={idx}
                            whileHover={{ scale: 1.02 }}
                            className="flex items-center justify-between p-4 bg-background border border-warning/20 rounded-2xl shadow-sm group hover:border-warning/30 transition-all"
                          >
                            <div>
                              <div className="font-bold text-foreground group-hover:text-primary transition-colors text-sm">
                                {offer.name}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="line-through text-muted-foreground/70 text-xs">
                                  ${offer.originalPrice}
                                </span>
                                <span className="font-black text-success text-sm">
                                  ${(offer.originalPrice * (1 - offer.discount / 100)).toFixed(0)}
                                </span>
                              </div>
                            </div>
                            <GlassBadge variant="warning" size="sm" className="font-black">
                              -{offer.discount}%
                            </GlassBadge>
                          </motion.div>
                        ))}
                      </div>
                    </GlassContent>
                  </GlassCard>
                )}
              </div>
            )}

            {/* Highlights & Aggregated Amenities */}
            {aggregatedAmenities.length > 0 && (
              <div className="space-y-8">
                <h2 className="text-2xl font-bold text-foreground px-2 flex items-center gap-2">
                  Amenities & Experience
                  <GlassBadge variant="outline" size="sm" className="font-medium ml-2">
                    Verified
                  </GlassBadge>
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {aggregatedAmenities.map((amenity: string, idx: number) => {
                    const { Icon, label } = getAmenityConfig(amenity)
                    return (
                      <motion.div
                        key={idx}
                        whileHover={{ y: -8, scale: 1.05 }}
                        className="flex flex-col items-center justify-center p-4 bg-background border border-border/60 rounded-[2rem] shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 group"
                      >
                        <div className="mb-3 text-primary">
                          <Icon size={48} isHovered={true} />
                        </div>
                        <span className="text-[10px] font-black text-foreground text-center uppercase tracking-widest">
                          {label}
                        </span>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="h-px bg-border/60" />

            {/* Inclusions / Exclusions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <GlassCard variant="card" className="rounded-3xl border-none bg-success/10">
                <GlassHeader>
                  <GlassTitle className="text-xl font-bold flex items-center gap-2 text-success">
                    <Check className="text-success" size={24} strokeWidth={3} />
                    What's Included
                  </GlassTitle>
                </GlassHeader>
                <GlassContent>
                  {inclusions && inclusions.length > 0 ? (
                    <ul className="space-y-4">
                      {inclusions.map((item: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-3 text-foreground font-medium">
                          <div className="mt-1 w-1.5 h-1.5 rounded-full bg-success shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground/70 italic">No inclusions listed</p>
                  )}
                </GlassContent>
              </GlassCard>

              <GlassCard variant="card" className="rounded-3xl border-none bg-destructive/10">
                <GlassHeader>
                  <GlassTitle className="text-xl font-bold flex items-center gap-2 text-destructive">
                    <X className="text-destructive" size={24} strokeWidth={3} />
                    What's Excluded
                  </GlassTitle>
                </GlassHeader>
                <GlassContent>
                  {exclusions && exclusions.length > 0 ? (
                    <ul className="space-y-4">
                      {exclusions.map((item: string, idx: number) => (
                        <li
                          key={idx}
                          className="flex items-start gap-3 text-foreground font-medium font-mono text-xs"
                        >
                          <div className="mt-1.5 w-1 h-3 bg-destructive/30 rounded-full shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground/70 italic">No exclusions listed</p>
                  )}
                </GlassContent>
              </GlassCard>
            </div>

            {/* Policies */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-12">
              {cancellation_policy && (
                <div className="p-6 rounded-3xl bg-muted/40 border border-border/50">
                  <h3 className="text-sm font-black text-foreground uppercase tracking-widest mb-4">
                    Cancellation Policy
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line font-medium">
                    {cancellation_policy}
                  </p>
                </div>
              )}
              {payment_terms && (
                <div className="p-6 rounded-3xl bg-muted/40 border border-border/50">
                  <h3 className="text-sm font-black text-foreground uppercase tracking-widest mb-4">
                    Payment Terms
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line font-medium">
                    {payment_terms}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sticky Sidebar - Booking Card */}
          <div className="relative">
            <GlassCard
              variant="card"
              className="sticky top-24 border-none shadow-2xl shadow-primary/10 rounded-[2.5rem] p-8 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl" />

              <div className="flex items-end gap-2 mb-8 relative">
                <span className="text-4xl font-black text-foreground tracking-tight">
                  {displayBasePrice > 0
                    ? `$${displayBasePrice.toLocaleString()}`
                    : 'Price on request'}
                </span>
                {displayBasePrice > 0 && (
                  <span className="text-muted-foreground font-bold mb-1.5 tracking-wide">/ night</span>
                )}
              </div>

              <div className="space-y-6 mb-8 relative">
                <div className="bg-muted/40 rounded-3xl border border-border/60 overflow-hidden">
                  {/* Date Picker Trigger */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <div className="grid grid-cols-2 border-b border-border/50 cursor-pointer hover:bg-muted/40 transition-all duration-300">
                        <div className="p-4 border-r border-border/50">
                          <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] block mb-2">
                            Check-in
                          </label>
                          <div className="flex items-center gap-2">
                            <CalendarIcon size={14} className="text-muted-foreground/70" />
                            <span
                              className={cn(
                                'font-bold text-sm',
                                !dateRange?.from && 'text-muted-foreground/70 italic',
                              )}
                            >
                              {dateRange?.from
                                ? format(dateRange.from, 'MMM d, yyyy')
                                : 'Select Date'}
                            </span>
                          </div>
                        </div>
                        <div className="p-4">
                          <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] block mb-2">
                            Check-out
                          </label>
                          <div className="flex items-center gap-2">
                            <CalendarIcon size={14} className="text-muted-foreground/70" />
                            <span
                              className={cn(
                                'font-bold text-sm',
                                !dateRange?.to && 'text-muted-foreground/70 italic',
                              )}
                            >
                              {dateRange?.to ? format(dateRange.to, 'MMM d, yyyy') : 'Select Date'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto p-0 rounded-3xl overflow-hidden shadow-2xl border-none"
                      align="end"
                    >
                      <CalendarComponent
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={setDateRange}
                        numberOfMonths={2}
                        className="p-4"
                        disabled={(date) => date < new Date()}
                      />
                    </PopoverContent>
                  </Popover>

                  <div className="px-4 py-3 border-b border-border/50 bg-background/30 backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                      <Clock
                        size={14}
                        className={isStayLengthValid ? 'text-primary' : 'text-destructive'}
                      />
                      <p
                        className={cn(
                          'text-[10px] font-black uppercase tracking-widest',
                          isStayLengthValid ? 'text-muted-foreground' : 'text-destructive',
                        )}
                      >
                        {stayLengthMessage}
                      </p>
                    </div>
                  </div>

                  {/* Guest Selector */}
                  <Popover open={isGuestOpen} onOpenChange={setIsGuestOpen}>
                    <PopoverTrigger asChild>
                      <div className="p-4 cursor-pointer hover:bg-muted/40 transition-all duration-300 flex items-center justify-between">
                        <div>
                          <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] block mb-2">
                            Travelers
                          </label>
                          <div className="flex items-center gap-2">
                            <Users size={14} className="text-muted-foreground/70" />
                            <span className="font-bold text-sm text-foreground">
                              {guests} traveler{guests > 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                        <ChevronDown size={16} className="text-primary" />
                      </div>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-[300px] p-6 rounded-3xl shadow-2xl border-none"
                      align="start"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-black text-foreground text-sm uppercase tracking-wider">
                            Travelers
                          </div>
                          <div className="text-[10px] text-muted-foreground/70 font-bold">Ages 13+</div>
                        </div>
                        <div className="flex items-center gap-4">
                          <GlassButton
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 rounded-2xl bg-muted/60 hover:bg-muted"
                            onClick={() => setGuests(Math.max(1, guests - 1))}
                            disabled={guests <= 1}
                          >
                            −
                          </GlassButton>
                          <span className="w-4 text-center font-black text-lg">{guests}</span>
                          <GlassButton
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 rounded-2xl bg-muted/60 hover:bg-muted"
                            onClick={() => setGuests(Math.min(maxGuests, guests + 1))}
                            disabled={guests >= maxGuests}
                          >
                            +
                          </GlassButton>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between text-[10px] font-black text-muted-foreground/70 uppercase tracking-widest">
                        <span>Capacity Limit</span>
                        <span className="text-primary">{maxGuests} Max</span>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    className="w-full h-16 text-lg font-black bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl shadow-primary/25 rounded-3xl tracking-widest uppercase transition-all duration-300"
                    onClick={handleRequestToBook}
                    disabled={
                      isCheckingAvailability ||
                      !dateRange?.from ||
                      !dateRange?.to ||
                      !isStayLengthValid
                    }
                  >
                    {isCheckingAvailability ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      'Confirm Booking'
                    )}
                  </Button>
                </motion.div>

                <AnimatePresence>
                  {availabilityError && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="rounded-2xl bg-destructive/10 p-4 border border-destructive/20"
                    >
                      <p className="text-xs font-bold text-destructive flex items-center gap-2">
                        <AlertCircle size={14} />
                        {availabilityError}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {nights > 0 && displayBasePrice > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="pt-6 border-t border-border/50 space-y-4"
                  >
                    <div className="flex justify-between items-center text-muted-foreground font-bold text-xs uppercase tracking-wider">
                      <span>
                        ${displayBasePrice.toLocaleString()} × {nights} night{nights > 1 ? 's' : ''}
                      </span>
                      <span className="text-foreground">${totalPrice.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center bg-muted/40 p-4 rounded-2xl">
                      <span className="text-sm font-black text-foreground uppercase tracking-widest">
                        Total Cost
                      </span>
                      <span className="text-2xl font-black text-primary">
                        ${totalPrice.toLocaleString()}
                      </span>
                    </div>
                  </motion.div>
                )}
              </div>

              <div className="flex flex-col items-center gap-4 relative">
                <div className="flex items-center gap-2 px-4 py-2 bg-success/10 rounded-full border border-success/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                  <span className="text-[10px] font-black text-success uppercase tracking-widest">
                    Free Cancellation
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground/70 font-bold uppercase tracking-tight text-center">
                  Trusted by 10,000+ happy travelers this year
                </p>
              </div>
            </GlassCard>
          </div>
        </div>
      </main>
      {/* Debug Section Removed */}

      <SiteFooter />
    </div>
  )
}
