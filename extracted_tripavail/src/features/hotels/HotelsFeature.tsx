// Hotels Feature Component
import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import type { Hotel } from '../../lib/types';
import { dataService } from '../../services/dataService';
import { DestinationCard } from '../../components/DestinationCard';

interface HotelsFeatureProps {
  onHotelSelect?: (hotel: Hotel) => void;
}

export function HotelsFeature({ onHotelSelect }: HotelsFeatureProps) {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Load hotels
  useEffect(() => {
    loadHotels();
  }, []);

  const loadHotels = async () => {
    try {
      setLoading(true);
      const response = await dataService.getAllHotels(page);
      
      if (page === 1) {
        setHotels(response.data);
      } else {
        setHotels(prev => [...prev, ...response.data]);
      }
      
      setHasMore(response.pagination.hasMore);
    } catch (err) {
      setError('Failed to load hotels');
      console.error('Error loading hotels:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      setPage(prev => prev + 1);
    }
  };

  // Load more when page changes
  useEffect(() => {
    if (page > 1) {
      loadHotels();
    }
  }, [page]);

  if (loading && hotels.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && hotels.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => {
            setError(null);
            setPage(1);
            loadHotels();
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hotels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {hotels.map((hotel, index) => (
          <motion.div
            key={hotel.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => onHotelSelect?.(hotel)}
          >
            <DestinationCard {...hotel} />
          </motion.div>
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="text-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Loading...' : 'Load More Hotels'}
          </button>
        </div>
      )}

      {/* No More Results */}
      {!hasMore && hotels.length > 0 && (
        <div className="text-center py-6">
          <p className="text-gray-500">You've seen all our hotels!</p>
        </div>
      )}
    </div>
  );
}