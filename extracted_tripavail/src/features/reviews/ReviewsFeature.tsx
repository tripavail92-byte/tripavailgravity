import { motion } from 'motion/react';
import { Star, User, ThumbsUp, MessageCircle } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';

export function ReviewsFeature() {
  const mockReviews = [
    {
      id: 1,
      guestName: 'Sarah Johnson',
      rating: 5,
      comment: 'Absolutely wonderful stay! The room was clean, the staff was friendly, and the location was perfect. Would definitely stay again.',
      date: '2024-12-10',
      room: 'Deluxe Ocean View',
      helpful: 12
    },
    {
      id: 2,
      guestName: 'Michael Chen',
      rating: 4,
      comment: 'Great hotel with excellent amenities. The breakfast was amazing and the pool area was well-maintained. Only minor issue was the WiFi speed.',
      date: '2024-12-08',
      room: 'Executive Suite',
      helpful: 8
    },
    {
      id: 3,
      guestName: 'Emma Wilson',
      rating: 5,
      comment: 'Perfect for a weekend getaway! Beautiful views, comfortable beds, and top-notch service. The concierge was incredibly helpful.',
      date: '2024-12-05',
      room: 'Standard Room',
      helpful: 15
    }
  ];

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 4) return 'text-yellow-600';
    if (rating >= 3) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl text-gray-900">Reviews & Ratings</h1>
            <p className="text-gray-600">See what guests are saying about your property</p>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-[#5FAD43] text-white rounded-lg hover:bg-green-600 transition-colors">
              Respond to Reviews
            </button>
            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              Export Reviews
            </button>
          </div>
        </div>
      </motion.div>

      {/* Rating Overview */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="p-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-2">
              {renderStars(5)}
            </div>
            <p className="text-2xl font-bold text-gray-900">4.8</p>
            <p className="text-sm text-gray-600">Overall Rating</p>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="text-center">
            <MessageCircle className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">47</p>
            <p className="text-sm text-gray-600">Total Reviews</p>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="text-center">
            <ThumbsUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">92%</p>
            <p className="text-sm text-gray-600">Positive Reviews</p>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="text-center">
            <Star className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">3</p>
            <p className="text-sm text-gray-600">New This Week</p>
          </div>
        </Card>
      </motion.div>

      {/* Rating Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Rating Breakdown</h3>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((stars) => (
              <div key={stars} className="flex items-center gap-3">
                <span className="w-8 text-sm text-gray-600">{stars} ★</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-yellow-400 h-2 rounded-full"
                    style={{ width: `${stars === 5 ? 68 : stars === 4 ? 24 : stars === 3 ? 6 : stars === 2 ? 2 : 0}%` }}
                  ></div>
                </div>
                <span className="text-sm text-gray-600 w-12 text-right">
                  {stars === 5 ? '32' : stars === 4 ? '11' : stars === 3 ? '3' : stars === 2 ? '1' : '0'}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Recent Reviews */}
      <motion.div
        className="space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h2 className="text-lg font-semibold text-gray-900">Recent Reviews</h2>
        
        {mockReviews.map((review, index) => (
          <motion.div
            key={review.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + index * 0.1 }}
          >
            <Card className="p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-gray-600" />
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{review.guestName}</h3>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex gap-1">
                        {renderStars(review.rating)}
                      </div>
                      <span className={`font-semibold ${getRatingColor(review.rating)}`}>
                        {review.rating}.0
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{review.room} • {review.date}</p>
                  </div>
                </div>
                
                <Badge variant="outline">Verified Stay</Badge>
              </div>
              
              <p className="text-gray-700 mb-4 leading-relaxed">{review.comment}</p>
              
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <ThumbsUp className="w-4 h-4" />
                  <span>{review.helpful} found this helpful</span>
                </div>
                
                <div className="flex gap-2">
                  <button className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 transition-colors">
                    Mark Helpful
                  </button>
                  <button className="px-3 py-1 text-sm bg-[#5FAD43] text-white rounded hover:bg-green-600 transition-colors">
                    Respond
                  </button>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}