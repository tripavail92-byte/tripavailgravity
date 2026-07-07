import type { ReactNode } from 'react'
import { View } from 'react-native'
import { SafeAreaView, type Edge } from 'react-native-safe-area-context'

import { useThemeColors } from '@/theme'

interface ScreenProps {
  children: ReactNode
  /** Add horizontal screen padding (px-5) to the content area. */
  padded?: boolean
  /** Safe-area edges to apply. Defaults to top only (tab screens). */
  edges?: Edge[]
  className?: string
}

/**
 * Standard screen wrapper: safe-area aware, page-tinted background.
 *
 * NOTE: NativeWind does NOT map `className` onto SafeAreaView (a third-party
 * component), so flex + background MUST be set via `style` or the whole screen
 * collapses. Background is mode-aware (light slate-white / dark slate-navy).
 */
export function Screen({ children, padded = false, edges = ['top'], className }: ScreenProps) {
  const c = useThemeColors()
  return (
    <SafeAreaView edges={edges} style={{ flex: 1, backgroundColor: c.surfacePage }}>
      <View className={`flex-1 ${padded ? 'px-5' : ''} ${className ?? ''}`}>{children}</View>
    </SafeAreaView>
  )
}
