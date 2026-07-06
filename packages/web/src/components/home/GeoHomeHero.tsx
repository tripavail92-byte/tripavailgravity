import { MapPin, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'

import { HorizontalPreviewSlider } from '@/components/home/HorizontalPreviewSlider'
import { ImageWithFallback } from '@/components/ImageWithFallback'
import { TourCard } from '@/components/traveller/TourCard'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useT } from '@/hooks/useT'
import { useVisitorCountry } from '@/lib/visitorGeo'
import { usePopularInCountryTours } from '@/queries/tourQueries'

/**
 * Geo-adaptive home hero. Detects the visitor's country and reshapes the top of the page:
 *  - supply in that country  → "Discover {country}" over a real listing photo + a
 *    "Popular in {country}" rail sourced from live tours.
 *  - known country, no supply → an honest "expanding to {country}" band (brand gradient,
 *    no fabricated art) — the global rails below carry the page.
 *  - unknown country          → the standard global hero.
 *
 * QA: append `?geo=AE` to force a market (or `?geo=none` for the global default).
 */
export function GeoHomeHero() {
  const t = useT()
  const country = useVisitorCountry()
  const { data: popular = [], isLoading } = usePopularInCountryTours(country?.name, 12)

  const hasSupply = popular.length > 0
  const resolving = Boolean(country) && isLoading
  const heroImage = hasSupply ? popular[0]?.images?.[0] : undefined

  // Copy variants (localized; country name interpolated)
  let eyebrow = t('hero.curatedWorldwide')
  let headline = t('hero.defaultTitle')
  let subline = t('hero.defaultSub')

  if (country && hasSupply) {
    eyebrow = t('hero.popularInEyebrow', { country: country.name })
    headline = t('hero.discoverTitle', { country: country.name })
    subline = t('hero.discoverSub', { country: country.name })
  } else if (country && !resolving && !hasSupply) {
    eyebrow = t('hero.comingSoonEyebrow', { country: country.name })
    headline = t('hero.expandingTitle', { country: country.name })
    subline = t('hero.expandingSub', { country: country.name })
  }

  return (
    <>
      <section className="pt-1">
        <div className="relative overflow-hidden rounded-3xl border border-border/60 min-h-[280px] sm:min-h-[340px] md:min-h-[380px] flex">
          {/* Backdrop: a real listing photo when we have local supply, else a brand gradient (never fabricated art). */}
          {heroImage ? (
            <>
              <div className="absolute inset-0">
                <ImageWithFallback
                  src={heroImage}
                  alt={country?.name ?? 'Featured destination'}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-tr from-black/80 via-black/45 to-black/10" />
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-tr from-primary via-rose-500 to-indigo-600" />
          )}

          {/* Content */}
          <div className="relative z-10 w-full p-6 sm:p-9 md:p-12 flex flex-col justify-end">
            <div className="max-w-2xl text-white">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-sm px-3 py-1 text-xs sm:text-sm font-semibold ring-1 ring-white/25">
                {country ? <MapPin className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                {resolving ? t('hero.finding') : eyebrow}
              </div>

              <h1 className="mt-4 text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-balance drop-shadow-sm">
                {headline}
              </h1>
              <p className="mt-3 text-sm sm:text-base text-white/90 max-w-xl">{subline}</p>

              {/* Primary CTA — one purposeful action. Search lives in the header, so the
                  hero doesn't duplicate it. */}
              <div className="mt-5 flex flex-wrap items-center gap-3">
                {country && hasSupply ? (
                  <Button asChild className="h-12 rounded-full px-8 text-base font-bold shadow-xl shadow-black/20">
                    <Link to="/tours">{t('hero.exploreCountry', { country: country.name })}</Link>
                  </Button>
                ) : (
                  <Button asChild className="h-12 rounded-full px-8 text-base font-bold shadow-xl shadow-black/20">
                    <Link to="/hotels">{t('hero.browseWorldwide')}</Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular-in-country rail — only when the visitor's country has live supply. */}
      {country && (hasSupply || resolving) && (
        <section>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 sm:gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                {t('hero.popularInTitle', { country: country.name })}
              </h2>
              <p className="text-muted-foreground mt-1">{t('hero.trendingNearYou')}</p>
            </div>
            {hasSupply && (
              <Button asChild variant="link" className="px-0">
                <Link to="/tours">{t('common.viewAll')}</Link>
              </Button>
            )}
          </div>

          <div className="mt-6">
            {resolving ? (
              <HorizontalPreviewSlider>
                {[0, 1, 2, 3].map((i) => (
                  <Card
                    key={i}
                    className="rounded-3xl border border-border/60 overflow-hidden shrink-0 w-[260px] sm:w-[280px]"
                  >
                    <div className="aspect-[4/5]">
                      <Skeleton className="w-full h-full" />
                    </div>
                    <div className="p-4 space-y-3">
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-6 w-1/2" />
                    </div>
                  </Card>
                ))}
              </HorizontalPreviewSlider>
            ) : (
              <HorizontalPreviewSlider>
                {popular.slice(0, 10).map((tour) => (
                  <div key={tour.id} className="shrink-0 w-[260px] sm:w-[280px]">
                    <TourCard
                      id={tour.id}
                      slug={tour.slug ?? undefined}
                      image={
                        tour.images?.[0] ||
                        'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&auto=format&fit=crop'
                      }
                      title={tour.title}
                      location={tour.location}
                      duration={tour.durationDays ? `${tour.durationDays} days` : 'Multi-day'}
                      rating={tour.rating}
                      price={typeof tour.tourPrice === 'number' ? tour.tourPrice : 0}
                      currency={tour.currency || 'PKR'}
                      type={tour.badge}
                      isFeatured={tour.badge === 'Featured'}
                    />
                  </div>
                ))}
              </HorizontalPreviewSlider>
            )}
          </div>
        </section>
      )}
    </>
  )
}
