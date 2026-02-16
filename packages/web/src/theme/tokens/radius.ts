/**
 * Border Radius Design Tokens
 *
 * Consistent rounding scale for UI elements.
 * Creates cohesive visual language.
 */

export const radiusTokens = {
  borderRadius: {
    none: '0',
    sm: '0.125rem', // 2px - Subtle rounding
    base: '0.25rem', // 4px - Default
    md: '0.375rem', // 6px - Medium
    lg: '0.5rem', // 8px - Large
    xl: '0.75rem', // 12px - Extra large
    '2xl': '1rem', // 16px - Very large
    '3xl': '1.5rem', // 24px - Huge
    '4xl': '2rem', // 32px - Massive
    full: '9999px', // Fully rounded (pills, circles)
  },
} as const

export type RadiusTokens = typeof radiusTokens
