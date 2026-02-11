import { useEffect, useState } from 'react';
import {
    Search, Briefcase, Mountain, Palmtree, Tent, Waves
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TourCard } from '@/components/traveller/TourCard';
import { PackageCard } from '@/components/traveller/PackageCard';
import { supabase } from '@/lib/supabase';
import { tourService, Tour } from '@/features/tour-operator/services/tourService';
import { Badge } from '@/components/ui/badge';
import { GlassCard } from '@/components/ui/glass';
import { motion } from 'motion/react';

export default function Homepage() {
    const [packages, setPackages] = useState<any[]>([]);
    const [tours, setTours] = useState<Tour[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [{ data: pkgData, error: pkgError }, featuredTours] = await Promise.all([
                    (supabase
                        .from('packages' as any)
                        .select('*')
                        .eq('is_published', true)
                        .order('created_at', { ascending: false })
                        .limit(6)) as any,
                    tourService.fetchFeaturedTours()
                ]);

                if (pkgError) throw pkgError;
                setPackages(pkgData || []);
                setTours(featuredTours || []);
            } catch (err) {
                console.error('Error fetching data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const categories = [
        { name: 'Adventure', icon: Mountain },
        { name: 'Business', icon: Briefcase },
        { name: 'Beach', icon: Waves },
        { name: 'Nature', icon: Palmtree },
        { name: 'Camping', icon: Tent },
    ];

    return (
        <div className="bg-white">
            {/* Hero Section */}
            <div className="relative h-[600px] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <img
                        src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1600&auto=format&fit=crop"
                        alt="Hero background"
                        className="w-full h-full object-cover brightness-75 transition-transform duration-1000 hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-white" />
                </div>

                <div className="relative z-10 max-w-4xl w-full px-4 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <h1 className="text-5xl md:text-7xl font-black text-white mb-6 drop-shadow-2xl">
                            Wander often, <br />
                            <span className="text-secondary">wonder always.</span>
                        </h1>
                        <p className="text-xl text-white/90 mb-10 font-medium max-w-2xl mx-auto drop-shadow-lg">
                            Discover hidden gems and curated travel experiences across the globe.
                        </p>

                        <GlassCard variant="light" className="p-2 rounded-[2rem] shadow-2xl shadow-black/20 max-w-3xl mx-auto flex flex-col md:flex-row items-center gap-2">
                            <div className="flex-1 w-full px-6 flex items-center gap-3 border-b md:border-b-0 md:border-r border-gray-100 py-3 md:py-0">
                                <Search className="w-5 h-5 text-primary" />
                                <input
                                    type="text"
                                    placeholder="Where to next?"
                                    className="w-full bg-transparent border-none outline-none font-bold text-gray-900 placeholder:text-gray-400"
                                />
                            </div>
                            <Button className="w-full md:w-auto px-10 h-14 rounded-3xl bg-primary hover:bg-primary/90 text-white font-black text-lg transition-all hover:scale-[1.02] shadow-xl shadow-primary/20">
                                Explore Now
                            </Button>
                        </GlassCard>
                    </motion.div>
                </div>
            </div>

            {/* Categories */}
            <div className="max-w-7xl mx-auto px-4 -mt-16 relative z-20 mb-20">
                <div className="bg-white rounded-[3rem] shadow-xl shadow-gray-200/50 p-8 border border-gray-50">
                    <div className="flex flex-wrap justify-center gap-4 md:gap-12">
                        {categories.map((cat) => (
                            <button
                                key={cat.name}
                                className="group flex flex-col items-center gap-3 p-4 transition-all hover:scale-110"
                            >
                                <div className="w-16 h-16 rounded-3xl bg-gray-50 flex items-center justify-center group-hover:bg-primary/10 group-hover:rotate-12 transition-all duration-500 shadow-sm">
                                    <cat.icon className="w-7 h-7 text-gray-400 group-hover:text-primary transition-colors" />
                                </div>
                                <span className="text-sm font-black text-gray-500 group-hover:text-gray-900 transition-colors uppercase tracking-widest">{cat.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Featured Section - Packages */}
            <main className="max-w-7xl mx-auto px-4 mb-20">
                <div className="flex items-end justify-between mb-8">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Featured Packages</h2>
                        <p className="text-gray-500 font-medium">Handpicked hotel stays and experiences</p>
                    </div>
                    <Button variant="outline" className="rounded-xl border-gray-200 font-bold">View all packages</Button>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="aspect-[4/5] bg-gray-100 rounded-3xl animate-pulse" />
                        ))}
                    </div>
                ) : packages.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {packages.map((pkg) => (
                            <PackageCard
                                key={pkg.id}
                                id={pkg.id}
                                slug={pkg.slug}
                                image={pkg.cover_image || pkg.media_urls?.[0] || 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&auto=format&fit=crop'}
                                title={pkg.name}
                                location="Multiple Locations"
                                duration={3}
                                rating={4.8}
                                price={599}
                                type={pkg.package_type}
                            />
                        ))}
                    </div>
                ) : null}
            </main>

            {/* Featured Section - Tours */}
            <div className="bg-gray-50 py-20 border-y border-gray-100">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex items-end justify-between mb-12">
                        <div>
                            <Badge className="bg-primary/10 text-primary border-none mb-3 px-3 py-1 font-bold text-[10px] uppercase tracking-wider">Explore Tours</Badge>
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">Popular Tour Experiences</h2>
                            <p className="text-gray-500 font-medium">Curated adventures led by local experts</p>
                        </div>
                        <Button variant="outline" className="rounded-xl border-gray-200 font-bold bg-white">Discover all tours</Button>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="aspect-[4/5] bg-gray-200/50 rounded-3xl animate-pulse" />
                            ))}
                        </div>
                    ) : tours.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {tours.map((tour) => (
                                <TourCard
                                    key={tour.id}
                                    id={tour.id}
                                    slug={tour.slug}
                                    image={tour.images?.[0] || 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&auto=format&fit=crop'}
                                    title={tour.title}
                                    location={`${tour.location.city}, ${tour.location.country}`}
                                    duration={tour.duration}
                                    rating={tour.rating}
                                    price={tour.price}
                                    currency={tour.currency}
                                    type={tour.tour_type}
                                    isFeatured={tour.is_featured}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">No featured tours yet</h3>
                            <p className="text-gray-500 font-medium">Our local experts are preparing amazing experiences for you.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

