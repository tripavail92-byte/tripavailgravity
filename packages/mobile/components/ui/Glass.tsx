import type { ReactNode } from 'react'
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'

import { useThemeColors } from '@/theme'

// NOTE: no experimentalBlurMethod on Android — dimezisBlurView needs hardware
// bitmaps and hard-crashes on software-rendered surfaces (common on emulators).
// Android gets expo-blur's translucent fallback; our own base/specular/border
// layers carry the glass look. iOS gets true backdrop blur.

/**
 * GlassPanel — RN port of the web `.glass-card` (iOS Liquid Glass principles):
 *   backdrop-filter: blur(20px) saturate(180%)
 *   background: linear-gradient(145deg, white/0.06, transparent 50%), base/0.7
 *   border: glass-border/0.3 · inset top highlight · 0 8px 32px shadow
 * Real backdrop blur via expo-blur (Android needs experimentalBlurMethod).
 */
export function GlassPanel({
  children,
  style,
  radius = 32,
  intensity = 50,
  contentStyle,
}: {
  children?: ReactNode
  style?: StyleProp<ViewStyle>
  radius?: number
  intensity?: number
  contentStyle?: StyleProp<ViewStyle>
}) {
  const c = useThemeColors()
  const dark = c.scheme === 'dark'

  // Web tokens: light base = background(white)/0.72; dark base = hsl(217 33% 20%)/0.75
  const baseTint = dark ? 'rgba(31, 41, 59, 0.78)' : 'rgba(255, 255, 255, 0.72)'
  const borderColor = dark ? 'rgba(248, 250, 252, 0.14)' : 'rgba(148, 163, 184, 0.35)'
  const topHighlight = dark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(255, 255, 255, 0.55)'

  return (
    <View
      style={[
        {
          borderRadius: radius,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor,
          shadowColor: dark ? '#000000' : '#1e293b',
          shadowOpacity: dark ? 0.45 : 0.16,
          shadowRadius: 32,
          shadowOffset: { width: 0, height: 8 },
          elevation: 18,
        },
        style,
      ]}
    >
      <BlurView
        intensity={intensity}
        tint={dark ? 'dark' : 'light'}
        style={StyleSheet.absoluteFill}
      />
      {/* Translucent base over the blur */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: baseTint }]} />
      {/* Specular highlight — light source hitting top-left of the glass */}
      <LinearGradient
        colors={[dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.10)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.7, y: 0.6 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      {/* Glass lip — inset top edge light */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: radius / 2,
          right: radius / 2,
          height: 1,
          backgroundColor: topHighlight,
        }}
      />
      <View style={contentStyle}>{children}</View>
    </View>
  )
}

/** Glass for bars (tab bar / headers): square corners, lighter chrome. */
export function GlassBar({
  children,
  style,
  intensity = 60,
}: {
  children?: ReactNode
  style?: StyleProp<ViewStyle>
  intensity?: number
}) {
  const c = useThemeColors()
  const dark = c.scheme === 'dark'
  const baseTint = dark ? 'rgba(17, 24, 39, 0.72)' : 'rgba(255, 255, 255, 0.70)'
  const borderColor = dark ? 'rgba(248, 250, 252, 0.10)' : 'rgba(148, 163, 184, 0.25)'

  return (
    <View style={[{ overflow: 'hidden' }, style]}>
      <BlurView
        intensity={intensity}
        tint={dark ? 'dark' : 'light'}
        style={StyleSheet.absoluteFill}
      />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: baseTint }]} />
      <View
        pointerEvents="none"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: StyleSheet.hairlineWidth, backgroundColor: borderColor }}
      />
      {children}
    </View>
  )
}
