// Tours Feature Component
import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import type { Tour } from '../../lib/types';
import { dataService } from '../../services/dataService';
import { DestinationCard } from '../../components/DestinationCard';

interface ToursFeatureProps {
  onTourSelect?: (tour: Tour) => void;
}

export function ToursFeature({ onTourSelect }: ToursFeatureProps) {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Load tours
  useEffect(() => {
    loadTours();
  }, []);

  const loadTours = async () => {
    try {
      setLoading(true);
      const response = await dataService.getAllTours(page);
      
      if (page === 1) {
        setTours(response.data);
      } else {
        setTours(prev => [...prev, ...response.data]);
      }
      
      setHasMore(response.pagination.hasMore);
    } catch (err) {
      setError('Failed to load tours');
      console.error('Error loading tours:', err);
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
      loadTours();
    }
  }, [page]);

  if (loading && tours.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error && tours.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => {
            setError(null);
            setPage(1);
            loadTours();
          }}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tours List */}
      <div className="space-y-4">
        {tours.map((tour, index) => (
          <motion.div
            key={tour.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => onTourSelect?.(tour)}
          >
            <DestinationCard {...tour} />
          </motion.div>
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="text-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Loading...' : 'Load More Tours'}
          </button>
        </div>
      )}

      {/* No More Results */}
      {!hasMore && tours.length > 0 && (
        <div className="text-center py-6">
          <p className="text-gray-500">You've seen all our tours!</p>
        </div>
      )}
    </div>
  );
}