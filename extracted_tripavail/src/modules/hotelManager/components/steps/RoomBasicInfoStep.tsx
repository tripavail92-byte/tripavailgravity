import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Input } from '../../../../components/ui/input';
import { Textarea } from '../../../../components/ui/textarea';
import { Card } from '../../../../components/ui/card';

interface RoomBasicInfoStepProps {
  onComplete: (data: any) => void;
  existingData?: any;
  onUpdate?: (data: any) => void;
}

export function RoomBasicInfoStep({ onComplete, existingData, onUpdate }: RoomBasicInfoStepProps) {
  const [roomData, setRoomData] = useState({
    name: existingData?.currentRoom?.name || '',
    pricePerNight: existingData?.currentRoom?.pricePerNight || '',
    maxGuests: existingData?.currentRoom?.maxGuests || 2,
    count: existingData?.currentRoom?.count || 1,
    description: existingData?.currentRoom?.description || '',
    size: existingData?.currentRoom?.size || ''
  });

  useEffect(() => {
    if (onUpdate) {
      onUpdate({ currentRoom: roomData });
    }
  }, [roomData]);

  const handleContinue = () => {
    onComplete({ currentRoom: roomData });
  };

  const isValid = roomData.name && roomData.pricePerNight && roomData.maxGuests;

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-6"
      >
        {/* Minimalist subtitle only */}
        <div className="text-center mb-8">
          <p className="text-gray-600">
            Provide basic information about this room type
          </p>
        </div>

        {/* Form Card */}
        <Card className="p-8 bg-white shadow-sm border border-gray-200">
          <div className="space-y-6">
            {/* Room Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Room Name *
              </label>
              <Input
                type="text"
                placeholder="e.g., Deluxe Ocean View Suite"
                value={roomData.name}
                onChange={(e) => setRoomData({ ...roomData, name: e.target.value })}
                className="h-12 text-base"
              />
              <p className="text-xs text-gray-500 mt-1">Give your room a descriptive name</p>
            </div>

            {/* Price and Guests Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price per Night (USD) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                    $
                  </span>
                  <Input
                    type="number"
                    placeholder="150"
                    value={roomData.pricePerNight}
                    onChange={(e) => setRoomData({ ...roomData, pricePerNight: e.target.value })}
                    className="h-12 text-base pl-8"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Guests *
                </label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={roomData.maxGuests}
                  onChange={(e) => setRoomData({ ...roomData, maxGuests: parseInt(e.target.value) || 2 })}
                  className="h-12 text-base"
                />
              </div>
            </div>

            {/* Count and Size Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Rooms Available
                </label>
                <Input
                  type="number"
                  min="1"
                  value={roomData.count}
                  onChange={(e) => setRoomData({ ...roomData, count: parseInt(e.target.value) || 1 })}
                  className="h-12 text-base"
                />
                <p className="text-xs text-gray-500 mt-1">How many of this room type do you have?</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Room Size (sq ft)
                </label>
                <Input
                  type="number"
                  placeholder="320"
                  value={roomData.size}
                  onChange={(e) => setRoomData({ ...roomData, size: e.target.value })}
                  className="h-12 text-base"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Room Description
              </label>
              <Textarea
                placeholder="Describe your room's features, views, and what makes it special..."
                value={roomData.description}
                onChange={(e) => setRoomData({ ...roomData, description: e.target.value })}
                className="min-h-[120px] text-base"
              />
              <p className="text-xs text-gray-500 mt-1">
                Highlight unique features to attract guests
              </p>
            </div>
          </div>
        </Card>

        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="border rounded-lg p-4"
          style={{
            background: 'rgba(157, 78, 221, 0.05)',
            borderColor: 'rgba(157, 78, 221, 0.2)'
          }}
        >
          <p className="text-sm" style={{ color: '#7C3AED' }}>
            💡 <strong>Tip:</strong> Clear, descriptive room names and detailed descriptions help guests make informed decisions and increase bookings.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
