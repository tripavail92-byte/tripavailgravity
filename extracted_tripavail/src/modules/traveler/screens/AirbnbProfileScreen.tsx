import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Camera, 
  Check, 
  Edit3,
  ChevronRight,
  X
} from 'lucide-react';

// Import custom SVG icons
import {
  MobileWalletIcon,
  CreditCardIcon,
  SecurityLockIcon,
  EmailIcon,
  PhoneIcon,
  AddressIcon,
  LocationIcon,
  CalendarIcon,
  EasyPaisaIcon,
  JazzCashIcon,
  BankCardIcon
} from '../../../components/icons/profile/PaymentMethodIcons';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Progress } from '../../../components/ui/progress';
import { Calendar as CalendarComponent } from '../../../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../../../components/ui/popover';
import { format } from 'date-fns';
import { ImageWithFallback } from '../../../components/figma/ImageWithFallback';

interface AirbnbProfileScreenProps {
  onNavigate: (screen: string) => void;
}

export default function AirbnbProfileScreen({ onNavigate }: AirbnbProfileScreenProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [dateOfBirth, setDateOfBirth] = useState<Date>(new Date(1992, 4, 15)); // May 15, 1992
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  const [profileData] = useState({
    name: 'Maria Rodriguez',
    email: 'maria.rodriguez@gmail.com',
    phone: '🇵🇰 300 1234567',
    location: 'Lahore, Pakistan',
    address: 'House 45, Block B, DHA Phase 5, Lahore, Punjab 54792',
    bio: 'Travel enthusiast exploring the world one destination at a time ✈️',
    verified: true,
    joinDate: 'Member since Jan 2024',
    profileImage: 'https://images.unsplash.com/photo-1655249493799-9cee4fe983bb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjB3b21hbiUyMGhlYWRzaG90JTIwcG9ydHJhaXR8ZW58MXx8fHwxNzU4MjA0MjA0fDA&ixlib=rb-4.1.0&q=80&w=300'
  });

  const profileCompletion = 85;

  const contactInfo = [
    {
      id: 'email',
      icon: EmailIcon,
      label: 'Email',
      value: profileData.email,
      verified: true
    },
    {
      id: 'phone',
      icon: PhoneIcon,
      label: 'Phone',
      value: profileData.phone,
      verified: false
    },
    {
      id: 'address',
      icon: AddressIcon,
      label: 'Address',
      value: profileData.address,
      verified: false
    },
    {
      id: 'location',
      icon: LocationIcon,
      label: 'City',
      value: profileData.location,
      verified: false
    },
    {
      id: 'dob',
      icon: CalendarIcon,
      label: 'Date of Birth',
      value: format(dateOfBirth, 'MMMM dd, yyyy'),
      verified: true,
      isCalendar: true
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-card border-b border-gray-200 dark:border-border">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-foreground">Profile</h1>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
              className="text-gray-600 dark:text-muted-foreground"
            >
              <Edit3 className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Profile Header Card */}
        <Card className="p-6 bg-white dark:bg-card border-0 shadow-sm">
          <div className="flex flex-col items-center text-center">
            {/* Profile Image */}
            <div className="relative mb-4">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg">
                <ImageWithFallback
                  src={profileData.profileImage}
                  alt={profileData.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <motion.button
                className="absolute -bottom-1 -right-1 w-8 h-8 bg-gray-900 dark:bg-foreground text-white dark:text-background rounded-full flex items-center justify-center shadow-lg"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Camera className="w-4 h-4" />
              </motion.button>
            </div>

            {/* Name */}
            <div className="mb-2">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-foreground mb-2">
                {profileData.name}
              </h2>
            </div>

            {/* Bio */}
            <p className="text-gray-600 dark:text-muted-foreground mb-1 max-w-sm">
              {profileData.bio}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {profileData.joinDate}
            </p>

            {/* Profile Completion */}
            <div className="w-full">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Profile completion</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-foreground">{profileCompletion}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${profileCompletion}%`,
                    background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)'
                  }}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* About Me Section */}
        <Card className="p-6 bg-white dark:bg-card border-0 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground mb-4">About Me</h3>
          <p className="text-gray-600 dark:text-muted-foreground leading-relaxed">
            {profileData.bio}
          </p>
        </Card>

        {/* Contact Information */}
        <Card className="bg-white dark:bg-card border-0 shadow-sm">
          <div className="p-6 border-b border-gray-100 dark:border-border">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground">Contact Info</h3>
          </div>
          
          <div className="divide-y divide-gray-100 dark:divide-border">
            {contactInfo.map((item) => (
              <motion.div
                key={item.id}
                className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                whileHover={{ x: 4 }}
              >
                {item.isCalendar ? (
                  <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <PopoverTrigger asChild>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-rose-50 dark:bg-rose-900/20 rounded-full flex items-center justify-center">
                            <item.icon size={20} className="text-rose-600 dark:text-rose-400" />
                          </div>
                          <div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{item.label}</div>
                            <div className="font-medium text-gray-900 dark:text-foreground">{item.value}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          {item.verified ? (
                            <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-full">
                              <Check className="w-3 h-3 text-blue-500" />
                              <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Verified</span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 dark:text-gray-500">Not verified</span>
                          )}
                          <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                        </div>
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-white dark:bg-card border border-gray-200 dark:border-border shadow-lg rounded-lg">
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
                        className="rounded-lg"
                      />
                    </PopoverContent>
                  </Popover>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                        <item.icon size={20} className="text-gray-700 dark:text-gray-300" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{item.label}</div>
                        <div className="font-medium text-gray-900 dark:text-foreground">{item.value}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {item.verified ? (
                        <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-full">
                          <Check className="w-3 h-3 text-blue-500" />
                          <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Verified</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 dark:text-gray-500">Not verified</span>
                      )}
                      <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </Card>

        {/* Payment Methods */}
        <Card className="bg-white dark:bg-card border-0 shadow-sm">
          <div className="p-6 border-b border-gray-100 dark:border-border">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground">Payment Methods</h3>
          </div>
          
          <div className="divide-y divide-gray-100 dark:divide-border">
            {/* Mobile Wallets */}
            <motion.div
              className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              whileHover={{ x: 4 }}
              onClick={() => onNavigate('mobile-wallets')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                    <MobileWalletIcon size={20} className="text-gray-700 dark:text-gray-300" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-foreground">Mobile Wallets</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">EasyPaisa, JazzCash & more</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {/* EasyPaisa & JazzCash mini icons */}
                  <div className="flex items-center gap-1">
                    <div className="w-6 h-6 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-sm border border-gray-200 dark:border-gray-700">
                      <EasyPaisaIcon size={16} className="" />
                    </div>
                    <div className="w-6 h-6 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-sm border border-gray-200 dark:border-gray-700">
                      <JazzCashIcon size={16} className="" />
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                </div>
              </div>
            </motion.div>

            {/* Debit/Credit Cards */}
            <motion.div
              className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              whileHover={{ x: 4 }}
              onClick={() => onNavigate('payment-cards')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                    <CreditCardIcon size={20} className="text-gray-700 dark:text-gray-300" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-foreground">Cards</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Debit & Credit Cards</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {/* Card type mini icons */}
                  <div className="flex items-center gap-1">
                    <div className="w-6 h-6 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center">
                      <BankCardIcon size={12} className="text-gray-700 dark:text-gray-300" />
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                </div>
              </div>
            </motion.div>
          </div>
        </Card>

        {/* Account Security */}
        <Card className="bg-white dark:bg-card border-0 shadow-sm">
          <div className="p-6 border-b border-gray-100 dark:border-border">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground">Account Security</h3>
          </div>
          
          <motion.div
            className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            whileHover={{ x: 4 }}
            onClick={() => onNavigate('change-password')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                  <SecurityLockIcon size={20} className="text-gray-700 dark:text-gray-300" />
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-foreground">Change Password</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Update your account password</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            </div>
          </motion.div>
        </Card>

        {/* Additional spacing for bottom navigation */}
        <div className="h-20"></div>
      </div>
    </div>
  );
}