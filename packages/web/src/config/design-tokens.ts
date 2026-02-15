/**
 * Design Tokens - Single Source of Truth for Colors
 *
 * This file defines all color values used in the application.
 * DO NOT hardcode hex values anywhere else in the codebase.
 *
 * Usage:
 * - In CSS: Reference via CSS variables (--primary, --success, etc.)
 * - In Tailwind: Use semantic classes (text-primary, bg-success, etc.)
 * - In SVG: Use currentColor with Tailwind classes
 */

export const DESIGN_TOKENS = {
  /**
   * Brand Colors - Role-Based Theming
   * These colors adapt based on the active user role
   */
  brand: {
    hotelManager: {
      primary: '#9D4EDD', // Purple
      primaryLight: '#B175F1',
      primaryDark: '#8B3DD4',
      secondary: '#00D4FF', // Cyan
      gradient: 'linear-gradient(135deg, #9D4EDD 0%, #00D4FF 100%)',
    },
    traveller: {
      primary: '#FF385C', // Rose
      primaryLight: '#FF6B9D',
      primaryDark: '#E11D48',
      gradient: 'linear-gradient(135deg, #FF385C 0%, #FF6B9D 100%)',
    },
    tourOperator: {
      primary: '#FD5E53', // Bright Coral
      primaryLight: '#FE8078',
      primaryDark: '#E94A40',
      gradient: '#FD5E53', // Solid color (no gradient)
    },
  },

  /**
   * Semantic Colors - Context-Based
   * Use these for validation, status, and feedback
   */
  semantic: {
    success: {
      DEFAULT: '#10B981', // Green 500
      light: '#D1FAE5', // Green 50
      medium: '#6EE7B7', // Green 300
      dark: '#047857', // Green 700
      foreground: '#ECFDF5', // Green 50
    },
    warning: {
      DEFAULT: '#F59E0B', // Amber 500
      light: '#FEF3C7', // Amber 50
      medium: '#FCD34D', // Amber 300
      dark: '#B45309', // Amber 700
      foreground: '#FFFBEB', // Amber 50
    },
    error: {
      DEFAULT: '#EF4444', // Red 500
      light: '#FEE2E2', // Red 50
      medium: '#FCA5A5', // Red 300
      dark: '#B91C1C', // Red 700
      foreground: '#FEF2F2', // Red 50
    },
    info: {
      DEFAULT: '#3B82F6', // Blue 500
      light: '#DBEAFE', // Blue 50
      medium: '#93C5FD', // Blue 300
      dark: '#1D4ED8', // Blue 700
      foreground: '#EFF6FF', // Blue 50
    },
  },

  /**
   * UI Colors - System-Level
   * Base colors for layouts and components
   */
  ui: {
    background: '#FFFFFF',
    foreground: '#1F2937', // Gray 800
    muted: '#F9FAFB', // Gray 50
    mutedForeground: '#6B7280', // Gray 500
    border: '#E5E7EB', // Gray 200
    input: '#E5E7EB', // Gray 200
    ring: '#1F2937', // Gray 800
  },
} as const

/**
 * Convert hex to HSL for Tailwind CSS variables
 * Tailwind expects HSL format: "H S% L%"
 */
export function hexToHSL(hex: string): string {
  // Remove # if present
  hex = hex.replace('#', '')

  // Convert to RGB
  const r = parseInt(hex.substring(0, 2), 16) / 255
  const g = parseInt(hex.substring(2, 4), 16) / 255
  const b = parseInt(hex.substring(4, 6), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
}

/**
 * HSL values for CSS variables
 * Pre-calculated for performance
 */
export const HSL_TOKENS = {
  brand: {
    hotelManager: {
      primary: '274 70% 60%', // #9D4EDD
      primaryForeground: '0 0% 100%',
    },
    traveller: {
      primary: '350 89% 60%', // #FF385C
      primaryForeground: '0 0% 100%',
    },
    tourOperator: {
      primary: '4 98% 66%', // #FD5E53
      primaryForeground: '0 0% 100%',
    },
  },
  semantic: {
    success: '142 71% 45%', // #10B981
    successForeground: '138 76% 97%',
    warning: '38 92% 50%', // #F59E0B
    warningForeground: '48 96% 89%',
    error: '0 72% 51%', // #EF4444
    errorForeground: '0 86% 97%',
    info: '221 83% 53%', // #3B82F6
    infoForeground: '221 91% 91%',
  },
} as const

export default DESIGN_TOKENS
