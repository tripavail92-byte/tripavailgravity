import { motion } from 'motion/react';
import { DollarSign, Calendar, Users, TrendingUp, Map, Plus } from 'lucide-react';
import { Card } from '../../../components/ui/card';

interface DashboardScreenProps {
  onNavigate: (screen: string) => void;
}

export default function DashboardScreen({ onNavigate }: DashboardScreenProps) {
  const stats = [
    { label: 'Monthly Revenue', value: '$8,750', change: '+15.3%', icon: DollarSign },
    { label: 'Tour Bookings', value: '18', change: '+22.1%', icon: Calendar },
    { label: 'Active Tours', value: '7', change: '+2', icon: Map },
    { label: 'Avg Rating', value: '4.9', change: '+0.1', icon: TrendingUp }
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <motion.div
        className="grid grid-cols-2 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 + index * 0.1 }}
          >
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className="w-6 h-6 text-[#E11D48]" />
                <span className="text-xs text-green-600 font-medium">{stat.change}</span>
              </div>
              <p className="text-lg font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        className="grid grid-cols-1 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card 
          className="p-4 cursor-pointer hover:shadow-md transition-shadow border-2 border-dashed border-[#E11D48] border-opacity-30"
          onClick={() => onNavigate('tours')}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#E11D48] bg-opacity-10 rounded-lg flex items-center justify-center">
              <Plus className="w-6 h-6 text-[#E11D48]" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Create New Tour</h3>
              <p className="text-sm text-gray-600">Design a new tour experience</p>
            </div>
          </div>
        </Card>

        <Card 
          className="p-4 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onNavigate('tours')}
        >
          <div className="flex items-center gap-4">
            <Map className="w-10 h-10 text-blue-600" />
            <div>
              <h3 className="font-semibold text-gray-900">My Tours</h3>
              <p className="text-sm text-gray-600">7 active tours</p>
            </div>
          </div>
        </Card>

        <Card 
          className="p-4 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onNavigate('bookings')}
        >
          <div className="flex items-center gap-4">
            <Users className="w-10 h-10 text-green-600" />
            <div>
              <h3 className="font-semibold text-gray-900">Tour Bookings</h3>
              <p className="text-sm text-gray-600">3 pending confirmations</p>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}