import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
    TrendingUp, Flame, ChevronLeft, ChevronRight, Crown, Mountain,
    Star, MapPin, Calendar, Heart, ChevronRight as ChevronRightIcon
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ImageSlider } from '@/components/ImageSlider';

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-background dark:to-gray-900">
            {/* Header */}
            <header className="sticky top-0 bg-white/80 dark:bg-card/80 backdrop-blur-xl border-b border-gray-100/50 dark:border-border/50 z-50 px-4 py-3 shadow-sm">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold bg-gradient-rose-primary bg-clip-text text-transparent">T</span>
                        <span className="text-xl font-semibold">TripAvail</span>
                    </div>
                    <Button variant="outline" size="sm">Log in</Button>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
                {/* Hero Section */}
                <div className="text-center space-y-4 py-8">
                    <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-foreground">
                        Find your next stay
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-muted-foreground">
                        Search low prices on hotels, homes and much more...
                    </p>
                </div>

                {/* Search Form */}
                <Card className="p-6 shadow-modern max-w-4xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-foreground mb-2 block">Where</label>
                            <input
                                type="text"
                                placeholder="Search destinations"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-foreground mb-2 block">When</label>
                            <input
                                type="text"
                                placeholder="Add dates"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-foreground mb-2 block">Who</label>
                            <input
                                type="number"
                                placeholder="1"
                                min="1"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                            />
                        </div>
                        <div className="flex items-end">
                            <Button className="w-full gradient-rose-primary text-white">
                                Search
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* Trending Destinations */}
                <TrendingDestinations />

                {/* Featured Hotels */}
                <FeaturedHotels />

                {/* Featured Tours */}
                <FeaturedTours />

                {/* Explore by Role */}
                <ExploreByRole />
            </main>
        </div>
    );
}

// Trending Destinations Slider Component
function TrendingDestinations() {
    const [currentSlide, setCurrentSlide] = useState(0);

    const destinations = [
        {
            id: 'santorini',
            name: 'Santorini',
            country: 'Greece',
            price: 'From $899',
            image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1080&q=80',
            description: 'Stunning sunsets and white architecture'
        },
        {
            id: 'bali',
            name: 'Bali',
            country: 'Indonesia',
            price: 'From $599',
            image: 'https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?w=1080&q=80',
            description: 'Tropical paradise and cultural wonders'
        },
        {
            id: 'tokyo',
            name: 'Tokyo',
            country: 'Japan',
            price: 'From $1299',
            image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1080&q=80',
            description: 'Modern metropolis meets ancient tradition'
        },
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % destinations.length);
        }, 4000);
        return () => clearInterval(timer);
    }, [destinations.length]);

    const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % destinations.length);
    const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + destinations.length) % destinations.length);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }}>
                        <TrendingUp className="w-5 h-5 text-primary" />
                    </motion.div>
                    <h3 className="font-semibold text-foreground">Trending Destinations</h3>
                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                        <Flame className="w-5 h-5 text-orange-500" />
                    </motion.div>
                </div>
                <Button variant="ghost" className="text-primary text-sm">View All</Button>
            </div>

            <div className="relative">
                <Card className="relative overflow-hidden border-0 shadow-xl h-48">
                    {/* Background Images */}
                    <div className="absolute inset-0">
                        {destinations.map((dest, index) => (
                            <motion.div
                                key={`bg-${dest.id}`}
                                className="absolute inset-0"
                                initial={{ opacity: 0, scale: 1.1 }}
                                animate={{
                                    opacity: index === currentSlide ? 1 : 0,
                                    scale: index === currentSlide ? 1 : 1.1
                                }}
                                transition={{ duration: 0.7, ease: "easeInOut" }}
                            >
                                <img src={dest.image} alt={dest.name} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                            </motion.div>
                        ))}
                    </div>

                    {/* Navigation Arrows */}
                    <motion.button
                        onClick={prevSlide}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center z-10 border border-white/30"
                        whileTap={{ scale: 0.9 }}
                    >
                        <ChevronLeft className="w-5 h-5 text-white" />
                    </motion.button>

                    <motion.button
                        onClick={nextSlide}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center z-10 border border-white/30"
                        whileTap={{ scale: 0.9 }}
                    >
                        <ChevronRight className="w-5 h-5 text-white" />
                    </motion.button>

                    {/* Content */}
                    <div className="relative z-10 p-6 h-full flex flex-col justify-center text-white">
                        <div className="flex items-start justify-between">
                            <motion.div
                                className="flex-1"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                key={`content-${currentSlide}`}
                                transition={{ delay: 0.2 }}
                            >
                                <h3 className="text-2xl font-bold mb-1">{destinations[currentSlide]?.name}</h3>
                                <p className="text-white/90 mb-2">{destinations[currentSlide]?.country}</p>
                                <p className="text-sm text-white/80">{destinations[currentSlide]?.description}</p>
                            </motion.div>

                            <motion.div
                                className="text-right ml-4"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                key={`price-${currentSlide}`}
                                transition={{ delay: 0.3 }}
                            >
                                <div className="text-xl font-bold">{destinations[currentSlide]?.price}</div>
                                <div className="text-sm opacity-90">per person</div>
                            </motion.div>
                        </div>
                    </div>

                    {/* Slide Indicators */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                        {destinations.map((_, index) => (
                            <motion.button
                                key={`indicator-${index}`}
                                onClick={() => setCurrentSlide(index)}
                                className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentSlide ? 'bg-white w-6' : 'bg-white/50 hover:bg-white/70'
                                    }`}
                                whileTap={{ scale: 0.9 }}
                            />
                        ))}
                    </div>
                </Card>
            </div>
        </motion.div>
    );
}

// Featured Hotels Component
function FeaturedHotels() {
    const [wishlistedPackages, setWishlistedPackages] = useState<Set<string>>(new Set());

    const hotels = [
        {
            id: 'luxury-beach-1',
            title: 'Paradise Beach Escape',
            hotelName: 'Azure Shores Resort',
            location: 'Bali, Indonesia',
            originalPrice: 899,
            packagePrice: 599,
            savings: 300,
            rating: 4.9,
            reviews: 1247,
            duration: '3 Days, 2 Nights',
            images: [
                'https://images.unsplash.com/photo-1580450997544-8846a39f3dfa?w=1080&q=80',
                'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1080&q=80',
            ],
            badge: 'Most Popular',
            gradient: 'from-rose-500 to-pink-500'
        },
        {
            id: 'luxury-resort-2',
            title: 'Alpine Luxury Retreat',
            hotelName: 'Mountain Crown Lodge',
            location: 'Swiss Alps, Switzerland',
            originalPrice: 1299,
            packagePrice: 999,
            savings: 300,
            rating: 4.8,
            reviews: 892,
            duration: '4 Days, 3 Nights',
            images: [
                'https://images.unsplash.com/photo-1689729738920-edea97589328?w=1080&q=80',
                'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1080&q=80',
            ],
            badge: 'Premium',
            gradient: 'from-blue-500 to-indigo-500'
        }
    ];

    const handleToggleWishlist = (packageId: string, event: React.MouseEvent) => {
        event.stopPropagation();
        setWishlistedPackages(prev => {
            const newSet = new Set(prev);
            if (newSet.has(packageId)) {
                newSet.delete(packageId);
            } else {
                newSet.add(packageId);
            }
            return newSet;
        });
    };

    const getBadgeGradient = (badge: string) => {
        switch (badge) {
            case 'Most Popular': return 'bg-gradient-to-r from-primary to-rose-500';
            case 'Premium': return 'bg-gradient-to-r from-purple-500 to-indigo-500';
            default: return 'bg-gradient-to-r from-gray-500 to-gray-600';
        }
    };

    return (
        <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="space-y-3"
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                        <Crown className="w-4 h-4 text-yellow-500" />
                    </motion.div>
                    <div>
                        <h3 className="font-semibold text-foreground">Featured Hotels</h3>
                        <p className="text-xs text-muted-foreground">Handpicked luxury experiences</p>
                    </div>
                </div>
                <Button variant="ghost" className="text-primary text-sm">
                    View All
                    <motion.div animate={{ x: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                        <ChevronRightIcon className="w-3 h-3 ml-1" />
                    </motion.div>
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {hotels.map((hotel, index) => (
                    <motion.div
                        key={hotel.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 + index * 0.1 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <Card className="overflow-hidden cursor-pointer border-0 bg-card shadow-lg relative">
                            <div className="relative z-10">
                                {/* Image Slider */}
                                <div className="relative h-40 overflow-hidden">
                                    <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.4 }} className="w-full h-full">
                                        <ImageSlider images={hotel.images} alt={hotel.title} autoSlideDelay={6000} />
                                    </motion.div>

                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                                    {/* Badge */}
                                    <motion.div
                                        className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-semibold text-white ${getBadgeGradient(hotel.badge)}`}
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 0.8 + index * 0.1, type: "spring" }}
                                    >
                                        {hotel.badge}
                                    </motion.div>

                                    {/* Heart Icon */}
                                    <motion.button
                                        onClick={(e) => handleToggleWishlist(hotel.id, e)}
                                        className={`absolute top-2 right-2 w-8 h-8 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-300 ${wishlistedPackages.has(hotel.id)
                                                ? 'bg-primary text-white'
                                                : 'bg-white/90 text-gray-600'
                                            }`}
                                        whileTap={{ scale: 0.9 }}
                                        whileHover={{ scale: 1.1 }}
                                    >
                                        <Heart className={`w-4 h-4 ${wishlistedPackages.has(hotel.id) ? 'fill-current' : ''}`} />
                                    </motion.button>

                                    {/* Savings Badge */}
                                    <motion.div
                                        className="absolute bottom-2 right-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-2 py-1 rounded-full text-xs font-semibold"
                                        initial={{ scale: 0, rotate: -180 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ delay: 1 + index * 0.1, type: "spring" }}
                                    >
                                        Save ${hotel.savings}
                                    </motion.div>
                                </div>

                                {/* Content */}
                                <div className="p-3 space-y-2">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-card-foreground mb-1">{hotel.title}</h4>
                                            <p className="text-sm text-muted-foreground mb-1">{hotel.hotelName}</p>
                                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                <MapPin className="w-3 h-3" />
                                                <span>{hotel.location}</span>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <div className="flex items-center gap-1 mb-1">
                                                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                                <span className="font-semibold text-card-foreground text-sm">{hotel.rating}</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground">({hotel.reviews})</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                            <Calendar className="w-3 h-3" />
                                            <span>{hotel.duration}</span>
                                        </div>

                                        <div className="text-right">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-card-foreground">${hotel.packagePrice}</span>
                                                <span className="text-sm text-muted-foreground line-through">${hotel.originalPrice}</span>
                                            </div>

                                            <motion.button
                                                className={`mt-1 px-3 py-1 bg-gradient-to-r ${hotel.gradient} text-white rounded-lg text-xs font-medium shadow-lg`}
                                                whileTap={{ scale: 0.95 }}
                                                whileHover={{ scale: 1.02 }}
                                            >
                                                Book Now
                                            </motion.button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </div>
        </motion.section>
    );
}

// Featured Tours Component
function FeaturedTours() {
    return (
        <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="space-y-3"
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <motion.div animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }} transition={{ duration: 3, repeat: Infinity }}>
                        <Mountain className="w-4 h-4 text-blue-500" />
                    </motion.div>
                    <div>
                        <h3 className="font-semibold text-foreground">Featured Tours</h3>
                        <p className="text-xs text-muted-foreground">Unforgettable guided adventures</p>
                    </div>
                </div>
                <Button variant="ghost" className="text-primary text-sm">View All</Button>
            </div>

            <div className="text-center py-12">
                <motion.div
                    className="text-6xl mb-4"
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    🎒
                </motion.div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Tour Packages</h2>
                <p className="text-muted-foreground">Coming soon! Exciting tour packages await.</p>
            </div>
        </motion.section>
    );
}

// Explore by Role Component
function ExploreByRole() {
    return (
        <section className="space-y-6 py-8">
            <h2 className="text-3xl font-bold text-center">Explore by Role</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6 text-center hover-lift cursor-pointer">
                    <h3 className="text-xl font-bold mb-2">Traveller</h3>
                    <p className="text-muted-foreground">Book your perfect vacation.</p>
                </Card>

                <Card className="p-6 text-center hover-lift cursor-pointer">
                    <h3 className="text-xl font-bold mb-2">Hotel Manager</h3>
                    <p className="text-muted-foreground">List your property today.</p>
                </Card>

                <Card className="p-6 text-center hover-lift cursor-pointer">
                    <h3 className="text-xl font-bold mb-2">Tour Operator</h3>
                    <p className="text-muted-foreground">Offer unique experiences.</p>
                </Card>
            </div>
        </section>
    );
}
