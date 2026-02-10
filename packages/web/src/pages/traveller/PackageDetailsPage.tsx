import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Loader2, ArrowLeft, Share2, Heart, MapPin, Star, Check, X, Calendar as CalendarIcon, Users,
    ChevronDown, Wifi, Coffee, Utensils, Car, Briefcase, Camera, Wine, Ticket, Music, Tv, Smartphone,
    CreditCard, Gift, Key, Sparkles, Shield, Globe, Bed, Clock, Bus, Plane, ChevronLeft, ChevronRight, Info
} from 'lucide-react';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { getPackageById } from '@/features/package-creation/services/packageService';
import { supabase } from '@/lib/supabase';
import { packageBookingService } from '@/features/booking';



import { getAmenityIcon } from '@/features/hotel-listing/assets/AnimatedAmenityIcons';

// Helper to normalize amenity strings to kebab-case for centralized icon lookup
const normalizeAmenityId = (amenityStr: string): string => {
    return amenityStr
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
};

// Helper to get amenity display config using centralized icon system
const getAmenityConfig = (amenityStr: string) => {
    const normalizedId = normalizeAmenityId(amenityStr);
    const IconComponent = getAmenityIcon(normalizedId);

    return {
        Icon: IconComponent,
        label: amenityStr
    };
};


export default function PackageDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [packageData, setPackageData] = useState<any>(null);
    const [roomData, setRoomData] = useState<any[]>([]);
    const [aggregatedAmenities, setAggregatedAmenities] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Booking State
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [guests, setGuests] = useState(2);
    const [isGuestOpen, setIsGuestOpen] = useState(false);
    const [priceQuote, setPriceQuote] = useState<{ total_price: number; price_per_night: number; number_of_nights: number } | null>(null);
    const [availabilityError, setAvailabilityError] = useState<string | null>(null);
    const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            try {
                // 1. Fetch Package Data
                const pkg = await getPackageById(id);
                setPackageData(pkg);

                // 2. Fetch Linked Hotel & Room Amenities
                const amenitiesSet = new Set<string>();

                // Add Package Highlights first
                if (pkg.highlights) pkg.highlights.forEach((h: string) => amenitiesSet.add(h));

                // Fetch Hotel Amenities
                if (pkg.hotel_id) {
                    const { data: hotel, error: hError } = await supabase
                        .from('hotels')
                        .select('amenities')
                        .eq('id', pkg.hotel_id)
                        .single();

                    if (hError) {
                        throw new Error(`Hotel Fetch Failed: ${hError.message} (${hError.code})`);
                    }

                    if (hotel?.amenities) {
                        hotel.amenities.forEach((a: string) => amenitiesSet.add(a));
                    }
                }

                // Fetch Room Amenities (if linked)
                if (pkg.room_ids && pkg.room_ids.length > 0) {
                    const { data: rooms, error: rError } = await supabase
                        .from('rooms')
                        .select('amenities')
                        .in('id', pkg.room_ids);

                    if (rError) {
                        throw new Error(`Room Fetch Failed: ${rError.message} (${rError.code})`);
                    }

                    if (rooms) {
                        setRoomData(rooms);
                        rooms.forEach(room => {
                            if (room.amenities && Array.isArray(room.amenities)) {
                                (room.amenities as string[]).forEach(a => amenitiesSet.add(a));
                            }
                        });
                    }
                }

                setAggregatedAmenities(Array.from(amenitiesSet));

            } catch (err: any) {
                console.error('Error fetching data:', err);
                setError(err.message || 'Failed to load package details');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    const formatDateParam = (date: Date) => format(date, 'yyyy-MM-dd');

    useEffect(() => {
        const checkAvailabilityAndPrice = async () => {
            if (!id || !dateRange?.from || !dateRange?.to) {
                setPriceQuote(null);
                setAvailabilityError(null);
                return;
            }

            const minNightsLocal = Number(packageData?.minimum_nights ?? 1);
            const maxNightsLocal = Number(packageData?.maximum_nights ?? 30);
            const nightsLocal = Math.round(
                (dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)
            );

            if (nightsLocal > 0 && (nightsLocal < minNightsLocal || nightsLocal > maxNightsLocal)) {
                setPriceQuote(null);
                setAvailabilityError(
                    nightsLocal < minNightsLocal
                        ? `Minimum ${minNightsLocal} nights required`
                        : `Maximum ${maxNightsLocal} nights allowed`
                );
                return;
            }

            const checkIn = formatDateParam(dateRange.from);
            const checkOut = formatDateParam(dateRange.to);

            setIsCheckingAvailability(true);
            setAvailabilityError(null);

            try {
                const isAvailable = await packageBookingService.checkAvailability(
                    id,
                    checkIn,
                    checkOut
                );

                if (!isAvailable) {
                    setPriceQuote(null);
                    setAvailabilityError('Selected dates are not available. Please choose different dates.');
                    return;
                }

                const pricing = await packageBookingService.calculatePrice(
                    id,
                    checkIn,
                    checkOut
                );

                setPriceQuote(pricing);
            } catch (err: any) {
                setPriceQuote(null);
                setAvailabilityError(err?.message || 'Failed to check availability');
            } finally {
                setIsCheckingAvailability(false);
            }
        };

        checkAvailabilityAndPrice();
    }, [dateRange?.from, dateRange?.to, id, packageData?.minimum_nights, packageData?.maximum_nights]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center flex-col gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-gray-500">Loading package details...</p>
            </div>
        );
    }

    // DEBUG: Show specific error if fetch failed
    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <h1 className="text-2xl font-bold text-red-600 mb-2">Error Loading Package</h1>
                <div className="bg-red-50 p-4 rounded-lg border border-red-200 max-w-md w-full overflow-auto">
                    <p className="font-mono text-sm text-red-800">{String(error)}</p>
                    {/* Show more details if available */}
                    <pre className="text-xs text-red-600 mt-2 whitespace-pre-wrap">
                        {JSON.stringify(error, null, 2)}
                    </pre>
                </div>
                <Button className="mt-6" onClick={() => navigate('/')}>Return Home</Button>
            </div>
        );
    }

    if (error || !packageData) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Package Not Found</h1>
                <p className="text-gray-600 mb-6">{error || "The package you're looking for doesn't exist or has been removed."}</p>
                <Button onClick={() => navigate('/')}>Return Home</Button>
            </div>
        );
    }

    const {
        name,
        description,
        media_urls,
        cover_image,
        inclusions,
        exclusions,
        package_type,
        cancellation_policy,
        payment_terms,
        hotel // We need hotel name/location
    } = packageData || {};

    const allImages = media_urls && media_urls.length > 0
        ? media_urls
        : cover_image ? [cover_image] : [];

    // ... rest of the component


    // Calculate nights if dates selected
    const nights = dateRange?.from && dateRange?.to
        ? Math.round((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24))
        : 0;
    const minNights = Number(packageData?.minimum_nights ?? 1);
    const maxNights = Number(packageData?.maximum_nights ?? 30);
    const isStayLengthValid = nights <= 0 || (nights >= minNights && nights <= maxNights);
    const stayLengthMessage = nights <= 0
        ? `Minimum ${minNights} night${minNights !== 1 ? 's' : ''} · Maximum ${maxNights} nights`
        : isStayLengthValid
            ? `Minimum ${minNights} night${minNights !== 1 ? 's' : ''} · Maximum ${maxNights} nights`
            : nights < minNights
                ? `Minimum ${minNights} nights required`
                : `Maximum ${maxNights} nights allowed`;
    const basePrice = Number(packageData?.base_price_per_night || 0);
    const displayBasePrice = priceQuote?.price_per_night || basePrice;
    const totalPrice = priceQuote?.total_price || 0;
    const maxGuests = packageData?.max_guests || 4;

    const handleRequestToBook = async () => {
        if (!id || !dateRange?.from || !dateRange?.to) {
            setAvailabilityError('Please select check-in and check-out dates.');
            return;
        }

        if (!isStayLengthValid) {
            setAvailabilityError(stayLengthMessage);
            return;
        }

        const checkIn = formatDateParam(dateRange.from);
        const checkOut = formatDateParam(dateRange.to);

        setIsCheckingAvailability(true);
        setAvailabilityError(null);

        try {
            const isAvailable = await packageBookingService.checkAvailability(
                id,
                checkIn,
                checkOut
            );

            if (!isAvailable) {
                setAvailabilityError('Selected dates are not available. Please choose different dates.');
                return;
            }

            const pricing = priceQuote || await packageBookingService.calculatePrice(
                id,
                checkIn,
                checkOut
            );

            navigate(`/checkout/package/${id}`, {
                state: {
                    checkIn,
                    checkOut,
                    guestCount: guests,
                    pricing,
                },
            });
        } catch (err: any) {
            setAvailabilityError(err?.message || 'Unable to start booking');
        } finally {
            setIsCheckingAvailability(false);
        }
    };

    return (
        <div className="min-h-screen bg-white pb-20">
            {/* Header / Nav */}
            <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2">
                        <ArrowLeft size={16} />
                        Back
                    </Button>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon">
                            <Share2 size={18} />
                        </Button>
                        <Button variant="ghost" size="icon">
                            <Heart size={18} />
                        </Button>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 py-6">
                {/* Hero Gallery */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2 h-[300px] md:h-[400px] rounded-2xl overflow-hidden mb-8">
                    <div className="md:col-span-2 h-full bg-gray-100 relative">
                        {allImages[0] ? (
                            <img src={allImages[0]} alt={name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500 cursor-pointer" />
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-400">No Image</div>
                        )}
                    </div>
                    <div className="hidden md:grid grid-rows-2 gap-2 h-full">
                        <div className="bg-gray-100 h-full relative overflow-hidden">
                            {allImages[1] && <img src={allImages[1]} alt={name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500 cursor-pointer" />}
                        </div>
                        <div className="bg-gray-100 h-full relative overflow-hidden">
                            {allImages[2] && <img src={allImages[2]} alt={name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500 cursor-pointer" />}
                        </div>
                    </div>
                    <div className="hidden md:grid grid-rows-2 gap-2 h-full">
                        <div className="bg-gray-100 h-full relative overflow-hidden">
                            {allImages[3] && <img src={allImages[3]} alt={name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500 cursor-pointer" />}
                        </div>
                        <div className="bg-gray-100 h-full relative overflow-hidden">
                            {allImages[4] && <img src={allImages[4]} alt={name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500 cursor-pointer" />}
                            {allImages.length > 5 && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-medium cursor-pointer hover:bg-black/40 transition-colors">
                                    +{allImages.length - 5} photos
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Title Section */}
                        <div>
                            <div className="flex items-start justify-between mb-2">
                                <div>
                                    <Badge variant="secondary" className="mb-3 capitalize">{package_type?.replace('-', ' ') || 'Custom Package'}</Badge>
                                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{name}</h1>
                                    <div className="flex items-center gap-4 text-sm text-gray-500">
                                        <div className="flex items-center gap-1">
                                            <Star size={16} className="text-yellow-400 fill-yellow-400" />
                                            <span className="font-medium text-gray-900">New</span>
                                        </div>
                                        <span className="w-1 h-1 bg-gray-300 rounded-full" />
                                        <div className="flex items-center gap-1">
                                            <MapPin size={16} />
                                            <span>Multiple Locations</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="h-px bg-gray-200" />

                        {/* Description */}
                        <div>
                            <h2 className="text-xl font-semibold mb-4">About this package</h2>
                            <p className="text-gray-600 leading-relaxed whitespace-pre-line">{description || "No description provided."}</p>
                        </div>

                        <div className="h-px bg-gray-200" />

                        {/* Accommodation Details (Room) */}
                        {roomData && roomData.length > 0 && (
                            <>
                                <div>
                                    <h2 className="text-xl font-semibold mb-4">Accommodation</h2>
                                    {roomData.map((room: any, idx: number) => (
                                        <div key={idx} className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                                            <div className="flex items-start justify-between mb-4">
                                                <div>
                                                    <h3 className="text-lg font-bold text-gray-900">{room.name}</h3>
                                                    <p className="text-sm text-gray-500">{hotel?.name}</p>
                                                </div>
                                            </div>

                                            {room.description && (
                                                <p className="text-gray-600 text-sm mb-4 leading-relaxed">{room.description}</p>
                                            )}

                                            {/* Room Specific Amenities */}
                                            {room.amenities && room.amenities.length > 0 && (
                                                <div>
                                                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Room Features</h4>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        {room.amenities.map((amenity: string, i: number) => {
                                                            const { Icon, label } = getAmenityConfig(amenity);
                                                            return (
                                                                <div key={i} className="flex flex-col items-center justify-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group">
                                                                    {/* Icon Rendering */}
                                                                    <div className="mb-2 text-primary group-hover:scale-110 transition-transform duration-300">
                                                                        <Icon size={32} isSelected={true} />
                                                                    </div>
                                                                    <span className="text-xs font-medium text-gray-700 text-center">{label}</span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <div className="h-px bg-gray-200" />
                            </>
                        )}

                        {/* Free Inclusions & Exclusive Offers Grid */}
                        {(packageData.free_inclusions?.length > 0 || packageData.discount_offers?.length > 0) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Free Inclusions */}
                                {packageData.free_inclusions?.length > 0 && (
                                    <div>
                                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                            <Sparkles className="w-5 h-5 text-primary" />
                                            Included Perks
                                        </h3>
                                        <div className="space-y-3">
                                            {packageData.free_inclusions.map((item: any, idx: number) => {
                                                const { Icon, label } = getAmenityConfig(item.name);
                                                // Note: reusing getAmenityConfig for icons as it covers most inclusive bases
                                                return (
                                                    <div key={idx} className="flex items-start gap-3 p-3 bg-green-50/50 border border-green-100 rounded-lg">
                                                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 shrink-0">
                                                            <Check size={14} strokeWidth={3} />
                                                        </div>
                                                        <span className="font-medium text-gray-900">{item.name}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Exclusive Discount Offers */}
                                {packageData.discount_offers?.length > 0 && (
                                    <div>
                                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                            <div className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-xs">%</div>
                                            Exclusive Offers
                                        </h3>
                                        <div className="space-y-3">
                                            {packageData.discount_offers.map((offer: any, idx: number) => (
                                                <div key={idx} className="flex items-center justify-between p-3 bg-white border border-orange-100 rounded-lg shadow-sm hover:shadow-md transition-all group">
                                                    <div>
                                                        <div className="font-medium text-gray-900 group-hover:text-primary transition-colors">{offer.name}</div>
                                                        <div className="flex items-center gap-2 text-sm mt-0.5">
                                                            <span className="line-through text-gray-400 text-xs">${offer.originalPrice}</span>
                                                            <span className="font-bold text-success">${(offer.originalPrice * (1 - offer.discount / 100)).toFixed(0)}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col items-end">
                                                        <Badge variant="secondary" className="bg-orange-100 text-orange-700 hover:bg-orange-200 border-none mb-1">
                                                            {offer.discount}% OFF
                                                        </Badge>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        {(packageData.free_inclusions?.length > 0 || packageData.discount_offers?.length > 0) && <div className="h-px bg-gray-200" />}


                        {/* Highlights & Aggregated Amenities */}
                        {aggregatedAmenities.length > 0 && (
                            <div>
                                <h2 className="text-xl font-semibold mb-6">Package Highlights & Amenities</h2>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {aggregatedAmenities.map((amenity: string, idx: number) => {
                                        const { Icon, label } = getAmenityConfig(amenity);
                                        return (
                                            <div key={idx} className="flex flex-col items-center justify-center p-6 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-all duration-300 group">
                                                <div className="mb-4 transform group-hover:scale-110 transition-transform duration-300">
                                                    <Icon size={40} isSelected={true} />
                                                </div>
                                                <span className="text-sm font-medium text-gray-900 text-center leading-snug">{label}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}


                        <div className="h-px bg-gray-200" />

                        {/* Inclusions / Exclusions */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h3 className="font-semibold mb-4 flex items-center gap-2">
                                    <Check className="text-green-500" size={20} />
                                    What's Included
                                </h3>
                                {inclusions && inclusions.length > 0 ? (
                                    <ul className="space-y-3">
                                        {inclusions.map((item: string, idx: number) => (
                                            <li key={idx} className="flex items-start gap-3 text-gray-600">
                                                <Check size={16} className="text-green-500 mt-1 shrink-0" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-gray-400 italic">No inclusions listed</p>
                                )}
                            </div>

                            <div>
                                <h3 className="font-semibold mb-4 flex items-center gap-2">
                                    <X className="text-red-500" size={20} />
                                    What's Excluded
                                </h3>
                                {exclusions && exclusions.length > 0 ? (
                                    <ul className="space-y-3">
                                        {exclusions.map((item: string, idx: number) => (
                                            <li key={idx} className="flex items-start gap-3 text-gray-600">
                                                <X size={16} className="text-red-500 mt-1 shrink-0" />
                                                <span className="break-all">{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-gray-400 italic">No exclusions listed</p>
                                )}
                            </div>
                        </div>

                        <div className="h-px bg-gray-200" />

                        {/* Policies */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {cancellation_policy && (
                                <div>
                                    <h3 className="font-semibold mb-2">Cancellation Policy</h3>
                                    <p className="text-gray-600 text-sm whitespace-pre-line">{cancellation_policy}</p>
                                </div>
                            )}
                            {payment_terms && (
                                <div>
                                    <h3 className="font-semibold mb-2">Payment Terms</h3>
                                    <p className="text-gray-600 text-sm whitespace-pre-line">{payment_terms}</p>
                                </div>
                            )}
                        </div>
                    </div >

                    {/* Sticky Sidebar - Booking Card */}
                    < div className="relative" >
                        <div className="sticky top-24 border border-gray-200 rounded-xl p-6 shadow-xl shadow-gray-100/50 bg-white">
                            <div className="flex items-end gap-2 mb-6">
                                <span className="text-2xl font-bold text-gray-900">
                                    {displayBasePrice > 0 ? `$${displayBasePrice}` : 'Price on request'}
                                </span>
                                {displayBasePrice > 0 && <span className="text-gray-500 mb-1">/ night</span>}
                            </div>

                            <div className="space-y-4 mb-6">
                                <div className="border border-gray-200 rounded-lg overflow-hidden">
                                    {/* Date Picker Trigger */}
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <div className="grid grid-cols-2 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                                                <div className="p-3 border-r border-gray-200">
                                                    <label className="text-xs font-bold text-gray-700 uppercase block mb-1">Check-in</label>
                                                    <span className={cn("text-sm", !dateRange?.from && "text-gray-400")}>
                                                        {dateRange?.from ? format(dateRange.from, 'MMM d') : 'Select'}
                                                    </span>
                                                </div>
                                                <div className="p-3">
                                                    <label className="text-xs font-bold text-gray-700 uppercase block mb-1">Check-out</label>
                                                    <span className={cn("text-sm", !dateRange?.to && "text-gray-400")}>
                                                        {dateRange?.to ? format(dateRange.to, 'MMM d') : 'Select'}
                                                    </span>
                                                </div>
                                            </div>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="end">
                                            <CalendarComponent
                                                initialFocus
                                                mode="range"
                                                defaultMonth={dateRange?.from}
                                                selected={dateRange}
                                                onSelect={setDateRange}
                                                numberOfMonths={2}
                                                disabled={(date) => date < new Date()}
                                            />
                                        </PopoverContent>
                                    </Popover>

                                    <div className="px-3 py-2 border-b border-gray-200">
                                        <p className={cn(
                                            'text-xs',
                                            isStayLengthValid ? 'text-gray-500' : 'text-red-600 font-medium'
                                        )}>
                                            {stayLengthMessage}
                                        </p>
                                    </div>

                                    {/* Guest Selector */}
                                    <Popover open={isGuestOpen} onOpenChange={setIsGuestOpen}>
                                        <PopoverTrigger asChild>
                                            <div className="p-3 cursor-pointer hover:bg-gray-50 transition-colors flex items-center justify-between">
                                                <div>
                                                    <label className="text-xs font-bold text-gray-700 uppercase block mb-1">Guests</label>
                                                    <span className="text-sm text-gray-900">{guests} guest{guests > 1 ? 's' : ''}</span>
                                                </div>
                                                <ChevronDown size={16} className="text-gray-400" />
                                            </div>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-full p-4" align="start">
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium text-sm">Guests</span>
                                                <div className="flex items-center gap-3">
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className="h-8 w-8 rounded-full"
                                                        onClick={() => setGuests(Math.max(1, guests - 1))}
                                                        disabled={guests <= 1}
                                                    >
                                                        -
                                                    </Button>
                                                    <span className="w-4 text-center">{guests}</span>
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className="h-8 w-8 rounded-full"
                                                        onClick={() => setGuests(Math.min(maxGuests, guests + 1))}
                                                        disabled={guests >= maxGuests}
                                                    >
                                                        +
                                                    </Button>
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-2">Max {maxGuests} guests</p>
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                <Button
                                    className="w-full h-12 text-lg font-semibold bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
                                    onClick={handleRequestToBook}
                                    disabled={isCheckingAvailability || !dateRange?.from || !dateRange?.to || !isStayLengthValid}
                                >
                                    {isCheckingAvailability ? 'Checking availability...' : 'Continue to Booking'}
                                </Button>

                                {availabilityError && (
                                    <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                        {availabilityError}
                                    </div>
                                )}

                                {nights > 0 && displayBasePrice > 0 && (
                                    <div className="pt-4 border-t border-gray-100 space-y-2">
                                        <div className="flex justify-between text-gray-600">
                                            <span>${displayBasePrice} x {nights} night{nights > 1 ? 's' : ''}</span>
                                            <span>${totalPrice}</span>
                                        </div>
                                        <div className="flex justify-between text-lg font-bold text-gray-900 pt-2">
                                            <span>Total</span>
                                            <span>${totalPrice}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                                <span className="w-2 h-2 rounded-full bg-green-500" />
                                Free cancellation available
                            </div>
                        </div>
                    </div >
                </div >
            </main >
            {/* Debug Section Removed */}

            <Footer />
        </div >
    );
}

function Footer() {
    return (
        <footer className="border-t border-gray-200 bg-gray-50 mt-12 py-12">
            <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                <div>
                    <h4 className="font-bold text-gray-900 mb-4">Support</h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                        <li><a href="#" className="hover:underline">Help Center</a></li>
                        <li><a href="#" className="hover:underline">AirCover</a></li>
                        <li><a href="#" className="hover:underline">Anti-discrimination</a></li>
                        <li><a href="#" className="hover:underline">Disability support</a></li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-bold text-gray-900 mb-4">Hosting</h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                        <li><a href="#" className="hover:underline">TripAvail your home</a></li>
                        <li><a href="#" className="hover:underline">AirCover for Hosts</a></li>
                        <li><a href="#" className="hover:underline">Hosting resources</a></li>
                        <li><a href="#" className="hover:underline">Community forum</a></li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-bold text-gray-900 mb-4">TripAvail</h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                        <li><a href="#" className="hover:underline">Newsroom</a></li>
                        <li><a href="#" className="hover:underline">New features</a></li>
                        <li><a href="#" className="hover:underline">Careers</a></li>
                        <li><a href="#" className="hover:underline">Investors</a></li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-bold text-gray-900 mb-4">Social</h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                        <li><a href="#" className="hover:underline">Twitter</a></li>
                        <li><a href="#" className="hover:underline">Instagram</a></li>
                        <li><a href="#" className="hover:underline">LinkedIn</a></li>
                        <li><a href="#" className="hover:underline">Facebook</a></li>
                    </ul>
                </div>
            </div>
            <div className="max-w-7xl mx-auto px-4 pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
                <p>© 2026 TripAvail, Inc. · Privacy · Terms · Sitemap</p>
                <div className="flex items-center gap-4 mt-4 md:mt-0">
                    <div className="flex items-center gap-1"><Globe size={14} /> English (US)</div>
                    <div>$ USD</div>
                </div>
            </div>
        </footer>
    );
}
