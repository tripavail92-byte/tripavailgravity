import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { Card } from '../../../components/ui/card';
import { Switch } from '../../../components/ui/switch';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Alert, AlertDescription } from '../../../components/ui/alert';

// Import our modern privacy icons
import {
  ModernPrivacyScoreIcon,
  ModernProfileVisibilityIcon,
  ModernRealNameIcon,
  ModernLocationIcon,
  ModernTravelHistoryIcon,
  ModernPublicReviewsIcon,
  ModernLocationTrackingIcon,
  ModernAnalyticsDataIcon,
  ModernCrashReportsIcon,
  ModernPersonalizedAdsIcon,
  ModernPartnerDataSharingIcon,
  ModernFriendRequestsIcon,
  ModernActivityVisibilityIcon,
  ModernTravelStatusSharingIcon,
  ModernPhotoTaggingIcon,
  ModernEssentialCookiesIcon,
  ModernFunctionalCookiesIcon,
  ModernAnalyticsTrackingIcon,
  ModernAdvertisingTrackingIcon,
  ModernDataDownloadIcon,
  ModernDataDeletionIcon
} from '../../../components/icons/profile/ModernPrivacyIcons';

interface PrivacySettingsScreenProps {
  onNavigate: (screen: string) => void;
}

export default function PrivacySettingsScreen({ onNavigate }: PrivacySettingsScreenProps) {
  const [privacySettings, setPrivacySettings] = useState({
    // Profile Privacy
    profileVisibility: 'public', // public, friends, private
    showRealName: true,
    showLocation: true,
    showTravelHistory: false,
    showReviews: true,
    
    // Data Collection
    locationTracking: true,
    analyticsData: true,
    crashReports: true,
    personalizedAds: false,
    dataSharingPartners: false,
    
    // Social Features
    friendRequests: true,
    activityVisibility: 'friends', // public, friends, private
    travelStatusSharing: false,
    photoTagging: true,
    
    // Cookies & Tracking
    essentialCookies: true,
    functionalCookies: true,
    analyticsTracking: false,
    advertisingTracking: false,
    
    // Communication Privacy
    contactVisibility: 'friends',
    messageRequests: 'everyone', // everyone, friends, none
    emailVisibility: false,
    phoneVisibility: false
  });

  const [downloadingData, setDownloadingData] = useState(false);
  const [deletingData, setDeletingData] = useState(false);

  const profilePrivacyOptions = [
    {
      id: 'profileVisibility',
      title: 'Profile Visibility',
      description: 'Control who can see your profile information',
      icon: ModernProfileVisibilityIcon,
      type: 'select',
      currentValue: privacySettings.profileVisibility
    },
    {
      id: 'showRealName',
      title: 'Show Real Name',
      description: 'Display your real name on your profile',
      icon: ModernRealNameIcon,
      type: 'toggle'
    },
    {
      id: 'showLocation',
      title: 'Show Location',
      description: 'Share your current location with others',
      icon: ModernLocationIcon,
      type: 'toggle'
    },
    {
      id: 'showTravelHistory',
      title: 'Travel History',
      description: 'Allow others to see places you\'ve visited',
      icon: ModernTravelHistoryIcon,
      type: 'toggle'
    },
    {
      id: 'showReviews',
      title: 'Public Reviews',
      description: 'Make your reviews visible to other travelers',
      icon: ModernPublicReviewsIcon,
      type: 'toggle'
    }
  ];

  const dataCollectionOptions = [
    {
      id: 'locationTracking',
      title: 'Location Tracking',
      description: 'Allow app to track your location for better recommendations',
      icon: ModernLocationTrackingIcon,
      type: 'toggle',
      required: false
    },
    {
      id: 'analyticsData',
      title: 'Analytics Data',
      description: 'Share anonymized usage data to help improve the app',
      icon: ModernAnalyticsDataIcon,
      type: 'toggle',
      required: false
    },
    {
      id: 'crashReports',
      title: 'Crash Reports',
      description: 'Automatically send crash reports to help fix bugs',
      icon: ModernCrashReportsIcon,
      type: 'toggle',
      required: false
    },
    {
      id: 'personalizedAds',
      title: 'Personalized Ads',
      description: 'Show ads based on your interests and travel preferences',
      icon: ModernPersonalizedAdsIcon,
      type: 'toggle',
      required: false
    },
    {
      id: 'dataSharingPartners',
      title: 'Partner Data Sharing',
      description: 'Share data with trusted travel partners for better deals',
      icon: ModernPartnerDataSharingIcon,
      type: 'toggle',
      required: false
    }
  ];

  const socialPrivacyOptions = [
    {
      id: 'friendRequests',
      title: 'Friend Requests',
      description: 'Allow others to send you friend requests',
      icon: ModernFriendRequestsIcon,
      type: 'toggle'
    },
    {
      id: 'activityVisibility',
      title: 'Activity Visibility',
      description: 'Control who can see your travel activity',
      icon: ModernActivityVisibilityIcon,
      type: 'select',
      currentValue: privacySettings.activityVisibility
    },
    {
      id: 'travelStatusSharing',
      title: 'Travel Status Sharing',
      description: 'Share when you\'re traveling with friends',
      icon: ModernTravelStatusSharingIcon,
      type: 'toggle'
    },
    {
      id: 'photoTagging',
      title: 'Photo Tagging',
      description: 'Allow friends to tag you in photos',
      icon: ModernPhotoTaggingIcon,
      type: 'toggle'
    }
  ];

  const cookieOptions = [
    {
      id: 'essentialCookies',
      title: 'Essential Cookies',
      description: 'Required for the app to function properly',
      icon: ModernEssentialCookiesIcon,
      type: 'toggle',
      required: true
    },
    {
      id: 'functionalCookies',
      title: 'Functional Cookies',
      description: 'Remember your preferences and settings',
      icon: ModernFunctionalCookiesIcon,
      type: 'toggle',
      required: false
    },
    {
      id: 'analyticsTracking',
      title: 'Analytics Tracking',
      description: 'Help us understand how you use the app',
      icon: ModernAnalyticsTrackingIcon,
      type: 'toggle',
      required: false
    },
    {
      id: 'advertisingTracking',
      title: 'Advertising Tracking',
      description: 'Track your activity for personalized ads',
      icon: ModernAdvertisingTrackingIcon,
      type: 'toggle',
      required: false
    }
  ];

  const dataRightsOptions = [
    {
      id: 'downloadData',
      title: 'Download My Data',
      description: 'Get a copy of all your personal data',
      icon: ModernDataDownloadIcon,
      action: 'download'
    },
    {
      id: 'deleteData',
      title: 'Delete My Data',
      description: 'Permanently delete your account and data',
      icon: ModernDataDeletionIcon,
      action: 'delete'
    }
  ];

  const toggleSetting = (key: string) => {
    setPrivacySettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleDataDownload = async () => {
    setDownloadingData(true);
    // Simulate API call
    setTimeout(() => {
      setDownloadingData(false);
      console.log('Data download initiated');
    }, 2000);
  };

  const handleDataDeletion = async () => {
    setDeletingData(true);
    // Simulate API call
    setTimeout(() => {
      setDeletingData(false);
      console.log('Data deletion requested');
    }, 2000);
  };

  const calculatePrivacyScore = () => {
    const scores = {
      overall: 85,
      profile: privacySettings.profileVisibility === 'private' ? 100 : 75,
      dataControl: privacySettings.personalizedAds ? 60 : 90,
      sharing: privacySettings.dataSharingPartners ? 70 : 95
    };
    return scores;
  };

  const privacyScores = calculatePrivacyScore();

  const renderPrivacyItem = (item: any, index: number, delay: number) => (
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
              {item.required && (
                <Badge className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-0 text-xs px-2 py-0.5 flex-shrink-0">
                  Required
                </Badge>
              )}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{item.description}</div>
          </div>
          
          <div className="flex-shrink-0 ml-3">
            {item.type === 'toggle' ? (
              <motion.div whileTap={{ scale: 0.95 }}>
                <Switch
                  checked={privacySettings[item.id]}
                  onCheckedChange={() => toggleSetting(item.id)}
                  disabled={item.required}
                  className="data-[state=checked]:bg-primary"
                />
              </motion.div>
            ) : item.type === 'select' ? (
              <Badge className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-0 text-xs">
                {item.currentValue?.charAt(0).toUpperCase() + item.currentValue?.slice(1)}
              </Badge>
            ) : null}
          </div>
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
              <h2 className="text-xl font-semibold text-gray-900 dark:text-foreground">Privacy Controls</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Manage your privacy and data sharing preferences</p>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-8">
        {/* Privacy Score Overview */}
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
                    <ModernPrivacyScoreIcon size={24} className="text-white" />
                  </div>
                  <h3 className="text-lg font-semibold">Privacy Score</h3>
                </div>
                <Badge className="bg-white/20 hover:bg-white/30 text-white border-0">
                  Strong
                </Badge>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold mb-1">{privacyScores.overall}%</div>
                  <div className="text-xs text-gray-300">Overall Score</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold mb-1">{privacyScores.profile}%</div>
                  <div className="text-xs text-gray-300">Profile Privacy</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold mb-1">{privacyScores.dataControl}%</div>
                  <div className="text-xs text-gray-300">Data Control</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold mb-1">{privacyScores.sharing}%</div>
                  <div className="text-xs text-gray-300">Sharing</div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Profile Privacy */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="space-y-4">
            <div className="px-2">
              <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Profile Privacy</h3>
            </div>
            
            <div className="space-y-3">
              {profilePrivacyOptions.map((option, index) => 
                renderPrivacyItem(option, index, 0.3)
              )}
            </div>
          </div>
        </motion.div>

        {/* Data Collection */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="space-y-4">
            <div className="px-2">
              <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Data Collection</h3>
            </div>
            
            <div className="space-y-3">
              {dataCollectionOptions.map((option, index) => 
                renderPrivacyItem(option, index, 0.5)
              )}
            </div>
          </div>
        </motion.div>

        {/* Social Privacy */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="space-y-4">
            <div className="px-2">
              <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Social Privacy</h3>
            </div>
            
            <div className="space-y-3">
              {socialPrivacyOptions.map((option, index) => 
                renderPrivacyItem(option, index, 0.7)
              )}
            </div>
          </div>
        </motion.div>

        {/* Cookies & Tracking */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <div className="space-y-4">
            <div className="px-2">
              <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cookies & Tracking</h3>
            </div>
            
            <div className="space-y-3">
              {cookieOptions.map((option, index) => 
                renderPrivacyItem(option, index, 0.9)
              )}
            </div>
          </div>
        </motion.div>

        {/* Your Data Rights */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
        >
          <div className="space-y-4">
            <div className="px-2">
              <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Your Data Rights</h3>
            </div>

            <Alert className="mx-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30">
              <ModernPrivacyScoreIcon size={16} className="text-blue-600 dark:text-blue-400" />
              <AlertDescription className="text-blue-700 dark:text-blue-300 text-sm">
                You have the right to access, correct, download, or delete your personal data at any time.
              </AlertDescription>
            </Alert>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <motion.button
                onClick={handleDataDownload}
                disabled={downloadingData}
                className="flex items-center justify-center gap-3 p-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl transition-colors disabled:opacity-50"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <ModernDataDownloadIcon size={20} />
                <span className="text-sm font-medium">{downloadingData ? 'Preparing...' : 'Download My Data'}</span>
              </motion.button>

              <motion.button
                onClick={handleDataDeletion}
                disabled={deletingData}
                className="flex items-center justify-center gap-3 p-4 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white rounded-xl transition-colors disabled:opacity-50"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <ModernDataDeletionIcon size={20} />
                <span className="text-sm font-medium">{deletingData ? 'Processing...' : 'Delete My Data'}</span>
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Additional spacing for bottom navigation */}
        <div className="h-20"></div>
      </div>
    </div>
  );
}