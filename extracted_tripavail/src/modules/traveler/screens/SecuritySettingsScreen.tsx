import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Switch } from '../../../components/ui/switch';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { WarningIcon } from '../../../components/icons/profile/AccountSettingsIcons';
import { 
  ModernPasswordIcon, 
  ModernPhoneVerifyIcon, 
  ModernTwoFactorIcon, 
  ModernBiometricIcon, 
  ModernSecurityEmailIcon, 
  ModernLoginAlertsIcon, 
  ModernDeviceTrackingIcon, 
  ModernSessionTimeoutIcon,
  ModernSignOutAllIcon,
  ModernDeleteDataIcon,
  ModernDeleteAccountIcon
} from '../../../components/icons/profile/ModernSecurityIcons';

interface SecuritySettingsScreenProps {
  onNavigate: (screen: string) => void;
}

export default function SecuritySettingsScreen({ onNavigate }: SecuritySettingsScreenProps) {
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: true,
    biometricLogin: false,
    emailNotifications: true,
    loginAlerts: true,
    deviceTracking: true,
    sessionTimeout: true
  });

  const quickActions = [
    {
      id: 'change-password',
      title: 'Change Password',
      description: 'Update your account password',
      icon: ModernPasswordIcon,
      urgent: false,
      action: () => console.log('Change password')
    },
    {
      id: 'verify-phone',
      title: 'Verify Phone Number',
      description: 'Complete phone verification',
      icon: ModernPhoneVerifyIcon,
      urgent: true,
      action: () => console.log('Verify phone')
    }
  ];

  const authenticationOptions = [
    {
      id: 'twoFactorAuth',
      title: 'Two-Factor Authentication',
      description: 'Add an extra layer of security to your account',
      icon: ModernTwoFactorIcon,
      enabled: securitySettings.twoFactorAuth,
      recommended: true
    },
    {
      id: 'biometricLogin',
      title: 'Biometric Login',
      description: 'Use fingerprint or face ID to sign in',
      icon: ModernBiometricIcon,
      enabled: securitySettings.biometricLogin,
      recommended: true
    }
  ];

  const monitoringOptions = [
    {
      id: 'emailNotifications',
      title: 'Security Email Alerts',
      description: 'Get notified of important security events',
      icon: ModernSecurityEmailIcon,
      enabled: securitySettings.emailNotifications,
      recommended: false
    },
    {
      id: 'loginAlerts',
      title: 'Login Notifications',
      description: 'Alert when someone signs into your account',
      icon: ModernLoginAlertsIcon,
      enabled: securitySettings.loginAlerts,
      recommended: true
    },
    {
      id: 'deviceTracking',
      title: 'Device Tracking',
      description: 'Monitor devices that access your account',
      icon: ModernDeviceTrackingIcon,
      enabled: securitySettings.deviceTracking,
      recommended: false
    },
    {
      id: 'sessionTimeout',
      title: 'Session Timeout',
      description: 'Automatically sign out after inactivity',
      icon: ModernSessionTimeoutIcon,
      enabled: securitySettings.sessionTimeout,
      recommended: true
    }
  ];

  const dangerZoneActions = [
    {
      id: 'clear-sessions',
      title: 'Sign Out All Devices',
      description: 'Sign out from all devices except this one',
      icon: ModernSignOutAllIcon,
      action: () => console.log('Clear sessions')
    },
    {
      id: 'delete-data',
      title: 'Delete All Data',
      description: 'Permanently remove all your personal data',
      icon: ModernDeleteDataIcon,
      action: () => console.log('Delete data')
    },
    {
      id: 'delete-account',
      title: 'Delete Account',
      description: 'Permanently delete your TripAvail account',
      icon: ModernDeleteAccountIcon,
      action: () => console.log('Delete account')
    }
  ];

  const toggleSetting = (key: string) => {
    setSecuritySettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const calculateSecurityScore = () => {
    const scores = {
      twoFactor: securitySettings.twoFactorAuth ? 30 : 0,
      biometric: securitySettings.biometricLogin ? 20 : 0,
      alerts: securitySettings.loginAlerts ? 20 : 0,
      timeout: securitySettings.sessionTimeout ? 15 : 0,
      base: 15 // Base score for having an account
    };
    
    return Object.values(scores).reduce((total, score) => total + score, 0);
  };

  const securityScore = calculateSecurityScore();

  const renderSecurityItem = (item: any, index: number, delay: number) => (
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
              checked={item.enabled}
              onCheckedChange={() => toggleSetting(item.id)}
              className="data-[state=checked]:bg-primary"
            />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );

  const renderActionItem = (item: any, index: number, delay: number) => (
    <motion.button
      key={item.id}
      onClick={item.action}
      className="w-full flex items-center p-3 bg-white dark:bg-card rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: delay + index * 0.05 }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
        <item.icon size={20} className="text-gray-900 dark:text-white" />
      </div>
      
      <div className="flex-1 min-w-0 ml-3 text-left">
        <div className="font-medium text-gray-900 dark:text-foreground text-sm">{item.title}</div>
        <div className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{item.description}</div>
      </div>
      
      <div className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors flex-shrink-0 ml-3">
        <ArrowLeft className="w-4 h-4 rotate-180" />
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
              <h2 className="text-xl font-semibold text-gray-900 dark:text-foreground">Security & Privacy</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Protect your account and manage privacy settings</p>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-8">
        {/* Security Score Overview */}
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
                    <ModernTwoFactorIcon size={24} className="text-white" />
                  </div>
                  <h3 className="text-lg font-semibold">Security Score</h3>
                </div>
                <Badge className="bg-white/20 hover:bg-white/30 text-white border-0">
                  {securityScore >= 85 ? 'Strong' : securityScore >= 60 ? 'Good' : 'Weak'}
                </Badge>
              </div>
              
              <div className="mb-4">
                <div className="text-3xl font-bold mb-2">{securityScore}%</div>
                <p className="text-sm text-gray-300 leading-relaxed">
                  {securityScore >= 85 
                    ? 'Your account is well protected!' 
                    : 'Enable more security features to improve your score.'
                  }
                </p>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {securitySettings.twoFactorAuth && (
                  <Badge className="bg-white/20 text-white border-0 text-xs">2FA Enabled</Badge>
                )}
                <Badge className="bg-white/20 text-white border-0 text-xs">Email Verified</Badge>
                <Badge className="bg-white/20 text-white border-0 text-xs">Strong Password</Badge>
                {securitySettings.biometricLogin && (
                  <Badge className="bg-white/20 text-white border-0 text-xs">Biometric</Badge>
                )}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Action Required */}
        {quickActions.some(action => action.urgent) && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="space-y-4">
              <div className="px-2">
                <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action Required</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {quickActions.map((action, index) => (
                  <motion.button
                    key={action.id}
                    onClick={action.action}
                    className={`p-4 rounded-xl border transition-all group ${
                      action.urgent 
                        ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20' 
                        : 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10 hover:bg-amber-100 dark:hover:bg-amber-900/20'
                    }`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center shadow-sm">
                        <action.icon size={22} className="text-gray-900 dark:text-white" />
                      </div>
                      <div className="text-left">
                        <div className={`font-medium ${
                          action.urgent ? 'text-red-900 dark:text-red-300' : 'text-amber-900 dark:text-amber-300'
                        }`}>
                          {action.title}
                        </div>
                        <div className={`text-xs ${
                          action.urgent ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'
                        }`}>
                          {action.description}
                        </div>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Authentication */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="space-y-4">
            <div className="px-2">
              <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Authentication</h3>
            </div>
            
            <div className="space-y-3">
              {authenticationOptions.map((option, index) => 
                renderSecurityItem(option, index, 0.5)
              )}
            </div>
          </div>
        </motion.div>

        {/* Security Monitoring */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="space-y-4">
            <div className="px-2">
              <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Security Monitoring</h3>
            </div>
            
            <div className="space-y-3">
              {monitoringOptions.map((option, index) => 
                renderSecurityItem(option, index, 0.7)
              )}
            </div>
          </div>
        </motion.div>

        {/* Danger Zone */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <div className="space-y-4">
            <div className="px-2">
              <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Danger Zone</h3>
            </div>

            <Alert className="mx-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30">
              <WarningIcon size={16} className="text-red-600 dark:text-red-400" />
              <AlertDescription className="text-red-700 dark:text-red-300 text-sm">
                These actions cannot be undone. Please proceed with extreme caution.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-3">
              {dangerZoneActions.map((action, index) => (
                <motion.button
                  key={action.id}
                  onClick={action.action}
                  className="w-full flex items-center p-3 bg-red-50 dark:bg-red-900/10 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors group border border-red-200 dark:border-red-800"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9 + index * 0.05 }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                    <action.icon size={20} className="text-gray-900 dark:text-white" />
                  </div>
                  
                  <div className="flex-1 min-w-0 ml-3 text-left">
                    <div className="font-medium text-red-900 dark:text-red-300 text-sm">{action.title}</div>
                    <div className="text-xs text-red-600 dark:text-red-400 leading-relaxed">{action.description}</div>
                  </div>
                  
                  <div className="text-red-400 group-hover:text-red-600 dark:group-hover:text-red-300 transition-colors flex-shrink-0 ml-3">
                    <ArrowLeft className="w-4 h-4 rotate-180" />
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Additional spacing for bottom navigation */}
        <div className="h-20"></div>
      </div>
    </div>
  );
}