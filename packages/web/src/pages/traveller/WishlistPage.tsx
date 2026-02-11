import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Heart, Loader2, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { wishlistService } from '@/lib/wishlistService';
import { tourService } from '@/features/tour-operator/services/tourService';
import { getPackagesByIds } from '@/features/package-creation/services/packageService';
import { TourCard } from '@/components/traveller/TourCard';
import { PackageCard } from '@/components/traveller/PackageCard';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

export default function WishlistPage() {
    const { user } = useAuth();
    const [items, setItems] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'tour' | 'package'>('all');

    useEffect(() => {
        loadWishlist();
    }, [user?.id]);

    const loadWishlist = async () => {
        try {
            setIsLoading(true);
            const wishlist = await wishlistService.getWishlist();
            
            if (wishlist.length === 0) {
                setItems([]);
                return;
            }

            const tourIds = wishlist
                .filter(item => item.item_type === 'tour')
                .map(item => item.item_id);
            
            const packageIds = wishlist
                .filter(item => item.item_type === 'package')
                .map(item => item.item_id);

            const [tours, packages] = await Promise.all([
                tourIds.length ? tourService.getToursByIds(tourIds) : Promise.resolve([]),
                packageIds.length ? getPackagesByIds(packageIds) : Promise.resolve([])
            ]);

            const normalizedItems = [
                ...tours.map(t => ({ ...t, type: 'tour' })),
                ...packages.map(p => ({ ...p, type: 'package' }))
            ].sort((a, b) => {
                const aTime = (wishlist.find(i => i.item_id === a.id) as any)?.created_at || '';
                const bTime = (wishlist.find(i => i.item_id === b.id) as any)?.created_at || '';
                return bTime.localeCompare(aTime);
            });

            setItems(normalizedItems);
        } catch (error) {
            console.error('Failed to load wishlist:', error);
            toast.error('Failed to load your wishlist');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemove = async (id: string, type: string) => {
        try {
            await wishlistService.toggleWishlist(id, type as 'tour' | 'package');
            setItems(prev => prev.filter(item => item.id !== id));
            toast.success('Removed from wishlist');
        } catch (error) {
            toast.error('Failed to remove item');
        }
    };

    const filteredItems = items.filter(item => 
        filter === 'all' || item.type === filter
    );

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                <p className="text-gray-500 font-medium">Fetching your favorites...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20">
            {/* Header */}
            <div className="bg-white border-b border-gray-100 sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                            <Heart className="w-6 h-6 text-red-500 fill-red-500" />
                            My Wishlist
                        </h1>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                            {items.length} SAVED ITEMS
                        </p>
                    </div>
                    
                    <div className="flex bg-gray-100 p-1 rounded-xl">
                        {(['all', 'tour', 'package'] as const).map((t) => (
                            <button
                                key={t}
                                onClick={() => setFilter(t)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                                    filter === t 
                                    ? 'bg-white text-primary shadow-sm' 
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                {t}s
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-10">
                {items.length === 0 ? (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center justify-center py-20 text-center"
                    >
                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                            <Heart className="w-10 h-10 text-gray-300" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your wishlist is empty</h2>
                        <p className="text-gray-500 max-w-sm mb-8">
                            Save your favorite tours and packages while you browse to keep them all in one place.
                        </p>
                        <Button asChild className="rounded-full px-8">
                            <a href="/explore">Start Exploring</a>
                        </Button>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {filteredItems.map((item) => (
                            <div key={item.id} className="relative group">
                                <button 
                                    onClick={() => handleRemove(item.id, item.type)}
                                    className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/90 backdrop-blur-sm text-gray-400 hover:text-red-500 shadow-sm transition-all opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100"
                                    title="Remove from wishlist"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                                
                                {item.type === 'tour' ? (
                                    <TourCard 
                                        id={item.id}
                                        slug={item.slug}
                                        image={item.images?.[0] || 'https://images.unsplash.com/photo-1469474968028-56623f02e42e'}
                                        title={item.title}
                                        location={typeof item.location === 'string' ? item.location : item.location?.city || 'Globe'}
                                        duration={item.duration}
                                        rating={item.rating || 0}
                                        price={item.price}
                                        currency={item.currency || 'USD'}
                                        type={item.tour_type}
                                    />
                                ) : (
                                    <PackageCard 
                                        id={item.id}
                                        slug={item.slug}
                                        image={item.cover_image || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e'}
                                        title={item.name}
                                        location={item.location}
                                        duration={item.duration_days}
                                        rating={item.rating}
                                        price={item.base_price_per_night || 0}
                                        type={item.package_type}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
