import { useState } from 'react';
import { motion } from 'motion/react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Plus, Bed, DollarSign, Users, Eye } from 'lucide-react';
import { getRoomTypeIcon } from '../../../components/icons/rooms/RoomTypeIcons';

interface RoomType {
  id: string;
  name: string;
  roomType: string;
  bedConfig: string[];
  amenities: string[];
  maxGuests: number;
  count: number;
  pricePerNight: number;
  description: string;
  size?: string;
}

interface ModernRoomsStepProps {
  onComplete: (data: any) => void;
  existingData?: any;
  onUpdate?: (data: any) => void;
}

export function ModernRoomsStep({ onComplete, existingData, onUpdate }: ModernRoomsStepProps) {
  const [savedRooms, setSavedRooms] = useState<RoomType[]>(existingData?.rooms || []);

  const roomTypeOptions = [
    { id: 'economy', name: 'Economy Room' },
    { id: 'standard', name: 'Standard Room' },
    { id: 'deluxe', name: 'Deluxe Room' },
    { id: 'premium', name: 'Premium Room' },
    { id: 'suite', name: 'Suite' },
    { id: 'presidential', name: 'Presidential Suite' }
  ];

  const handleContinue = () => {
    if (savedRooms.length > 0) {
      onComplete({ rooms: savedRooms });
    }
  };

  const handleAddFirstRoom = () => {
    // Signal parent to start room configuration flow
    if (onUpdate) {
      onUpdate({ startRoomFlow: true });
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
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-semibold text-gray-900 mb-2">
            Rooms & Accommodation
          </h2>
          <p className="text-gray-600">
            {savedRooms.length > 0 
              ? `You have ${savedRooms.length} room type${savedRooms.length > 1 ? 's' : ''} configured`
              : 'Configure your room types and pricing'
            }
          </p>
        </div>

        {/* Empty State - No Rooms */}
        {savedRooms.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-12 text-center bg-gradient-to-br from-purple-50 via-white to-cyan-50 border-2 border-dashed border-purple-300">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 flex items-center justify-center mx-auto mb-6"
              >
                <Bed size={36} className="text-white" />
              </motion.div>
              
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                Add Your First Room
              </h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Let's configure your first room type. You'll provide details about the room, select bed configurations, and add amenities.
              </p>
              
              <Button
                onClick={handleAddFirstRoom}
                className="px-8 h-12 transition-all duration-300"
                style={{
                  background: 'linear-gradient(135deg, #9D4EDD, #00D4FF)',
                  color: 'white',
                  border: 'none'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(157, 78, 221, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <Plus className="mr-2" size={20} />
                Add Room Type
              </Button>
            </Card>
          </motion.div>
        )}

        {/* Saved Rooms List */}
        {savedRooms.length > 0 && (
          <div className="space-y-4">
            {savedRooms.map((room, index) => {
              const RoomTypeIconComponent = getRoomTypeIcon(room.roomType);
              const roomTypeLabel = roomTypeOptions.find(rt => rt.id === room.roomType)?.name;

              return (
                <motion.div
                  key={room.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="p-6 bg-white shadow-sm border border-gray-200 hover:border-purple-300 transition-all duration-200">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 bg-gradient-to-r from-purple-100 to-cyan-100 rounded-lg p-3">
                        <RoomTypeIconComponent size={40} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-gray-900 text-lg">{room.name}</h4>
                            <p className="text-sm" style={{ color: '#9D4EDD' }}>{roomTypeLabel}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900 text-lg">${room.pricePerNight}</p>
                            <p className="text-xs text-gray-500">per night</p>
                          </div>
                        </div>

                        {/* Stats Row */}
                        <div className="flex items-center gap-6 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-1.5">
                            <Users size={16} className="text-gray-500" />
                            <span>{room.maxGuests} guests</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Bed size={16} className="text-gray-500" />
                            <span>{room.bedConfig.length} bed type{room.bedConfig.length > 1 ? 's' : ''}</span>
                          </div>
                          {room.amenities && room.amenities.length > 0 && (
                            <div className="flex items-center gap-1.5">
                              <Eye size={16} className="text-gray-500" />
                              <span>{room.amenities.length} amenities</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium">{room.count} room{room.count > 1 ? 's' : ''}</span>
                          </div>
                        </div>

                        {/* Description */}
                        {room.description && (
                          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                            {room.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}

            {/* Add Another Room Button */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: savedRooms.length * 0.1 + 0.2 }}
            >
              <Button
                onClick={handleAddFirstRoom}
                variant="outline"
                className="w-full h-14 border-2 border-dashed transition-all duration-300"
                style={{
                  borderColor: '#9D4EDD40',
                  color: '#9D4EDD'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#9D4EDD';
                  e.currentTarget.style.background = 'linear-gradient(135deg, #9D4EDD05, #00D4FF05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#9D4EDD40';
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <Plus className="mr-2" size={20} />
                Add Another Room Type
              </Button>
            </motion.div>
          </div>
        )}

        {/* Helper Text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-r from-purple-50 to-cyan-50 border border-purple-200 rounded-lg p-4"
        >
          <p className="text-sm text-gray-700">
            💡 <strong>Tip:</strong> Add multiple room types to offer variety and cater to different guest preferences and budgets.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
