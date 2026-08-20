import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

import { tourImage } from '@/lib/imageUrl'
import { useHomepageMixTours } from '@/queries/tourQueries'

/**
 * "Where to next?" — the destination entry point, and the homepage hero.
 *
 * This replaced a rotating single-tour carousel in the hero slot. A carousel sells
 * ONE trip to everyone; a destination grid asks the question a traveller actually
 * arrives with, and every tile is a real place with a real trip count behind it.
 *
 * Built entirely from tours already fetched for the feed: every live trip carries
 * destination_cities (or location.city), so grouping client-side gives real cities
 * with real counts and needs no new query or curated list of places.
 */
const FALLBACK_IMG =
  'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80&w=800'

export function DestinationTiles({
  limit = 8,
  variant = 'section',
}: {
  limit?: number
  /** 'hero' is the top-of-page treatment: bigger type, taller tiles. */
  variant?: 'section' | 'hero'
}) {
  // 96 rows is the whole live catalogue at present — enough to count accurately.
  const { data: tours = [], isLoading } = useHomepageMixTours(96)
  const isHero = variant === 'hero'

  const destinations = (() => {
    const byCity = new Map<string, { city: string; count: number; image: string }>()
    for (const t of tours) {
      const city = (t.destinationCities?.[0] || '').trim()
      if (!city) continue
      const key = city.toLowerCase()
      const existing = byCity.get(key)
      if (existing) existing.count += 1
      else byCity.set(key, { city, count: 1, image: t.images?.[0] || FALLBACK_IMG })
    }
    return [...byCity.values()].sort((a, b) => b.count - a.count).slice(0, limit)
  })()

  // A destination grid with two entries looks broken — show it only with substance.
  if (isLoading || destinations.length < 3) return null

  return (
    <section className={isHero ? '' : 'mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8'}>
      <div className={isHero ? 'mb-6' : 'mb-5'}>
        <h2
          className={
            isHero
              ? 'text-3xl font-black tracking-tight text-foreground sm:text-4xl lg:text-5xl'
              : 'text-2xl font-bold tracking-tight text-foreground sm:text-3xl'
          }
        >
          Where to next?
        </h2>
        <p
          className={
            isHero ? 'mt-2 text-base text-muted-foreground' : 'mt-1 text-sm text-muted-foreground'
          }
        >
          Pick a place — we’ll show you the trips running there.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {destinations.map((d, i) => (
          <Link
            key={d.city}
            to={`/search?types=tour&q=${encodeURIComponent(d.city)}`}
            className={`group relative aspect-square overflow-hidden rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
              // The first tile spans a 2x2 block for a focal point; aspect-square on every
              // tile keeps the grid rows equal so the hero lines up exactly with the 2x2 of
              // small tiles beside it.
              isHero && i === 0 ? 'col-span-2 row-span-2' : ''
            }`}
          >
            {/* The image fills the WHOLE tile. It used to sit in a fixed 4:3 box while the grid
                cell stretched taller, leaving a grey band under every small tile. */}
            <img
              src={tourImage(d.image, isHero && i === 0 ? 1100 : 600)}
              alt=""
              loading={i === 0 ? 'eager' : 'lazy'}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-3">
              <p
                className={`font-bold text-white drop-shadow-sm ${
                  isHero && i === 0 ? 'text-xl sm:text-2xl' : 'text-sm sm:text-base'
                }`}
              >
                {d.city}
              </p>
              <p className="flex items-center gap-1 text-xs text-white/85">
                {d.count} {d.count === 1 ? 'trip' : 'trips'}
                <ArrowRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
