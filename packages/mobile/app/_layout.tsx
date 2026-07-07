import '../global.css'

import { QueryClientProvider } from '@tanstack/react-query'
import { SplashScreen, Stack, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import { StripeProvider } from '@stripe/stripe-react-native'

import { queryClient } from '@/lib/queryClient'
import { useAuth } from '@/hooks/useAuth'
import { usePushNotifications } from '@/lib/push'
import { ThemeProvider, useThemeModeStore } from '@/theme'
import { RoleDrawer } from '@/components/ui/RoleDrawer'

const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ''

SplashScreen.preventAutoHideAsync()

function InitialLayout() {
  const { initialize, initialized, user } = useAuth()
  const segments = useSegments()
  const router = useRouter()

  // Push: register token on sign-in, route notification taps.
  usePushNotifications(user?.id)

  // Boot auth and hide splash when done
  useEffect(() => {
    useThemeModeStore.getState().hydrate()
    initialize().finally(() => SplashScreen.hideAsync())
  }, [])

  // If authenticated user lands on auth screens, push to main app
  useEffect(() => {
    if (!initialized) return
    const inAuthGroup = segments[0] === '(auth)'
    if (user && inAuthGroup) {
      router.replace('/(tabs)')
    }
  }, [user, initialized, segments])

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen
        name="tours/[id]"
        options={{ headerShown: true, title: '', headerBackTitle: 'Back' }}
      />
    </Stack>
  )
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY} merchantIdentifier="merchant.com.tripavail.app">
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <InitialLayout />
            <RoleDrawer />
          </ThemeProvider>
          <StatusBar style="auto" />
        </QueryClientProvider>
      </StripeProvider>
    </SafeAreaProvider>
  )
}
