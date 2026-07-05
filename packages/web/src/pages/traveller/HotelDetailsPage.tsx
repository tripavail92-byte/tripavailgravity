import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, Heart, MapPin, Share, Star, Users, Wifi } from 'lucide-react'
import { motion } from 'motion/react'
import { useNavigate, useParams } from 'react-router-dom'

import { ImageWithFallback } from '@/components/ImageWithFallback'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { hotelService } from '@/features/hotel-listing/services/hotelService'

// Fields fetched from the hotels table
const HOTEL_SELECT =
  'id, name, location, description, star_rating, base_price_per_night, main_image_url, images, amenities'

interface HotelRecord {
  id?: string
  name?: string | null
  location?: string | null
  description?: string | null
  star_rating?: number | null
  base_price_per_night?: number | null
  main_image_url?: string | null
  images?: string[] | null
  amenities?: string[] | null
}

export default function HotelDetailsPage() {
  const navigate = useNavigate()
  const { id } = useParams()

  const {
    data: hotel,
    isLoading,
    isError,
  } = useQuery<HotelRecord | null>({
    queryKey: ['hotel', id],
    queryFn: () => hotelService.getHotelById(id as string, HOTEL_SELECT) as Promise<HotelRecord | null>,
    enabled: !!id,
  })

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
        <p className="text-muted-foreground">We couldn&apos;t load this hotel. Please try again.</p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          Go back
        </Button>
      </div>
    )
  }

  if (!hotel) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-muted-foreground">Hotel not found.</p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          Go back
        </Button>
      </div>
    )
  }

  // Derived, safe-fallback view fields
  const gallery: string[] = [
    ...(hotel.main_image_url ? [hotel.main_image_url] : []),
    ...(Array.isArray(hotel.images) ? hotel.images : []),
  ]
  const amenities: string[] = Array.isArray(hotel.amenities) ? hotel.amenities : []
  const price = hotel.base_price_per_night ?? 0
  const rating = hotel.star_rating ?? '—'

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header / Nav */}
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
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl md:text-3xl font-bold mb-2"
          >
            {hotel.name || '—'}
          </motion.h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-primary text-primary" />
              <span className="font-medium text-foreground">{rating}</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span className="underline cursor-pointer">{hotel.location || '—'}</span>
            </div>
          </div>
        </div>

        {/* Image Gallery Grid (Airbnb Style) */}
        <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-2 h-[300px] md:h-[450px] rounded-2xl overflow-hidden mb-10 relative group">
          {/* Main Large Image */}
          <div className="col-span-2 row-span-2 relative cursor-pointer">
            <ImageWithFallback
              src={gallery[0] || ''}
              alt="Main view"
              className="w-full h-full object-cover hover:brightness-95 transition-all"
            />
          </div>
          {/* Smaller Images */}
          <div className="hidden md:block relative cursor-pointer">
            <ImageWithFallback
              src={gallery[1] || ''}
              alt="View 2"
              className="w-full h-full object-cover hover:brightness-95 transition-all"
            />
          </div>
          <div className="hidden md:block relative cursor-pointer rounded-tr-2xl">
            <ImageWithFallback
              src={gallery[2] || ''}
              alt="View 3"
              className="w-full h-full object-cover hover:brightness-95 transition-all"
            />
          </div>
          <div className="hidden md:block relative cursor-pointer">
            <ImageWithFallback
              src={gallery[3] || ''}
              alt="View 4"
              className="w-full h-full object-cover hover:brightness-95 transition-all"
            />
          </div>
          <div className="hidden md:block relative cursor-pointer rounded-br-2xl">
            <ImageWithFallback
              src={gallery[4] || ''}
              alt="View 5"
              className="w-full h-full object-cover hover:brightness-95 transition-all"
            />
            <Button
              variant="secondary"
              size="sm"
              className="absolute bottom-4 right-4 shadow-md opacity-90 hover:opacity-100"
            >
              Show all photos
            </Button>
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left Column: Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <div className="border-b pb-6">
              <p className="text-foreground/80 leading-relaxed">{hotel.description || '—'}</p>
            </div>

            {/* Amenities */}
            {amenities.length > 0 && (
              <div className="border-b pb-6">
                <h3 className="text-xl font-semibold mb-4">What this place offers</h3>
                <div className="grid grid-cols-2 gap-4">
                  {amenities.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-foreground/80">
                      <Wifi className="w-5 h-5 text-muted-foreground" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Booking Card (Sticky) */}
          <div className="relative">
            <Card className="sticky top-20 z-30 p-6 shadow-lg border-border/50">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <span className="text-2xl font-bold">${price}</span>
                  <span className="text-muted-foreground"> / night</span>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <Star className="w-3 h-3 fill-primary text-primary" />
                  <span className="font-semibold">{rating}</span>
                </div>
              </div>

              {/* Date/Guest Inputs Mock */}
              <div className="border rounded-xl mb-4 overflow-hidden">
                <div className="grid grid-cols-2 border-b">
                  <div className="p-3 border-r hover:bg-muted/50 cursor-pointer">
                    <div className="text-[10px] uppercase font-bold text-muted-foreground">
                      Check-in
                    </div>
                    <div className="text-sm">Add date</div>
                  </div>
                  <div className="p-3 hover:bg-muted/50 cursor-pointer">
                    <div className="text-[10px] uppercase font-bold text-muted-foreground">
                      Check-out
                    </div>
                    <div className="text-sm">Add date</div>
                  </div>
                </div>
                <div className="p-3 hover:bg-muted/50 cursor-pointer">
                  <div className="text-[10px] uppercase font-bold text-muted-foreground">
                    Guests
                  </div>
                  <div className="text-sm flex justify-between items-center">
                    1 guest
                    <Users className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              </div>

              <Button className="w-full bg-primary hover:bg-primary/90 text-lg py-6 mb-4">
                Reserve
              </Button>

              <div className="text-center text-sm text-muted-foreground mb-4">
                You won&apos;t be charged yet
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="underline decoration-muted-foreground">
                    ${price} x 5 nights
                  </span>
                  <span>${price * 5}</span>
                </div>
                <div className="flex justify-between">
                  <span className="underline decoration-muted-foreground">Cleaning fee</span>
                  <span>$60</span>
                </div>
                <div className="flex justify-between">
                  <span className="underline decoration-muted-foreground">Service fee</span>
                  <span>$85</span>
                </div>
                <div className="border-t pt-3 mt-3 flex justify-between font-bold text-base">
                  <span>Total before taxes</span>
                  <span>${price * 5 + 60 + 85}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
