/**
 * Hotel Manager Settings Page - LIVE VERSION
 *
 * Business account settings for hotel properties, payments, and policies
 * Real-time data persistence via hotelManagerSettingsService
 */

import {
  AlertTriangle,
  BarChart3,
  Bell,
  Building,
  ChevronRight,
  Clock,
  CreditCard,
  DollarSign,
  Loader,
  Shield,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

import { Button } from '@/components/ui/button'
import { GlassBadge, GlassCard } from '@/components/ui/glass'
import { useAuth } from '@/hooks/useAuth'
import { hotelManagerSettingsService } from '@/services/hotelManagerSettingsService'

interface HotelManagerSettings {
  business_name?: string
  base_price_per_night?: number
  currency?: string
  cancellation_policy?: string
  booking_notifications?: boolean
  messaging_notifications?: boolean
  review_notifications?: boolean
  payment_notifications?: boolean
  track_analytics?: boolean
  two_factor_enabled?: boolean
  [key: string]: any
}

interface SettingsCategory {
  id: string
  title: string
  description: string
  icon: typeof DollarSign
  hasWarning: boolean
  badge: string | null
  badgeVariant: 'primary' | 'info' | 'light' | 'warning'
  screen: string
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
    screen: 'pricing-settings',
  },
  {
    id: 'business',
    title: 'Business Information',
    description: 'Update your hotel name, address, contact details, and business profile',
    icon: Building,
    hasWarning: false,
    badge: null,
    badgeVariant: 'primary',
    screen: 'business-info',
  },
  {
    id: 'payment',
    title: 'Payment Methods',
    description: 'Configure payment gateways and banking information for earnings',
    icon: CreditCard,
    hasWarning: true, // Bank details might not be complete
    badge: null,
    badgeVariant: 'primary',
    screen: 'payment-settings',
  },
  {
    id: 'cancellation',
    title: 'Cancellation Policy',
    description: 'Set your cancellation terms and refund policies for guests',
    icon: Clock,
    hasWarning: false,
    badge: 'Flexible',
    badgeVariant: 'info',
    screen: 'cancellation-policy',
  },
  {
    id: 'notifications',
    title: 'Notifications',
    description: 'Control booking alerts, messages, and communication preferences',
    icon: Bell,
    hasWarning: false,
    badge: '8 Active',
    badgeVariant: 'primary',
    screen: 'notifications-settings',
  },
  {
    id: 'analytics',
    title: 'Analytics & Reports',
    description: 'View booking trends, occupancy rates, and revenue analytics',
    icon: BarChart3,
    hasWarning: false,
    badge: null,
    badgeVariant: 'light',
    screen: 'analytics',
  },
  {
    id: 'security',
    title: 'Security & Access',
    description: 'Manage staff access, login security, and account protection',
    icon: Shield,
    hasWarning: false,
    badge: null,
    badgeVariant: 'primary',
    screen: 'security-settings',
  },
]

export default function HotelManagerSettingsPage() {
  const { user } = useAuth()
  const [settings, setSettings] = useState<HotelManagerSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (user?.id) {
      loadSettings()
    }
  }, [user?.id])

  const loadSettings = async () => {
    try {
      setIsLoading(true)
      const data = await hotelManagerSettingsService.getSettings(user!.id)
      setSettings(data)
    } catch (error) {
      console.error('Failed to load settings:', error)
      toast.error('Failed to load settings')
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggle = async (key: string, value: boolean) => {
    if (!settings) return

    try {
      setIsSaving(true)
      const updated = await hotelManagerSettingsService.updateSettings(user!.id, {
        [key]: value,
      })
      setSettings(updated)
      toast.success(`${key.replace(/_/g, ' ')} ${value ? 'enabled' : 'disabled'}`)
    } catch (error) {
      console.error('Failed to update setting:', error)
      toast.error('Failed to update setting')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSuspendListings = async () => {
    try {
      setIsSaving(true)
      await hotelManagerSettingsService.suspendListings(user!.id)
      toast.success('Listings suspended')
      await loadSettings()
    } catch (error) {
      console.error('Failed to suspend listings:', error)
      toast.error('Failed to suspend listings')
    } finally {
      setIsSaving(false)
    }
  }

  const handleResumeListings = async () => {
    try {
      setIsSaving(true)
      await hotelManagerSettingsService.resumeListings(user!.id)
      toast.success('Listings resumed')
      await loadSettings()
    } catch (error) {
      console.error('Failed to resume listings:', error)
      toast.error('Failed to resume listings')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }

  const notificationBadgeCount = [
    settings?.booking_notifications,
    settings?.messaging_notifications,
    settings?.review_notifications,
    settings?.payment_notifications,
  ].filter(Boolean).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-xl font-semibold text-foreground mb-1">
            Hotel Settings{settings?.business_name && ` - ${settings.business_name}`}
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your property listings, payments, and business preferences
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {/* Quick Settings Overview */}
        <div className="grid grid-cols-2 gap-3">
          <GlassCard variant="light" className="rounded-xl p-4">
            <div className="text-xs text-muted-foreground mb-1">Base Price</div>
            <div className="text-lg font-semibold text-foreground">
              {settings?.currency} {settings?.base_price_per_night?.toFixed(2) || '0.00'}/night
            </div>
          </GlassCard>
          <GlassCard variant="light" className="rounded-xl p-4">
            <div className="text-xs text-muted-foreground mb-1">Notifications Active</div>
            <div className="text-lg font-semibold text-foreground">{notificationBadgeCount}</div>
          </GlassCard>
        </div>

        {/* Notification Toggles */}
        <GlassCard variant="card" className="rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Bell size={20} className="text-primary" />
            Notification Preferences
          </h2>
          <div className="space-y-3">
            <ToggleSetting
              label="Booking Notifications"
              description="Get notified about new bookings"
              enabled={settings?.booking_notifications || false}
              onChange={(value) => handleToggle('booking_notifications', value)}
              disabled={isSaving}
            />
            <ToggleSetting
              label="Messaging Notifications"
              description="Get notified about guest messages"
              enabled={settings?.messaging_notifications || false}
              onChange={(value) => handleToggle('messaging_notifications', value)}
              disabled={isSaving}
            />
            <ToggleSetting
              label="Review Notifications"
              description="Get notified about guest reviews"
              enabled={settings?.review_notifications || false}
              onChange={(value) => handleToggle('review_notifications', value)}
              disabled={isSaving}
            />
            <ToggleSetting
              label="Payment Notifications"
              description="Get notified about payouts and payments"
              enabled={settings?.payment_notifications || false}
              onChange={(value) => handleToggle('payment_notifications', value)}
              disabled={isSaving}
            />
          </div>
        </GlassCard>

        {/* Analytics & Policies */}
        <GlassCard variant="card" className="rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <BarChart3 size={20} className="text-primary" />
            Analytics & Policies
          </h2>
          <div className="space-y-3">
            <ToggleSetting
              label="Track Analytics"
              description="Enable analytics and performance reports"
              enabled={settings?.track_analytics || false}
              onChange={(value) => handleToggle('track_analytics', value)}
              disabled={isSaving}
            />
            <div className="pt-3 border-t border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Cancellation Policy</p>
                  <p className="text-sm text-muted-foreground">
                    {settings?.cancellation_policy || 'Flexible'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Security */}
        <GlassCard variant="card" className="rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Shield size={20} className="text-primary" />
            Security
          </h2>
          <ToggleSetting
            label="Two-Factor Authentication"
            description="Add an extra layer of security to your account"
            enabled={settings?.two_factor_enabled || false}
            onChange={(value) => handleToggle('two_factor_enabled', value)}
            disabled={isSaving}
          />
        </GlassCard>

        {/* Category Cards */}
        <div className="pt-4">
          <h2 className="text-lg font-semibold text-foreground mb-3">Settings Sections</h2>
          {settingsCategories.map((category, index) => (
            <GlassCard
              key={category.id}
              variant="card"
              className="rounded-2xl overflow-hidden cursor-pointer mb-2"
              interactive
              asMotion
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <category.icon size={24} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-foreground">{category.title}</h3>
                        {category.hasWarning && (
                          <AlertTriangle size={16} className="text-primary flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {category.badge && (
                      <GlassBadge variant={category.badgeVariant} size="sm">
                        {category.badge}
                      </GlassBadge>
                    )}
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed pl-16">
                  {category.description}
                </p>
              </div>
            </GlassCard>
          ))}
        </div>

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
            <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
              <ChevronRight size={24} className="text-accent" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-foreground mb-2">Partner Support</h3>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                Our partnership team is available 24/7 to help you maximize your hotel's potential
                on TripAvail.
              </p>
              <Button variant="outline" size="sm" className="w-full sm:w-auto" disabled={isSaving}>
                Get Help
              </Button>
            </div>
          </div>
        </GlassCard>

        {/* Account Actions */}
        <div className="pt-4 space-y-3">
          <Button
            variant="ghost"
            className="w-full justify-center text-muted-foreground hover:text-foreground"
            disabled={isSaving}
          >
            Partner Agreement
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-center text-muted-foreground hover:text-foreground"
            disabled={isSaving}
          >
            Commission Terms
          </Button>
          <Button
            variant="outline"
            className="w-full justify-center text-destructive border-destructive/20 hover:bg-destructive/10"
            disabled={isSaving}
            onClick={handleSuspendListings}
          >
            Suspend Listings
          </Button>
          {isSaving && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader className="w-4 h-4 animate-spin" />
              Saving...
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Helper component
interface ToggleSetting {
  label: string
  description: string
  enabled: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
}

function ToggleSetting({ label, description, enabled, onChange, disabled }: ToggleSetting) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors">
      <div>
        <p className="font-medium text-foreground">{label}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <button
        onClick={() => onChange(!enabled)}
        disabled={disabled}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          enabled ? 'bg-primary' : 'bg-muted-foreground/30'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <div
          className={`absolute top-1 w-4 h-4 rounded-full bg-background transition-transform ${
            enabled ? 'right-1' : 'left-1'
          }`}
        />
      </button>
    </div>
  )
}
