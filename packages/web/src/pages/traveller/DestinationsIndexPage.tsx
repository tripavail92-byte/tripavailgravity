import { Link } from 'react-router-dom'

import { Skeleton } from '@/components/ui/skeleton'
import { useMoney } from '@/hooks/useMoney'
import { useSeo } from '@/hooks/useSeo'
import { HUB_MIN, hubFacts } from '@/lib/destinations'
import { tourImage } from '@/lib/imageUrl'
import { useDestinationCatalog } from '@/queries/destinationQueries'

/** /destinations — every place with at least HUB_MIN live trips. */
export default function DestinationsIndexPage() {
  const money = useMoney()
  const { hubs, isLoading } = useDestinationCatalog()

  useSeo({
    title: 'Tour destinations — trips, prices and dates',
    description: `Trips to ${hubs
      .slice(0, 6)
      .map((h) => h.name)
      .join(', ')} and more — compare prices per person, trip length and departure dates.`,
    canonicalPath: '/destinations',
  })

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-black tracking-tight text-foreground md:text-4xl">Where do you want to go?</h1>
        <p className="max-w-2xl text-muted-foreground">
          Every destination with at least {HUB_MIN} trips on TripAvail, with the starting price per person.
        </p>
      </header>
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[4/3] rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {hubs.map((h, i) => {
            const m = hubFacts(h).currencies[0]
            const from = m ? money(m.min, m.currency) : null
            const img = h.tours.find((t) => t.images?.[0])?.images?.[0]
            return (
              <Link
                key={h.slug}
                to={`/destinations/${h.slug}`}
                className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              >
                {img ? (
                  <img
                    src={tourImage(img, 500)}
                    alt=""
                    loading={i < 8 ? 'eager' : 'lazy'}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-3">
                  <p className="text-base font-bold text-white drop-shadow">{h.name}</p>
                  <p className="text-xs text-white/85 tabular-nums">
                    {h.tours.length} trips{from ? ` · from ${from.estimate ? '≈ ' : ''}${from.text}` : ''}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </main>
  )
}
