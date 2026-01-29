import { motion } from 'motion/react';
import { User, Bell, Shield, Globe } from 'lucide-react';
import { Card } from '../../../components/ui/card';
import type { UserRole } from '../../../lib/types';

interface SettingsScreenProps {
  role: UserRole;
  onNavigate: (screen: string) => void;
}

export default function SettingsScreen({ role, onNavigate }: SettingsScreenProps) {
  const settingsSections = [
    { id: 'profile', title: 'Profile Settings', icon: User, description: 'Manage your personal information' },
    { id: 'notifications', title: 'Notifications', icon: Bell, description: 'Configure your notification preferences' },
    { id: 'privacy', title: 'Privacy & Security', icon: Shield, description: 'Control your privacy settings' },
    { id: 'language', title: 'Language & Region', icon: Globe, description: 'Set your language and location' }
  ];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="text-xl font-semibold text-gray-900 dark:text-foreground mb-4">Account Settings</h2>
        
        {settingsSections.map((section, index) => (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
          >
            <Card className="p-4 mb-4 cursor-pointer hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                  <section.icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-foreground">{section.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-muted-foreground">{section.description}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}