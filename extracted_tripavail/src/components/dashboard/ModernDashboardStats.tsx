import { motion } from 'motion/react';
import { Card } from '../ui/card';
import {
  SimpleTripIcon,
  SimpleGlobeIcon,
  SimpleHeartIcon,
  SimpleMapIcon,
  SimpleCameraIcon,
  SimpleMountainIcon,
  SimpleStarIcon,
  SimpleNotificationIcon
} from '../icons/dashboard/SimpleModernIcons';

interface DashboardStatsProps {
  onNavigate: (screen: string) => void;
}

export function ModernDashboardStats({ onNavigate }: DashboardStatsProps) {
  const quickStats = [
    { 
      label: 'Trips Completed', 
      value: '12', 
      icon: SimpleMapIcon,
      description: 'Amazing adventures'
    },
    { 
      label: 'Countries Visited', 
      value: '8', 
      icon: SimpleGlobeIcon,
      description: 'Cultures explored'
    },
    { 
      label: 'Experiences', 
      value: '47', 
      icon: SimpleStarIcon,
      description: 'Memorable moments'
    },
    { 
      label: 'Saved Places', 
      value: '24', 
      icon: SimpleHeartIcon,
      description: 'Dream destinations'
    }
  ];

  const quickActions = [
    {
      id: 'plan-trip',
      title: 'Plan New Trip',
      subtitle: 'Discover amazing places',
      icon: SimpleTripIcon,
      screen: 'plan-trip'
    },
    {
      id: 'my-trips',
      title: 'My Trips',
      subtitle: 'View upcoming adventures',
      icon: SimpleMountainIcon,
      screen: 'my-trips'
    },
    {
      id: 'memories',
      title: 'Travel Memories',
      subtitle: 'Relive your journeys',
      icon: SimpleCameraIcon,
      screen: 'memories'
    },
    {
      id: 'wishlist',
      title: 'Wishlist',
      subtitle: 'Places to visit',
      icon: SimpleHeartIcon,
      screen: 'wishlist'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <motion.div
        className="text-center space-y-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.h1 
          className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent dark:from-white dark:to-gray-300"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Welcome back, Explorer! 🌟
        </motion.h1>
        <motion.p 
          className="text-gray-600 dark:text-gray-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Ready for your next adventure?
        </motion.p>
      </motion.div>

      {/* Quick Stats Grid */}
      <motion.div
        className="grid grid-cols-2 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        {quickStats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ 
              duration: 0.4, 
              delay: 0.4 + index * 0.1,
              type: "spring",
              stiffness: 100
            }}
            whileHover={{ 
              scale: 1.02,
              transition: { duration: 0.2 }
            }}
            whileTap={{ scale: 0.98 }}
          >
            <Card className="p-4 text-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300 group cursor-pointer" onClick={() => onNavigate('stats')}>
              <motion.div 
                className="flex justify-center mb-3"
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.2 }}
              >
                <stat.icon 
                  size={32} 
                  color="#6b7280"
                  isActive={false}
                  className="group-hover:text-[#ff5a5f] transition-colors duration-200"
                />
              </motion.div>
              <motion.p 
                className="text-2xl font-bold text-gray-900 dark:text-white mb-1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
              >
                {stat.value}
              </motion.p>
              <motion.p 
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
              >
                {stat.label}
              </motion.p>
              <motion.p 
                className="text-xs text-gray-500 dark:text-gray-400 mt-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.7 + index * 0.1 }}
              >
                {stat.description}
              </motion.p>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick Actions Section */}
      <motion.div
        className="space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      >
        <motion.h2 
          className="text-xl font-semibold text-gray-900 dark:text-white"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.9 }}
        >
          Quick Actions
        </motion.h2>
        
        <div className="grid grid-cols-2 gap-4">
          {quickActions.map((action, index) => (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ 
                duration: 0.4, 
                delay: 1.0 + index * 0.1,
                type: "spring",
                stiffness: 100
              }}
              whileHover={{ 
                scale: 1.02,
                transition: { duration: 0.2 }
              }}
              whileTap={{ scale: 0.98 }}
            >
              <Card 
                className="p-4 cursor-pointer bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300 group"
                onClick={() => onNavigate(action.screen)}
              >
                <div className="flex flex-col items-center text-center space-y-3">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <action.icon 
                      size={28} 
                      color="#6b7280"
                      className="group-hover:text-[#ff5a5f] transition-colors duration-200"
                      isActive={false}
                    />
                  </motion.div>
                  <div>
                    <motion.h3 
                      className="font-semibold text-gray-900 dark:text-white text-sm group-hover:text-[#ff5a5f] dark:group-hover:text-[#ff5a5f] transition-colors duration-200"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3, delay: 1.1 + index * 0.1 }}
                    >
                      {action.title}
                    </motion.h3>
                    <motion.p 
                      className="text-xs text-gray-600 dark:text-gray-400"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3, delay: 1.2 + index * 0.1 }}
                    >
                      {action.subtitle}
                    </motion.p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Inspirational Quote */}
      <motion.div
        className="text-center py-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.4 }}
      >
        <motion.blockquote 
          className="text-lg font-medium text-gray-700 dark:text-gray-300 italic"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 1.5 }}
        >
          "Not all those who wander are lost"
        </motion.blockquote>
        <motion.p 
          className="text-sm text-gray-500 dark:text-gray-400 mt-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 1.6 }}
        >
          — J.R.R. Tolkien
        </motion.p>
      </motion.div>
    </div>
  );
}