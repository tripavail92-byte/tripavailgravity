/**
 * Hotel Manager Settings Page
 * 
 * Business account settings for hotel properties, payments, and policies
 */

import { 
  DollarSign, Building, CreditCard, Bell, BarChart3, 
  Shield, Clock, ChevronRight, AlertTriangle
} from 'lucide-react';
import { GlassCard, GlassBadge } from '@/components/ui/glass';
import { Button } from '@/components/ui/button';

interface SettingsCategory {
  id: string;
  title: string;
  description: string;
  icon: typeof DollarSign;
  hasWarning: boolean;
  badge: string | null;
  badgeVariant: 'primary' | 'info' | 'light' | 'warning';
  screen: string;
}

const settingsCategories: SettingsCategory[] = [
  {
    id: 'pricing',
    title: 'Pricing & Discounts',
    description: 'Manage room rates, seasonal pricing, and promotional discounts',
    icon: DollarSign,
    hasWarning: false,
    badge: null,
    badgeVariant: 'primary',
    screen: 'pricing-settings'
  },
  {
    id: 'business',
    title: 'Business Information',
    description: 'Update your hotel name, address, contact details, and business profile',
    icon: Building,
    hasWarning: false,
    badge: null,
    badgeVariant: 'primary',
    screen: 'business-info'
  },
  {
    id: 'payment',
    title: 'Payment Methods',
    description: 'Configure payment gateways and banking information for earnings',
    icon: CreditCard,
    hasWarning: true, // Bank details might not be complete
    badge: null,
    badgeVariant: 'primary',
    screen: 'payment-settings'
  },
  {
    id: 'cancellation',
    title: 'Cancellation Policy',
    description: 'Set your cancellation terms and refund policies for guests',
    icon: Clock,
    hasWarning: false,
    badge: 'Flexible',
    badgeVariant: 'info',
    screen: 'cancellation-policy'
  },
  {
    id: 'notifications',
    title: 'Notifications',
    description: 'Control booking alerts, messages, and communication preferences',
    icon: Bell,
    hasWarning: false,
    badge: '8 Active',
    badgeVariant: 'primary',
    screen: 'notifications-settings'
  },
  {
    id: 'analytics',
    title: 'Analytics & Reports',
    description: 'View booking trends, occupancy rates, and revenue analytics',
    icon: BarChart3,
    hasWarning: false,
    badge: null,
    badgeVariant: 'light',
    screen: 'analytics'
  },
  {
    id: 'security',
    title: 'Security & Access',
    description: 'Manage staff access, login security, and account protection',
    icon: Shield,
    hasWarning: false,
    badge: null,
    badgeVariant: 'primary',
    screen: 'security-settings'
  }
];

export default function HotelManagerSettingsPage() {
  const handleNavigate = (screen: string) => {
    console.log('Navigate to:', screen);
    // Implement navigation logic here
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-xl font-semibold text-gray-900 mb-1">
            Hotel Settings
          </h1>
          <p className="text-sm text-gray-600">
            Manage your property listings, payments, and business preferences
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
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
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <category.icon size={24} className="text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {category.title}
                      </h3>
                      {category.hasWarning && (
                        <AlertTriangle size={16} className="text-purple-600 flex-shrink-0" />
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
          transition={{ delay: 0.7 }}
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
              <ChevronRight size={24} className="text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Partner Support
              </h3>
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                Our partnership team is available 24/7 to help you maximize your hotel's potential on TripAvail.
              </p>
              <Button 
                variant="outline" 
                size="sm"
                className="w-full sm:w-auto"
                onClick={() => handleNavigate('support')}
              >
                Get Help
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
            Partner Agreement
          </Button>
          <Button 
            variant="ghost" 
            className="w-full justify-center text-gray-600 hover:text-gray-900"
          >
            Commission Terms
          </Button>
          <Button 
            variant="ghost" 
            className="w-full justify-center text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            Suspend Listings
          </Button>
        </div>
      </div>
    </div>
  );
}
