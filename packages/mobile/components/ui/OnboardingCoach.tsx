import { useEffect, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import * as SecureStore from 'expo-secure-store'

import { CircleUser, Compass, type LucideIcon, Search } from '@/components/icons/lucide'
import { GlassPanel } from '@/components/ui/Glass'
import { useAuth } from '@/hooks/useAuth'
import { useRoleTheme, useThemeColors } from '@/theme'

const SEEN_KEY = 'tripavail-onboarding-seen-v1'

interface CoachStep {
  Icon: LucideIcon
  title: string
  body: string
}

/** Mirror of the web's 3-step guided tour ("Find Your Next Trip — Step 1 of 3"). */
const STEPS: CoachStep[] = [
  {
    Icon: Search,
    title: 'Find your next trip',
    body: 'Use the search bar to find hotels, tours, and experiences in your desired destination.',
  },
  {
    Icon: Compass,
    title: 'Tours & stays in one place',
    body: 'Browse curated tours by category, or tap Stays for hotel packages with perks and instant confirmation.',
  },
  {
    Icon: CircleUser,
    title: 'Your account, your way',
    body: 'Tap your avatar for trips, wishlist, messages, and settings — or become a partner and start listing.',
  },
]

export function OnboardingCoach() {
  const { user, initialized } = useAuth()
  const theme = useRoleTheme()
  const c = useThemeColors()
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)
  // Reanimated 4 — fade backdrop, spring the card up (web spring 400/30).
  const fade = useSharedValue(0)
  const cardY = useSharedValue(48)
  const cardScale = useSharedValue(0.94)

  useEffect(() => {
    if (!initialized || !user) return
    let active = true
    SecureStore.getItemAsync(SEEN_KEY)
      .then((seen) => {
        if (active && !seen) {
          setVisible(true)
          fade.value = withTiming(1, { duration: 240 })
          cardY.value = withSpring(0, { stiffness: 400, damping: 30, mass: 1 })
          cardScale.value = withSpring(1, { stiffness: 400, damping: 30, mass: 1 })
        }
      })
      .catch(() => {})
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialized, user?.id])

  const overlayStyle = useAnimatedStyle(() => ({ opacity: fade.value }))
  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: cardY.value }, { scale: cardScale.value }],
  }))

  if (!visible || !user) return null

  const dismiss = () => {
    SecureStore.setItemAsync(SEEN_KEY, '1').catch(() => {})
    cardY.value = withTiming(36, { duration: 200 })
    fade.value = withTiming(0, { duration: 200 }, (finished) => {
      if (finished) runOnJS(setVisible)(false)
    })
  }

  const next = () => {
    if (step >= STEPS.length - 1) dismiss()
    else setStep((s) => s + 1)
  }

  const current = STEPS[step]
  const progress = Math.round(((step + 1) / STEPS.length) * 100)

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { zIndex: 50 }, overlayStyle]} pointerEvents="auto">
      <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(15,23,42,0.55)' }]} onPress={dismiss} />

      {/* Bottom coach card — liquid glass, springs up on entrance */}
      <Animated.View style={[{ position: 'absolute', left: 16, right: 16, bottom: 110 }, cardStyle]}>
        <GlassPanel radius={28} intensity={55} contentStyle={{ padding: 20 }}>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <LinearGradient
                colors={theme.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }}
              >
                <current.Icon size={18} color="#ffffff" strokeWidth={2.2} />
              </LinearGradient>
              <View>
                <Text className="text-base font-bold text-ink">{current.title}</Text>
                <Text className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">
                  Step {step + 1} of {STEPS.length}
                </Text>
              </View>
            </View>
            <Pressable onPress={dismiss} hitSlop={8}>
              <Text className="text-xs font-bold text-ink-soft">Skip</Text>
            </Pressable>
          </View>

          <Text className="mt-3 text-sm leading-5 text-ink-muted">{current.body}</Text>

          <View className="mt-4 flex-row items-center">
            <View className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-sunken">
              <View className="h-full rounded-full bg-primary-700" style={{ width: `${progress}%` }} />
            </View>
            <Text className="ml-2 text-[10px] font-bold text-ink-soft">{progress}%</Text>
          </View>

          <Pressable onPress={next} className="mt-4 overflow-hidden rounded-2xl">
            <LinearGradient
              colors={theme.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ paddingVertical: 13, alignItems: 'center' }}
            >
              <Text className="text-base font-bold text-white">
                {step >= STEPS.length - 1 ? "Let's go" : 'Next'}
              </Text>
            </LinearGradient>
          </Pressable>
        </GlassPanel>
      </Animated.View>
    </Animated.View>
  )
}
