import { Briefcase, Mountain, Palmtree, Search, Tent, Waves } from 'lucide-react'
import { motion } from 'motion/react'
import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { PackageCard } from '@/components/traveller/PackageCard'
import { TourCard } from '@/components/traveller/TourCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/glass'
import { useFeaturedPackages, useHomepageMixPackages } from '@/queries/packageQueries'
import { useFeaturedTours, useHomepageMixTours } from '@/queries/tourQueries'

export default function Homepage() {
  const [searchParams] = useSearchParams()
  const filter = searchParams.get('filter')

  const showMergedList = filter === 'new' || filter === 'top-rated'

  const {
    data: mergeHotels = [],
    isLoading: mergeHotelsLoading,
    isError: mergeHotelsError,
  } = useHomepageMixPackages(showMergedList ? 96 : 1, { enabled: showMergedList })
  const {
    data: mergeTours = [],
    isLoading: mergeToursLoading,
    isError: mergeToursError,
  } = useHomepageMixTours(showMergedList ? 96 : 1, { enabled: showMergedList })

  // ✅ Enterprise: Query hooks instead of manual useEffect
  const {
    data: packages = [],
    isLoading: packagesLoading,
    error: packagesError,
  } = useFeaturedPackages()
  const { data: tours = [], isLoading: toursLoading, error: toursError } = useFeaturedTours()

  const loading = packagesLoading || toursLoading

  const mergedList = useMemo(() => {
    if (!showMergedList)
      return [] as Array<{
        type: 'hotel' | 'tour'
        id: string
        rating: number | null
        created_at: string
        payload: any
      }>

    const combined = [
      ...mergeHotels.map((pkg: any) => ({
        type: 'hotel' as const,
        id: pkg.id,
        rating: typeof pkg.rating === 'number' ? pkg.rating : null,
        created_at: pkg.created_at,
        payload: pkg,
      })),
      ...mergeTours.map((tour: any) => ({
        type: 'tour' as const,
        id: tour.id,
        rating: typeof tour.rating === 'number' ? tour.rating : null,
        created_at: tour.created_at,
        payload: tour,
      })),
    ]

    if (filter === 'new') {
      return combined.slice().sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
    }

    return combined.slice().sort((a, b) => {
      const ar = a.rating
      const br = b.rating
      if (ar == null && br == null) return 0
      if (ar == null) return 1
      if (br == null) return -1
      return br - ar
    })
  }, [showMergedList, filter, mergeHotels, mergeTours])

  if (showMergedList) {
    const title = filter === 'new' ? 'New Arrivals' : 'Top Rated'
    const isMergedLoading = mergeHotelsLoading || mergeToursLoading
    const isMergedError = mergeHotelsError || mergeToursError

    return (
      <div className="bg-background">
        <main className="max-w-7xl mx-auto px-4 py-10">
          <div className="flex items-end justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">{title}</h1>
              <p className="text-muted-foreground font-medium">Hotel stays and tour experiences</p>
            </div>
            <Button asChild variant="outline" className="rounded-xl border-border/60 font-bold">
              <Link to="/explore">Back to Explore</Link>
            </Button>
          </div>

          {isMergedLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="aspect-[4/5] bg-muted/60 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : isMergedError ? (
            <div className="rounded-2xl border border-border/60 p-6 text-sm text-muted-foreground">
              Unable to load experiences right now.
            </div>
          ) : mergedList.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {mergedList.map((item) =>
                item.type === 'hotel' ? (
                  <PackageCard
                    key={`hotel-${item.id}`}
                    id={item.payload.id}
                    slug={item.payload.slug ?? undefined}
                    images={item.payload.images}
                    title={item.payload.title}
                    subtitle={item.payload.hotelName}
                    location={item.payload.location}
                    durationDays={item.payload.durationDays ?? 3}
                    rating={item.payload.rating}
                    reviewCount={item.payload.reviewCount}
                    priceFrom={
                      typeof item.payload.packagePrice === 'number'
                        ? item.payload.packagePrice
                        : null
                    }
                    totalOriginal={item.payload.totalOriginal}
                    totalDiscounted={item.payload.totalDiscounted}
                    badge={'Hotel Stay'}
                  />
                ) : (
                  <TourCard
                    key={`tour-${item.id}`}
                    id={item.payload.id}
                    slug={item.payload.slug ?? undefined}
                    image={
                      item.payload.images?.[0] ||
                      'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&auto=format&fit=crop'
                    }
                    title={item.payload.title}
                    location={item.payload.location}
                    duration={'Multi-day'}
                    rating={item.payload.rating}
                    price={typeof item.payload.tourPrice === 'number' ? item.payload.tourPrice : 0}
                    currency="USD"
                    type={'Tour Experience'}
                    isFeatured={Boolean(item.payload.isFeatured)}
                  />
                ),
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-border/60 p-6 text-sm text-muted-foreground">
              No experiences available yet.
            </div>
          )}
        </main>
      </div>
    )
  }

  const categories = [
    { name: 'Adventure', icon: Mountain },
    { name: 'Business', icon: Briefcase },
    { name: 'Beach', icon: Waves },
    { name: 'Nature', icon: Palmtree },
    { name: 'Camping', icon: Tent },
  ]

  return (
    <div className="bg-background">
      {/* Hero Section */}
      <div className="relative h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1600&auto=format&fit=crop"
            alt="Hero background"
            className="w-full h-full object-cover brightness-75 transition-transform duration-1000 hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-background" />
        </div>

        <div className="relative z-10 max-w-4xl w-full px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl font-black text-white mb-6 drop-shadow-2xl">
              Wander often, <br />
              <span className="text-secondary">wonder always.</span>
            </h1>
            <p className="text-xl text-white/90 mb-10 font-medium max-w-2xl mx-auto drop-shadow-lg">
              Discover hidden gems and curated travel experiences across the globe.
            </p>

            <GlassCard
              variant="light"
              className="p-2 rounded-[2rem] shadow-2xl shadow-black/20 max-w-3xl mx-auto flex flex-col md:flex-row items-center gap-2"
            >
              <div className="flex-1 w-full px-6 flex items-center gap-3 border-b md:border-b-0 md:border-r border-border/50 py-3 md:py-0">
                <Search className="w-5 h-5 text-primary" />
                <input
                  type="text"
                  placeholder="Where to next?"
                  className="w-full bg-transparent border-none outline-none font-bold text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <Button className="w-full md:w-auto px-10 h-14 rounded-3xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-lg transition-all hover:scale-[1.02] shadow-xl shadow-primary/20">
                Explore Now
              </Button>
            </GlassCard>
          </motion.div>
        </div>
      </div>

      {/* Categories */}
      <div className="max-w-7xl mx-auto px-4 -mt-16 relative z-20 mb-20">
        <div className="bg-background rounded-[3rem] shadow-xl p-8 border border-border/50">
          <div className="flex flex-wrap justify-center gap-4 md:gap-12">
            {categories.map((cat) => (
              <button
                key={cat.name}
                className="group flex flex-col items-center gap-3 p-4 transition-all hover:scale-110"
              >
                <div className="w-16 h-16 rounded-3xl bg-muted/60 flex items-center justify-center group-hover:bg-primary/10 group-hover:rotate-12 transition-all duration-500 shadow-sm">
                  <cat.icon className="w-7 h-7 text-muted-foreground/70 group-hover:text-primary transition-colors" />
                </div>
                <span className="text-sm font-black text-muted-foreground group-hover:text-foreground transition-colors uppercase tracking-widest">
                  {cat.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Featured Section - Packages */}
      <main className="max-w-7xl mx-auto px-4 mb-20">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Featured Packages</h2>
            <p className="text-muted-foreground font-medium">
              Handpicked hotel stays and experiences
            </p>
          </div>
          <Button variant="outline" className="rounded-xl border-border/60 font-bold">
            View all packages
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="aspect-[4/5] bg-muted/60 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : packages.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {packages.map((pkg) => (
              <PackageCard
                key={pkg.id}
                id={pkg.id}
                slug={pkg.slug ?? undefined}
                images={
                  pkg.images?.length
                    ? pkg.images
                    : [
                        'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&auto=format&fit=crop',
                      ]
                }
                title={pkg.title}
                subtitle={pkg.hotelName}
                location={pkg.location}
                durationDays={pkg.durationDays ?? 3}
                rating={pkg.rating}
                reviewCount={pkg.reviewCount}
                priceFrom={typeof pkg.packagePrice === 'number' ? pkg.packagePrice : null}
                totalOriginal={pkg.totalOriginal}
                totalDiscounted={pkg.totalDiscounted}
                badge={pkg.badge}
              />
            ))}
          </div>
        ) : null}
      </main>

      {/* Featured Section - Tours */}
      <div className="bg-muted/30 py-20 border-y border-border/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-end justify-between mb-12">
            <div>
              <Badge className="bg-primary/10 text-primary border-none mb-3 px-3 py-1 font-bold text-[10px] uppercase tracking-wider">
                Explore Tours
              </Badge>
              <h2 className="text-3xl font-bold text-foreground mb-2">Popular Tour Experiences</h2>
              <p className="text-muted-foreground font-medium">
                Curated adventures led by local experts
              </p>
            </div>
            <Button
              variant="outline"
              className="rounded-xl border-border/60 font-bold bg-background"
            >
              Discover all tours
            </Button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-[4/5] bg-muted/50 rounded-3xl animate-pulse" />
              ))}
            </div>
          ) : tours.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {tours.map((tour) => (
                <TourCard
                  key={tour.id}
                  id={tour.id}
                  slug={tour.slug ?? undefined}
                  image={
                    tour.images?.[0] ||
                    'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&auto=format&fit=crop'
                  }
                  title={tour.title}
                  location={tour.location}
                  duration={'5 days'}
                  rating={tour.rating}
                  price={typeof tour.tourPrice === 'number' ? tour.tourPrice : 0}
                  currency="USD"
                  type={tour.badge}
                  isFeatured={tour.badge === 'Featured'}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-background rounded-3xl border border-dashed border-border">
              <h3 className="text-xl font-bold text-foreground mb-2">No featured tours yet</h3>
              <p className="text-muted-foreground font-medium">
                Our local experts are preparing amazing experiences for you.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
