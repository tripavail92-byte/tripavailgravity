import { ArrowRight, CheckCircle2, Clock, Star, Zap } from 'lucide-react'
import { motion } from 'motion/react'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { GlassBadge } from '@/components/ui/glass'

interface TourCardProps {
  id: string
  slug?: string
  image: string
  title: string
  location: string
  duration: string
  rating: number
  reviewCount: number
  price: number
  currency: string
  type: string
  isFeatured?: boolean
}

export function TourCard({
  id,
  slug,
  image,
  title,
  location,
  duration,
  rating,
  price,
  currency,
  type,
  isFeatured,
}: Omit<TourCardProps, 'reviewCount'>) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group cursor-pointer h-full"
    >
      <Link to={`/tours/${slug || id}`} className="block h-full">
        <Card className="group cursor-pointer overflow-hidden border-none shadow-sm hover:shadow-xl transition-all duration-300 rounded-2xl h-full bg-background">
          <div className="relative aspect-[4/5] overflow-hidden">
            <img
              src={image}
              alt={title}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
            />

            {/* Overlays */}
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/70 to-transparent" />

            <div className="absolute top-3 left-3 flex flex-col gap-2">
              <GlassBadge
                variant="outline"
                size="sm"
                className="glass-id-badge glass-id-badge-tour rounded-full px-3 py-1 text-white font-medium"
              >
                Tour Package
              </GlassBadge>

              {isFeatured ? (
                <Badge className="bg-primary/80 text-primary-foreground border border-primary/40 backdrop-blur-md rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
                  Featured
                </Badge>
              ) : null}
            </div>

            {/* Title overlay (always visible) */}
            <div className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-3">
              <div className="min-w-0 rounded-xl bg-black/35 backdrop-blur-sm px-3 py-2 border border-white/10">
                <div className="text-white font-bold text-base leading-snug line-clamp-2">{title}</div>
                <div className="text-white/75 text-xs line-clamp-1">{location}</div>
              </div>

              {rating > 0 ? (
                <div className="shrink-0 rounded-full bg-black/35 backdrop-blur-sm px-3 py-1 border border-white/10 text-white text-xs font-bold inline-flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-white text-white" />
                  <span>{rating}</span>
                </div>
              ) : null}
            </div>

            <div className="absolute bottom-3 left-3 right-3 text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 opacity-0 group-hover:opacity-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest text-white/80">View Details</span>
                <ArrowRight className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="p-4 space-y-3">
            {/* Quick info chips (match PackageCard structure) */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="rounded-full">
                <Clock className="w-3.5 h-3.5 mr-1" />
                {duration}
              </Badge>

              <Badge variant="secondary" className="rounded-full">
                <Zap className="w-3.5 h-3.5 mr-1" />
                Instant confirmation
              </Badge>

              <Badge variant="secondary" className="rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                Verified operator
              </Badge>
            </div>

            {/* Thin divider before price (align baseline with PackageCard) */}
            <div className="pt-3 flex items-center justify-between border-t border-border/60">
              <div className="flex flex-col min-w-0">
                <span className="text-xs text-muted-foreground">From</span>
                <span className="font-bold text-lg text-foreground truncate">
                  {currency} {price.toLocaleString()}
                </span>
              </div>

              <div className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium h-9 px-4 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shrink-0">
                Book Now
              </div>
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  )
}
