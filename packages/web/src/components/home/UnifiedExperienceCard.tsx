import { Star } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { UnifiedExperience } from '@/types/experience'
import { cn } from '@/lib/utils'

export function UnifiedExperienceCard({
  experience,
  className,
}: {
  experience: UnifiedExperience
  className?: string
}) {
  const href = experience.type === 'hotel' ? `/stays/${experience.id}` : `/tours/${experience.id}`
  const badgeClass = experience.type === 'hotel' ? 'bg-hotel-primary' : 'bg-tour-primary'
  const badgeLabel = experience.type === 'hotel' ? 'Hotel Stay' : 'Tour Experience'

  const primaryImage = experience.images?.[0]

  const hasSavings =
    typeof experience.originalPrice === 'number' &&
    typeof experience.price === 'number' &&
    experience.originalPrice > experience.price

  const savingsAmount = hasSavings ? Math.round(experience.originalPrice! - experience.price!) : 0
  const savingsPercent =
    hasSavings && experience.originalPrice
      ? Math.round((savingsAmount / experience.originalPrice) * 100)
      : 0

  const rating = typeof experience.rating === 'number' ? experience.rating : null
  const reviewCount = typeof experience.reviewCount === 'number' ? experience.reviewCount : null

  return (
    <Link to={href} className="block h-full">
      <Card
        className={cn(
          'group cursor-pointer overflow-hidden border border-border/60 shadow-sm hover:shadow-xl transition-all duration-300 rounded-2xl h-full bg-background',
          className,
        )}
      >
        <div className="relative aspect-[4/5] overflow-hidden">
          {primaryImage ? (
            <img
              src={primaryImage}
              alt={experience.title}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
            />
          ) : (
            <Skeleton className="w-full h-full rounded-none" />
          )}

          <div
            className={cn(
              'absolute top-3 left-3 rounded-full px-3 py-1 text-xs font-medium text-white',
              badgeClass,
            )}
          >
            {badgeLabel}
          </div>

          {typeof rating === 'number' && rating > 0 ? (
            <div className="absolute top-3 right-3 rounded-full bg-black/35 backdrop-blur-sm px-3 py-1 text-xs font-medium text-white border border-white/10">
              <span className="inline-flex items-center gap-1">
                <Star size={12} className="fill-white text-white" />
                {rating.toFixed(1)}
                {typeof reviewCount === 'number' && reviewCount > 0 ? (
                  <span className="text-white/80">({reviewCount})</span>
                ) : null}
              </span>
            </div>
          ) : null}

          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/70 to-transparent" />

          <div className="absolute inset-x-3 bottom-3">
            <div className="min-w-0 rounded-xl bg-black/35 backdrop-blur-sm px-3 py-2 border border-white/10">
              <div className="text-white font-bold text-base leading-snug line-clamp-2">
                {experience.title}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col">
              {hasSavings ? (
                <>
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm text-muted-foreground line-through">
                      ${Math.round(experience.originalPrice!)}
                    </span>
                    <span className="font-bold text-lg text-foreground">
                      ${Math.round(experience.price!)}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Save ${savingsAmount}
                    {savingsPercent > 0 ? ` (${savingsPercent}%)` : ''}
                  </div>
                </>
              ) : typeof experience.price === 'number' && experience.price > 0 ? (
                <div className="flex items-baseline gap-2">
                  <span className="font-bold text-lg text-foreground">
                    ${Math.round(experience.price)}
                  </span>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">View details</div>
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
