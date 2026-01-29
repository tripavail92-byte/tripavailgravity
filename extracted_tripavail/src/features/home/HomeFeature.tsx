// Home Feature Component
import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, Filter } from 'lucide-react';
import type { Hotel, Tour } from '../../lib/types';
import { dataService } from '../../services/dataService';
import { useSearch } from '../../hooks/useSearch';
import { PremiumImageSlider } from '../../components/PremiumImageSlider';
import { DestinationCard } from '../../components/DestinationCard';

interface HomeFeatureProps {
  onNavigateToHotels: () => void;
  onNavigateToTours: () => void;
}

export function HomeFeature({ onNavigateToHotels, onNavigateToTours }: HomeFeatureProps) {
  const [featuredHotels, setFeaturedHotels] = useState<Hotel[]>([]);
  const [featuredTours, setFeaturedTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { searchQuery, setSearchQuery } = useSearch();

  // Load featured content
  useEffect(() => {
    loadFeaturedContent();
  }, []);

  const loadFeaturedContent = async () => {
    try {
      setLoading(true);
      
      const [hotelsResponse, toursResponse] = await Promise.all([
        dataService.getFeaturedHotels(),
        dataService.getFeaturedTours(),
      ]);

      if (hotelsResponse.success) {
        setFeaturedHotels(hotelsResponse.data);
      }

      if (toursResponse.success) {
        setFeaturedTours(toursResponse.data);
      }
    } catch (err) {
      setError('Failed to load featured content');
      console.error('Error loading featured content:', err);
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={loadFeaturedContent}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search hotels, tours, destinations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-12 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          <button className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-lg hover:bg-gray-200 transition-colors">
            <Filter className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </motion.div>

      {/* Premium Image Slider */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <PremiumImageSlider />
      </motion.div>

      {/* Featured Hotels Section */}
      {!loading && featuredHotels.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg text-gray-900">Featured Hotels</h2>
            <button 
              onClick={onNavigateToHotels}
              className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
            >
              See all
            </button>
          </div>
          
          <div className="flex gap-4 overflow-x-auto pb-2">
            {featuredHotels.map((hotel, index) => (
              <motion.div
                key={hotel.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
              >
                <DestinationCard 
                  {...hotel} 
                  size="small"
                />
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Featured Tours Section */}
      {!loading && featuredTours.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg text-gray-900">Featured Trips</h2>
            <button 
              onClick={onNavigateToTours}
              className="text-sm text-green-600 hover:text-green-700 transition-colors"
            >
              See all
            </button>
          </div>
          
          <div className="space-y-4">
            {featuredTours.map((tour, index) => (
              <motion.div
                key={tour.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
              >
                <DestinationCard {...tour} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="space-y-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        </div>
      )}
    </div>
  );
}