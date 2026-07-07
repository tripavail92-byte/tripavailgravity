import type { ReactNode } from 'react'
import {
  Briefcase,
  Building2,
  CircleAlert,
  CircleUser,
  Heart,
  type LucideIcon,
  Map as MapIcon,
  SearchX,
  Shield,
  Sparkles,
  User,
} from '@/components/icons/lucide'
import { Text, View } from 'react-native'

import { useRoleTheme } from '@/theme'

// Maps the legacy icon-name keys callers already pass to Lucide components,
// so empty/error states stay on the brand icon system with no caller changes.
const ICON_MAP: Record<string, LucideIcon> = {
  'map-outline': MapIcon,
  'search-outline': SearchX,
  'briefcase-outline': Briefcase,
  'person-circle-outline': CircleUser,
  'person-outline': User,
  'business-outline': Building2,
  'alert-circle-outline': CircleAlert,
  'heart-outline': Heart,
  'shield-outline': Shield,
  'sparkles-outline': Sparkles,
}

interface EmptyStateProps {
  /** Legacy icon-name key (mapped to a Lucide icon internally). */
  icon?: string
  title: string
  description?: string
  children?: ReactNode
}

export function EmptyState({ icon = 'sparkles-outline', title, description, children }: EmptyStateProps) {
  const theme = useRoleTheme()
  const Icon = ICON_MAP[icon] ?? Sparkles
  return (
    <View className="flex-1 items-center justify-center px-8 py-16">
      <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-primary-50">
        <Icon size={30} color={theme.primary} />
      </View>
      <Text className="text-center text-lg font-bold text-ink">{title}</Text>
      {description ? (
        <Text className="mt-1.5 text-center text-sm leading-5 text-ink-muted">{description}</Text>
      ) : null}
      {children ? <View className="mt-5 w-full">{children}</View> : null}
    </View>
  )
}
