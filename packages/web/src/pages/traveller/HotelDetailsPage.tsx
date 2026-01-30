import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    Star, MapPin, Share, Heart, Wifi, Car, Coffee,
    Utensils, ChevronLeft, Users
} from 'lucide-react';
import { ImageWithFallback } from '@/components/ImageWithFallback';

// Mock Data (Replace with API later)
const HOTEL_DATA = {
    id: '1',
    name: 'Azure Shores Resort',
    location: 'Bali, Indonesia',
    rating: 4.9,
    reviews: 128,
    price: 599,
    description: 'Experience the ultimate tropical getaway at Azure Shores Resort. Nestled along the pristine coastline of Bali, our resort offers breathtaking ocean views, luxurious amenities, and world-class service. Whether you represent a couple seeking a romantic escape or a family looking for adventure, our resort handles every need with grace and style.',
    images: [
        'https://images.unsplash.com/photo-1580450997544-8846a39f3dfa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cm9waWNhbCUyMHJlc29ydCUyMGJlYWNofGVufDF8fHx8MTc1NzMzODQzMHww&ixlib=rb-4.1.0&q=80&w=1080',
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHxiZWFjaCUyMHJlc29ydCUyMHBvb2x8ZW58MXx8fHwxNzU3MzM4NDMwfDA&ixlib=rb-4.1.0&q=80&w=1080',
        'https://images.unsplash.com/photo-1582719508461-905c673771fd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHxodXh1cnklMjBob3RlbHxlbnwxfHx8fDE3NTMzMzg0MzB8MA&ixlib=rb-4.1.0&q=80&w=1080',
        'https://images.unsplash.com/photo-1540541338287-481bf13a79f4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHxwb29sJTIwdmlld3xlbnwxfHx8fDE3NTMzMzg0MzB8MA&ixlib=rb-4.1.0&q=80&w=1080',
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHxodXh1cnklMjBob3RlbHxlbnwxfHx8fDE3NTMzMzg0MzB8MA&ixlib=rb-4.1.0&q=80&w=1080'
    ],
    amenities: [
        { icon: Wifi, label: 'Fast Wifi' },
        { icon: Car, label: 'Free Parking' },
        { icon: Coffee, label: 'Breakfast' },
        { icon: Utensils, label: 'Restaurant' },
    ],
    host: {
        name: 'Sarah Jenkins',
        role: 'Superhost',
        image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100'
    }
};

export default function HotelDetailsPage() {
    // const { id } = useParams(); // Removed unused
    const navigate = useNavigate();
    const { id } = useParams();

    // Simulate usage of ID
    void id;

    // In a real app, useQuery hook here to fetch by ID
    const hotel = HOTEL_DATA;

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Header / Nav */}
            <header className="fixed top-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-md z-50 border-b flex items-center justify-between px-4 lg:px-20">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
                    <ChevronLeft className="w-5 h-5" />
                </Button>
                <div className="flex gap-2">
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <Share className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <Heart className="w-4 h-4" />
                    </Button>
                </div>
            </header>

            <main className="container mx-auto max-w-6xl pt-24 px-4 lg:px-6">

                {/* Title Section */}
                <div className="mb-6">
                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-2xl md:text-3xl font-bold mb-2"
                    >
                        {hotel.name}
                    </motion.h1>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-primary text-primary" />
                            <span className="font-medium text-foreground">{hotel.rating}</span>
                            <span className="underline cursor-pointer">{hotel.reviews} reviews</span>
                        </div>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span className="underline cursor-pointer">{hotel.location}</span>
                        </div>
                    </div>
                </div>

                {/* Image Gallery Grid (Airbnb Style) */}
                <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-2 h-[300px] md:h-[450px] rounded-2xl overflow-hidden mb-10 relative group">
                    {/* Main Large Image */}
                    <div className="col-span-2 row-span-2 relative cursor-pointer">
                        <ImageWithFallback
                            src={hotel.images[0]}
                            alt="Main view"
                            className="w-full h-full object-cover hover:brightness-95 transition-all"
                        />
                    </div>
                    {/* Smaller Images */}
                    <div className="hidden md:block relative cursor-pointer">
                        <ImageWithFallback src={hotel.images[1]} alt="View 2" className="w-full h-full object-cover hover:brightness-95 transition-all" />
                    </div>
                    <div className="hidden md:block relative cursor-pointer rounded-tr-2xl">
                        <ImageWithFallback src={hotel.images[2]} alt="View 3" className="w-full h-full object-cover hover:brightness-95 transition-all" />
                    </div>
                    <div className="hidden md:block relative cursor-pointer">
                        <ImageWithFallback src={hotel.images[3]} alt="View 4" className="w-full h-full object-cover hover:brightness-95 transition-all" />
                    </div>
                    <div className="hidden md:block relative cursor-pointer rounded-br-2xl">
                        <ImageWithFallback src={hotel.images[4]} alt="View 5" className="w-full h-full object-cover hover:brightness-95 transition-all" />
                        <Button variant="secondary" size="sm" className="absolute bottom-4 right-4 shadow-md opacity-90 hover:opacity-100">
                            Show all photos
                        </Button>
                    </div>
                </div>

                {/* Content Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

                    {/* Left Column: Details */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Host Info */}
                        <div className="flex items-center justify-between border-b pb-6">
                            <div>
                                <h2 className="text-xl font-semibold mb-1">Hosted by {hotel.host.name}</h2>
                                <p className="text-muted-foreground text-sm">{hotel.host.role} • 2 years hosting</p>
                            </div>
                            <div className="w-12 h-12 rounded-full overflow-hidden bg-muted">
                                <img src={hotel.host.image} alt={hotel.host.name} className="w-full h-full object-cover" />
                            </div>
                        </div>

                        {/* Description */}
                        <div className="border-b pb-6">
                            <p className="text-foreground/80 leading-relaxed">
                                {hotel.description}
                            </p>
                            <Button variant="link" className="px-0 mt-2 font-semibold underline">
                                Show more
                            </Button>
                        </div>

                        {/* Amenities */}
                        <div className="border-b pb-6">
                            <h3 className="text-xl font-semibold mb-4">What this place offers</h3>
                            <div className="grid grid-cols-2 gap-4">
                                {hotel.amenities.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-3 text-foreground/80">
                                        <item.icon className="w-5 h-5 text-muted-foreground" />
                                        <span>{item.label}</span>
                                    </div>
                                ))}
                            </div>
                            <Button variant="outline" className="mt-6 w-full md:w-auto">
                                Show all 32 amenities
                            </Button>
                        </div>

                    </div>

                    {/* Right Column: Booking Card (Sticky) */}
                    <div className="relative">
                        <Card className="sticky top-24 p-6 shadow-airbnb border-border/50">
                            <div className="flex justify-between items-end mb-6">
                                <div>
                                    <span className="text-2xl font-bold">${hotel.price}</span>
                                    <span className="text-muted-foreground"> / night</span>
                                </div>
                                <div className="flex items-center gap-1 text-sm">
                                    <Star className="w-3 h-3 fill-primary text-primary" />
                                    <span className="font-semibold">{hotel.rating}</span>
                                    <span className="text-muted-foreground">({hotel.reviews})</span>
                                </div>
                            </div>

                            {/* Date/Guest Inputs Mock */}
                            <div className="border rounded-xl mb-4 overflow-hidden">
                                <div className="grid grid-cols-2 border-b">
                                    <div className="p-3 border-r hover:bg-muted/50 cursor-pointer">
                                        <div className="text-[10px] uppercase font-bold text-muted-foreground">Check-in</div>
                                        <div className="text-sm">Add date</div>
                                    </div>
                                    <div className="p-3 hover:bg-muted/50 cursor-pointer">
                                        <div className="text-[10px] uppercase font-bold text-muted-foreground">Check-out</div>
                                        <div className="text-sm">Add date</div>
                                    </div>
                                </div>
                                <div className="p-3 hover:bg-muted/50 cursor-pointer">
                                    <div className="text-[10px] uppercase font-bold text-muted-foreground">Guests</div>
                                    <div className="text-sm flex justify-between items-center">
                                        1 guest
                                        <Users className="w-4 h-4 text-muted-foreground" />
                                    </div>
                                </div>
                            </div>

                            <Button className="w-full bg-primary hover:bg-primary/90 text-lg py-6 mb-4">
                                Reserve
                            </Button>

                            <div className="text-center text-sm text-muted-foreground mb-4">
                                You won't be charged yet
                            </div>

                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="underline decoration-muted-foreground">
                                        ${hotel.price} x 5 nights
                                    </span>
                                    <span>${hotel.price * 5}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="underline decoration-muted-foreground">Cleaning fee</span>
                                    <span>$60</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="underline decoration-muted-foreground">Service fee</span>
                                    <span>$85</span>
                                </div>
                                <div className="border-t pt-3 mt-3 flex justify-between font-bold text-base">
                                    <span>Total before taxes</span>
                                    <span>${(hotel.price * 5) + 60 + 85}</span>
                                </div>
                            </div>
                        </Card>
                    </div>

                </div>
            </main>
        </div>
    );
}
