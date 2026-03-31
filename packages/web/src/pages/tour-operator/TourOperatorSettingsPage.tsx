/**
 * Tour Operator Settings Page - LIVE VERSION
 *
 * Business account settings for tour operations, payments, and tour management
 * Real-time data persistence via tourOperatorSettingsService
 */

import {
  AlertTriangle,
  Bell,
  Building,
  Calendar,
  ChevronRight,
  Compass,
  CreditCard,
  Loader,
  Plus,
  Save,
  Shield,
  Trash2,
  TrendingUp,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Link, useLocation } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { GlassBadge, GlassCard } from '@/components/ui/glass'
import { FleetGuidesSection } from './components/FleetGuidesSection'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/PageHeader'
import { Textarea } from '@/components/ui/textarea'
import {
  tourOperatorService,
  type OperatorPublicProfileEditorData,
} from '@/features/tour-operator/services/tourOperatorService'
import type {
  OperatorFleetAsset,
  OperatorGalleryItem,
  OperatorGuideProfile,
} from '@/features/tour-operator/types/operatorProfile'
import { useAuth } from '@/hooks/useAuth'
import { tourOperatorSettingsService } from '@/services/tourOperatorSettingsService'

interface TourOperatorSettings {
  business_name?: string
  base_tour_price?: number
  currency?: string
  max_group_size?: number
  pause_bookings?: boolean
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
  icon: typeof Compass
  hasWarning: boolean
  badge: string | null
  badgeVariant: 'primary' | 'info' | 'light' | 'warning'
  href: string
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
    href: '/operator/settings',
  },
  {
    id: 'business',
    title: 'Business Information',
    description: 'Update your company name, address, contact details, and tour expertise areas',
    icon: Building,
    hasWarning: false,
    badge: null,
    badgeVariant: 'primary',
    href: '/operator-dashboard/business-profile',
  },
  {
    id: 'payment',
    title: 'Payment & Earnings',
    description: 'Configure payment methods, commission structure, and payout settings',
    icon: CreditCard,
    hasWarning: true,
    badge: null,
    badgeVariant: 'primary',
    href: '/operator/commercial',
  },
  {
    id: 'cancellation',
    title: 'Cancellation & Refund Policy',
    description: 'Set refund terms, cancellation deadlines, and traveler protection policies',
    icon: Calendar,
    hasWarning: false,
    badge: 'Flexible',
    badgeVariant: 'info',
    href: '/operator/settings',
  },
  {
    id: 'notifications',
    title: 'Notifications',
    description: 'Booking alerts, traveler messages, and communication preferences',
    icon: Bell,
    hasWarning: false,
    badge: null,
    badgeVariant: 'primary',
    href: '/operator/settings',
  },
  {
    id: 'analytics',
    title: 'Tour Analytics',
    description: 'View booking trends, occupancy rates, tour ratings, and revenue insights',
    icon: TrendingUp,
    hasWarning: false,
    badge: null,
    badgeVariant: 'light',
    href: '/operator/analytics',
  },
  {
    id: 'security',
    title: 'Security & Team Access',
    description: 'Manage staff accounts, two-factor authentication, and account security',
    icon: Shield,
    hasWarning: false,
    badge: null,
    badgeVariant: 'primary',
    href: '/operator/settings',
  },
]

export default function TourOperatorSettingsPage() {
  const { user } = useAuth()
  const location = useLocation()
  const [settings, setSettings] = useState<TourOperatorSettings | null>(null)
  const [publicProfile, setPublicProfile] = useState<OperatorPublicProfileEditorData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isSavingPublicProfile, setIsSavingPublicProfile] = useState(false)

  const storefrontSection = useMemo<'all' | 'business-profile' | 'fleet-guides'>(() => {
    if (location.pathname === '/operator-dashboard/business-profile') return 'business-profile'
    if (location.pathname === '/operator-dashboard/fleet') return 'fleet-guides'
    return 'all'
  }, [location.pathname])

  useEffect(() => {
    document.documentElement.setAttribute('data-role', 'tour_operator')
    return () => document.documentElement.removeAttribute('data-role')
  }, [])

  useEffect(() => {
    if (user?.id) {
      loadSettings()
    }
  }, [user?.id])

  const loadSettings = async () => {
    try {
      setIsLoading(true)
      const [settingsData, publicProfileData] = await Promise.all([
        tourOperatorSettingsService.getSettings(user!.id),
        tourOperatorService.getPublicProfileEditorData(user!.id),
      ])
      setSettings(settingsData)
      setPublicProfile(publicProfileData)
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
      const updated = await tourOperatorSettingsService.updateSettings(user!.id, {
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

  const handlePauseBookings = async () => {
    try {
      setIsSaving(true)
      await tourOperatorSettingsService.togglePauseBookings(user!.id, true)
      toast.success('Tour bookings paused')
      await loadSettings()
    } catch (error) {
      console.error('Failed to pause bookings:', error)
      toast.error('Failed to pause bookings')
    } finally {
      setIsSaving(false)
    }
  }

  const handleResumeBookings = async () => {
    try {
      setIsSaving(true)
      await tourOperatorSettingsService.togglePauseBookings(user!.id, false)
      toast.success('Tour bookings resumed')
      await loadSettings()
    } catch (error) {
      console.error('Failed to resume bookings:', error)
      toast.error('Failed to resume bookings')
    } finally {
      setIsSaving(false)
    }
  }

  const updatePublicProfileField = <K extends keyof OperatorPublicProfileEditorData>(
    key: K,
    value: OperatorPublicProfileEditorData[K],
  ) => {
    setPublicProfile((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  const updatePolicyField = (key: keyof OperatorPublicProfileEditorData['publicPolicies'], value: string) => {
    setPublicProfile((prev) => (
      prev
        ? { ...prev, publicPolicies: { ...prev.publicPolicies, [key]: value } }
        : prev
    ))
  }

  const updateDocumentLink = (key: keyof OperatorPublicProfileEditorData['verificationUrls'], value: string) => {
    setPublicProfile((prev) => (
      prev
        ? { ...prev, verificationUrls: { ...prev.verificationUrls, [key]: value } }
        : prev
    ))
  }

  const updateFleetAsset = (index: number, updates: Partial<OperatorFleetAsset>) => {
    setPublicProfile((prev) => {
      if (!prev) return prev
      const next = [...prev.fleetAssets]
      next[index] = { ...next[index], ...updates }
      return { ...prev, fleetAssets: next }
    })
  }

  const addFleetAsset = () => {
    setPublicProfile((prev) => (
      prev
        ? {
            ...prev,
            fleetAssets: [...prev.fleetAssets, createEmptyFleetAsset(prev.fleetAssets.length + 1)],
          }
        : prev
    ))
  }

  const removeFleetAsset = (index: number) => {
    setPublicProfile((prev) => (
      prev
        ? { ...prev, fleetAssets: prev.fleetAssets.filter((_, rowIndex) => rowIndex !== index) }
        : prev
    ))
  }

  const updateGuideProfile = (index: number, updates: Partial<OperatorGuideProfile>) => {
    setPublicProfile((prev) => {
      if (!prev) return prev
      const next = [...prev.guideProfiles]
      next[index] = { ...next[index], ...updates }
      return { ...prev, guideProfiles: next }
    })
  }

  const addGuideProfile = () => {
    setPublicProfile((prev) => (
      prev
        ? {
            ...prev,
            guideProfiles: [...prev.guideProfiles, createEmptyGuideProfile(prev.guideProfiles.length + 1)],
          }
        : prev
    ))
  }

  const removeGuideProfile = (index: number) => {
    setPublicProfile((prev) => (
      prev
        ? { ...prev, guideProfiles: prev.guideProfiles.filter((_, rowIndex) => rowIndex !== index) }
        : prev
    ))
  }

  const updateGalleryItem = (index: number, updates: Partial<OperatorGalleryItem>) => {
    setPublicProfile((prev) => {
      if (!prev) return prev
      const next = [...prev.galleryMedia]
      next[index] = { ...next[index], ...updates }
      return { ...prev, galleryMedia: next }
    })
  }

  const addGalleryItem = () => {
    setPublicProfile((prev) => (
      prev
        ? {
            ...prev,
            galleryMedia: [...prev.galleryMedia, createEmptyGalleryItem(prev.galleryMedia.length + 1)],
          }
        : prev
    ))
  }

  const removeGalleryItem = (index: number) => {
    setPublicProfile((prev) => (
      prev
        ? { ...prev, galleryMedia: prev.galleryMedia.filter((_, rowIndex) => rowIndex !== index) }
        : prev
    ))
  }

  const handleSavePublicProfile = async () => {
    if (!user?.id || !publicProfile) return

    try {
      setIsSavingPublicProfile(true)
      await tourOperatorService.updatePublicProfileEditorData(user.id, publicProfile)
      toast.success('Public operator profile updated')
      await loadSettings()
    } catch (error) {
      console.error('Failed to save public profile layer:', error)
      toast.error('Failed to save public operator profile')
    } finally {
      setIsSavingPublicProfile(false)
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
    <div className="min-h-screen relative overflow-hidden bg-background pb-20">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-primary/20 blur-[120px] opacity-60" />
        <div className="absolute bottom-0 right-0 w-[520px] h-[520px] rounded-full bg-violet-500/10 blur-[110px] opacity-60" />
      </div>
      {/* Header */}

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        <PageHeader
          title={
            storefrontSection === 'business-profile'
              ? 'Business Profile'
              : storefrontSection === 'fleet-guides'
                ? 'Fleet & Guides'
                : `Settings${settings?.business_name ? ` – ${settings.business_name}` : ''}`
          }
          subtitle="Manage your tours, team, payments, and business preferences"
          showBackButton={false}
        />
        {storefrontSection === 'all' && (<>
        {/* Quick Settings Overview */}
        <div className="grid grid-cols-2 gap-3">
          <GlassCard variant="card" className="rounded-xl p-4">
            <div className="text-xs text-muted-foreground mb-1">Base Tour Price</div>
            <div className="text-lg font-semibold text-foreground">
              {settings?.currency} {settings?.base_tour_price?.toFixed(2) || '0.00'}
            </div>
          </GlassCard>
          <GlassCard variant="card" className="rounded-xl p-4">
            <div className="text-xs text-muted-foreground mb-1">Max Group Size</div>
            <div className="text-lg font-semibold text-foreground">
              {settings?.max_group_size || '—'} people
            </div>
          </GlassCard>
        </div>

        {/* Booking Status */}
        <GlassCard variant="card" className="rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Calendar size={20} className="text-primary" />
            Booking Status
          </h2>
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <p className="font-medium text-foreground">
                {settings?.pause_bookings ? 'Bookings Paused' : 'Bookings Active'}
              </p>
              <p className="text-sm text-muted-foreground">
                {settings?.pause_bookings
                  ? 'Travelers cannot book your tours'
                  : 'Accepting new bookings'}
              </p>
            </div>
            <Button
              variant={settings?.pause_bookings ? 'outline' : 'ghost'}
              size="sm"
              onClick={settings?.pause_bookings ? handleResumeBookings : handlePauseBookings}
              disabled={isSaving}
            >
              {settings?.pause_bookings ? 'Resume' : 'Pause'}
            </Button>
          </div>
        </GlassCard>

        {/* Notification Toggles */}
        <GlassCard variant="card" className="rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Bell size={20} className="text-primary" />
            Notification Preferences ({notificationBadgeCount} Active)
          </h2>
          <div className="space-y-3">
            <ToggleSetting
              label="Booking Notification"
              description="Get notified about new tour bookings"
              enabled={settings?.booking_notifications || false}
              onChange={(value) => handleToggle('booking_notifications', value)}
              disabled={isSaving}
            />
            <ToggleSetting
              label="Messaging Notification"
              description="Get notified about traveler messages"
              enabled={settings?.messaging_notifications || false}
              onChange={(value) => handleToggle('messaging_notifications', value)}
              disabled={isSaving}
            />
            <ToggleSetting
              label="Review Notification"
              description="Get notified about tour reviews and ratings"
              enabled={settings?.review_notifications || false}
              onChange={(value) => handleToggle('review_notifications', value)}
              disabled={isSaving}
            />
            <ToggleSetting
              label="Payment Notification"
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
            <TrendingUp size={20} className="text-primary" />
            Analytics & Policies
          </h2>
          <div className="space-y-3">
            <ToggleSetting
              label="Track Analytics"
              description="Enable analytics and tour performance reports"
              enabled={settings?.track_analytics || false}
              onChange={(value) => handleToggle('track_analytics', value)}
              disabled={isSaving}
            />
            <div className="pt-3 border-t border-border/60">
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
        </>)}

        {publicProfile ? (
          <GlassCard variant="card" className="rounded-2xl p-6 space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  {storefrontSection === 'business-profile'
                    ? 'Business Profile'
                    : storefrontSection === 'fleet-guides'
                      ? 'Fleet, Guides & Media'
                      : 'Public Operator Storefront'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {storefrontSection === 'business-profile'
                    ? 'Manage your public business identity, trust inputs, and pre-booking policies.'
                    : storefrontSection === 'fleet-guides'
                      ? 'Maintain the fleet, guide, and gallery sections shown on your public operator page.'
                      : 'Maintain the fleet, guide, verification, and policy sections shown on your public operator page.'}
                </p>
              </div>
              <Button onClick={handleSavePublicProfile} disabled={isSavingPublicProfile} className="gap-2">
                {isSavingPublicProfile ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save storefront
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button asChild variant={storefrontSection === 'all' ? 'default' : 'outline'} size="sm">
                <Link to="/operator/settings">All storefront sections</Link>
              </Button>
              <Button asChild variant={storefrontSection === 'business-profile' ? 'default' : 'outline'} size="sm">
                <Link to="/operator-dashboard/business-profile">Business profile</Link>
              </Button>
              <Button asChild variant={storefrontSection === 'fleet-guides' ? 'default' : 'outline'} size="sm">
                <Link to="/operator-dashboard/fleet">Fleet & guides</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link to="/operator-dashboard/public-preview">Public preview</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link to="/operator-dashboard/verification">Verification</Link>
              </Button>
            </div>

            {/* Storefront completeness guidance */}
            {(() => {
              const checks = [
                { key: 'Business name', done: Boolean(publicProfile.businessName?.trim()) },
                { key: 'Public description', done: Boolean(publicProfile.description?.trim()) },
                { key: 'Fleet assets', done: publicProfile.fleetAssets.length > 0 },
                { key: 'Guide team', done: publicProfile.guideProfiles.length > 0 },
                { key: 'Gallery media', done: publicProfile.galleryMedia.length > 0 },
                { key: 'Verification document', done: Object.values(publicProfile.verificationUrls).some((v) => Boolean(v?.trim())) },
                { key: 'Public policies', done: Object.values(publicProfile.publicPolicies).some((v) => Boolean(v?.trim())) },
              ]
              const doneCount = checks.filter((c) => c.done).length
              const total = checks.length
              const pct = Math.round((doneCount / total) * 100)
              const missing = checks.filter((c) => !c.done)
              const barColor = pct === 100 ? 'bg-success' : pct >= 57 ? 'bg-warning' : 'bg-destructive'
              return (
                <div className="rounded-xl border border-border/60 bg-muted/30 p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Profile completeness — {doneCount}/{total} sections</p>
                      <p className="text-xs text-muted-foreground">Completing more sections improves your marketplace ranking and traveler trust.</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-sm font-bold ${pct === 100 ? 'bg-success/15 text-success' : pct >= 57 ? 'bg-warning/15 text-warning' : 'bg-destructive/15 text-destructive'}`}>{pct}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-border overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
                  </div>
                  {missing.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {missing.map((item) => (
                        <span key={item.key} className="rounded-full border border-dashed border-warning/50 bg-warning/10 px-2 py-0.5 text-[11px] font-medium text-warning">
                          + {item.key}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )
            })()}

            {(storefrontSection === 'all' || storefrontSection === 'business-profile') ? (
              <>
            {/* ── Business identity — read-only, sourced from setup wizard ── */}
            <div className="rounded-2xl border border-border/60 bg-muted/20 p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">Business identity</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    These values come from your setup wizard. To change them, return to setup.
                  </p>
                </div>
                <Link
                  to="/operator/setup"
                  className="flex-shrink-0 px-3 py-1.5 rounded-lg border border-border/60 bg-background text-xs font-semibold text-foreground hover:bg-muted transition-colors"
                >
                  Edit in Setup →
                </Link>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {([
                  { label: 'Business name', value: publicProfile.businessName },
                  { label: 'Primary city', value: publicProfile.primaryCity },
                  { label: 'Coverage range', value: publicProfile.coverageRange },
                  { label: 'Years experience', value: publicProfile.yearsExperience },
                  { label: 'Team size', value: publicProfile.teamSize },
                  { label: 'Registration number', value: publicProfile.registrationNumber },
                  { label: 'Support phone', value: publicProfile.phoneNumber },
                  { label: 'Support email', value: publicProfile.email },
                ] as const).map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
                    {value
                      ? <p className="text-sm font-medium text-foreground mt-0.5">{value}</p>
                      : <p className="text-sm italic text-muted-foreground/60 mt-0.5">Not set</p>}
                  </div>
                ))}
                <div className="sm:col-span-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Public description</p>
                  {publicProfile.description
                    ? <p className="text-sm font-medium text-foreground mt-0.5 leading-relaxed">{publicProfile.description}</p>
                    : <p className="text-sm italic text-muted-foreground/60 mt-0.5">Not set</p>}
                </div>
              </div>
            </div>

            <div className="space-y-4 rounded-2xl border border-border/60 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-foreground">Verification documents & trust inputs</h3>
                  <p className="text-sm text-muted-foreground">These links power the public trust section. They do not override admin verification status.</p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Business registration doc URL</p>
                  <Input
                    value={publicProfile.verificationUrls.businessRegistration}
                    onChange={(e) => updateDocumentLink('businessRegistration', e.target.value)}
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Insurance doc URL</p>
                  <Input
                    value={publicProfile.verificationUrls.insurance}
                    onChange={(e) => updateDocumentLink('insurance', e.target.value)}
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Vehicle docs URL</p>
                  <Input
                    value={publicProfile.verificationUrls.vehicleDocs}
                    onChange={(e) => updateDocumentLink('vehicleDocs', e.target.value)}
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Guide license URL</p>
                  <Input
                    value={publicProfile.verificationUrls.guideLicense}
                    onChange={(e) => updateDocumentLink('guideLicense', e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>
              </>
            ) : null}

            {(storefrontSection === 'all' || storefrontSection === 'fleet-guides') ? (
              <FleetGuidesSection
                fleetAssets={publicProfile.fleetAssets}
                guideProfiles={publicProfile.guideProfiles}
                galleryMedia={publicProfile.galleryMedia}
                onUpdateFleet={updateFleetAsset}
                onAddFleet={addFleetAsset}
                onRemoveFleet={removeFleetAsset}
                onUpdateGuide={updateGuideProfile}
                onAddGuide={addGuideProfile}
                onRemoveGuide={removeGuideProfile}
                onUpdateGallery={updateGalleryItem}
                onAddGallery={addGalleryItem}
                onRemoveGallery={removeGalleryItem}
                onSave={handleSavePublicProfile}
                isSaving={isSavingPublicProfile}
              />
            ) : null}
            {false && (
              <>
            <div className="space-y-4 rounded-2xl border border-border/60 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-foreground">Fleet assets</h3>
                  <p className="text-sm text-muted-foreground">List transport or equipment assets you want travelers to inspect before booking.</p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addFleetAsset} className="gap-2">
                  <Plus className="w-4 h-4" /> Add asset
                </Button>
              </div>
              <div className="space-y-4">
                {publicProfile.fleetAssets.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No fleet assets listed yet.</p>
                ) : publicProfile.fleetAssets.map((asset, index) => (
                  <div key={asset.id} className="space-y-4 rounded-2xl border border-border/60 bg-muted/30 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm font-semibold text-foreground">Asset {index + 1}</p>
                      <Button type="button" variant="ghost" size="sm" className="gap-2 text-destructive" onClick={() => removeFleetAsset(index)}>
                        <Trash2 className="w-4 h-4" /> Remove
                      </Button>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      <Input value={asset.type} onChange={(e) => updateFleetAsset(index, { type: e.target.value })} placeholder="Vehicle type" />
                      <Input value={asset.name} onChange={(e) => updateFleetAsset(index, { name: e.target.value })} placeholder="Name / model" />
                      <Input type="number" min={1} value={asset.quantity} onChange={(e) => updateFleetAsset(index, { quantity: Math.max(1, Number(e.target.value || 1)) })} placeholder="Quantity" />
                      <Input type="number" min={1} value={asset.capacity ?? ''} onChange={(e) => updateFleetAsset(index, { capacity: e.target.value ? Math.max(1, Number(e.target.value)) : null })} placeholder="Capacity" />
                    </div>
                    <Textarea rows={2} value={asset.details} onChange={(e) => updateFleetAsset(index, { details: e.target.value })} placeholder="4x4, AC, owned fleet, rooftop carrier, camping equipment, etc." />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4 rounded-2xl border border-border/60 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-foreground">Guide team</h3>
                  <p className="text-sm text-muted-foreground">Highlight languages, specialties, and certifications that improve traveler trust.</p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addGuideProfile} className="gap-2">
                  <Plus className="w-4 h-4" /> Add guide
                </Button>
              </div>
              <div className="space-y-4">
                {publicProfile.guideProfiles.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No guide profiles listed yet.</p>
                ) : publicProfile.guideProfiles.map((guide, index) => (
                  <div key={guide.id} className="space-y-4 rounded-2xl border border-border/60 bg-muted/30 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm font-semibold text-foreground">Guide {index + 1}</p>
                      <Button type="button" variant="ghost" size="sm" className="gap-2 text-destructive" onClick={() => removeGuideProfile(index)}>
                        <Trash2 className="w-4 h-4" /> Remove
                      </Button>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      <Input value={guide.name} onChange={(e) => updateGuideProfile(index, { name: e.target.value })} placeholder="Guide name" />
                      <Input type="number" min={0} value={guide.yearsExperience ?? ''} onChange={(e) => updateGuideProfile(index, { yearsExperience: e.target.value ? Math.max(0, Number(e.target.value)) : null })} placeholder="Years experience" />
                      <Input value={guide.languages.join(', ')} onChange={(e) => updateGuideProfile(index, { languages: splitCommaValues(e.target.value) })} placeholder="Languages" />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <Input value={guide.specialties.join(', ')} onChange={(e) => updateGuideProfile(index, { specialties: splitCommaValues(e.target.value) })} placeholder="Specialties" />
                      <Input value={guide.certifications.join(', ')} onChange={(e) => updateGuideProfile(index, { certifications: splitCommaValues(e.target.value) })} placeholder="Certifications" />
                    </div>
                    <Textarea rows={2} value={guide.bio} onChange={(e) => updateGuideProfile(index, { bio: e.target.value })} placeholder="Brief bio, terrain expertise, family support, first-aid training, etc." />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4 rounded-2xl border border-border/60 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-foreground">Gallery & media</h3>
                  <p className="text-sm text-muted-foreground">Add public-facing photos that strengthen trust and unlock showcase awards.</p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addGalleryItem} className="gap-2">
                  <Plus className="w-4 h-4" /> Add media
                </Button>
              </div>
              <div className="space-y-4">
                {publicProfile.galleryMedia.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No gallery items added yet.</p>
                ) : publicProfile.galleryMedia.map((item, index) => (
                  <div key={item.id} className="space-y-4 rounded-2xl border border-border/60 bg-muted/30 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm font-semibold text-foreground">Media item {index + 1}</p>
                      <Button type="button" variant="ghost" size="sm" className="gap-2 text-destructive" onClick={() => removeGalleryItem(index)}>
                        <Trash2 className="w-4 h-4" /> Remove
                      </Button>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      <Input value={item.title} onChange={(e) => updateGalleryItem(index, { title: e.target.value })} placeholder="Photo title" />
                      <Input value={item.category} onChange={(e) => updateGalleryItem(index, { category: (e.target.value || 'operator') as OperatorGalleryItem['category'] })} placeholder="operator / vehicle / traveler / accommodation / food" />
                      <Input value={item.url} onChange={(e) => updateGalleryItem(index, { url: e.target.value })} placeholder="https://..." />
                    </div>
                  </div>
                ))}
              </div>
            </div>
              </>
            )}

            {(storefrontSection === 'all' || storefrontSection === 'business-profile') ? (
            <div className="space-y-4 rounded-2xl border border-border/60 p-4">
              <div>
                <h3 className="font-semibold text-foreground">Public policies</h3>
                <p className="text-sm text-muted-foreground">These are rendered on the public operator page for pre-booking trust.</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Textarea rows={3} value={publicProfile.publicPolicies.cancellation} onChange={(e) => updatePolicyField('cancellation', e.target.value)} placeholder="Cancellation policy" />
                <Textarea rows={3} value={publicProfile.publicPolicies.deposit} onChange={(e) => updatePolicyField('deposit', e.target.value)} placeholder="Deposit policy" />
                <Textarea rows={3} value={publicProfile.publicPolicies.pickup} onChange={(e) => updatePolicyField('pickup', e.target.value)} placeholder="Pickup rules" />
                <Textarea rows={3} value={publicProfile.publicPolicies.child} onChange={(e) => updatePolicyField('child', e.target.value)} placeholder="Child policy" />
                <Textarea rows={3} value={publicProfile.publicPolicies.refund} onChange={(e) => updatePolicyField('refund', e.target.value)} placeholder="Refund policy" />
                <Textarea rows={3} value={publicProfile.publicPolicies.weather} onChange={(e) => updatePolicyField('weather', e.target.value)} placeholder="Weather disruption policy" />
                <Textarea rows={3} value={publicProfile.publicPolicies.emergency} onChange={(e) => updatePolicyField('emergency', e.target.value)} placeholder="Emergency contact policy" />
                <Textarea rows={3} value={publicProfile.publicPolicies.supportHours} onChange={(e) => updatePolicyField('supportHours', e.target.value)} placeholder="Support hours" />
              </div>
            </div>
            ) : null}
          </GlassCard>
        ) : null}

        {/* Category Cards — only shown on the main settings route, not on fleet/business-profile sub-routes */}
        {storefrontSection === 'all' && (
          <div className="pt-4">
            <h2 className="text-lg font-semibold text-foreground mb-3">Settings Sections</h2>
            {settingsCategories.map((category, index) => (
              <Link key={category.id} to={category.href} className="block mb-2">
                <GlassCard
                  variant="card"
                  className="rounded-2xl overflow-hidden cursor-pointer"
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
              </Link>
            ))}
          </div>
        )}

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
            <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center flex-shrink-0">
              <ChevronRight size={24} className="text-success" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-foreground mb-2">Partner Success Team</h3>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                Get dedicated support to grow your tour business and maximize your earnings on
                TripAvail.
              </p>
              <Button variant="outline" size="sm" className="w-full sm:w-auto" disabled={isSaving}>
                Contact Partner Manager
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
            Commission & Fees
          </Button>
          <Button
            variant="outline"
            className="w-full justify-center text-destructive border-destructive/20 hover:bg-destructive/10"
            disabled={isSaving}
            onClick={settings?.pause_bookings ? handleResumeBookings : handlePauseBookings}
          >
            {settings?.pause_bookings ? 'Resume Tour Bookings' : 'Pause Tour Bookings'}
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

function splitCommaValues(value: string): string[] {
  return value.split(',').map((part) => part.trim()).filter(Boolean)
}

function createEmptyFleetAsset(index: number): OperatorFleetAsset {
  return {
    id: `fleet-${Date.now()}-${index}`,
    type: '',
    name: '',
    quantity: 1,
    capacity: null,
    details: '',
  }
}

function createEmptyGuideProfile(index: number): OperatorGuideProfile {
  return {
    id: `guide-${Date.now()}-${index}`,
    name: '',
    languages: [],
    specialties: [],
    certifications: [],
    yearsExperience: null,
    bio: '',
  }
}

function createEmptyGalleryItem(index: number): OperatorGalleryItem {
  return {
    id: `gallery-${Date.now()}-${index}`,
    url: '',
    title: '',
    category: 'operator',
  }
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
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
      <div>
        <p className="font-medium text-foreground">{label}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <button
        onClick={() => onChange(!enabled)}
        disabled={disabled}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          enabled ? 'bg-primary' : 'bg-input'
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
