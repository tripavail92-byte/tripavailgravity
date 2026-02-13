import {
  ChevronLeft,
  ChevronRight,
  Flame,
  Globe,
  Heart,
  Search,
  SlidersHorizontal,
  Star,
  TrendingUp,
} from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { supabase } from '@/lib/supabase'
import { ImageSlider } from '@/components/ImageSlider'
import { ImageWithFallback } from '@/components/ImageWithFallback'
import { RoleBasedDrawer } from '@/components/navigation/RoleBasedDrawer'
import { SearchOverlay } from '@/components/search/SearchOverlay'
import type { SearchFilters } from '@/components/search/TripAvailSearchBar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { GlassCard } from '@/components/ui/glass'

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState('home')
  const navigate = useNavigate()

  const handlePackageSelect = (packageId: string) => {
    navigate(`/packages/${packageId}`)
  }

  const handleNavigate = (screen: string) => {
    if (screen === 'home') setActiveTab('home')
    if (screen === 'hotels') setActiveTab('hotels')
    if (screen === 'tours') setActiveTab('tours')
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
          {activeTab === 'home' && (
            <>
              {/* Modern Trending Destinations Slider */}
              <ModernTrendingSlider onNavigate={handleNavigate} />

              {/* Featured Hotels Section */}
              <FeaturedHotelsSection
                onNavigate={handleNavigate}
                onPackageSelect={handlePackageSelect}
              />

              {/* Featured Tours Section */}
              <FeaturedToursSection
                onNavigate={handleNavigate}
                onTourSelect={handleTourSelect}
              />
            </>
          )}

          {activeTab === 'hotels' && (
            <div className="py-20 text-center">
              <h2 className="text-2xl font-bold">Hotels Section</h2>
              <p className="text-muted-foreground">Coming Soon: HotelPackagesDisplay</p>
              <Button onClick={() => setActiveTab('home')} className="mt-4">
                Back to Home
              </Button>
            </div>
          )}

          {activeTab === 'tours' && (
            <div className="py-20 text-center">
              <h2 className="text-2xl font-bold">Tours Section</h2>
              <p className="text-muted-foreground">Coming Soon: FeaturedToursSection</p>
              <Button onClick={() => setActiveTab('home')} className="mt-4">
                Back to Home
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation Placeholder */}
      <div className="fixed bottom-0 left-0 right-0 h-16 glass-nav-bottom flex items-center justify-around px-6 z-50">
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'home' ? 'text-primary' : 'text-muted-foreground'}`}
        >
          <div className="w-6 h-6 rounded-full flex items-center justify-center">🏠</div>
          <span className="text-[10px] font-medium">Home</span>
        </button>
        <button
          onClick={() => setActiveTab('hotels')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'hotels' ? 'text-primary' : 'text-muted-foreground'}`}
        >
          <div className="w-6 h-6 rounded-full flex items-center justify-center">🏨</div>
          <span className="text-[10px] font-medium">Hotels</span>
        </button>
        <button
          onClick={() => setActiveTab('tours')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'tours' ? 'text-primary' : 'text-muted-foreground'}`}
        >
          <div className="w-6 h-6 rounded-full flex items-center justify-center">🏔️</div>
          <span className="text-[10px] font-medium">Tours</span>
        </button>
      </div>
    </div>
  )
}

// Airbnb Header Component
function AirbnbHeader() {
  const navigate = useNavigate()
  const [isSearchOverlayOpen, setIsSearchOverlayOpen] = useState(false)

  const handleSearch = (_filters: SearchFilters) => {
    setIsSearchOverlayOpen(false)
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-20 bg-background border-b z-50">
        <div className="container mx-auto max-w-7xl h-full px-4 md:px-10 flex items-center justify-between">
          {/* Logo */}
          <div className="flex-1 flex items-center">
            <div className="flex items-center gap-1 cursor-pointer">
              {/* TripAvail Logo Icon (Rose) */}
              <svg
                viewBox="0 0 32 32"
                className="block h-8 w-8 fill-[#FF385C]"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                role="presentation"
                focusable="false"
              >
                <path d="M16 1c2.008 0 3.463.963 4.751 3.269l.533 1.025c1.954 3.83 6.114 12.54 7.1 14.836l.145.353c.667 1.591.91 3.162.717 4.698-.217 1.722-1.077 3.325-2.678 4.318-1.554.965-3.328 1.5-5.36 1.5-4.137 0-7.38-2.676-8.917-6.236l-.089-.283C10.706 28.164 7.426 31 3.092 31c-1.996 0-3.79-.536-5.267-1.501-1.636-.998-2.5-2.597-2.73-4.318-.21-1.62.062-3.193.754-4.836L16 1zm0 2c-1.137 0-2.31 1.258-3.416 3.46l-.37.747c-1.897 3.906-5.83 12.276-6.818 14.594l-.152.365c-.56 1.39-.757 2.628-.584 3.79.166 1.118.916 2.372 2.148 3.174 2.822 1.838 6.463-1.054 9.18-5.34l.112-.178.65-.965.674 1.134c2.81 4.512 6.55 7.189 9.387 5.353 1.18-.763 1.956-2.023 2.152-3.175.176-1.16-.011-2.396-.566-3.743l-.15-.355c-1.028-2.336-4.9-10.372-6.84-14.414L20.897 6.48C19.79 4.258 17.137 3 16 3z"></path>
              </svg>
              <span className="hidden md:block font-bold text-xl text-[#FF385C] tracking-tighter">
                tripavail
              </span>
            </div>
          </div>

          {/* Centered Search Bar (Hidden on mobile, visible on tablet+) */}
          <div className="hidden md:flex flex-1 justify-center">
            <GlassCard
              variant="light"
              className="flex w-full max-w-3xl items-center justify-between border border-white/30 rounded-full shadow-sm hover:shadow-md transition-shadow cursor-pointer py-2.5 pl-6 pr-2"
              onClick={() => setIsSearchOverlayOpen(true)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') setIsSearchOverlayOpen(true)
              }}
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="text-sm font-semibold truncate">Search by destination or keyword</div>
                <div className="hidden lg:block h-6 w-[1px] bg-gray-300" />
                <div className="text-sm text-muted-foreground hidden lg:block">Add dates</div>
                <div className="h-6 w-[1px] bg-gray-300" />
                <div className="text-sm text-muted-foreground font-normal truncate">Add travelers</div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  className="hidden lg:flex items-center gap-2 rounded-full px-3 py-2 hover:bg-muted/40 transition-colors"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setIsSearchOverlayOpen(true)
                  }}
                  aria-label="Open search filters"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span className="text-sm font-medium">Filters</span>
                </button>

                <div className="bg-[#FF385C] rounded-full p-2 text-white">
                  <Search className="w-3 h-3 stroke-[3px]" />
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Right User Menu */}
          <div className="flex-1 flex items-center justify-end gap-2">
            <button
              onClick={() => navigate('/partner/onboarding')}
              className="hidden md:block text-sm font-semibold hover:bg-muted rounded-full px-4 py-3 transition-colors"
            >
              Become a Partner
            </button>
            <button className="hidden md:flex p-3 hover:bg-muted rounded-full transition-colors">
              <Globe className="w-4 h-4" />
            </button>

            {/* Role-Based Drawer Menu */}
            <RoleBasedDrawer />
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
                className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentSlide ? 'bg-white w-6' : 'bg-white/50 hover:bg-white/70'
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

import { Link } from 'react-router-dom';

// ... (existing imports)

// Featured Hotels Section (Horizontal Scroll Style)
function FeaturedHotelsSection({
  onNavigate: _onNavigate,
  onPackageSelect: _onPackageSelect,
}: {
  onNavigate: (screen: string) => void
  onPackageSelect: (packageId: string) => void
}) {
  const [featuredHotels, setFeaturedHotels] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true;
    async function fetchPackages() {
        // ... (existing fetch logic remains the same, just keeping it safe with isMounted if needed, 
        // but for this replacement I will just keep the existing logic structure but wrapped slightly if I were rewriting it all. 
        // For minimal diff, I will look at the map loop)
      try {
        const { data, error } = await supabase
          .from('packages' as any)
          .select(`
            id,
            slug,
            name,
            cover_image,
            media_urls,
            rooms_config,
            package_type,
            hotels (
              name,
              city,
              country
            )
          `)
          .eq('is_published', true)
          .order('created_at', { ascending: false })
          .limit(10)

        if (error) throw error

        if (data && isMounted) {
            // ... (mapping logic)
             const mappedPackages = data.map((pkg: any) => {
                // Calculate best price
                let price = 0;
                if (pkg.rooms_config) {
                const prices = Object.values(pkg.rooms_config).map((r: any) => Number(r.price) || 0).filter(p => p > 0);
                if (prices.length > 0) price = Math.min(...prices);
                }

                // Get location string
                const hotel = pkg.hotels;
                const location = hotel ? `${hotel.city || ''}, ${hotel.country || ''}`.replace(/^, /, '').replace(/, $/, '') : 'Multiple Locations';

                // Images
                const images = pkg.media_urls && pkg.media_urls.length > 0 ? pkg.media_urls : (pkg.cover_image ? [pkg.cover_image] : []);

                return {
                id: pkg.id,
                slug: pkg.slug,
                title: pkg.name,
                hotelName: hotel?.name || 'Partner Hotel',
                location: location || 'Global',
                packagePrice: price > 0 ? price : 'Contact',
                rating: 5.0, // Benchmark
                images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=1080'],
                badge: 'New Arrival'
                }
            })
            setFeaturedHotels(mappedPackages)
        }
      } catch (e) {
        console.error('Error fetching featured packages:', e)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchPackages();
    return () => { isMounted = false };
  }, [])

  if (loading) {
    return <div className="py-12 text-center text-gray-500">Loading experiences...</div>
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
              <Link to={`/packages/${hotel.slug || hotel.id}`} className="block group cursor-pointer space-y-3">
                <div className="relative aspect-square overflow-hidden rounded-xl">
                  {/* Image Slider */}
                  <div className="w-full h-full hover:scale-105 transition-transform duration-500">
                    <ImageSlider
                      images={hotel.images}
                      alt={hotel.title}
                      autoSlideDelay={5000}
                    />
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
                  <button className="absolute top-3 right-3 p-2 hover:scale-110 transition-transform z-10 group/heart" onClick={(e) => e.preventDefault()}>
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
                      {typeof hotel.packagePrice === 'number' ? `$${hotel.packagePrice}` : hotel.packagePrice}
                    </span>
                    {typeof hotel.packagePrice === 'number' && <span className="text-sm font-normal text-muted-foreground">/ night</span>}
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

// Featured Tours Section
function FeaturedToursSection({
  onNavigate,
  onTourSelect: _onTourSelect,
}: {
  onNavigate: (screen: string) => void
  onTourSelect: (tourId: string) => void
}) {
  const [featuredTours, setFeaturedTours] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true;
    async function fetchTours() {
      try {
        const { data, error } = await supabase
          .from('tours' as any)
          .select('id,slug,title,location,price,currency,rating,tour_type,is_featured,images,created_at')
          .eq('is_published', true)
          .order('created_at', { ascending: false })
          .limit(10)

        if (error) throw error

        if (data && isMounted) {
            const mappedTours = (data || []).map((tour: any) => {
            const locationObj = tour.location || {}
            const location = `${locationObj.city || ''}, ${locationObj.country || ''}`
                .replace(/^, /, '')
                .replace(/, $/, '')

            const images = Array.isArray(tour.images) ? tour.images : []

            return {
                id: tour.id,
                slug: tour.slug,
                title: tour.title,
                location: location || 'Global',
                tourPrice: Number(tour.price) > 0 ? Number(tour.price) : 'Contact',
                rating: Number(tour.rating) || 0,
                images:
                images.length > 0
                    ? images
                    : [
                        'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80&w=1080',
                    ],
                badge: tour.is_featured ? 'Featured' : tour.tour_type,
            }
            })

            setFeaturedTours(mappedTours)
        }
      } catch (e) {
        console.error('Error fetching featured tours:', e)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchTours()
    return () => { isMounted = false };
  }, [])

  if (loading) {
    return <div className="py-12 text-center text-gray-500">Loading experiences...</div>
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
            <Link to={`/tours/${tour.slug || tour.id}`} className="block group cursor-pointer space-y-3">
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
                <button className="absolute top-3 right-3 p-2 hover:scale-110 transition-transform z-10 group/heart" onClick={(e) => e.preventDefault()}>
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
