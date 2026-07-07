import { router, type Href } from 'expo-router'
import {
  Briefcase,
  ChevronRight,
  CircleHelp,
  CreditCard,
  Heart,
  LayoutDashboard,
  type LucideIcon,
  Lock,
  MessageSquare,
  Settings,
  ShieldCheck,
} from '@/components/icons/lucide'
import { Pressable, ScrollView, Text, View } from 'react-native'

import { AppHeader, Avatar, Badge, Button, Card, EmptyState, Screen } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { useRoleTheme } from '@/theme'

const MENU_ITEMS: Array<{ label: string; Icon: LucideIcon; route: Href | null }> = [
  { label: 'My Bookings', Icon: Briefcase, route: '/(tabs)/trips' },
  { label: 'Wishlist', Icon: Heart, route: '/wishlist' },
  { label: 'Messages', Icon: MessageSquare, route: '/messages' },
  { label: 'Payment Methods', Icon: CreditCard, route: '/payment-methods' as Href },
  { label: 'Account Settings', Icon: Settings, route: '/settings' },
  { label: 'Verification', Icon: ShieldCheck, route: '/settings/verification' },
  { label: 'Help & Support', Icon: CircleHelp, route: '/help' as Href },
  { label: 'Privacy Policy', Icon: Lock, route: null },
]

export default function ProfileScreen() {
  const { user, activeRole, signOut } = useAuth()
  const theme = useRoleTheme()

  if (!user) {
    return (
      <Screen>
        <AppHeader title="Profile" />
        <EmptyState
          icon="person-circle-outline"
          title="Your Profile"
          description="Sign in to manage your account, view bookings, and more."
        >
          <Button label="Sign In" onPress={() => router.push('/(auth)/login')} />
        </EmptyState>
      </Screen>
    )
  }

  const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Traveler'

  const partnerItem =
    activeRole?.role_type === 'tour_operator'
      ? { label: 'Operator Dashboard', Icon: LayoutDashboard, route: '/operator/dashboard' as Href }
      : activeRole?.role_type === 'hotel_manager'
        ? { label: 'Manager Dashboard', Icon: LayoutDashboard, route: '/manager/dashboard' as Href }
        : { label: 'Become a Partner', Icon: Briefcase, route: '/become-partner' as Href }
  const menuItems = [...MENU_ITEMS, partnerItem]

  return (
    <Screen>
      <AppHeader title="Profile" />
      <ScrollView contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
        {/* Identity */}
        <View className="items-center px-6 pb-6 pt-2">
          <Avatar uri={user.user_metadata?.avatar_url} name={displayName} size={88} />
          <Text className="mt-3 text-xl font-bold text-ink">{displayName}</Text>
          <Text className="mt-0.5 text-sm text-ink-soft">{user.email}</Text>
          {activeRole ? (
            <View className="mt-2">
              <Badge label={activeRole.role_type.replace('_', ' ')} tone="primary" />
            </View>
          ) : null}
        </View>

        {/* Menu */}
        <View className="px-5">
          <Card className="overflow-hidden p-0">
            {menuItems.map((item, index) => (
              <Pressable
                key={item.label}
                className={`flex-row items-center px-4 py-4 ${
                  index < menuItems.length - 1 ? 'border-b border-line' : ''
                }`}
                onPress={() => item.route && router.push(item.route)}
              >
                <View className="h-9 w-9 items-center justify-center rounded-full bg-primary-50">
                  <item.Icon size={18} color={theme.primary} />
                </View>
                <Text className="ml-3 flex-1 font-medium text-ink">{item.label}</Text>
                <ChevronRight size={18} color="#cbd5e1" />
              </Pressable>
            ))}
          </Card>
        </View>

        {/* Sign out */}
        <Pressable
          className="mx-5 mt-8 items-center rounded-2xl bg-danger-bg py-4"
          onPress={signOut}
        >
          <Text className="font-semibold text-danger-fg">Sign Out</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  )
}
