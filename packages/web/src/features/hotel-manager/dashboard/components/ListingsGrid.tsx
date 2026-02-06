import { useEffect, useState } from 'react';
import { Plus, Grid, List, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ListingCard } from './ListingCard';
import { motion } from 'motion/react';
import { useAuth } from '@/hooks/useAuth';
import { hotelService } from '@/features/hotel-listing/services/hotelService';
import { useNavigate } from 'react-router-dom';

export function ListingsGrid() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [listings, setListings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.id) return;

        const fetchListings = async () => {
            setLoading(true);
            const result = await hotelService.fetchPublishedListings(user.id);
            if (result.success && result.listings) {
                setListings(result.listings);
            }
            setLoading(false);
        };

        fetchListings();
    }, [user?.id]);

    const handleNewListing = () => {
        navigate('/manager/list-hotel');
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
                    <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2].map((i) => (
                        <div key={i} className="h-96 bg-gray-200 rounded-xl animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-semibold text-gray-900">Your Listings</h2>
                    <p className="text-gray-600 mt-1">{listings.length} published properties</p>
                </div>

                <div className="flex items-center gap-3">
                    {/* View Toggle */}
                    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                        <button className="p-2 rounded-md bg-white text-gray-900 shadow-sm">
                            <Grid className="w-4 h-4" />
                        </button>
                        <button className="p-2 rounded-md text-gray-600 hover:text-gray-900">
                            <List className="w-4 h-4" />
                        </button>
                    </div>

                    {/* New Listing Button */}
                    <Button
                        onClick={handleNewListing}
                        className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        New Listing
                    </Button>
                </div>
            </div>

            {/* Listings Grid */}
            {listings.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                    <div className="mb-4">
                        <Building className="w-16 h-16 text-gray-400 mx-auto" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No published listings yet</h3>
                    <p className="text-gray-600 mb-6">Create your first listing to start receiving bookings</p>
                    <Button onClick={handleNewListing} className=" bg-gradient-to-r from-orange-500 to-orange-600">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Your First Listing
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {listings.map((listing, index) => (
                        <motion.div
                            key={listing.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 + index * 0.1, duration: 0.4 }}
                        >
                            <ListingCard
                                id={listing.id}
                                name={listing.name}
                                location={listing.location || 'Location not set'}
                                status="published"
                                imageUrl={listing.images?.[0]}
                                bookings={0} // TODO: Fetch from bookings table
                                rating={0} // TODO: Fetch from reviews
                                revenue="$0" // TODO: Calculate from bookings
                            />
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
