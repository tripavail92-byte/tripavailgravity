import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, MapPin, Clock, BadgeCheck, Loader2, ChevronRight, Luggage } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { bookingService } from '@/features/booking/services/bookingService';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass';
import { Badge } from '@/components/ui/badge';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

type BookingStatus = 'confirmed' | 'pending' | 'cancelled' | 'completed';

export default function MyTripsPage() {
    const { user } = useAuth();
    const [bookings, setBookings] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

    useEffect(() => {
        if (user?.id) {
            loadBookings();
        }
    }, [user?.id]);

    const loadBookings = async () => {
        try {
            setIsLoading(true);
            const data = await bookingService.getTravelerBookings(user!.id);
            setBookings(data);
        } catch (error) {
            console.error('Failed to load bookings:', error);
            toast.error('Failed to load your trips');
        } finally {
            setIsLoading(false);
        }
    };

    const upcomingTrips = bookings.filter(b => {
        const date = b.booking_date || b.start_time || b.check_in_date;
        return new Date(date) >= new Date() && b.status !== 'cancelled';
    });

    const pastTrips = bookings.filter(b => {
        const date = b.booking_date || b.start_time || b.check_in_date;
        return new Date(date) < new Date() || b.status === 'cancelled';
    });

    const displayedTrips = activeTab === 'upcoming' ? upcomingTrips : pastTrips;

    const getStatusColor = (status: BookingStatus) => {
        switch (status) {
            case 'confirmed': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
            case 'pending': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
            case 'cancelled': return 'bg-rose-500/10 text-rose-600 border-rose-500/20';
            case 'completed': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
            default: return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                <p className="text-gray-500 font-medium">Preparing your itinerary...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20">
            {/* Header */}
            <div className="bg-white border-b border-gray-100 sticky top-0 z-20">
                <div className="max-w-4xl mx-auto px-4 h-20 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                            <Luggage className="w-6 h-6 text-primary" />
                            My Trips
                        </h1>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                            {bookings.length} TOTAL BOOKINGS
                        </p>
                    </div>

                    <div className="flex bg-gray-100 p-1 rounded-xl">
                        {(['upcoming', 'past'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                                    activeTab === tab 
                                    ? 'bg-white text-primary shadow-sm' 
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-10">
                <AnimatePresence mode="wait">
                    {displayedTrips.length === 0 ? (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-3xl border border-dashed border-gray-200 p-12 text-center"
                        >
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Calendar className="w-8 h-8 text-gray-300" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 mb-2">No {activeTab} trips found</h2>
                            <p className="text-gray-500 max-w-xs mx-auto mb-8">
                                {activeTab === 'upcoming' 
                                    ? "Looks like you haven't booked any adventures yet. Time to start planning!" 
                                    : "You don't have any past trips in your history."}
                            </p>
                            {activeTab === 'upcoming' && (
                                <Button asChild className="rounded-full px-8">
                                    <a href="/explore">Browse Experiences</a>
                                </Button>
                            )}
                        </motion.div>
                    ) : (
                        <div className="space-y-6">
                            {displayedTrips.map((trip, idx) => {
                                const details = trip.tours || trip.packages;
                                const date = trip.booking_date || trip.start_time || trip.check_in_date;
                                
                                return (
                                    <motion.div
                                        key={trip.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                    >
                                        <GlassCard variant="card" className="p-0 overflow-hidden rounded-3xl group border-none shadow-sm hover:shadow-xl transition-all duration-500">
                                            <div className="flex flex-col md:flex-row">
                                                {/* Left: Image */}
                                                <div className="w-full md:w-64 h-48 md:h-auto relative overflow-hidden">
                                                    <img 
                                                        src={details?.main_image || details?.cover_image || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1'} 
                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                                                        alt={details?.title || details?.name}
                                                    />
                                                    <div className="absolute top-4 left-4">
                                                        <Badge className={`backdrop-blur-md border-none px-3 py-1 font-bold text-[10px] uppercase tracking-wider ${getStatusColor(trip.status)}`}>
                                                            {trip.status}
                                                        </Badge>
                                                    </div>
                                                </div>

                                                {/* Right: Content */}
                                                <div className="flex-1 p-6 md:p-8 flex flex-col justify-between">
                                                    <div>
                                                        <div className="flex items-start justify-between gap-4 mb-2">
                                                            <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-widest">
                                                                <MapPin className="w-3 h-3" />
                                                                {details?.location?.city || details?.location || 'Unknown'}
                                                            </div>
                                                            <div className="text-xs font-bold text-gray-400 tabular-nums">
                                                                ID: #{trip.id.slice(0, 8).toUpperCase()}
                                                            </div>
                                                        </div>
                                                        
                                                        <h3 className="text-xl font-black text-gray-900 mb-4 group-hover:text-primary transition-colors">
                                                            {details?.title || details?.name}
                                                        </h3>

                                                        <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center">
                                                                    <Calendar className="w-4 h-4 text-gray-400" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-none mb-1">Date</p>
                                                                    <p className="text-sm font-bold text-gray-900 leading-none">
                                                                        {date ? format(new Date(date), 'MMM dd, yyyy') : 'No date'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center">
                                                                    <Clock className="w-4 h-4 text-gray-400" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-none mb-1">Duration</p>
                                                                    <p className="text-sm font-bold text-gray-900 leading-none">
                                                                        {details?.duration || `${details?.duration_days} Days` || 'N/A'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Total Paid</span>
                                                            <span className="text-lg font-black text-gray-900 leading-none">
                                                                ${trip.total_price?.toLocaleString()}
                                                            </span>
                                                        </div>
                                                        <Button variant="outline" className="rounded-full px-6 group/btn">
                                                            Details
                                                            <ChevronRight className="w-4 h-4 ml-1 group-hover/btn:translate-x-1 transition-transform" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </GlassCard>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </AnimatePresence>

                {/* Info Card */}
                <div className="mt-12 bg-primary/5 rounded-3xl p-8 border border-primary/10 flex items-start gap-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm">
                        <BadgeCheck className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h4 className="text-lg font-bold text-gray-900 mb-1">Safe and Secure Bookings</h4>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            All your bookings are protected by our satisfaction guarantee. You can manage your cancellations and refunds directly from the trip details page if you need to make changes.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
