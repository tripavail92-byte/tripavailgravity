import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { Card } from '../../../components/ui/card';
import { Switch } from '../../../components/ui/switch';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Slider } from '../../../components/ui/slider';

// Import our modern app preference icons
import {
  ModernAppPreferencesIcon,
  ModernDarkModeIcon,
  ModernHighContrastIcon,
  ModernReducedMotionIcon,
  ModernLargeTextIcon,
  ModernSoundEffectsIcon,
  ModernHapticFeedbackIcon,
  ModernVolumeLevelIcon,
  ModernAutoSyncIcon,
  ModernOfflineModeIcon,
  ModernWiFiOnlyIcon,
  ModernBackgroundRefreshIcon,
  ModernAutoDownloadMapsIcon,
  ModernLanguageIcon,
  ModernCurrencyIcon,
  ModernDateFormatIcon,
  ModernTimeFormatIcon,
  ModernImageQualityIcon,
  ModernAnimationSpeedIcon,
  ModernBatteryOptimizationIcon,
  ModernDataCompressionIcon,
  ModernStorageIcon,
  ModernClearCacheIcon,
  ModernResetDefaultsIcon
} from '../../../components/icons/profile/ModernAppPreferenceIcons';

interface AppPreferencesScreenProps {
  onNavigate: (screen: string) => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export default function AppPreferencesScreen({ onNavigate, isDarkMode = false, onToggleDarkMode }: AppPreferencesScreenProps) {
  const [preferences, setPreferences] = useState({
    // Appearance (darkMode is now controlled by parent via props)
    highContrast: false,
    reducedMotion: false,
    largeText: false,
    colorTheme: 'teal', // teal, blue, purple, green
    
    // Audio & Haptics
    soundEffects: true,
    hapticFeedback: true,
    volumeLevel: 75,
    
    // Data & Sync
    autoSync: true,
    offlineMode: false,
    wifiOnlySync: true,
    backgroundRefresh: true,
    autoDownloadMaps: false,
    
    // Language & Region
    language: 'English',
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12-hour',
    temperatureUnit: 'Celsius',
    distanceUnit: 'Kilometers',
    
    // Performance
    imageQuality: 'high', // low, medium, high
    animationSpeed: 'normal', // slow, normal, fast
    batteryOptimization: false,
    dataCompression: true,
    
    // Storage
    cacheSize: 512, // MB
    autoCleanup: true,
    offlineMapStorage: 1024 // MB
  });

  const [storageInfo] = useState({
    totalUsed: 2.1, // GB
    photos: 1.2,
    maps: 0.6,
    cache: 0.2,
    other: 0.1
  });

  const appearanceOptions = [
    {
      id: 'highContrast',
      title: 'High Contrast',
      description: 'Increase contrast for better visibility',
      icon: ModernHighContrastIcon,
      type: 'toggle'
    },
    {
      id: 'reducedMotion',
      title: 'Reduced Motion',
      description: 'Minimize animations and transitions',
      icon: ModernReducedMotionIcon,
      type: 'toggle'
    },
    {
      id: 'largeText',
      title: 'Large Text',
      description: 'Increase text size for better readability',
      icon: ModernLargeTextIcon,
      type: 'toggle'
    }
  ];

  const audioOptions = [
    {
      id: 'soundEffects',
      title: 'Sound Effects',
      description: 'Play sounds for interactions and notifications',
      icon: ModernSoundEffectsIcon,
      type: 'toggle'
    },
    {
      id: 'hapticFeedback',
      title: 'Haptic Feedback',
      description: 'Feel vibrations for button presses and gestures',
      icon: ModernHapticFeedbackIcon,
      type: 'toggle'
    }
  ];

  const dataOptions = [
    {
      id: 'autoSync',
      title: 'Auto Sync',
      description: 'Automatically sync data when online',
      icon: ModernAutoSyncIcon,
      type: 'toggle'
    },
    {
      id: 'offlineMode',
      title: 'Offline Mode',
      description: 'Save data for offline access',
      icon: ModernOfflineModeIcon,
      type: 'toggle'
    },
    {
      id: 'wifiOnlySync',
      title: 'Wi-Fi Only Sync',
      description: 'Only sync when connected to Wi-Fi',
      icon: ModernWiFiOnlyIcon,
      type: 'toggle'
    },
    {
      id: 'backgroundRefresh',
      title: 'Background Refresh',
      description: 'Allow app to refresh content in background',
      icon: ModernBackgroundRefreshIcon,
      type: 'toggle'
    },
    {
      id: 'autoDownloadMaps',
      title: 'Auto Download Maps',
      description: 'Automatically download maps for your trips',
      icon: ModernAutoDownloadMapsIcon,
      type: 'toggle'
    }
  ];

  const languageOptions = [
    {
      id: 'language',
      title: 'Language',
      value: preferences.language,
      icon: ModernLanguageIcon,
      options: ['English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Arabic', 'Chinese', 'Japanese']
    },
    {
      id: 'currency',
      title: 'Currency',
      value: preferences.currency,
      icon: ModernCurrencyIcon,
      options: ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'PKR', 'INR']
    },
    {
      id: 'dateFormat',
      title: 'Date Format',
      value: preferences.dateFormat,
      icon: ModernDateFormatIcon,
      options: ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD']
    },
    {
      id: 'timeFormat',
      title: 'Time Format',
      value: preferences.timeFormat,
      icon: ModernTimeFormatIcon,
      options: ['12-hour', '24-hour']
    }
  ];

  const performanceOptions = [
    {
      id: 'imageQuality',
      title: 'Image Quality',
      value: preferences.imageQuality,
      icon: ModernImageQualityIcon,
      options: ['Low', 'Medium', 'High'],
      type: 'select'
    },
    {
      id: 'animationSpeed',
      title: 'Animation Speed',
      value: preferences.animationSpeed,
      icon: ModernAnimationSpeedIcon,
      options: ['Slow', 'Normal', 'Fast'],
      type: 'select'
    },
    {
      id: 'batteryOptimization',
      title: 'Battery Optimization',
      description: 'Reduce battery usage by limiting background activity',
      icon: ModernBatteryOptimizationIcon,
      type: 'toggle'
    },
    {
      id: 'dataCompression',
      title: 'Data Compression',
      description: 'Compress data to reduce bandwidth usage',
      icon: ModernDataCompressionIcon,
      type: 'toggle'
    }
  ];

  const togglePreference = (key: string) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const updatePreference = (key: string, value: any) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const clearCache = () => {
    console.log('Clearing cache...');
  };

  const resetToDefaults = () => {
    console.log('Resetting to defaults...');
  };

  const renderPreferenceItem = (item: any, index: number, delay: number) => (
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
            <div className="font-medium text-gray-900 dark:text-foreground text-sm mb-1">{item.title}</div>
            {item.description && (
              <div className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{item.description}</div>
            )}
          </div>
          
          <div className="flex-shrink-0 ml-3">
            {item.type === 'toggle' ? (
              <motion.div whileTap={{ scale: 0.95 }}>
                <Switch
                  checked={preferences[item.id]}
                  onCheckedChange={() => togglePreference(item.id)}
                  className="data-[state=checked]:bg-primary"
                />
              </motion.div>
            ) : (
              <Badge className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-0 text-xs">
                {item.value || item.options?.[0]}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderSelectItem = (item: any, index: number, delay: number) => (
    <motion.div
      key={item.id}
      className="p-3 bg-white dark:bg-card rounded-xl border border-gray-100 dark:border-gray-800"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: delay + index * 0.05 }}
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center shadow-sm">
          <item.icon size={18} className="text-gray-900 dark:text-white" />
        </div>
        <div className="font-medium text-gray-900 dark:text-foreground text-sm">{item.title}</div>
      </div>
      <Badge className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-0 text-xs">
        {item.value}
      </Badge>
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
              <h2 className="text-xl font-semibold text-gray-900 dark:text-foreground">App Preferences</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Customize your app experience and behavior</p>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-8">
        {/* Preferences Overview */}
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
                    <ModernAppPreferencesIcon size={24} className="text-white" />
                  </div>
                  <h3 className="text-lg font-semibold">App Overview</h3>
                </div>
                <Badge className="bg-white/20 hover:bg-white/30 text-white border-0">
                  {isDarkMode ? 'Dark' : 'Light'} Mode
                </Badge>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold mb-1">{preferences.language}</div>
                  <div className="text-xs text-gray-300">Language</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold mb-1">{preferences.currency}</div>
                  <div className="text-xs text-gray-300">Currency</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold mb-1">{storageInfo.totalUsed}GB</div>
                  <div className="text-xs text-gray-300">Storage Used</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold mb-1">{preferences.volumeLevel}%</div>
                  <div className="text-xs text-gray-300">Volume</div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Appearance & Accessibility */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="space-y-4">
            <div className="px-2">
              <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Appearance & Accessibility</h3>
            </div>
            
            <div className="space-y-3">
              {/* Dark Mode Toggle - Controlled by parent */}
              {onToggleDarkMode && (
                <motion.div
                  className="flex items-center p-3 bg-white dark:bg-card rounded-xl border border-gray-100 dark:border-gray-800"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                    <ModernDarkModeIcon size={20} className="text-gray-900 dark:text-white" />
                  </div>
                  
                  <div className="flex-1 min-w-0 ml-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 dark:text-foreground text-sm mb-1">Dark Mode</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">Use dark theme throughout the app</div>
                      </div>
                      
                      <div className="flex-shrink-0 ml-3">
                        <motion.div whileTap={{ scale: 0.95 }}>
                          <Switch
                            checked={isDarkMode}
                            onCheckedChange={onToggleDarkMode}
                            className="data-[state=checked]:bg-primary"
                          />
                        </motion.div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              
              {/* Other appearance options */}
              {appearanceOptions.map((option, index) => 
                renderPreferenceItem(option, index, 0.35)
              )}
            </div>
          </div>
        </motion.div>

        {/* Audio & Haptics */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="space-y-4">
            <div className="px-2">
              <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Audio & Haptics</h3>
            </div>
            
            <div className="space-y-3">
              {audioOptions.map((option, index) => 
                renderPreferenceItem(option, index, 0.5)
              )}

              {/* Volume Slider */}
              <motion.div
                className="p-3 bg-white dark:bg-card rounded-xl border border-gray-100 dark:border-gray-800"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center shadow-sm">
                      <ModernVolumeLevelIcon size={20} className="text-gray-900 dark:text-white" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-foreground text-sm">Volume Level</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Adjust the overall volume for app sounds</div>
                    </div>
                  </div>
                  <Badge className="bg-primary/10 text-primary border-0 text-xs">
                    {preferences.volumeLevel}%
                  </Badge>
                </div>
                <Slider
                  value={[preferences.volumeLevel]}
                  onValueChange={([value]) => updatePreference('volumeLevel', value)}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Data & Synchronization */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="space-y-4">
            <div className="px-2">
              <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Data & Synchronization</h3>
            </div>
            
            <div className="space-y-3">
              {dataOptions.map((option, index) => 
                renderPreferenceItem(option, index, 0.7)
              )}
            </div>
          </div>
        </motion.div>

        {/* Language & Region */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <div className="space-y-4">
            <div className="px-2">
              <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Language & Region</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {languageOptions.map((option, index) => 
                renderSelectItem(option, index, 0.9)
              )}
            </div>
          </div>
        </motion.div>

        {/* Performance & Quality */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
        >
          <div className="space-y-4">
            <div className="px-2">
              <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Performance & Quality</h3>
            </div>
            
            <div className="space-y-3">
              {performanceOptions.map((option, index) => 
                option.type === 'select' 
                  ? renderSelectItem(option, index, 1.1)
                  : renderPreferenceItem(option, index, 1.1)
              )}
            </div>
          </div>
        </motion.div>

        {/* Storage Management */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
        >
          <div className="space-y-4">
            <div className="px-2">
              <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Storage Management</h3>
            </div>

            <Card className="p-4 bg-white dark:bg-card border-0 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center shadow-sm">
                    <ModernStorageIcon size={20} className="text-gray-900 dark:text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-foreground text-sm">Storage Usage</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Manage app storage and cached data</p>
                  </div>
                </div>
                <Badge className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-0 text-xs">
                  {storageInfo.totalUsed}GB Used
                </Badge>
              </div>

              <div className="space-y-3 mb-4">
                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Photos & Media</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-foreground">{storageInfo.photos}GB</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full" 
                      style={{ width: `${(storageInfo.photos / storageInfo.totalUsed) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Offline Maps</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-foreground">{storageInfo.maps}GB</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${(storageInfo.maps / storageInfo.totalUsed) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Cache & Temp Files</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-foreground">{storageInfo.cache}GB</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-amber-500 h-2 rounded-full" 
                      style={{ width: `${(storageInfo.cache / storageInfo.totalUsed) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <motion.button
                  onClick={clearCache}
                  className="flex items-center justify-center gap-3 p-3 bg-amber-600 hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-800 text-white rounded-xl transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <ModernClearCacheIcon size={18} />
                  <span className="text-sm font-medium">Clear Cache</span>
                </motion.button>

                <motion.button
                  onClick={resetToDefaults}
                  className="flex items-center justify-center gap-3 p-3 bg-gray-600 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-800 text-white rounded-xl transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <ModernResetDefaultsIcon size={18} />
                  <span className="text-sm font-medium">Reset to Defaults</span>
                </motion.button>
              </div>
            </Card>
          </div>
        </motion.div>

        {/* Additional spacing for bottom navigation */}
        <div className="h-20"></div>
      </div>
    </div>
  );
}