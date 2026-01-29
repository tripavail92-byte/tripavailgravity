import { motion } from 'motion/react';
import { Star } from 'lucide-react';
import { Card } from '../../../components/ui/card';
import type { UserRole } from '../../../lib/types';

interface ReviewsScreenProps {
  role: UserRole;
  onNavigate: (screen: string) => void;
}

export default function ReviewsScreen({ role, onNavigate }: ReviewsScreenProps) {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Reviews & Ratings</h2>
        <Card className="p-6 text-center">
          <Star className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Reviews Feature</h3>
          <p className="text-gray-600">
            {role === 'traveler' 
              ? 'Your travel reviews and ratings will appear here'
              : 'Manage customer reviews and ratings for your business'
            }
          </p>
        </Card>
      </motion.div>
    </div>
  );
}