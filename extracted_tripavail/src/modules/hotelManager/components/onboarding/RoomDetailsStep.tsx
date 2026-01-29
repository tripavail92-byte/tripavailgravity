import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Plus, Bed, Users, DollarSign, Upload, X } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Textarea } from '../../../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { Card } from '../../../../components/ui/card';
import { AmenityIcon } from '../AmenityIcon';

interface RoomDetailsStepProps {
  data: any;
  onComplete: (data: any) => void;
}

interface Room {
  id: string;
  name: string;
  description: string;
  maxOccupancy: number;
  bedType: string;
  basePrice: number;
  roomSize: number;
  amenities: string[];
  photos: string[];
}

const BED_TYPES = [
  'Single Bed', 'Double Bed', 'King Bed', 'Queen Bed', 'Twin Beds', 'Bunk Beds', 'Sofa Bed'
];

const ROOM_AMENITIES = [
  { id: 'ac', name: 'Air Conditioning', icon: 'air-vent' },
  { id: 'tv', name: 'Flat-screen TV', icon: 'tv' },
  { id: 'minibar', name: 'Mini-Bar', icon: 'refrigerator' },
  { id: 'safe', name: 'Safe', icon: 'lock' },
  { id: 'coffee', name: 'Coffee Maker', icon: 'coffee' },
  { id: 'hairdryer', name: 'Hair Dryer', icon: 'wind' },
  { id: 'iron', name: 'Iron', icon: 'shirt' },
  { id: 'desk', name: 'Work Desk', icon: 'laptop' },
  { id: 'balcony', name: 'Balcony', icon: 'palmtree' },
  { id: 'room-service', name: 'Room Service', icon: 'bell' },
];

export function RoomDetailsStep({ data, onComplete }: RoomDetailsStepProps) {
  const [rooms, setRooms] = useState<Room[]>(
    data.rooms?.length > 0 ? data.rooms : [{
      id: '1',
      name: '',
      description: '',
      maxOccupancy: 2,
      bedType: '',
      basePrice: 0,
      roomSize: 0,
      amenities: [],
      photos: [],
    }]
  );

  const [activeRoom, setActiveRoom] = useState(0);

  const updateRoom = (index: number, field: keyof Room, value: any) => {
    setRooms(prev => prev.map((room, i) => 
      i === index ? { ...room, [field]: value } : room
    ));
  };

  const addRoom = () => {
    const newRoom: Room = {
      id: Date.now().toString(),
      name: '',
      description: '',
      maxOccupancy: 2,
      bedType: '',
      basePrice: 0,
      roomSize: 0,
      amenities: [],
      photos: [],
    };
    setRooms(prev => [...prev, newRoom]);
    setActiveRoom(rooms.length);
  };

  const removeRoom = (index: number) => {
    if (rooms.length > 1) {
      setRooms(prev => prev.filter((_, i) => i !== index));
      if (activeRoom >= rooms.length - 1) {
        setActiveRoom(Math.max(0, activeRoom - 1));
      }
    }
  };

  const toggleAmenity = (roomIndex: number, amenityId: string) => {
    setRooms(prev => prev.map((room, i) => 
      i === roomIndex 
        ? {
            ...room,
            amenities: room.amenities.includes(amenityId)
              ? room.amenities.filter(id => id !== amenityId)
              : [...room.amenities, amenityId]
          }
        : room
    ));
  };

  const handleSubmit = () => {
    onComplete({ rooms });
  };

  const currentRoom = rooms[activeRoom];
  const isValidRoom = currentRoom?.name && currentRoom?.bedType && currentRoom?.basePrice > 0;

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
          className="w-16 h-16 mx-auto bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center"
        >
          <Bed className="w-8 h-8 text-white" />
        </motion.div>
        
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Room Details
          </h2>
          <p className="text-gray-600">
            Add details for each room type you offer
          </p>
        </div>
      </div>

      {/* Room Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {rooms.map((room, index) => (
          <button
            key={room.id}
            onClick={() => setActiveRoom(index)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeRoom === index
                ? 'bg-green-100 text-green-700 border-2 border-green-300'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Bed className="w-4 h-4" />
            {room.name || `Room ${index + 1}`}
            {rooms.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeRoom(index);
                }}
                className="ml-1 text-gray-400 hover:text-red-500"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </button>
        ))}
        
        <Button
          onClick={addRoom}
          variant="outline"
          size="sm"
          className="flex items-center gap-1 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Add Room
        </Button>
      </div>

      {/* Room Form */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeRoom}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-6"
        >
          <Card className="p-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Room Type Name</Label>
                  <Input
                    value={currentRoom.name}
                    onChange={(e) => updateRoom(activeRoom, 'name', e.target.value)}
                    placeholder="e.g., Deluxe Room"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Bed Type</Label>
                  <Select
                    value={currentRoom.bedType}
                    onValueChange={(value) => updateRoom(activeRoom, 'bedType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select bed type" />
                    </SelectTrigger>
                    <SelectContent>
                      {BED_TYPES.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Room Description</Label>
                <Textarea
                  value={currentRoom.description}
                  onChange={(e) => updateRoom(activeRoom, 'description', e.target.value)}
                  placeholder="Describe the room's features and atmosphere..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Max Occupancy</Label>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <Input
                      type="number"
                      value={currentRoom.maxOccupancy}
                      onChange={(e) => updateRoom(activeRoom, 'maxOccupancy', parseInt(e.target.value) || 0)}
                      min="1"
                      max="10"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Room Size</Label>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      value={currentRoom.roomSize}
                      onChange={(e) => updateRoom(activeRoom, 'roomSize', parseInt(e.target.value) || 0)}
                      placeholder="0"
                    />
                    <span className="text-sm text-gray-500">sq ft</span>
                  </div>
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label>Base Price Per Night</Label>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                    <Input
                      type="number"
                      value={currentRoom.basePrice}
                      onChange={(e) => updateRoom(activeRoom, 'basePrice', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Room Amenities */}
          <Card className="p-6">
            <h3 className="font-medium text-gray-900 mb-4">Room Amenities</h3>
            <div className="grid grid-cols-2 gap-3">
              {ROOM_AMENITIES.map((amenity) => (
                <div
                  key={amenity.id}
                  onClick={() => toggleAmenity(activeRoom, amenity.id)}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    currentRoom.amenities.includes(amenity.id)
                      ? 'bg-green-50 border-green-300'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    currentRoom.amenities.includes(amenity.id)
                      ? 'bg-green-100'
                      : 'bg-gray-100'
                  }`}>
                    <AmenityIcon 
                      name={amenity.icon} 
                      className={`w-4 h-4 ${
                        currentRoom.amenities.includes(amenity.id)
                          ? 'text-green-600'
                          : 'text-gray-600'
                      }`} 
                    />
                  </div>
                  <span className={`text-sm font-medium ${
                    currentRoom.amenities.includes(amenity.id)
                      ? 'text-green-900'
                      : 'text-gray-900'
                  }`}>
                    {amenity.name}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Photo Upload */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900">Room Photos</h3>
              <span className="text-sm text-gray-500">Min 3, Max 6 photos</span>
            </div>
            
            <motion.div
              whileHover={{ scale: 1.01 }}
              className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gradient-to-br from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 transition-all duration-300 cursor-pointer"
            >
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Upload className="w-10 h-10 text-blue-500 mx-auto mb-4" />
              </motion.div>
              <h4 className="font-medium text-gray-900 mb-2">Upload stunning room photos</h4>
              <p className="text-sm text-gray-600 mb-4">
                High-quality photos get 3x more bookings
              </p>
              <div className="space-y-2 text-xs text-gray-500 mb-4">
                <p>✓ First photo becomes your cover image</p>
                <p>✓ Show different angles and lighting</p>
                <p>✓ JPG, PNG up to 10MB each</p>
              </div>
              <Button variant="outline" className="bg-white hover:bg-gray-50">
                <Upload className="w-4 h-4 mr-2" />
                Choose Photos
              </Button>
            </motion.div>
            
            {/* Photo Tips */}
            <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex items-start gap-2">
                <span className="text-amber-600">💡</span>
                <div className="text-sm">
                  <p className="font-medium text-amber-900">Photo Tips</p>
                  <p className="text-amber-800">Natural lighting, clean spaces, and multiple angles work best!</p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Continue Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="sticky bottom-4 pt-4"
      >
        <Button
          onClick={handleSubmit}
          disabled={!isValidRoom}
          className="w-full bg-green-600 hover:bg-green-700 text-white h-12"
          size="lg"
        >
          Continue with {rooms.length} room type{rooms.length > 1 ? 's' : ''}
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </motion.div>
    </motion.div>
  );
}