/**
 * Design Tokens - Central Export
 *
 * Import all design tokens from a single location.
 * This is the single source of truth for all design values.
 */

export * from './colors'
export * from './motion'
export * from './radius'
export * from './semantic'
export * from './shadows'
export * from './spacing'
export * from './typography'
export * from './zIndex'

import { colorTokens } from './colors'
import { motionTokens } from './motion'
import { radiusTokens } from './radius'
import { semanticTokens } from './semantic'
import { shadowTokens } from './shadows'
import { spacingTokens } from './spacing'
import { typographyTokens } from './typography'
import { zIndexTokens } from './zIndex'

/**
 * All design tokens in one object
 */
export const tokens = {
  colors: colorTokens,
  spacing: spacingTokens,
  typography: typographyTokens,
  shadows: shadowTokens,
  radius: radiusTokens,
  motion: motionTokens,
  zIndex: zIndexTokens,
  semantic: semanticTokens,
} as const

export default tokens
