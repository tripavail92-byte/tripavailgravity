import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, Check } from 'lucide-react';
import { Card } from '../../../../components/ui/card';
import { Input } from '../../../../components/ui/input';
import { getRoomAmenityIcon } from '../../../../components/icons/rooms/RoomAmenityIcons';

interface RoomAmenitiesStepProps {
  onComplete: (data: any) => void;
  existingData?: any;
  onUpdate?: (data: any) => void;
}

export function RoomAmenitiesStep({ onComplete, existingData, onUpdate }: RoomAmenitiesStepProps) {
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(
    existingData?.currentRoom?.amenities || []
  );
  const [hoveredAmenity, setHoveredAmenity] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Comprehensive room amenities organized by category
  const amenityCategories = [
    {
      id: 'essential',
      name: 'Essential Amenities',
      amenities: [
        { id: 'air-conditioning', name: 'Air Conditioning' },
        { id: 'heating', name: 'Heating' },
        { id: 'wifi', name: 'Free WiFi' },
        { id: 'television', name: 'Television' },
        { id: 'safe', name: 'In-room Safe' },
        { id: 'iron', name: 'Iron & Board' },
        { id: 'desk', name: 'Desk & Chair' }
      ]
    },
    {
      id: 'bathroom',
      name: 'Bathroom Amenities',
      amenities: [
        { id: 'shower', name: 'Shower' },
        { id: 'bathtub', name: 'Bathtub' },
        { id: 'hair-dryer', name: 'Hair Dryer' },
        { id: 'toiletries', name: 'Toiletries' },
        { id: 'towels', name: 'Premium Towels' },
        { id: 'slippers', name: 'Slippers' }
      ]
    },
    {
      id: 'kitchen',
      name: 'Kitchen & Dining',
      amenities: [
        { id: 'minibar', name: 'Mini Bar' },
        { id: 'coffee-maker', name: 'Coffee Maker' },
        { id: 'kitchenette', name: 'Kitchenette' },
        { id: 'microwave', name: 'Microwave' },
        { id: 'dining-table', name: 'Dining Table' }
      ]
    },
    {
      id: 'views',
      name: 'View & Outdoor',
      amenities: [
        { id: 'balcony', name: 'Balcony' },
        { id: 'private-terrace', name: 'Private Terrace' },
        { id: 'city-view', name: 'City View' },
        { id: 'ocean-view', name: 'Ocean View' },
        { id: 'garden-view', name: 'Garden View' },
        { id: 'mountain-view', name: 'Mountain View' }
      ]
    }
  ];

  // Get all amenities for filtering
  const allAmenities = amenityCategories.flatMap(cat => cat.amenities);

  // Filter amenities based on search
  const getFilteredAmenities = (category: typeof amenityCategories[0]) => {
    if (!searchQuery) return category.amenities;
    return category.amenities.filter(amenity =>
      amenity.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  useEffect(() => {
    if (onUpdate) {
      onUpdate({ 
        currentRoom: { 
          ...existingData?.currentRoom, 
          amenities: selectedAmenities 
        } 
      });
    }
  }, [selectedAmenities]);

  const toggleAmenity = (amenityId: string) => {
    setSelectedAmenities(prev =>
      prev.includes(amenityId)
        ? prev.filter(id => id !== amenityId)
        : [...prev, amenityId]
    );
  };

  const handleContinue = () => {
    onComplete({ 
      currentRoom: { 
        ...existingData?.currentRoom, 
        amenities: selectedAmenities 
      } 
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-8"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <p className="text-gray-600">
            Select the amenities available in this room
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <Input
            type="text"
            placeholder="Search amenities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12"
          />
        </div>

        {/* Amenities by Category */}
        <div className="space-y-8">
          {amenityCategories.map((category) => {
            const filteredAmenities = getFilteredAmenities(category);
            if (filteredAmenities.length === 0) return null;

            return (
              <div key={category.id}>
                <h4 className="mb-4 uppercase tracking-wide" style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#9D4EDD'
                }}>
                  {category.name}
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4" style={{ gap: '18px 12px' }}>
                  {filteredAmenities.map((amenity) => {
                    const isSelected = selectedAmenities.includes(amenity.id);
                    const isHovered = hoveredAmenity === amenity.id;
                    const IconComponent = getRoomAmenityIcon(amenity.id);

                    return (
                      <motion.button
                        key={amenity.id}
                        onClick={() => toggleAmenity(amenity.id)}
                        onMouseEnter={() => setHoveredAmenity(amenity.id)}
                        onMouseLeave={() => setHoveredAmenity(null)}
                        className={`relative ${
                          isSelected ? 'border-[2px]' : 'border'
                        }`}
                        style={{
                          width: '100%',
                          maxWidth: '160px',
                          height: '130px',
                          padding: '20px 12px',
                          borderRadius: '8px',
                          borderColor: isSelected ? '#9D4EDD' : '#E0E0E0',
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
                              isSelected={isSelected}
                              isHovered={isHovered}
                              size={40}
                            />
                          </motion.div>

                          {/* Amenity Name - Centered */}
                          <div className="text-center">
                            <h4
                              style={{
                                fontSize: '14px',
                                lineHeight: '18px',
                                fontWeight: isSelected ? 500 : 400,
                                color: isSelected ? '#9D4EDD' : '#1A1A1A'
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
              </div>
            );
          })}
        </div>

        {/* Selection Info */}
        {selectedAmenities.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6"
          >
            <Card className="p-6 border-2" style={{ 
              background: 'linear-gradient(135deg, rgba(157, 78, 221, 0.08) 0%, rgba(0, 212, 255, 0.08) 100%)',
              borderColor: '#9D4EDD'
            }}>
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{
                    background: 'linear-gradient(135deg, #9D4EDD 0%, #00D4FF 100%)'
                  }}>
                    <Check size={20} className="text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="mb-1" style={{ 
                    fontWeight: 600,
                    color: '#9D4EDD'
                  }}>
                    {selectedAmenities.length} amenities selected
                  </h3>
                  <p className="text-sm" style={{ color: '#6B21A8' }}>
                    Great selection! More amenities increase booking rates.
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Helper Text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="border rounded-lg p-4"
          style={{
            background: 'rgba(157, 78, 221, 0.05)',
            borderColor: 'rgba(157, 78, 221, 0.2)'
          }}
        >
          <p className="text-sm" style={{ color: '#7C3AED' }}>
            💡 <strong>Tip:</strong> More amenities mean better visibility in search results and higher booking rates!
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
