import { useQuery } from '@tanstack/react-query'
import { BedDouble, ChevronLeft, Heart, MapPin, Share, Star } from 'lucide-react'
import { motion } from 'motion/react'
import { useNavigate, useParams } from 'react-router-dom'

import { ImageWithFallback } from '@/components/ImageWithFallback'
import { PackageCard } from '@/components/traveller/PackageCard'
import { TourSubNav } from '@/components/tour/TourSubNav'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  formatAmenityLabel,
  getAmenityLucideIcon,
} from '@/features/hotel-listing/assets/amenityLucideMap'
import { hotelService } from '@/features/hotel-listing/services/hotelService'
import { useMoney } from '@/hooks/useMoney'
import { useHotelStays } from '@/queries/packageQueries'

// Fields fetched from the hotels table. Location breakdown + guest rating are
// used for the property profile; base_price_per_night is deliberately NOT shown
// as a price any more — the sellable prices live on the stays (packages) below.
const HOTEL_SELECT =
  'id, name, location, city, country, description, star_rating, rating, review_count, main_image_url, images, amenities, latitude, longitude'

interface HotelRecord {
  id?: string
  name?: string | null
  location?: string | null
  city?: string | null
  country?: string | null
  description?: string | null
  star_rating?: number | null
  rating?: number | null
  review_count?: number | null
  main_image_url?: string | null
  images?: string[] | null
  amenities?: string[] | null
  latitude?: number | null
  longitude?: number | null
}

export default function HotelDetailsPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const money = useMoney()

  const {
    data: hotel,
    isLoading,
    isError,
  } = useQuery<HotelRecord | null>({
    queryKey: ['hotel', id],
    queryFn: () =>
      hotelService.getHotelById(id as string, HOTEL_SELECT) as Promise<HotelRecord | null>,
    enabled: !!id,
  })

  // The property's bookable stays — Room-Only rate first, then any curated
  // packages. This is what replaced the old mock booking card.
  const { data: stays = [], isLoading: staysLoading } = useHotelStays(id ?? '')

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-muted-foreground">We couldn&apos;t load this property. Please try again.</p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          Go back
        </Button>
      </div>
    )
  }

  if (!hotel) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-muted-foreground">Property not found.</p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          Go back
        </Button>
      </div>
    )
  }

  // Derived, safe-fallback view fields.
  const gallery: string[] = [
    ...(hotel.main_image_url ? [hotel.main_image_url] : []),
    ...(Array.isArray(hotel.images) ? hotel.images : []),
  ]
  const amenities: string[] = Array.isArray(hotel.amenities) ? hotel.amenities : []
  const guestRating =
    typeof hotel.rating === 'number' && hotel.rating > 0 ? hotel.rating : null
  const locationLabel =
    [hotel.city, hotel.country].filter(Boolean).join(', ') || hotel.location || ''

  // Cheapest stay drives the "from" price beside the title. Stays arrive
  // cheapest-first, so the first with a numeric price is the floor.
  const cheapest = stays.find((s) => typeof s.packagePrice === 'number')
  const fromMoney =
    cheapest && typeof cheapest.packagePrice === 'number'
      ? money(Math.round(cheapest.packagePrice), cheapest.currency)
      : null

  const sections = [
    { id: 'overview', label: 'Overview' },
    { id: 'stays', label: 'Stays' },
    ...(amenities.length > 0 ? [{ id: 'amenities', label: 'Amenities' }] : []),
    { id: 'location', label: 'Location' },
  ]

  return (
    <div className="min-h-screen bg-muted/30 pb-24">
      {/* Top nav — sticky, matches the tour & package detail pages. */}
      <div className="sticky top-0 z-40 border-b border-border/40 bg-background/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2">
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="rounded-full">
              <Share className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Heart className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Section sub-nav — sticks below the top bar. */}
      <TourSubNav sections={sections} />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Overview: title, rating, location, from-price, gallery, description. */}
        <div id="overview" className="scroll-mt-32">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-2xl md:text-3xl font-bold mb-2"
              >
                {hotel.name || '—'}
              </motion.h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                {guestRating ? (
                  <span className="inline-flex items-center gap-1 text-foreground">
                    <Star className="w-4 h-4 fill-primary text-primary" />
                    <span className="font-medium">{guestRating.toFixed(1)}</span>
                    {typeof hotel.review_count === 'number' && hotel.review_count > 0 ? (
                      <span className="text-muted-foreground">({hotel.review_count})</span>
                    ) : null}
                  </span>
                ) : hotel.star_rating ? (
                  <span className="inline-flex items-center gap-1 text-foreground">
                    <Star className="w-4 h-4 fill-primary text-primary" />
                    <span className="font-medium">{hotel.star_rating}-star</span>
                  </span>
                ) : null}
                {locationLabel ? (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {locationLabel}
                  </span>
                ) : null}
              </div>
            </div>

            {fromMoney ? (
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Stays from</div>
                <div className="text-xl font-bold text-foreground">
                  {fromMoney.estimate ? '≈ ' : ''}
                  {fromMoney.text}
                  <span className="text-sm font-normal text-muted-foreground"> / night</span>
                </div>
              </div>
            ) : null}
          </div>

          {/* Image gallery (Airbnb-style grid). */}
          <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-2 h-[300px] md:h-[450px] rounded-2xl overflow-hidden mb-10 relative group">
            <div className="col-span-2 row-span-2 relative">
              <ImageWithFallback
                src={gallery[0] || ''}
                alt={hotel.name || 'Property'}
                className="w-full h-full object-cover hover:brightness-95 transition-all"
              />
            </div>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="hidden md:block relative">
                <ImageWithFallback
                  src={gallery[i] || ''}
                  alt={`View ${i + 1}`}
                  className="w-full h-full object-cover hover:brightness-95 transition-all"
                />
              </div>
            ))}
          </div>

          {hotel.description ? (
            <p className="text-foreground/80 leading-relaxed max-w-3xl">{hotel.description}</p>
          ) : null}
        </div>

        {/* Stays — the sellable options. Replaces the old mock booking card:
            each card links to its own /packages/<slug> page where booking works. */}
        <section id="stays" className="scroll-mt-32 mt-14">
          <h2 className="text-xl md:text-2xl font-semibold mb-1">Choose your stay</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Room-only rates and curated packages at {hotel.name || 'this property'}.
          </p>

          {staysLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="aspect-[4/5] rounded-2xl" />
              ))}
            </div>
          ) : stays.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {stays.map((s) => (
                <PackageCard
                  key={s.id}
                  id={s.id}
                  slug={s.slug ?? undefined}
                  images={s.images}
                  title={s.title}
                  durationDays={s.durationDays}
                  rating={s.rating}
                  reviewCount={s.reviewCount}
                  priceFrom={typeof s.packagePrice === 'number' ? s.packagePrice : null}
                  currency={s.currency}
                  totalOriginal={s.totalOriginal}
                  totalDiscounted={s.totalDiscounted}
                  badge={s.badge}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border/70 bg-background/60 py-12 px-6 text-center">
              <BedDouble className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
              <p className="font-medium text-foreground">No stays published yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                This property isn&apos;t taking bookings just yet. Check back soon.
              </p>
            </div>
          )}
        </section>

        {/* Amenities. Uses the shared lucide map so each icon reflects the amenity. */}
        {amenities.length > 0 && (
          <section id="amenities" className="scroll-mt-32 mt-14 border-t border-border/50 pt-10">
            <h2 className="text-xl md:text-2xl font-semibold mb-4">What this place offers</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {amenities.map((item, idx) => {
                const Icon = getAmenityLucideIcon(item)
                return (
                  <div key={idx} className="flex items-center gap-3 text-foreground/80">
                    <Icon className="w-5 h-5 text-muted-foreground" />
                    <span>{formatAmenityLabel(item)}</span>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Location. */}
        <section id="location" className="scroll-mt-32 mt-14 border-t border-border/50 pt-10">
          <h2 className="text-xl md:text-2xl font-semibold mb-4">Where you&apos;ll be</h2>
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <div className="font-medium text-foreground">{locationLabel || 'Location on request'}</div>
              {hotel.location && hotel.location !== locationLabel ? (
                <div className="text-sm text-muted-foreground">{hotel.location}</div>
              ) : null}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
