import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, Star, MapPin, Calendar, Users, Heart, Share2,
  Wifi, Car, Utensils, Coffee, Mountain, Sparkles, Crown,
  Check, X, Info, Camera, ChevronLeft, ChevronRight,
  Clock, DollarSign, Shield, Phone, Mail, MessageCircle,
  Bed, Bath, Square, Award, Plane
} from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Separator } from './ui/separator';
import { wishlistService } from '../services/wishlistService';

interface PackageData {
  id: string;
  title: string;
  hotelName: string;
  location: string;
  originalPrice: number;
  packagePrice: number;
  savings: number;
  rating: number;
  reviews: number;
  duration: string;
  guests: string;
  images: string[];
  type: string;
  badge: string;
  description: string;
  highlights: string[];
  included: string[];
  excluded: string[];
  amenities: any[];
  policies: {
    checkIn: string;
    checkOut: string;
    cancellation: string;
    payment: string;
  };
  contact: {
    phone: string;
    email: string;
    website: string;
  };
  availability: {
    startDate: string;
    endDate: string;
    availableDates: string[];
  };
}

interface AirbnbHotelDetailScreenProps {
  packageId: string;
  onBack: () => void;
  onBookNow: (packageId: string) => void;
}

export function AirbnbHotelDetailScreen({ 
  packageId, 
  onBack, 
  onBookNow 
}: AirbnbHotelDetailScreenProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showAllImages, setShowAllImages] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [packageData, setPackageData] = useState<PackageData | null>(null);

  // Get package data based on packageId
  useEffect(() => {
    // This should match the data from HotelPackagesDisplay
    const packagesData: Record<string, PackageData> = {
      'luxury-beach-1': {
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
        guests: 'Up to 2 Guests',
        images: [
          'https://images.unsplash.com/photo-1580450997544-8846a39f3dfa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cm9waWNhbCUyMHJlc29ydCUyMGJlYWNofGVufDF8fHx8MTc1NzMzODQzMHww&ixlib=rb-4.1.0&q=80&w=1080',
          'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwyfHxob3RlbCUyMHJvb218ZW58MXx8fHwxNzU3MzM4NDM3fDA&ixlib=rb-4.1.0&q=80&w=1080',
          'https://images.unsplash.com/photo-1578662996442-48f60103fc96?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwzfHxzcGElMjByZXNvcnR8ZW58MXx8fHwxNzU3MzM4NDQ0fDA&ixlib=rb-4.1.0&q=80&w=1080',
          'https://images.unsplash.com/photo-1544551763-46a013bb70d5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHw0fHxyZXNvcnQlMjBkaW5pbmd8ZW58MXx8fHwxNzU3MzM4NDUxfDA&ixlib=rb-4.1.0&q=80&w=1080'
        ],
        type: 'Romantic',
        badge: 'Most Popular',
        description: 'Escape to paradise with our romantic beach package featuring oceanfront accommodations, couples spa treatments, and unforgettable sunset experiences. Perfect for honeymoons, anniversaries, or romantic getaways.',
        highlights: [
          'Ocean View Suite with Private Balcony',
          'Couples Spa Package with Massages',
          'Private Beach Access with Cabana',
          'Romantic Sunset Dinner on the Beach',
          'Complimentary Champagne and Flowers',
          'Water Sports Activities Included'
        ],
        included: [
          '3 Days, 2 Nights Accommodation',
          'Daily Breakfast for Two',
          'Couples Spa Treatment (60 minutes)',
          'Private Beach Dinner (One Evening)',
          'Welcome Champagne & Tropical Fruits',
          'Beach Equipment & Water Sports',
          'Airport Transfer (Round Trip)',
          'Daily Housekeeping Service',
          'Complimentary WiFi',
          '24/7 Concierge Service'
        ],
        excluded: [
          'International Flight Tickets',
          'Travel Insurance',
          'Personal Expenses & Shopping',
          'Additional Meals Not Mentioned',
          'Optional Tours & Excursions',
          'Spa Treatments Beyond Package',
          'Alcoholic Beverages (Except Welcome Champagne)',
          'Tips and Gratuities'
        ],
        amenities: [Wifi, Car, Utensils, Sparkles, Coffee, Mountain],
        policies: {
          checkIn: '3:00 PM onwards',
          checkOut: '12:00 PM',
          cancellation: 'Free cancellation up to 48 hours before arrival. 50% refund for cancellations within 24-48 hours.',
          payment: 'Credit card required to secure booking. Full payment due at check-in.'
        },
        contact: {
          phone: '+62 361 123 4567',
          email: 'reservations@azureshores.com',
          website: 'www.azureshoresresort.com'
        },
        availability: {
          startDate: '2025-01-15',
          endDate: '2025-12-31',
          availableDates: ['2025-01-15', '2025-01-20', '2025-02-01', '2025-02-14']
        }
      },
      'luxury-resort-2': {
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
        guests: 'Up to 4 Guests',
        images: [
          'https://images.unsplash.com/photo-1689729738920-edea97589328?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb3VudGFpbiUyMGhvdGVsJTIwcmVzb3J0fGVufDF8fHx8MTc1NzMzNDczMHww&ixlib=rb-4.1.0&q=80&w=1080',
          'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb3VudGFpbiUyMHNraSUyMHJlc29ydHxlbnwxfHx8fDE3NTczMzg0MzB8MA&ixlib=rb-4.1.0&q=80&w=1080',
          'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb3VudGFpbiUyMGxvZGdlfGVufDF8fHx8MTc1NzMzODQzMHww&ixlib=rb-4.1.0&q=80&w=1080',
          'https://images.unsplash.com/photo-1578662996442-48f60103fc96?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHhhbHBpbmUlMjBsYWtlfGVufDF8fHx8MTc1NzMzODQzMHww&ixlib=rb-4.1.0&q=80&w=1080'
        ],
        type: 'Adventure',
        badge: 'Premium',
        description: 'Experience luxury in the heart of the Swiss Alps with our premium mountain retreat package. Enjoy world-class amenities, breathtaking alpine views, and unforgettable winter activities.',
        highlights: [
          'Mountain View Chalet with Fireplace',
          'Ski Equipment & Lift Passes Included',
          'Alpine Spa with Mountain Views',
          'Gourmet Swiss Cuisine Experience',
          'Guided Mountain Hiking Tours',
          'Luxury Transportation Services'
        ],
        included: [
          '4 Days, 3 Nights Accommodation',
          'Daily Alpine Breakfast',
          'Ski Equipment & Lift Passes',
          'Evening Fine Dining (2 Nights)',
          'Welcome Swiss Chocolate & Wine',
          'Mountain Spa Treatment',
          'Airport Transfer (Round Trip)',
          'Concierge Services',
          'Complimentary WiFi',
          'Mountain Activity Guide'
        ],
        excluded: [
          'International Flight Tickets',
          'Travel Insurance',
          'Personal Ski Instructor',
          'Lunch & Beverages',
          'Optional Helicopter Tours',
          'Additional Spa Services',
          'Personal Shopping',
          'Tips and Service Charges'
        ],
        amenities: [Wifi, Car, Coffee, Mountain, Sparkles, Crown],
        policies: {
          checkIn: '4:00 PM onwards',
          checkOut: '11:00 AM',
          cancellation: 'Free cancellation up to 7 days before arrival. 25% refund for cancellations within 3-7 days.',
          payment: 'Credit card required to secure booking. 50% payment due at booking, remainder at check-in.'
        },
        contact: {
          phone: '+41 27 966 2400',
          email: 'reservations@mountaincrown.ch',
          website: 'www.mountaincrownlodge.ch'
        },
        availability: {
          startDate: '2024-12-15',
          endDate: '2025-03-31',
          availableDates: ['2024-12-20', '2025-01-10', '2025-02-05', '2025-03-01']
        }
      },
      'city-boutique-3': {
        id: 'city-boutique-3',
        title: 'Urban Luxury Experience',
        hotelName: 'The Metropolitan',
        location: 'New York, USA',
        originalPrice: 699,
        packagePrice: 449,
        savings: 250,
        rating: 4.7,
        reviews: 2156,
        duration: '2 Days, 1 Night',
        guests: 'Up to 2 Guests',
        images: [
          'https://images.unsplash.com/photo-1726381552645-c4e5645366f6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaXR5JTIwYm91dGlxdWUlMjBob3RlbHxlbnwxfHx8fDE3NTczMzg0Mzd8MA&ixlib=rb-4.1.0&q=80&w=1080',
          'https://images.unsplash.com/photo-1571896349842-33c89424de2d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBob3RlbCUyMHJvb218ZW58MXx8fHwxNzU3MzM4NDMwfDA&ixlib=rb-4.1.0&q=80&w=1080',
          'https://images.unsplash.com/photo-1578662996442-48f60103fc96?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaXR5JTIwc3BhfGVufDF8fHx8MTc1NzMzODQzMHww&ixlib=rb-4.1.0&q=80&w=1080',
          'https://images.unsplash.com/photo-1544551763-46a013bb70d5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaXR5JTIwcmVzdGF1cmFudHxlbnwxfHx8fDE3NTczMzg0MzB8MA&ixlib=rb-4.1.0&q=80&w=1080'
        ],
        type: 'Business',
        badge: 'City Deal',
        description: 'Immerse yourself in the pulse of New York City with our exclusive urban luxury package. Experience Manhattan\'s finest accommodations, Broadway entertainment, and world-class dining.',
        highlights: [
          'Executive Suite with City Views',
          'Broadway Show Tickets Included',
          'Private City Tour Experience',
          'Fine Dining Reservations',
          'Express Airport Transfers',
          'Concierge Shopping Service'
        ],
        included: [
          '2 Days, 1 Night Accommodation',
          'Continental Breakfast',
          'Broadway Show Tickets (2 Seats)',
          'Private City Tour (Half Day)',
          'Fine Dining Restaurant Voucher',
          'Airport Transfer (Round Trip)',
          'Express Check-in/Check-out',
          'Complimentary WiFi',
          'Business Center Access',
          'Personal Concierge Service'
        ],
        excluded: [
          'Flight Tickets',
          'Travel Insurance',
          'Additional Show Tickets',
          'Alcoholic Beverages',
          'Shopping Expenses',
          'Spa Services',
          'Room Service',
          'Gratuities'
        ],
        amenities: [Wifi, Car, Utensils, Sparkles, Coffee, Award],
        policies: {
          checkIn: '3:00 PM onwards',
          checkOut: '12:00 PM',
          cancellation: 'Free cancellation up to 24 hours before arrival. No refund for same-day cancellations.',
          payment: 'Credit card required. Full payment due at check-in.'
        },
        contact: {
          phone: '+1 212 555 0123',
          email: 'concierge@themetropolitan.com',
          website: 'www.metropolitannyc.com'
        },
        availability: {
          startDate: '2025-01-01',
          endDate: '2025-12-31',
          availableDates: ['2025-01-15', '2025-02-01', '2025-03-15', '2025-04-01']
        }
      },
      'wellness-spa-4': {
        id: 'wellness-spa-4',
        title: 'Wellness & Rejuvenation',
        hotelName: 'Serenity Spa Resort',
        location: 'Tuscany, Italy',
        originalPrice: 1099,
        packagePrice: 799,
        savings: 300,
        rating: 4.9,
        reviews: 743,
        duration: '5 Days, 4 Nights',
        guests: 'Up to 2 Guests',
        images: [
          'https://images.unsplash.com/photo-1604161926875-bb58f9a0d81b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcGElMjB3ZWxsbmVzcyUyMGhvdGVsfGVufDF8fHx8MTc1NzMyMzg0Mnww&ixlib=rb-4.1.0&q=80&w=1080',
          'https://images.unsplash.com/photo-1578662996442-48f60103fc96?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcGElMjB0cmVhdG1lbnR8ZW58MXx8fHwxNzU3MzM4NDMwfDA&ixlib=rb-4.1.0&q=80&w=1080',
          'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b2dhJTIwY2xhc3N8ZW58MXx8fHwxNzU3MzM4NDMwfDA&ixlib=rb-4.1.0&q=80&w=1080',
          'https://images.unsplash.com/photo-1544551763-46a013bb70d5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvcmdhbmljJTIwZm9vZHxlbnwxfHx8fDE3NTczMzg0MzB8MA&ixlib=rb-4.1.0&q=80&w=1080'
        ],
        type: 'Wellness',
        badge: 'New',
        description: 'Rejuvenate your mind, body, and soul in the heart of Tuscany with our comprehensive wellness retreat. Experience holistic healing with daily spa treatments, yoga sessions, and organic cuisine.',
        highlights: [
          'Private Spa Villa with Garden Views',
          'Daily Wellness Treatments & Massages',
          'Morning Yoga & Meditation Classes',
          'Organic Farm-to-Table Cuisine',
          'Aromatherapy & Detox Programs',
          'Tuscan Countryside Tours'
        ],
        included: [
          '5 Days, 4 Nights Accommodation',
          'Daily Organic Breakfast & Dinner',
          'Daily Spa Treatment (Choice of 5)',
          'Morning Yoga & Meditation Classes',
          'Aromatherapy & Wellness Consultations',
          'Organic Cooking Class',
          'Vineyard Tour with Wine Tasting',
          'Airport Transfer (Round Trip)',
          'Personal Wellness Concierge',
          'Complimentary WiFi'
        ],
        excluded: [
          'International Flight Tickets',
          'Travel Insurance',
          'Lunch (Available à la carte)',
          'Additional Spa Services',
          'Personal Shopping',
          'Optional Excursions',
          'Alcoholic Beverages (Except Wine Tasting)',
          'Tips and Service Charges'
        ],
        amenities: [Wifi, Sparkles, Utensils, Coffee, Heart, Mountain],
        policies: {
          checkIn: '2:00 PM onwards',
          checkOut: '11:00 AM',
          cancellation: 'Free cancellation up to 7 days before arrival. 50% refund for cancellations within 3-7 days.',
          payment: 'Credit card required. 30% deposit at booking, remainder at check-in.'
        },
        contact: {
          phone: '+39 0577 123 456',
          email: 'wellness@serenityspa.it',
          website: 'www.serenitysparesort.com'
        },
        availability: {
          startDate: '2025-01-01',
          endDate: '2025-11-30',
          availableDates: ['2025-01-20', '2025-02-15', '2025-03-10', '2025-04-05']
        }
      },
      'romantic-suite-5': {
        id: 'romantic-suite-5',
        title: 'Romantic Honeymoon',
        hotelName: 'Villa Romance',
        location: 'Santorini, Greece',
        originalPrice: 1499,
        packagePrice: 1199,
        savings: 300,
        rating: 5.0,
        reviews: 456,
        duration: '6 Days, 5 Nights',
        guests: 'Up to 2 Guests',
        images: [
          'https://images.unsplash.com/photo-1637515128249-df66173ee9b4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyb21hbnRpYyUyMGhvdGVsJTIwc3VpdGV8ZW58MXx8fHwxNTczMzg0NDR8MA&ixlib=rb-4.1.0&q=80&w=1080',
          'https://images.unsplash.com/photo-1580450997544-8846a39f3dfa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcml2YXRlJTIwcG9vbHxlbnwxfHx8fDE3NTczMzg0MzB8MA&ixlib=rb-4.1.0&q=80&w=1080',
          'https://images.unsplash.com/photo-1578662996442-48f60103fc96?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3VwbGVzJTIwbWFzc2FnZXxlbnwxfHx8fDE3NTczMzg0MzB8MA&ixlib=rb-4.1.0&q=80&w=1080',
          'https://images.unsplash.com/photo-1544551763-46a013bb70d5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aW5lJTIwdGFzdGluZ3xlbnwxfHx8fDE3NTczMzg0MzB8MA&ixlib=rb-4.1.0&q=80&w=1080'
        ],
        type: 'Romantic',
        badge: 'Top Rated',
        description: 'Celebrate your love story in the most romantic setting on earth. This exclusive honeymoon package offers luxury, privacy, and unforgettable experiences against the breathtaking backdrop of Santorini.',
        highlights: [
          'Private Pool Villa with Caldera Views',
          'Sunset Cruise with Champagne',
          'Couples Spa Massage & Treatments',
          'Private Wine Tasting Experience',
          'Romantic Beach Picnic Setup',
          'Professional Photography Session'
        ],
        included: [
          '6 Days, 5 Nights Accommodation',
          'Daily Continental Breakfast',
          'Private Sunset Cruise (3 Hours)',
          'Couples Spa Package (90 minutes)',
          'Wine Tasting at Local Vineyard',
          'Romantic Beach Picnic (One Day)',
          'Professional Photo Session (2 Hours)',
          'Welcome Champagne & Rose Petals',
          'Airport Transfer (Round Trip)',
          'Personal Concierge Service'
        ],
        excluded: [
          'International Flight Tickets',
          'Travel Insurance',
          'Lunch & Dinner (Available à la carte)',
          'Additional Wine Purchases',
          'Optional Island Tours',
          'Extra Photography Prints',
          'Personal Expenses',
          'Gratuities'
        ],
        amenities: [Wifi, Car, Utensils, Heart, Sparkles, Crown],
        policies: {
          checkIn: '3:00 PM onwards',
          checkOut: '12:00 PM',
          cancellation: 'Free cancellation up to 14 days before arrival. 25% refund for cancellations within 7-14 days.',
          payment: 'Credit card required. 50% deposit at booking, remainder at check-in.'
        },
        contact: {
          phone: '+30 22860 123 45',
          email: 'romance@villaromance.gr',
          website: 'www.villaromancesantorini.com'
        },
        availability: {
          startDate: '2025-04-01',
          endDate: '2025-10-31',
          availableDates: ['2025-04-15', '2025-05-01', '2025-06-15', '2025-07-01']
        }
      },
      'luxury-resort-6': {
        id: 'luxury-resort-6',
        title: 'Grand Palace Experience',
        hotelName: 'Royal Gardens Resort',
        location: 'Dubai, UAE',
        originalPrice: 1899,
        packagePrice: 1399,
        savings: 500,
        rating: 4.8,
        reviews: 1892,
        duration: '4 Days, 3 Nights',
        guests: 'Up to 4 Guests',
        images: [
          'https://images.unsplash.com/photo-1731080647266-85cf1bc27162?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBob3RlbCUyMHJlc29ydHxlbnwxfHx8fDE3NTczMTY3MjV8MA&ixlib=rb-4.1.0&q=80&w=1080',
          'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyb3lhbCUyMHN1aXRlfGVufDF8fHx8MTc1NzMzODQzMHww&ixlib=rb-4.1.0&q=80&w=1080',
          'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZXNlcnQlMjBzYWZhcml8ZW58MXx8fHwxNzU3MzM4NDMwfDA&ixlib=rb-4.1.0&q=80&w=1080',
          'https://images.unsplash.com/photo-1544551763-46a013bb70d5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcmVtaXVtJTIwZGluaW5nfGVufDF8fHx8MTc1NzMzODQzMHww&ixlib=rb-4.1.0&q=80&w=1080'
        ],
        type: 'Luxury',
        badge: 'Exclusive',
        description: 'Experience the pinnacle of luxury hospitality in Dubai with our exclusive palace package. Enjoy royal treatment, world-class amenities, and unforgettable desert adventures.',
        highlights: [
          'Royal Suite with City & Desert Views',
          'Personal Butler Service 24/7',
          'Private Desert Safari Experience',
          'Premium Dining at Award-winning Restaurants',
          'Helicopter Tour of Dubai',
          'Exclusive Spa & Wellness Facilities'
        ],
        included: [
          '4 Days, 3 Nights Accommodation',
          'Daily Gourmet Breakfast',
          'Personal Butler Service',
          'Private Desert Safari with BBQ Dinner',
          'Helicopter Tour of Dubai (30 minutes)',
          'Premium Dining Credits ($500)',
          'Luxury Spa Treatment (2 Hours)',
          'Airport Transfer in Luxury Vehicle',
          'Complimentary Champagne Service',
          'VIP Airport Fast Track Service'
        ],
        excluded: [
          'International Flight Tickets',
          'Travel Insurance',
          'Additional Dining Beyond Credits',
          'Personal Shopping',
          'Optional Tours & Activities',
          'Alcoholic Beverages (Except Champagne)',
          'Spa Services Beyond Package',
          'Gratuities'
        ],
        amenities: [Wifi, Car, Crown, Coffee, Sparkles, Mountain],
        policies: {
          checkIn: '3:00 PM onwards',
          checkOut: '12:00 PM',
          cancellation: 'Free cancellation up to 7 days before arrival. No refund for cancellations within 48 hours.',
          payment: 'Credit card required. Full payment due at booking for exclusive packages.'
        },
        contact: {
          phone: '+971 4 123 4567',
          email: 'royalty@royalgardens.ae',
          website: 'www.royalgardensresort.com'
        },
        availability: {
          startDate: '2025-01-01',
          endDate: '2025-12-31',
          availableDates: ['2025-01-15', '2025-02-01', '2025-03-15', '2025-04-01']
        }
      }
    };

    const data = packagesData[packageId];
    setPackageData(data || null);
    setIsWishlisted(wishlistService.isWishlisted(packageId));
  }, [packageId]);

  const toggleWishlist = () => {
    wishlistService.toggleWishlist(packageId);
    setIsWishlisted(!isWishlisted);
  };

  const nextImage = () => {
    if (packageData) {
      setCurrentImageIndex((prev) => (prev + 1) % packageData.images.length);
    }
  };

  const prevImage = () => {
    if (packageData) {
      setCurrentImageIndex((prev) => (prev - 1 + packageData.images.length) % packageData.images.length);
    }
  };

  const getAmenityIcon = (index: number) => {
    const icons = [Wifi, Car, Utensils, Sparkles, Coffee, Mountain, Heart, Crown, Plane];
    return icons[index % icons.length];
  };

  const formatDateRange = () => {
    if (!packageData) return '';
    const duration = packageData.duration;
    const match = duration.match(/(\d+)\s*Days/);
    if (match) {
      const days = parseInt(match[1]);
      const today = new Date();
      const endDate = new Date(today);
      endDate.setDate(today.getDate() + days);
      return `${today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}–${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }
    return duration;
  };

  if (!packageData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4 mx-auto"></div>
          <p className="text-foreground">Loading package details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 dark:bg-background overflow-y-auto">
      {/* Image Carousel - Edge to Edge */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative h-80 overflow-hidden"
      >
        <ImageWithFallback
          src={packageData.images[currentImageIndex]}
          alt={packageData.title}
          className="w-full h-full object-cover"
        />
        
        {/* Floating Back Button */}
        <motion.button
          onClick={onBack}
          className="absolute top-4 left-4 w-10 h-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-700 dark:text-foreground border border-white/20 shadow-lg z-10"
          whileHover={{ scale: 1.05, backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <ArrowLeft className="w-5 h-5" />
        </motion.button>

        {/* Floating Action Buttons */}
        <div className="absolute top-4 right-4 flex gap-2 z-10">
          <motion.button
            className="w-10 h-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-700 dark:text-foreground border border-white/20 shadow-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Share2 className="w-5 h-5" />
          </motion.button>
          
          <motion.button
            onClick={toggleWishlist}
            className={`w-10 h-10 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20 shadow-lg transition-all duration-300 ${
              isWishlisted 
                ? 'bg-primary text-white' 
                : 'bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-foreground'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
          </motion.button>
        </div>

        {/* Photo Count Button */}
        <motion.button
          onClick={() => setShowAllImages(true)}
          className="absolute bottom-4 right-4 px-3 py-1.5 bg-black/70 text-white rounded-lg text-sm flex items-center gap-1.5 hover:bg-black/80 transition-colors shadow-lg"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Camera className="w-4 h-4" />
          {currentImageIndex + 1}/{packageData.images.length}
        </motion.button>

        {/* Image Navigation */}
        {packageData.images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors z-10"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors z-10"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Image Indicators */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
          {packageData.images.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentImageIndex ? 'bg-white' : 'bg-white/50'
              }`}
            />
          ))}
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
      </motion.div>

      {/* Content */}
      <div className="p-4 space-y-6 pb-32">
        {/* Package Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6 border-0 shadow-lg bg-white dark:bg-card">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-0">
                    {packageData.type}
                  </Badge>
                  <Badge className="bg-gradient-partner text-white border-0">
                    {packageData.badge}
                  </Badge>
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-2">{packageData.title}</h1>
                <p className="text-lg text-muted-foreground mb-2">{packageData.hotelName}</p>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{packageData.location}</span>
                </div>
              </div>
              
              <div className="text-right">
                <div className="flex items-center gap-1 mb-1">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-bold text-lg text-foreground">{packageData.rating}</span>
                </div>
                <p className="text-sm text-muted-foreground">({packageData.reviews} reviews)</p>
              </div>
            </div>
            
            {/* Package Details */}
            <div className="flex items-center gap-6 mb-4 text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{packageData.duration}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{packageData.guests}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>Available Now</span>
              </div>
            </div>
            
            <Separator className="my-4" />
            
            {/* Description */}
            <p className="text-muted-foreground leading-relaxed">{packageData.description}</p>
          </Card>
        </motion.div>

        {/* Tabs Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs defaultValue="highlights" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="highlights">Highlights</TabsTrigger>
              <TabsTrigger value="included">Included</TabsTrigger>
              <TabsTrigger value="policies">Policies</TabsTrigger>
              <TabsTrigger value="contact">Contact</TabsTrigger>
            </TabsList>
            
            <TabsContent value="highlights" className="space-y-4">
              {/* Highlights */}
              <Card className="p-6 border-0 shadow-lg bg-white dark:bg-card">
                <h3 className="font-bold text-lg mb-4 text-foreground">Package Highlights</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {packageData.highlights.map((highlight, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{highlight}</span>
                    </div>
                  ))}
                </div>
              </Card>
              
              {/* Amenities */}
              <Card className="p-6 border-0 shadow-lg bg-white dark:bg-card">
                <h3 className="font-bold text-lg mb-4 text-foreground">Amenities</h3>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                  {packageData.amenities.map((_, index) => {
                    const IconComponent = getAmenityIcon(index);
                    return (
                      <div key={index} className="flex flex-col items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <IconComponent className="w-6 h-6 text-primary" />
                        <span className="text-xs text-muted-foreground text-center">
                          {['WiFi', 'Transport', 'Dining', 'Spa', 'Coffee', 'Activities', 'Romance', 'Luxury', 'Travel'][index]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </TabsContent>
            
            <TabsContent value="included" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Included */}
                <Card className="p-6 border-0 shadow-lg bg-white dark:bg-card">
                  <h3 className="font-bold text-lg mb-4 text-green-600">What's Included</h3>
                  <div className="space-y-3">
                    {packageData.included.map((item, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{item}</span>
                      </div>
                    ))}
                  </div>
                </Card>
                
                {/* Excluded */}
                <Card className="p-6 border-0 shadow-lg bg-white dark:bg-card">
                  <h3 className="font-bold text-lg mb-4 text-red-600">What's Not Included</h3>
                  <div className="space-y-3">
                    {packageData.excluded.map((item, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{item}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="policies" className="space-y-4">
              <Card className="p-6 space-y-6 border-0 shadow-lg bg-white dark:bg-card">
                <div>
                  <h3 className="font-bold text-lg mb-3 text-foreground">Check-in & Check-out</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Check-in:</span>
                      <span className="font-medium text-foreground">{packageData.policies.checkIn}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Check-out:</span>
                      <span className="font-medium text-foreground">{packageData.policies.checkOut}</span>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="font-bold text-lg mb-3 text-foreground">Cancellation Policy</h3>
                  <p className="text-muted-foreground">{packageData.policies.cancellation}</p>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="font-bold text-lg mb-3 text-foreground">Payment Policy</h3>
                  <p className="text-muted-foreground">{packageData.policies.payment}</p>
                </div>
              </Card>
            </TabsContent>
            
            <TabsContent value="contact" className="space-y-4">
              <Card className="p-6 space-y-6 border-0 shadow-lg bg-white dark:bg-card">
                <h3 className="font-bold text-lg text-foreground">Contact Information</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Phone className="w-6 h-6 text-primary" />
                    <div>
                      <p className="font-medium text-foreground">Phone</p>
                      <p className="text-muted-foreground">{packageData.contact.phone}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Mail className="w-6 h-6 text-primary" />
                    <div>
                      <p className="font-medium text-foreground">Email</p>
                      <p className="text-muted-foreground">{packageData.contact.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <MessageCircle className="w-6 h-6 text-primary" />
                    <div>
                      <p className="font-medium text-foreground">Website</p>
                      <p className="text-primary">{packageData.contact.website}</p>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4">
                  <Button className="w-full bg-primary hover:bg-primary/90 text-white">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Contact Hotel Directly
                  </Button>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>

      {/* Sticky Bottom CTA Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="fixed bottom-0 left-0 right-0 w-full bg-white dark:bg-card border-t border-gray-200 dark:border-border shadow-2xl z-50"
        style={{ margin: 0, padding: 0 }}
      >
        <div className="flex items-center justify-between px-4 py-4 max-w-full w-full">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-foreground">${packageData.packagePrice}</span>
              <span className="text-lg text-muted-foreground line-through">${packageData.originalPrice}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {packageData.duration} · {formatDateRange()}
            </p>
          </div>
          
          <motion.button 
            onClick={() => onBookNow(packageId)}
            className="px-8 py-3 rounded-xl text-white font-bold text-lg shadow-xl transition-all duration-200 min-w-[140px] gradient-rose-primary hover:gradient-rose-primary-hover ml-4"
            whileTap={{ scale: 0.95 }}
            whileHover={{ 
              scale: 1.05,
              boxShadow: '0 20px 40px rgba(225, 29, 72, 0.3)'
            }}
          >
            Book Now
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}