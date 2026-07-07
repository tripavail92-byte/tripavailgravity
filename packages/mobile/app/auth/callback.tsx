import { Redirect } from 'expo-router'
import { ActivityIndicator, Text, View } from 'react-native'

import { useAuth } from '@/hooks/useAuth'
import { useRoleTheme } from '@/theme'

export default function AuthCallbackScreen() {
  const { initialized, user } = useAuth()
  const theme = useRoleTheme()

  if (initialized && user) {
    return <Redirect href="/(tabs)" />
  }

  if (initialized) {
    return <Redirect href="/(auth)/login" />
  }

  return (
    <View className="flex-1 items-center justify-center bg-surface-page px-6">
      <ActivityIndicator size="large" color={theme.primary} />
      <Text className="mt-4 text-sm text-ink-muted">Completing sign-in…</Text>
    </View>
  )
}