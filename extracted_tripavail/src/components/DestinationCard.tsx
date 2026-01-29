import { motion } from 'motion/react';
import { Heart, Star, MapPin } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface DestinationCardProps {
  title: string;
  location: string;
  image: string;
  rating: number;
  price: string;
  isLiked?: boolean;
  onLike?: () => void;
  size?: 'small' | 'large';
}

export function DestinationCard({ 
  title, 
  location, 
  image, 
  rating, 
  price, 
  isLiked = false, 
  onLike,
  size = 'large'
}: DestinationCardProps) {
  const isSmall = size === 'small';
  
  return (
    <motion.div
      className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden ${
        isSmall ? 'w-48' : 'w-full'
      }`}
      whileHover={{ scale: 1.02, shadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Image */}
      <div className={`relative ${isSmall ? 'h-32' : 'h-48'} overflow-hidden`}>
        <ImageWithFallback
          src={image}
          alt={title}
          className="size-full object-cover"
        />
        
        {/* Like Button */}
        <motion.button
          className="absolute top-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-sm"
          onClick={onLike}
          whileTap={{ scale: 0.9 }}
        >
          <Heart 
            className={`w-4 h-4 transition-colors ${
              isLiked ? 'text-red-500 fill-red-500' : 'text-gray-600'
            }`} 
          />
        </motion.button>

        {/* Rating Badge */}
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center gap-1">
          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
          <span className="text-xs font-medium text-gray-900">{rating}</span>
        </div>
      </div>

      {/* Content */}
      <div className={`p-${isSmall ? '3' : '4'}`}>
        <h3 className={`font-semibold text-gray-900 mb-1 ${isSmall ? 'text-sm' : 'text-base'}`}>
          {title}
        </h3>
        
        <div className="flex items-center gap-1 mb-3">
          <MapPin className="w-3 h-3 text-gray-400" />
          <span className={`text-gray-500 ${isSmall ? 'text-xs' : 'text-sm'}`}>
            {location}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <span className={`font-bold text-gray-900 ${isSmall ? 'text-sm' : 'text-base'}`}>
              {price}
            </span>
            <span className={`text-gray-500 ${isSmall ? 'text-xs' : 'text-sm'}`}>
              /person
            </span>
          </div>
          
          <motion.button
            className={`px-${isSmall ? '3' : '4'} py-2 rounded-lg text-white text-${isSmall ? 'xs' : 'sm'} font-medium`}
            style={{ backgroundColor: '#5FAD43' }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Book Now
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}