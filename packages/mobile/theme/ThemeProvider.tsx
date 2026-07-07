/**
 * Mobile ThemeProvider — the runtime equivalent of the web `ThemeContext`.
 *
 * Sets two layers of CSS variables on a root <View> via NativeWind `vars()`,
 * which cascade to every screen:
 *   1. Role brand color  → `--primary*` from the active role (rose/coral/purple).
 *   2. Light/dark neutrals → `--surface*` / `--ink*` / `--line` from the resolved
 *      scheme (premium slate dark theme).
 */

import type { ReactNode } from 'react'
import { View } from 'react-native'
import { vars } from 'nativewind'

import { useAuth } from '@/hooks/useAuth'
import { getRoleColors, resolveRoleKey, type RoleColors } from './roleTheme'
import { neutralVars, useResolvedScheme } from './themeMode'

/**
 * Returns the active role's brand colors. Backed by the global `useAuth` store,
 * so it works anywhere (no provider required) and re-renders on `switchRole`.
 */
export function useRoleTheme(): RoleColors {
  const roleType = useAuth((s) => s.activeRole?.role_type)
  return getRoleColors(resolveRoleKey(roleType))
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useRoleTheme()
  const scheme = useResolvedScheme()
  const pageBg = scheme === 'dark' ? 'hsl(222, 47%, 11%)' : 'hsl(210, 40%, 98%)'

  return (
    <View
      style={[
        { flex: 1, backgroundColor: pageBg },
        vars({
          '--primary': theme.primaryHsl,
          '--primary-light': theme.primaryLightHsl,
          '--primary-foreground': theme.primaryForegroundHsl,
          ...neutralVars(scheme),
        }),
      ]}
    >
      {children}
    </View>
  )
}
