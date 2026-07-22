import { ArrowRight, MapPin, Sparkles, Star } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { ImageWithFallback } from '@/components/ImageWithFallback'
import { Button } from '@/components/ui/button'
import { useMoney } from '@/hooks/useMoney'
import { cn } from '@/lib/utils'

export interface HeroSlide {
  id: string
  kind: 'tour' | 'package'
  title: string
  /** Location for a tour; "hotel · location" for a package. */
  subtitle: string
  image: string
  price: number | 'Contact'
  currency: string
  rating: number
  href: string
  badge: string
}

interface FeaturedHeroCarouselProps {
  slides: HeroSlide[]
  /** Small geo/brand line at the top, e.g. "Popular in Pakistan". */
  eyebrow: string
  hasCountry: boolean
  className?: string
}

const AUTOPLAY_MS = 5000

/**
 * The home hero as an auto-rotating showcase of real featured trips and stays — the first thing a
 * visitor sees is live inventory, not a stock photo. Auto-advances, but pauses on hover/focus and
 * doesn't move at all for visitors who prefer reduced motion. Swipeable on touch, arrows + dots on
 * pointer devices, and every slide deep-links to that listing so the hero converts.
 */
export function FeaturedHeroCarousel({
  slides,
  eyebrow,
  hasCountry,
  className,
}: FeaturedHeroCarouselProps) {
  const money = useMoney()
  const reduceMotion = useReducedMotion()
  const [index, setIndex] = useState(0)
  const touchStartX = useRef<number | null>(null)

  const count = slides.length
  const go = useCallback((next: number) => setIndex((prev) => (next + count) % count), [count])

  // Keep the index in range if the slide set shrinks between renders.
  useEffect(() => {
    if (index >= count) setIndex(0)
  }, [count, index])

  // Autoplay via ONE interval that never tears down on re-render. The previous version keyed the
  // interval on `count`/`paused`, so a parent re-render, a momentary change in the slide count, or
  // a control keeping focus after a click cleared and restarted the timer before it ever reached
  // 5s — so the hero never advanced. This reads the live count from a ref at tick time instead, and
  // runs continuously (manual arrows/dots let the visitor stop and look). Honours reduced-motion.
  const countRef = useRef(count)
  countRef.current = count
  useEffect(() => {
    if (reduceMotion) return
    const id = window.setInterval(() => {
      setIndex((prev) => (countRef.current <= 1 ? prev : (prev + 1) % countRef.current))
    }, AUTOPLAY_MS)
    return () => window.clearInterval(id)
  }, [reduceMotion])

  if (count === 0) return null
  const slide = slides[Math.min(index, count - 1)]

  // money() returns a DisplayMoney object ({ text, estimate, currency }), not a string —
  // interpolating it directly rendered the literal "From [object Object]" on the homepage hero.
  // The '≈' prefix marks a figure converted via the FX table rather than the listing's own
  // currency, matching TourCard and PackageCard.
  const priceMoney = typeof slide.price === 'number' ? money(slide.price, slide.currency) : null

  const priceLabel = priceMoney
    ? `From ${priceMoney.estimate ? '≈ ' : ''}${priceMoney.text}`
    : 'Contact for price'

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const delta = (e.changedTouches[0]?.clientX ?? touchStartX.current) - touchStartX.current
    if (Math.abs(delta) > 40) go(index + (delta < 0 ? 1 : -1))
    touchStartX.current = null
  }

  return (
    <section className={cn('pt-1', className)}>
      <div
        className="relative overflow-hidden rounded-3xl border border-border/60 min-h-[240px] sm:min-h-[320px] md:min-h-[400px] flex"
        role="region"
        aria-roledescription="carousel"
        aria-label="Featured trips and stays"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Backdrop: the current listing's photo, crossfading. Only the active image is mounted. */}
        <AnimatePresence initial={false} mode="popLayout">
          <motion.div
            key={slide.id}
            className="absolute inset-0"
            initial={reduceMotion ? false : { opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 1.02 }}
            transition={{ duration: reduceMotion ? 0 : 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <ImageWithFallback
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover"
            />
          </motion.div>
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-tr from-black/85 via-black/50 to-black/15" />

        {/* Content overlay */}
        <div className="relative z-10 w-full p-6 sm:p-9 md:p-11 flex flex-col justify-between">
          {/* Top: geo/brand eyebrow */}
          <div className="inline-flex self-start items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-sm px-3 py-1 text-xs sm:text-sm font-semibold text-white ring-1 ring-white/25">
            {hasCountry ? <MapPin className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
            {eyebrow}
          </div>

          {/* Bottom: the current listing */}
          <div className="max-w-2xl text-white">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide">
              {slide.kind === 'package' ? 'Stay' : 'Trip'}
              {slide.badge && slide.badge !== 'Standard' ? (
                <span className="opacity-80">· {slide.badge}</span>
              ) : null}
            </span>

            {/* The whole title is the link target — a large, obvious tap area. */}
            <h1 className="mt-3">
              <Link
                to={slide.href}
                className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-balance drop-shadow-sm hover:underline decoration-2 underline-offset-4"
              >
                {slide.title}
              </Link>
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm sm:text-base text-white/90">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-4 h-4" /> {slide.subtitle}
              </span>
              {slide.rating > 0 ? (
                <span className="inline-flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />{' '}
                  {slide.rating.toFixed(1)}
                </span>
              ) : null}
              <span className="font-semibold">{priceLabel}</span>
            </div>

            <div className="mt-5">
              <Button
                asChild
                className="h-12 rounded-full px-8 text-base font-bold shadow-xl shadow-black/20"
              >
                <Link to={slide.href}>
                  {slide.kind === 'package' ? 'View stay' : 'View trip'}
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Prev / next — hidden on the smallest screens where swipe is natural */}
        {count > 1 ? (
          <>
            <button
              type="button"
              onClick={() => go(index - 1)}
              aria-label="Previous"
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 hidden sm:flex h-10 w-10 items-center justify-center rounded-full bg-white/85 text-black hover:bg-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
            </button>
            <button
              type="button"
              onClick={() => go(index + 1)}
              aria-label="Next"
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 hidden sm:flex h-10 w-10 items-center justify-center rounded-full bg-white/85 text-black hover:bg-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Dots */}
            <div className="absolute bottom-5 right-6 z-20 flex items-center gap-1.5">
              {slides.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`Go to slide ${i + 1} of ${count}`}
                  aria-current={i === index ? 'true' : undefined}
                  className={cn(
                    'h-2 rounded-full transition-all',
                    i === index ? 'w-5 bg-white' : 'w-2 bg-white/50 hover:bg-white/80',
                  )}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>
    </section>
  )
}
