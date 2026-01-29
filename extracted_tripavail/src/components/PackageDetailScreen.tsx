import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, Star, MapPin, Calendar, Users, Heart, Share2,
  Wifi, Car, Utensils, Coffee, Mountain, Sparkles, Crown,
  Check, X, Info, Camera, Play, ChevronLeft, ChevronRight,
  Clock, DollarSign, Shield, Phone, Mail, MessageCircle
} from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Separator } from './ui/separator';

interface PackageDetail {
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

interface PackageDetailScreenProps {
  packageId: string;
  onBack: () => void;
  onBookNow: (packageId: string) => void;
  onToggleWishlist: (packageId: string, isWishlisted: boolean) => void;
  isWishlisted: boolean;
}

export function PackageDetailScreen({ 
  packageId, 
  onBack, 
  onBookNow, 
  onToggleWishlist,
  isWishlisted 
}: PackageDetailScreenProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showAllImages, setShowAllImages] = useState(false);

  // Mock data - in real app, this would come from props or API
  const packageDetail: PackageDetail = {
    id: packageId,
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
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % packageDetail.images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + packageDetail.images.length) % packageDetail.images.length);
  };

  const getAmenityIcon = (index: number) => {
    const icons = [Wifi, Car, Utensils, Sparkles, Coffee, Mountain];
    return icons[index % icons.length];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.button
              onClick={onBack}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </motion.button>
            <h1 className="font-semibold text-gray-900">Package Details</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <motion.button
              onClick={() => onToggleWishlist(packageId, !isWishlisted)}
              className={`p-2 rounded-lg transition-all duration-300 ${
                isWishlisted 
                  ? 'bg-red-50 text-red-500' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Heart className={`w-6 h-6 ${isWishlisted ? 'fill-current' : ''}`} />
            </motion.button>
            
            <motion.button
              className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Share2 className="w-6 h-6" />
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Image Gallery */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="relative h-64 overflow-hidden"
      >
        <ImageWithFallback
          src={packageDetail.images[currentImageIndex]}
          alt={packageDetail.title}
          className="w-full h-full object-cover"
        />
        
        {/* Image Navigation */}
        {packageDetail.images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
        
        {/* Image Indicators */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
          {packageDetail.images.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentImageIndex ? 'bg-white' : 'bg-white/50'
              }`}
            />
          ))}
        </div>
        
        {/* Badge */}
        <div className="absolute top-4 left-4">
          <Badge className="bg-[#5FAD43] text-white">
            {packageDetail.badge}
          </Badge>
        </div>
        
        {/* Photo Count */}
        <button
          onClick={() => setShowAllImages(true)}
          className="absolute bottom-4 right-4 px-3 py-1 bg-black/70 text-white rounded-lg text-sm flex items-center gap-1 hover:bg-black/80 transition-colors"
        >
          <Camera className="w-4 h-4" />
          {packageDetail.images.length} Photos
        </button>
      </motion.div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Package Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                    {packageDetail.type}
                  </Badge>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{packageDetail.title}</h2>
                <p className="text-lg text-gray-700 mb-2">{packageDetail.hotelName}</p>
                <div className="flex items-center gap-1 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{packageDetail.location}</span>
                </div>
              </div>
              
              <div className="text-right">
                <div className="flex items-center gap-1 mb-1">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-bold text-lg">{packageDetail.rating}</span>
                </div>
                <p className="text-sm text-gray-500">({packageDetail.reviews} reviews)</p>
              </div>
            </div>
            
            {/* Package Details */}
            <div className="flex items-center gap-6 mb-4 text-gray-600">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{packageDetail.duration}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{packageDetail.guests}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>Available Now</span>
              </div>
            </div>
            
            {/* Pricing */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-bold text-gray-900">${packageDetail.packagePrice}</span>
                  <span className="text-lg text-gray-500 line-through">${packageDetail.originalPrice}</span>
                  <Badge className="bg-green-100 text-green-700">
                    Save ${packageDetail.savings}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">per package • includes taxes</p>
              </div>
              
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  onClick={() => onBookNow(packageId)}
                  size="lg"
                  className="bg-[#5FAD43] hover:bg-[#4A9C39] text-white px-8"
                >
                  Book Now
                </Button>
              </motion.div>
            </div>
          </Card>
        </motion.div>

        {/* Tabs Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="included">Included</TabsTrigger>
              <TabsTrigger value="policies">Policies</TabsTrigger>
              <TabsTrigger value="contact">Contact</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6">
              {/* Description */}
              <Card className="p-6">
                <h3 className="font-bold text-lg mb-3">About This Package</h3>
                <p className="text-gray-700 leading-relaxed">{packageDetail.description}</p>
              </Card>
              
              {/* Highlights */}
              <Card className="p-6">
                <h3 className="font-bold text-lg mb-4">Package Highlights</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {packageDetail.highlights.map((highlight, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-[#5FAD43] flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{highlight}</span>
                    </div>
                  ))}
                </div>
              </Card>
              
              {/* Amenities */}
              <Card className="p-6">
                <h3 className="font-bold text-lg mb-4">Amenities</h3>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                  {packageDetail.amenities.map((_, index) => {
                    const IconComponent = getAmenityIcon(index);
                    return (
                      <div key={index} className="flex flex-col items-center gap-2 p-3 bg-gray-50 rounded-lg">
                        <IconComponent className="w-6 h-6 text-[#5FAD43]" />
                        <span className="text-xs text-gray-600 text-center">
                          {['WiFi', 'Transport', 'Dining', 'Spa', 'Coffee', 'Activities'][index]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </TabsContent>
            
            <TabsContent value="included" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Included */}
                <Card className="p-6">
                  <h3 className="font-bold text-lg mb-4 text-green-700">What's Included</h3>
                  <div className="space-y-3">
                    {packageDetail.included.map((item, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{item}</span>
                      </div>
                    ))}
                  </div>
                </Card>
                
                {/* Excluded */}
                <Card className="p-6">
                  <h3 className="font-bold text-lg mb-4 text-red-700">What's Not Included</h3>
                  <div className="space-y-3">
                    {packageDetail.excluded.map((item, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{item}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="policies" className="space-y-6">
              <Card className="p-6 space-y-6">
                <div>
                  <h3 className="font-bold text-lg mb-3">Check-in & Check-out</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Check-in:</span>
                      <span className="font-medium">{packageDetail.policies.checkIn}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Check-out:</span>
                      <span className="font-medium">{packageDetail.policies.checkOut}</span>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="font-bold text-lg mb-3">Cancellation Policy</h3>
                  <p className="text-gray-700">{packageDetail.policies.cancellation}</p>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="font-bold text-lg mb-3">Payment Policy</h3>
                  <p className="text-gray-700">{packageDetail.policies.payment}</p>
                </div>
              </Card>
            </TabsContent>
            
            <TabsContent value="contact" className="space-y-6">
              <Card className="p-6 space-y-6">
                <h3 className="font-bold text-lg">Contact Information</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <Phone className="w-6 h-6 text-[#5FAD43]" />
                    <div>
                      <p className="font-medium">Phone</p>
                      <p className="text-gray-600">{packageDetail.contact.phone}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <Mail className="w-6 h-6 text-[#5FAD43]" />
                    <div>
                      <p className="font-medium">Email</p>
                      <p className="text-gray-600">{packageDetail.contact.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <MessageCircle className="w-6 h-6 text-[#5FAD43]" />
                    <div>
                      <p className="font-medium">Website</p>
                      <p className="text-blue-600">{packageDetail.contact.website}</p>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4">
                  <Button className="w-full bg-[#5FAD43] hover:bg-[#4A9C39] text-white">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Contact Hotel Directly
                  </Button>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>

      {/* Sticky Book Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="sticky bottom-0 bg-white border-t border-gray-200 p-4"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-gray-900">${packageDetail.packagePrice}</span>
              <span className="text-lg text-gray-500 line-through">${packageDetail.originalPrice}</span>
            </div>
            <p className="text-sm text-gray-600">per package</p>
          </div>
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              onClick={() => onBookNow(packageId)}
              size="lg"
              className="bg-[#5FAD43] hover:bg-[#4A9C39] text-white px-8"
            >
              Book Now
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}