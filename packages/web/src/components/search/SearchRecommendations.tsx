import { HotelPropertyCard } from '@/components/traveller/HotelPropertyCard'
import { PackageCard } from '@/components/traveller/PackageCard'
import { TourCard } from '@/components/traveller/TourCard'
import { useHotelBrowse } from '@/queries/hotelQueries'
import { useSpecialOffers } from '@/queries/packageQueries'
import { useFeaturedTours } from '@/queries/tourQueries'

/**
 * "Recommended for you" — the discovery row shown BELOW the search results, the
 * standard travel-site pattern. It surfaces real curated content relevant to
 * the active tab (top-rated stays / featured tours / discounted packages),
 * excluding anything already in the results so it never repeats a card. Renders
 * nothing until it actually has picks, so there's never an empty section.
 */

const GRID = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
const FALLBACK_IMG =
  'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&auto=format&fit=crop'
const MAX = 8

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <section className="mt-14 border-t border-border/60 pt-10">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-foreground">Recommended for you</h2>
        <p className="text-sm text-muted-foreground">Popular picks you might like</p>
      </div>
      {children}
    </section>
  )
}

export function SearchRecommendations({
  activeType,
  excludeIds,
}: {
  activeType: 'all' | 'hotel' | 'tour' | 'package'
  excludeIds: Set<string>
}) {
  const wantHotels = activeType === 'all' || activeType === 'hotel'
  const wantTours = activeType === 'tour'
  const wantPackages = activeType === 'package'

  // Each hook is gated to the active tab; the others stay idle (no fetch).
  const hotelsQ = useHotelBrowse({ enabled: wantHotels })
  const toursQ = useFeaturedTours({ enabled: wantTours })
  const packagesQ = useSpecialOffers({ enabled: wantPackages })

  if (wantTours) {
    const items = (toursQ.data ?? []).filter((t) => !excludeIds.has(String(t.id))).slice(0, MAX)
    if (!items.length) return null
    return (
      <Shell>
        <div className={GRID}>
          {items.map((t) => (
            <TourCard
              key={t.id}
              id={t.id}
              slug={t.slug ?? undefined}
              image={(Array.isArray(t.images) ? t.images[0] : undefined) || FALLBACK_IMG}
              title={t.title}
              location={t.location}
              duration={t.durationDays ? `${t.durationDays} days` : 'Multi-day'}
              rating={t.rating}
              price={typeof t.tourPrice === 'number' ? t.tourPrice : 0}
              currency={t.currency}
              type={t.badge || 'Tour'}
              shortDescription={t.shortDescription ?? undefined}
            />
          ))}
        </div>
      </Shell>
    )
  }

  if (wantPackages) {
    const items = (packagesQ.data ?? []).filter((p) => !excludeIds.has(p.id)).slice(0, MAX)
    if (!items.length) return null
    return (
      <Shell>
        <div className={GRID}>
          {items.map((p) => (
            <PackageCard
              key={p.id}
              id={p.id}
              slug={p.slug ?? undefined}
              images={p.images}
              title={p.title}
              subtitle={p.hotelName}
              location={p.location}
              durationDays={p.durationDays}
              rating={p.rating}
              reviewCount={p.reviewCount}
              priceFrom={typeof p.packagePrice === 'number' ? p.packagePrice : null}
              currency={p.currency}
              totalOriginal={p.totalOriginal}
              totalDiscounted={p.totalDiscounted}
              badge={p.badge}
            />
          ))}
        </div>
      </Shell>
    )
  }

  // Hotels (also the 'all' fallback) — top-rated stays.
  const items = (hotelsQ.data ?? [])
    .filter((h) => !excludeIds.has(h.id))
    .slice()
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, MAX)
  if (!items.length) return null
  return (
    <Shell>
      <div className={GRID}>
        {items.map((h) => (
          <HotelPropertyCard key={h.id} hotel={h} />
        ))}
      </div>
    </Shell>
  )
}
