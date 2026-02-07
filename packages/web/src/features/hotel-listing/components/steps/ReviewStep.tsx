import { useState } from 'react';
import { Check, Edit3, MapPin, Building, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { motion } from 'motion/react';
import { HotelData } from '../CompleteHotelListingFlow';

interface ReviewStepProps {
    data: Partial<HotelData>;
    onEditStep: (stepId: number) => void;
    onPublish: () => void;
    isPublishing?: boolean;
}

export function ReviewStep({ data, onEditStep, onPublish, isPublishing }: ReviewStepProps) {
    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
    };

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Review & Publish</h2>
                <p className="text-gray-600 mt-1">Review your listing details before going live</p>
            </div>

            {/* Property Basics (Step 1-2) */}
            <Card className="p-6 relative group hover:border-primary/30 transition-all">
                <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => onEditStep(1)}
                >
                    <Edit3 size={16} className="mr-1" /> Edit
                </Button>
                <div className="flex gap-6">
                    {/* Cover Photo Preview */}
                    <div className="w-32 h-32 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                        {data.photos?.propertyPhotos?.find(p => p.isCover) ? (
                            <img
                                src={data.photos.propertyPhotos.find(p => p.isCover)?.url}
                                alt="Cover"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <Building size={32} />
                            </div>
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-info/10 text-info text-xs font-semibold px-2.5 py-0.5 rounded capitalize">
                                {data.propertyType}
                            </span>
                            {data.starRating && (
                                <div className="flex items-center text-yellow-500">
                                    <span className="text-sm font-bold mr-1">{data.starRating}</span>
                                    <Star size={14} fill="currentColor" />
                                </div>
                            )}
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1">{data.hotelName}</h3>
                        <div className="flex items-center text-gray-600 text-sm mb-4">
                            <MapPin size={16} className="mr-1" />
                            {data.location?.address}
                        </div>
                        <p className="text-gray-600 text-sm line-clamp-2">{data.description}</p>
                    </div>
                </div>
            </Card>

            {/* Rooms (Step 5) */}
            <Card className="p-6 relative group hover:border-blue-300 transition-all">
                <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => onEditStep(5)}
                >
                    <Edit3 size={16} className="mr-1" /> Edit
                </Button>
                <h3 className="font-semibold text-gray-900 mb-4">Room Types ({data.rooms?.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.rooms?.map((room) => (
                        <div key={room.id} className="p-4 border rounded-lg bg-gray-50">
                            <div className="flex justify-between items-start mb-2">
                                <span className="font-medium text-gray-900">{room.name}</span>
                                <span className="text-success font-semibold bg-success-foreground px-2 py-0.5 rounded text-xs">
                                    {formatCurrency(room.pricing.basePrice, room.pricing.currency)}
                                </span>
                            </div>
                            <div className="text-sm text-gray-600">
                                {room.count} unit{room.count !== 1 ? 's' : ''} • Max {room.maxGuests} guests
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Policies (Step 6) */}
            <Card className="p-6 relative group hover:border-blue-300 transition-all">
                <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => onEditStep(6)}
                >
                    <Edit3 size={16} className="mr-1" /> Edit
                </Button>
                <h3 className="font-semibold text-gray-900 mb-4">Policies</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold">Check-in</p>
                        <p className="text-gray-900 font-medium">{data.policies?.checkIn}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold">Check-out</p>
                        <p className="text-gray-900 font-medium">{data.policies?.checkOut}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold">Cancellation</p>
                        <p className="text-gray-900 font-medium capitalize">{data.policies?.cancellationPolicy}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold">Min Age</p>
                        <p className="text-gray-900 font-medium">{data.policies?.guestRequirements.minimumAge}+</p>
                    </div>
                </div>
            </Card>

            {/* Services (Step 8) */}
            <Card className="p-6 relative group hover:border-blue-300 transition-all">
                <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => onEditStep(8)}
                >
                    <Edit3 size={16} className="mr-1" /> Edit
                </Button>
                <h3 className="font-semibold text-gray-900 mb-4">Services & Facilities</h3>
                <div className="flex flex-wrap gap-2">
                    {data.services?.breakfast !== 'none' && (
                        <span className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700 border">Breakfast</span>
                    )}
                    {data.services?.parking !== 'none' && (
                        <span className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700 border">Parking</span>
                    )}
                    {data.services?.wifi !== 'none' && (
                        <span className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700 border">Wi-Fi</span>
                    )}
                    {Object.entries(data.services?.facilities || {}).map(([key, value]) =>
                        value ? (
                            <span key={key} className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700 border capitalize">
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                        ) : null
                    )}
                </div>
            </Card>

            {/* Publish Button */}
            <div className="flex justify-end pt-4">
                <Button
                    onClick={onPublish}
                    size="lg"
                    disabled={isPublishing}
                    className="bg-primary hover:bg-primary/90 text-white min-w-[200px]"
                >
                    {isPublishing ? (
                        <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            Publishing...
                        </>
                    ) : (
                        <>
                            <Check size={20} className="mr-2" />
                            Publish Listing
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
