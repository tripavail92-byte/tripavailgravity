import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, CheckCircle, Edit3, Plus } from 'lucide-react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';

// Import our modern account info icons
import {
  ModernAccountInfoIcon,
  ModernProfileImageIcon,
  ModernContactEmailIcon,
  ModernContactPhoneIcon,
  ModernLocationInfoIcon,
  ModernBirthdateIcon,
  ModernNationalityIcon,
  ModernLanguageIcon,
  ModernCurrencyIcon,
  ModernEmailVerificationIcon,
  ModernPhoneVerificationIcon,
  ModernIdentityVerificationIcon,
  ModernTripsIcon,
  ModernPointsIcon,
  ModernMemberSinceIcon,
  ModernEditProfileIcon
} from '../../../components/icons/profile/ModernAccountInfoIcons';

interface AccountInfoScreenProps {
  onNavigate: (screen: string) => void;
}

export default function AccountInfoScreen({ onNavigate }: AccountInfoScreenProps) {
  const [profileData] = useState({
    name: 'Maria Rodriguez',
    email: 'maria.rodriguez@gmail.com',
    phone: '+92 300 1234567',
    location: 'Lahore, Pakistan',
    dateOfBirth: '1992-03-15',
    nationality: 'Pakistani',
    language: 'English',
    currency: 'PKR',
    memberSince: '2022-01-15',
    profileImage: null,
    isEmailVerified: true,
    isPhoneVerified: false,
    isIdentityVerified: false,
    profileCompletion: 75,
    totalTrips: 12,
    totalPoints: 2450,
    memberYear: 2022
  });

  const contactInfo = [
    {
      id: 'email',
      title: 'Email Address',
      value: profileData.email,
      icon: ModernContactEmailIcon,
      verified: profileData.isEmailVerified,
      editable: true,
      action: () => console.log('Edit email')
    },
    {
      id: 'phone',
      title: 'Phone Number',
      value: profileData.phone,
      icon: ModernContactPhoneIcon,
      verified: profileData.isPhoneVerified,
      editable: true,
      action: () => console.log('Edit phone')
    },
    {
      id: 'location',
      title: 'Location',
      value: profileData.location,
      icon: ModernLocationInfoIcon,
      verified: true,
      editable: true,
      action: () => console.log('Edit location')
    }
  ];

  const personalInfo = [
    {
      id: 'dob',
      title: 'Date of Birth',
      value: new Date(profileData.dateOfBirth).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      icon: ModernBirthdateIcon
    },
    {
      id: 'nationality',
      title: 'Nationality',
      value: profileData.nationality,
      icon: ModernNationalityIcon
    },
    {
      id: 'language',
      title: 'Language',
      value: profileData.language,
      icon: ModernLanguageIcon
    },
    {
      id: 'currency',
      title: 'Currency',
      value: profileData.currency,
      icon: ModernCurrencyIcon
    }
  ];

  const verificationItems = [
    {
      id: 'email-verification',
      title: 'Email Verification',
      description: 'Your email address is verified',
      icon: ModernEmailVerificationIcon,
      verified: profileData.isEmailVerified,
      action: () => console.log('Manage email verification')
    },
    {
      id: 'phone-verification',
      title: 'Phone Verification',
      description: 'Verify your phone number for security',
      icon: ModernPhoneVerificationIcon,
      verified: profileData.isPhoneVerified,
      action: () => console.log('Verify phone')
    },
    {
      id: 'identity-verification',
      title: 'Identity Verification',
      description: 'Upload government ID for full verification',
      icon: ModernIdentityVerificationIcon,
      verified: profileData.isIdentityVerified,
      action: () => console.log('Verify identity')
    }
  ];

  const profileStats = [
    {
      id: 'trips',
      label: 'Trips',
      value: profileData.totalTrips,
      icon: ModernTripsIcon
    },
    {
      id: 'points',
      label: 'Points',
      value: profileData.totalPoints.toLocaleString(),
      icon: ModernPointsIcon
    },
    {
      id: 'member-since',
      label: 'Since',
      value: profileData.memberYear,
      icon: ModernMemberSinceIcon
    }
  ];

  const renderContactItem = (item: any, index: number, delay: number) => (
    <motion.div
      key={item.id}
      className="flex items-center justify-between p-3 bg-white dark:bg-card rounded-xl border border-gray-100 dark:border-gray-800 group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: delay + index * 0.05 }}
    >
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
          <item.icon size={20} className="text-gray-900 dark:text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-900 dark:text-foreground text-sm mb-1">{item.title}</div>
          <div className="text-xs text-gray-600 dark:text-gray-400 truncate">{item.value}</div>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Badge 
          className={`${
            item.verified 
              ? 'bg-primary/10 text-primary hover:bg-primary/20' 
              : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/30'
          } border-0 text-xs`}
        >
          {item.verified ? (
            <><CheckCircle className="w-3 h-3 mr-1" />Verified</>
          ) : (
            <>Unverified</>
          )}
        </Badge>
        {item.editable && (
          <motion.button
            onClick={item.action}
            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Edit3 className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
          </motion.button>
        )}
      </div>
    </motion.div>
  );

  const renderPersonalItem = (item: any, index: number, delay: number) => (
    <motion.div
      key={item.id}
      className="p-3 bg-white dark:bg-card rounded-xl border border-gray-100 dark:border-gray-800"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: delay + index * 0.05 }}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center shadow-sm">
          <item.icon size={18} className="text-gray-900 dark:text-white" />
        </div>
        <div>
          <div className="font-medium text-gray-900 dark:text-foreground text-sm mb-1">{item.title}</div>
          <div className="text-xs text-gray-600 dark:text-gray-400">{item.value}</div>
        </div>
      </div>
    </motion.div>
  );

  const renderVerificationItem = (item: any, index: number, delay: number) => (
    <motion.button
      key={item.id}
      onClick={item.action}
      className="w-full flex items-center justify-between p-3 bg-white dark:bg-card rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: delay + index * 0.05 }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${
          item.verified 
            ? 'bg-primary/10' 
            : 'bg-gray-100 dark:bg-gray-800'
        }`}>
          <item.icon 
            size={20} 
            className={item.verified ? 'text-primary' : 'text-gray-900 dark:text-white'}
          />
        </div>
        <div className="text-left">
          <div className="font-medium text-gray-900 dark:text-foreground text-sm mb-1">{item.title}</div>
          <div className="text-xs text-gray-600 dark:text-gray-400">{item.description}</div>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Badge 
          className={`${
            item.verified 
              ? 'bg-primary/10 text-primary hover:bg-primary/20' 
              : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/30'
          } border-0 text-xs`}
        >
          {item.verified ? (
            <><CheckCircle className="w-3 h-3 mr-1" />Done</>
          ) : (
            <>Pending</>
          )}
        </Badge>
        <div className="text-gray-400 group-hover:text-primary transition-colors">
          <ArrowLeft className="w-4 h-4 rotate-180" />
        </div>
      </div>
    </motion.button>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-card border-b border-gray-200 dark:border-border">
        <div className="px-6 py-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4"
          >
            <motion.button
              onClick={() => onNavigate('account-settings')}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-muted-foreground" />
            </motion.button>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-foreground">Account Information</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Manage your personal details and verification status</p>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-8">
        {/* Profile Overview */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6 bg-gradient-to-r from-gray-900 to-black dark:from-gray-800 dark:to-gray-900 border-0 shadow-lg">
            <div className="text-white">
              <div className="flex flex-col items-center text-center">
                {/* Profile Image */}
                <div className="relative mb-4">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white/20 shadow-lg">
                    <Avatar className="w-full h-full">
                      <AvatarImage src="https://images.unsplash.com/photo-1655249493799-9cee4fe983bb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjB3b21hbiUyMGhlYWRzaG90JTIwcG9ydHJhaXR8ZW58MXx8fHwxNzU4MjA0MjA0fDA&ixlib=rb-4.1.0&q=80&w=300" />
                      <AvatarFallback className="bg-white/20 text-white text-lg">
                        {profileData.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <motion.button
                    className="absolute -bottom-1 -right-1 w-7 h-7 bg-white/20 backdrop-blur-sm text-white rounded-full flex items-center justify-center shadow-lg"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <ModernProfileImageIcon size={14} className="text-white" />
                  </motion.button>
                </div>

                {/* Name & Role */}
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {profileData.name}
                  </h3>
                  <p className="text-gray-300 mb-1 text-sm">TripAvail Traveler</p>
                  <p className="text-xs text-gray-400">
                    Member since {new Date(profileData.memberSince).getFullYear()}
                  </p>
                </div>

                {/* Profile Completion */}
                <div className="w-full mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-300">Profile completion</span>
                    <span className="text-sm font-semibold text-white">{profileData.profileCompletion}%</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2 mb-2">
                    <div 
                      className="h-2 rounded-full transition-all duration-500 gradient-partner"
                      style={{ width: `${profileData.profileCompletion}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Getting started</span>
                    <span>Complete profile</span>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4 w-full">
                  {profileStats.map((stat, index) => (
                    <motion.div
                      key={stat.id}
                      className="text-center p-3 bg-white/10 backdrop-blur-sm rounded-xl"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 + index * 0.1 }}
                    >
                      <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <stat.icon size={16} className="text-white" />
                      </div>
                      <div className="font-semibold text-white text-sm mb-1">{stat.value}</div>
                      <div className="text-xs text-gray-300">{stat.label}</div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Contact Information */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="space-y-4">
            <div className="px-2">
              <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Contact Information</h3>
            </div>
            
            <div className="space-y-3">
              {contactInfo.map((item, index) => 
                renderContactItem(item, index, 0.4)
              )}
            </div>
          </div>
        </motion.div>

        {/* Personal Details */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="space-y-4">
            <div className="px-2 flex items-center justify-between">
              <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Personal Details</h3>
              <motion.button
                className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ModernEditProfileIcon size={16} className="text-gray-400 dark:text-gray-500" />
              </motion.button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {personalInfo.map((item, index) => 
                renderPersonalItem(item, index, 0.6)
              )}
            </div>
          </div>
        </motion.div>

        {/* Verification Status */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <div className="space-y-4">
            <div className="px-2">
              <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Verification Status</h3>
            </div>
            
            <div className="space-y-3">
              {verificationItems.map((item, index) => 
                renderVerificationItem(item, index, 0.8)
              )}
            </div>
          </div>
        </motion.div>

        {/* Additional spacing for bottom navigation */}
        <div className="h-20"></div>
      </div>
    </div>
  );
}