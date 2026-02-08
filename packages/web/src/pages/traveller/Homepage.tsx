
import { useEffect, useState } from 'react';
import { Search, MapPin, Calendar, Users, Briefcase, Mountain, Palmtree, Tent, Waves } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PackageCard } from '@/components/traveller/PackageCard';
import { supabase } from '@/lib/supabase';
import { PackageData } from '@/features/package-creation/types';

export default function Homepage() {
    const [packages, setPackages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPackages = async () => {
            try {
                const { data, error } = await supabase
                    .from('packages')
                    .select('*')
                    .eq('is_published', true)
                    .order('created_at', { ascending: false })
                    .limit(6);

                if (error) throw error;
                setPackages(data || []);
            } catch (err) {
                console.error('Error fetching packages:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchPackages();
    }, []);

    const categories = [
        { name: 'Beach', icon: Waves },
        { name: 'Mountain', icon: Mountain },
        { name: 'Adventure', icon: Tent },
        { name: 'Business', icon: Briefcase },
        { name: 'Luxury', icon: Palmtree },
    ];

    return (
        <div className="pb-20">
            {/* Hero Section */}
            <div className="relative h-[500px] w-full bg-slate-900 overflow-hidden">
                <img
                    src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2021&auto=format&fit=crop"
                    alt="Travel Hero"
                    className="absolute inset-0 w-full h-full object-cover opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                <div className="relative h-full max-w-7xl mx-auto px-4 flex flex-col justify-center items-center text-center">
                    <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        Find your next <span className="text-primary text-cyan-400">adventure</span>
                    </h1>
                    <p className="text-lg text-gray-200 mb-8 max-w-2xl animate-in fade-in slide-in-from-bottom-5 duration-1000">
                        Discover curated travel packages, luxury stays, and unforgettable experiences tailored just for you.
                    </p>

                    {/* Search Bar */}
                    <div className="bg-white p-2 rounded-full shadow-2xl flex flex-col md:flex-row items-center gap-2 max-w-3xl w-full animate-in zoom-in duration-500">
                        <div className="flex-1 px-6 py-3 border-r border-gray-100 w-full md:w-auto text-left">
                            <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Where</label>
                            <div className="flex items-center gap-2 text-gray-900 font-medium">
                                <MapPin size={18} className="text-primary" />
                                <span>Search destinations</span>
                            </div>
                        </div>
                        <div className="flex-1 px-6 py-3 border-r border-gray-100 w-full md:w-auto text-left">
                            <label className="text-xs font-bold text-gray-500 uppercase block mb-1">When</label>
                            <div className="flex items-center gap-2 text-gray-900 font-medium">
                                <Calendar size={18} className="text-primary" />
                                <span>Add dates</span>
                            </div>
                        </div>
                        <div className="flex-1 px-6 py-3 w-full md:w-auto text-left">
                            <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Who</label>
                            <div className="flex items-center gap-2 text-gray-900 font-medium">
                                <Users size={18} className="text-primary" />
                                <span>Add guests</span>
                            </div>
                        </div>
                        <Button size="lg" className="rounded-full w-full md:w-auto px-8 h-12 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25">
                            <Search size={20} />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Categories */}
            <div className="max-w-7xl mx-auto px-4 -mt-8 relative z-10 mb-16">
                <div className="bg-white rounded-2xl shadow-xl p-6 flex items-center justify-between overflow-x-auto gap-8 no-scrollbar border border-gray-100">
                    {categories.map((cat, idx) => (
                        <div key={idx} className="flex flex-col items-center gap-2 min-w-[80px] cursor-pointer group hover:opacity-100 opacity-60 transition-all">
                            <div className="w-12 h-12 rounded-full bg-gray-50 group-hover:bg-primary/10 flex items-center justify-center text-gray-500 group-hover:text-primary transition-colors">
                                <cat.icon size={24} />
                            </div>
                            <span className="text-sm font-medium text-gray-600 group-hover:text-primary">{cat.name}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Featured Section */}
            <main className="max-w-7xl mx-auto px-4">
                <div className="flex items-end justify-between mb-8">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Featured Packages</h2>
                        <p className="text-gray-500">Handpicked experiences for your next journey</p>
                    </div>
                    <Button variant="outline" className="hidden md:flex">View all</Button>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-[400px] bg-gray-100 rounded-2xl animate-pulse" />
                        ))}
                    </div>
                ) : packages.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {packages.map((pkg) => (
                            <PackageCard
                                key={pkg.id}
                                id={pkg.id}
                                image={pkg.cover_image || pkg.media_urls?.[0] || 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&auto=format&fit=crop'}
                                title={pkg.name}
                                location="Multiple Locations" // Placeholder until we have location in DB
                                duration={3} // Placeholder
                                rating={4.8} // Placeholder
                                price={599} // Placeholder
                                type={pkg.package_type}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No packages found</h3>
                        <p className="text-gray-500">Check back later for new travel experiences.</p>
                    </div>
                )}
            </main>
        </div>
    );
}
