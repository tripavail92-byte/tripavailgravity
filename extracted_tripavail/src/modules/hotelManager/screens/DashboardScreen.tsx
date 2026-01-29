import { motion } from 'motion/react';
import { DollarSign, Calendar, Users, TrendingUp, Building, Plus } from 'lucide-react';
import { Card } from '../../../components/ui/card';

interface DashboardScreenProps {
  onNavigate: (screen: string) => void;
}

export default function DashboardScreen({ onNavigate }: DashboardScreenProps) {
  const stats = [
    { label: 'Monthly Revenue', value: '$12,450', change: '+12.5%', icon: DollarSign },
    { label: 'Bookings', value: '24', change: '+8.2%', icon: Calendar },
    { label: 'Occupancy', value: '78%', change: '+5.1%', icon: Users },
    { label: 'Avg Rating', value: '4.8', change: '+0.2', icon: TrendingUp }
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <motion.div
        className="grid grid-cols-2 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        data-tour="dashboard-cards"
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
          onClick={() => onNavigate('calendar')}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#E11D48] bg-opacity-10 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-[#E11D48]" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Manage Calendar</h3>
              <p className="text-sm text-gray-600">Set availability & pricing</p>
            </div>
          </div>
        </Card>

        <Card 
          className="p-4 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onNavigate('bookings')}
        >
          <div className="flex items-center gap-4">
            <Users className="w-10 h-10 text-blue-600" />
            <div>
              <h3 className="font-semibold text-gray-900">Recent Bookings</h3>
              <p className="text-sm text-gray-600">2 pending confirmations</p>
            </div>
          </div>
        </Card>

        <Card 
          className="p-4 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onNavigate('properties')}
        >
          <div className="flex items-center gap-4">
            <Building className="w-10 h-10 text-green-600" />
            <div>
              <h3 className="font-semibold text-gray-900">My Properties</h3>
              <p className="text-sm text-gray-600">Manage your listings</p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Performance Chart Placeholder */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue Overview</h2>
          <div className="h-32 bg-gradient-to-r from-[#E11D48] to-[#E11D48] bg-opacity-10 rounded-lg flex items-center justify-center">
            <p className="text-gray-400">Revenue chart coming soon</p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}