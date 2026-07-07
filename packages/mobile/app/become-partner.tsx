import { router, type Href } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'

import { Building2, Check, type LucideIcon, Map as MapIcon } from '@/components/icons/lucide'
import { AppHeader, Button, Card, EmptyState, Screen } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import type { RoleType } from '@tripavail/shared'

interface PartnerOption {
  role: RoleType
  Icon: LucideIcon
  title: string
  desc: string
  benefits: string[]
  colors: [string, string]
}

// Colors match the role brand palette (operator coral / manager purple→cyan).
const OPTIONS: PartnerOption[] = [
  {
    role: 'tour_operator',
    Icon: MapIcon,
    title: 'Tour Operator',
    desc: 'Best for guided tours, activities, and experiences.',
    benefits: ['Create unique daily itineraries', 'Manage group capacities & schedules', 'Get paid per booking'],
    colors: ['#FD5E53', '#FE8C84'],
  },
  {
    role: 'hotel_manager',
    Icon: Building2,
    title: 'Hotel Manager',
    desc: 'Perfect for hotels, resorts, and vacation rentals.',
    benefits: ['List properties & build packages', 'Manage bookings & availability', 'Receive payouts directly'],
    colors: ['#9D4EDD', '#00BFE6'],
  },
]

export default function BecomePartnerScreen() {
  const { user, switchRole } = useAuth()
  const [loading, setLoading] = useState<RoleType | null>(null)

  if (!user) {
    return (
      <Screen>
        <AppHeader showBack title="Become a Partner" />
        <EmptyState
          icon="briefcase-outline"
          title="Sign in to continue"
          description="You need an account before you can start listing on TripAvail."
        >
          <Button label="Sign In" onPress={() => router.push('/(auth)/login')} />
        </EmptyState>
      </Screen>
    )
  }

  const select = async (role: RoleType) => {
    if (loading) return
    setLoading(role)
    try {
      await switchRole(role)
      // After becoming a partner, land on their dashboard. (Phase 1 will route
      // first-time partners into the setup wizard when setup_completed=false.)
      router.replace((role === 'tour_operator' ? '/operator/setup' : '/manager/setup') as Href)
    } catch (e: any) {
      Alert.alert('Could not switch role', e?.message ?? 'Please try again in a moment.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <Screen>
      <AppHeader showBack title="Become a Partner" />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 36 }} showsVerticalScrollIndicator={false}>
        <Text className="text-2xl font-black text-ink">Start listing on TripAvail</Text>
        <Text className="mt-1.5 text-sm leading-5 text-ink-muted">
          Choose how you want to partner with us. Your choice is permanent — but you can switch back to
          travelling anytime from the menu.
        </Text>

        <View className="mt-6">
          {OPTIONS.map((opt) => (
            <Card key={opt.role} className="mb-4 p-5">
              <LinearGradient
                colors={opt.colors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}
              >
                <opt.Icon size={24} color="#ffffff" strokeWidth={2} />
              </LinearGradient>

              <Text className="mt-3 text-lg font-bold text-ink">{opt.title}</Text>
              <Text className="mt-0.5 text-sm text-ink-muted">{opt.desc}</Text>

              <View className="mt-3 gap-2">
                {opt.benefits.map((b) => (
                  <View key={b} className="flex-row items-center gap-2">
                    <Check size={16} color={opt.colors[0]} strokeWidth={2.5} />
                    <Text className="flex-1 text-sm text-ink-muted">{b}</Text>
                  </View>
                ))}
              </View>

              <Pressable
                onPress={() => select(opt.role)}
                disabled={!!loading}
                className="mt-4 overflow-hidden rounded-2xl"
                style={({ pressed }) => (pressed ? { opacity: 0.92, transform: [{ scale: 0.99 }] } : undefined)}
              >
                <LinearGradient
                  colors={opt.colors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ paddingVertical: 14, alignItems: 'center', opacity: loading && loading !== opt.role ? 0.5 : 1 }}
                >
                  {loading === opt.role ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text className="text-base font-bold text-white">Continue as {opt.title}</Text>
                  )}
                </LinearGradient>
              </Pressable>
            </Card>
          ))}
        </View>

        <Text className="mt-2 px-1 text-center text-xs leading-5 text-ink-soft">
          Becoming a partner starts identity verification. You'll be guided through setup before your
          listings go live.
        </Text>
      </ScrollView>
    </Screen>
  )
}
