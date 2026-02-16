/**
 * Design Tokens - Central Export
 * 
 * Import all design tokens from a single location.
 * This is the single source of truth for all design values.
 */

export * from './colors'
export * from './spacing'
export * from './typography'
export * from './shadows'
export * from './radius'

import { colorTokens } from './colors'
import { spacingTokens } from './spacing'
import { typographyTokens } from './typography'
import { shadowTokens } from './shadows'
import { radiusTokens } from './radius'

/**
 * All design tokens in one object
 */
export const tokens = {
  colors: colorTokens,
  spacing: spacingTokens,
  typography: typographyTokens,
  shadows: shadowTokens,
  radius: radiusTokens,
} as const

export default tokens
