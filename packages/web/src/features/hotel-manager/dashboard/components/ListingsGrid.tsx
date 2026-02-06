import { Plus, Grid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ListingCard } from './ListingCard';
import { motion } from 'motion/react';

export function ListingsGrid() {
    // Mock data - will be replaced with real data
    const listings = [
        {
            id: '1',
            name: 'Ocean View Paradise Hotel',
            location: 'Miami Beach, FL',
            status: 'published' as const,
            bookings: 24,
            rating: 4.8,
            revenue: '$8.2k',
        },
        {
            id: '2',
            name: 'Mountain Lodge Retreat',
            location: 'Aspen, CO',
            status: 'published' as const,
            bookings: 18,
            rating: 4.9,
            revenue: '$6.5k',
        },
        {
            id: '3',
            name: 'Downtown Business Hotel',
            location: 'New York, NY',
            status: 'draft' as const,
            bookings: 0,
            rating: 0,
            revenue: '$0',
        },
    ];

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-semibold text-gray-900">Your Listings</h2>
                    <p className="text-gray-600 mt-1">{listings.length} total properties</p>
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
                    <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700">
                        <Plus className="w-4 h-4 mr-2" />
                        New Listing
                    </Button>
                </div>
            </div>

            {/* Listings Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {listings.map((listing, index) => (
                    <motion.div
                        key={listing.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + index * 0.1, duration: 0.4 }}
                    >
                        <ListingCard {...listing} />
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
