import { CalendarDays, Clock, MapPin } from 'lucide-react'
import { motion } from 'motion/react'
import { Link, useNavigate } from 'react-router-dom'

import { getTourPaymentTerms } from '@/features/booking/utils/tourPaymentTerms'
import { useIsDesktop } from '@/hooks/useIsDesktop'
import { useMoney } from '@/hooks/useMoney'
import { formatDepartureDate } from '@/queries/departureQueries'

/**
 * Tour card — image-dominant, everything overlaid.
 *
 * The previous card split into a photo on top and a tall text block below, so cards
 * in a row had different heights ("no shape"), the photo lost half the tile, and two
 * of the three chips were unbacked marketing claims. This is one fixed 3:4 tile: the
 * photo fills it, and departure date, title, location, duration/category, price and
 * the CTA all sit on top of it — price and Book Now on a single line.
 */

interface TourCardProps {
  id: string
  slug?: string
  image: string
  title: string
  location: string
  duration: string
  rating: number
  /** Optional: many list queries don't select review_count. Omitted => no count shown. */
  reviewCount?: number
  price: number
  currency: string
  type: string
  isFeatured?: boolean
  shortDescription?: string | null
  depositRequired?: boolean
  depositPercentage?: number
  /** ISO start_time of the next upcoming departure — see useNextDepartures. */
  departureDate?: string | null
}

const FALLBACK_IMG =
  'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80&w=800'

export function TourCard({
  id,
  slug,
  image,
  title,
  location,
  duration,
  rating,
  reviewCount = 0,
  price,
  currency,
  type,
  isFeatured,
  depositRequired,
  depositPercentage,
  departureDate,
}: TourCardProps) {
  const navigate = useNavigate()
  const paymentTerms = getTourPaymentTerms({
    basePrice: price,
    guestCount: 1,
    depositRequired,
    depositPercentage,
  })
  const showsDeposit = Boolean(depositRequired) && paymentTerms.remainingAmount > 0
  const money = useMoney()
  const mainMoney = money(showsDeposit ? paymentTerms.upfrontAmount : price, currency)

  // Desktop opens in a new tab so browsing several trips doesn't throw the list away;
  // mobile stays in-tab. `rel` is required whenever we target `_blank`.
  const isDesktop = useIsDesktop()
  const linkTarget = isDesktop ? '_blank' : undefined
  const linkRel = isDesktop ? 'noopener noreferrer' : undefined
  const href = `/tours/${slug || id}`
  const departsOn = formatDepartureDate(departureDate)
  const categoryLabel = (type || '').replace(/-/g, ' ').trim()

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group relative isolate aspect-[3/4] overflow-hidden rounded-2xl bg-muted shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
    >
      {/* The whole tile is the link; the CTA sits above it with its own handler. */}
      <Link
        to={href}
        target={linkTarget}
        rel={linkRel}
        className="absolute inset-0 z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
        aria-label={title}
      />

      <img
        src={image || FALLBACK_IMG}
        alt=""
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
      />
      {/* Legibility scrim — strongest at the bottom where the text and CTA live. */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/15" />

      {/* Top row: real departure date + status */}
      <div className="pointer-events-none absolute inset-x-3 top-3 z-20 flex items-start justify-between gap-2">
        {departsOn ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-foreground shadow-sm">
            <CalendarDays className="h-3 w-3" />
            {departsOn}
          </span>
        ) : (
          <span />
        )}
        {Number(rating) > 0 ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-foreground shadow-sm">
            ★ {Number(rating).toFixed(1)}
            {Number(reviewCount) > 0 ? (
              <span className="font-medium text-muted-foreground">({reviewCount})</span>
            ) : null}
          </span>
        ) : (
          <span className="rounded-full bg-primary px-2.5 py-1 text-[11px] font-bold text-primary-foreground shadow-sm">
            {isFeatured ? 'Featured' : 'New'}
          </span>
        )}
      </div>

      {/* Content — all overlaid on the photo */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 p-3">
        <h3 className="line-clamp-2 text-[15px] font-bold leading-tight text-white drop-shadow">
          {title}
        </h3>

        <p className="mt-1 flex items-center gap-1 truncate text-xs text-white/85">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{location}</span>
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {duration ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-white/25 bg-white/15 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm">
              <Clock className="h-3 w-3" />
              {duration}
            </span>
          ) : null}
          {categoryLabel ? (
            <span className="inline-flex items-center rounded-full border border-white/25 bg-white/15 px-2 py-0.5 text-[11px] font-semibold capitalize text-white backdrop-blur-sm">
              {categoryLabel}
            </span>
          ) : null}
        </div>

        {/* Price + CTA on ONE line */}
        <div className="mt-3 flex items-end justify-between gap-2">
          <div className="min-w-0 leading-tight">
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-white/70">
              {showsDeposit ? 'Pay now' : 'From'}
            </span>
            <span className="block truncate text-[17px] font-extrabold text-white">
              {mainMoney.estimate ? '≈ ' : ''}
              {mainMoney.text}
            </span>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              navigate(href)
            }}
            className="pointer-events-auto shrink-0 rounded-full bg-primary px-4 py-2 text-[13px] font-bold text-primary-foreground shadow-lg shadow-primary/30 transition-transform hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            Book Now
          </button>
        </div>
      </div>
    </motion.article>
  )
}
