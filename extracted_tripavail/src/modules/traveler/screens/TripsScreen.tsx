import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  MapPin, Calendar, Plane, Star, CheckCircle, AlertCircle, 
  XCircle, Hotel, Car, Download, Phone
} from 'lucide-react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';

interface TripsScreenProps {
  onNavigate: (screen: string) => void;
}

export default function TripsScreen({ onNavigate }: TripsScreenProps) {
  const [activeTab, setActiveTab] = useState('upcoming');

  const trips = {
    upcoming: [
      {
        id: '1',
        destination: 'Maldives Resort Paradise',
        location: 'Male, Maldives',
        dates: 'Mar 15-22, 2024',
        status: 'confirmed',
        image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
        price: '$2,850',
        bookingRef: 'TR-MV-001',
        daysLeft: 18
      },
      {
        id: '2',
        destination: 'Tokyo Adventure',
        location: 'Tokyo, Japan',
        dates: 'Apr 5-12, 2024',
        status: 'pending',
        image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400',
        price: '$1,650',
        bookingRef: 'TR-JP-002',
        daysLeft: 35
      }
    ],
    completed: [
      {
        id: '3',
        destination: 'Bali Cultural Experience',
        location: 'Ubud, Indonesia',
        dates: 'Dec 10-17, 2023',
        status: 'completed',
        image: 'https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?w=400',
        price: '$1,250',
        bookingRef: 'TR-ID-003',
        rating: 5
      },
      {
        id: '4',
        destination: 'Dubai Luxury Getaway',
        location: 'Dubai, UAE',
        dates: 'Oct 8-15, 2023',
        status: 'completed',
        image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400',
        price: '$2,100',
        bookingRef: 'TR-AE-004',
        rating: 4
      }
    ]
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending': return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-blue-600" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const renderTripCard = (trip: any, isCompleted = false) => (
    <motion.div
      key={trip.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4"
    >
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        <div className="relative">
          <img 
            src={trip.image} 
            alt={trip.destination}
            className="w-full h-40 object-cover"
          />
          <div className="absolute top-4 right-4">
            <Badge className={`${getStatusColor(trip.status)} border`}>
              <div className="flex items-center gap-1">
                {getStatusIcon(trip.status)}
                <span className="capitalize">{trip.status}</span>
              </div>
            </Badge>
          </div>
          {trip.daysLeft && (
            <div className="absolute bottom-4 left-4">
              <Badge className="bg-black bg-opacity-70 text-white">
                {trip.daysLeft} days to go
              </Badge>
            </div>
          )}
        </div>

        <div className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">{trip.destination}</h3>
              <div className="flex items-center text-gray-600 text-sm mb-1">
                <MapPin className="w-4 h-4 mr-1" />
                {trip.location}
              </div>
              <div className="flex items-center text-gray-600 text-sm">
                <Calendar className="w-4 h-4 mr-1" />
                {trip.dates}
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold text-gray-900">{trip.price}</p>
              <p className="text-xs text-gray-500">{trip.bookingRef}</p>
            </div>
          </div>

          {isCompleted && trip.rating && (
            <div className="flex items-center gap-1 mb-3">
              <span className="text-sm text-gray-600">Your rating:</span>
              {[...Array(trip.rating)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
          )}

          {/* Simple Actions */}
          <div className="flex gap-2">
            {isCompleted ? (
              <>
                <Button variant="outline" size="sm" className="flex-1">
                  <Download className="w-4 h-4 mr-2" />
                  Receipt
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <Star className="w-4 h-4 mr-2" />
                  Review
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" className="flex-1">
                  <Phone className="w-4 h-4 mr-2" />
                  Contact
                </Button>
                <Button 
                  size="sm" 
                  className="flex-1 bg-[#5FAD43] hover:bg-[#4a8f35]"
                >
                  View Details
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );

  const currentTrips = trips[activeTab as keyof typeof trips] || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">My Trips</h2>
        <p className="text-gray-600">Your travel history and upcoming adventures</p>
      </motion.div>

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 gap-4"
      >
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-[#5FAD43] mb-1">
            {trips.upcoming.length}
          </div>
          <div className="text-sm text-gray-600">Upcoming</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-blue-600 mb-1">
            {trips.completed.length}
          </div>
          <div className="text-sm text-gray-600">Completed</div>
        </Card>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upcoming">
              Upcoming ({trips.upcoming.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({trips.completed.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="mt-6">
            {currentTrips.length > 0 ? (
              currentTrips.map((trip) => renderTripCard(trip))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <Plane className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="font-medium text-gray-900 mb-2">No upcoming trips</h3>
                <p className="text-gray-600">Start planning your next adventure!</p>
              </motion.div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="mt-6">
            {currentTrips.length > 0 ? (
              currentTrips.map((trip) => renderTripCard(trip, true))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <Star className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="font-medium text-gray-900 mb-2">No completed trips yet</h3>
                <p className="text-gray-600">Your travel history will appear here</p>
              </motion.div>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}