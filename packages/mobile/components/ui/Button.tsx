import { LinearGradient } from 'expo-linear-gradient'
import type { PressableProps } from 'react-native'
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native'

import { useRoleTheme } from '@/theme'

type Variant = 'primary' | 'secondary' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends Omit<PressableProps, 'children'> {
  label: string
  variant?: Variant
  size?: Size
  loading?: boolean
  fullWidth?: boolean
  /** Render the role brand gradient fill (primary variant only). For hero CTAs. */
  gradient?: boolean
}

const SIZES: Record<Size, string> = {
  sm: 'py-2.5 px-4',
  md: 'py-3.5 px-5',
  lg: 'py-4 px-6',
}

const VARIANT_BG: Record<Variant, string> = {
  primary: 'bg-primary-700',
  secondary: 'bg-primary-50',
  ghost: 'bg-transparent',
}

const VARIANT_TEXT: Record<Variant, string> = {
  primary: 'text-white',
  secondary: 'text-primary-700',
  ghost: 'text-primary-700',
}

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  fullWidth = true,
  gradient = false,
  className,
  ...rest
}: ButtonProps) {
  const theme = useRoleTheme()
  const isDisabled = disabled || loading
  const useGradient = gradient && variant === 'primary' && !isDisabled
  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      className={`flex-row items-center justify-center rounded-2xl ${SIZES[size]} ${
        useGradient ? 'overflow-hidden' : VARIANT_BG[variant]
      } ${fullWidth ? 'w-full' : ''} ${isDisabled ? 'opacity-50' : ''} ${className ?? ''}`}
      style={({ pressed }) =>
        pressed && !isDisabled ? { transform: [{ scale: 0.98 }], opacity: 0.95 } : undefined
      }
      {...rest}
    >
      {useGradient ? (
        <LinearGradient
          colors={[theme.primary, theme.primaryLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? theme.primaryForeground : theme.primary}
          style={{ marginRight: 8 }}
        />
      ) : null}
      <Text className={`text-base font-bold ${VARIANT_TEXT[variant]}`}>{label}</Text>
    </Pressable>
  )
}
