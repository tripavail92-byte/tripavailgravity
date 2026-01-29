import { motion } from 'motion/react';
import { TrendingUp, MapPin, Users, Clock } from 'lucide-react';
import { Card } from '../ui/card';

interface TrendingSectionProps {
  onNavigate: (screen: string) => void;
}

export function ModernTrendingSection({ onNavigate }: TrendingSectionProps) {
  const trendingData = [
    {
      id: 'trending-destinations',
      title: 'Trending Now',
      subtitle: 'Popular destinations this month',
      icon: TrendingUp,
      color: '#ff5a5f',
      gradient: 'from-red-50 to-pink-50',
      items: [
        { name: 'Bali, Indonesia', increase: '+24%', visitors: '2.1M' },
        { name: 'Santorini, Greece', increase: '+18%', visitors: '1.8M' },
        { name: 'Dubai, UAE', increase: '+15%', visitors: '3.2M' }
      ]
    },
    {
      id: 'hot-deals',
      title: 'Hot Deals',
      subtitle: 'Limited time offers',
      icon: Clock,
      color: '#F59E0B',
      gradient: 'from-amber-50 to-orange-50',
      items: [
        { name: 'Paris Weekend', discount: '30% OFF', price: '$299' },
        { name: 'Tokyo Adventure', discount: '25% OFF', price: '$799' },
        { name: 'Maldives Escape', discount: '40% OFF', price: '$1,299' }
      ]
    }
  ];

  const quickInsights = [
    {
      label: 'Best Time to Book',
      value: '2-3 months ahead',
      icon: '📅',
      tip: 'Save up to 30%'
    },
    {
      label: 'Popular Season',
      value: 'Spring & Fall',
      icon: '🌸',
      tip: 'Perfect weather'
    },
    {
      label: 'Travel Trend',
      value: 'Sustainable Tourism',
      icon: '🌱',
      tip: 'Eco-friendly trips'
    }
  ];

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
    >
      {/* Section Header */}
      <motion.div
        className="text-center space-y-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          🔥 What's Hot Right Now
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Trending destinations and exclusive deals
        </p>
      </motion.div>

      {/* Trending Cards */}
      <div className="space-y-4">
        {trendingData.map((section, sectionIndex) => (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.5 + sectionIndex * 0.1 }}
          >
            <Card className={`p-5 ${section.gradient} border-0 hover:shadow-lg transition-all duration-300 dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-900`}>
              <motion.div
                className="flex items-center gap-3 mb-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.6 + sectionIndex * 0.1 }}
              >
                <div className="p-2 bg-white/70 dark:bg-gray-700/70 rounded-lg">
                  <section.icon className="w-5 h-5" style={{ color: section.color }} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">{section.title}</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{section.subtitle}</p>
                </div>
              </motion.div>

              <div className="space-y-3">
                {section.items.map((item, itemIndex) => (
                  <motion.div
                    key={itemIndex}
                    className="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-700/50 rounded-lg hover:bg-white/70 dark:hover:bg-gray-700/70 transition-all duration-200 cursor-pointer group"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.7 + sectionIndex * 0.1 + itemIndex * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onNavigate('hotels')}
                  >
                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      <span className="font-medium text-gray-900 dark:text-white group-hover:text-[#ff5a5f] transition-colors">
                        {item.name}
                      </span>
                    </div>
                    <div className="text-right">
                      {'increase' in item && (
                        <div className="text-xs font-bold text-green-600 dark:text-green-400">
                          {item.increase}
                        </div>
                      )}
                      {'discount' in item && (
                        <div className="text-xs font-bold text-[#ff5a5f]">
                          {item.discount}
                        </div>
                      )}
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {'visitors' in item && item.visitors}
                        {'price' in item && item.price}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick Insights */}
      <motion.div
        className="space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
      >
        <motion.h3 
          className="font-bold text-gray-900 dark:text-white text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.9 }}
        >
          💡 Travel Smart Tips
        </motion.h3>
        
        <div className="grid grid-cols-1 gap-3">
          {quickInsights.map((insight, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 1.0 + index * 0.1 }}
              whileHover={{ scale: 1.02 }}
            >
              <Card className="p-4 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border-0 hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{insight.icon}</span>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white text-sm">
                        {insight.label}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {insight.value}
                      </p>
                    </div>
                  </div>
                  <motion.div
                    className="px-2 py-1 bg-[#ff5a5f]/10 text-[#ff5a5f] rounded-full text-xs font-medium"
                    whileHover={{ scale: 1.05 }}
                  >
                    {insight.tip}
                  </motion.div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Call to Action */}
      <motion.div
        className="text-center pt-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1.3 }}
      >
        <motion.button
          className="px-8 py-3 bg-gradient-to-r from-[#ff5a5f] to-[#e1434a] text-white font-medium rounded-full shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden group"
          whileHover={{ 
            scale: 1.05,
            boxShadow: "0 15px 30px rgba(255, 90, 95, 0.4)"
          }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate('explore')}
        >
          <motion.div
            className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"
            style={{ background: 'linear-gradient(90deg, transparent, white, transparent)' }}
          />
          <span className="relative z-10">✨ Explore All Destinations</span>
        </motion.button>
      </motion.div>
    </motion.div>
  );
}