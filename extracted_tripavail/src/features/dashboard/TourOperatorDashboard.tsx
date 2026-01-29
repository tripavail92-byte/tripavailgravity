import { motion } from 'motion/react';
import { Calendar, DollarSign, Users, TrendingUp, MapPin, Star, Clock, CheckCircle } from 'lucide-react';
import { Card } from '../../components/ui/card';

export function TourOperatorDashboard() {
  const stats = [
    {
      title: 'Monthly Revenue',
      value: '$8,750',
      change: '+15.3%',
      icon: DollarSign,
      trend: 'up'
    },
    {
      title: 'Tour Bookings',
      value: '18',
      change: '+22.1%',
      icon: Calendar,
      trend: 'up'
    },
    {
      title: 'Active Tours',
      value: '7',
      change: '+2',
      icon: MapPin,
      trend: 'up'
    },
    {
      title: 'Average Rating',
      value: '4.9',
      change: '+0.1',
      icon: Star,
      trend: 'up'
    }
  ];

  const upcomingTours = [
    { id: 1, title: 'City Walking Tour', date: '2024-12-15', participants: 8, status: 'confirmed' },
    { id: 2, title: 'Mountain Hiking Adventure', date: '2024-12-18', participants: 6, status: 'confirmed' },
    { id: 3, title: 'Cultural Heritage Tour', date: '2024-12-20', participants: 4, status: 'pending' }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <h1 className="text-2xl text-gray-900 mb-2">Welcome back, Maria! 🚀</h1>
        <p className="text-gray-600">Here's what's happening with your tours today</p>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + index * 0.1 }}
          >
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingUp className={`w-4 h-4 ${stat.trend === 'up' ? 'text-green-500' : 'text-red-500'}`} />
                    <span className={`text-sm ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                      {stat.change}
                    </span>
                    <span className="text-sm text-gray-500">vs last month</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-[#5FAD43] bg-opacity-10 rounded-lg flex items-center justify-center">
                  <stat.icon className="w-6 h-6 text-[#5FAD43]" />
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
      >
        <Card className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <MapPin className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Create New Tour</h3>
              <p className="text-sm text-gray-600">Add a new tour experience</p>
            </div>
          </div>
          <button className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Create Tour
          </button>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Manage Schedule</h3>
              <p className="text-sm text-gray-600">Update tour availability</p>
            </div>
          </div>
          <button className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            View Calendar
          </button>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Analytics</h3>
              <p className="text-sm text-gray-600">Performance insights</p>
            </div>
          </div>
          <button className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
            View Analytics
          </button>
        </Card>
      </motion.div>

      {/* Upcoming Tours */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Upcoming Tours</h2>
            <button className="text-[#5FAD43] hover:text-green-600 transition-colors text-sm font-medium">
              View All
            </button>
          </div>
          
          <div className="space-y-4">
            {upcomingTours.map((tour, index) => (
              <motion.div
                key={tour.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{tour.title}</p>
                    <p className="text-sm text-gray-600">{tour.participants} participants</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-sm text-gray-900">{tour.date}</p>
                  <div className="flex items-center gap-1">
                    {tour.status === 'confirmed' ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <Clock className="w-4 h-4 text-yellow-500" />
                    )}
                    <span className={`text-xs capitalize ${
                      tour.status === 'confirmed' ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      {tour.status}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      </motion.div>
    </div>
  );
}