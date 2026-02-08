
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft, Share2, Heart, MapPin, Star, Check, X, Calendar as CalendarIcon, Users, ChevronDown, Wifi, Coffee, Utensils, Car, Briefcase, Camera, Wine, Ticket, Music, Tv, Smartphone, CreditCard, Gift, Key } from 'lucide-react';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { getPackageById } from '@/features/package-creation/services/packageService';

export default function PackageDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [packageData, setPackageData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Booking State
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [guests, setGuests] = useState(2);
    const [isGuestOpen, setIsGuestOpen] = useState(false);

    useEffect(() => {
        const fetchPackage = async () => {
            if (!id) return;
            try {
                const data = await getPackageById(id);
                setPackageData(data);
            } catch (err: any) {
                console.error('Error fetching package:', err);
                setError(err.message || 'Failed to load package details');
            } finally {
                setLoading(false);
            }
        };

        fetchPackage();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
        highlights,
        inclusions,
        exclusions,
        package_type,
        cancellation_policy,
        payment_terms
    } = packageData;

    const allImages = media_urls && media_urls.length > 0
        ? media_urls
        : cover_image ? [cover_image] : [];

    // Calculate nights if dates selected
    const nights = dateRange?.from && dateRange?.to
        ? Math.round((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

    const basePrice = 599; // Placeholder - usually from DB
    const totalPrice = basePrice * guests;

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

                        {/* Highlights */}
                        {/* Highlights */}
                        {highlights && highlights.length > 0 && (
                            <div>
                                <h2 className="text-xl font-semibold mb-6">Package Highlights</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {highlights.map((highlight: string, idx: number) => {
                                        // Simple logic to match icons based on keywords
                                        // This duplicates logic from AnimatedHighlightIcons but keeps component self-contained for now
                                        // or we can import getIconForHighlight if we export it properly.
                                        // Let's try to dynamic import or use a helper component.

                                        // Helper Component for Icon
                                        const HighlightIconItem = ({ text }: { text: string }) => {
                                            const lower = text.toLowerCase();
                                            let Icon = Star;

                                            // Mapping based on AnimatedHighlightIcons keywords
                                            if (lower.includes('wifi') || lower.includes('internet')) Icon = Wifi;
                                            else if (lower.includes('coffee') || lower.includes('tea') || lower.includes('breakfast')) Icon = Coffee;
                                            else if (lower.includes('dinner') || lower.includes('food') || lower.includes('dining')) Icon = Utensils;
                                            else if (lower.includes('transfer') || lower.includes('transport') || lower.includes('pickup')) Icon = Car;
                                            else if (lower.includes('family') || lower.includes('kid')) Icon = Users;
                                            else if (lower.includes('business') || lower.includes('work')) Icon = Briefcase;
                                            else if (lower.includes('view') || lower.includes('location')) Icon = MapPin;
                                            else if (lower.includes('photo')) Icon = Camera;
                                            else if (lower.includes('wine') || lower.includes('champagne') || lower.includes('drink')) Icon = Wine;
                                            else if (lower.includes('ticket') || lower.includes('entry') || lower.includes('pass')) Icon = Ticket;
                                            else if (lower.includes('music') || lower.includes('entertainment')) Icon = Music;
                                            else if (lower.includes('tv') || lower.includes('movie')) Icon = Tv;
                                            else if (lower.includes('smart') || lower.includes('app')) Icon = Smartphone;
                                            else if (lower.includes('credit')) Icon = CreditCard;
                                            else if (lower.includes('welcome') || lower.includes('gift')) Icon = Gift;
                                            else if (lower.includes('access') || lower.includes('key')) Icon = Key;

                                            return <Icon size={16} />;
                                        };

                                        return (
                                            <div key={idx} className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                                    <HighlightIconItem text={highlight} />
                                                </div>
                                                <span className="text-gray-700">{highlight}</span>
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
                    </div>

                    {/* Sticky Sidebar - Booking Card */}
                    <div className="relative">
                        <div className="sticky top-24 border border-gray-200 rounded-xl p-6 shadow-xl shadow-gray-100/50 bg-white">
                            <div className="flex items-end gap-2 mb-6">
                                <span className="text-2xl font-bold text-gray-900">${basePrice}</span>
                                <span className="text-gray-500 mb-1">/ person</span>
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
                                            <Calendar
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
                                                        onClick={() => setGuests(guests + 1)}
                                                    >
                                                        +
                                                    </Button>
                                                </div>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                <Button className="w-full h-12 text-lg font-semibold bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
                                    Request to Book
                                </Button>

                                {nights > 0 && (
                                    <div className="pt-4 border-t border-gray-100 space-y-2">
                                        <div className="flex justify-between text-gray-600">
                                            <span>${basePrice} x {guests} guests</span>
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
                    </div>
                </div>
            </main>
        </div>
    );
}
