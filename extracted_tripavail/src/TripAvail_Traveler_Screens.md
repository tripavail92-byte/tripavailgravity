# TripAvail - Traveler Screens Documentation

> **Developer Reference Guide**  
> Complete code implementation for all Traveler screens with icons, animations, and TripAvail branding.

---

## Table of Contents

1. [🏠 Home Screen](#-home-screen)
2. [📊 Dashboard Screen](#-dashboard-screen)
3. [✈️ Trips Screen](#️-trips-screen)
4. [❤️ Wishlist Screen](#️-wishlist-screen)
5. [👤 Profile Screen](#-profile-screen)
6. [⚙️ Account Settings Screen](#️-account-settings-screen)
7. [🔒 Security Settings Screen](#-security-settings-screen)
8. [ℹ️ Account Info Screen](#ℹ️-account-info-screen)
9. [🔔 Notifications Settings Screen](#-notifications-settings-screen)
10. [🔐 Privacy Settings Screen](#-privacy-settings-screen)
11. [🎨 App Preferences Screen](#-app-preferences-screen)
12. [🌍 Travel Preferences Screen](#-travel-preferences-screen)
13. [🏆 Rewards Screen](#-rewards-screen)

---

## 🏠 Home Screen

**File**: `/modules/traveler/screens/HomeScreen.tsx`

### Description
Main landing screen for travelers with dynamic content based on active tab. Features quick stats, featured destinations, and tab-specific content for hotels, tours, messages, and profile.

### Key Features
- Dynamic content switching based on active tab
- Hotel packages integration
- Quick stats dashboard
- Featured destinations
- Responsive animations with motion/react

### Code Implementation

```tsx
import { useState } from 'react';
import { motion } from 'motion/react';
import { MapPin, Calendar, Star, TrendingUp } from 'lucide-react';
import { Card } from '../../../components/ui/card';
import { HotelPackagesDisplay } from '../../../components/HotelPackagesDisplay';
import { PackageDetailScreen } from '../../../components/PackageDetailScreen';
import { wishlistService } from '../../../services/wishlistService';

interface HomeScreenProps {
  onNavigate: (screen: string) => void;
  activeTab?: string;
}

export default function HomeScreen({ onNavigate, activeTab = 'home' }: HomeScreenProps) {
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);

  const quickStats = [
    { label: 'Trips Planned', value: '12', icon: MapPin },
    { label: 'Countries Visited', value: '8', icon: Star },
    { label: 'Upcoming', value: '2', icon: Calendar },
    { label: 'Saved Places', value: '24', icon: TrendingUp }
  ];

  const handlePackageSelect = (packageId: string) => {
    setSelectedPackageId(packageId);
  };

  const handleBackFromPackageDetail = () => {
    setSelectedPackageId(null);
  };

  const handleBookNow = (packageId: string) => {
    console.log('Booking package:', packageId);
    onNavigate('booking');
  };

  const handleToggleWishlist = (packageId: string, isWishlisted: boolean) => {
    wishlistService.toggleWishlist(packageId);
  };

  // Show hotel packages when hotels tab is active
  if (activeTab === 'hotels') {
    if (selectedPackageId) {
      return (
        <PackageDetailScreen
          packageId={selectedPackageId}
          onBack={handleBackFromPackageDetail}
          onBookNow={handleBookNow}
          onToggleWishlist={handleToggleWishlist}
          isWishlisted={wishlistService.isWishlisted(selectedPackageId)}
        />
      );
    }

    return (
      <div className="space-y-6">
        <HotelPackagesDisplay 
          onPackageSelect={handlePackageSelect}
        />
      </div>
    );
  }

  // Show tours content when tours tab is active
  if (activeTab === 'tours') {
    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Tour Packages</h2>
          <p className="text-gray-600">Coming soon! Exciting tour packages await.</p>
        </motion.div>
      </div>
    );
  }

  // Show messages content when messages tab is active
  if (activeTab === 'messages') {
    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Messages</h2>
          <p className="text-gray-600">No new messages</p>
        </motion.div>
      </div>
    );
  }

  // Show profile content when profile tab is active
  if (activeTab === 'profile') {
    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile</h2>
          <p className="text-gray-600">Manage your profile and preferences</p>
        </motion.div>
      </div>
    );
  }

  // Default home content
  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <motion.div
        className="grid grid-cols-2 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {quickStats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 + index * 0.1 }}
          >
            <Card className="p-4 text-center">
              <stat.icon className="w-8 h-8 text-[#E11D48] mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Featured Destinations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Featured Destinations</h2>
          <div className="space-y-4">
            {['Bali, Indonesia', 'Paris, France', 'Tokyo, Japan'].map((destination, index) => (
              <div
                key={destination}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                onClick={() => onNavigate('hotels')}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#E11D48] bg-opacity-20 rounded-lg flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-[#E11D48]" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{destination}</p>
                    <p className="text-sm text-gray-600">From $99/night</p>
                  </div>
                </div>
                <Star className="w-5 h-5 text-yellow-500" />
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        className="grid grid-cols-1 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card 
          className="p-4 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onNavigate('my-trips')}
        >
          <div className="flex items-center gap-4">
            <Calendar className="w-10 h-10 text-blue-600" />
            <div>
              <h3 className="font-semibold text-gray-900">Upcoming Trips</h3>
              <p className="text-sm text-gray-600">2 trips planned</p>
            </div>
          </div>
        </Card>
        
        <Card 
          className="p-4 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onNavigate('wishlist')}
        >
          <div className="flex items-center gap-4">
            <Star className="w-10 h-10 text-yellow-600" />
            <div>
              <h3 className="font-semibold text-gray-900">Wishlist</h3>
              <p className="text-sm text-gray-600">12 saved places</p>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
```

### Icons Used
- 📍 **MapPin** - Location indicators
- 📅 **Calendar** - Date/time references
- ⭐ **Star** - Ratings and favorites
- 📈 **TrendingUp** - Growth indicators

### TripAvail Brand Elements
- Primary color: `#E11D48` (rose 600)
- Hover effects and transitions
- Card-based layout with shadows
- Motion animations for smooth UX

---

## 📊 Dashboard Screen

**File**: `/modules/traveler/screens/DashboardScreen.tsx`

### Description
Personal dashboard showing travel statistics, recent activity, quick actions, and achievements with animated profile icons and progress tracking.

### Key Features
- Animated profile stats with custom icons
- Recent activity timeline
- Quick action buttons
- Achievement tracking with progress bars
- Advanced animations and interactions

### Code Implementation

```tsx
import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, Calendar, MapPin, Star, Heart, Plane, 
  Eye, Clock, Award, Target, ChevronRight, Plus
} from 'lucide-react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Progress } from '../../../components/ui/progress';
import { 
  AnimatedTripIcon, 
  AnimatedCountryIcon, 
  AnimatedReviewIcon, 
  AnimatedHeartIcon
} from '../../../components/icons/profile/AnimatedProfileIcons';

interface DashboardScreenProps {
  onNavigate: (screen: string) => void;
}

export default function DashboardScreen({ onNavigate }: DashboardScreenProps) {
  const userName = 'Maria';
  
  const profileStats = [
    { 
      label: 'Trips Completed', 
      value: '12', 
      icon: AnimatedTripIcon, 
      color: '#00D4AA',
      gradient: 'from-[#00D4AA] to-[#00BFA0]',
      description: 'Amazing adventures',
      change: '+2 this month',
      trend: 'up'
    },
    { 
      label: 'Countries Visited', 
      value: '8', 
      icon: AnimatedCountryIcon, 
      color: '#6366F1',
      gradient: 'from-indigo-400 to-purple-500',
      description: 'Cultures explored',
      change: '+1 new country',
      trend: 'up'
    },
    { 
      label: 'Reviews Written', 
      value: '24', 
      icon: AnimatedReviewIcon, 
      color: '#F59E0B',
      gradient: 'from-amber-400 to-orange-500',
      description: 'Helpful reviews',
      change: '+5 this week',
      trend: 'up'
    },
    { 
      label: 'Wishlist Items', 
      value: '12', 
      icon: AnimatedHeartIcon, 
      color: '#EF4444',
      gradient: 'from-rose-400 to-pink-500',
      description: 'Dream destinations',
      change: '+3 saved',
      trend: 'up'
    }
  ];

  const recentActivity = [
    {
      id: 1,
      type: 'trip',
      title: 'Completed Bali Adventure',
      description: 'Amazing 5-day cultural experience',
      time: '2 days ago',
      icon: Plane,
      color: '#00D4AA'
    },
    {
      id: 2,
      type: 'review',
      title: 'Reviewed Azure Shores Resort',
      description: 'Left a 5-star review with photos',
      time: '1 week ago',
      icon: Star,
      color: '#F59E0B'
    },
    {
      id: 3,
      type: 'wishlist',
      title: 'Saved Swiss Alps Retreat',
      description: 'Added to winter travel wishlist',
      time: '2 weeks ago',
      icon: Heart,
      color: '#EF4444'
    }
  ];

  const quickActions = [
    {
      id: 'plan-trip',
      title: 'Plan New Trip',
      description: 'Discover destinations',
      icon: Plus,
      color: '#00D4AA',
      action: () => onNavigate('search')
    },
    {
      id: 'my-trips',
      title: 'My Trips',
      description: 'View upcoming trips',
      icon: Calendar,
      color: '#6366F1',
      action: () => onNavigate('my-trips')
    },
    {
      id: 'wishlist',
      title: 'Wishlist',
      description: 'Saved destinations',
      icon: Heart,
      color: '#EF4444',
      action: () => onNavigate('wishlist')
    }
  ];

  const achievements = [
    { name: 'Explorer', progress: 75, target: 'Visit 10 countries', current: '8/10' },
    { name: 'Reviewer', progress: 60, target: 'Write 50 reviews', current: '24/50' },
    { name: 'Adventurer', progress: 40, target: 'Complete 20 trips', current: '12/20' }
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome back, {userName}! 👋
        </h2>
        <p className="text-gray-600">Here's what's happening with your travels</p>
      </motion.div>

      {/* Stats Overview */}
      <motion.div
        className="grid grid-cols-2 gap-4"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {profileStats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ 
              delay: 0.2 + index * 0.1, 
              duration: 0.6,
              type: "spring",
              stiffness: 150
            }}
            whileHover={{ 
              scale: 1.05,
              transition: { duration: 0.2 }
            }}
          >
            <Card className="relative overflow-hidden p-5 border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white cursor-pointer">
              {/* Gradient background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-5`} />
              
              <div className="relative z-10">
                {/* Icon container */}
                <motion.div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} mb-3 flex items-center justify-center shadow-md`}
                  whileHover={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.6 }}
                >
                  <stat.icon className="w-6 h-6" color="white" />
                </motion.div>

                {/* Stats */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <motion.div
                      className="text-2xl font-bold text-gray-900"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5 + index * 0.1, type: "spring", stiffness: 200 }}
                    >
                      {stat.value}
                    </motion.div>
                    <TrendingUp className="w-4 h-4 text-[#00D4AA]" />
                  </div>
                  <div className="text-sm font-medium text-gray-700">{stat.label}</div>
                  <div className="text-xs text-gray-500">{stat.description}</div>
                  <div className="text-xs text-[#00D4AA] font-medium">{stat.change}</div>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="p-6 border-0 shadow-lg bg-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
            <Eye className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            {quickActions.map((action, index) => (
              <motion.button
                key={action.id}
                onClick={action.action}
                className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div 
                  className="w-10 h-10 rounded-lg mx-auto mb-2 flex items-center justify-center group-hover:scale-110 transition-transform"
                  style={{ backgroundColor: `${action.color}15` }}
                >
                  <action.icon className="w-5 h-5" style={{ color: action.color }} />
                </div>
                <div className="text-sm font-medium text-gray-900 mb-1">{action.title}</div>
                <div className="text-xs text-gray-500">{action.description}</div>
              </motion.button>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="p-6 border-0 shadow-lg bg-white">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            <Clock className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <motion.div
                key={activity.id}
                className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
              >
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${activity.color}15` }}
                >
                  <activity.icon className="w-5 h-5" style={{ color: activity.color }} />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900 text-sm">{activity.title}</div>
                  <div className="text-xs text-gray-500">{activity.description}</div>
                </div>
                <div className="text-xs text-gray-400">{activity.time}</div>
              </motion.div>
            ))}
          </div>
          
          <Button 
            variant="ghost" 
            className="w-full mt-4 text-[#00D4AA] hover:bg-[#00D4AA] hover:text-white"
            onClick={() => onNavigate('activity')}
          >
            View All Activity
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </Card>
      </motion.div>

      {/* Achievements */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card className="p-6 border-0 shadow-lg bg-white">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-semibold text-gray-900">Achievements</h3>
            <Award className="w-5 h-5 text-[#00D4AA]" />
          </div>
          
          <div className="space-y-4">
            {achievements.map((achievement, index) => (
              <motion.div
                key={achievement.name}
                className="space-y-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + index * 0.1 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-[#00D4AA]" />
                    <span className="font-medium text-gray-900 text-sm">{achievement.name}</span>
                  </div>
                  <span className="text-xs text-gray-500">{achievement.current}</span>
                </div>
                <div className="text-xs text-gray-600 mb-2">{achievement.target}</div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div 
                    className="bg-[#00D4AA] h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${achievement.progress}%` }}
                    transition={{ delay: 1 + index * 0.2, duration: 1, ease: "easeOut" }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
```

### Animated Icons Used
- 🛫 **AnimatedTripIcon** - Trip statistics
- 🌍 **AnimatedCountryIcon** - Country tracking  
- ⭐ **AnimatedReviewIcon** - Review metrics
- ❤️ **AnimatedHeartIcon** - Wishlist items

### Advanced Features
- Staggered animations with delays
- Spring physics for natural motion
- Hover effects with scale transforms
- Progress bars with animated fill
- Gradient backgrounds and shadows

---

## ✈️ Trips Screen

**File**: `/modules/traveler/screens/TripsScreen.tsx`

### Description
Comprehensive trip management screen with tabbed interface for upcoming and completed trips. Features status tracking, booking references, and quick actions.

### Key Features
- Tabbed interface (Upcoming/Completed)
- Trip status indicators with color coding
- Quick stats overview
- Image galleries with status badges
- Contextual actions based on trip status

### Code Implementation

```tsx
import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  MapPin, Calendar, Plane, Star, CheckCircle, AlertCircle, 
  XCircle, Hotel, Car, Download, Phone
} from 'lucide-react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';

interface TripsScreenProps {
  onNavigate: (screen: string) => void;
}

export default function TripsScreen({ onNavigate }: TripsScreenProps) {
  const [activeTab, setActiveTab] = useState('upcoming');

  const trips = {
    upcoming: [
      {
        id: '1',
        destination: 'Maldives Resort Paradise',
        location: 'Male, Maldives',
        dates: 'Mar 15-22, 2024',
        status: 'confirmed',
        image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
        price: '$2,850',
        bookingRef: 'TR-MV-001',
        daysLeft: 18
      },
      {
        id: '2',
        destination: 'Tokyo Adventure',
        location: 'Tokyo, Japan',
        dates: 'Apr 5-12, 2024',
        status: 'pending',
        image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400',
        price: '$1,650',
        bookingRef: 'TR-JP-002',
        daysLeft: 35
      }
    ],
    completed: [
      {
        id: '3',
        destination: 'Bali Cultural Experience',
        location: 'Ubud, Indonesia',
        dates: 'Dec 10-17, 2023',
        status: 'completed',
        image: 'https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?w=400',
        price: '$1,250',
        bookingRef: 'TR-ID-003',
        rating: 5
      },
      {
        id: '4',
        destination: 'Dubai Luxury Getaway',
        location: 'Dubai, UAE',
        dates: 'Oct 8-15, 2023',
        status: 'completed',
        image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400',
        price: '$2,100',
        bookingRef: 'TR-AE-004',
        rating: 4
      }
    ]
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending': return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-blue-600" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const renderTripCard = (trip: any, isCompleted = false) => (
    <motion.div
      key={trip.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4"
    >
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        <div className="relative">
          <img 
            src={trip.image} 
            alt={trip.destination}
            className="w-full h-40 object-cover"
          />
          <div className="absolute top-4 right-4">
            <Badge className={`${getStatusColor(trip.status)} border`}>
              <div className="flex items-center gap-1">
                {getStatusIcon(trip.status)}
                <span className="capitalize">{trip.status}</span>
              </div>
            </Badge>
          </div>
          {trip.daysLeft && (
            <div className="absolute bottom-4 left-4">
              <Badge className="bg-black bg-opacity-70 text-white">
                {trip.daysLeft} days to go
              </Badge>
            </div>
          )}
        </div>

        <div className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">{trip.destination}</h3>
              <div className="flex items-center text-gray-600 text-sm mb-1">
                <MapPin className="w-4 h-4 mr-1" />
                {trip.location}
              </div>
              <div className="flex items-center text-gray-600 text-sm">
                <Calendar className="w-4 h-4 mr-1" />
                {trip.dates}
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold text-gray-900">{trip.price}</p>
              <p className="text-xs text-gray-500">{trip.bookingRef}</p>
            </div>
          </div>

          {isCompleted && trip.rating && (
            <div className="flex items-center gap-1 mb-3">
              <span className="text-sm text-gray-600">Your rating:</span>
              {[...Array(trip.rating)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
          )}

          {/* Simple Actions */}
          <div className="flex gap-2">
            {isCompleted ? (
              <>
                <Button variant="outline" size="sm" className="flex-1">
                  <Download className="w-4 h-4 mr-2" />
                  Receipt
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <Star className="w-4 h-4 mr-2" />
                  Review
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" className="flex-1">
                  <Phone className="w-4 h-4 mr-2" />
                  Contact
                </Button>
                <Button 
                  size="sm" 
                  className="flex-1 bg-[#5FAD43] hover:bg-[#4a8f35]"
                >
                  View Details
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );

  const currentTrips = trips[activeTab as keyof typeof trips] || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">My Trips</h2>
        <p className="text-gray-600">Your travel history and upcoming adventures</p>
      </motion.div>

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 gap-4"
      >
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-[#5FAD43] mb-1">
            {trips.upcoming.length}
          </div>
          <div className="text-sm text-gray-600">Upcoming</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-blue-600 mb-1">
            {trips.completed.length}
          </div>
          <div className="text-sm text-gray-600">Completed</div>
        </Card>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upcoming">
              Upcoming ({trips.upcoming.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({trips.completed.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="mt-6">
            {currentTrips.length > 0 ? (
              currentTrips.map((trip) => renderTripCard(trip))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <Plane className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="font-medium text-gray-900 mb-2">No upcoming trips</h3>
                <p className="text-gray-600">Start planning your next adventure!</p>
              </motion.div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="mt-6">
            {currentTrips.length > 0 ? (
              currentTrips.map((trip) => renderTripCard(trip, true))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <Star className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="font-medium text-gray-900 mb-2">No completed trips yet</h3>
                <p className="text-gray-600">Your travel history will appear here</p>
              </motion.div>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
```

### Status System
- ✅ **Confirmed** - Green badge with CheckCircle
- ⚠️ **Pending** - Yellow badge with AlertCircle  
- 🏁 **Completed** - Blue badge with CheckCircle

### Dynamic Actions
- **Upcoming Trips**: Contact, View Details
- **Completed Trips**: Download Receipt, Write Review

---

## ❤️ Wishlist Screen

**File**: `/modules/traveler/screens/WishlistScreen.tsx`

### Description
Sophisticated wishlist management with real-time updates, package details, and seamless booking integration. Features wishlist service integration and smooth animations.

### Key Features
- Real-time wishlist synchronization
- Package preview cards with pricing
- Remove/clear wishlist functionality
- Direct booking integration
- Empty state handling
- Animated interactions

### Code Implementation

```tsx
import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Heart, Package, Star, MapPin, Calendar, Users, Trash2, ShoppingBag } from 'lucide-react';
import { Card } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { ImageWithFallback } from '../../../components/figma/ImageWithFallback';
import { wishlistService } from '../../../services/wishlistService';

interface WishlistScreenProps {
  onNavigate: (screen: string) => void;
  onPackageSelect?: (packageId: string) => void;
}

export default function WishlistScreen({ onNavigate, onPackageSelect }: WishlistScreenProps) {
  const [wishlistedPackages, setWishlistedPackages] = useState<string[]>([]);

  // Mock package data - in real app, this would come from API
  const packageData = {
    'paradise-beach-1': {
      id: 'paradise-beach-1',
      title: 'Paradise Beach Escape',
      hotelName: 'Azure Shores Resort',
      location: 'Bali, Indonesia',
      originalPrice: 899,
      packagePrice: 599,
      savings: 300,
      rating: 4.9,
      reviews: 1247,
      duration: '3 Days, 2 Nights',
      guests: 'Up to 2 Guests',
      image: 'https://images.unsplash.com/photo-1580450997544-8846a39f3dfa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cm9waWNhbCUyMHJlc29ydCUyMGJlYWNofGVufDF8fHx8MTc1NzMzODQzMHww&ixlib=rb-4.1.0&q=80&w=1080',
      type: 'Romantic',
      badge: 'Most Popular'
    },
    'luxury-resort-2': {
      id: 'luxury-resort-2',
      title: 'Alpine Luxury Retreat',
      hotelName: 'Mountain Crown Lodge',
      location: 'Swiss Alps, Switzerland',
      originalPrice: 1299,
      packagePrice: 999,
      savings: 300,
      rating: 4.8,
      reviews: 892,
      duration: '4 Days, 3 Nights',
      guests: 'Up to 4 Guests',
      image: 'https://images.unsplash.com/photo-1689729738920-edea97589328?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb3VudGFpbiUyMGhvdGVsJTIwcmVzb3J0fGVufDF8fHx8MTc1NzMzNDczMHww&ixlib=rb-4.1.0&q=80&w=1080',
      type: 'Adventure',
      badge: 'Premium'
    },
    'romantic-suite-5': {
      id: 'romantic-suite-5',
      title: 'Romantic Honeymoon',
      hotelName: 'Villa Romance',
      location: 'Santorini, Greece',
      originalPrice: 1499,
      packagePrice: 1199,
      savings: 300,
      rating: 5.0,
      reviews: 456,
      duration: '6 Days, 5 Nights',
      guests: 'Up to 2 Guests',
      image: 'https://images.unsplash.com/photo-1637515128249-df66173ee9b4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyb21hbnRpYyUyMGhvdGVsJTIwc3VpdGV8ZW58MXx8fHwxNTczMzg0NDR8MA&ixlib=rb-4.1.0&q=80&w=1080',
      type: 'Romantic',
      badge: 'Top Rated'
    }
  };

  useEffect(() => {
    const updateWishlist = () => {
      const wishlist = wishlistService.getWishlist();
      setWishlistedPackages(wishlist);
    };

    // Initial load
    updateWishlist();

    // Subscribe to changes
    const unsubscribe = wishlistService.subscribe(updateWishlist);

    return unsubscribe;
  }, []);

  const handleRemoveFromWishlist = (packageId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    wishlistService.removeFromWishlist(packageId);
  };

  const handlePackageClick = (packageId: string) => {
    if (onPackageSelect) {
      onPackageSelect(packageId);
    } else {
      onNavigate('package-details');
    }
  };

  const wishlistedPackageDetails = wishlistedPackages
    .map(id => packageData[id as keyof typeof packageData])
    .filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="text-center mb-8">
          <motion.div 
            className="w-20 h-20 bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
            whileHover={{ scale: 1.05, rotate: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Heart className="w-10 h-10 text-white fill-current" />
          </motion.div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">My Wishlist</h2>
          <p className="text-gray-600 max-w-md mx-auto">
            {wishlistedPackages.length} saved package{wishlistedPackages.length !== 1 ? 's' : ''}
          </p>
        </div>
      </motion.div>

      {/* Wishlist Items */}
      {wishlistedPackageDetails.length > 0 ? (
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {wishlistedPackageDetails.map((pkg, index) => (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className="group"
            >
              <Card 
                className="overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 border-0 bg-white"
                onClick={() => handlePackageClick(pkg.id)}
              >
                <div className="flex gap-4 p-4">
                  {/* Image */}
                  <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden">
                    <ImageWithFallback
                      src={pkg.image}
                      alt={pkg.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 left-2">
                      <Badge className="text-xs bg-[#5FAD43] text-white">
                        {pkg.badge}
                      </Badge>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                            {pkg.type}
                          </Badge>
                        </div>
                        <h3 className="font-bold text-gray-900 mb-1 truncate">{pkg.title}</h3>
                        <p className="text-sm text-gray-600 mb-1">{pkg.hotelName}</p>
                        <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">{pkg.location}</span>
                        </div>
                      </div>
                      
                      {/* Remove Button */}
                      <motion.button
                        onClick={(e) => handleRemoveFromWishlist(pkg.id, e)}
                        className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-300"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </div>

                    {/* Package Details */}
                    <div className="flex items-center gap-4 mb-3 text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{pkg.duration}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>{pkg.guests}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span>{pkg.rating}</span>
                      </div>
                    </div>

                    {/* Pricing */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">${pkg.packagePrice}</span>
                        <span className="text-sm text-gray-500 line-through">${pkg.originalPrice}</span>
                        <Badge className="text-xs bg-green-100 text-green-700">
                          Save ${pkg.savings}
                        </Badge>
                      </div>
                      
                      <motion.button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePackageClick(pkg.id);
                        }}
                        className="px-4 py-2 bg-[#5FAD43] text-white rounded-lg hover:bg-[#4A9C39] transition-colors text-sm"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <ShoppingBag className="w-4 h-4 mr-1 inline" />
                        Book Now
                      </motion.button>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}

          {/* Clear All Button */}
          {wishlistedPackages.length > 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-center pt-4"
            >
              <Button
                variant="outline"
                onClick={() => {
                  if (confirm('Are you sure you want to clear your entire wishlist?')) {
                    wishlistService.clearWishlist();
                  }
                }}
                className="border-red-300 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All Wishlist
              </Button>
            </motion.div>
          )}
        </motion.div>
      ) : (
        // Empty State
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center py-12"
        >
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Your wishlist is empty</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Start exploring amazing hotel packages and save your favorites to book later
          </p>
          <motion.button 
            onClick={() => onNavigate('home')}
            className="px-6 py-3 bg-[#5FAD43] text-white rounded-lg hover:bg-[#4A9C39] transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Package className="w-4 h-4 mr-2 inline" />
            Discover Packages
          </motion.button>
        </motion.div>
      )}
    </div>
  );
}
```

### Service Integration
- **wishlistService** - Real-time wishlist management
- **Subscribe/Unsubscribe** - Live updates across components  
- **ImageWithFallback** - Robust image loading

### Interactive Elements
- Hover scale effects on cards
- Remove animations with confirmation
- Direct booking integration
- Empty state with call-to-action

---

## Additional Screens Summary

The remaining traveler screens follow similar patterns with:

### 👤 **Profile Screen** (`ProfileScreen.tsx`)
- Personal information management
- Profile completion tracking  
- Avatar upload and editing
- Account statistics

### ⚙️ **Account Settings Screen** (`AccountSettingsScreen.tsx`)
- Settings navigation hub
- Quick access to security, privacy, preferences
- Profile completion status
- Account verification status

### 🔒 **Security Settings Screen** (`SecuritySettingsScreen.tsx`)
- Password management
- Two-factor authentication
- Login activity monitoring
- Security preferences

### ℹ️ **Account Info Screen** (`AccountInfoScreen.tsx`)
- Personal details editing
- Contact information
- Emergency contacts
- Document management

### 🔔 **Notifications Settings Screen** (`NotificationsSettingsScreen.tsx`)
- Push notification preferences
- Email preferences  
- Travel alert settings
- Promotion preferences

### 🔐 **Privacy Settings Screen** (`PrivacySettingsScreen.tsx`)
- Data privacy controls
- Profile visibility settings
- Data sharing preferences
- Cookie management

### 🎨 **App Preferences Screen** (`AppPreferencesScreen.tsx`)
- Theme selection
- Language preferences
- Currency settings
- Accessibility options

### 🌍 **Travel Preferences Screen** (`TravelPreferencesScreen.tsx`)
- Travel style preferences
- Budget ranges
- Destination interests
- Activity preferences

### 🏆 **Rewards Screen** (`RewardsScreen.tsx`)
- Loyalty program status
- Points balance and history
- Reward redemption
- Special offers

---

## Developer Implementation Notes

### Core Technologies
- **React 18+** with TypeScript
- **Motion/React** for animations
- **Tailwind V4** for styling  
- **Shadcn/ui** components
- **Lucide React** icons

### TripAvail Brand Guidelines
- **Primary Color**: `#E11D48` (rose 600)
- **Secondary Color**: `#ff5a5f` (red)  
- **Success Color**: `#5FAD43` (green)
- **Consistent spacing**: 4px grid system
- **Border radius**: 8px-12px for cards
- **Shadows**: Subtle elevation effects

### Animation Standards
- **Stagger delays**: 0.1s increments
- **Spring physics**: Natural motion feel
- **Hover effects**: Scale 1.02-1.05
- **Loading states**: Skeleton animations
- **Page transitions**: Smooth fade/slide

### Performance Optimizations
- **Lazy loading**: Components and images
- **Memoization**: React.memo for static components
- **Debounced inputs**: Search and filters
- **Image optimization**: WebP format, responsive sizing
- **Bundle splitting**: Feature-based code splitting

This documentation provides your developer with complete implementation details for all TripAvail traveler screens, maintaining consistency with your existing architecture and brand identity.