/**
 * Traveller Profile Page
 * 
 * Airbnb-inspired minimalist profile screen with glassmorphism effects
 * Features: Profile completion, contact verification, payment methods, security
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Camera, Mail, Phone, MapPin, Map, Calendar, 
  CreditCard, Wallet, Lock, ChevronRight, Check, Edit
} from 'lucide-react';
import { GlassCard, GlassBadge } from '@/components/ui/glass';
import { Button } from '@/components/ui/button';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';

// Mock user data (replace with real data from auth context/API)
const mockProfileData = {
  name: 'Maria Rodriguez',
  email: 'maria.rodriguez@gmail.com',
  phone: '+92 300 1234567',
  address: 'House 45, Block B, DHA Phase 5',
  city: 'Lahore, Pakistan',
  bio: 'Travel enthusiast exploring the world one destination at a time. Love discovering hidden gems and authentic local experiences. ✈️🌍',
  profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
  joinDate: 'Member since Jan 2024',
  dateOfBirth: new Date(1992, 4, 15),
  emailVerified: true,
  phoneVerified: false,
  paymentMethods: {
    mobileWallets: ['EasyPaisa', 'JazzCash'],
    cards: ['Visa •••• 4242']
  }
};

interface ContactInfoItem {
  id: string;
  icon: typeof Mail;
  label: string;
  value: string;
  verified: boolean;
  isCalendar?: boolean;
  isRoseAccent?: boolean;
}

export default function TravellerProfilePage() {
  const [profile] = useState(mockProfileData);
  const [dateOfBirth, setDateOfBirth] = useState<Date>(profile.dateOfBirth);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Calculate profile completion
  const calculateCompletion = () => {
    const fields = [
      profile.name,
      profile.email,
      profile.phone,
      profile.address,
      profile.city,
      profile.bio,
      profile.dateOfBirth,
      profile.profileImage,
    ];
    const weights = [15, 15, 15, 15, 10, 10, 10, 10];
    let total = 0;
    fields.forEach((field, idx) => {
      if (field) total += weights[idx];
    });
    return total;
  };

  const profileCompletion = calculateCompletion();

  const contactInfo: ContactInfoItem[] = [
    {
      id: 'email',
      icon: Mail,
      label: 'Email',
      value: profile.email,
      verified: profile.emailVerified
    },
    {
      id: 'phone',
      icon: Phone,
      label: 'Phone',
      value: profile.phone,
      verified: profile.phoneVerified
    },
    {
      id: 'address',
      icon: MapPin,
      label: 'Address',
      value: profile.address,
      verified: false
    },
    {
      id: 'location',
      icon: Map,
      label: 'City',
      value: profile.city,
      verified: false
    },
    {
      id: 'dob',
      icon: Calendar,
      label: 'Date of Birth',
      value: format(dateOfBirth, 'MMMM dd, yyyy'),
      verified: true,
      isCalendar: true,
      isRoseAccent: true
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">Profile</h1>
          <Button variant="ghost" size="sm" className="gap-2">
            <Edit className="w-4 h-4" />
            Edit
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {/* Profile Header Card */}
        <GlassCard
          variant="card"
          className="p-6 rounded-2xl"
          asMotion
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-col items-center text-center">
            {/* Avatar */}
            <div className="relative mb-4">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg">
                <img
                  src={profile.profileImage}
                  alt={profile.name}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Camera Edit Button */}
              <motion.button
                className="absolute -bottom-1 -right-1 w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center shadow-lg"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Camera className="w-4 h-4" />
              </motion.button>
            </div>

            {/* Name */}
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              {profile.name}
            </h2>

            {/* Bio */}
            <p className="text-gray-600 mb-1 max-w-sm leading-relaxed">
              {profile.bio}
            </p>
            
            {/* Member Since */}
            <p className="text-sm text-gray-500 mb-6">
              {profile.joinDate}
            </p>

            {/* Profile Completion */}
            <div className="w-full">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Profile completion
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {profileCompletion}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <motion.div 
                  className="h-2 rounded-full"
                  style={{ 
                    background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)'
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${profileCompletion}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>
            </div>
          </div>
        </GlassCard>

        {/* About Me Card */}
        <GlassCard
          variant="card"
          className="p-6 rounded-2xl"
          asMotion
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            About Me
          </h3>
          <p className="text-gray-600 leading-relaxed">
            {profile.bio}
          </p>
        </GlassCard>

        {/* Contact Information Card */}
        <GlassCard
          variant="card"
          className="rounded-2xl overflow-hidden"
          asMotion
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">
              Contact Info
            </h3>
          </div>
          
          <div className="divide-y divide-gray-100">
            {contactInfo.map((item) => (
              item.isCalendar ? (
                <Popover key={item.id} open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <motion.div
                      className="p-6 hover:bg-gray-50/50 transition-colors cursor-pointer"
                      whileHover={{ x: 4 }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            item.isRoseAccent 
                              ? 'bg-rose-50' 
                              : 'bg-gray-100'
                          }`}>
                            <item.icon size={20} className={
                              item.isRoseAccent 
                                ? 'text-rose-600' 
                                : 'text-gray-700'
                            } />
                          </div>
                          <div>
                            <div className="text-sm text-gray-500">{item.label}</div>
                            <div className="font-medium text-gray-900">{item.value}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          {item.verified ? (
                            <GlassBadge variant="info" size="sm" icon={<Check className="w-3 h-3" />}>
                              Verified
                            </GlassBadge>
                          ) : (
                            <span className="text-xs text-gray-400">Not verified</span>
                          )}
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                    </motion.div>
                  </PopoverTrigger>
                  
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={dateOfBirth}
                      onSelect={(date) => {
                        if (date) {
                          setDateOfBirth(date);
                          setIsCalendarOpen(false);
                        }
                      }}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              ) : (
                <motion.div
                  key={item.id}
                  className="p-6 hover:bg-gray-50/50 transition-colors cursor-pointer"
                  whileHover={{ x: 4 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <item.icon size={20} className="text-gray-700" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">{item.label}</div>
                        <div className="font-medium text-gray-900">{item.value}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {item.verified ? (
                        <GlassBadge variant="info" size="sm" icon={<Check className="w-3 h-3" />}>
                          Verified
                        </GlassBadge>
                      ) : (
                        <span className="text-xs text-gray-400">Not verified</span>
                      )}
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </motion.div>
              )
            ))}
          </div>
        </GlassCard>

        {/* Payment Methods Card */}
        <GlassCard
          variant="card"
          className="rounded-2xl overflow-hidden"
          asMotion
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">
              Payment Methods
            </h3>
          </div>
          
          <div className="divide-y divide-gray-100">
            {/* Mobile Wallets */}
            <motion.div
              className="p-6 hover:bg-gray-50/50 transition-colors cursor-pointer"
              whileHover={{ x: 4 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Wallet size={20} className="text-primary" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Mobile Wallets</div>
                    <div className="text-sm text-gray-500">
                      {profile.paymentMethods.mobileWallets.join(', ')}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            </motion.div>

            {/* Payment Cards */}
            <motion.div
              className="p-6 hover:bg-gray-50/50 transition-colors cursor-pointer"
              whileHover={{ x: 4 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                    <CreditCard size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Credit & Debit Cards</div>
                    <div className="text-sm text-gray-500">
                      {profile.paymentMethods.cards.join(', ')}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            </motion.div>
          </div>
        </GlassCard>

        {/* Account Security Card */}
        <GlassCard
          variant="card"
          className="rounded-2xl overflow-hidden"
          asMotion
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">
              Account Security
            </h3>
          </div>
          
          <motion.div
            className="p-6 hover:bg-gray-50/50 transition-colors cursor-pointer"
            whileHover={{ x: 4 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center">
                  <Lock size={20} className="text-green-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">Change Password</div>
                  <div className="text-sm text-gray-500">
                    Update your password to keep your account secure
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
          </motion.div>
        </GlassCard>
      </div>
    </div>
  );
}
