import { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Star, MapPin, Calendar, Users, Heart, Crown, 
  Sparkles, Mountain, Coffee, Utensils, Plane,
  DollarSign, Clock, Wifi, Car
} from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { PackageSearchFilter } from './PackageSearchFilter';
import { wishlistService } from '../services/wishlistService';

interface FilterOptions {
  searchQuery: string;
  location: string;
  priceRange: [number, number];
  duration: string;
  rating: number;
  packageType: string;
  sortBy: string;
}

interface HotelPackagesDisplayProps {
  onPackageSelect?: (packageId: string) => void;
}

export function HotelPackagesDisplay({ onPackageSelect }: HotelPackagesDisplayProps) {
  const [filters, setFilters] = useState<FilterOptions>({
    searchQuery: '',
    location: '',
    priceRange: [0, 2000],
    duration: '',
    rating: 0,
    packageType: '',
    sortBy: 'popularity'
  });

  const [wishlistedPackages, setWishlistedPackages] = useState<Set<string>>(new Set());

  // Subscribe to wishlist changes
  useEffect(() => {
    const updateWishlist = () => {
      const wishlist = wishlistService.getWishlist();
      setWishlistedPackages(new Set(wishlist));
    };

    // Initial load
    updateWishlist();

    // Subscribe to changes
    const unsubscribe = wishlistService.subscribe(updateWishlist);

    return unsubscribe;
  }, []);

  const allPackages = [
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
      guests: 'Up to 2 Guests',
      image: 'https://images.unsplash.com/photo-1580450997544-8846a39f3dfa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cm9waWNhbCUyMHJlc29ydCUyMGJlYWNofGVufDF8fHx8MTc1NzMzODQzMHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      type: 'Romantic',
      badge: 'Most Popular',
      features: ['Ocean View Suite', 'Couples Spa', 'Private Beach Access', 'Sunset Dinner'],
      amenities: [Wifi, Car, Utensils, Sparkles]
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
      guests: 'Up to 4 Guests',
      image: 'https://images.unsplash.com/photo-1689729738920-edea97589328?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb3VudGFpbiUyMGhvdGVsJTIwcmVzb3J0fGVufDF8fHx8MTc1NzMzNDczMHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      type: 'Adventure',
      badge: 'Premium',
      features: ['Mountain View Chalet', 'Ski Equipment', 'Alpine Spa', 'Gourmet Dining'],
      amenities: [Wifi, Car, Coffee, Mountain]
    },
    {
      id: 'city-boutique-3',
      title: 'Urban Luxury Experience',
      hotelName: 'The Metropolitan',
      location: 'New York, USA',
      originalPrice: 699,
      packagePrice: 449,
      savings: 250,
      rating: 4.7,
      reviews: 2156,
      duration: '2 Days, 1 Night',
      guests: 'Up to 2 Guests',
      image: 'https://images.unsplash.com/photo-1726381552645-c4e5645366f6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaXR5JTIwYm91dGlxdWUlMjBob3RlbHxlbnwxfHx8fDE3NTczMzg0Mzd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      type: 'Business',
      badge: 'City Deal',
      features: ['Executive Suite', 'Broadway Show Tickets', 'City Tour', 'Fine Dining'],
      amenities: [Wifi, Car, Utensils, Sparkles]
    },
    {
      id: 'wellness-spa-4',
      title: 'Wellness & Rejuvenation',
      hotelName: 'Serenity Spa Resort',
      location: 'Tuscany, Italy',
      originalPrice: 1099,
      packagePrice: 799,
      savings: 300,
      rating: 4.9,
      reviews: 743,
      duration: '5 Days, 4 Nights',
      guests: 'Up to 2 Guests',
      image: 'https://images.unsplash.com/photo-1604161926875-bb58f9a0d81b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcGElMjB3ZWxsbmVzcyUyMGhvdGVsfGVufDF8fHx8MTc1NzMyMzg0Mnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      type: 'Wellness',
      badge: 'New',
      features: ['Spa Villa', 'Daily Treatments', 'Yoga Classes', 'Organic Cuisine'],
      amenities: [Wifi, Sparkles, Utensils, Coffee]
    },
    {
      id: 'romantic-suite-5',
      title: 'Romantic Honeymoon',
      hotelName: 'Villa Romance',
      location: 'Santorini, Greece',
      originalPrice: 1499,
      packagePrice: 1199,
      savings: 300,
      rating: 5.0,
      reviews: 456,
      duration: '6 Days, 5 Nights',
      guests: 'Up to 2 Guests',
      image: 'https://images.unsplash.com/photo-1637515128249-df66173ee9b4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyb21hbnRpYyUyMGhvdGVsJTIwc3VpdGV8ZW58MXx8fHwxNTczMzg0NDR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      type: 'Romantic',
      badge: 'Top Rated',
      features: ['Private Pool Villa', 'Sunset Cruise', 'Couples Massage', 'Wine Tasting'],
      amenities: [Wifi, Car, Utensils, Heart]
    },
    {
      id: 'luxury-resort-6',
      title: 'Grand Palace Experience',
      hotelName: 'Royal Gardens Resort',
      location: 'Dubai, UAE',
      originalPrice: 1899,
      packagePrice: 1399,
      savings: 500,
      rating: 4.8,
      reviews: 1892,
      duration: '4 Days, 3 Nights',
      guests: 'Up to 4 Guests',
      image: 'https://images.unsplash.com/photo-1731080647266-85cf1bc27162?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBob3RlbCUyMHJlc29ydHxlbnwxfHx8fDE3NTczMTY3MjV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      type: 'Luxury',
      badge: 'Exclusive',
      features: ['Royal Suite', 'Butler Service', 'Desert Safari', 'Premium Dining'],
      amenities: [Wifi, Car, Crown, Plane]
    }
  ];

  // Filter and sort packages
  const filteredPackages = useMemo(() => {
    let filtered = allPackages.filter(pkg => {
      // Search query filter
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const searchText = `${pkg.title} ${pkg.hotelName} ${pkg.location} ${pkg.type} ${pkg.features.join(' ')}`.toLowerCase();
        if (!searchText.includes(query)) return false;
      }

      // Location filter
      if (filters.location && filters.location !== 'All Locations') {
        if (!pkg.location.includes(filters.location.split(',')[0])) return false;
      }

      // Price range filter
      if (pkg.packagePrice < filters.priceRange[0] || pkg.packagePrice > filters.priceRange[1]) {
        return false;
      }

      // Duration filter
      if (filters.duration && filters.duration !== 'Any Duration') {
        const packageDays = parseInt(pkg.duration.split(' ')[0]);
        switch (filters.duration) {
          case '1-2 Days':
            if (packageDays > 2) return false;
            break;
          case '3-4 Days':
            if (packageDays < 3 || packageDays > 4) return false;
            break;
          case '5-7 Days':
            if (packageDays < 5 || packageDays > 7) return false;
            break;
          case '1-2 Weeks':
            if (packageDays < 8 || packageDays > 14) return false;
            break;
          case '2+ Weeks':
            if (packageDays <= 14) return false;
            break;
        }
      }

      // Rating filter
      if (filters.rating > 0 && pkg.rating < filters.rating) {
        return false;
      }

      // Package type filter
      if (filters.packageType && filters.packageType !== 'All Types') {
        if (pkg.type !== filters.packageType) return false;
      }

      return true;
    });

    // Sort packages
    switch (filters.sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.packagePrice - b.packagePrice);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.packagePrice - a.packagePrice);
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'savings':
        filtered.sort((a, b) => b.savings - a.savings);
        break;
      case 'newest':
        // For demo, we'll randomize since we don't have creation dates
        filtered.sort(() => Math.random() - 0.5);
        break;
      default: // popularity
        // Keep original order (most popular first)
        break;
    }

    return filtered;
  }, [filters, allPackages]);

  const handleToggleWishlist = (packageId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent package selection
    wishlistService.toggleWishlist(packageId);
  };

  const getBadgeColor = (badge: string) => {
    switch (badge) {
      case 'Most Popular': return 'bg-[#E11D48] text-white';
      case 'Premium': return 'bg-purple-600 text-white';
      case 'City Deal': return 'bg-blue-600 text-white';
      case 'New': return 'bg-orange-600 text-white';
      case 'Top Rated': return 'bg-yellow-600 text-white';
      case 'Exclusive': return 'bg-pink-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Romantic': return Heart;
      case 'Adventure': return Mountain;
      case 'Business': return Coffee;
      case 'Wellness': return Sparkles;
      case 'Luxury': return Crown;
      default: return Star;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-center"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Hotel Packages</h2>
        <p className="text-gray-600">Discover amazing deals and curated experiences</p>
      </motion.div>

      {/* Search and Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <PackageSearchFilter
          onFiltersChange={setFilters}
          packageCount={filteredPackages.length}
        />
      </motion.div>

      {/* Packages Grid */}
      <motion.div
        className="space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        {filteredPackages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No packages found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your filters to find more options</p>
            <motion.button
              onClick={() => setFilters({
                searchQuery: '',
                location: '',
                priceRange: [0, 2000],
                duration: '',
                rating: 0,
                packageType: '',
                sortBy: 'popularity'
              })}
              className="px-6 py-2 bg-[#E11D48] text-white rounded-lg hover:bg-[#BE185D] transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Clear Filters
            </motion.button>
          </motion.div>
        ) : (
          filteredPackages.map((pkg, index) => {
          const TypeIcon = getTypeIcon(pkg.type);
          
          return (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              whileHover={{ y: -4 }}
              className="group"
            >
              <Card 
                className="overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 border-0 bg-white"
                onClick={() => onPackageSelect?.(pkg.id)}
              >
                <div className="relative">
                  {/* Image */}
                  <div className="relative h-48 overflow-hidden">
                    <ImageWithFallback
                      src={pkg.image}
                      alt={pkg.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    
                    {/* Badge */}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.6 + index * 0.1, type: "spring" }}
                      className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold ${getBadgeColor(pkg.badge)}`}
                    >
                      {pkg.badge}
                    </motion.div>
                    
                    {/* Heart Icon */}
                    <motion.button
                      onClick={(e) => handleToggleWishlist(pkg.id, e)}
                      className={`absolute top-3 right-3 w-10 h-10 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-300 ${
                        wishlistedPackages.has(pkg.id)
                          ? 'bg-red-500 text-white scale-110'
                          : 'bg-white/90 text-gray-600 hover:bg-white hover:text-red-500'
                      }`}
                      whileHover={{ scale: wishlistedPackages.has(pkg.id) ? 1.2 : 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      initial={false}
                      animate={wishlistedPackages.has(pkg.id) ? { scale: [1, 1.3, 1.1] } : { scale: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Heart className={`w-5 h-5 transition-all duration-300 ${
                        wishlistedPackages.has(pkg.id) ? 'fill-current' : ''
                      }`} />
                    </motion.button>
                    
                    {/* Savings Badge */}
                    <div className="absolute bottom-3 right-3 bg-[#E11D48] text-white px-3 py-1 rounded-full text-sm font-semibold">
                      Save ${pkg.savings}
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="p-5">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <TypeIcon className="w-4 h-4 text-[#E11D48]" />
                          <span className="text-sm text-[#E11D48] font-medium">{pkg.type}</span>
                        </div>
                        <h3 className="font-bold text-gray-900 mb-1">{pkg.title}</h3>
                        <p className="text-sm text-gray-600 mb-1">{pkg.hotelName}</p>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <MapPin className="w-4 h-4" />
                          <span>{pkg.location}</span>
                        </div>
                      </div>
                      
                      {/* Rating */}
                      <div className="text-right">
                        <div className="flex items-center gap-1 mb-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-bold text-gray-900">{pkg.rating}</span>
                        </div>
                        <p className="text-xs text-gray-500">({pkg.reviews} reviews)</p>
                      </div>
                    </div>
                    
                    {/* Package Details */}
                    <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{pkg.duration}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{pkg.guests}</span>
                      </div>
                    </div>
                    
                    {/* Features */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {pkg.features.slice(0, 3).map((feature, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs bg-gray-100 text-gray-700">
                          {feature}
                        </Badge>
                      ))}
                      {pkg.features.length > 3 && (
                        <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-700">
                          +{pkg.features.length - 3} more
                        </Badge>
                      )}
                    </div>
                    
                    {/* Amenities */}
                    <div className="flex items-center gap-3 mb-4">
                      {pkg.amenities.map((Amenity, idx) => (
                        <div key={idx} className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Amenity className="w-4 h-4 text-gray-600" />
                        </div>
                      ))}
                    </div>
                    
                    {/* Pricing */}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-gray-900">${pkg.packagePrice}</span>
                          <span className="text-sm text-gray-500 line-through">${pkg.originalPrice}</span>
                        </div>
                        <p className="text-xs text-gray-500">per package</p>
                      </div>
                      
                      <motion.button
                        className="px-6 py-2 bg-[#E11D48] text-white rounded-lg hover:bg-[#BE185D] transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Book Now
                      </motion.button>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })
        )}
      </motion.div>

      {/* Load More */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="text-center pt-4"
      >
        <motion.button
          className="px-8 py-3 border border-[#E11D48] text-[#E11D48] rounded-lg hover:bg-[#E11D48] hover:text-white transition-all duration-300"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Load More Packages
        </motion.button>
      </motion.div>
    </div>
  );
}