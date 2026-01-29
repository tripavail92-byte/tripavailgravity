import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Star, MapPin, Calendar, Users, Heart, Crown, 
  Sparkles, Mountain, Coffee, Utensils, Plane,
  ChevronRight, Clock, Award, Shield, TrendingUp,
  Zap, Flame, Globe, Compass, Sun, Moon, Wind,
  ChevronLeft
} from 'lucide-react';
import { Card } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { ImageWithFallback } from '../../../components/figma/ImageWithFallback';
import { HotelPackagesDisplay } from '../../../components/HotelPackagesDisplay';
import { AirbnbHotelDetailScreen } from '../../../components/AirbnbHotelDetailScreen';
import { wishlistService } from '../../../services/wishlistService';
// Import the dashboard component
import DashboardScreen from './DashboardScreen';

interface HomeScreenProps {
  onNavigate: (screen: string) => void;
  activeTab?: string;
  showDashboard?: boolean;
  onDetailScreenChange?: (isDetailActive: boolean) => void;
}

export default function HomeScreen({ onNavigate, activeTab = 'home', showDashboard = false, onDetailScreenChange }: HomeScreenProps) {
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);

  const handlePackageSelect = (packageId: string) => {
    setSelectedPackageId(packageId);
    onDetailScreenChange?.(true);
  };

  const handleBackFromPackageDetail = () => {
    setSelectedPackageId(null);
    onDetailScreenChange?.(false);
  };

  const handleBookNow = (packageId: string) => {
    console.log('Booking package:', packageId);
    // Navigate to booking screen
    onNavigate('booking');
  };

  const handleToggleWishlist = (packageId: string, isWishlisted: boolean) => {
    wishlistService.toggleWishlist(packageId);
  };

  // Show hotel packages when hotels tab is active
  if (activeTab === 'hotels') {
    // Show package details if a package is selected
    if (selectedPackageId) {
      return (
        <AirbnbHotelDetailScreen
          packageId={selectedPackageId}
          onBack={handleBackFromPackageDetail}
          onBookNow={handleBookNow}
        />
      );
    }

    // Show packages list
    return (
      <div className="space-y-6">
        <HotelPackagesDisplay 
          onPackageSelect={handlePackageSelect}
        />
      </div>
    );
  }

  // Show tours content when tours tab is active
  if (activeTab === 'tours') {
    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <motion.div
            className="text-6xl mb-4"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            🎒
          </motion.div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Tour Packages</h2>
          <p className="text-muted-foreground">Coming soon! Exciting tour packages await.</p>
        </motion.div>
      </div>
    );
  }

  // Show messages content when messages tab is active
  if (activeTab === 'messages') {
    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <motion.div
            className="text-6xl mb-4"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            💬
          </motion.div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Messages</h2>
          <p className="text-muted-foreground">No new messages</p>
        </motion.div>
      </div>
    );
  }

  // Show profile content when profile tab is active
  if (activeTab === 'profile') {
    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <motion.div
            className="text-6xl mb-4"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            👤
          </motion.div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Profile</h2>
          <p className="text-muted-foreground">Manage your profile and preferences</p>
        </motion.div>
      </div>
    );
  }

  // Default home content - Dashboard or Featured Hotels & Tours
  if (showDashboard) {
    return <DashboardScreen onNavigate={onNavigate} />;
  }

  return (
    <div className="space-y-4 pb-8">
      {/* Modern Trending Destinations Slider */}
      <ModernTrendingSlider onNavigate={onNavigate} />
      
      {/* Featured Hotels Section */}
      <FeaturedHotelsSection onNavigate={onNavigate} onPackageSelect={handlePackageSelect} />
      
      {/* Featured Tours Section */}
      <FeaturedToursSection onNavigate={onNavigate} />
    </div>
  );
}

// Modern Trending Destinations Slider
function ModernTrendingSlider({ onNavigate }: { onNavigate: (screen: string) => void }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const destinations = [
    {
      id: 'santorini',
      name: 'Santorini',
      country: 'Greece',
      emoji: '🏛️',
      gradient: 'from-blue-400 to-cyan-400',
      price: 'From $899',
      image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzYW50b3JpbmklMjBncmVlY2V8ZW58MXx8fHwxNzU3MzM4NDMwfDA&ixlib=rb-4.1.0&q=80&w=1080',
      description: 'Stunning sunsets and white architecture'
    },
    {
      id: 'bali',
      name: 'Bali',
      country: 'Indonesia', 
      emoji: '🏝️',
      gradient: 'from-green-400 to-emerald-400',
      price: 'From $599',
      image: 'https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYWxpJTIwaW5kb25lc2lhfGVufDF8fHx8MTc1NzMzODQzMHww&ixlib=rb-4.1.0&q=80&w=1080',
      description: 'Tropical paradise and cultural wonders'
    },
    {
      id: 'tokyo',
      name: 'Tokyo',
      country: 'Japan',
      emoji: '🗾',
      gradient: 'from-pink-400 to-rose-400',
      price: 'From $1299',
      image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0b2t5byUyMGphcGFufGVufDF8fHx8MTc1NzMzODQzMHww&ixlib=rb-4.1.0&q=80&w=1080',
      description: 'Modern metropolis meets ancient tradition'
    },
    {
      id: 'paris',
      name: 'Paris',
      country: 'France',
      emoji: '🗼',
      gradient: 'from-purple-400 to-violet-400',
      price: 'From $999',
      image: 'https://images.unsplash.com/photo-1502602898536-47ad22581b52?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYXJpcyUyMGZyYW5jZXxlbnwxfHx8fDE3NTczMzg0MzB8MA&ixlib=rb-4.1.0&q=80&w=1080',
      description: 'City of lights and romantic adventures'
    },
    {
      id: 'dubai',
      name: 'Dubai',
      country: 'UAE',
      emoji: '🏢',
      gradient: 'from-amber-400 to-orange-400',
      price: 'From $1199',
      image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkdWJhaSUyMHVhZXxlbnwxfHx8fDE3NTczMzg0MzB8MA&ixlib=rb-4.1.0&q=80&w=1080',
      description: 'Luxury shopping and desert adventures'
    }
  ];

  // Auto-slide every 4 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % destinations.length);
    }, 4000);

    return () => clearInterval(timer);
  }, [destinations.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % destinations.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + destinations.length) % destinations.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

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
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          >
            <TrendingUp className="w-5 h-5 text-primary" />
          </motion.div>
          <h3 className="font-semibold text-foreground">Trending Destinations</h3>
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Flame className="w-5 h-5 text-orange-500" />
          </motion.div>
        </div>
        <Button variant="ghost" className="text-primary text-sm" onClick={() => onNavigate('destinations')}>
          View All
        </Button>
      </div>

      {/* Modern Slider */}
      <div className="relative">
        <Card className="relative overflow-hidden border-0 shadow-xl h-48">
          {/* Background Images */}
          <div className="absolute inset-0">
            {destinations.map((dest, index) => (
              <motion.div
                key={`bg-${dest.id}`}
                className="absolute inset-0"
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ 
                  opacity: index === currentSlide ? 1 : 0,
                  scale: index === currentSlide ? 1 : 1.1
                }}
                transition={{ duration: 0.7, ease: "easeInOut" }}
              >
                <ImageWithFallback
                  src={dest.image}
                  alt={dest.name}
                  className="w-full h-full object-cover"
                />
                {/* Just a subtle dark gradient for text readability */}
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
                  index === currentSlide 
                    ? 'bg-white w-6' 
                    : 'bg-white/50 hover:bg-white/70'
                }`}
                whileTap={{ scale: 0.9 }}
              />
            ))}
          </div>
        </Card>
      </div>
    </motion.div>
  );
}

// Package Image Slider Component
function PackageImageSlider({ 
  images, 
  alt, 
  className = "w-full h-full object-cover",
  autoSlideDelay = 5000 
}: { 
  images: string[], 
  alt: string, 
  className?: string,
  autoSlideDelay?: number 
}) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, autoSlideDelay);

    return () => clearInterval(timer);
  }, [images.length, autoSlideDelay]);

  const goToImage = (index: number) => {
    setCurrentImageIndex(index);
  };

  if (images.length === 0) return null;

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Images */}
      <div className="relative w-full h-full">
        {images.map((image, index) => (
          <motion.div
            key={`img-${index}`}
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ 
              opacity: index === currentImageIndex ? 1 : 0,
              scale: index === currentImageIndex ? 1 : 1.1
            }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          >
            <ImageWithFallback
              src={image}
              alt={`${alt} ${index + 1}`}
              className={className}
            />
          </motion.div>
        ))}
      </div>

      {/* Image Indicators - Only show if more than 1 image */}
      {images.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {images.map((_, index) => (
            <motion.button
              key={`dot-${index}`}
              onClick={() => goToImage(index)}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                index === currentImageIndex 
                  ? 'bg-white w-4' 
                  : 'bg-white/50 hover:bg-white/70'
              }`}
              whileTap={{ scale: 0.9 }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Enhanced Featured Hotels Section - Compact
function FeaturedHotelsSection({ onNavigate, onPackageSelect }: {
  onNavigate: (screen: string) => void;
  onPackageSelect: (packageId: string) => void;
}) {
  const [wishlistedPackages, setWishlistedPackages] = useState<Set<string>>(new Set());

  const featuredHotels = [
    {
      id: 'luxury-beach-1',
      title: 'Paradise Beach Escape',
      hotelName: 'Azure Shores Resort',
      location: 'Bali, Indonesia',
      originalPrice: 899,
      packagePrice: 599,
      savings: 300,
      rating: 4.9,
      reviews: 1247,
      duration: '3 Days, 2 Nights',
      images: [
        'https://images.unsplash.com/photo-1580450997544-8846a39f3dfa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cm9waWNhbCUyMHJlc29ydCUyMGJlYWNofGVufDF8fHx8MTc1NzMzODQzMHww&ixlib=rb-4.1.0&q=80&w=1080',
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiZWFjaCUyMHJlc29ydCUyMHBvb2x8ZW58MXx8fHwxNzU3MzM4NDMwfDA&ixlib=rb-4.1.0&q=80&w=1080',
        'https://images.unsplash.com/photo-1571896349842-33c89424de2d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiZWFjaCUyMHN1bnNldCUyMHJlc29ydHxlbnwxfHx8fDE3NTczMzg0MzB8MA&ixlib=rb-4.1.0&q=80&w=1080',
        'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZXNvcnQlMjByb29tfGVufDF8fHx8MTc1NzMzODQzMHww&ixlib=rb-4.1.0&q=80&w=1080'
      ],
      type: 'Romantic',
      badge: 'Most Popular',
      gradient: 'from-rose-500 to-pink-500'
    },
    {
      id: 'luxury-resort-2',
      title: 'Alpine Luxury Retreat',
      hotelName: 'Mountain Crown Lodge',
      location: 'Swiss Alps, Switzerland',
      originalPrice: 1299,
      packagePrice: 999,
      savings: 300,
      rating: 4.8,
      reviews: 892,
      duration: '4 Days, 3 Nights',
      images: [
        'https://images.unsplash.com/photo-1689729738920-edea97589328?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb3VudGFpbiUyMGhvdGVsJTIwcmVzb3J0fGVufDF8fHx8MTc1NzMzNDczMHww&ixlib=rb-4.1.0&q=80&w=1080',
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb3VudGFpbiUyMHNraSUyMHJlc29ydHxlbnwxfHx8fDE3NTczMzg0MzB8MA&ixlib=rb-4.1.0&q=80&w=1080',
        'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb3VudGFpbiUyMGxvZGdlfGVufDF8fHx8MTc1NzMzODQzMHww&ixlib=rb-4.1.0&q=80&w=1080',
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHhhbHBpbmUlMjBsYWtlfGVufDF8fHx8MTc1NzMzODQzMHww&ixlib=rb-4.1.0&q=80&w=1080'
      ],
      type: 'Adventure',
      badge: 'Premium',
      gradient: 'from-blue-500 to-indigo-500'
    }
  ];

  const handleToggleWishlist = (packageId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    wishlistService.toggleWishlist(packageId);
    const wishlist = wishlistService.getWishlist();
    setWishlistedPackages(new Set(wishlist));
  };

  const getBadgeGradient = (badge: string) => {
    switch (badge) {
      case 'Most Popular': return 'bg-gradient-to-r from-primary to-rose-500';
      case 'Premium': return 'bg-gradient-to-r from-purple-500 to-indigo-500';
      default: return 'bg-gradient-to-r from-gray-500 to-gray-600';
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="space-y-3"
    >
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Crown className="w-4 h-4 text-yellow-500" />
          </motion.div>
          <div>
            <h3 className="font-semibold text-foreground">Featured Hotels</h3>
            <p className="text-xs text-muted-foreground">Handpicked luxury experiences</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          className="text-primary text-sm"
          onClick={() => onNavigate('hotels')}
        >
          View All
          <motion.div
            animate={{ x: [0, 4, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <ChevronRight className="w-3 h-3 ml-1" />
          </motion.div>
        </Button>
      </div>

      {/* Hotels Grid */}
      <div className="grid grid-cols-1 gap-4">
        {featuredHotels.map((hotel, index) => (
          <motion.div
            key={hotel.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 + index * 0.1 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card 
              className="overflow-hidden cursor-pointer border-0 bg-card shadow-lg relative"
              onClick={() => onPackageSelect(hotel.id)}
            >
              <div className="relative z-10">
                {/* Image Slider */}
                <div className="relative h-40 overflow-hidden">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.4 }}
                    className="w-full h-full"
                  >
                    <PackageImageSlider
                      images={hotel.images}
                      alt={hotel.title}
                      autoSlideDelay={6000}
                    />
                  </motion.div>
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  
                  {/* Badge */}
                  <motion.div 
                    className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-semibold text-white ${getBadgeGradient(hotel.badge)}`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.8 + index * 0.1, type: "spring" }}
                  >
                    {hotel.badge}
                  </motion.div>
                  
                  {/* Heart Icon */}
                  <motion.button
                    onClick={(e) => handleToggleWishlist(hotel.id, e)}
                    className={`absolute top-2 right-2 w-8 h-8 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-300 ${ 
                      wishlistedPackages.has(hotel.id)
                        ? 'bg-primary text-white'
                        : 'bg-white/90 text-gray-600'
                    }`}
                    whileTap={{ scale: 0.9 }}
                    whileHover={{ scale: 1.1 }}
                  >
                    <Heart className={`w-4 h-4 ${wishlistedPackages.has(hotel.id) ? 'fill-current' : ''}`} />
                  </motion.button>
                  
                  {/* Savings Badge */}
                  <motion.div 
                    className="absolute bottom-2 right-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-2 py-1 rounded-full text-xs font-semibold"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 1 + index * 0.1, type: "spring" }}
                  >
                    Save ${hotel.savings}
                  </motion.div>
                </div>
                
                {/* Content */}
                <div className="p-3 space-y-2">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-card-foreground mb-1">{hotel.title}</h4>
                      <p className="text-sm text-muted-foreground mb-1">{hotel.hotelName}</p>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        <span>{hotel.location}</span>
                      </div>
                    </div>
                    
                    {/* Rating */}
                    <div className="text-right">
                      <div className="flex items-center gap-1 mb-1">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold text-card-foreground text-sm">{hotel.rating}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">({hotel.reviews})</p>
                    </div>
                  </div>
                  
                  {/* Details & Pricing */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span>{hotel.duration}</span>
                    </div>
                    
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-card-foreground">${hotel.packagePrice}</span>
                        <span className="text-sm text-muted-foreground line-through">${hotel.originalPrice}</span>
                      </div>
                      
                      <motion.button
                        className={`mt-1 px-3 py-1 bg-gradient-to-r ${hotel.gradient} text-white rounded-lg text-xs font-medium shadow-lg`}
                        whileTap={{ scale: 0.95 }}
                        whileHover={{ scale: 1.02 }}
                      >
                        Book Now
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}

// Enhanced Featured Tours Section - Compact
function FeaturedToursSection({ onNavigate }: { onNavigate: (screen: string) => void }) {
  const [wishlistedTours, setWishlistedTours] = useState<Set<string>>(new Set());

  const featuredTours = [
    {
      id: 'adventure-tour-1',
      title: 'Epic Adventure Journey',
      operator: 'Adventure Plus Tours',
      location: 'Nepal Himalayas',
      originalPrice: 1299,
      tourPrice: 999,
      savings: 300,
      rating: 4.9,
      reviews: 856,
      duration: '12 Days',
      groupSize: 'Max 8 People',
      images: [
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb3VudGFpbiUyMGFkdmVudHVyZSUyMHRyZWt8ZW58MXx8fHwxNzU3MzM4NDMwfDA&ixlib=rb-4.1.0&q=80&w=1080',
        'https://images.unsplash.com/photo-1465056836041-7f43ac27dcb5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoaW1hbGF5YSUyMG1vdW50YWlufGVufDF8fHx8MTc1NzMzODQzMHww&ixlib=rb-4.1.0&q=80&w=1080',
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cmVra2luZyUyMGNhbXB8ZW58MXx8fHwxNzU3MzM4NDMwfDA&ixlib=rb-4.1.0&q=80&w=1080',
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb3VudGFpbiUyMHN1bW1pdHxlbnwxfHx8fDE3NTczMzg0MzB8MA&ixlib=rb-4.1.0&q=80&w=1080'
      ],
      type: 'Adventure',
      badge: 'Best Seller',
      highlights: ['Base Camp Trek', 'Expert Guide', 'All Meals Included', 'Safety Equipment'],
      difficulty: 'Challenging',
      includes: ['Accommodation', 'Meals', 'Transportation', 'Guide'],
      gradient: 'from-emerald-500 to-teal-500'
    },
    {
      id: 'cultural-tour-2',
      title: 'Ancient Wonders Explorer',
      operator: 'Heritage Discovery Tours',
      location: 'Cairo, Egypt',
      originalPrice: 999,
      tourPrice: 749,
      savings: 250,
      rating: 4.7,
      reviews: 642,
      duration: '8 Days',
      groupSize: 'Max 12 People',
      images: [
        'https://images.unsplash.com/photo-1539650116574-75c0c6d73bbd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxweXJhbWlkcyUyMGVneXB0fGVufDF8fHx8MTc1NzMzODQzMHww&ixlib=rb-4.1.0&q=80&w=1080',
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcGhpbnglMjBlZ3lwdHxlbnwxfHx8fDE3NTczMzg0MzB8MA&ixlib=rb-4.1.0&q=80&w=1080',
        'https://images.unsplash.com/photo-1471919743851-c4df8b6ee133?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlZ3lwdCUyMHRlbXBsZXxlbnwxfHx8fDE3NTczMzg0MzB8MA&ixlib=rb-4.1.0&q=80&w=1080',
        'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuaWxlJTIwcml2ZXJ8ZW58MXx8fHwxNzU3MzM4NDMwfDA&ixlib=rb-4.1.0&q=80&w=1080'
      ],
      type: 'Cultural',
      badge: 'Cultural Heritage',
      highlights: ['Pyramid Tours', 'Museum Visits', 'Nile Cruise', 'Expert Egyptologist'],
      difficulty: 'Easy',
      includes: ['5-Star Hotels', 'All Meals', 'Internal Flights', 'Guide'],
      gradient: 'from-amber-500 to-orange-500'
    }
  ];

  const handleToggleWishlist = (tourId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    wishlistService.toggleWishlist(tourId);
    const wishlist = wishlistService.getWishlist();
    setWishlistedTours(new Set(wishlist));
  };

  const getBadgeGradient = (badge: string) => {
    switch (badge) {
      case 'Best Seller': return 'bg-gradient-to-r from-primary to-rose-500';
      case 'Most Popular': return 'bg-gradient-to-r from-orange-500 to-red-500';
      case 'Cultural Heritage': return 'bg-gradient-to-r from-amber-500 to-orange-500';
      default: return 'bg-gradient-to-r from-gray-500 to-gray-600';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-600 bg-green-100 dark:bg-green-500/20';
      case 'Moderate': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-500/20';
      case 'Challenging': return 'text-red-600 bg-red-100 dark:bg-red-500/20';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-500/20';
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8 }}
      className="space-y-3"
    >
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ 
              rotate: [0, 10, -10, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Mountain className="w-4 h-4 text-blue-500" />
          </motion.div>
          <div>
            <h3 className="font-semibold text-foreground">Featured Tours</h3>
            <p className="text-xs text-muted-foreground">Unforgettable guided adventures</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          className="text-primary text-sm"
          onClick={() => onNavigate('tours')}
        >
          View All
          <motion.div
            animate={{ x: [0, 4, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <ChevronRight className="w-3 h-3 ml-1" />
          </motion.div>
        </Button>
      </div>

      {/* Tours Grid */}
      <div className="grid grid-cols-1 gap-4">
        {featuredTours.map((tour, index) => (
          <motion.div
            key={tour.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 + index * 0.1 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card 
              className="overflow-hidden cursor-pointer border-0 bg-card shadow-lg relative"
              onClick={() => onNavigate('tour-detail')}
            >
              <div className="relative z-10">
                {/* Image Slider */}
                <div className="relative h-40 overflow-hidden">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.4 }}
                    className="w-full h-full"
                  >
                    <PackageImageSlider
                      images={tour.images}
                      alt={tour.title}
                      autoSlideDelay={7000}
                    />
                  </motion.div>
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  
                  {/* Badge */}
                  <motion.div 
                    className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-semibold text-white ${getBadgeGradient(tour.badge)}`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 1 + index * 0.1, type: "spring" }}
                  >
                    {tour.badge}
                  </motion.div>
                  
                  {/* Heart Icon */}
                  <motion.button
                    onClick={(e) => handleToggleWishlist(tour.id, e)}
                    className={`absolute top-2 right-2 w-8 h-8 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-300 ${ 
                      wishlistedTours.has(tour.id)
                        ? 'bg-primary text-white'
                        : 'bg-white/90 text-gray-600'
                    }`}
                    whileTap={{ scale: 0.9 }}
                    whileHover={{ scale: 1.1 }}
                  >
                    <Heart className={`w-4 h-4 ${wishlistedTours.has(tour.id) ? 'fill-current' : ''}`} />
                  </motion.button>
                  
                  {/* Difficulty Badge */}
                  <motion.div 
                    className={`absolute bottom-2 left-2 px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(tour.difficulty)}`}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 1.2 + index * 0.1, type: "spring" }}
                  >
                    {tour.difficulty}
                  </motion.div>
                  
                  {/* Savings Badge */}
                  <motion.div 
                    className="absolute bottom-2 right-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-2 py-1 rounded-full text-xs font-semibold"
                    initial={{ scale: 0, rotate: 180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 1.1 + index * 0.1, type: "spring" }}
                  >
                    Save ${tour.savings}
                  </motion.div>
                </div>
                
                {/* Content */}
                <div className="p-3 space-y-2">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-card-foreground mb-1">{tour.title}</h4>
                      <p className="text-sm text-muted-foreground mb-1">{tour.operator}</p>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        <span>{tour.location}</span>
                      </div>
                    </div>
                    
                    {/* Rating */}
                    <div className="text-right">
                      <div className="flex items-center gap-1 mb-1">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold text-card-foreground text-sm">{tour.rating}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">({tour.reviews})</p>
                    </div>
                  </div>
                  
                  {/* Tour Details */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{tour.duration}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>{tour.groupSize}</span>
                    </div>
                  </div>
                  
                  {/* Pricing */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-card-foreground">${tour.tourPrice}</span>
                      <span className="text-sm text-muted-foreground line-through">${tour.originalPrice}</span>
                    </div>
                    
                    <motion.button
                      className={`px-3 py-1 bg-gradient-to-r ${tour.gradient} text-white rounded-lg text-xs font-medium shadow-lg`}
                      whileTap={{ scale: 0.95 }}
                      whileHover={{ scale: 1.02 }}
                    >
                      Book Now
                    </motion.button>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}