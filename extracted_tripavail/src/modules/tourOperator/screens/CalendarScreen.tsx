import { motion } from 'motion/react';
import { Calendar, Users, MapPin, Clock } from 'lucide-react';
import { Card } from '../../../components/ui/card';

interface CalendarScreenProps {
  onNavigate: (screen: string) => void;
}

export default function CalendarScreen({ onNavigate }: CalendarScreenProps) {
  const upcomingTours = [
    {
      id: 1,
      title: 'Northern Areas Adventure',
      date: 'Dec 15-20, 2024',
      participants: 8,
      maxParticipants: 12,
      location: 'Hunza, Pakistan',
      status: 'confirmed'
    },
    {
      id: 2,
      title: 'Cultural Heritage Tour',
      date: 'Dec 22-25, 2024',
      participants: 15,
      maxParticipants: 20,
      location: 'Lahore, Pakistan',
      status: 'filling'
    },
    {
      id: 3,
      title: 'Desert Safari Experience',
      date: 'Jan 5-8, 2025',
      participants: 3,
      maxParticipants: 10,
      location: 'Cholistan Desert',
      status: 'available'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'filling': return 'bg-yellow-100 text-yellow-800';
      case 'available': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Confirmed';
      case 'filling': return 'Filling Up';
      case 'available': return 'Available';
      default: return 'Unknown';
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
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-[#9D6777] bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-[#9D6777]" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Calendar & Availability</h2>
          <p className="text-gray-600">Manage your tour schedules and availability</p>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <motion.div
        className="grid grid-cols-3 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="p-3 text-center">
          <Clock className="w-6 h-6 text-[#9D6777] mx-auto mb-1" />
          <p className="text-lg font-bold text-gray-900">7</p>
          <p className="text-xs text-gray-600">Active Tours</p>
        </Card>
        <Card className="p-3 text-center">
          <Users className="w-6 h-6 text-green-600 mx-auto mb-1" />
          <p className="text-lg font-bold text-gray-900">26</p>
          <p className="text-xs text-gray-600">Participants</p>
        </Card>
        <Card className="p-3 text-center">
          <MapPin className="w-6 h-6 text-blue-600 mx-auto mb-1" />
          <p className="text-lg font-bold text-gray-900">5</p>
          <p className="text-xs text-gray-600">Destinations</p>
        </Card>
      </motion.div>

      {/* Upcoming Tours */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h3 className="font-semibold text-gray-900 mb-4">Upcoming Tours</h3>
        
        <div className="space-y-4">
          {upcomingTours.map((tour, index) => (
            <motion.div
              key={tour.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
            >
              <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{tour.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <Calendar className="w-4 h-4" />
                      <span>{tour.date}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{tour.location}</span>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(tour.status)}`}>
                    {getStatusText(tour.status)}
                  </div>
                </div>

                {/* Participants Progress */}
                <div className="mb-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">Participants</span>
                    <span className="text-sm font-medium text-gray-900">
                      {tour.participants}/{tour.maxParticipants}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full bg-[#9D6777]"
                      style={{ width: `${(tour.participants / tour.maxParticipants) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-3">
                  <button className="flex-1 px-3 py-1.5 text-sm bg-[#9D6777] text-white rounded-md hover:bg-[#9D6777]/90 transition-colors">
                    Manage
                  </button>
                  <button className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
                    View Details
                  </button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Calendar Actions */}
      <motion.div
        className="grid grid-cols-1 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow border-2 border-dashed border-[#9D6777] border-opacity-30">
          <div className="text-center">
            <Calendar className="w-10 h-10 text-[#9D6777] mx-auto mb-2" />
            <h3 className="font-semibold text-gray-900 mb-1">Schedule New Tour</h3>
            <p className="text-sm text-gray-600">Add a new tour to your calendar</p>
          </div>
        </Card>

        <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow">
          <div className="text-center">
            <Clock className="w-10 h-10 text-blue-600 mx-auto mb-2" />
            <h3 className="font-semibold text-gray-900 mb-1">Availability Settings</h3>
            <p className="text-sm text-gray-600">Manage your available dates and times</p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}