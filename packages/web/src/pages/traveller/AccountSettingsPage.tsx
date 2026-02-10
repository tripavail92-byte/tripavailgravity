/**
 * Account Settings Page - LIVE VERSION
 * 
 * Comprehensive control center for account management, security, and privacy
 * Features: Live settings sync, notification toggles, privacy controls, theme management
 */

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Shield, Bell, Eye, Settings, Moon, Sun, Globe,
  HelpCircle, ChevronRight, Loader2
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { GlassCard } from '@/components/ui/glass';
import { Button } from '@/components/ui/button';
import { accountSettingsService, type AccountSettings } from '@/services/accountSettingsService';
import toast from 'react-hot-toast';

export default function AccountSettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<AccountSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'notifications' | 'privacy' | 'preferences' | 'security'>('overview');
  const [isSaving, setIsSaving] = useState(false);

  // Load settings on mount
  useEffect(() => {
    if (user?.id) {
      loadSettings();
    }
  }, [user?.id]);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const data = await accountSettingsService.getSettings(user!.id);
      setSettings(data);
    } catch (error) {
      console.error('Failed to load settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (
    key: keyof AccountSettings,
    value: boolean | string
  ) => {
    if (!user?.id || !settings) return;

    try {
      setIsSaving(true);
      const updated = await accountSettingsService.updateSettings(user.id, {
        [key]: value
      });
      setSettings(updated);
    } catch (error) {
      console.error('Failed to update setting:', error);
      loadSettings(); // Reload to get correct value
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !settings) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const notificationCount = [
    settings.email_notifications_enabled,
    settings.booking_reminders,
    settings.push_notifications_enabled,
  ].filter(Boolean).length;

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

      {/* Tabs */}
      <div className="sticky top-16 z-10 bg-white/80 backdrop-blur-lg border-b border-gray-100 px-4">
        <div className="max-w-3xl mx-auto flex gap-2 overflow-x-auto py-3">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'notifications', label: 'Notifications' },
            { id: 'privacy', label: 'Privacy' },
            { id: 'preferences', label: 'Preferences' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap text-sm font-medium transition ${
                activeTab === tab.id
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              <GlassCard variant="card" className="p-4 rounded-2xl">
                <div className="flex items-center gap-3 mb-2">
                  <Shield className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-gray-900">Security</h3>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  {settings.two_factor_enabled ? '✓ 2FA Enabled' : '⚠ 2FA Disabled'}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setActiveTab('security')}
                  className="w-full"
                >
                  Manage
                </Button>
              </GlassCard>

              <GlassCard variant="card" className="p-4 rounded-2xl">
                <div className="flex items-center gap-3 mb-2">
                  <Bell className="w-5 h-5 text-orange-500" />
                  <h3 className="font-semibold text-gray-900">Notifications</h3>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  {notificationCount} active
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setActiveTab('notifications')}
                  className="w-full"
                >
                  Manage
                </Button>
              </GlassCard>
            </motion.div>

            {/* All Settings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4 mt-6">
                All Settings
              </h2>
              <div className="space-y-3">
                <SettingItem
                  icon={Bell}
                  title="Notification Preferences"
                  description="Control how you receive notifications"
                  onClick={() => setActiveTab('notifications')}
                />
                <SettingItem
                  icon={Eye}
                  title="Privacy Controls"
                  description="Manage who can see your profile"
                  onClick={() => setActiveTab('privacy')}
                />
                <SettingItem
                  icon={Settings}
                  title="App Preferences"
                  description="Theme, language, and other settings"
                  onClick={() => setActiveTab('preferences')}
                />
              </div>
            </motion.div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <GlassCard variant="card" className="rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Email Notifications
              </h2>
              <div className="space-y-4">
                <ToggleSetting
                  label="All Email Notifications"
                  description="Enable/disable all email notifications"
                  enabled={settings.email_notifications_enabled}
                  onChange={(value) => handleToggle('email_notifications_enabled', value)}
                  disabled={isSaving}
                />
                {settings.email_notifications_enabled && (
                  <>
                    <ToggleSetting
                      label="Booking Reminders"
                      description="Get reminded about your upcoming trips"
                      enabled={settings.booking_reminders}
                      onChange={(value) => handleToggle('booking_reminders', value)}
                      disabled={isSaving}
                    />
                    <ToggleSetting
                      label="Marketing Emails"
                      description="Receive updates about new features and deals"
                      enabled={settings.marketing_emails}
                      onChange={(value) => handleToggle('marketing_emails', value)}
                      disabled={isSaving}
                    />
                  </>
                )}
              </div>
            </GlassCard>

            <GlassCard variant="card" className="rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Other Notifications
              </h2>
              <div className="space-y-4">
                <ToggleSetting
                  label="Push Notifications"
                  description="Enable notifications in your browser"
                  enabled={settings.push_notifications_enabled}
                  onChange={(value) => handleToggle('push_notifications_enabled', value)}
                  disabled={isSaving}
                />
                <ToggleSetting
                  label="SMS Notifications"
                  description="Receive SMS for urgent updates"
                  enabled={settings.sms_notifications_enabled}
                  onChange={(value) => handleToggle('sms_notifications_enabled', value)}
                  disabled={isSaving}
                />
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Privacy Tab */}
        {activeTab === 'privacy' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <GlassCard variant="card" className="rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Privacy Settings
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-900 block mb-2">
                    Profile Visibility
                  </label>
                  <select
                    value={settings.profile_visibility}
                    onChange={(e) => handleToggle('profile_visibility', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="public">Public - Anyone can see your profile</option>
                    <option value="friends_only">Friends Only - Only your friends can see</option>
                    <option value="private">Private - Only you can see your profile</option>
                  </select>
                </div>

                <ToggleSetting
                  label="Show Activity Status"
                  description="Let others see when you're online"
                  enabled={settings.show_activity}
                  onChange={(value) => handleToggle('show_activity', value)}
                  disabled={isSaving}
                />

                <ToggleSetting
                  label="Allow Messages from Anyone"
                  description="Accept messages from non-friends"
                  enabled={settings.allow_messages_from_anyone}
                  onChange={(value) => handleToggle('allow_messages_from_anyone', value)}
                  disabled={isSaving}
                />

                <ToggleSetting
                  label="Share Location with Hosts"
                  description="Allow hosts to see your location during trips"
                  enabled={settings.share_location_with_hosts}
                  onChange={(value) => handleToggle('share_location_with_hosts', value)}
                  disabled={isSaving}
                />
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Preferences Tab */}
        {activeTab === 'preferences' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <GlassCard variant="card" className="rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                App Preferences
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-900 block mb-2">
                    Theme
                  </label>
                  <div className="flex gap-3">
                    {['light', 'dark', 'auto'].map((theme) => (
                      <button
                        key={theme}
                        onClick={() => handleToggle('theme', theme)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition ${
                          settings.theme === theme
                            ? 'border-primary bg-primary/5'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {theme === 'light' && <Sun className="w-4 h-4" />}
                        {theme === 'dark' && <Moon className="w-4 h-4" />}
                        {theme === 'auto' && <Globe className="w-4 h-4" />}
                        {theme.charAt(0).toUpperCase() + theme.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-900 block mb-2">
                    Language
                  </label>
                  <select
                    value={settings.language}
                    onChange={(e) => handleToggle('language', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="ur">Urdu</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-900 block mb-2">
                    Currency
                  </label>
                  <select
                    value={settings.currency}
                    onChange={(e) => handleToggle('currency', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="PKR">PKR (₨)</option>
                    <option value="INR">INR (₹)</option>
                  </select>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Support Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8"
        >
          <GlassCard variant="light" className="rounded-2xl p-6">
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
                <Button variant="outline" size="sm" className="w-full sm:w-auto">
                  Contact Support
                </Button>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Account Actions */}
        <div className="pt-8 space-y-3 border-t border-gray-200 mt-8">
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

// Helper component: Toggle Setting
function ToggleSetting({
  label,
  description,
  enabled,
  onChange,
  disabled = false
}: {
  label: string;
  description: string;
  enabled: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start justify-between p-4 bg-gray-50/50 rounded-lg">
      <div>
        <h3 className="font-medium text-gray-900">{label}</h3>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
      </div>
      <button
        onClick={() => onChange(!enabled)}
        disabled={disabled}
        className={`ml-4 flex-shrink-0 relative inline-flex h-6 w-11 items-center rounded-full transition ${
          enabled ? 'bg-primary' : 'bg-gray-300'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span
          className={`inline-block h-4 w-4 transform bg-white rounded-full transition ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

// Helper component: Setting Item
function SettingItem({
  icon: Icon,
  title,
  description,
  onClick
}: {
  icon: typeof Bell;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full p-4 bg-white rounded-lg hover:bg-gray-50 transition border border-gray-200 flex items-start justify-between group"
    >
      <div className="flex items-start gap-3 text-left">
        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-medium text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        </div>
      </div>
      <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
    </button>
  );
}
