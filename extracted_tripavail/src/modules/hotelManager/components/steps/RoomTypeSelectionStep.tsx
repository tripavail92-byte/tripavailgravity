import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Card } from '../../../../components/ui/card';
import { getRoomTypeIcon } from '../../../../components/icons/rooms/RoomTypeIcons';

interface RoomTypeSelectionStepProps {
  onComplete: (data: any) => void;
  existingData?: any;
  onUpdate?: (data: any) => void;
}

export function RoomTypeSelectionStep({ onComplete, existingData, onUpdate }: RoomTypeSelectionStepProps) {
  const [selectedRoomType, setSelectedRoomType] = useState<string>(
    existingData?.currentRoom?.roomType || ''
  );
  const [hoveredRoomType, setHoveredRoomType] = useState<string | null>(null);

  const roomTypeOptions = [
    { id: 'economy', name: 'Economy Room', description: 'Budget-friendly accommodation' },
    { id: 'standard', name: 'Standard Room', description: 'Comfortable standard accommodation' },
    { id: 'deluxe', name: 'Deluxe Room', description: 'Enhanced comfort and amenities' },
    { id: 'premium', name: 'Premium Room', description: 'High-end features and luxury' },
    { id: 'suite', name: 'Suite', description: 'Spacious suite with separate areas' },
    { id: 'presidential', name: 'Presidential Suite', description: 'Ultimate luxury accommodation' }
  ];

  useEffect(() => {
    if (onUpdate && selectedRoomType) {
      onUpdate({ 
        currentRoom: { 
          ...existingData?.currentRoom, 
          roomType: selectedRoomType 
        } 
      });
    }
  }, [selectedRoomType]);

  const handleRoomTypeSelect = (roomTypeId: string) => {
    setSelectedRoomType(roomTypeId);
  };

  const handleContinue = () => {
    if (selectedRoomType) {
      onComplete({ 
        currentRoom: { 
          ...existingData?.currentRoom, 
          roomType: selectedRoomType 
        } 
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-8"
      >
        {/* Minimalist subtitle only */}
        <div className="text-center mb-8">
          <p className="text-gray-600">
            Select the category that best describes this room
          </p>
        </div>

        {/* Room Type Grid - 4x2 Layout */}
        <div className="grid grid-cols-2 md:grid-cols-4" style={{ gap: '18px 12px' }}>
          {roomTypeOptions.map((roomType) => {
            const isSelected = selectedRoomType === roomType.id;
            const isHovered = hoveredRoomType === roomType.id;
            const IconComponent = getRoomTypeIcon(roomType.id);

            return (
              <motion.button
                key={roomType.id}
                onClick={() => handleRoomTypeSelect(roomType.id)}
                onMouseEnter={() => setHoveredRoomType(roomType.id)}
                onMouseLeave={() => setHoveredRoomType(null)}
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

                  {/* Room Type Name - Centered */}
                  <div className="text-center">
                    <h4
                      style={{
                        fontSize: '15px',
                        lineHeight: '20px',
                        fontWeight: isSelected ? 500 : 400,
                        color: isSelected ? '#9D4EDD' : '#1A1A1A'
                      }}
                    >
                      {roomType.name}
                    </h4>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Selected Room Type Info */}
        {selectedRoomType && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6"
          >
            <Card className="p-6 border-2" style={{
              background: 'linear-gradient(135deg, rgba(157, 78, 221, 0.08) 0%, rgba(0, 212, 255, 0.08) 100%)',
              borderColor: '#9D4EDD'
            }}>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  {getRoomTypeIcon(selectedRoomType)({ size: 48 })}
                </div>
                <div>
                  <h3 className="mb-1" style={{
                    fontWeight: 600,
                    color: '#9D4EDD'
                  }}>
                    {roomTypeOptions.find(rt => rt.id === selectedRoomType)?.name}
                  </h3>
                  <p className="text-sm" style={{ color: '#6B21A8' }}>
                    {roomTypeOptions.find(rt => rt.id === selectedRoomType)?.description}
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Helper Text */}
        {!selectedRoomType && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center text-gray-500 text-sm"
          >
            Select a room type to continue
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
