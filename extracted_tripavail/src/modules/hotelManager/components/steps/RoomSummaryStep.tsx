import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Check, Plus, Users, Bed, Eye, DollarSign } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Card } from '../../../../components/ui/card';
import { getRoomTypeIcon } from '../../../../components/icons/rooms/RoomTypeIcons';
import { getRoomIcon } from '../../../../components/icons/rooms/AnimatedRoomIcons';

interface RoomSummaryStepProps {
  onComplete: (data: any) => void;
  existingData?: any;
  onUpdate?: (data: any) => void;
}

export function RoomSummaryStep({ onComplete, existingData, onUpdate }: RoomSummaryStepProps) {
  const [savedRooms, setSavedRooms] = useState<any[]>(existingData?.rooms || []);
  const currentRoom = existingData?.currentRoom;

  const roomTypeOptions = [
    { id: 'economy', name: 'Economy Room' },
    { id: 'standard', name: 'Standard Room' },
    { id: 'deluxe', name: 'Deluxe Room' },
    { id: 'premium', name: 'Premium Room' },
    { id: 'suite', name: 'Suite' },
    { id: 'presidential', name: 'Presidential Suite' }
  ];

  const bedConfigurations = [
    { id: 'single-bed', name: 'Single Bed' },
    { id: 'double-bed', name: 'Double Bed' },
    { id: 'twin-beds', name: 'Twin Beds' },
    { id: 'queen-bed', name: 'Queen Bed' },
    { id: 'king-bed', name: 'King Bed' },
    { id: 'sofa-bed', name: 'Sofa Bed' },
    { id: 'bunk-bed', name: 'Bunk Bed' }
  ];

  const roomTypeLabel = roomTypeOptions.find(rt => rt.id === currentRoom?.roomType)?.name;

  const saveRoomAndContinue = () => {
    // Save current room to rooms array
    const newRoom = {
      id: `room_${Date.now()}`,
      ...currentRoom
    };
    const updatedRooms = [...savedRooms, newRoom];
    setSavedRooms(updatedRooms);
    
    // Complete with all rooms and clear current room
    onComplete({ 
      rooms: updatedRooms,
      currentRoom: null 
    });
  };

  const addAnotherRoom = () => {
    // Save current room and restart the room flow
    const newRoom = {
      id: `room_${Date.now()}`,
      ...currentRoom
    };
    const updatedRooms = [...savedRooms, newRoom];
    
    // Complete with addAnother flag to go back to step 5
    onComplete({ 
      rooms: updatedRooms,
      currentRoom: null,
      addAnother: true 
    });
  };

  return (
    <div className="max-w-3xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-8"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 flex items-center justify-center mx-auto mb-4"
          >
            <Check size={40} className="text-white" />
          </motion.div>
          <h2 className="text-3xl font-semibold text-gray-900 mb-2">
            Room Configured!
          </h2>
          <p className="text-gray-600">
            Review your room details below
          </p>
        </div>

        {/* Room Summary Card */}
        <Card className="p-6 bg-white shadow-md border-2 border-purple-200">
          <div className="flex items-start gap-4 mb-6">
            <div className="flex-shrink-0 bg-gradient-to-r from-purple-100 to-cyan-100 rounded-lg p-3">
              {getRoomTypeIcon(currentRoom?.roomType)({ size: 48 })}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900 mb-1">
                {currentRoom?.name}
              </h3>
              <p className="text-sm" style={{ color: '#9D4EDD' }}>
                {roomTypeLabel}
              </p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="flex items-center gap-2 text-gray-700">
              <DollarSign size={18} className="text-gray-500" />
              <div>
                <p className="text-xs text-gray-500">Price per Night</p>
                <p className="font-semibold">${currentRoom?.pricePerNight}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Users size={18} className="text-gray-500" />
              <div>
                <p className="text-xs text-gray-500">Max Guests</p>
                <p className="font-semibold">{currentRoom?.maxGuests} guests</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Bed size={18} className="text-gray-500" />
              <div>
                <p className="text-xs text-gray-500">Bed Types</p>
                <p className="font-semibold">{currentRoom?.bedConfig?.length || 0} configured</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Eye size={18} className="text-gray-500" />
              <div>
                <p className="text-xs text-gray-500">Amenities</p>
                <p className="font-semibold">{currentRoom?.amenities?.length || 0} selected</p>
              </div>
            </div>
          </div>

          {/* Bed Configuration Display */}
          {currentRoom?.bedConfig && currentRoom.bedConfig.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Bed Configuration</p>
              <div className="flex flex-wrap gap-2">
                {currentRoom.bedConfig.map((bedId: string) => {
                  const bed = bedConfigurations.find(b => b.id === bedId);
                  const IconComponent = getRoomIcon(bedId);
                  return (
                    <div key={bedId} className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg">
                      <IconComponent size={20} />
                      <span className="text-sm text-gray-700">{bed?.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Description */}
          {currentRoom?.description && (
            <div className="pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Description</p>
              <p className="text-sm text-gray-700">{currentRoom.description}</p>
            </div>
          )}
        </Card>

        {/* Saved Rooms Summary */}
        {savedRooms.length > 0 && (
          <Card className="p-6 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200">
            <h4 className="font-semibold text-gray-900 mb-2">
              ✓ Previously Saved Rooms
            </h4>
            <p className="text-sm text-gray-700">
              {savedRooms.length} room type{savedRooms.length > 1 ? 's' : ''} already configured
            </p>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <motion.button
            onClick={saveRoomAndContinue}
            className="w-full h-14 bg-black text-white rounded-xl flex items-center justify-center gap-2"
            style={{
              fontSize: '16px',
              fontWeight: 600,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
            }}
            whileHover={{ 
              scale: 1.02,
              boxShadow: '0 6px 20px rgba(0, 0, 0, 0.25)'
            }}
            whileTap={{ 
              scale: 0.98 
            }}
            transition={{ 
              type: "spring", 
              stiffness: 400, 
              damping: 17 
            }}
          >
            <Check size={20} />
            Save Room & Continue
          </motion.button>

          <motion.button
            onClick={addAnotherRoom}
            className="w-full h-14 bg-white border-2 border-black text-black rounded-xl flex items-center justify-center gap-2"
            style={{
              fontSize: '16px',
              fontWeight: 500,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
            }}
            whileHover={{ 
              scale: 1.02,
              backgroundColor: '#F9FAFB',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)'
            }}
            whileTap={{ 
              scale: 0.98 
            }}
            transition={{ 
              type: "spring", 
              stiffness: 400, 
              damping: 17 
            }}
          >
            <Plus size={20} />
            Save & Add Another Room Type
          </motion.button>
        </div>

        {/* Info Message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-blue-50 border border-blue-200 rounded-lg p-4"
        >
          <p className="text-sm text-blue-800">
            💡 <strong>Tip:</strong> You can add multiple room types to offer variety to your guests. Each room type can have different pricing and configurations.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
