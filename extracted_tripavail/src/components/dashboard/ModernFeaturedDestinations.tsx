import { motion } from 'motion/react';
import { Star, MapPin, Heart } from 'lucide-react';
import { Card } from '../ui/card';
import { ImageWithFallback } from '../figma/ImageWithFallback';

interface FeaturedDestinationsProps {
  onNavigate: (screen: string) => void;
}

export function ModernFeaturedDestinations({ onNavigate }: FeaturedDestinationsProps) {
  const featuredDestinations = [
    {
      id: 'bali',
      name: 'Bali, Indonesia',
      price: 'From $89/night',
      image: 'https://images.unsplash.com/photo-1698264855824-95385e9d552a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxCYWxpJTIwSW5kb25lc2lhJTIwdGVtcGxlJTIwcmljZSUyMHRlcnJhY2VzfGVufDF8fHx8MTc1ODAxNTQ2Mnww&ixlib=rb-4.1.0&q=80&w=1080',
      rating: 4.9,
      description: 'Tropical paradise with ancient temples',
      location: 'Southeast Asia',
      reviews: 1247,
      category: 'Beach & Culture',
      features: ['🏖️ Beaches', '🏛️ Temples', '🌾 Rice Terraces'],
      gradient: 'from-orange-400 to-pink-400'
    },
    {
      id: 'paris',
      name: 'Paris, France',
      price: 'From $145/night',
      image: 'https://images.unsplash.com/photo-1664931760647-d8dbccc5f4ee?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxQYXJpcyUyMEZyYW5jZSUyMEVpZmZlbCUyMFRvd2VyJTIwY2l0eXxlbnwxfHx8fDE3NTgwMTU0NjV8MA&ixlib=rb-4.1.0&q=80&w=1080',
      rating: 4.8,
      description: 'City of lights and eternal romance',
      location: 'Western Europe',
      reviews: 2156,
      category: 'City & Culture',
      features: ['🗼 Landmarks', '🎨 Museums', '☕ Cafés'],
      gradient: 'from-blue-400 to-purple-400'
    },
    {
      id: 'tokyo',
      name: 'Tokyo, Japan',
      price: 'From $125/night',
      image: 'https://images.unsplash.com/photo-1580920659896-7e8663eb956a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxUb2t5byUyMEphcGFuJTIwY2l0eSUyMHNreWxpbmUlMjBuZW9ufGVufDF8fHx8MTc1ODAxNTQ2OHww&ixlib=rb-4.1.0&q=80&w=1080',
      rating: 4.7,
      description: 'Where tradition meets future',
      location: 'East Asia',
      reviews: 1876,
      category: 'Urban & Tech',
      features: ['🏙️ Skyline', '🍜 Food', '⛩️ Temples'],
      gradient: 'from-pink-400 to-red-400'
    },
    {
      id: 'santorini',
      name: 'Santorini, Greece',
      price: 'From $195/night',
      image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxTYW50b3JpbmklMjBHcmVlY2UlMjB3aGl0ZSUyMGJ1aWxkaW5nc3xlbnwxfHx8fDE3NTgwMTU0NzF8MA&ixlib=rb-4.1.0&q=80&w=1080',
      rating: 4.9,
      description: 'Stunning sunsets and white architecture',
      location: 'Mediterranean',
      reviews: 987,
      category: 'Island Paradise',
      features: ['🌅 Sunsets', '🏛️ Architecture', '🍷 Wine'],
      gradient: 'from-cyan-400 to-blue-400'
    }
  ];

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.5 }}
    >
      {/* Section Header */}
      <motion.div
        className="flex items-center justify-between"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            ✨ Trending Destinations
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Popular among travelers like you
          </p>
        </div>
        <motion.button
          className="text-sm font-medium text-[#ff5a5f] hover:text-[#e1434a] transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onNavigate('explore')}
        >
          View All →
        </motion.button>
      </motion.div>

      {/* Large Featured Cards */}
      <div className="space-y-4">
        {featuredDestinations.slice(0, 2).map((destination, index) => (
          <motion.div
            key={destination.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 + index * 0.1 }}
            whileHover={{ 
              scale: 1.01,
              transition: { duration: 0.2 }
            }}
            whileTap={{ scale: 0.99 }}
          >
            <Card 
              className="overflow-hidden cursor-pointer group hover:shadow-xl transition-all duration-300 border-0 bg-white dark:bg-gray-800"
              onClick={() => onNavigate('hotels')}
            >
              <div className="relative h-48 overflow-hidden">
                {/* Background Image */}
                <ImageWithFallback
                  src={destination.image}
                  alt={destination.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                
                {/* Gradient Overlay */}
                <div className={`absolute inset-0 bg-gradient-to-t ${destination.gradient} opacity-20`} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                
                {/* Heart Icon */}
                <motion.button
                  className="absolute top-3 right-3 p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full shadow-md"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    // Handle wishlist toggle
                  }}
                >
                  <Heart className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                </motion.button>

                {/* Category Badge */}
                <motion.div
                  className="absolute top-3 left-3 px-3 py-1 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.8 + index * 0.1 }}
                >
                  <span className="text-xs font-medium text-gray-800 dark:text-gray-200">
                    {destination.category}
                  </span>
                </motion.div>

                {/* Bottom Content */}
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.9 + index * 0.1 }}
                  >
                    <div className="flex items-center gap-1 mb-2">
                      <MapPin className="w-3 h-3" />
                      <span className="text-xs opacity-90">{destination.location}</span>
                    </div>
                    <h3 className="text-lg font-bold mb-1">{destination.name}</h3>
                    <p className="text-sm opacity-90 mb-2">{destination.description}</p>
                    
                    {/* Features */}
                    <div className="flex gap-2 mb-3">
                      {destination.features.map((feature, idx) => (
                        <span key={idx} className="text-xs bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full">
                          {feature}
                        </span>
                      ))}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">{destination.rating}</span>
                        </div>
                        <span className="text-xs opacity-75">({destination.reviews} reviews)</span>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">{destination.price}</p>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Compact Cards Grid */}
      <motion.div
        className="grid grid-cols-2 gap-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1.0 }}
      >
        {featuredDestinations.slice(2).map((destination, index) => (
          <motion.div
            key={destination.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 1.1 + index * 0.1 }}
            whileHover={{ 
              scale: 1.02,
              transition: { duration: 0.2 }
            }}
            whileTap={{ scale: 0.98 }}
          >
            <Card 
              className="overflow-hidden cursor-pointer group hover:shadow-lg transition-all duration-300 border-0"
              onClick={() => onNavigate('hotels')}
            >
              <div className="relative h-32 overflow-hidden">
                <ImageWithFallback
                  src={destination.image}
                  alt={destination.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${destination.gradient} opacity-20`} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                
                {/* Heart Icon */}
                <motion.button
                  className="absolute top-2 right-2 p-1.5 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full shadow-sm"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    // Handle wishlist toggle
                  }}
                >
                  <Heart className="w-3 h-3 text-gray-700 dark:text-gray-300" />
                </motion.button>

                <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                  <div className="flex items-center gap-1 mb-1">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs font-medium">{destination.rating}</span>
                  </div>
                  <h4 className="text-sm font-bold mb-1">{destination.name}</h4>
                  <p className="text-xs font-medium">{destination.price}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Explore More Button */}
      <motion.div
        className="text-center pt-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1.3 }}
      >
        <motion.button
          className="px-6 py-3 bg-gradient-to-r from-[#ff5a5f] to-[#e1434a] text-white font-medium rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
          whileHover={{ 
            scale: 1.05,
            boxShadow: "0 10px 25px rgba(255, 90, 95, 0.3)"
          }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate('explore')}
        >
          🌍 Explore More Destinations
        </motion.button>
      </motion.div>
    </motion.div>
  );
}