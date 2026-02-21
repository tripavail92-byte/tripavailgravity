import { useQueryClient } from '@tanstack/react-query'
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Flame,
  Heart,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  TrendingUp,
  Zap,
} from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { HorizontalPreviewSlider } from '@/components/home/HorizontalPreviewSlider'
import { ImageSlider } from '@/components/ImageSlider'
import { ImageWithFallback } from '@/components/ImageWithFallback'
import { BottomTabsNav } from '@/components/navigation/BottomTabsNav'
import { RoleBasedDrawer } from '@/components/navigation/RoleBasedDrawer'
import { QueryErrorBoundaryWrapper } from '@/components/QueryErrorBoundary'
import { SearchOverlay } from '@/components/search/SearchOverlay'
import type { SearchFilters } from '@/components/search/TripAvailSearchBar'
import { PackageCard } from '@/components/traveller/PackageCard'
import { TourCard } from '@/components/traveller/TourCard'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { GlassCard } from '@/components/ui/glass'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/hooks/useAuth'
import {
  type CuratedPackageKind,
  prefetchPackage,
  useCuratedPackages,
  useFeaturedPackages,
  useHomepageMixPackages,
} from '@/queries/packageQueries'
import {
  prefetchTour,
  type TourCategoryKind,
  useFeaturedTours,
  useHomepageMixTours,
  usePakistanNorthernTours,
  useToursByCategory,
} from '@/queries/tourQueries'

export default function LandingPage() {
  const navigate = useNavigate()
  const { user, activeRole } = useAuth()
  const isAuthenticated = Boolean(user && activeRole)

  const handlePackageSelect = (packageId: string) => {
    navigate(`/packages/${packageId}`)
  }

  const handleTourSelect = (tourId: string) => {
    navigate(`/tours/${tourId}`)
  }

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Airbnb Header (Fixed) */}
      <AirbnbHeader />

      <div className="container mx-auto max-w-7xl px-4 pt-24 pb-6">
        <div className="space-y-10 pb-20">
          {/* Conversion Hero */}
          <section className="pt-2">
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
                Premium travel packages, curated for real moments.
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                Book boutique stays, romantic escapes, and family getaways with transparent pricing
                and instant confirmation.
              </p>
              <div className="mt-6">
                <Button
                  onClick={() => navigate('/explore')}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8"
                >
                  Explore Packages
                </Button>
              </div>
            </div>
          </section>

          {/* Trust Strip */}
          <section className="-mt-2">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="border border-border/60 rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-foreground" />
                  </div>
                  <div className="text-sm font-semibold">Verified partners</div>
                </div>
              </Card>
              <Card className="border border-border/60 rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
                    <Zap className="w-5 h-5 text-foreground" />
                  </div>
                  <div className="text-sm font-semibold">Instant confirmation</div>
                </div>
              </Card>
              <Card className="border border-border/60 rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-foreground" />
                  </div>
                  <div className="text-sm font-semibold">Secure checkout</div>
                </div>
              </Card>
              <Card className="border border-border/60 rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
                    <Star className="w-5 h-5 text-foreground" />
                  </div>
                  <div className="text-sm font-semibold">Top-rated stays</div>
                </div>
              </Card>
            </div>
          </section>

          {/* Curated Rows (real Supabase data) */}
          <div className="space-y-12">
            <MixedHomepageRow kind="new" title="New Arrivals" />
            <MixedHomepageRow kind="top-rated" title="Top Rated" />
            <CuratedPackagesRow kind="best_for_couples" title="Best for Couples" />
            <CuratedPackagesRow kind="family_friendly" title="Family Friendly" />
            <CuratedPackagesRow kind="weekend_getaways" title="Weekend Getaways" />

            <CuratedToursRow
              category="adventure-trips"
              title="Adventure Trips"
              subtitle="Curated from live listings"
            />
            <CuratedToursRow
              category="hiking-trips"
              title="Hiking Trips"
              subtitle="Curated from live listings"
            />
          </div>

          <QueryErrorBoundaryWrapper>
            <PakistanNorthernToursRow />
          </QueryErrorBoundaryWrapper>
        </div>
      </div>

      <BottomTabsNav />
    </div>
  )
}

type MixedRowItem =
  | { type: 'hotel'; id: string; created_at: string; rating: number | null; pkg: any }
  | { type: 'tour'; id: string; created_at: string; rating: number | null; tour: any }

function MixedHomepageRow({ kind, title }: { kind: 'new' | 'top-rated'; title: string }) {
  const {
    data: hotelPackages = [],
    isLoading: hotelsLoading,
    isError: hotelsError,
  } = useHomepageMixPackages(48)
  const { data: tours = [], isLoading: toursLoading, isError: toursError } = useHomepageMixTours(48)

  const isLoading = hotelsLoading || toursLoading
  const isError = hotelsError || toursError

  const merged = useMemo(() => {
    const hotelItems: MixedRowItem[] = hotelPackages.map((pkg: any) => ({
      type: 'hotel' as const,
      id: pkg.id,
      created_at: pkg.created_at,
      rating: typeof pkg.rating === 'number' ? pkg.rating : null,
      pkg,
    }))

    const tourItems: MixedRowItem[] = tours.map((tour: any) => ({
      type: 'tour' as const,
      id: tour.id,
      created_at: tour.created_at,
      rating: typeof tour.rating === 'number' ? tour.rating : null,
      tour,
    }))

    const compareRatingDesc = (a: MixedRowItem, b: MixedRowItem) => {
      const ar = a.rating
      const br = b.rating
      if (ar == null && br == null) return 0
      if (ar == null) return 1
      if (br == null) return -1
      return br - ar
    }

    if (kind === 'new') {
      const combined: MixedRowItem[] = [...hotelItems, ...tourItems]
      return combined
        .slice()
        .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
        .slice(0, 8)
    }

    // Top Rated: keep it mixed by taking up to 4 of each type (when available),
    // then fill remaining slots by rating.
    const total = 8
    const perTypeTarget = 4
    const sortedHotels = hotelItems.slice().sort(compareRatingDesc)
    const sortedTours = tourItems.slice().sort(compareRatingDesc)

    const pickedHotels = sortedHotels.slice(0, perTypeTarget)
    const pickedTours = sortedTours.slice(0, perTypeTarget)

    const interleaved: MixedRowItem[] = []
    const maxLen = Math.max(pickedHotels.length, pickedTours.length)
    for (let i = 0; i < maxLen; i++) {
      if (pickedHotels[i]) interleaved.push(pickedHotels[i])
      if (interleaved.length >= total) break
      if (pickedTours[i]) interleaved.push(pickedTours[i])
      if (interleaved.length >= total) break
    }

    if (interleaved.length < total) {
      const remaining = [
        ...sortedHotels.slice(pickedHotels.length),
        ...sortedTours.slice(pickedTours.length),
      ]
        .slice()
        .sort(compareRatingDesc)

      interleaved.push(...remaining.slice(0, total - interleaved.length))
    }

    return interleaved.slice(0, total)
  }, [hotelPackages, tours, kind])

  const viewAllHref = kind === 'new' ? '/explore?filter=new' : '/explore?filter=top-rated'

  return (
    <section>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">{title}</h2>
          <p className="text-muted-foreground mt-1">Curated from live listings</p>
        </div>

        <Button asChild variant="link" className="px-0">
          <Link to={viewAllHref}>View All</Link>
        </Button>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <HorizontalPreviewSlider>
            {[0, 1, 2, 3].map((i) => (
              <Card
                key={i}
                className="rounded-2xl border border-border/60 overflow-hidden flex-shrink-0 w-[280px] sm:w-[320px]"
              >
                <div className="aspect-[4/5]">
                  <Skeleton className="w-full h-full" />
                </div>
                <div className="p-4 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <div className="flex items-center justify-between pt-2">
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-9 w-24 rounded-md" />
                  </div>
                </div>
              </Card>
            ))}
          </HorizontalPreviewSlider>
        ) : isError ? (
          <Card className="rounded-2xl border border-border/60 p-6 text-sm text-muted-foreground">
            Unable to load experiences right now.
          </Card>
        ) : merged.length > 0 ? (
          <HorizontalPreviewSlider>
            {merged.map((item) => (
              <div key={`${item.type}-${item.id}`} className="flex-shrink-0 w-[280px] sm:w-[320px]">
                {item.type === 'hotel' ? (
                  <PackageCard
                    id={item.pkg.id}
                    slug={item.pkg.slug ?? undefined}
                    images={item.pkg.images}
                    title={item.pkg.title}
                    subtitle={item.pkg.hotelName}
                    location={item.pkg.location}
                    durationDays={item.pkg.durationDays ?? 3}
                    rating={item.pkg.rating}
                    reviewCount={item.pkg.reviewCount}
                    priceFrom={
                      typeof item.pkg.packagePrice === 'number' ? item.pkg.packagePrice : null
                    }
                    totalOriginal={item.pkg.totalOriginal}
                    totalDiscounted={item.pkg.totalDiscounted}
                    badge={'Hotel Stay'}
                  />
                ) : (
                  <TourCard
                    id={item.tour.id}
                    slug={item.tour.slug ?? undefined}
                    image={
                      item.tour.images?.[0] ||
                      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&auto=format&fit=crop'
                    }
                    title={item.tour.title}
                    location={item.tour.location}
                    duration={'Multi-day'}
                    rating={item.tour.rating}
                    price={typeof item.tour.tourPrice === 'number' ? item.tour.tourPrice : 0}
                    currency="USD"
                    type={'Tour Experience'}
                    isFeatured={Boolean(item.tour.isFeatured)}
                  />
                )}
              </div>
            ))}
          </HorizontalPreviewSlider>
        ) : (
          <Card className="rounded-2xl border border-border/60 p-6">
            <div className="text-sm text-muted-foreground">No experiences available yet.</div>
          </Card>
        )}
      </div>
    </section>
  )
}

function CuratedPackagesRow({ kind, title }: { kind: CuratedPackageKind; title: string }) {
  const { data = [], isLoading, isError } = useCuratedPackages(kind)
  const viewAllHref = useMemo(() => `/explore/hotel-packages/${kind}`, [kind])

  return (
    <section>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">{title}</h2>
          <p className="text-muted-foreground mt-1">Curated from live listings</p>
        </div>

        <Button asChild variant="link" className="px-0">
          <Link to={viewAllHref}>View All</Link>
        </Button>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <HorizontalPreviewSlider>
            {[0, 1, 2, 3].map((i) => (
              <Card
                key={i}
                className="rounded-2xl border border-border/60 overflow-hidden shrink-0 w-[280px] sm:w-[320px]"
              >
                <div className="aspect-[4/5]">
                  <Skeleton className="w-full h-full" />
                </div>
                <div className="p-4 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <div className="flex gap-2">
                    <Skeleton className="h-7 w-24 rounded-full" />
                    <Skeleton className="h-7 w-28 rounded-full" />
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-9 w-24 rounded-md" />
                  </div>
                </div>
              </Card>
            ))}
          </HorizontalPreviewSlider>
        ) : isError ? (
          <Card className="rounded-2xl border border-border/60 p-6 text-sm text-muted-foreground">
            Unable to load packages right now.
          </Card>
        ) : data.length > 0 ? (
          <HorizontalPreviewSlider>
            {data.map((pkg) => (
              <div key={pkg.id} className="shrink-0 w-[280px] sm:w-[320px]">
                <PackageCard
                  id={pkg.id}
                  slug={pkg.slug ?? undefined}
                  images={pkg.images}
                  title={pkg.title}
                  subtitle={pkg.hotelName}
                  location={pkg.location}
                  durationDays={pkg.durationDays}
                  rating={pkg.rating}
                  reviewCount={pkg.reviewCount}
                  priceFrom={typeof pkg.packagePrice === 'number' ? pkg.packagePrice : null}
                  totalOriginal={pkg.totalOriginal}
                  totalDiscounted={pkg.totalDiscounted}
                  badge={pkg.badge}
                />
              </div>
            ))}
          </HorizontalPreviewSlider>
        ) : (
          <Card className="rounded-2xl border border-border/60 p-6">
            <div className="text-sm text-muted-foreground">No packages available yet.</div>
          </Card>
        )}
      </div>
    </section>
  )
}

function CuratedToursRow({
  category,
  title,
  subtitle,
}: {
  category: TourCategoryKind
  title: string
  subtitle: string
}) {
  const { data = [], isLoading, isError } = useToursByCategory(category)
  const viewAllHref = useMemo(() => `/explore/tours/categories/${category}`, [category])

  return (
    <section>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">{title}</h2>
          <p className="text-muted-foreground mt-1">{subtitle}</p>
        </div>

        <Button asChild variant="link" className="px-0">
          <Link to={viewAllHref}>View All</Link>
        </Button>
      </div>

      <div className="mt-6">
        {isLoading ? (
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
        ) : isError ? (
          <Card className="rounded-2xl border border-border/60 p-6 text-sm text-muted-foreground">
            Unable to load tours right now.
          </Card>
        ) : data.length > 0 ? (
          <HorizontalPreviewSlider>
            {data.slice(0, 8).map((tour) => (
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
                  duration={'Multi-day'}
                  rating={tour.rating}
                  price={typeof tour.tourPrice === 'number' ? tour.tourPrice : 0}
                  currency="USD"
                  type={tour.badge}
                  isFeatured={tour.badge === 'Featured'}
                />
              </div>
            ))}
          </HorizontalPreviewSlider>
        ) : (
          <Card className="rounded-2xl border border-border/60 p-6">
            <div className="text-sm text-muted-foreground">No tours available yet.</div>
          </Card>
        )}
      </div>
    </section>
  )
}

function PakistanNorthernToursRow() {
  const { data = [], isLoading, isError } = usePakistanNorthernTours()

  return (
    <section>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            Northern Pakistan Tours
          </h2>
          <p className="text-muted-foreground mt-1">Hunza, Skardu, Fairy Meadows, Naran, Swat</p>
        </div>

        <Button asChild variant="link" className="px-0">
          <Link to="/explore/tours/collections/pakistan-northern">View All</Link>
        </Button>
      </div>

      <div className="mt-6">
        {isLoading ? (
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
        ) : isError ? (
          <Card className="rounded-2xl border border-border/60 p-6 text-sm text-muted-foreground">
            Unable to load tours right now.
          </Card>
        ) : data.length > 0 ? (
          <HorizontalPreviewSlider>
            {data.slice(0, 8).map((tour) => (
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
                  duration={'Multi-day'}
                  rating={tour.rating}
                  price={typeof tour.tourPrice === 'number' ? tour.tourPrice : 0}
                  currency="USD"
                  type={tour.badge}
                  isFeatured={tour.badge === 'Featured'}
                />
              </div>
            ))}
          </HorizontalPreviewSlider>
        ) : (
          <Card className="rounded-2xl border border-border/60 p-6">
            <div className="text-sm text-muted-foreground">No tours available yet.</div>
          </Card>
        )}
      </div>
    </section>
  )
}

// Airbnb Header Component
function AirbnbHeader() {
  const navigate = useNavigate()
  const [isSearchOverlayOpen, setIsSearchOverlayOpen] = useState(false)
  const { user, activeRole } = useAuth()
  const isAuthenticated = Boolean(user && activeRole)

  const handleSearch = (_filters: SearchFilters) => {
    const params = new URLSearchParams()
    if (_filters.query) params.set('q', _filters.query)
    if (_filters.location) params.set('location', _filters.location)
    if (_filters.category && _filters.category !== 'all') params.set('category', _filters.category)
    if (_filters.duration) params.set('duration', _filters.duration)
    if (_filters.priceRange[0] !== 0) params.set('minPrice', _filters.priceRange[0].toString())
    if (_filters.priceRange[1] !== 5000) params.set('maxPrice', _filters.priceRange[1].toString())
    if (_filters.minRating > 0) params.set('minRating', _filters.minRating.toString())
    if (_filters.experienceType.length > 0) params.set('types', _filters.experienceType.join(','))

    setIsSearchOverlayOpen(false)
    navigate(`/search?${params.toString()}`)
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-20 bg-background border-b z-50">
        <div className="container mx-auto max-w-7xl h-full px-4 md:px-6 lg:px-10 flex items-center gap-3 md:grid md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center md:gap-3">
          {/* Logo */}
          <div className="flex items-center shrink-0">
            <div className="flex items-center gap-1 cursor-pointer">
              {/* TripAvail Logo Icon (Rose) */}
              <svg
                viewBox="0 0 32 32"
                className="block h-8 w-8 fill-current text-primary"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                role="presentation"
                focusable="false"
              >
                <path d="M16 1c2.008 0 3.463.963 4.751 3.269l.533 1.025c1.954 3.83 6.114 12.54 7.1 14.836l.145.353c.667 1.591.91 3.162.717 4.698-.217 1.722-1.077 3.325-2.678 4.318-1.554.965-3.328 1.5-5.36 1.5-4.137 0-7.38-2.676-8.917-6.236l-.089-.283C10.706 28.164 7.426 31 3.092 31c-1.996 0-3.79-.536-5.267-1.501-1.636-.998-2.5-2.597-2.73-4.318-.21-1.62.062-3.193.754-4.836L16 1zm0 2c-1.137 0-2.31 1.258-3.416 3.46l-.37.747c-1.897 3.906-5.83 12.276-6.818 14.594l-.152.365c-.56 1.39-.757 2.628-.584 3.79.166 1.118.916 2.372 2.148 3.174 2.822 1.838 6.463-1.054 9.18-5.34l.112-.178.65-.965.674 1.134c2.81 4.512 6.55 7.189 9.387 5.353 1.18-.763 1.956-2.023 2.152-3.175.176-1.16-.011-2.396-.566-3.743l-.15-.355c-1.028-2.336-4.9-10.372-6.84-14.414L20.897 6.48C19.79 4.258 17.137 3 16 3z"></path>
              </svg>
              <span className="hidden md:block font-bold text-xl text-primary tracking-tighter">
                tripavail
              </span>
            </div>
          </div>

          {/* Centered Search Bar (Hidden on mobile, visible on tablet+) */}
          <div className="hidden md:flex justify-center min-w-0">
            <GlassCard
              variant="light"
              className="p-2 rounded-[2rem] shadow-2xl shadow-black/20 max-w-3xl w-full flex flex-row items-center gap-2 border border-white/30"
            >
              <button
                type="button"
                className="flex-1 w-full px-6 flex items-center gap-3 border-r border-border/50 py-3 min-w-0"
                onClick={() => setIsSearchOverlayOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') setIsSearchOverlayOpen(true)
                }}
                aria-label="Open search"
              >
                <Search className="w-5 h-5 text-primary" />
                <input
                  type="text"
                  readOnly
                  value=""
                  placeholder="Where to next?"
                  className="w-full bg-transparent border-none outline-none font-bold text-foreground placeholder:text-muted-foreground"
                  onFocus={() => setIsSearchOverlayOpen(true)}
                />
              </button>

              <Button
                type="button"
                onClick={() => setIsSearchOverlayOpen(true)}
                className="px-10 h-14 rounded-3xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-lg transition-all hover:scale-[1.02] shadow-xl shadow-primary/20"
              >
                Explore Now
              </Button>
            </GlassCard>
          </div>

          {/* Right User Menu */}
          <div className="flex items-center justify-end gap-2 shrink-0">
            <div className="md:hidden min-w-0">
              <GlassCard
                variant="light"
                className="p-2 rounded-[2rem] shadow-2xl shadow-black/20 w-full max-w-[360px] flex flex-row items-center gap-2 border border-white/30"
              >
                <button
                  type="button"
                  className="flex-1 px-4 flex items-center gap-2 min-w-0"
                  onClick={() => setIsSearchOverlayOpen(true)}
                  aria-label="Open search"
                >
                  <Search className="w-4 h-4 text-primary" />
                  <span className="truncate font-bold text-foreground text-sm">Where to next?</span>
                </button>

                <Button
                  type="button"
                  onClick={() => setIsSearchOverlayOpen(true)}
                  className="px-5 h-10 rounded-3xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-sm transition-all hover:scale-[1.02] shadow-xl shadow-primary/20 shrink-0"
                >
                  Explore Now
                </Button>
              </GlassCard>
            </div>

            {!isAuthenticated ? (
              <div className="hidden sm:flex items-center gap-2">
                <Button
                  variant="outline"
                  className="h-9 rounded-full px-4"
                  onClick={() => navigate('/auth?mode=login')}
                >
                  Log In
                </Button>
                <Button
                  className="h-9 rounded-full px-4 text-primary-foreground"
                  onClick={() => navigate('/auth?mode=signup')}
                >
                  Sign Up
                </Button>
              </div>
            ) : (
              <RoleBasedDrawer />
            )}
          </div>
        </div>
      </header>

      <SearchOverlay
        isOpen={isSearchOverlayOpen}
        onClose={() => setIsSearchOverlayOpen(false)}
        onSearch={handleSearch}
      />
    </>
  )
}

// Modern Trending Destinations Slider
function ModernTrendingSlider({ onNavigate }: { onNavigate: (screen: string) => void }) {
  const [currentSlide, setCurrentSlide] = useState(0)

  const destinations = [
    {
      id: 'santorini',
      name: 'Santorini',
      country: 'Greece',
      emoji: '🏛️',
      gradient: 'from-blue-500 to-cyan-500',
      price: 'From $899',
      image:
        'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzYW50b3JpbmklMjBncmVlY2VufDF8fHx8MTc1NzMzODQzMHww&ixlib=rb-4.1.0&q=80&w=1080',
      description: 'Stunning sunsets and white architecture',
    },
    {
      id: 'bali',
      name: 'Bali',
      country: 'Indonesia',
      emoji: '🏝️',
      gradient: 'from-green-500 to-emerald-500',
      price: 'From $599',
      image:
        'https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYWxpJTIwaW5kb25lc2lhfGVufDF8fHx8MTc1NzMzODQzMHww&ixlib=rb-4.1.0&q=80&w=1080',
      description: 'Tropical paradise and cultural wonders',
    },
    {
      id: 'tokyo',
      name: 'Tokyo',
      country: 'Japan',
      emoji: '🍣',
      gradient: 'from-pink-500 to-rose-500',
      price: 'From $1299',
      image:
        'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0b2t5byUyMGphcGFufGVufDF8fHx8MTc1NzMzODQzMHww&ixlib=rb-4.1.0&q=80&w=1080',
      description: 'Modern metropolis meets ancient tradition',
    },
    {
      id: 'paris',
      name: 'Paris',
      country: 'France',
      emoji: '🗼',
      gradient: 'from-purple-500 to-indigo-500',
      price: 'From $999',
      image:
        'https://images.unsplash.com/photo-1502602898536-47ad22581b52?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHxwwYXJpcyUyMGZyYW5jZXxlbnwxfHx8fDE3NTczMzg0MzB8MA&ixlib=rb-4.1.0&q=80&w=1080',
      description: 'City of lights and romantic adventures',
    },
    {
      id: 'dubai',
      name: 'Dubai',
      country: 'UAE',
      emoji: '🏙️',
      gradient: 'from-amber-500 to-orange-500',
      price: 'From $1199',
      image:
        'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkdWJhaSUyMHVhZXxlbnwxfHx8fDE3NTMzMzg0MzB8MA&ixlib=rb-4.1.0&q=80&w=1080',
      description: 'Luxury shopping and desert adventures',
    },
  ]

  // Auto-slide every 4 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % destinations.length)
    }, 4000)

    return () => clearInterval(timer)
  }, [destinations.length])

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % destinations.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + destinations.length) % destinations.length)
  }

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          >
            <TrendingUp className="w-5 h-5 text-primary" />
          </motion.div>
          <h3 className="font-semibold text-foreground">Trending Destinations</h3>
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Flame className="w-5 h-5 text-primary" />
          </motion.div>
        </div>
        <Button
          variant="ghost"
          className="text-primary text-sm"
          onClick={() => onNavigate('hotels')}
        >
          View All
        </Button>
      </div>

      {/* Modern Slider */}
      <div className="relative">
        <Card className="relative overflow-hidden border-0 shadow-airbnb h-64 md:h-80 lg:h-96">
          {/* Background Images */}
          <div className="absolute inset-0">
            {destinations.map((dest, index) => (
              <motion.div
                key={`bg-${dest.id}`}
                className="absolute inset-0"
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{
                  opacity: index === currentSlide ? 1 : 0,
                  scale: index === currentSlide ? 1 : 1.1,
                }}
                transition={{ duration: 0.7, ease: 'easeInOut' }}
              >
                <ImageWithFallback
                  src={dest.image}
                  alt={dest.name}
                  className="w-full h-full object-cover"
                />
                {/* Subtle dark gradient for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              </motion.div>
            ))}
          </div>

          {/* Navigation Arrows */}
          <motion.button
            onClick={prevSlide}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center z-10 border border-white/30"
            whileTap={{ scale: 0.9 }}
            whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.3)' }}
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </motion.button>

          <motion.button
            onClick={nextSlide}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center z-10 border border-white/30"
            whileTap={{ scale: 0.9 }}
            whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.3)' }}
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </motion.button>

          {/* Content */}
          <div className="relative z-10 p-6 h-full flex flex-col justify-center text-white">
            <div className="flex items-start justify-between mb-4">
              <motion.div
                className="flex-1"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                key={`content-${currentSlide}`}
                transition={{ delay: 0.2 }}
              >
                <h3 className="text-2xl font-bold mb-1">{destinations[currentSlide]?.name}</h3>
                <p className="text-white/90 mb-2">{destinations[currentSlide]?.country}</p>
                <p className="text-sm text-white/80">{destinations[currentSlide]?.description}</p>
              </motion.div>

              <motion.div
                className="text-right ml-4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                key={`price-${currentSlide}`}
                transition={{ delay: 0.3 }}
              >
                <div className="text-xl font-bold">{destinations[currentSlide]?.price}</div>
                <div className="text-sm opacity-90">per person</div>
              </motion.div>
            </div>
          </div>

          {/* Slide Indicators */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {destinations.map((_, index) => (
              <motion.button
                key={`indicator-${index}`}
                onClick={() => goToSlide(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentSlide ? 'bg-white w-6' : 'bg-white/50 hover:bg-white/70'
                }`}
                whileTap={{ scale: 0.9 }}
              />
            ))}
          </div>
        </Card>
      </div>
    </motion.div>
  )
}

// Featured Hotels Section - Enterprise Pattern with TanStack Query
function FeaturedHotelsSection({
  onNavigate: _onNavigate,
  onPackageSelect: _onPackageSelect,
}: {
  onNavigate: (screen: string) => void
  onPackageSelect: (packageId: string) => void
}) {
  // ✅ Enterprise: Replace manual useEffect with useQuery
  const { data: featuredHotels = [], isLoading, error } = useFeaturedPackages()
  const queryClient = useQueryClient()

  if (isLoading) {
    return <div className="py-12 text-center text-gray-500">Loading experiences...</div>
  }

  if (error) {
    return (
      <div className="py-12 text-center">
        <p className="text-red-500">Failed to load packages</p>
        <p className="text-sm text-gray-500">{error.message}</p>
      </div>
    )
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="space-y-6"
    >
      {/* Section Header */}
      <div className="flex items-center justify-between px-2">
        <div>
          <h3 className="text-2xl font-bold text-foreground">Featured Experiences</h3>
          <p className="text-muted-foreground text-sm">Curated packages for you</p>
        </div>
      </div>

      {featuredHotels.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-xl">
          <p className="text-gray-500">No packages available at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {featuredHotels.map((hotel, index) => (
            <motion.div
              key={hotel.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * index }}
              className="w-full"
            >
              <Link
                to={`/packages/${hotel.slug || hotel.id}`}
                className="block group cursor-pointer space-y-3"
                onMouseEnter={() => prefetchPackage(queryClient, hotel.slug || hotel.id)}
              >
                <div className="relative aspect-square overflow-hidden rounded-xl">
                  {/* Image Slider */}
                  <div className="w-full h-full hover:scale-105 transition-transform duration-500">
                    <ImageSlider images={hotel.images} alt={hotel.title} autoSlideDelay={5000} />
                  </div>

                  {/* Badge */}
                  {hotel.badge && (
                    <div className="absolute top-3 left-3 bg-white px-3 py-1.5 rounded-full shadow-sm z-10">
                      <span className="text-xs font-bold text-black block leading-none">
                        {hotel.badge}
                      </span>
                    </div>
                  )}

                  {/* Heart Icon */}
                  <button
                    className="absolute top-3 right-3 p-2 hover:scale-110 transition-transform z-10 group/heart"
                    onClick={(e) => e.preventDefault()}
                  >
                    <Heart className="w-6 h-6 text-white drop-shadow-md stroke-[2px] fill-black/20 group-hover/heart:fill-primary group-hover/heart:stroke-primary transition-colors" />
                  </button>
                </div>

                {/* Clean Content (Airbnb Style) */}
                <div className="space-y-1 px-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-semibold text-base truncate pr-2 text-foreground">
                      {hotel.hotelName}
                    </h4>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-black text-black" />
                      <span className="text-sm font-medium">{hotel.rating}</span>
                    </div>
                  </div>
                  <p className="text-muted-foreground text-sm line-clamp-1">{hotel.title}</p>
                  <p className="text-muted-foreground text-sm">{hotel.location}</p>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="font-bold text-base text-foreground">
                      {typeof hotel.packagePrice === 'number'
                        ? `$${hotel.packagePrice}`
                        : hotel.packagePrice}
                    </span>
                    {typeof hotel.packagePrice === 'number' && (
                      <span className="text-sm font-normal text-muted-foreground">/ night</span>
                    )}
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </motion.section>
  )
}

// Featured Tours Section - Enterprise Pattern with TanStack Query
function FeaturedToursSection({
  onNavigate,
  onTourSelect: _onTourSelect,
}: {
  onNavigate: (screen: string) => void
  onTourSelect: (tourId: string) => void
}) {
  // ✅ Enterprise: Replace manual useEffect with useQuery
  const { data: featuredTours = [], isLoading, error } = useFeaturedTours()
  const queryClient = useQueryClient()

  if (isLoading) {
    return <div className="py-12 text-center text-gray-500">Loading experiences...</div>
  }

  if (error) {
    return (
      <div className="py-12 text-center">
        <p className="text-red-500">Failed to load tours</p>
        <p className="text-sm text-gray-500">{error.message}</p>
      </div>
    )
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8 }}
      className="space-y-6"
    >
      {/* Section Header */}
      <div className="flex items-center justify-between px-2">
        <div>
          <h3 className="text-2xl font-bold text-foreground">Top Experiences</h3>
          <p className="text-muted-foreground text-sm">Unforgettable activities to book now</p>
        </div>
        <div className="flex gap-2 hidden md:flex">
          <Button
            variant="ghost"
            className="text-foreground font-semibold hover:bg-muted"
            onClick={() => onNavigate('tours')}
          >
            Show all
          </Button>
        </div>
      </div>

      {featuredTours.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-xl">
          <p className="text-gray-500">No tours available at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {featuredTours.map((tour, index) => (
            <motion.div
              key={tour.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * index }}
              className="w-full"
            >
              <Link
                to={`/tours/${tour.slug || tour.id}`}
                className="block group cursor-pointer space-y-3"
                onMouseEnter={() => prefetchTour(queryClient, tour.slug || tour.id)}
              >
                <div className="relative aspect-[4/5] overflow-hidden rounded-xl">
                  {/* Image Slider (Vertical aspect for "Poster" look) */}
                  <div className="w-full h-full hover:scale-105 transition-transform duration-500">
                    <ImageSlider images={tour.images} alt={tour.title} autoSlideDelay={5000} />
                  </div>

                  {/* Badge */}
                  {tour.badge && (
                    <div className="absolute top-3 left-3 glass-badge px-3 py-1.5 rounded-md z-10">
                      <span className="text-xs font-bold text-black block leading-none">
                        {tour.badge}
                      </span>
                    </div>
                  )}

                  {/* Heart Icon */}
                  <button
                    className="absolute top-3 right-3 p-2 hover:scale-110 transition-transform z-10 group/heart"
                    onClick={(e) => e.preventDefault()}
                  >
                    <Heart className="w-6 h-6 text-white drop-shadow-md stroke-[2px] fill-black/20 group-hover/heart:fill-primary group-hover/heart:stroke-primary transition-colors" />
                  </button>
                </div>

                {/* Clean Content */}
                <div className="space-y-1 px-1">
                  <div className="flex items-center gap-1 text-muted-foreground text-sm">
                    <span className="font-medium text-foreground">{tour.rating}</span>
                    <Star className="w-3 h-3 fill-foreground text-foreground" />
                    <span>·</span>
                    <span>{tour.location}</span>
                  </div>
                  <h4 className="font-semibold text-base line-clamp-1 text-foreground">
                    {tour.title}
                  </h4>
                  <div className="flex items-baseline gap-1">
                    {typeof tour.tourPrice === 'number' ? (
                      <>
                        <span className="font-bold text-base text-foreground">
                          From ${tour.tourPrice}
                        </span>
                        <span className="text-sm font-normal text-muted-foreground">/ person</span>
                      </>
                    ) : (
                      <span className="font-bold text-base text-foreground">{tour.tourPrice}</span>
                    )}
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </motion.section>
  )
}
