import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { Card } from '../../../components/ui/card';
import { Switch } from '../../../components/ui/switch';
import { Badge } from '../../../components/ui/badge';

// Import our modern notification icons
import {
  ModernNotificationOverviewIcon,
  ModernPushNotificationIcon,
  ModernEmailNotificationIcon,
  ModernSMSNotificationIcon,
  ModernInAppNotificationIcon,
  ModernTripReminderIcon,
  ModernFlightUpdateIcon,
  ModernHotelConfirmationIcon,
  ModernCheckInReminderIcon,
  ModernWeatherAlertIcon,
  ModernBookingConfirmationIcon,
  ModernPaymentAlertIcon,
  ModernCancellationAlertIcon,
  ModernRefundUpdateIcon,
  ModernSpecialOfferIcon,
  ModernNewDestinationIcon,
  ModernPriceDropIcon,
  ModernLoyaltyUpdateIcon,
  ModernNewsletterIcon,
  ModernReviewReminderIcon,
  ModernSocialUpdateIcon,
  ModernFriendActivityIcon,
  ModernQuietHoursIcon,
  ModernWeekendModeIcon,
  ModernDoNotDisturbIcon
} from '../../../components/icons/profile/ModernNotificationIcons';

interface NotificationsSettingsScreenProps {
  onNavigate: (screen: string) => void;
}

export default function NotificationsSettingsScreen({ onNavigate }: NotificationsSettingsScreenProps) {
  const [notificationSettings, setNotificationSettings] = useState({
    // Communication Preferences
    pushNotifications: true,
    emailNotifications: true,
    smsNotifications: false,
    inAppNotifications: true,
    
    // Travel Notifications
    tripReminders: true,
    flightUpdates: true,
    hotelConfirmations: true,
    checkInReminders: true,
    weatherAlerts: true,
    
    // Booking Notifications
    bookingConfirmations: true,
    paymentAlerts: true,
    cancellationAlerts: true,
    refundUpdates: true,
    
    // Marketing & Promotions
    specialOffers: false,
    newDestinations: true,
    priceDropAlerts: true,
    loyaltyUpdates: true,
    newsletterSubscription: false,
    
    // Social & Reviews
    reviewReminders: true,
    socialUpdates: false,
    friendActivity: false,
    
    // Time-based Settings
    quietHours: true,
    weekendMode: false,
    doNotDisturb: false
  });

  const [quietHoursTime, setQuietHoursTime] = useState({
    start: '22:00',
    end: '08:00'
  });

  const communicationChannels = [
    {
      id: 'pushNotifications',
      title: 'Push Notifications',
      description: 'Allow notifications',
      icon: ModernPushNotificationIcon,
      recommended: true
    },
    {
      id: 'emailNotifications',
      title: 'Email',
      description: 'Get updates via email',
      icon: ModernEmailNotificationIcon,
      recommended: true
    },
    {
      id: 'smsNotifications',
      title: 'Text Messages',
      description: 'Receive SMS alerts',
      icon: ModernSMSNotificationIcon,
      recommended: false
    },
    {
      id: 'inAppNotifications',
      title: 'In-App Notifications',
      description: 'See notifications when using the app',
      icon: ModernInAppNotificationIcon,
      recommended: true
    }
  ];

  const travelNotifications = [
    {
      id: 'tripReminders',
      title: 'Trip Reminders',
      description: 'Upcoming travel alerts',
      icon: ModernTripReminderIcon
    },
    {
      id: 'flightUpdates',
      title: 'Flight Updates',
      description: 'Gate changes, delays, and boarding notifications',
      icon: ModernFlightUpdateIcon
    },
    {
      id: 'hotelConfirmations',
      title: 'Hotel Confirmations',
      description: 'Booking confirmations and check-in details',
      icon: ModernHotelConfirmationIcon
    },
    {
      id: 'checkInReminders',
      title: 'Check-in Reminders',
      description: 'Reminders to check in for flights and hotels',
      icon: ModernCheckInReminderIcon
    },
    {
      id: 'weatherAlerts',
      title: 'Weather Alerts',
      description: 'Weather updates for your destinations',
      icon: ModernWeatherAlertIcon
    }
  ];

  const bookingNotifications = [
    {
      id: 'bookingConfirmations',
      title: 'Booking Confirmations',
      description: 'Instant confirmation of new bookings',
      icon: ModernBookingConfirmationIcon
    },
    {
      id: 'paymentAlerts',
      title: 'Payment Alerts',
      description: 'Payment confirmations and receipts',
      icon: ModernPaymentAlertIcon
    },
    {
      id: 'cancellationAlerts',
      title: 'Cancellation Alerts',
      description: 'Notifications about booking cancellations',
      icon: ModernCancellationAlertIcon
    },
    {
      id: 'refundUpdates',
      title: 'Refund Updates',
      description: 'Status updates on refund processing',
      icon: ModernRefundUpdateIcon
    }
  ];

  const marketingNotifications = [
    {
      id: 'specialOffers',
      title: 'Special Offers',
      description: 'Exclusive deals and promotional offers',
      icon: ModernSpecialOfferIcon
    },
    {
      id: 'newDestinations',
      title: 'New Destinations',
      description: 'Updates about new travel destinations',
      icon: ModernNewDestinationIcon
    },
    {
      id: 'priceDropAlerts',
      title: 'Price Drop Alerts',
      description: 'Notifications when prices drop for your searches',
      icon: ModernPriceDropIcon
    },
    {
      id: 'loyaltyUpdates',
      title: 'Loyalty Updates',
      description: 'Points balance and tier status updates',
      icon: ModernLoyaltyUpdateIcon
    },
    {
      id: 'newsletterSubscription',
      title: 'Newsletter Subscription',
      description: 'Weekly travel insights and tips',
      icon: ModernNewsletterIcon
    }
  ];

  const socialNotifications = [
    {
      id: 'reviewReminders',
      title: 'Review Reminders',
      description: 'Reminders to review your recent trips',
      icon: ModernReviewReminderIcon
    },
    {
      id: 'socialUpdates',
      title: 'Social Updates',
      description: 'Updates from friends and travel community',
      icon: ModernSocialUpdateIcon
    },
    {
      id: 'friendActivity',
      title: 'Friend Activity',
      description: 'Notifications about friend travel activity',
      icon: ModernFriendActivityIcon
    }
  ];

  const doNotDisturbSettings = [
    {
      id: 'quietHours',
      title: 'Quiet Hours',
      description: notificationSettings.quietHours 
        ? `Active from ${quietHoursTime.start} to ${quietHoursTime.end}`
        : 'Set quiet hours to reduce notifications',
      icon: ModernQuietHoursIcon
    },
    {
      id: 'weekendMode',
      title: 'Weekend Mode',
      description: 'Reduce work-related notifications on weekends',
      icon: ModernWeekendModeIcon
    },
    {
      id: 'doNotDisturb',
      title: 'Do Not Disturb',
      description: 'Temporarily disable all notifications',
      icon: ModernDoNotDisturbIcon
    }
  ];

  const toggleSetting = (key: string) => {
    setNotificationSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getActiveCount = (category: any[]) => {
    return category.filter(item => notificationSettings[item.id]).length;
  };

  const renderNotificationItem = (item: any, index: number, delay: number) => (
    <motion.div
      key={item.id}
      className="flex items-center p-3 bg-white dark:bg-card rounded-xl border border-gray-100 dark:border-gray-800"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: delay + index * 0.05 }}
    >
      <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
        <item.icon size={20} className="text-gray-900 dark:text-white" />
      </div>
      
      <div className="flex-1 min-w-0 ml-3">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-gray-900 dark:text-foreground text-sm">{item.title}</span>
              {item.recommended && (
                <Badge className="bg-primary hover:bg-primary/90 text-primary-foreground border-0 text-xs px-2 py-0.5 flex-shrink-0">
                  Recommended
                </Badge>
              )}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{item.description}</div>
          </div>
          
          <motion.div 
            whileTap={{ scale: 0.95 }}
            className="flex-shrink-0 ml-3"
          >
            <Switch
              checked={notificationSettings[item.id]}
              onCheckedChange={() => toggleSetting(item.id)}
              className="data-[state=checked]:bg-primary"
            />
          </motion.div>
        </div>
      </div>
    </motion.div>
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
              <h2 className="text-xl font-semibold text-gray-900 dark:text-foreground">Notifications</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Control what notifications you receive and how</p>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-8">
        {/* Neon Black Overview */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6 bg-gradient-to-r from-gray-900 to-black dark:from-gray-800 dark:to-gray-900 border-0 shadow-lg">
            <div className="text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-sm">
                    <ModernNotificationOverviewIcon size={24} className="text-white" />
                  </div>
                  <h3 className="text-lg font-semibold">Notification Overview</h3>
                </div>
                <Badge className="bg-white/20 hover:bg-white/30 text-white border-0">
                  {Object.values(notificationSettings).filter(Boolean).length} Active
                </Badge>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold mb-1">{getActiveCount(communicationChannels)}</div>
                  <div className="text-xs text-gray-300">Channels</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold mb-1">{getActiveCount(travelNotifications)}</div>
                  <div className="text-xs text-gray-300">Travel</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold mb-1">{getActiveCount(marketingNotifications)}</div>
                  <div className="text-xs text-gray-300">Marketing</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold mb-1">{notificationSettings.quietHours ? 'On' : 'Off'}</div>
                  <div className="text-xs text-gray-300">Quiet Hours</div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Communication */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="space-y-4">
            <div className="px-2">
              <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Communication</h3>
            </div>
            
            <div className="space-y-3">
              {communicationChannels.map((channel, index) => 
                renderNotificationItem(channel, index, 0.3)
              )}
            </div>
          </div>
        </motion.div>

        {/* Travel Updates */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="space-y-4">
            <div className="px-2">
              <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Travel Updates</h3>
            </div>
            
            <div className="space-y-3">
              {travelNotifications.map((notification, index) => 
                renderNotificationItem(notification, index, 0.5)
              )}
            </div>
          </div>
        </motion.div>

        {/* Booking & Payment */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="space-y-4">
            <div className="px-2">
              <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Booking & Payment</h3>
            </div>
            
            <div className="space-y-3">
              {bookingNotifications.map((notification, index) => 
                renderNotificationItem(notification, index, 0.7)
              )}
            </div>
          </div>
        </motion.div>

        {/* Marketing & Promotions */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <div className="space-y-4">
            <div className="px-2">
              <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Marketing & Promotions</h3>
            </div>
            
            <div className="space-y-3">
              {marketingNotifications.map((notification, index) => 
                renderNotificationItem(notification, index, 0.9)
              )}
            </div>
          </div>
        </motion.div>

        {/* Social & Reviews */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
        >
          <div className="space-y-4">
            <div className="px-2">
              <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Social & Reviews</h3>
            </div>
            
            <div className="space-y-3">
              {socialNotifications.map((notification, index) => 
                renderNotificationItem(notification, index, 1.1)
              )}
            </div>
          </div>
        </motion.div>

        {/* Do Not Disturb */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
        >
          <div className="space-y-4">
            <div className="px-2">
              <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Do Not Disturb</h3>
            </div>
            
            <div className="space-y-3">
              {doNotDisturbSettings.map((setting, index) => 
                renderNotificationItem(setting, index, 1.3)
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