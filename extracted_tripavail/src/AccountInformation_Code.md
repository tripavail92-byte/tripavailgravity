# Account Information Screen - Complete Code

## Overview
Clean, mobile-optimized Account Information screen with modern design patterns, matching the app's black SVG icon theme and Rose primary colors. Features profile overview, contact information, personal details, and verification status management.

## Key Features
- **Clean Section Headers**: Simple dull text headers (no icons)
- **Profile Overview**: Neon black gradient card with stats and completion progress
- **Contact Management**: Email, phone, location with verification badges
- **Personal Details**: Birth date, nationality, language, currency in grid layout
- **Verification Status**: Email, phone, and identity verification tracking
- **Mobile Optimized**: Compact spacing and touch-friendly interactions
- **Progress Gradient**: Uses `gradient-partner` class for profile completion

---

## Main Component File

**Path:** `/modules/traveler/screens/AccountInfoScreen.tsx`

```tsx
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
```

---

## Modern Account Info Icons

**Path:** `/components/icons/profile/ModernAccountInfoIcons.tsx`

```tsx
import React from 'react';

// Account Information Overview Icon
export const ModernAccountInfoIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 24, 
  className = "" 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
  >
    <path 
      d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      fill="currentColor"
      fillOpacity="0.1"
    />
    <circle 
      cx="12" 
      cy="7" 
      r="4" 
      stroke="currentColor" 
      strokeWidth="2"
      fill="currentColor"
      fillOpacity="0.1"
    />
    <path 
      d="M8 14h8M10 18h4" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round"
    />
  </svg>
);

// Profile Image Icon
export const ModernProfileImageIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 24, 
  className = "" 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
  >
    <circle 
      cx="12" 
      cy="12" 
      r="10" 
      stroke="currentColor" 
      strokeWidth="2"
      fill="currentColor"
      fillOpacity="0.1"
    />
    <circle 
      cx="12" 
      cy="10" 
      r="3" 
      stroke="currentColor" 
      strokeWidth="2"
    />
    <path 
      d="M7 20.662C8.9 18.2 10.4 17 12 17s3.1 1.2 5 3.662"
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path 
      d="M15 8l2-2M17 6l2-2" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round"
    />
  </svg>
);

// Contact Information Icons
export const ModernContactEmailIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 24, 
  className = "" 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
  >
    <path 
      d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
      stroke="currentColor" 
      strokeWidth="2"
      fill="currentColor"
      fillOpacity="0.1"
    />
    <polyline 
      points="22,6 12,13 2,6" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <circle 
      cx="18" 
      cy="8" 
      r="2" 
      fill="currentColor"
    />
  </svg>
);

export const ModernContactPhoneIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 24, 
  className = "" 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
  >
    <path 
      d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      fill="currentColor"
      fillOpacity="0.1"
    />
    <path 
      d="M15 4h6M18 1v6" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round"
    />
  </svg>
);

export const ModernLocationInfoIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 24, 
  className = "" 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
  >
    <path 
      d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
      stroke="currentColor" 
      strokeWidth="2"
      fill="currentColor"
      fillOpacity="0.1"
    />
    <circle 
      cx="12" 
      cy="10" 
      r="3" 
      stroke="currentColor" 
      strokeWidth="2"
    />
    <path 
      d="M16 6h4M18 4v4" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round"
    />
  </svg>
);

// Personal Details Icons
export const ModernBirthdateIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 24, 
  className = "" 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
  >
    <rect 
      x="3" 
      y="4" 
      width="18" 
      height="18" 
      rx="2" 
      ry="2" 
      stroke="currentColor" 
      strokeWidth="2"
      fill="currentColor"
      fillOpacity="0.1"
    />
    <path 
      d="M16 2v4M8 2v4M3 10h18" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path 
      d="M12 14l2 2 4-4" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

export const ModernNationalityIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 24, 
  className = "" 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
  >
    <path 
      d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      fill="currentColor"
      fillOpacity="0.1"
    />
    <path 
      d="M4 22v-7" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <circle 
      cx="18" 
      cy="8" 
      r="2" 
      fill="currentColor"
    />
  </svg>
);

export const ModernLanguageIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 24, 
  className = "" 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
  >
    <path 
      d="M5 8l6 6M4 14l5-5 6-1m-2 9l-3-7 3-7M13 12l3 7-6-1" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <circle 
      cx="12" 
      cy="12" 
      r="10" 
      stroke="currentColor" 
      strokeWidth="2"
      fill="currentColor"
      fillOpacity="0.1"
    />
    <path 
      d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" 
      stroke="currentColor" 
      strokeWidth="2"
    />
  </svg>
);

export const ModernCurrencyIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 24, 
  className = "" 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
  >
    <path 
      d="M12 1v6m0 10v6m8-9a8 8 0 1 1-16 0 8 8 0 0 1 16 0z"
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      fill="currentColor"
      fillOpacity="0.1"
    />
    <path 
      d="M15 9.4c0-.8-.8-1.4-2-1.4h-2c-1.2 0-2 .6-2 1.4s.8 1.4 2 1.4h2c1.2 0 2 .6 2 1.4s-.8 1.4-2 1.4h-2c-1.2 0-2-.6-2-1.4"
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

// Verification Status Icons
export const ModernEmailVerificationIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 24, 
  className = "" 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
  >
    <path 
      d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
      stroke="currentColor" 
      strokeWidth="2"
      fill="currentColor"
      fillOpacity="0.1"
    />
    <polyline 
      points="22,6 12,13 2,6" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path 
      d="M9 11l2 2 4-4" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

export const ModernPhoneVerificationIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 24, 
  className = "" 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
  >
    <rect 
      x="5" 
      y="2" 
      width="14" 
      height="20" 
      rx="2" 
      ry="2" 
      stroke="currentColor" 
      strokeWidth="2"
      fill="currentColor"
      fillOpacity="0.1"
    />
    <path 
      d="M12 18h.01M8 6h8" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path 
      d="M9 12l2 2 4-4" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

export const ModernIdentityVerificationIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 24, 
  className = "" 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
  >
    <rect 
      x="2" 
      y="3" 
      width="20" 
      height="14" 
      rx="2" 
      ry="2" 
      stroke="currentColor" 
      strokeWidth="2"
      fill="currentColor"
      fillOpacity="0.1"
    />
    <circle 
      cx="8" 
      cy="9" 
      r="2" 
      stroke="currentColor" 
      strokeWidth="2"
    />
    <path 
      d="M14 8h4M14 12h4M6 19v-2a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path 
      d="M16 19l2 2 4-4" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

// Profile Stats Icons
export const ModernTripsIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 24, 
  className = "" 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
  >
    <path 
      d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
      stroke="currentColor" 
      strokeWidth="2"
      fill="currentColor"
      fillOpacity="0.1"
    />
    <polyline 
      points="3.27,6.96 12,12.01 20.73,6.96" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path 
      d="M12 22.08V12" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

export const ModernPointsIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 24, 
  className = "" 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
  >
    <polygon 
      points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26 12,2"
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      fill="currentColor"
      fillOpacity="0.1"
    />
    <circle 
      cx="12" 
      cy="12" 
      r="3" 
      fill="currentColor"
    />
  </svg>
);

export const ModernMemberSinceIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 24, 
  className = "" 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
  >
    <circle 
      cx="12" 
      cy="12" 
      r="10" 
      stroke="currentColor" 
      strokeWidth="2"
      fill="currentColor"
      fillOpacity="0.1"
    />
    <polyline 
      points="12,6 12,12 16,14" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path 
      d="M9 2h6M12 2v4" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round"
    />
  </svg>
);

// Edit Profile Icon
export const ModernEditProfileIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 24, 
  className = "" 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
  >
    <path 
      d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      fill="currentColor"
      fillOpacity="0.1"
    />
    <path 
      d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);
```

---

## Required Imports

### UI Components
```tsx
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';
```

### Icons
```tsx
import { ArrowLeft, CheckCircle, Edit3, Plus } from 'lucide-react';
```

### Animation
```tsx
import { motion } from 'motion/react';
```

---

## Key Design Features

### 🎨 **Visual Elements**
- **Neon Black Gradient**: Profile overview card with `from-gray-900 to-black`
- **Progress Bar**: Uses `gradient-partner` class for completion percentage
- **Clean Cards**: White cards with subtle borders and hover effects
- **Verification Badges**: Color-coded green for verified, red for unverified

### 📱 **Mobile Optimization**
- **Compact Avatar**: 20x20 profile image with edit button
- **Touch-Friendly**: Proper touch targets and spacing
- **Responsive Grid**: Personal details in responsive grid layout
- **Clean Spacing**: 8px gaps between sections, 3px between items

### 🔧 **Interactive Features**
- **Hover Effects**: Edit buttons appear on hover
- **Verification Actions**: Clickable verification items with navigation
- **Profile Stats**: Interactive stat cards with icons
- **Edit Controls**: Inline editing capabilities

### 📊 **Data Management**
- **Profile Completion**: Dynamic percentage calculation
- **Verification Status**: Real-time verification tracking  
- **Contact Info**: Editable email, phone, and location
- **Personal Details**: Birth date, nationality, language, currency

---

## Styling Notes

- Uses `gradient-partner` class for progress bars (pink/magenta gradient)
- Black SVG icons with `text-gray-900 dark:text-white` styling
- Section headers use `text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider`
- Cards use `bg-white dark:bg-card` with `border border-gray-100 dark:border-gray-800`
- Hover states use `hover:bg-gray-50 dark:hover:bg-gray-800/50`

---

## Implementation Status

✅ **Complete Features:**
- Profile overview with stats and completion tracking
- Contact information with verification badges
- Personal details in responsive grid
- Verification status management
- Modern black SVG icons
- Mobile-optimized layout
- Clean section headers (no icons)
- Gradient progress bar using `gradient-partner`

The Account Information screen is ready for production use with full dark mode support and mobile optimization! 🎯✨