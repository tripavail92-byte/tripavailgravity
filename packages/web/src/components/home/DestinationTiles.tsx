import { Link } from 'react-router-dom'

import { useHomepageMixTours } from '@/queries/tourQueries'

/**
 * "Where do you want to go?" — the destination entry point the homepage was missing.
 *
 * Built entirely from tours already fetched for the feed: every live trip carries
 * destination_cities (or location.city), so grouping client-side gives real cities
 * with real counts and needs no new query or curated list of places.
 */
const FALLBACK_IMG =
  'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80&w=800'

export function DestinationTiles({ limit = 8 }: { limit?: number }) {
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

  // A destination grid with two entries looks broken — show it only when it has substance.
  if (isLoading || destinations.length < 4) return null

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-5">
        <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Where do you want to go?
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse trips by the places they explore.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {destinations.map((d) => (
          <Link
            key={d.city}
            to={`/search?types=tour&q=${encodeURIComponent(d.city)}`}
            className="group relative overflow-hidden rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            <div className="aspect-[4/3] w-full overflow-hidden">
              <img
                src={d.image}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-3">
              <p className="text-sm font-bold text-white drop-shadow-sm sm:text-base">{d.city}</p>
              <p className="text-xs text-white/85">
                {d.count} {d.count === 1 ? 'trip' : 'trips'}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
