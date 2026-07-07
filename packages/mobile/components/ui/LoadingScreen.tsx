import { ActivityIndicator, View } from 'react-native'

import { useRoleTheme } from '@/theme'

export function LoadingScreen() {
  const theme = useRoleTheme()
  return (
    <View className="flex-1 bg-surface-page items-center justify-center">
      <ActivityIndicator size="large" color={theme.primary} />
    </View>
  )
}
