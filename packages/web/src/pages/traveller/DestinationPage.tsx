import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'

import { TourCard } from '@/components/traveller/TourCard'
import { GlassCard, GlassContent, GlassHeader, GlassTitle } from '@/components/ui/glass'
import { Skeleton } from '@/components/ui/skeleton'
import { useMoney } from '@/hooks/useMoney'
import { useSeo } from '@/hooks/useSeo'
import { destKey, type DestinationTour, hubFacts, tourPrice } from '@/lib/destinations'
import { formatTourDuration } from '@/lib/tourDuration'
import { useDestinationCatalog } from '@/queries/destinationQueries'
import { type TourDepartureSummary, useTourDepartureSummary } from '@/queries/departureQueries'

/**
 * /destinations/:slug — every live trip that visits a place, with the facts travellers compare:
 * price range, trip lengths, next departures, and a short FAQ answered from those same listings.
 * The server renders the same page for crawlers (server.mjs destinationPage).
 */

const locationLabel = (t: DestinationTour) => {
  const cities = t.destination_cities?.filter(Boolean) ?? []
  if (cities.length > 1) return cities.slice(0, 4).join(' · ')
  const loc = t.location
  return typeof loc === 'string' ? loc : [loc?.city, loc?.country].filter(Boolean).join(', ')
}

export default function DestinationPage() {
  const { slug = '' } = useParams()
  const money = useMoney()
  const { hubs, isLoading } = useDestinationCatalog()
  const hub = useMemo(() => hubs.find((h) => h.slug === destKey(slug)) ?? null, [hubs, slug])
  const { data: departures } = useTourDepartureSummary(useMemo(() => hub?.tours.map((t) => t.id) ?? [], [hub]))

  const facts = hub ? hubFacts(hub) : null
  const fmt = (amount: number, currency: string) => {
    const m = money(amount, currency)
    return `${m.estimate ? '≈ ' : ''}${m.text}`
  }

  // Upcoming first (soonest departure first), then any-date trips, then past trips.
  const ordered = useMemo(() => {
    if (!hub) return []
    const rank = (t: DestinationTour) => {
      const d: TourDepartureSummary | undefined = departures?.[t.id]
      if (d?.nextStart) return [0, Date.parse(d.nextStart)]
      if (t.availability === 'on_request') return [1, 0]
      return [2, 0]
    }
    return [...hub.tours].sort((a, b) => {
      const [ra, da] = rank(a)
      const [rb, db] = rank(b)
      return ra - rb || da - db
    })
  }, [hub, departures])

  const next = ordered.map((t) => departures?.[t.id]?.nextStart).find(Boolean) ?? null
  const main = facts?.currencies[0]

  useSeo({
    title: hub ? `${hub.name} tours — ${hub.tours.length} trips with prices and dates` : 'Destination',
    description: hub
      ? `Compare ${hub.tours.length} ${hub.name} tours from ${facts?.operators} local operators.` +
        (main ? ` Prices from ${fmt(main.min, main.currency)} per person.` : '')
      : 'Tour destinations on TripAvail.',
    canonicalPath: hub ? `/destinations/${hub.slug}` : undefined,
    noindex: !isLoading && !hub,
  })

  if (isLoading) {
    return (
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8">
        <Skeleton className="h-10 w-2/3 rounded-xl" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />
          ))}
        </div>
      </main>
    )
  }

  if (!hub || !facts) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-foreground">No trips listed for this place yet</h1>
        <p className="mt-2 text-muted-foreground">
          <Link to="/destinations" className="font-semibold text-primary hover:underline">
            See all destinations
          </Link>{' '}
          or{' '}
          <Link to="/tours" className="font-semibold text-primary hover:underline">
            browse every trip
          </Link>
          .
        </p>
      </main>
    )
  }

  const anyDateCount = hub.tours.filter((t) => t.availability === 'on_request' && !departures?.[t.id]?.nextStart).length
  const faq: [string, string][] = []
  if (main) {
    faq.push([
      `How much does a ${hub.name} tour cost?`,
      `${hub.name} trips on TripAvail cost from ${fmt(main.min, main.currency)} to ${fmt(main.max, main.currency)} per person; ` +
        `the median is ${fmt(main.median, main.currency)}.` +
        (facts.onRequest ? ` ${facts.onRequest} more quote the price on request.` : '') +
        ' Prices are set by each tour operator.',
    ])
  }
  if (facts.days) {
    faq.push([
      `How many days do you need for a ${hub.name} trip?`,
      facts.days.min === facts.days.max
        ? `The listed trips run ${facts.days.min} days.`
        : `Listed trips run ${facts.days.min}–${facts.days.max} days; the most common length is ${facts.days.common} days.`,
    ])
  }
  faq.push([
    `When do ${hub.name} trips depart?`,
    (next
      ? `The next listed departure is ${new Date(next).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Karachi' })}.`
      : 'No listed trip has a fixed departure coming up right now.') +
      (anyDateCount ? ` ${anyDateCount} private trips run on the dates you choose.` : ''),
  ])
  faq.push([
    `How do I book a ${hub.name} trip?`,
    facts.enquiry === hub.tours.length
      ? 'Each trip here is booked directly with its tour operator on WhatsApp; confirm the price and dates with them before you pay.'
      : 'Trips from operators on TripAvail are booked on the site; trips from operators not on TripAvail yet are booked with the operator on WhatsApp. Each trip page says which.',
  ])

  return (
    <main className="mx-auto max-w-7xl space-y-10 px-4 py-8">
      <header className="space-y-3">
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
          <Link to="/" className="hover:underline">
            Home
          </Link>{' '}
          ›{' '}
          <Link to="/destinations" className="hover:underline">
            Destinations
          </Link>{' '}
          › {hub.name}
        </nav>
        <h1 className="text-3xl font-black tracking-tight text-foreground text-balance md:text-4xl">
          {hub.name} tours
        </h1>
        <dl className="flex flex-wrap gap-2 text-sm">
          {[
            ['Trips', String(hub.tours.length)],
            ['Operators', String(facts.operators)],
            ...(main ? [['From', `${fmt(main.min, main.currency)} / person`]] : []),
            ...(facts.days ? [['Length', facts.days.min === facts.days.max ? `${facts.days.min} days` : `${facts.days.min}–${facts.days.max} days`]] : []),
          ].map(([k, v]) => (
            <div key={k} className="rounded-full border border-border/60 bg-background px-3 py-1">
              <dt className="inline text-muted-foreground">{k}: </dt>
              <dd className="inline font-semibold tabular-nums text-foreground">{v}</dd>
            </div>
          ))}
        </dl>
      </header>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {ordered.map((t) => (
          <TourCard
            key={t.id}
            id={t.id}
            slug={t.slug ?? undefined}
            image={t.images?.[0] || ''}
            title={t.title}
            location={locationLabel(t)}
            duration={formatTourDuration(t.duration_days)}
            rating={Number(t.rating) || 0}
            reviewCount={Number(t.review_count) || 0}
            price={tourPrice(t)}
            currency={t.currency || 'PKR'}
            type={t.tour_type || 'Tour'}
            shortDescription={t.short_description}
            departureSummary={departures?.[t.id] ?? null}
          />
        ))}
      </div>

      <GlassCard variant="card" className="rounded-3xl border-none shadow-xl">
        <GlassHeader>
          <GlassTitle className="text-2xl font-bold">{hub.name} trips: common questions</GlassTitle>
        </GlassHeader>
        <GlassContent className="space-y-5">
          {faq.map(([q, a]) => (
            <div key={q} className="space-y-1">
              <h2 className="text-base font-bold text-foreground">{q}</h2>
              <p className="text-sm leading-6 text-muted-foreground">{a}</p>
            </div>
          ))}
        </GlassContent>
      </GlassCard>

      <OtherDestinations current={hub.slug} />
    </main>
  )
}

function OtherDestinations({ current }: { current: string }) {
  const { hubs } = useDestinationCatalog()
  const others = hubs.filter((h) => h.slug !== current).slice(0, 16)
  if (!others.length) return null
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-bold text-foreground">Other destinations</h2>
      <div className="flex flex-wrap gap-2">
        {others.map((h) => (
          <Link
            key={h.slug}
            to={`/destinations/${h.slug}`}
            className="rounded-full border border-border/60 bg-background px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary"
          >
            {h.name} <span className="tabular-nums text-muted-foreground">({h.tours.length})</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
