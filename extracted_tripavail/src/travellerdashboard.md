# Traveler Dashboard Screen Documentation

## 🎯 Screen Purpose & Overview

The **Traveler Dashboard Screen** (`DashboardScreen.tsx`) serves as the personalized home base for travelers within the TripAvail platform. This screen provides a comprehensive overview of the user's travel statistics, achievements, and quick access to core app functions, creating an engaging and motivating travel experience.

### **Core Functionality**
- **Personal Travel Statistics** - Trip completion, countries visited, experiences collected
- **Achievement Tracking** - Visual representation of travel milestones
- **Quick Actions Hub** - Fast access to trip planning and management
- **Motivational Design** - Encouraging language and visual feedback
- **Dark Mode Support** - Complete theming compatibility

## File: `/modules/traveler/screens/DashboardScreen.tsx`

```tsx
import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Calendar, MapPin, Plus, Eye
} from 'lucide-react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
// Import the modern icons
import { 
  SimpleTripIcon, 
  SimpleGlobeIcon, 
  SimpleHeartIcon, 
  SimpleMapIcon 
} from '../../../components/icons/dashboard/SimpleModernIcons';

interface DashboardScreenProps {
  onNavigate: (screen: string) => void;
}

export default function DashboardScreen({ onNavigate }: DashboardScreenProps) {
  const userName = 'Maria';
  const [selectedStat, setSelectedStat] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  
  const profileStats = [
    { 
      id: 'trips',
      label: 'Trips Completed', 
      value: '12', 
      icon: SimpleTripIcon,
      description: 'Amazing adventures',
      action: () => onNavigate('my-trips')
    },
    { 
      id: 'countries',
      label: 'Countries Visited', 
      value: '8', 
      icon: SimpleGlobeIcon,
      description: 'Cultures explored',
      action: () => onNavigate('explore')
    },
    { 
      id: 'experiences',
      label: 'Experiences', 
      value: '47', 
      icon: SimpleMapIcon,
      description: 'Memorable moments',
      action: () => onNavigate('explore')
    },
    { 
      id: 'saved',
      label: 'Saved Places', 
      value: '24', 
      icon: SimpleHeartIcon,
      description: 'Dream destinations',
      action: () => onNavigate('wishlist')
    }
  ];

  const quickActions = [
    {
      id: 'plan-trip',
      title: 'Plan Trip',
      description: 'Discover places',
      icon: Plus,
      action: () => {
        setSelectedAction('plan-trip');
        setTimeout(() => {
          onNavigate('search');
          setSelectedAction(null);
        }, 150);
      }
    },
    {
      id: 'my-trips',
      title: 'My Trips',
      description: 'View upcoming',
      icon: Calendar,
      action: () => {
        setSelectedAction('my-trips');
        setTimeout(() => {
          onNavigate('my-trips');
          setSelectedAction(null);
        }, 150);
      }
    }
  ];

  const handleStatPress = (stat: typeof profileStats[0]) => {
    setSelectedStat(stat.id);
    setTimeout(() => {
      stat.action();
      setSelectedStat(null);
    }, 150);
  };



  return (
    <div className="space-y-6 pb-8">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h2 className="text-2xl text-gray-900 dark:text-foreground mb-2">
          Welcome back, Explorer! 🌟
        </h2>
        <p className="text-gray-600 dark:text-muted-foreground">Ready for your next adventure?</p>
      </motion.div>

      {/* Stats Overview - Modern 2x2 Grid */}
      <motion.div
        className="grid grid-cols-2 gap-4"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {profileStats.map((stat, index) => (
          <motion.button
            key={stat.id}
            className="text-left"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ 
              delay: 0.2 + index * 0.1, 
              duration: 0.6,
              type: "spring",
              stiffness: 150
            }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleStatPress(stat)}
          >
            <Card className={`relative overflow-hidden p-5 border-0 shadow-sm bg-white dark:bg-card cursor-pointer h-[140px] transition-all duration-200 ${
              selectedStat === stat.id ? 'shadow-lg border-2 border-primary' : ''
            }`}>
              {/* Top Icon */}
              <motion.div
                className={`w-12 h-12 rounded-2xl mb-3 flex items-center justify-center transition-all duration-200 ${
                  selectedStat === stat.id 
                    ? 'bg-primary' 
                    : 'bg-gray-100 dark:bg-muted'
                }`}
                animate={selectedStat === stat.id ? { 
                  scale: [1, 1.1, 1],
                  rotate: [0, -5, 5, 0] 
                } : {}}
                transition={{ duration: 0.3 }}
              >
                <stat.icon 
                  size={28} 
                  isActive={selectedStat === stat.id}
                  color={selectedStat === stat.id ? '#ffffff' : undefined}
                  className="transition-colors duration-200"
                />
              </motion.div>

              {/* Stats */}
              <div className="space-y-1">
                <motion.div
                  className="text-2xl text-gray-900 dark:text-foreground font-medium"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.1, type: "spring", stiffness: 200 }}
                >
                  {stat.value}
                </motion.div>
                <div className="text-sm text-gray-700 dark:text-foreground">{stat.label}</div>
                <div className="text-xs text-gray-500 dark:text-muted-foreground">{stat.description}</div>
              </div>
            </Card>
          </motion.button>
        ))}
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-xl text-gray-900 dark:text-foreground">Quick Actions</h3>
          <Eye className="w-5 h-5 text-gray-400 dark:text-muted-foreground" />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {quickActions.map((action, index) => (
            <motion.button
              key={action.id}
              onClick={action.action}
              className={`p-4 bg-white dark:bg-card rounded-2xl border transition-all text-left ${
                selectedAction === action.id 
                  ? 'border-2 border-primary shadow-lg' 
                  : 'border-gray-100 dark:border-border'
              }`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div 
                className={`w-12 h-12 rounded-xl mb-3 flex items-center justify-center transition-all duration-200 ${
                  selectedAction === action.id 
                    ? 'bg-primary' 
                    : 'bg-gray-100 dark:bg-muted'
                }`}
                animate={selectedAction === action.id ? { 
                  scale: [1, 1.1, 1] 
                } : {}}
                transition={{ duration: 0.3 }}
              >
                <action.icon className={`w-6 h-6 transition-colors duration-200 ${
                  selectedAction === action.id 
                    ? 'text-white' 
                    : 'text-gray-600 dark:text-muted-foreground'
                }`} />
              </motion.div>
              <div className="text-sm text-gray-900 dark:text-foreground mb-1">{action.title}</div>
              <div className="text-xs text-gray-500 dark:text-muted-foreground">{action.description}</div>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
```

## Key Features

- **Welcome Header**: Personalized greeting with "Welcome back, Explorer! 🌟"
- **Stats Grid**: 2x2 grid showing:
  - 12 Trips Completed (Amazing adventures)
  - 8 Countries Visited (Cultures explored) 
  - 47 Experiences (Memorable moments)
  - 24 Saved Places (Dream destinations)
- **Quick Actions**: Plan Trip and My Trips buttons
- **Animations**: Motion effects with staggered animations and spring physics
- **Interactive Elements**: Tap animations and visual feedback
- **Dark Mode Support**: Full dark mode compatibility
- **Responsive Design**: Mobile-first 2x2 grid layout

## Dependencies

- `motion/react` for animations
- `lucide-react` for icons
- Custom icon components from `SimpleModernIcons`
- ShadCN UI components (Card, Button)

## Usage

This component is used as the main dashboard for travelers when they select the dashboard option from the drawer menu or when showing their personalized stats and quick actions.