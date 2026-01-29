import { motion } from 'motion/react';
import { Home, Settings, Calendar, Star } from 'lucide-react';
import { Card } from '../ui/card';

interface SimpleScreenProps {
  title?: string;
  message?: string;
  onNavigate?: (screen: string) => void;
}

export function SimpleScreen({ 
  title = "TripAvail", 
  message = "Welcome to your travel companion", 
  onNavigate 
}: SimpleScreenProps) {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
        <p className="text-gray-600">{message}</p>
      </motion.div>

      <div className="grid grid-cols-2 gap-4">
        {[
          { icon: Home, label: 'Home', action: 'home' },
          { icon: Settings, label: 'Settings', action: 'settings' },
          { icon: Calendar, label: 'Calendar', action: 'calendar' },
          { icon: Star, label: 'Favorites', action: 'favorites' },
        ].map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card 
              className="p-4 text-center cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => onNavigate?.(item.action)}
            >
              <item.icon className="w-8 h-8 text-[#00D4AA] mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">{item.label}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="p-6 bg-gradient-to-r from-[#00D4AA]/10 to-[#ff5a5f]/10">
        <h3 className="font-semibold text-gray-900 mb-2">Getting Started</h3>
        <p className="text-sm text-gray-600">
          Your TripAvail app is loading. This is a simplified view while we prepare your personalized experience.
        </p>
      </Card>
    </div>
  );
}