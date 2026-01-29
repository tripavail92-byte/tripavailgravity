import { motion } from 'motion/react';
import { Calendar, Clock, User, DollarSign } from 'lucide-react';
import { Card } from '../../components/ui/card';

export function CalendarFeature() {
  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl text-gray-900">Calendar & Availability</h1>
            <p className="text-gray-600">Manage your booking calendar and availability</p>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-[#5FAD43] text-white rounded-lg hover:bg-green-600 transition-colors">
              Block Dates
            </button>
            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              Export Calendar
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
              <p className="text-sm text-gray-600">Available Days</p>
              <p className="text-xl font-semibold text-gray-900">23</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <User className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Bookings This Month</p>
              <p className="text-xl font-semibold text-gray-900">12</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-orange-500" />
            <div>
              <p className="text-sm text-gray-600">Blocked Days</p>
              <p className="text-xl font-semibold text-gray-900">5</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Revenue (Month)</p>
              <p className="text-xl font-semibold text-gray-900">$2,450</p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Calendar Component Placeholder */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="p-6">
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Interactive Calendar</h3>
            <p className="text-gray-600 mb-4">
              Full calendar functionality coming soon! You'll be able to:
            </p>
            <div className="text-left max-w-md mx-auto space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-[#5FAD43] rounded-full"></div>
                Set availability and pricing for specific dates
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                View and manage incoming bookings
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                Block dates for maintenance or personal use
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                Sync with external calendar systems
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}