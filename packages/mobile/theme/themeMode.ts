/**
 * Light / dark / system mode — the mobile equivalent of the web ThemeContext's
 * mode handling. The active mode resolves to a scheme (light|dark); ThemeProvider
 * then swaps the neutral surface/text/line CSS variables accordingly (premium
 * slate dark theme, ported from the web dark tokens).
 */

import { useColorScheme } from 'react-native'
import { create } from 'zustand'
import * as SecureStore from 'expo-secure-store'

export type ThemeMode = 'light' | 'dark' | 'system'
export type Scheme = 'light' | 'dark'

const STORAGE_KEY = 'tripavail-theme-mode'

interface ThemeModeState {
  mode: ThemeMode
  setMode: (m: ThemeMode) => void
  hydrate: () => Promise<void>
}

export const useThemeModeStore = create<ThemeModeState>((set) => ({
  mode: 'system',
  setMode: (mode) => {
    set({ mode })
    SecureStore.setItemAsync(STORAGE_KEY, mode).catch(() => {})
  },
  hydrate: async () => {
    try {
      const v = await SecureStore.getItemAsync(STORAGE_KEY)
      if (v === 'light' || v === 'dark' || v === 'system') set({ mode: v })
    } catch {
      // ignore — fall back to 'system'
    }
  },
}))

/** Resolve the user's chosen mode against the OS scheme. Use inside components. */
export function useResolvedScheme(): Scheme {
  const mode = useThemeModeStore((s) => s.mode)
  const system = useColorScheme()
  if (mode === 'system') return system === 'dark' ? 'dark' : 'light'
  return mode
}

// Neutral palettes as HSL triplets (the format NativeWind `vars()` needs).
// Light = slate-tinted whites; dark = premium slate/navy (web dark tokens).
const TRIPLETS: Record<Scheme, Record<string, string>> = {
  light: {
    'surface-page': '210 40% 98%',
    'surface-card': '0 0% 100%',
    'surface-sunken': '210 40% 96%',
    ink: '222 47% 11%',
    'ink-muted': '215 16% 47%',
    'ink-soft': '215 20% 65%',
    line: '214 32% 91%',
  },
  dark: {
    'surface-page': '222 47% 11%',
    'surface-card': '217 33% 16%',
    'surface-sunken': '217 33% 21%',
    ink: '210 40% 98%',
    'ink-muted': '215 20% 65%',
    'ink-soft': '215 16% 56%',
    line: '217 33% 26%',
  },
}

/** CSS variables for the neutral palette of a scheme (consumed by ThemeProvider). */
export function neutralVars(scheme: Scheme): Record<string, string> {
  const t = TRIPLETS[scheme]
  return {
    '--surface-page': t['surface-page'],
    '--surface-card': t['surface-card'],
    '--surface-sunken': t['surface-sunken'],
    '--ink': t.ink,
    '--ink-muted': t['ink-muted'],
    '--ink-soft': t['ink-soft'],
    '--line': t.line,
  }
}

function rnHsl(triplet: string): string {
  const [h, s, l] = triplet.split(' ')
  return `hsl(${h}, ${s}, ${l})`
}

export interface ThemeColors {
  scheme: Scheme
  surfacePage: string
  surfaceCard: string
  surfaceSunken: string
  ink: string
  inkMuted: string
  inkSoft: string
  line: string
}

/** Resolved neutral colors as RN color strings, for raw props (icon `color`,
 *  ActivityIndicator, tabBar/header styles) that can't use NativeWind classes. */
export function useThemeColors(): ThemeColors {
  const scheme = useResolvedScheme()
  const t = TRIPLETS[scheme]
  return {
    scheme,
    surfacePage: rnHsl(t['surface-page']),
    surfaceCard: rnHsl(t['surface-card']),
    surfaceSunken: rnHsl(t['surface-sunken']),
    ink: rnHsl(t.ink),
    inkMuted: rnHsl(t['ink-muted']),
    inkSoft: rnHsl(t['ink-soft']),
    line: rnHsl(t.line),
  }
}
