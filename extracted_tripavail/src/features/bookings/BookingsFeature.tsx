import { motion } from 'motion/react';
import { Calendar, User, DollarSign, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';

export function BookingsFeature() {
  const mockBookings = [
    {
      id: 1,
      guestName: 'Sarah Johnson',
      checkIn: '2024-12-15',
      checkOut: '2024-12-18',
      nights: 3,
      amount: 450,
      status: 'confirmed',
      room: 'Deluxe Ocean View'
    },
    {
      id: 2,
      guestName: 'Michael Chen',
      checkIn: '2024-12-20',
      checkOut: '2024-12-23',
      nights: 3,
      amount: 525,
      status: 'pending',
      room: 'Executive Suite'
    },
    {
      id: 3,
      guestName: 'Emma Wilson',
      checkIn: '2024-12-10',
      checkOut: '2024-12-12',
      nights: 2,
      amount: 300,
      status: 'completed',
      room: 'Standard Room'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      default:
        return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-red-100 text-red-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl text-gray-900">Bookings Management</h1>
            <p className="text-gray-600">Manage your guest reservations and bookings</p>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-[#5FAD43] text-white rounded-lg hover:bg-green-600 transition-colors">
              Export Report
            </button>
            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              Filter
            </button>
          </div>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8 text-[#5FAD43]" />
            <div>
              <p className="text-sm text-gray-600">Total Bookings</p>
              <p className="text-xl font-semibold text-gray-900">24</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Confirmed</p>
              <p className="text-xl font-semibold text-gray-900">18</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-yellow-500" />
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-xl font-semibold text-gray-900">4</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Revenue (Month)</p>
              <p className="text-xl font-semibold text-gray-900">$12,450</p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Bookings List */}
      <motion.div
        className="space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="text-lg font-semibold text-gray-900">Recent Bookings</h2>
        
        {mockBookings.map((booking, index) => (
          <motion.div
            key={booking.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + index * 0.1 }}
          >
            <Card className="p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-gray-600" />
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{booking.guestName}</h3>
                    <p className="text-sm text-gray-600 mb-2">{booking.room}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {booking.checkIn} - {booking.checkOut}
                      </div>
                      <span>•</span>
                      <span>{booking.nights} nights</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusIcon(booking.status)}
                    <Badge className={getStatusColor(booking.status)}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </Badge>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">${booking.amount}</p>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex justify-end gap-2">
                  <button className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 transition-colors">
                    View Details
                  </button>
                  <button className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors">
                    Contact Guest
                  </button>
                  {booking.status === 'pending' && (
                    <button className="px-3 py-1 text-sm bg-[#5FAD43] text-white rounded hover:bg-green-600 transition-colors">
                      Confirm
                    </button>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}