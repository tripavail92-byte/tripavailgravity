import {
  ChevronLeft,
  ChevronRight,
  ChevronRight as ChevronRightIcon,
  Flame,
  Globe,
  Heart,
  Search,
  Star,
  TrendingUp,
} from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { ImageSlider } from '@/components/ImageSlider'
import { ImageWithFallback } from '@/components/ImageWithFallback'
import { RoleBasedDrawer } from '@/components/navigation/RoleBasedDrawer'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState('home')
  const navigate = useNavigate()

  const handlePackageSelect = (packageId: string) => {
    navigate(`/hotels/${packageId}`)
  }

  const handleNavigate = (screen: string) => {
    if (screen === 'home') setActiveTab('home')
    if (screen === 'hotels') setActiveTab('hotels')
    if (screen === 'tours') setActiveTab('tours')
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Airbnb Header (Fixed) */}
      <AirbnbHeader />

      {/* Sticky Category Search Bar (Sticks below header) */}
      <CategoryNavBar />

      <div className="container mx-auto px-4 py-6 max-w-7xl">
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
              <FeaturedToursSection onNavigate={handleNavigate} />
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
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-card border-t flex items-center justify-around px-6 z-50">
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
  return (
    <header className="fixed top-0 left-0 right-0 h-20 bg-background border-b z-50 px-4 md:px-10 flex items-center justify-between">
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
        <div className="flex items-center border rounded-full shadow-sm hover:shadow-md transition-shadow cursor-pointer py-2.5 pl-6 pr-2 gap-4">
          <div className="text-sm font-semibold truncate max-w-[100px] lg:max-w-none">
            Search destinations
          </div>
          <div className="hidden lg:block h-6 w-[1px] bg-gray-300"></div>
          <div className="text-sm font-semibold hidden lg:block">Add dates</div>
          <div className="h-6 w-[1px] bg-gray-300"></div>
          <div className="text-sm text-gray-500 font-normal flex items-center gap-3">
            Add travelers
            <div className="bg-[#FF385C] rounded-full p-2 text-white">
              <Search className="w-3 h-3 stroke-[3px]" />
            </div>
          </div>
        </div>
      </div>

      {/* Right User Menu */}
      <div className="flex-1 flex items-center justify-end gap-2">
        <a
          href="#"
          className="hidden md:block text-sm font-semibold hover:bg-muted rounded-full px-4 py-3 transition-colors"
        >
          Become a Partner
        </a>
        <button className="hidden md:flex p-3 hover:bg-muted rounded-full transition-colors">
          <Globe className="w-4 h-4" />
        </button>

        {/* Profile Pill (Drawer Menu Trigger) */}
        {/* Role-Based Drawer Menu */}
        <RoleBasedDrawer />
      </div>
    </header>
  )
}
// Airbnb-style Category Navigation Pill Bar
function CategoryNavBar() {
  const categories = [
    { id: 'trending', label: 'Trending', icon: '🔥' },
    { id: 'beach', label: 'Beachfront', icon: '🏝️' },
    { id: 'mountains', label: 'Mountains', icon: '🏔️' },
    { id: 'city', label: 'Cities', icon: '🏙️' },
    { id: 'history', label: 'History', icon: '🏛️' },
    { id: 'luxury', label: 'Luxury', icon: '💎' },
    { id: 'cabins', label: 'Cabins', icon: '🛖' },
    { id: 'arctic', label: 'Arctic', icon: '❄️' },
    { id: 'desert', label: 'Desert', icon: '🏜️' },
    { id: 'camping', label: 'Camping', icon: '⛺' },
  ]

  const [activeCategory, setActiveCategory] = useState('trending')

  return (
    <div className="sticky top-20 z-40 w-full bg-background/95 backdrop-blur-md border-b shadow-sm pt-4">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="flex items-center gap-8 overflow-x-auto no-scrollbar pb-4 px-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className="flex flex-col items-center gap-2 min-w-fit transition-all duration-200 group relative pb-2"
            >
              <span
                className={`text-xl grayscale group-hover:grayscale-0 transition-all ${activeCategory === cat.id ? 'grayscale-0 scale-110' : ''}`}
              >
                {cat.icon}
              </span>
              <span
                className={`text-xs font-medium whitespace-nowrap ${activeCategory === cat.id ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'}`}
              >
                {cat.label}
              </span>
              {activeCategory === cat.id && (
                <motion.div
                  layoutId="activeCategory"
                  className="absolute -bottom-[1px] left-0 right-0 h-[2px] bg-foreground"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
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

// Featured Hotels Section (Horizontal Scroll Style)
function FeaturedHotelsSection({
  onNavigate: _onNavigate,
  onPackageSelect,
}: {
  onNavigate: (screen: string) => void
  onPackageSelect: (packageId: string) => void
}) {
  const featuredHotels = [
    {
      id: 'luxury-beach-1',
      title: 'Paradise Beach Escape',
      hotelName: 'Azure Shores Resort',
      location: 'Bali, Indonesia',
      packagePrice: 599,
      rating: 4.9,
      images: [
        'https://images.unsplash.com/photo-1580450997544-8846a39f3dfa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cm9waWNhbCUyMHJlc29ydCUyMGJlYWNofGVufDF8fHx8MTc1NzMzODQzMHww&ixlib=rb-4.1.0&q=80&w=1080',
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHxiZWFjaCUyMHJlc29ydCUyMHBvb2x8ZW58MXx8fHwxNzU3MzM4NDMwfDA&ixlib=rb-4.1.0&q=80&w=1080',
      ],
      badge: 'Most Popular',
    },
    {
      id: 'luxury-resort-2',
      title: 'Alpine Luxury Retreat',
      hotelName: 'Mountain Crown Lodge',
      location: 'Swiss Alps, Switzerland',
      packagePrice: 999,
      rating: 4.8,
      images: [
        'https://images.unsplash.com/photo-1689729738920-edea97589328?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHxtb3VudGFpbiUyMGhvdGVsJTIwcmVzb3J0fGVufDF8fHx8MTc1NzMzNDczMHww&ixlib=rb-4.1.0&q=80&w=1080',
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHxtb3VudGFpbiUyMHNraSUyMHJlc29ydHxlbnwxfHx8fDE3NTMzMzg0MzB8MA&ixlib=rb-4.1.0&q=80&w=1080',
      ],
      badge: 'Premium',
    },
    {
      id: 'city-hotel-3',
      title: 'Urban Bliss Hotel',
      hotelName: 'The Metropolitan',
      location: 'New York, USA',
      packagePrice: 450,
      rating: 4.7,
      images: [
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHxodXh1cnklMjBob3RlbHxlbnwxfHx8fDE3NTMzMzg0MzB8MA&ixlib=rb-4.1.0&q=80&w=1080',
        'https://images.unsplash.com/photo-1582719508461-905c673771fd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHxodXh1cnklMjByb29tfGVufDF8fHx8MTc1NzMzODQzMHww&ixlib=rb-4.1.0&q=80&w=1080',
      ],
      badge: 'Guest favorite',
    },
    {
      id: 'desert-camp-4',
      title: 'Sahara Luxury Camp',
      hotelName: 'Dunes Glamping',
      location: 'Merzouga, Morocco',
      packagePrice: 320,
      rating: 4.9,
      images: [
        'https://images.unsplash.com/photo-1533692328991-081598976c53?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHxnbGFtcGluZ3xlbnwxfHx8fDE3NTMzMzg0MzB8MA&ixlib=rb-4.1.0&q=80&w=1080',
        'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHxjYW1waW5nfGVufDF8fHx8MTc1NzMzODQzMHww&ixlib=rb-4.1.0&q=80&w=1080',
      ],
      badge: 'Unique Stay',
    },
  ]

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
          <h3 className="text-2xl font-bold text-foreground">Popular homes in Lahore</h3>
          <p className="text-muted-foreground text-sm">Guest favorites in the city</p>
        </div>
        <div className="flex gap-2 hidden md:flex">
          <Button
            variant="outline"
            size="icon"
            className="rounded-full w-8 h-8 hover:scale-105 transition-transform"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="rounded-full w-8 h-8 hover:scale-105 transition-transform"
          >
            <ChevronRightIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Horizontal Scroll Container */}
      <div className="flex gap-6 overflow-x-auto no-scrollbar pb-8 -mx-4 px-4 snap-x">
        {featuredHotels.map((hotel, index) => (
          <motion.div
            key={hotel.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 * index }}
            className="min-w-[280px] md:min-w-[320px] snap-start"
            onClick={() => onPackageSelect(hotel.id)}
          >
            <div className="group cursor-pointer space-y-3">
              <div className="relative aspect-square overflow-hidden rounded-xl">
                {/* Image Slider */}
                <div className="w-full h-full hover:scale-105 transition-transform duration-500">
                  <ImageSlider
                    images={hotel.images}
                    alt={hotel.title}
                    autoSlideDelay={0} // Disable constant movement, feels more 'pro'
                  />
                </div>

                {/* Guest Favorite Badge */}
                {(hotel.badge === 'Most Popular' || hotel.badge === 'Guest favorite') && (
                  <div className="absolute top-3 left-3 bg-white px-3 py-1.5 rounded-full shadow-sm z-10">
                    <span className="text-xs font-bold text-black block leading-none">
                      Guest favorite
                    </span>
                  </div>
                )}

                {/* Heart Icon */}
                <button className="absolute top-3 right-3 p-2 hover:scale-110 transition-transform z-10 group/heart">
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
                <p className="text-muted-foreground text-sm">Oct 22-27</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="font-bold text-base text-foreground">${hotel.packagePrice}</span>
                  <span className="text-sm font-normal text-muted-foreground">night</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  )
}

// Featured Tours Section
// Featured Tours Section
function FeaturedToursSection({ onNavigate }: { onNavigate: (screen: string) => void }) {
  const featuredTours = [
    {
      id: 'adventure-tour-1',
      title: 'Epic Adventure Journey',
      location: 'Nepal Himalayas',
      tourPrice: 999,
      rating: 4.9,
      images: [
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb3VudGFpbiUyMGFkdmVudHVyZSUyMHRyZWt8ZW58MXx8fHwxNzU3MzM4NDMwfDA&ixlib=rb-4.1.0&q=80&w=1080',
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhbHBpbmUlMjBsYWtlfGVufDF8fHx8MTc1NzMzODQzMHww&ixlib=rb-4.1.0&q=80&w=1080',
      ],
      badge: 'Best Seller',
    },
    {
      id: 'cultural-tour-2',
      title: 'Kyoto Ancient Temples',
      location: 'Kyoto, Japan',
      tourPrice: 799,
      rating: 4.8,
      images: [
        'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxreW90byUyMHRlbXBsZXxlbnwxfHx8fDE3NTczMzg0MzB8MA&ixlib=rb-4.1.0&q=80&w=1080',
        'https://images.unsplash.com/photo-1528360983277-13d9b152c6d1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxqYXBhbiUyMGNoZXJyeSUyMGJsb3Nzb218ZW58MXx8fHwxNzU3MzM4NDMwfDA&ixlib=rb-4.1.0&q=80&w=1080',
      ],
      badge: 'Cultural',
    },
    {
      id: 'safari-tour-3',
      title: 'Serengeti Safari',
      location: 'Tanzania',
      tourPrice: 1499,
      rating: 5.0,
      images: [
        'https://images.unsplash.com/photo-1516426122078-c23e76319801?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzYWZhcml8ZW58MXx8fHwxNzU3MzM4NDMwfDA&ixlib=rb-4.1.0&q=80&w=1080',
        'https://images.unsplash.com/photo-1535591273668-578e31182c4f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiaWclMjBmaXZlJTIwc2FmYXJpfGVufDF8fHx8MTc1NzMzODQzMHww&ixlib=rb-4.1.0&q=80&w=1080',
      ],
      badge: 'Once in a Lifetime',
    },
  ]

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

      {/* Horizontal Scroll Container */}
      <div className="flex gap-6 overflow-x-auto no-scrollbar pb-8 -mx-4 px-4 snap-x">
        {featuredTours.map((tour, index) => (
          <motion.div
            key={tour.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 * index }}
            className="min-w-[280px] md:min-w-[320px] snap-start"
          >
            <div className="group cursor-pointer space-y-3">
              <div className="relative aspect-[4/5] overflow-hidden rounded-xl">
                {/* Image Slider (Vertical aspect for "Poster" look) */}
                <div className="w-full h-full hover:scale-105 transition-transform duration-500">
                  <ImageSlider images={tour.images} alt={tour.title} autoSlideDelay={0} />
                </div>

                {/* Badge */}
                {tour.badge && (
                  <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-md shadow-sm z-10">
                    <span className="text-xs font-bold text-black block leading-none">
                      {tour.badge}
                    </span>
                  </div>
                )}

                {/* Heart Icon */}
                <button className="absolute top-3 right-3 p-2 hover:scale-110 transition-transform z-10 group/heart">
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
                  <span className="font-bold text-base text-foreground">
                    From ${tour.tourPrice}
                  </span>
                  <span className="text-sm font-normal text-muted-foreground">/ person</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  )
}
