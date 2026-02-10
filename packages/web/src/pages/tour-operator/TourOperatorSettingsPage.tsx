/**
 * Tour Operator Settings Page
 * 
 * Business account settings for tour operations, payments, and tour management
 */

import { 
  Compass, Building, CreditCard, Bell, TrendingUp, 
  Shield, Calendar, ChevronRight, AlertTriangle
} from 'lucide-react';
import { GlassCard, GlassBadge } from '@/components/ui/glass';
import { Button } from '@/components/ui/button';

interface SettingsCategory {
  id: string;
  title: string;
  description: string;
  icon: typeof Compass;
  hasWarning: boolean;
  badge: string | null;
  badgeVariant: 'primary' | 'info' | 'light' | 'warning';
  screen: string;
}

const settingsCategories: SettingsCategory[] = [
  {
    id: 'tours',
    title: 'Tour Pricing & Discounts',
    description: 'Manage tour rates, seasonal pricing, and promotional discounts',
    icon: Compass,
    hasWarning: false,
    badge: null,
    badgeVariant: 'primary',
    screen: 'tour-pricing'
  },
  {
    id: 'business',
    title: 'Business Information',
    description: 'Update your company name, address, contact details, and tour expertise areas',
    icon: Building,
    hasWarning: false,
    badge: null,
    badgeVariant: 'primary',
    screen: 'business-info'
  },
  {
    id: 'payment',
    title: 'Payment & Earnings',
    description: 'Configure payment methods, commission structure, and payout settings',
    icon: CreditCard,
    hasWarning: true, // Bank details might not be complete
    badge: null,
    badgeVariant: 'primary',
    screen: 'payment-settings'
  },
  {
    id: 'cancellation',
    title: 'Cancellation & Refund Policy',
    description: 'Set refund terms, cancellation deadlines, and traveler protection policies',
    icon: Calendar,
    hasWarning: false,
    badge: 'Flexible',
    badgeVariant: 'info',
    screen: 'cancellation-policy'
  },
  {
    id: 'notifications',
    title: 'Notifications',
    description: 'Booking alerts, traveler messages, and communication preferences',
    icon: Bell,
    hasWarning: false,
    badge: '6 Active',
    badgeVariant: 'primary',
    screen: 'notifications-settings'
  },
  {
    id: 'analytics',
    title: 'Tour Analytics',
    description: 'View booking trends, occupancy rates, tour ratings, and revenue insights',
    icon: TrendingUp,
    hasWarning: false,
    badge: null,
    badgeVariant: 'light',
    screen: 'analytics'
  },
  {
    id: 'security',
    title: 'Security & Team Access',
    description: 'Manage staff accounts, two-factor authentication, and account security',
    icon: Shield,
    hasWarning: false,
    badge: null,
    badgeVariant: 'primary',
    screen: 'security-settings'
  }
];

export default function TourOperatorSettingsPage() {
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
            Tour Operator Settings
          </h1>
          <p className="text-sm text-gray-600">
            Manage your tours, team, payments, and business preferences
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
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <category.icon size={24} className="text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {category.title}
                      </h3>
                      {category.hasWarning && (
                        <AlertTriangle size={16} className="text-blue-600 flex-shrink-0" />
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
            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center flex-shrink-0">
              <ChevronRight size={24} className="text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Partner Success Team
              </h3>
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                Get dedicated support to grow your tour business and maximize your earnings on TripAvail.
              </p>
              <Button 
                variant="outline" 
                size="sm"
                className="w-full sm:w-auto"
                onClick={() => handleNavigate('support')}
              >
                Contact Partner Manager
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
            Commission & Fees
          </Button>
          <Button 
            variant="ghost" 
            className="w-full justify-center text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            Pause Tour Bookings
          </Button>
        </div>
      </div>
    </div>
  );
}
