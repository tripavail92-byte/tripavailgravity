import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

import { tourImage } from '@/lib/imageUrl'
import { useHomepageMixTours } from '@/queries/tourQueries'

/**
 * "Where to next?" — the destination entry point, rendered as an inline rail:
 * a heading with a "See all" link and a horizontal row of equal-size destination
 * tiles. A carousel sells ONE trip to everyone; this asks the question a traveller
 * actually arrives with, and every tile is a real place with a real trip count.
 *
 * Built entirely from tours already fetched for the feed — every live trip carries
 * destination_cities (or location.city), so grouping client-side gives real cities
 * with real counts and needs no new query or curated list of places.
 */
const FALLBACK_IMG =
  'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80&w=800'

export function DestinationTiles({
  limit = 10,
  seeAllHref = '/tours',
}: {
  limit?: number
  /** Where the "See all" link goes — the full trip catalogue by default. */
  seeAllHref?: string
}) {
  // 96 rows is the whole live catalogue at present — enough to count accurately.
  const { data: tours = [], isLoading } = useHomepageMixTours(96)

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

  // A destination row with two entries looks broken — show it only with substance.
  if (isLoading || destinations.length < 3) return null

  return (
    <section className="mt-12 first:mt-0">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground md:text-2xl">
            Where to next?
          </h2>
          <p className="text-sm text-muted-foreground">
            Pick a place — we’ll show you the trips running there.
          </p>
        </div>
        <Link
          to={seeAllHref}
          className="shrink-0 whitespace-nowrap text-sm font-semibold text-primary underline-offset-4 hover:underline"
        >
          See all
        </Link>
      </div>

      {/* Inline horizontal rail — equal square tiles, snap-scroll on touch. */}
      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:px-0">
        {destinations.map((d, i) => (
          <Link
            key={d.city}
            to={`/search?types=tour&q=${encodeURIComponent(d.city)}`}
            className="group relative aspect-square w-40 shrink-0 snap-start overflow-hidden rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 sm:w-44"
          >
            <img
              src={tourImage(d.image, 400)}
              alt=""
              loading={i < 5 ? 'eager' : 'lazy'}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-3">
              <p className="text-sm font-bold text-white drop-shadow-sm sm:text-base">{d.city}</p>
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
