import { useState } from 'react';
import { Plus, Edit3, Trash2, Users, Bed, DollarSign, Ruler } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { motion, AnimatePresence } from 'motion/react';
import { RoomWizardModal } from './RoomWizardModal';

export interface BedConfig {
    type: 'king' | 'queen' | 'double' | 'twin' | 'single' | 'sofaBed';
    quantity: number;
}

export interface RoomType {
    id: string;
    type: 'standard' | 'deluxe' | 'suite' | 'family' | 'executive' | 'presidential';
    name: string;
    description: string;
    count: number;
    maxGuests: number;
    size: number;
    beds: BedConfig[];
    pricing: {
        basePrice: number;
        currency: string;
    };
}

interface RoomsStepProps {
    onComplete?: (data: any) => void;
    existingData?: {
        rooms?: RoomType[];
    };
    onUpdate?: (data: any) => void;
}

export function RoomsStep({ onComplete, existingData, onUpdate }: RoomsStepProps) {
    const [rooms, setRooms] = useState<RoomType[]>(existingData?.rooms || []);
    const [showWizard, setShowWizard] = useState(false);
    const [editingRoom, setEditingRoom] = useState<RoomType | null>(null);

    const handleAddRoom = () => {
        setEditingRoom(null);
        setShowWizard(true);
    };

    const handleEditRoom = (room: RoomType) => {
        setEditingRoom(room);
        setShowWizard(true);
    };

    const handleDeleteRoom = (roomId: string) => {
        const updatedRooms = rooms.filter(r => r.id !== roomId);
        setRooms(updatedRooms);
        if (onUpdate) {
            onUpdate({ rooms: updatedRooms });
        }
    };

    const handleSaveRoom = (room: RoomType) => {
        let updatedRooms: RoomType[];

        if (editingRoom) {
            // Update existing room
            updatedRooms = rooms.map(r => r.id === room.id ? room : r);
        } else {
            // Add new room
            updatedRooms = [...rooms, room];
        }

        setRooms(updatedRooms);
        setShowWizard(false);
        setEditingRoom(null);

        if (onUpdate) {
            onUpdate({ rooms: updatedRooms });
        }
    };

    const getBedSummary = (beds: BedConfig[]) => {
        return beds.map(bed => `${bed.quantity}x ${bed.type}`).join(', ');
    };

    const getRoomTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            standard: 'Standard Room',
            deluxe: 'Deluxe Room',
            suite: 'Suite',
            family: 'Family Room',
            executive: 'Executive Room',
            presidential: 'Presidential Suite'
        };
        return labels[type] || type;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Room Types & Pricing</h2>
                    <p className="text-gray-600 mt-1">Configure your different room types and their details</p>
                </div>
                {rooms.length > 0 && (
                    <Button
                        onClick={handleAddRoom}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        <Plus size={20} className="mr-2" />
                        Add Room Type
                    </Button>
                )}
            </div>

            {/* Room List or Empty State */}
            <AnimatePresence mode="wait">
                {rooms.length === 0 ? (
                    /* Empty State */
                    <motion.div
                        key="empty"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="text-center py-16"
                    >
                        <Card className="max-w-md mx-auto p-8 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-dashed border-blue-300">
                            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Bed size={40} className="text-blue-600" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Room Types Added Yet</h3>
                            <p className="text-gray-600 mb-6">
                                Start by adding your first room type. You can add multiple types like Standard, Deluxe, Suite, etc.
                            </p>
                            <Button
                                onClick={handleAddRoom}
                                size="lg"
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                <Plus size={20} className="mr-2" />
                                Add Your First Room Type
                            </Button>
                        </Card>
                    </motion.div>
                ) : (
                    /* Room Cards Grid */
                    <motion.div
                        key="rooms"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {rooms.map((room, index) => (
                            <motion.div
                                key={room.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <Card className="p-6 hover:shadow-lg transition-shadow">
                                    {/* Room Type Badge */}
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                                            {getRoomTypeLabel(room.type)}
                                        </span>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleEditRoom(room)}
                                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                            >
                                                <Edit3 size={16} className="text-gray-600" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteRoom(room.id)}
                                                className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={16} className="text-red-600" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Room Name */}
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{room.name}</h3>
                                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{room.description}</p>

                                    {/* Room Stats */}
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center text-gray-700">
                                            <Bed size={16} className="mr-2 text-gray-500" />
                                            <span>{getBedSummary(room.beds)}</span>
                                        </div>
                                        <div className="flex items-center text-gray-700">
                                            <Users size={16} className="mr-2 text-gray-500" />
                                            <span>Max {room.maxGuests} guests · {room.count} rooms</span>
                                        </div>
                                        <div className="flex items-center text-gray-700">
                                            <Ruler size={16} className="mr-2 text-gray-500" />
                                            <span>{room.size} m²</span>
                                        </div>
                                        <div className="flex items-center text-gray-900 font-semibold mt-4 pt-4 border-t">
                                            <DollarSign size={18} className="mr-1 text-green-600" />
                                            <span className="text-lg">{room.pricing.basePrice} {room.pricing.currency}/night</span>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Room Wizard Modal */}
            <RoomWizardModal
                isOpen={showWizard}
                onClose={() => setShowWizard(false)}
                onSave={handleSaveRoom}
                editingRoom={editingRoom}
            />
        </div>
    );
}
