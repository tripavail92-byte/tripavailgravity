import { motion } from 'motion/react';
import { Calendar, CheckCircle, Clock } from 'lucide-react';
import { Card } from '../../../components/ui/card';
import type { UserRole } from '../../../lib/types';

interface BookingsScreenProps {
  role: UserRole;
  onNavigate: (screen: string) => void;
}

export default function BookingsScreen({ role, onNavigate }: BookingsScreenProps) {
  const getBookingsTitle = () => {
    switch (role) {
      case 'hotel_manager':
        return 'Hotel Bookings';
      case 'tour_operator':
        return 'Tour Bookings';
      default:
        return 'My Bookings';
    }
  };

  const mockBookings = [
    { id: 1, title: 'Ocean View Suite', status: 'confirmed', date: 'Dec 15-18' },
    { id: 2, title: 'Mountain Adventure', status: 'pending', date: 'Jan 5-7' }
  ];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-4">{getBookingsTitle()}</h2>
        
        {mockBookings.map((booking, index) => (
          <motion.div
            key={booking.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
          >
            <Card className="p-4 mb-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  {booking.status === 'confirmed' ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <Clock className="w-5 h-5 text-yellow-600" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{booking.title}</h3>
                  <p className="text-sm text-gray-600">{booking.date}</p>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs ${
                  booking.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {booking.status}
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}