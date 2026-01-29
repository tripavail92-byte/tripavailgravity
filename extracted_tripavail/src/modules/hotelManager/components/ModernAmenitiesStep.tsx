import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Check, Search, X } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { getAmenityIcon } from '../../../components/icons/amenities/AnimatedAmenityIcons';
import SmartAmenitiesSelector from './SmartAmenitiesSelector';

interface ModernAmenitiesStepProps {
  onComplete: (data: any) => void;
  existingData?: any;
  onUpdate?: (data: any) => void;
}

interface AmenityItem {
  id: string;
  name: string;
  category: string;
}

export function ModernAmenitiesStep({ onComplete, existingData, onUpdate }: ModernAmenitiesStepProps) {
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(existingData?.amenities || []);
  const [hoveredAmenity, setHoveredAmenity] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  
  // References for auto-scroll functionality
  const categoryRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const amenityCategories = {
    'Internet & Technology': [
      { id: 'wifi', name: 'WiFi' },
      { id: 'high-speed-internet', name: 'High-Speed Internet' },
      { id: 'business-center', name: 'Business Center' },
      { id: 'meeting-rooms', name: 'Meeting Rooms' },
      { id: 'conference-facilities', name: 'Conference Facilities' }
    ],
    'Recreation & Wellness': [
      { id: 'pool', name: 'Swimming Pool' },
      { id: 'gym', name: 'Fitness Center/Gym' },
      { id: 'spa', name: 'Spa & Wellness Center' },
      { id: 'sauna', name: 'Sauna' },
      { id: 'hot_tub', name: 'Hot Tub/Jacuzzi' },
      { id: 'tennis-court', name: 'Tennis Court' },
      { id: 'golf-course', name: 'Golf Course' },
      { id: 'pool_table', name: 'Pool Table' },
      { id: 'piano', name: 'Piano' }
    ],
    'Outdoor & Views': [
      { id: 'patio', name: 'Patio' },
      { id: 'bbq_grill', name: 'BBQ Grill' },
      { id: 'outdoor_dining', name: 'Outdoor Dining Area' },
      { id: 'fire_pit', name: 'Fire Pit' },
      { id: 'scenic_balcony', name: 'Scenic Balcony' },
      { id: 'mountain_view', name: 'Mountain View Suite' },
      { id: 'forest_view', name: 'Forest/Jungle View' },
      { id: 'lake_access', name: 'Lake Access' },
      { id: 'beachfront', name: 'Beachfront Stay' }
    ],
    'Dining & Bar': [
      { id: 'restaurant', name: 'Restaurant' },
      { id: 'bar-lounge', name: 'Bar/Lounge' },
      { id: 'room-service', name: '24/7 Room Service' },
      { id: 'breakfast', name: 'Complimentary Breakfast' },
      { id: 'coffee-shop', name: 'Coffee Shop' },
      { id: 'minibar', name: 'Mini Bar in Rooms' }
    ],
    'Parking & Transportation': [
      { id: 'free_parking', name: 'Free Parking on Premises' },
      { id: 'paid_parking', name: 'Paid Parking on Premises' },
      { id: 'valet-parking', name: 'Valet Parking' },
      { id: 'airport-shuttle', name: 'Airport Shuttle' },
      { id: 'car-rental', name: 'Car Rental Service' },
      { id: 'taxi-service', name: 'Taxi Service' }
    ],
    'Services & Convenience': [
      { id: 'concierge', name: 'Concierge Service' },
      { id: 'front-desk-24h', name: '24-Hour Front Desk' },
      { id: 'luggage-storage', name: 'Luggage Storage' },
      { id: 'laundry', name: 'Laundry Service' },
      { id: 'dry-cleaning', name: 'Dry Cleaning' },
      { id: 'housekeeping', name: 'Daily Housekeeping' },
      { id: 'safe-deposit', name: 'Safe Deposit Box' },
      { id: 'currency-exchange', name: 'Currency Exchange' }
    ],
    'Kitchen & Laundry': [
      { id: 'kitchen', name: 'Kitchen' },
      { id: 'kitchenette', name: 'Kitchenette' },
      { id: 'refrigerator', name: 'Refrigerator' },
      { id: 'washing_machine', name: 'Washing Machine' },
      { id: 'dryer', name: 'Dryer' }
    ],
    'Room Features': [
      { id: 'air_conditioning', name: 'Air Conditioning' },
      { id: 'heating', name: 'Heating' },
      { id: 'dedicated_workspace', name: 'Dedicated Workspace' },
      { id: 'balcony', name: 'Balcony/Terrace' },
      { id: 'city-view', name: 'City View' },
      { id: 'ocean-view', name: 'Ocean View' },
      { id: 'indoor_bonfire', name: 'Indoor Bonfire Area' }
    ],
    'Family & Accessibility': [
      { id: 'family-rooms', name: 'Family Rooms' },
      { id: 'kids-club', name: 'Kids Club' },
      { id: 'playground', name: 'Playground' },
      { id: 'wheelchair-accessible', name: 'Wheelchair Accessible' },
      { id: 'elevator', name: 'Elevator' },
      { id: 'pet-friendly', name: 'Pet Friendly' },
      { id: 'babysitting', name: 'Babysitting Service' }
    ],
    'Entertainment': [
      { id: 'tv', name: 'TV' },
      { id: 'tv-cable', name: 'Cable/Satellite TV' },
      { id: 'entertainment-system', name: 'Entertainment System' },
      { id: 'library', name: 'Library' },
      { id: 'live-music', name: 'Live Music/Entertainment' },
      { id: 'nightclub', name: 'Nightclub' }
    ]
  };

  // Flatten all amenities for search
  const allAmenities: AmenityItem[] = Object.entries(amenityCategories).flatMap(([category, items]) =>
    items.map(item => ({ ...item, category }))
  );

  // Filter amenities based on search
  const filteredCategories = searchQuery
    ? { 'Search Results': allAmenities.filter(amenity =>
        amenity.name.toLowerCase().includes(searchQuery.toLowerCase())
      )}
    : amenityCategories;

  const toggleAmenity = (amenityId: string) => {
    const newAmenities = selectedAmenities.includes(amenityId)
      ? selectedAmenities.filter(id => id !== amenityId)
      : [...selectedAmenities, amenityId];
    
    setSelectedAmenities(newAmenities);
    
    if (onUpdate) {
      onUpdate({ amenities: newAmenities });
    }
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const isCurrentlyExpanded = prev.includes(category);
      
      // If clicking the currently open category, close it
      if (isCurrentlyExpanded) {
        return [];
      }
      
      // Otherwise, close all others and open this one (Exclusive Accordion)
      // Auto-scroll to the category after a short delay to let expansion animation start
      setTimeout(() => {
        const element = categoryRefs.current[category];
        if (element) {
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
          });
        }
      }, 100);
      
      return [category];
    });
  };

  const handleContinue = () => {
    onComplete({ amenities: selectedAmenities });
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const getTotalCount = () => {
    return Object.values(amenityCategories).reduce((total, items) => total + items.length, 0);
  };

  return (
    <>
      <div className="space-y-6" style={{ paddingBottom: selectedAmenities.length > 0 ? '120px' : '0', paddingLeft: '20px', paddingRight: '20px' }}>
        {/* Search Bar - At Top */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative"
        >
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            type="text"
            placeholder="Search amenities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10 py-3 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X size={18} />
            </button>
          )}
        </motion.div>

        {/* Smart Amenities Selector - Standout & Guest Essentials */}
        {!searchQuery && (
          <SmartAmenitiesSelector
            selectedAmenities={selectedAmenities}
            onSelectionChange={(amenities) => {
              setSelectedAmenities(amenities);
              if (onUpdate) {
                onUpdate({ amenities });
              }
            }}
            expandedCategories={expandedCategories}
            onToggleCategory={toggleCategory}
            categoryRefs={categoryRefs}
          />
        )}

        {/* Divider with Text */}
        {!searchQuery && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-4 py-2"
          >
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent dark:via-gray-700" />
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Or browse all amenities by category
            </span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent dark:via-gray-700" />
          </motion.div>
        )}

      {/* Amenity Categories */}
      <div style={{ marginTop: '32px' }}>
        {Object.entries(filteredCategories).map(([category, amenities], categoryIndex) => {
          const isExpanded = expandedCategories.includes(category) || searchQuery;
          const categoryAmenities = amenities as any[];
          
          return (
            <motion.div
              key={category}
              ref={(el) => categoryRefs.current[category] = el}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (categoryIndex * 0.05) + 0.5 }}
              style={{ marginBottom: '32px' }}
            >
              <Card className="overflow-hidden shadow-none border-gray-200 dark:border-gray-700 dark:bg-gray-800">
                {!searchQuery && (
                  <button
                    onClick={() => toggleCategory(category)}
                    className="w-full px-5 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    style={{ borderBottom: '1px solid #EAEAEA' }}
                  >
                    <div className="flex items-center justify-between">
                      <h3 style={{ fontSize: '15px', fontWeight: 500, color: '#000000' }}>{category}</h3>
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: '14px', color: '#8C8C8C' }}>
                          {categoryAmenities.filter(amenity => selectedAmenities.includes(amenity.id)).length}/
                          {categoryAmenities.length}
                        </span>
                        <motion.div
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <svg className="w-5 h-5" style={{ color: '#8C8C8C' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </motion.div>
                      </div>
                    </div>
                  </button>
                )}

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-2" style={{ gap: '18px 12px', padding: '20px' }}>
                        {categoryAmenities.map((amenity, amenityIndex) => {
                          const isSelected = selectedAmenities.includes(amenity.id);
                          const isHovered = hoveredAmenity === amenity.id;
                          const IconComponent = getAmenityIcon(amenity.id);
                          
                          // Check if this amenity is in the quick select lists
                          const isQuickSelectItem = [
                            'pool', 'hot_tub', 'patio', 'bbq_grill', 'outdoor_dining', 'fire_pit',
                            'pool_table', 'indoor_bonfire', 'piano', 'gym', 'lake_access', 'beachfront',
                            'mountain_view', 'scenic_balcony', 'forest_view', 'wifi', 'tv', 'kitchen',
                            'washing_machine', 'free_parking', 'paid_parking', 'air_conditioning', 'dedicated_workspace'
                          ].includes(amenity.id);

                          return (
                            <motion.button
                              key={amenity.id}
                              onClick={() => toggleAmenity(amenity.id)}
                              onMouseEnter={() => setHoveredAmenity(amenity.id)}
                              onMouseLeave={() => setHoveredAmenity(null)}
                              className={`relative ${
                                isSelected
                                  ? 'border-[1.5px]'
                                  : 'border'
                              }`}
                              style={{
                                width: '100%',
                                maxWidth: '160px',
                                height: '130px',
                                padding: '20px 12px',
                                borderRadius: '8px',
                                borderColor: isSelected ? '#000000' : '#E0E0E0',
                                background: '#FFFFFF',
                                transition: 'border-color 0.2s ease, border-width 0.2s ease'
                              }}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              {/* Vertically Stacked: Icon Above Text, Both Centered */}
                              <div className="flex flex-col items-center justify-center h-full" style={{ gap: '12px' }}>
                                {/* Icon - 40x40px with scale animation on selection */}
                                <motion.div
                                  className="flex-shrink-0"
                                  animate={isSelected ? { scale: 1.05 } : { scale: 1 }}
                                  transition={{ duration: 0.2, ease: 'easeOut' }}
                                >
                                  <IconComponent
                                    isSelected={false}
                                    isHovered={isHovered}
                                    size={40}
                                  />
                                </motion.div>

                                {/* Amenity Name - Centered */}
                                <div className="text-center">
                                  <h4 
                                    style={{
                                      fontSize: '15px',
                                      lineHeight: '20px',
                                      fontWeight: isSelected ? 500 : 400,
                                      color: '#1A1A1A'
                                    }}
                                  >
                                    {amenity.name}
                                  </h4>
                                </div>
                              </div>
                            </motion.button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          );
        })}
      </div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center text-sm text-gray-500"
        >
          <p>
            {selectedAmenities.length} of {getTotalCount()} amenities selected across{' '}
            {Object.keys(amenityCategories).length} categories
          </p>
        </motion.div>
      </div>

      {/* Selected Amenities Summary - Fixed Bottom */}
      <AnimatePresence>
        {selectedAmenities.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-gray-200 shadow-2xl"
          >
            <div className="max-w-4xl mx-auto px-5 py-4">
              <div className="flex items-start gap-3">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: 'rgba(157, 78, 221, 0.15)' }}
                >
                  <Check className="w-4 h-4" style={{ color: '#9D4EDD' }} />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium mb-2" style={{ color: '#6B21A8' }}>
                    {selectedAmenities.length} amenities selected
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedAmenities.slice(0, 5).map(amenityId => {
                      const amenity = allAmenities.find(a => a.id === amenityId);
                      return amenity ? (
                        <span
                          key={amenityId}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs"
                          style={{ 
                            backgroundColor: 'rgba(157, 78, 221, 0.15)',
                            color: '#7C3AED'
                          }}
                        >
                          {amenity.name}
                        </span>
                      ) : null;
                    })}
                    {selectedAmenities.length > 5 && (
                      <span 
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs"
                        style={{ 
                          backgroundColor: 'rgba(157, 78, 221, 0.15)',
                          color: '#7C3AED'
                        }}
                      >
                        +{selectedAmenities.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}