import { Clock, DollarSign, Star, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { GlassBadge } from '@/components/ui/glass'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface PackageCardProps {
  id: string
  slug?: string
  images: string[]
  title: string
  subtitle?: string
  location?: string
  durationDays?: number
  rating?: number
  reviewCount?: number
  priceFrom?: number | null
  totalOriginal?: number
  totalDiscounted?: number

  badge?: string
  instantConfirmation?: boolean
  className?: string
}

export function PackageCard({
  id,
  slug,
  images,
  title,
  subtitle,
  location,
  durationDays,
  rating,
  reviewCount,
  priceFrom,
  totalOriginal,
  totalDiscounted,
  badge,
  instantConfirmation = true,
  className,
}: PackageCardProps) {
  const primaryImage = images?.[0]
  const hasSavings =
    typeof totalOriginal === 'number' &&
    typeof totalDiscounted === 'number' &&
    totalOriginal > totalDiscounted

  return (
    <Link to={`/packages/${slug || id}`} className="block h-full">
      <Card
        className={cn(
          'group cursor-pointer overflow-hidden border-none shadow-sm hover:shadow-xl transition-all duration-300 rounded-2xl h-full bg-background',
          className,
        )}
      >
        {/* Image Container */}
        <div className="relative aspect-video overflow-hidden">
          {primaryImage ? (
            <img
              src={primaryImage}
              alt={title}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
            />
          ) : (
            <Skeleton className="w-full h-full rounded-none" />
          )}

          {/* Bottom gradient overlay */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />

          <div className="absolute top-3 left-3">
            {badge ? (
              <GlassBadge variant="light" size="default" className="font-medium">
                {badge}
              </GlassBadge>
            ) : null}
          </div>

          {Array.isArray(images) && images.length > 1 ? (
            <div className="absolute bottom-3 right-3">
              <GlassBadge variant="dark" size="sm" className="font-medium">
                1/{images.length}
              </GlassBadge>
            </div>
          ) : null}

          <div className="absolute top-3 right-3">
            <button className="p-2 rounded-full bg-black/20 backdrop-blur-sm text-white hover:bg-white hover:text-red-500 transition-colors">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5"
              >
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <div className="flex justify-between items-start">
            <div className="min-w-0 pr-3">
              <h3 className="font-bold text-lg leading-tight text-foreground group-hover:text-primary transition-colors line-clamp-2">
                {title}
              </h3>
              {subtitle ? (
                <p className="text-sm text-muted-foreground line-clamp-1 mt-1">{subtitle}</p>
              ) : null}
            </div>

            {typeof rating === 'number' && rating > 0 ? (
              <div className="flex items-center gap-1 text-sm font-medium shrink-0">
                <Star size={14} className="fill-foreground text-foreground" />
                <span>{rating.toFixed(1)}</span>
                {typeof reviewCount === 'number' && reviewCount > 0 ? (
                  <span className="text-muted-foreground">({reviewCount})</span>
                ) : null}
              </div>
            ) : null}
          </div>

          {/* Quick info chips */}
          <div className="flex flex-wrap items-center gap-2">
            {typeof durationDays === 'number' && durationDays > 0 ? (
              <Badge variant="secondary" className="rounded-full">
                <Clock className="w-3.5 h-3.5 mr-1" />
                {durationDays} Days
              </Badge>
            ) : null}

            {typeof priceFrom === 'number' && priceFrom > 0 ? (
              <Badge variant="secondary" className="rounded-full">
                <DollarSign className="w-3.5 h-3.5 mr-1" />
                From ${Math.round(priceFrom)}
              </Badge>
            ) : null}

            {instantConfirmation ? (
              <Badge variant="secondary" className="rounded-full">
                <Zap className="w-3.5 h-3.5 mr-1" />
                Instant confirmation
              </Badge>
            ) : null}
          </div>

          {location ? <div className="text-sm text-muted-foreground">{location}</div> : null}

          <div className="pt-3 flex items-center justify-between border-t border-border/60">
            <div className="flex flex-col">
              {hasSavings ? (
                <>
                  <span className="text-xs text-muted-foreground">Total</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm text-muted-foreground line-through">
                      ${Math.round(totalOriginal)}
                    </span>
                    <span className="font-bold text-lg text-foreground">${Math.round(totalDiscounted)}</span>
                  </div>
                </>
              ) : typeof priceFrom === 'number' && priceFrom > 0 ? (
                <>
                  <span className="text-xs text-muted-foreground">From</span>
                  <span className="font-bold text-lg text-foreground">${Math.round(priceFrom)}</span>
                </>
              ) : (
                <>
                  <span className="text-xs text-muted-foreground">Explore</span>
                  <span className="font-bold text-lg text-foreground">View details</span>
                </>
              )}
            </div>

            <div className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium h-9 px-4 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
              Book Now
            </div>
          </div>
        </div>
      </Card>
    </Link>
  )
}
