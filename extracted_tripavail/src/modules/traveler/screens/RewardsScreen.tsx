import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Award, Star, Gift, Trophy, TrendingUp, Clock, 
  Plane, Hotel, Car, Camera, MapPin, Calendar,
  ChevronRight, Zap, Crown, Gem, Target, CreditCard,
  Coffee, Utensils, ShoppingBag, Wifi, Smartphone, Check, Shield
} from 'lucide-react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Progress } from '../../../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';

interface RewardsScreenProps {
  onNavigate: (screen: string) => void;
}

export default function RewardsScreen({ onNavigate }: RewardsScreenProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const userRewards = {
    currentPoints: 2450,
    currentLevel: 'Gold Explorer',
    nextLevel: 'Platinum Explorer',
    pointsToNext: 550,
    totalEarned: 12750,
    totalRedeemed: 10300,
    memberSince: 'Jan 2024'
  };

  const levels = [
    { name: 'Bronze Explorer', min: 0, max: 999, color: '#CD7F32', benefits: ['5% cashback', 'Free cancellation'] },
    { name: 'Silver Explorer', min: 1000, max: 2499, color: '#C0C0C0', benefits: ['7% cashback', 'Priority support', 'Late checkout'] },
    { name: 'Gold Explorer', min: 2500, max: 4999, color: '#FFD700', benefits: ['10% cashback', 'Room upgrades', 'Free breakfast', 'Express check-in'] },
    { name: 'Platinum Explorer', min: 5000, max: 9999, color: '#E5E4E2', benefits: ['15% cashback', 'Lounge access', 'Concierge service', 'Free transfers'] },
    { name: 'Diamond Explorer', min: 10000, max: Infinity, color: '#B9F2FF', benefits: ['20% cashback', 'Personal travel advisor', 'Exclusive experiences', 'Priority everything'] }
  ];

  const currentLevelIndex = levels.findIndex(level => 
    userRewards.currentPoints >= level.min && userRewards.currentPoints <= level.max
  );

  const progressPercentage = currentLevelIndex < levels.length - 1 
    ? ((userRewards.currentPoints - levels[currentLevelIndex].min) / 
       (levels[currentLevelIndex].max - levels[currentLevelIndex].min)) * 100
    : 100;

  const earnHistory = [
    { id: '1', description: 'Bali Resort Stay', points: 345, date: 'Dec 15, 2023', type: 'booking' },
    { id: '2', description: 'Flight to Tokyo', points: 180, date: 'Nov 22, 2023', type: 'flight' },
    { id: '3', description: 'Hotel Review', points: 50, date: 'Nov 15, 2023', type: 'review' },
    { id: '4', description: 'Referral Bonus', points: 200, date: 'Oct 30, 2023', type: 'referral' },
    { id: '5', description: 'Dubai Hotel Booking', points: 290, date: 'Oct 10, 2023', type: 'booking' }
  ];

  const redeemHistory = [
    { id: '1', description: 'Free Night at Resort', points: 500, date: 'Dec 20, 2023', type: 'accommodation' },
    { id: '2', description: 'Airport Lounge Access', points: 150, date: 'Nov 25, 2023', type: 'service' },
    { id: '3', description: 'Travel Voucher $50', points: 250, date: 'Oct 15, 2023', type: 'voucher' }
  ];

  const availableRewards = [
    {
      id: '1',
      title: 'Free Hotel Night',
      description: 'One free night at participating hotels',
      points: 500,
      category: 'Accommodation',
      icon: Hotel,
      color: '#3B82F6',
      popular: true
    },
    {
      id: '2',
      title: 'Airport Lounge Access',
      description: 'Access to premium airport lounges worldwide',
      points: 150,
      category: 'Travel',
      icon: Plane,
      color: '#8B5CF6'
    },
    {
      id: '3',
      title: '$25 Travel Voucher',
      description: 'Voucher for hotels, flights, or activities',
      points: 125,
      category: 'Voucher',
      icon: Gift,
      color: '#10B981'
    },
    {
      id: '4',
      title: 'Car Rental Upgrade',
      description: 'Free upgrade to premium car category',
      points: 200,
      category: 'Transport',
      icon: Car,
      color: '#F59E0B'
    },
    {
      id: '5',
      title: 'City Tour Package',
      description: 'Guided city tour for 2 people',
      points: 300,
      category: 'Experience',
      icon: MapPin,
      color: '#EF4444'
    },
    {
      id: '6',
      title: 'Travel Insurance',
      description: 'Free travel insurance for one trip',
      points: 100,
      category: 'Insurance',
      icon: Shield,
      color: '#6B7280'
    }
  ];

  const earningOpportunities = [
    {
      id: '1',
      title: 'Book Your Next Trip',
      description: 'Earn 1 point per $1 spent',
      points: '1x points',
      icon: Calendar,
      color: '#5FAD43'
    },
    {
      id: '2',
      title: 'Write Reviews',
      description: 'Get 50 points per review',
      points: '50 points',
      icon: Star,
      color: '#F59E0B'
    },
    {
      id: '3',
      title: 'Refer Friends',
      description: 'Earn 200 points per referral',
      points: '200 points',
      icon: Gift,
      color: '#8B5CF6'
    },
    {
      id: '4',
      title: 'Complete Profile',
      description: 'Add travel preferences',
      points: '100 points',
      icon: Trophy,
      color: '#EF4444'
    }
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'booking': return <Hotel className="w-4 h-4" />;
      case 'flight': return <Plane className="w-4 h-4" />;
      case 'review': return <Star className="w-4 h-4" />;
      case 'referral': return <Gift className="w-4 h-4" />;
      case 'accommodation': return <Hotel className="w-4 h-4" />;
      case 'service': return <Coffee className="w-4 h-4" />;
      case 'voucher': return <CreditCard className="w-4 h-4" />;
      default: return <Award className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'booking': return 'text-blue-600 bg-blue-100';
      case 'flight': return 'text-purple-600 bg-purple-100';
      case 'review': return 'text-yellow-600 bg-yellow-100';
      case 'referral': return 'text-green-600 bg-green-100';
      case 'accommodation': return 'text-blue-600 bg-blue-100';
      case 'service': return 'text-orange-600 bg-orange-100';
      case 'voucher': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Travel Rewards</h2>
        <p className="text-gray-600">Earn points and unlock exclusive benefits</p>
      </motion.div>

      {/* Current Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="p-6 bg-gradient-to-br from-[#5FAD43] to-[#4a8f35] text-white">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center mb-4">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ backgroundColor: levels[currentLevelIndex]?.color + '20' }}
              >
                <Crown className="w-8 h-8" style={{ color: levels[currentLevelIndex]?.color }} />
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-1">{userRewards.currentLevel}</h3>
            <p className="text-white text-opacity-90 mb-4">Member since {userRewards.memberSince}</p>
            
            <div className="text-center mb-4">
              <div className="text-4xl font-bold mb-2">{userRewards.currentPoints.toLocaleString()}</div>
              <div className="text-white text-opacity-90">Available Points</div>
            </div>
          </div>

          {currentLevelIndex < levels.length - 1 && (
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-white text-opacity-90">Progress to {levels[currentLevelIndex + 1]?.name}</span>
                <span className="text-sm text-white text-opacity-90">{userRewards.pointsToNext} points needed</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
          )}
        </Card>
      </motion.div>

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 gap-4"
      >
        <Card className="p-4 text-center">
          <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900 mb-1">{userRewards.totalEarned.toLocaleString()}</div>
          <div className="text-sm text-gray-600">Total Earned</div>
        </Card>
        <Card className="p-4 text-center">
          <Gift className="w-8 h-8 text-purple-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900 mb-1">{userRewards.totalRedeemed.toLocaleString()}</div>
          <div className="text-sm text-gray-600">Total Redeemed</div>
        </Card>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="redeem">Redeem</TabsTrigger>
            <TabsTrigger value="earn">Earn More</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            {/* Current Level Benefits */}
            <Card className="p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">Your {userRewards.currentLevel} Benefits</h3>
              <div className="space-y-3">
                {levels[currentLevelIndex]?.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Level Progression */}
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Level Progression</h3>
              <div className="space-y-4">
                {levels.map((level, index) => (
                  <div key={level.name} className="flex items-center gap-4">
                    <div 
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        index <= currentLevelIndex ? 'text-white' : 'text-gray-400 bg-gray-100'
                      }`}
                      style={{ 
                        backgroundColor: index <= currentLevelIndex ? level.color : undefined 
                      }}
                    >
                      {index <= currentLevelIndex ? <Crown className="w-4 h-4" /> : <Crown className="w-4 h-4" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className={`font-medium ${index <= currentLevelIndex ? 'text-gray-900' : 'text-gray-500'}`}>
                          {level.name}
                        </span>
                        <span className="text-sm text-gray-500">
                          {level.max === Infinity ? `${level.min.toLocaleString()}+` : `${level.min.toLocaleString()} - ${level.max.toLocaleString()}`}
                        </span>
                      </div>
                      {index === currentLevelIndex && (
                        <div className="text-sm text-[#5FAD43] font-medium">Current Level</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="redeem" className="mt-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Available Rewards</h3>
                <div className="text-sm text-gray-600">
                  {userRewards.currentPoints.toLocaleString()} points available
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {availableRewards.map((reward) => (
                  <motion.div
                    key={reward.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card className="p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-4">
                        <div 
                          className="w-12 h-12 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${reward.color}15` }}
                        >
                          <reward.icon className="w-6 h-6" style={{ color: reward.color }} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-gray-900">{reward.title}</h4>
                            {reward.popular && (
                              <Badge className="bg-orange-100 text-orange-800">Popular</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{reward.description}</p>
                          <div className="flex items-center justify-between">
                            <Badge variant="outline">{reward.category}</Badge>
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-bold text-gray-900">{reward.points}</span>
                              <span className="text-sm text-gray-500">points</span>
                            </div>
                          </div>
                        </div>
                        <Button 
                          size="sm"
                          disabled={userRewards.currentPoints < reward.points}
                          className="bg-[#5FAD43] hover:bg-[#4a8f35]"
                        >
                          Redeem
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="earn" className="mt-6">
            <div className="space-y-6">
              <h3 className="font-semibold text-gray-900">Ways to Earn Points</h3>
              
              <div className="grid grid-cols-1 gap-4">
                {earningOpportunities.map((opportunity) => (
                  <motion.div
                    key={opportunity.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                      <div className="flex items-center gap-4">
                        <div 
                          className="w-12 h-12 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${opportunity.color}15` }}
                        >
                          <opportunity.icon className="w-6 h-6" style={{ color: opportunity.color }} />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">{opportunity.title}</h4>
                          <p className="text-sm text-gray-600">{opportunity.description}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-[#5FAD43]">{opportunity.points}</div>
                          <ChevronRight className="w-5 h-5 text-gray-400 mx-auto mt-1" />
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Card className="p-4">
                  <h4 className="font-semibold text-gray-900 mb-4">Recent Earnings</h4>
                  <div className="space-y-3">
                    {earnHistory.slice(0, 3).map((item) => (
                      <div key={item.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getTypeColor(item.type)}`}>
                            {getTypeIcon(item.type)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{item.description}</p>
                            <p className="text-xs text-gray-500">{item.date}</p>
                          </div>
                        </div>
                        <span className="font-semibold text-green-600">+{item.points}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-4">
                  <h4 className="font-semibold text-gray-900 mb-4">Recent Redemptions</h4>
                  <div className="space-y-3">
                    {redeemHistory.map((item) => (
                      <div key={item.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getTypeColor(item.type)}`}>
                            {getTypeIcon(item.type)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{item.description}</p>
                            <p className="text-xs text-gray-500">{item.date}</p>
                          </div>
                        </div>
                        <span className="font-semibold text-red-600">-{item.points}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}