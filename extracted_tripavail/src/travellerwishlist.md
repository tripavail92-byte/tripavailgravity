# Traveler Wishlist Screen Documentation

## 🎯 Screen Purpose & Overview

The **Traveler Wishlist Screen** (`WishlistScreen.tsx`) provides a premium, Airbnb-inspired interface for managing saved travel packages and destinations. This screen serves as a personalized collection hub where travelers can save, organize, and easily access their favorite travel experiences for future booking.

### **Core Functionality**
- **Saved Package Management** - View, organize, and remove wishlist items
- **Visual Package Display** - Large hero images with detailed information
- **Quick Booking Access** - Direct navigation to package booking
- **Empty State Motivation** - Encouraging discovery when wishlist is empty
- **Real-time Updates** - Dynamic wishlist synchronization

## Features
- ✨ **Premium Visual Design**: Large hero images (320px height) with sophisticated overlays
- 🎨 **Modern Animations**: Smooth entry animations, hover effects, and interactive feedback
- 🌙 **Dark Mode Support**: Complete dark/light mode with Rose theme integration
- 📱 **Mobile-First**: Optimized for mobile viewing with full-width design
- 💎 **Glass Morphism**: Backdrop blur effects and floating elements
- 🎯 **Airbnb-Style Cards**: Clean, spacious layout with premium shadows
- 🔥 **Rose Theme**: Consistent branding with Rose 600/400 primary colors
- 🚀 **Empty State**: Beautiful animated empty state with compelling CTA

## Code Implementation

```tsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Package, Star, MapPin, Calendar, Users, Trash2, ShoppingBag, Plus, Sparkles } from 'lucide-react';
import { Card } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { ImageWithFallback } from '../../../components/figma/ImageWithFallback';
import { wishlistService } from '../../../services/wishlistService';

interface WishlistScreenProps {
  onNavigate: (screen: string) => void;
  onPackageSelect?: (packageId: string) => void;
}

export default function WishlistScreen({ onNavigate, onPackageSelect }: WishlistScreenProps) {
  const [wishlistedPackages, setWishlistedPackages] = useState<string[]>([]);

  // Mock package data - in real app, this would come from API
  const packageData = {
    'paradise-beach-1': {
      id: 'paradise-beach-1',
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
      image: 'https://images.unsplash.com/photo-1580450997544-8846a39f3dfa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cm9waWNhbCUyMHJlc29ydCUyMGJlYWNofGVufDF8fHx8MTc1NzMzODQzMHww&ixlib=rb-4.1.0&q=80&w=1080',
      type: 'Romantic',
      badge: 'Most Popular'
    },
    'luxury-resort-2': {
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
      image: 'https://images.unsplash.com/photo-1689729738920-edea97589328?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb3VudGFpbiUyMGhvdGVsJTIwcmVzb3J0fGVufDF8fHx8MTc1NzMzNDczMHww&ixlib=rb-4.1.0&q=80&w=1080',
      type: 'Adventure',
      badge: 'Premium'
    },
    'romantic-suite-5': {
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
      image: 'https://images.unsplash.com/photo-1637515128249-df66173ee9b4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyb21hbnRpYyUyMGhvdGVsJTIwc3VpdGV8ZW58MXx8fHwxNTczMzg0NDR8MA&ixlib=rb-4.1.0&q=80&w=1080',
      type: 'Romantic',
      badge: 'Top Rated'
    }
  };

  useEffect(() => {
    const updateWishlist = () => {
      const wishlist = wishlistService.getWishlist();
      setWishlistedPackages(wishlist);
    };

    // Initial load
    updateWishlist();

    // Subscribe to changes
    const unsubscribe = wishlistService.subscribe(updateWishlist);

    return unsubscribe;
  }, []);

  const handleRemoveFromWishlist = (packageId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    wishlistService.removeFromWishlist(packageId);
  };

  const handlePackageClick = (packageId: string) => {
    if (onPackageSelect) {
      onPackageSelect(packageId);
    } else {
      onNavigate('package-details');
    }
  };

  const wishlistedPackageDetails = wishlistedPackages
    .map(id => packageData[id as keyof typeof packageData])
    .filter(Boolean);

  return (
    <div className="-mx-4 -mt-6 min-h-screen">
      {wishlistedPackageDetails.length > 0 ? (
        <div className="space-y-0">
          {/* Minimal Header for Content State */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-900 px-6 py-4 border-b border-gray-100 dark:border-gray-800"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Wishlist</h1>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {wishlistedPackages.length} saved destination{wishlistedPackages.length !== 1 ? 's' : ''}
                </p>
              </div>
              <motion.div
                className="w-12 h-12 bg-gradient-to-br from-primary to-pink-500 rounded-2xl flex items-center justify-center shadow-lg"
                whileHover={{ scale: 1.05, rotate: 5 }}
              >
                <Heart className="w-6 h-6 text-white fill-current" />
              </motion.div>
            </div>
          </motion.div>

          {/* Wishlist Cards */}
          <div className="px-6 py-6 space-y-6 bg-gray-50/50 dark:bg-gray-900/50">
            <AnimatePresence>
              {wishlistedPackageDetails.map((pkg, index) => (
                <motion.div
                  key={pkg.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="group"
                >
                  <Card 
                    className="overflow-hidden cursor-pointer border-0 bg-white dark:bg-gray-900 shadow-lg hover:shadow-2xl transition-all duration-500 rounded-3xl"
                    onClick={() => handlePackageClick(pkg.id)}
                  >
                    {/* Hero Image Section - Larger & More Impactful */}
                    <div className="relative h-80 overflow-hidden">
                      <ImageWithFallback
                        src={pkg.image}
                        alt={pkg.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      
                      {/* Sophisticated Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/5 to-transparent" />
                      
                      {/* Top Bar with Badges & Actions */}
                      <div className="absolute top-6 left-6 right-6 flex justify-between items-start">
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 }}
                        >
                          <Badge className="bg-primary text-white border-0 px-4 py-2 rounded-full shadow-lg backdrop-blur-sm font-medium">
                            {pkg.badge}
                          </Badge>
                        </motion.div>
                        
                        {/* Floating Heart Remove Button */}
                        <motion.button
                          onClick={(e) => handleRemoveFromWishlist(pkg.id, e)}
                          className="w-12 h-12 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-full flex items-center justify-center shadow-xl text-primary hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-300"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.4 }}
                        >
                          <Heart className="w-6 h-6 fill-current" />
                        </motion.button>
                      </div>

                      {/* Bottom Overlay Info */}
                      <div className="absolute bottom-6 left-6 right-6">
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5 }}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            {/* Rating Badge */}
                            <div className="flex items-center gap-1 bg-black/40 backdrop-blur-sm rounded-full px-3 py-2">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-white font-semibold text-sm">{pkg.rating}</span>
                              <span className="text-white/80 text-sm">({pkg.reviews})</span>
                            </div>
                            
                            {/* Type Badge */}
                            <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-2">
                              <span className="text-white font-medium text-sm">{pkg.type}</span>
                            </div>
                          </div>
                        </motion.div>
                      </div>
                    </div>

                    {/* Content Section - Clean & Spacious */}
                    <div className="p-8">
                      {/* Location */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-3"
                      >
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm font-medium">{pkg.location}</span>
                      </motion.div>

                      {/* Title & Hotel */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                        className="mb-4"
                      >
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 leading-tight">
                          {pkg.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 text-lg">{pkg.hotelName}</p>
                      </motion.div>

                      {/* Trip Details */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        className="flex items-center gap-8 mb-6 text-gray-600 dark:text-gray-400"
                      >
                        <div className="flex items-center gap-2">
                          <Calendar className="w-5 h-5" />
                          <span className="font-medium">{pkg.duration}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-5 h-5" />
                          <span className="font-medium">{pkg.guests}</span>
                        </div>
                      </motion.div>

                      {/* Pricing & CTA */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.9 }}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-baseline gap-3">
                          <span className="text-3xl font-bold text-gray-900 dark:text-white">
                            ${pkg.packagePrice}
                          </span>
                          <span className="text-lg text-gray-500 line-through">
                            ${pkg.originalPrice}
                          </span>
                          <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-0 px-3 py-1">
                            Save ${pkg.savings}
                          </Badge>
                        </div>
                        
                        <motion.button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePackageClick(pkg.id);
                          }}
                          className="px-8 py-4 bg-primary text-white rounded-2xl hover:bg-primary/90 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl text-lg"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          Book Now
                        </motion.button>
                      </motion.div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Clear All Section */}
            {wishlistedPackages.length > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-center py-8"
              >
                <Button
                  variant="outline"
                  onClick={() => {
                    if (confirm('Are you sure you want to clear your entire wishlist?')) {
                      wishlistService.clearWishlist();
                    }
                  }}
                  className="border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl px-8 py-3 font-medium"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All Saved Items
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      ) : (
        // Premium Empty State
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-rose-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-md"
          >
            {/* Floating Elements Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <motion.div
                className="absolute top-20 left-10 w-2 h-2 bg-primary/20 rounded-full"
                animate={{ y: [0, -20, 0], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              <motion.div
                className="absolute top-40 right-16 w-1 h-1 bg-pink-400/30 rounded-full"
                animate={{ y: [0, -15, 0], opacity: [0.3, 0.8, 0.3] }}
                transition={{ duration: 4, repeat: Infinity, delay: 1 }}
              />
              <motion.div
                className="absolute bottom-32 left-20 w-1.5 h-1.5 bg-primary/15 rounded-full"
                animate={{ y: [0, -25, 0], opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 5, repeat: Infinity, delay: 2 }}
              />
            </div>

            {/* Main Illustration */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="relative mb-8"
            >
              {/* Gradient Circle Background */}
              <div className="w-40 h-40 bg-gradient-to-br from-primary/10 via-primary/5 to-pink-500/10 rounded-full mx-auto flex items-center justify-center relative overflow-hidden">
                {/* Animated Rings */}
                <motion.div
                  className="absolute inset-0 border-2 border-primary/20 rounded-full"
                  animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.2, 0.5] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
                <motion.div
                  className="absolute inset-2 border border-primary/15 rounded-full"
                  animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.1, 0.3] }}
                  transition={{ duration: 4, repeat: Infinity, delay: 1 }}
                />
                
                {/* Heart Icon */}
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="relative z-10"
                >
                  <Heart className="w-20 h-20 text-primary/70" />
                </motion.div>

                {/* Sparkles */}
                <motion.div
                  className="absolute top-6 right-8 text-primary/40"
                  animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                  transition={{ duration: 8, repeat: Infinity }}
                >
                  <Sparkles className="w-6 h-6" />
                </motion.div>
                <motion.div
                  className="absolute bottom-8 left-6 text-pink-400/40"
                  animate={{ rotate: -360, scale: [1, 1.3, 1] }}
                  transition={{ duration: 10, repeat: Infinity, delay: 2 }}
                >
                  <Sparkles className="w-4 h-4" />
                </motion.div>
              </div>
            </motion.div>
            
            {/* Text Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="mb-8"
            >
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Your wishlist awaits
              </h1>
              <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                Save your favorite destinations and experiences. Heart the places that inspire you and create your perfect trip collection.
              </p>
            </motion.div>
            
            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              <motion.button
                onClick={() => onNavigate('home')}
                className="inline-flex items-center gap-3 bg-gradient-to-r from-primary to-pink-500 hover:from-primary/90 hover:to-pink-500/90 text-white px-10 py-4 rounded-2xl font-semibold shadow-2xl transition-all duration-300 text-lg"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <Plus className="w-6 h-6" />
                Start Exploring
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  ✨
                </motion.div>
              </motion.button>
            </motion.div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
```

## Key Design Elements

### 🎨 **Visual Hierarchy**
1. **Hero Images** (320px) - Maximum visual impact
2. **Floating Badges** - Key information overlays
3. **Large Typography** - Clear package identification
4. **Location & Details** - Supporting information
5. **Prominent Pricing** - 3xl font size for price
6. **Premium CTA** - "Reserve Now" action button

### 🌟 **Animation Details**
- **Entry Animations**: Staggered card reveals with 0.1s delays
- **Hover Effects**: Scale transforms and shadow changes
- **Interactive Feedback**: Bounce and scale on interactions
- **Floating Elements**: Continuous subtle animations in empty state
- **Smooth Transitions**: 500-700ms duration for premium feel

### 🎯 **Responsive Design**
- **Full-Width Layout**: Uses `-mx-4 -mt-6` to break container padding
- **Mobile-First**: Optimized for mobile with touch-friendly buttons
- **Large Touch Targets**: Easy-to-tap interactive areas
- **Scalable Typography**: Responsive text sizing

### 🌙 **Dark Mode Integration**
- **Rose Theme Colors**: Primary (Rose 600) / Dark (Rose 400)
- **Adaptive Backgrounds**: Seamless light/dark transitions
- **Proper Contrast**: Excellent readability in both modes
- **Consistent Branding**: Theme colors work in both modes

## Dependencies Required
```json
{
  "motion/react": "^1.0.0",
  "lucide-react": "^0.263.1",
  "@radix-ui/react-*": "Latest versions for UI components"
}
```

## Usage
This component integrates seamlessly with the TripAvail app's navigation system and supports both filled and empty states with smooth transitions between them.