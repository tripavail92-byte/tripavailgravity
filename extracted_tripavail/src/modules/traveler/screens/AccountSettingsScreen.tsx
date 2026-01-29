import { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import { Card } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { 
  SecurityIcon, 
  AccountInfoIcon, 
  NotificationsIcon, 
  PrivacyIcon, 
  AppPreferencesIcon,
  SupportIcon,
  WarningIcon
} from '../../../components/icons/profile/AccountSettingsIcons';

interface AccountSettingsScreenProps {
  onNavigate: (screen: string) => void;
}

export default function AccountSettingsScreen({ onNavigate }: AccountSettingsScreenProps) {
  const settingsCategories = [
    {
      id: 'security',
      title: 'Security & Privacy',
      description: 'Manage your account security, authentication, and privacy settings',
      icon: SecurityIcon,
      hasWarning: true,
      badge: null,
      badgeColor: '',
      screen: 'security-settings'
    },
    {
      id: 'account',
      title: 'Account Information',
      description: 'Update your personal details, contact info, and verification status',
      icon: AccountInfoIcon,
      hasWarning: true,
      badge: null,
      badgeColor: '',
      screen: 'account-info'
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Control what notifications you receive and how you get them',
      icon: NotificationsIcon,
      hasWarning: false,
      badge: '4 Active',
      badgeColor: 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary',
      screen: 'notifications-settings'
    },
    {
      id: 'privacy',
      title: 'Privacy Controls',
      description: 'Manage data sharing, visibility, and location tracking preferences',
      icon: PrivacyIcon,
      hasWarning: false,
      badge: 'Profile Public',
      badgeColor: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300',
      screen: 'privacy-settings'
    },
    {
      id: 'preferences',
      title: 'App Preferences',
      description: 'Customize your app experience, theme, and feature settings',
      icon: AppPreferencesIcon,
      hasWarning: false,
      badge: 'Light Mode',
      badgeColor: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
      screen: 'app-preferences'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-card border-b border-gray-200 dark:border-border">
        <div className="px-6 py-4">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onNavigate('home')}
              className="text-gray-600 dark:text-muted-foreground -ml-2"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-foreground">Account Settings</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">Manage your account security and preferences</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">



        {/* Settings Categories */}
        <div className="space-y-4">
          {settingsCategories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-white dark:bg-card border-0 shadow-sm">
                <motion.button
                  onClick={() => onNavigate(category.screen)}
                  className="w-full p-6 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      {/* Title row with icon and badge */}
                      <div className="flex items-center gap-3 mb-2">
                        <category.icon size={20} className="" />
                        <div className="font-semibold text-gray-900 dark:text-foreground">{category.title}</div>
                        <div className="flex items-center gap-2 ml-auto">
                          {category.hasWarning && (
                            <WarningIcon size={16} className="text-primary dark:text-primary" />
                          )}
                          {category.badge && (
                            <Badge className={`${category.badgeColor} border-0 text-xs font-medium`}>
                              {category.badge}
                            </Badge>
                          )}
                        </div>
                      </div>
                      {/* Description */}
                      <div className="text-sm text-gray-600 dark:text-gray-400 pl-8">{category.description}</div>
                    </div>
                    
                    <div className="flex items-center gap-3 ml-4">
                      <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    </div>
                  </div>
                </motion.button>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Support Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-6 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center shadow-sm">
                <SupportIcon size={24} className="" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-foreground mb-1">Need Help?</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Our support team is here to help you with any account or settings questions.
                </p>
                <Button
                  onClick={() => onNavigate('help')}
                  className="bg-primary hover:bg-primary/90 text-white text-sm"
                  size="sm"
                >
                  Contact Support
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Additional spacing for bottom navigation */}
        <div className="h-20"></div>
      </div>
    </div>
  );
}