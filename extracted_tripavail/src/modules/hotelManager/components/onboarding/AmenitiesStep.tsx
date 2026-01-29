import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Check, Search, Sparkles, TrendingUp } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Card } from '../../../../components/ui/card';
import { AmenityIcon } from '../AmenityIcon';

interface AmenitiesStepProps {
  data: any;
  onComplete: (data: any) => void;
}

interface AmenityCategory {
  id: string;
  title: string;
  icon: string;
  amenities: Amenity[];
}

interface Amenity {
  id: string;
  name: string;
  icon: string;
  popular?: boolean;
}

const AMENITY_CATEGORIES: AmenityCategory[] = [
  {
    id: 'property',
    title: '🏨 Property Amenities',
    icon: 'hotel',
    amenities: [
      { id: 'wifi', name: 'Free Wi-Fi', icon: 'wifi', popular: true },
      { id: 'pool', name: 'Swimming Pool', icon: 'waves', popular: true },
      { id: 'gym', name: 'Gym / Fitness Center', icon: 'dumbbell' },
      { id: 'spa', name: 'Spa & Wellness Center', icon: 'flower-2' },
      { id: 'restaurant', name: 'Restaurant / Café', icon: 'utensils' },
      { id: 'bar', name: 'Bar / Lounge', icon: 'wine' },
      { id: 'parking', name: 'Parking (Free / Paid)', icon: 'car', popular: true },
      { id: 'front-desk', name: '24-Hour Front Desk', icon: 'clock' },
      { id: 'shuttle', name: 'Airport Shuttle', icon: 'plane' },
      { id: 'concierge', name: 'Concierge Service', icon: 'bell' },
      { id: 'laundry', name: 'Laundry Service', icon: 'shirt' },
      { id: 'business', name: 'Business Center', icon: 'briefcase' },
      { id: 'meeting', name: 'Conference / Meeting Rooms', icon: 'presentation' },
    ]
  },
  {
    id: 'room',
    title: '🛏️ Room Amenities',
    icon: 'bed',
    amenities: [
      { id: 'ac', name: 'Air Conditioning / Heating', icon: 'air-vent', popular: true },
      { id: 'tv', name: 'Flat-screen TV', icon: 'tv', popular: true },
      { id: 'minibar', name: 'Mini-Bar / Fridge', icon: 'refrigerator' },
      { id: 'safe', name: 'Safe / Locker', icon: 'lock' },
      { id: 'coffee', name: 'Tea / Coffee Maker', icon: 'coffee' },
      { id: 'hairdryer', name: 'Hair Dryer', icon: 'wind' },
      { id: 'iron', name: 'Iron & Ironing Board', icon: 'shirt' },
      { id: 'desk', name: 'Work Desk', icon: 'laptop' },
      { id: 'balcony', name: 'Balcony / Terrace', icon: 'palmtree' },
      { id: 'room-service', name: 'Room Service', icon: 'bell' },
      { id: 'housekeeping', name: 'Daily Housekeeping', icon: 'sparkles' },
    ]
  },
  {
    id: 'family',
    title: '👨‍👩‍👧 Family & Accessibility',
    icon: 'users',
    amenities: [
      { id: 'family-rooms', name: 'Family Rooms / Suites', icon: 'home' },
      { id: 'connecting', name: 'Connecting Rooms', icon: 'move-horizontal' },
      { id: 'baby-cot', name: 'Baby Cot / Crib (On Request)', icon: 'baby' },
      { id: 'play-area', name: "Children's Play Area", icon: 'gamepad-2' },
      { id: 'kids-club', name: "Kids' Club", icon: 'heart' },
      { id: 'wheelchair', name: 'Wheelchair Accessible', icon: 'accessibility' },
      { id: 'elevator', name: 'Elevator / Lift', icon: 'move-vertical' },
    ]
  },
  {
    id: 'activities',
    title: '🎯 Activities & Experiences',
    icon: 'activity',
    amenities: [
      { id: 'tours', name: 'Guided Tours', icon: 'map' },
      { id: 'entertainment', name: 'Live Entertainment', icon: 'music' },
      { id: 'sports', name: 'Outdoor Sports', icon: 'trophy' },
      { id: 'adventure', name: 'Adventure Activities', icon: 'mountain' },
      { id: 'water-sports', name: 'Water Sports', icon: 'waves' },
      { id: 'ski', name: 'Ski Equipment & Passes', icon: 'mountain-snow' },
      { id: 'golf', name: 'Golf Course Access', icon: 'golf' },
    ]
  },
  {
    id: 'food',
    title: '🍽️ Food & Beverage',
    icon: 'utensils',
    amenities: [
      { id: 'breakfast', name: 'Complimentary Breakfast', icon: 'coffee', popular: true },
      { id: 'buffet', name: 'Buffet Dinner / Lunch', icon: 'chef-hat' },
      { id: 'room-dining', name: 'In-Room Dining', icon: 'utensils' },
      { id: 'diet-menus', name: 'Special Diet Menus', icon: 'leaf' },
      { id: 'bbq', name: 'BBQ Facilities', icon: 'flame' },
      { id: 'coffee-shop', name: 'Coffee Shop', icon: 'coffee' },
    ]
  },
  {
    id: 'wellness',
    title: '💚 Wellness & Relaxation',
    icon: 'heart',
    amenities: [
      { id: 'sauna', name: 'Sauna', icon: 'thermometer' },
      { id: 'jacuzzi', name: 'Jacuzzi / Hot Tub', icon: 'waves' },
      { id: 'yoga', name: 'Yoga Classes', icon: 'user' },
      { id: 'massage', name: 'Massage Services', icon: 'hand' },
      { id: 'beauty', name: 'Beauty Salon', icon: 'scissors' },
    ]
  },
];

export function AmenitiesStep({ data, onComplete }: AmenitiesStepProps) {
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(
    data.selectedAmenities || []
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const toggleAmenity = (amenityId: string) => {
    setSelectedAmenities(prev => 
      prev.includes(amenityId)
        ? prev.filter(id => id !== amenityId)
        : [...prev, amenityId]
    );
  };

  const handleContinue = () => {
    onComplete({ selectedAmenities });
  };

  const selectedCount = selectedAmenities.length;
  const popularSelected = selectedAmenities.filter(id => 
    AMENITY_CATEGORIES.flatMap(cat => cat.amenities)
      .find(amenity => amenity.id === id)?.popular
  ).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      {/* Header */}
      <div className="text-center space-y-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="w-16 h-16 mx-auto bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center"
        >
          <AmenityIcon name="star" className="w-8 h-8 text-white" />
        </motion.div>
        
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Hotel Amenities
          </h2>
          <p className="text-gray-600">
            Select facilities and services your hotel offers
          </p>
        </div>
      </div>

      {/* Smart Suggestions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl border border-blue-200"
      >
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-900">Smart Suggestions</span>
        </div>
        <p className="text-sm text-blue-800">
          Most hotels in your area offer: Free Wi-Fi, Parking, and Breakfast
        </p>
      </motion.div>

      {/* Search & Filter */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search amenities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeCategory === 'all'
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {AMENITY_CATEGORIES.map(category => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeCategory === category.id
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {category.title.split(' ')[1]}
            </button>
          ))}
        </div>
      </div>

      {/* Selection Summary */}
      {selectedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-green-50 p-4 rounded-lg border border-green-200"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-800">
                {selectedCount} amenities selected
              </span>
            </div>
            {popularSelected > 0 && (
              <div className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4 text-orange-600" />
                <span className="text-sm text-orange-700">
                  {popularSelected} trending
                </span>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Amenity Categories */}
      <div className="space-y-6">
        {AMENITY_CATEGORIES.map((category, categoryIndex) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + categoryIndex * 0.1 }}
          >
            <h3 className="text-base font-medium text-gray-900 mb-3">
              {category.title}
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              {category.amenities.map((amenity) => (
                <motion.div
                  key={amenity.id}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card
                    className={`p-3 cursor-pointer transition-all duration-200 ${
                      selectedAmenities.includes(amenity.id)
                        ? 'bg-green-50 border-green-500 shadow-sm'
                        : 'hover:bg-gray-50 border-gray-200'
                    }`}
                    onClick={() => toggleAmenity(amenity.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        selectedAmenities.includes(amenity.id)
                          ? 'bg-green-100'
                          : 'bg-gray-100'
                      }`}>
                        <AmenityIcon 
                          name={amenity.icon} 
                          className={`w-4 h-4 ${
                            selectedAmenities.includes(amenity.id)
                              ? 'text-green-600'
                              : 'text-gray-600'
                          }`} 
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${
                            selectedAmenities.includes(amenity.id)
                              ? 'text-green-900'
                              : 'text-gray-900'
                          }`}>
                            {amenity.name}
                          </span>
                          {amenity.popular && (
                            <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">
                              Popular
                            </span>
                          )}
                        </div>
                      </div>
                      {selectedAmenities.includes(amenity.id) && (
                        <Check className="w-4 h-4 text-green-600" />
                      )}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Continue Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="sticky bottom-4 pt-4"
      >
        <Button
          onClick={handleContinue}
          className="w-full bg-green-600 hover:bg-green-700 text-white h-12"
          size="lg"
        >
          Continue with {selectedCount} amenities
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </motion.div>
    </motion.div>
  );
}