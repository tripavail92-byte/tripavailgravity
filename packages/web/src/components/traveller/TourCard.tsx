import { ArrowRight, Clock, MapPin, Star, Users } from 'lucide-react'
import { motion } from 'motion/react'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
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
      className="group cursor-pointer"
    >
      <Link to={`/tours/${slug || id}`} className="block">
        <div className="relative aspect-[4/5] rounded-3xl overflow-hidden mb-4 shadow-sm group-hover:shadow-xl transition-all duration-500">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />

          {/* Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <div className="absolute top-4 left-4 flex flex-col gap-2">
            {isFeatured && (
              <Badge className="bg-primary text-primary-foreground border-none shadow-lg shadow-primary/20 px-3 py-1 font-bold text-[10px] uppercase tracking-wider backdrop-blur-md">
                Featured
              </Badge>
            )}
            <GlassBadge
              variant="light"
              size="sm"
              className="text-foreground border-none px-3 py-1 font-bold text-[10px] uppercase tracking-wider"
            >
              {type}
            </GlassBadge>
          </div>

          <div className="absolute bottom-4 left-4 right-4 text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 opacity-0 group-hover:opacity-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-white/80">
                View Details
              </span>
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="space-y-2 px-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              <span className="truncate">{location}</span>
            </div>
            {rating > 0 && (
              <div className="flex items-center gap-1 bg-muted px-2 py-0.5 rounded-full border border-border/60">
                <Star className="w-3 h-3 text-primary fill-current" />
                <span className="text-xs font-bold text-foreground">{rating}</span>
              </div>
            )}
          </div>

          <h3 className="font-bold text-foreground text-lg group-hover:text-primary transition-colors line-clamp-1 leading-tight">
            {title}
          </h3>

          <div className="flex items-center gap-4 text-xs font-semibold text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {duration}
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-primary" />
              Flexible Group
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between gap-3">
            <div className="flex items-baseline gap-1.5 min-w-0">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                From
              </span>
              <span className="text-xl font-black text-foreground leading-none truncate">
                {currency} {price.toLocaleString()}
              </span>
            </div>

            <div className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium h-9 px-4 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shrink-0">
              Book Now
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
