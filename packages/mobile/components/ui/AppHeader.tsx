import type { ReactNode } from 'react'
import { router } from 'expo-router'
import { ChevronLeft } from '@/components/icons/lucide'
import { Pressable, Text, View } from 'react-native'

import { useThemeColors } from '@/theme'

interface AppHeaderProps {
  title?: string
  subtitle?: string
  showBack?: boolean
  /** Optional element rendered on the right (e.g. an action button). */
  right?: ReactNode
}

/** Consistent screen header: optional back button, title/subtitle, right slot. */
export function AppHeader({ title, subtitle, showBack = false, right }: AppHeaderProps) {
  const c = useThemeColors()
  return (
    <View className="flex-row items-center px-5 pb-3 pt-2">
      {showBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={10}
          onPress={() => router.back()}
          className="mr-3 h-9 w-9 items-center justify-center rounded-full bg-surface-sunken"
        >
          <ChevronLeft size={22} color={c.ink} />
        </Pressable>
      ) : null}
      <View className="flex-1">
        {title ? (
          <Text className="text-2xl font-bold text-ink" numberOfLines={1}>
            {title}
          </Text>
        ) : null}
        {subtitle ? (
          <Text className="mt-0.5 text-sm text-ink-muted" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
    </View>
  )
}
