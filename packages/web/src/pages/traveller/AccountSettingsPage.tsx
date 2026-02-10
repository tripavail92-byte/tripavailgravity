/**
 * Account Settings Page
 * 
 * Comprehensive control center for account management, security, and privacy
 * Features: Security warnings, notification preferences, privacy controls
 */

import { 
  Shield, User, Bell, Eye, Settings, 
  HelpCircle, ChevronRight, AlertTriangle
} from 'lucide-react';
import { GlassCard, GlassBadge } from '@/components/ui/glass';
import { Button } from '@/components/ui/button';

interface SettingsCategory {
  id: string;
  title: string;
  description: string;
  icon: typeof Shield;
  hasWarning: boolean;
  badge: string | null;
  badgeVariant: 'primary' | 'info' | 'light';
  screen: string;
}

const settingsCategories: SettingsCategory[] = [
  {
    id: 'security',
    title: 'Security & Privacy',
    description: 'Manage your account security, authentication, and privacy settings',
    icon: Shield,
    hasWarning: true, // 2FA not enabled
    badge: null,
    badgeVariant: 'primary',
    screen: 'security-settings'
  },
  {
    id: 'account',
    title: 'Account Information',
    description: 'Update your personal details, contact info, and verification status',
    icon: User,
    hasWarning: true, // Profile incomplete
    badge: null,
    badgeVariant: 'primary',
    screen: 'account-info'
  },
  {
    id: 'notifications',
    title: 'Notifications',
    description: 'Control what notifications you receive and how you get them',
    icon: Bell,
    hasWarning: false,
    badge: '4 Active',
    badgeVariant: 'primary',
    screen: 'notifications-settings'
  },
  {
    id: 'privacy',
    title: 'Privacy Controls',
    description: 'Manage data sharing, visibility, and location tracking preferences',
    icon: Eye,
    hasWarning: false,
    badge: 'Profile Public',
    badgeVariant: 'info',
    screen: 'privacy-settings'
  },
  {
    id: 'preferences',
    title: 'App Preferences',
    description: 'Customize your app experience, theme, and feature settings',
    icon: Settings,
    hasWarning: false,
    badge: 'Light Mode',
    badgeVariant: 'light',
    screen: 'app-preferences'
  }
];

export default function AccountSettingsPage() {
  const handleNavigate = (screen: string) => {
    console.log('Navigate to:', screen);
    // Implement navigation logic here
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <h1 className="text-xl font-semibold text-gray-900 mb-1">
            Account Settings
          </h1>
          <p className="text-sm text-gray-600">
            Manage your account security and preferences
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {/* Settings Categories */}
        {settingsCategories.map((category, index) => (
          <GlassCard
            key={category.id}
            variant="card"
            className="rounded-2xl overflow-hidden cursor-pointer"
            interactive
            asMotion
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => handleNavigate(category.screen)}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                {/* Icon & Title */}
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <category.icon size={24} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {category.title}
                      </h3>
                      {category.hasWarning && (
                        <AlertTriangle size={16} className="text-primary flex-shrink-0" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Badge & Chevron */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  {category.badge && (
                    <GlassBadge variant={category.badgeVariant} size="sm">
                      {category.badge}
                    </GlassBadge>
                  )}
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-600 leading-relaxed pl-16">
                {category.description}
              </p>
            </div>
          </GlassCard>
        ))}

        {/* Support Section */}
        <GlassCard
          variant="light"
          className="rounded-2xl p-6"
          asMotion
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
              <HelpCircle size={24} className="text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Need Help?
              </h3>
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                Our support team is here to help you with any account or settings questions.
              </p>
              <Button 
                variant="outline" 
                size="sm"
                className="w-full sm:w-auto"
                onClick={() => handleNavigate('help')}
              >
                Contact Support
              </Button>
            </div>
          </div>
        </GlassCard>

        {/* Account Actions */}
        <div className="pt-4 space-y-3">
          <Button 
            variant="ghost" 
            className="w-full justify-center text-gray-600 hover:text-gray-900"
          >
            Terms of Service
          </Button>
          <Button 
            variant="ghost" 
            className="w-full justify-center text-gray-600 hover:text-gray-900"
          >
            Privacy Policy
          </Button>
          <Button 
            variant="ghost" 
            className="w-full justify-center text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            Delete Account
          </Button>
        </div>
      </div>
    </div>
  );
}
