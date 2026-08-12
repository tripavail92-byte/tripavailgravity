import { MapPin, Star } from 'lucide-react'
import { Link } from 'react-router-dom'

import { ImageSlider } from '@/components/ImageSlider'
import { Card } from '@/components/ui/card'
import { GlassBadge } from '@/components/ui/glass'
import { Skeleton } from '@/components/ui/skeleton'
import { useIsDesktop } from '@/hooks/useIsDesktop'
import { useMoney } from '@/hooks/useMoney'
import { cn } from '@/lib/utils'
import type { HotelBrowseItem } from '@/queries/hotelQueries'

interface HotelPropertyCardProps {
  hotel: HotelBrowseItem
  className?: string
}

/**
 * A hotel rendered as a PROPERTY card → /hotel/:id (the property profile), priced
 * by its cheapest stay. Deliberately distinct from PackageCard, which sells a
 * single stay and links to /packages/:slug. Same visual language, different unit.
 */
export function HotelPropertyCard({ hotel, className }: HotelPropertyCardProps) {
  // Mirror PackageCard: desktop opens in a new tab so the browse survives.
  const isDesktop = useIsDesktop()
  const money = useMoney()
  const fromMoney =
    typeof hotel.priceFrom === 'number'
      ? money(Math.round(hotel.priceFrom), hotel.currency)
      : null
  const primaryImage = hotel.images?.[0]

  return (
    <Link
      to={`/hotel/${hotel.id}`}
      target={isDesktop ? '_blank' : undefined}
      rel={isDesktop ? 'noopener noreferrer' : undefined}
      className="block h-full"
    >
      <Card
        className={cn(
          'group cursor-pointer overflow-hidden border-none shadow-sm hover:shadow-xl transition-all duration-300 rounded-2xl h-full bg-background',
          className,
        )}
      >
        <div className="relative aspect-[4/5] overflow-hidden">
          {Array.isArray(hotel.images) && hotel.images.length > 1 ? (
            <ImageSlider
              images={hotel.images}
              alt={hotel.name}
              autoSlideDelay={3500}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
            />
          ) : primaryImage ? (
            <img
              src={primaryImage}
              alt={hotel.name}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
            />
          ) : (
            <Skeleton className="w-full h-full rounded-none" />
          )}

          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/70 to-transparent" />

          <div className="absolute top-3 left-3">
            <GlassBadge variant="light" size="default" className="font-medium">
              {hotel.starRating ? `${hotel.starRating}★ Hotel` : 'Property'}
            </GlassBadge>
          </div>

          <div className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-3">
            <div className="min-w-0 rounded-xl bg-black/35 backdrop-blur-sm px-3 py-2 border border-white/10">
              <div className="text-white font-bold text-base leading-snug line-clamp-2">
                {hotel.name}
              </div>
              {hotel.location ? (
                <div className="text-white/80 text-xs line-clamp-1 flex items-center gap-1">
                  <MapPin size={11} />
                  {hotel.location}
                </div>
              ) : null}
            </div>

            {typeof hotel.rating === 'number' && hotel.rating > 0 ? (
              <GlassBadge variant="dark" size="sm" className="font-medium shrink-0">
                <span className="inline-flex items-center gap-1">
                  <Star size={12} className="fill-white text-white" />
                  {hotel.rating.toFixed(1)}
                  {typeof hotel.reviewCount === 'number' && hotel.reviewCount > 0 ? (
                    <span className="text-white/80">({hotel.reviewCount})</span>
                  ) : null}
                </span>
              </GlassBadge>
            ) : null}
          </div>
        </div>

        {/* Price + CTA STACK vertically. Side-by-side used to squeeze the price
            against the fixed-width button in the narrow 4-col search grid until
            it truncated to "PKR…". Stacked, the price always shows in full and
            the button becomes a clean full-width CTA at every card width. */}
        <div className="p-4 flex flex-col gap-3">
          <div className="min-w-0">
            <span className="block text-xs text-muted-foreground">
              {hotel.stayCount > 1 ? `${hotel.stayCount} stays · from` : 'From'}
            </span>
            <span className="block font-bold text-lg text-foreground whitespace-nowrap">
              {fromMoney ? (
                <>
                  {fromMoney.estimate ? '≈ ' : ''}
                  {fromMoney.text}
                  <span className="text-sm font-normal text-muted-foreground"> / night</span>
                </>
              ) : (
                'View details'
              )}
            </span>
          </div>

          <div className="inline-flex w-full items-center justify-center whitespace-nowrap rounded-md text-sm font-medium h-9 px-4 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
            View property
          </div>
        </div>
      </Card>
    </Link>
  )
}
