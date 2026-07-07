import { useEffect, useState } from 'react'
import {
  Alert,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
import { router, usePathname, type Href } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'

import {
  BarChart3,
  Briefcase,
  Building2,
  CalendarDays,
  ChevronRight,
  CircleHelp,
  CircleUser,
  CreditCard,
  Gem,
  Gift,
  Heart,
  LayoutDashboard,
  LogOut,
  type LucideIcon,
  MapPin,
  MessageSquare,
  Plus,
  RefreshCcw,
  Settings,
  Shield,
  Star,
  X,
} from '@/components/icons/lucide'
import { useAuth } from '@/hooks/useAuth'
import { useDrawer } from '@/hooks/useDrawer'
import { useRoleTheme, useThemeColors } from '@/theme'
import type { RoleType } from '@tripavail/shared'

const SCREEN_W = Dimensions.get('window').width
const PANEL_W = Math.min(320, Math.round(SCREEN_W * 0.86))
const PANEL_INSET = 12

interface NavItem {
  label: string
  subtext?: string
  Icon: LucideIcon
  colors: [string, string]
  route: string
}

/**
 * Per-role navigation — mirror of web `config/navigation.ts` ROLE_NAVIGATION,
 * mapped to the mobile routes. The drawer itself mirrors web RoleBasedDrawer:
 * right-side floating rounded panel, role chip, active-route highlight,
 * partner shortcut / Become a Partner / Switch to Traveler / Sign Out.
 */
const NAV: Record<'traveller' | 'tour_operator' | 'hotel_manager', NavItem[]> = {
  traveller: [
    { label: 'Dashboard', Icon: LayoutDashboard, colors: ['#3b82f6', '#4f46e5'], route: '/(tabs)' },
    { label: 'My Profile', Icon: CircleUser, colors: ['#a855f7', '#7c3aed'], route: '/(tabs)/profile' },
    { label: 'My Trips', Icon: MapPin, colors: ['#22d3ee', '#3b82f6'], route: '/(tabs)/trips' },
    { label: 'Messages', Icon: MessageSquare, colors: ['#10b981', '#14b8a6'], route: '/messages' },
    { label: 'Wishlist', Icon: Heart, colors: ['#ec4899', '#f43f5e'], route: '/wishlist' },
    { label: 'Payment Methods', Icon: CreditCard, colors: ['#34d399', '#14b8a6'], route: '/payment-methods' },
    { label: 'Account Settings', Icon: Settings, colors: ['#64748b', '#475569'], route: '/settings' },
    { label: 'Help & Support', Icon: CircleHelp, colors: ['#94a3b8', '#64748b'], route: '/help' },
  ],
  hotel_manager: [
    { label: 'Dashboard', Icon: LayoutDashboard, colors: ['#6366f1', '#4f46e5'], route: '/manager/dashboard' },
    {
      label: 'List Your Hotel',
      subtext: 'Publish a new property',
      Icon: Building2,
      colors: ['#a855f7', '#7c3aed'],
      route: '/manager/list-hotel',
    },
    {
      label: 'List Packages',
      subtext: 'Bundle stays with perks',
      Icon: Gift,
      colors: ['#06b6d4', '#0891b2'],
      route: '/manager/create-package',
    },
    { label: 'Bookings', Icon: Briefcase, colors: ['#10b981', '#14b8a6'], route: '/manager/bookings' },
    { label: 'Messages', Icon: MessageSquare, colors: ['#10b981', '#0d9488'], route: '/messages' },
    { label: 'Verification', Icon: Shield, colors: ['#f59e0b', '#d97706'], route: '/settings/verification' },
    { label: 'Settings', Icon: Settings, colors: ['#64748b', '#475569'], route: '/manager/settings' },
    { label: 'Help & Support', Icon: CircleHelp, colors: ['#94a3b8', '#64748b'], route: '/help' },
  ],
  tour_operator: [
    {
      label: 'Tour Operator Setup',
      subtext: 'Complete your profile',
      Icon: MapPin,
      colors: ['#f97316', '#ea580c'],
      route: '/operator/setup',
    },
    {
      label: 'Create New Tour',
      subtext: 'Design a new experience',
      Icon: Plus,
      colors: ['#fb7185', '#e11d48'],
      route: '/operator/tours/create',
    },
    { label: 'Dashboard', Icon: LayoutDashboard, colors: ['#3b82f6', '#4f46e5'], route: '/operator/dashboard' },
    { label: 'Analytics', Icon: BarChart3, colors: ['#0ea5e9', '#2563eb'], route: '/operator/analytics' },
    {
      label: 'Business Profile',
      subtext: 'Your public storefront',
      Icon: Building2,
      colors: ['#8b5cf6', '#6d28d9'],
      route: '/operator/storefront',
    },
    { label: 'Commercial', Icon: Gem, colors: ['#a855f7', '#7c3aed'], route: '/operator/commercial' },
    { label: 'Calendar', Icon: CalendarDays, colors: ['#f43f5e', '#e11d48'], route: '/operator/calendar' },
    { label: 'Bookings', Icon: Briefcase, colors: ['#10b981', '#14b8a6'], route: '/operator/bookings' },
    { label: 'Reviews', Icon: Star, colors: ['#f59e0b', '#f97316'], route: '/operator/reviews' },
    { label: 'Messages', Icon: MessageSquare, colors: ['#10b981', '#0d9488'], route: '/messages' },
    { label: 'Verification', Icon: Shield, colors: ['#f59e0b', '#d97706'], route: '/settings/verification' },
    { label: 'Settings', Icon: Settings, colors: ['#64748b', '#475569'], route: '/operator/settings' },
    { label: 'Help & Support', Icon: CircleHelp, colors: ['#94a3b8', '#64748b'], route: '/help' },
  ],
}

function roleLabelOf(role?: string | null): string {
  if (role === 'hotel_manager') return 'Hotel Manager'
  if (role === 'tour_operator') return 'Tour Operator'
  return 'Traveler'
}

export function RoleDrawer() {
  const open = useDrawer((s) => s.open)
  const closeDrawer = useDrawer((s) => s.closeDrawer)
  const { user, activeRole, partnerType, signOut, switchRole } = useAuth()
  const theme = useRoleTheme()
  const c = useThemeColors()
  const pathname = usePathname()

  const [mounted, setMounted] = useState(false)
  // Reanimated 4 — iOS-style elastic spring, same config as the web drawer
  // (motion spring: stiffness 400, damping 30).
  const tx = useSharedValue(PANEL_W + PANEL_INSET)
  const fade = useSharedValue(0)
  const scale = useSharedValue(0.96)

  useEffect(() => {
    if (open) {
      setMounted(true)
      tx.value = withSpring(0, { stiffness: 400, damping: 30, mass: 1 })
      scale.value = withSpring(1, { stiffness: 400, damping: 30, mass: 1 })
      fade.value = withTiming(1, { duration: 180 })
    } else {
      tx.value = withTiming(PANEL_W + PANEL_INSET, { duration: 200 })
      scale.value = withTiming(0.96, { duration: 200 })
      fade.value = withTiming(0, { duration: 200 }, (finished) => {
        if (finished) runOnJS(setMounted)(false)
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const backdropStyle = useAnimatedStyle(() => ({ opacity: fade.value }))
  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { scale: scale.value }],
  }))

  if (!mounted || !user) return null

  const roleType = (activeRole?.role_type ?? 'traveller') as 'traveller' | 'tour_operator' | 'hotel_manager'
  const isTraveller = roleType === 'traveller'
  const items = NAV[roleType] ?? NAV.traveller
  const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Traveler'

  const go = (route: string) => {
    closeDrawer()
    router.push(route as Href)
  }
  const doSwitch = async (target: RoleType, route: string) => {
    closeDrawer()
    try {
      await switchRole(target)
      router.replace(route as Href)
    } catch {
      Alert.alert('Could not switch role', 'Please try again in a moment.')
    }
  }
  const handleSignOut = async () => {
    closeDrawer()
    try {
      await signOut()
    } finally {
      router.replace('/(tabs)' as Href)
    }
  }

  // Route highlight — normalize expo-router group segments for comparison.
  const isActive = (route: string) => {
    const clean = route.replace('/(tabs)', '') || '/'
    return pathname === clean || pathname === route
  }

  const partnerShortcut =
    partnerType === 'tour_operator'
      ? { label: 'Tour Operator Dashboard', onPress: () => doSwitch('tour_operator', '/operator/dashboard') }
      : partnerType === 'hotel_manager'
        ? { label: 'Hotel Manager Dashboard', onPress: () => doSwitch('hotel_manager', '/manager/dashboard') }
        : null

  const dark = c.scheme === 'dark'

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Backdrop — dim + blur, like the web's bg-foreground/60 backdrop-blur-sm */}
      <Animated.View style={[StyleSheet.absoluteFill, backdropStyle]}>
        <BlurView
          intensity={18}
          tint={dark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(15,23,42,0.45)' }]} />
        <Pressable style={StyleSheet.absoluteFill} onPress={closeDrawer} accessibilityLabel="Close menu" />
      </Animated.View>

      {/* Floating right-side panel (web RoleBasedDrawer style) */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            right: PANEL_INSET,
            top: PANEL_INSET,
            bottom: PANEL_INSET,
            width: PANEL_W,
          },
          panelStyle,
        ]}
      >
        <SafeAreaView
          edges={['top', 'bottom']}
          style={{
            flex: 1,
            borderRadius: 32,
            borderWidth: 1,
            borderColor: dark ? 'rgba(248, 250, 252, 0.14)' : 'rgba(148, 163, 184, 0.35)',
            shadowColor: '#0f172a',
            shadowOpacity: 0.35,
            shadowRadius: 32,
            shadowOffset: { width: -8, height: 8 },
            elevation: 20,
            overflow: 'hidden',
          }}
        >
          {/* Glass stack: blur → translucent base → specular highlight → top lip */}
          <BlurView
            intensity={55}
            tint={dark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: dark ? 'rgba(31, 41, 59, 0.78)' : 'rgba(255, 255, 255, 0.72)' },
            ]}
          />
          <LinearGradient
            colors={[dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.12)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.7, y: 0.55 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: 0,
              left: 16,
              right: 16,
              height: 1,
              backgroundColor: dark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.55)',
            }}
          />
          <ScrollView contentContainerStyle={{ paddingBottom: 14 }} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View className="px-4 pt-4">
              <Pressable
                onPress={closeDrawer}
                hitSlop={10}
                className="h-8 w-8 items-center justify-center rounded-full bg-surface-sunken"
              >
                <X size={16} color={c.inkMuted} />
              </Pressable>

              <View className="mt-3 flex-row items-center">
                <LinearGradient
                  colors={theme.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ width: 52, height: 52, borderRadius: 17, alignItems: 'center', justifyContent: 'center', padding: 2 }}
                >
                  <View
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: 15,
                      backgroundColor: c.surfaceCard,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text className="text-xl font-black text-ink">
                      {(displayName[0] ?? 'T').toUpperCase()}
                    </Text>
                  </View>
                </LinearGradient>

                <View className="ml-3 flex-1">
                  <Text className="text-[15px] font-bold text-ink" numberOfLines={1}>
                    {displayName}
                  </Text>
                  <Text className="text-[11px] text-ink-soft" numberOfLines={1}>
                    {user.email}
                  </Text>
                  <View className="mt-1.5 flex-row">
                    <View className="flex-row items-center gap-1 rounded-full border border-line bg-surface-sunken px-2 py-0.5">
                      <MapPin size={9} color={c.inkSoft} />
                      <Text className="text-[9px] font-bold uppercase tracking-wider text-ink-muted">
                        {roleLabelOf(roleType)}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* Navigation */}
            <View className="mt-4 px-3">
              <Text className="mb-2 pl-2 text-[9px] font-bold uppercase tracking-widest text-ink-soft">
                Navigation
              </Text>
              {items.map((item) => {
                const active = isActive(item.route)
                const tint = dark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.05)'
                return (
                  <Pressable
                    key={item.label}
                    onPress={() => go(item.route)}
                    className="mb-1 flex-row items-center rounded-2xl px-2 py-2"
                    style={({ pressed }) =>
                      active || pressed
                        ? {
                            backgroundColor: tint,
                            borderWidth: 1,
                            borderColor: dark ? 'rgba(255,255,255,0.10)' : 'rgba(148,163,184,0.25)',
                          }
                        : { borderWidth: 1, borderColor: 'transparent' }
                    }
                  >
                    <LinearGradient
                      colors={item.colors}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{ width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }}
                    >
                      <item.Icon size={17} color="#ffffff" strokeWidth={2} />
                    </LinearGradient>
                    <View className="ml-3 flex-1">
                      <Text className={`text-[14px] ${active ? 'font-bold text-ink' : 'font-medium text-ink'}`}>
                        {item.label}
                      </Text>
                      {item.subtext ? (
                        <Text className="text-[10px] text-ink-soft">{item.subtext}</Text>
                      ) : null}
                    </View>
                    <ChevronRight size={17} color={c.inkSoft} />
                  </Pressable>
                )
              })}
            </View>

            {/* Role actions */}
            <View className="mt-2 px-3">
              {isTraveller && partnerShortcut ? (
                <ActionRow
                  label={partnerShortcut.label}
                  Icon={LayoutDashboard}
                  colors={partnerType === 'hotel_manager' ? ['#6366f1', '#4f46e5'] : ['#10b981', '#0d9488']}
                  onPress={partnerShortcut.onPress}
                />
              ) : null}
              {isTraveller && !partnerShortcut ? (
                <ActionRow
                  label="Become a Partner"
                  Icon={Briefcase}
                  colors={['#7c3aed', '#4f46e5']}
                  onPress={() => go('/become-partner')}
                />
              ) : null}
              {!isTraveller ? (
                <ActionRow
                  label="Switch to Traveler"
                  Icon={RefreshCcw}
                  colors={['#64748b', '#475569']}
                  onPress={() => doSwitch('traveller', '/(tabs)')}
                />
              ) : null}

              <Pressable
                onPress={handleSignOut}
                className="mt-1 flex-row items-center rounded-2xl px-2 py-2"
                style={({ pressed }) => (pressed ? { backgroundColor: 'rgba(220, 38, 38, 0.12)' } : undefined)}
              >
                <View className="h-[34px] w-[34px] items-center justify-center rounded-xl bg-danger-bg">
                  <LogOut size={17} color="#dc2626" strokeWidth={2.2} />
                </View>
                <Text className="ml-3 flex-1 text-[14px] font-bold text-danger">Sign Out</Text>
                <ChevronRight size={17} color="#fca5a5" />
              </Pressable>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Animated.View>
    </View>
  )
}

function ActionRow({
  label,
  Icon,
  colors,
  onPress,
}: {
  label: string
  Icon: LucideIcon
  colors: [string, string]
  onPress: () => void
}) {
  const c = useThemeColors()
  return (
    <Pressable
      onPress={onPress}
      className="mb-1 flex-row items-center rounded-2xl px-2 py-2"
      style={({ pressed }) => (pressed ? { backgroundColor: c.surfaceSunken } : undefined)}
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }}
      >
        <Icon size={17} color="#ffffff" strokeWidth={2} />
      </LinearGradient>
      <Text className="ml-3 flex-1 text-[14px] font-medium text-ink">{label}</Text>
      <ChevronRight size={17} color={c.inkSoft} />
    </Pressable>
  )
}
