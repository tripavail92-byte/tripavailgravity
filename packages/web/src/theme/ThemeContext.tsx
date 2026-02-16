/**
 * Theme Context with Role Isolation
 *
 * Enterprise-grade theme management with:
 * - Light/Dark mode
 * - Role-based theming (traveller/hotel_manager/tour_operator)
 * - No hydration mismatches
 * - Single computed theme object
 */

import { createContext, useContext, useEffect, useMemo, useState } from 'react'

import { useAuth } from '@/hooks/useAuth'

type ThemeMode = 'dark' | 'light' | 'system'
type UserRole = 'traveller' | 'hotel_manager' | 'tour_operator'

interface ThemeContextValue {
  // Theme state
  mode: ThemeMode
  role: UserRole
  resolvedMode: 'dark' | 'light' // Actual mode after resolving 'system'

  // Actions
  setMode: (mode: ThemeMode) => void

  // Computed theme object (prevents re-renders)
  theme: {
    isDark: boolean
    role: UserRole
    mode: ThemeMode
  }
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

interface ThemeProviderProps {
  children: React.ReactNode
  defaultMode?: ThemeMode
  storageKey?: string
}

export function ThemeProvider({
  children,
  defaultMode = 'system',
  storageKey = 'tripavail-theme-mode',
}: ThemeProviderProps) {
  const { activeRole } = useAuth()

  // Theme mode state (light/dark/system)
  const [mode, setModeState] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return defaultMode
    return (localStorage.getItem(storageKey) as ThemeMode) || defaultMode
  })

  // Resolved mode (system → light or dark)
  const [resolvedMode, setResolvedMode] = useState<'dark' | 'light'>(() => {
    if (mode !== 'system') return mode
    if (typeof window === 'undefined') return 'light'
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  // User role (defaults to traveller for anonymous)
  const role: UserRole = useMemo(() => {
    return (activeRole?.role_type as UserRole) || 'traveller'
  }, [activeRole])

  // Update resolved mode when system preference changes
  useEffect(() => {
    if (mode !== 'system') {
      setResolvedMode(mode)
      return
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      setResolvedMode(e.matches ? 'dark' : 'light')
    }

    setResolvedMode(mediaQuery.matches ? 'dark' : 'light')
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [mode])

  // Apply theme classes to document
  useEffect(() => {
    const root = document.documentElement

    // Apply light/dark class
    root.classList.remove('light', 'dark')
    root.classList.add(resolvedMode)

    // Apply role attribute
    root.setAttribute('data-role', role)
  }, [resolvedMode, role])

  // Persist mode changes
  const setMode = (newMode: ThemeMode) => {
    localStorage.setItem(storageKey, newMode)
    setModeState(newMode)
  }

  // Memoized theme object
  const theme = useMemo(
    () => ({
      isDark: resolvedMode === 'dark',
      role,
      mode,
    }),
    [resolvedMode, role, mode],
  )

  const value: ThemeContextValue = {
    mode,
    role,
    resolvedMode,
    setMode,
    theme,
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

/**
 * Hook to access theme context
 */
export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
