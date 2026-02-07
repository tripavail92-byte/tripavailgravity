import { useState, useEffect } from 'react';
import { DollarSign, Plus, Check, Bed, Users, Ruler, Loader2, AlertCircle, TrendingDown, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { RoomWizardModal } from '../../../hotel-listing/components/steps/RoomWizardModal';
import { RoomType } from '../../../hotel-listing/components/steps/RoomsStep';
import { StepData } from '../../types';
import { cn } from '@/lib/utils';

interface PricingStepProps {
    onComplete: (data: StepData) => void;
    onUpdate: (data: StepData) => void;
    existingData?: StepData;
    onBack: () => void;
}

interface SelectedRoom {
    roomId: string;
    roomName: string;
    originalPrice: number;
    packagePrice: number;
    currency: string;
    maxGuests: number;
    size: number;
    roomType: string;
}

export function PricingStep({ onComplete, onUpdate, existingData, onBack }: PricingStepProps) {
    const [hotelRooms, setHotelRooms] = useState<RoomType[]>([]);
    const [selectedRooms, setSelectedRooms] = useState<Map<string, SelectedRoom>>(new Map());
    const [loading, setLoading] = useState(false);
    const [showWizard, setShowWizard] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch hotel rooms from backend (simulated for now)
    const fetchHotelRooms = async () => {
        setLoading(true);
        setError(null);
        try {
            // TODO: Replace with actual API call
            // const response = await fetch('/api/hotels/${hotelId}/rooms');
            // const data = await response.json();

            // Simulated data for now - in production, fetch from backend
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Check if we have rooms in existing hotel listing data
            // This would normally come from the backend
            const mockRooms: RoomType[] = existingData?.hotelRooms as RoomType[] || [];

            setHotelRooms(mockRooms);

            if (mockRooms.length === 0) {
                setError('No rooms found in your hotel listing. Add rooms to continue.');
            }
        } catch (err) {
            setError('Failed to load hotel rooms. Please try again.');
            console.error('Error fetching rooms:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHotelRooms();

        // Load previously selected rooms if any
        if (existingData?.selectedRooms) {
            const roomsMap = new Map(Object.entries(existingData.selectedRooms as Record<string, SelectedRoom>));
            setSelectedRooms(roomsMap);
        }
    }, []);

    const toggleRoomSelection = (room: RoomType) => {
        const newSelected = new Map(selectedRooms);

        if (newSelected.has(room.id)) {
            newSelected.delete(room.id);
        } else {
            newSelected.set(room.id, {
                roomId: room.id,
                roomName: room.name,
                originalPrice: room.pricing.basePrice,
                packagePrice: room.pricing.basePrice, // Default to original price
                currency: room.pricing.currency,
                maxGuests: room.maxGuests,
                size: room.size,
                roomType: room.type
            });
        }

        setSelectedRooms(newSelected);

        // Update package data
        const roomsObject = Object.fromEntries(newSelected);
        onUpdate({ selectedRooms: roomsObject });
    };

    const updateRoomPrice = (roomId: string, newPrice: number) => {
        const newSelected = new Map(selectedRooms);
        const room = newSelected.get(roomId);

        if (room) {
            room.packagePrice = newPrice;
            newSelected.set(roomId, room);
            setSelectedRooms(newSelected);

            // Update package data
            const roomsObject = Object.fromEntries(newSelected);
            onUpdate({ selectedRooms: roomsObject });
        }
    };

    const handleAddNewRoom = async (room: RoomType) => {
        try {
            // TODO: Make API call to create room in backend
            // This should create the room in hotel listing AND make it available here
            // const response = await fetch('/api/hotels/${hotelId}/rooms', {
            //   method: 'POST',
            //   body: JSON.stringify({ room, source: 'package_creation' })
            // });
            // const newRoom = await response.json();

            // For now, add to local state
            setHotelRooms(prev => [...prev, room]);
            setShowWizard(false);

            // Auto-select the newly added room
            toggleRoomSelection(room);
        } catch (err) {
            console.error('Error creating room:', err);
            setError('Failed to create room. Please try again.');
        }
    };

    const getPriceDifference = (originalPrice: number, packagePrice: number) => {
        const diff = packagePrice - originalPrice;
        const percentage = ((diff / originalPrice) * 100).toFixed(0);
        return { diff, percentage };
    };

    const getPriceRange = () => {
        if (selectedRooms.size === 0) return null;

        const prices = Array.from(selectedRooms.values()).map(r => r.packagePrice);
        return {
            min: Math.min(...prices),
            max: Math.max(...prices),
            currency: Array.from(selectedRooms.values())[0]?.currency || 'USD'
        };
    };

    const handleContinue = () => {
        if (selectedRooms.size === 0) {
            setError('Please select at least one room to continue.');
            return;
        }

        const roomsObject = Object.fromEntries(selectedRooms);
        onComplete({
            selectedRooms: roomsObject,
            priceRange: getPriceRange()
        });
    };

    const priceRange = getPriceRange();

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Package Pricing</h2>
                <p className="text-gray-600">Select rooms from your hotel and set package prices</p>
            </div>

            {/* Info Banner */}
            <Card className="p-4 bg-info/5 border-info/20">
                <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-info mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-gray-700">
                        <p className="font-medium mb-1">Pricing from your hotel listing</p>
                        <p>Prices default to your hotel room rates. You can override them for package-specific pricing. New rooms added here will automatically sync to your hotel listing.</p>
                    </div>
                </div>
            </Card>

            {/* Selected Rooms Summary */}
            {selectedRooms.size > 0 && (
                <Card className="p-6 bg-success/5 border-success/20">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Check className="w-5 h-5 text-success" />
                            <div>
                                <h3 className="font-semibold text-gray-900">
                                    {selectedRooms.size} room{selectedRooms.size !== 1 ? 's' : ''} selected
                                </h3>
                                {priceRange && (
                                    <p className="text-sm text-gray-600">
                                        Price range: {priceRange.currency} {priceRange.min}
                                        {priceRange.min !== priceRange.max && ` - ${priceRange.max}`} per night
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </Card>
            )}

            {/* Loading State */}
            {loading && (
                <Card className="p-12">
                    <div className="flex flex-col items-center justify-center gap-4">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <p className="text-gray-600">Loading hotel rooms...</p>
                    </div>
                </Card>
            )}

            {/* Error State */}
            {error && !loading && (
                <Card className="p-6 bg-error/5 border-error/20">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-error mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                            <p className="text-sm text-gray-700">{error}</p>
                        </div>
                    </div>
                </Card>
            )}

            {/* Room Cards */}
            {!loading && hotelRooms.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">Available Rooms</h3>
                        <Button onClick={() => setShowWizard(true)} variant="outline">
                            <Plus size={18} className="mr-2" />
                            Add New Room
                        </Button>
                    </div>

                    <div className="grid gap-4">
                        {hotelRooms.map(room => {
                            const isSelected = selectedRooms.has(room.id);
                            const selectedRoom = selectedRooms.get(room.id);
                            const bedSummary = room.beds.map(b => `${b.quantity}x ${b.type}`).join(', ');

                            let priceDiff = null;
                            if (selectedRoom && selectedRoom.packagePrice !== selectedRoom.originalPrice) {
                                priceDiff = getPriceDifference(selectedRoom.originalPrice, selectedRoom.packagePrice);
                            }

                            return (
                                <Card
                                    key={room.id}
                                    className={cn(
                                        "p-6 transition-all cursor-pointer",
                                        isSelected ? "border-primary bg-primary/5" : "hover:border-gray-300"
                                    )}
                                    onClick={() => !isSelected && toggleRoomSelection(room)}
                                >
                                    <div className="flex items-start gap-4">
                                        {/* Selection Checkbox */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleRoomSelection(room);
                                            }}
                                            className={cn(
                                                "w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all mt-1",
                                                isSelected
                                                    ? "bg-primary border-primary"
                                                    : "border-gray-300 hover:border-primary"
                                            )}
                                        >
                                            {isSelected && <Check size={16} className="text-white" />}
                                        </button>

                                        {/* Room Details */}
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <h4 className="font-semibold text-gray-900 text-lg">{room.name}</h4>
                                                    <Badge variant="outline" className="mt-1">
                                                        {room.type}
                                                    </Badge>
                                                </div>
                                            </div>

                                            {room.description && (
                                                <p className="text-sm text-gray-600 mb-3">{room.description}</p>
                                            )}

                                            {/* Room Info */}
                                            <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                                                <div className="flex items-center gap-1.5">
                                                    <Users size={16} className="text-gray-400" />
                                                    <span>Up to {room.maxGuests} guests</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Ruler size={16} className="text-gray-400" />
                                                    <span>{room.size} m²</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Bed size={16} className="text-gray-400" />
                                                    <span>{bedSummary}</span>
                                                </div>
                                            </div>

                                            {/* Pricing Section */}
                                            {isSelected ? (
                                                <div className="bg-white rounded-lg p-4 border border-gray-200">
                                                    <div className="grid md:grid-cols-2 gap-4">
                                                        {/* Original Price */}
                                                        <div>
                                                            <Label className="text-xs text-gray-500 mb-1 block">
                                                                Original Hotel Price
                                                            </Label>
                                                            <div className="text-lg font-semibold text-gray-700">
                                                                {room.pricing.currency} {room.pricing.basePrice}
                                                                <span className="text-sm font-normal text-gray-500">/night</span>
                                                            </div>
                                                        </div>

                                                        {/* Package Price */}
                                                        <div>
                                                            <Label htmlFor={`price-${room.id}`} className="text-xs text-gray-700 font-medium mb-1 block">
                                                                Package Price
                                                            </Label>
                                                            <div className="flex items-center gap-2">
                                                                <div className="relative flex-1">
                                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                                                                        {room.pricing.currency}
                                                                    </span>
                                                                    <Input
                                                                        id={`price-${room.id}`}
                                                                        type="number"
                                                                        min="0"
                                                                        value={selectedRoom?.packagePrice || room.pricing.basePrice}
                                                                        onChange={(e) => updateRoomPrice(room.id, parseInt(e.target.value) || 0)}
                                                                        onClick={(e) => e.stopPropagation()}
                                                                        className="pl-16"
                                                                    />
                                                                </div>
                                                                {priceDiff && (
                                                                    <div className={cn(
                                                                        "flex items-center gap-1 text-sm font-medium px-2 py-1 rounded",
                                                                        priceDiff.diff > 0
                                                                            ? "text-warning bg-warning/10"
                                                                            : "text-success bg-success/10"
                                                                    )}>
                                                                        {priceDiff.diff > 0 ? (
                                                                            <TrendingUp size={14} />
                                                                        ) : (
                                                                            <TrendingDown size={14} />
                                                                        )}
                                                                        {Math.abs(parseInt(priceDiff.percentage))}%
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <DollarSign size={18} className="text-primary" />
                                                    <span className="text-lg font-semibold text-gray-900">
                                                        {room.pricing.currency} {room.pricing.basePrice}
                                                    </span>
                                                    <span className="text-sm text-gray-500">/night</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Room Wizard Modal */}
            {showWizard && (
                <RoomWizardModal
                    onClose={() => setShowWizard(false)}
                    onSave={handleAddNewRoom}
                    existingRoom={null}
                />
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6">
                <Button variant="outline" onClick={onBack}>
                    Back
                </Button>
                <Button onClick={handleContinue} disabled={selectedRooms.size === 0}>
                    Continue
                </Button>
            </div>
        </div>
    );
}
