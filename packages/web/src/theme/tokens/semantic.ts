/**
 * Semantic (Intent-Based) Design Tokens
 *
 * These tokens represent INTENT rather than raw colors.
 * Components should use these instead of direct color tokens.
 *
 * Example: Use `surface.card` instead of `background.primary`
 */

export const semanticTokens = {
  // Surface Tokens (Backgrounds)
  surface: {
    default: 'var(--surface-default)', // Main page background
    raised: 'var(--surface-raised)', // Elevated cards
    card: 'var(--surface-card)', // Card backgrounds
    popover: 'var(--surface-popover)', // Popover/dropdown backgrounds
    input: 'var(--surface-input)', // Input field backgrounds
    overlay: 'var(--surface-overlay)', // Modal overlay
    hover: 'var(--surface-hover)', // Hover state backgrounds
  },

  // Text Tokens
  text: {
    default: 'var(--text-default)', // Primary text
    muted: 'var(--text-muted)', // Secondary text
    subtle: 'var(--text-subtle)', // Tertiary text
    disabled: 'var(--text-disabled)', // Disabled text
    inverse: 'var(--text-inverse)', // Text on dark backgrounds
    link: 'var(--text-link)', // Links
    linkHover: 'var(--text-link-hover)', // Link hover state
  },

  // Border Tokens
  border: {
    default: 'var(--border-default)', // Standard borders
    subtle: 'var(--border-subtle)', // Lighter borders
    strong: 'var(--border-strong)', // Emphasized borders
    focus: 'var(--border-focus)', // Focus rings
    hover: 'var(--border-hover)', // Hover state borders
    error: 'var(--border-error)', // Error state borders
  },

  // Interactive Tokens (Buttons, Links, Clickable Elements)
  interactive: {
    primary: 'var(--interactive-primary)', // Primary action
    primaryHover: 'var(--interactive-primary-hover)', // Primary hover
    primaryActive: 'var(--interactive-primary-active)', // Primary pressed
    primaryDisabled: 'var(--interactive-primary-disabled)', // Primary disabled

    secondary: 'var(--interactive-secondary)', // Secondary action
    secondaryHover: 'var(--interactive-secondary-hover)', // Secondary hover
    secondaryActive: 'var(--interactive-secondary-active)', // Secondary pressed

    ghost: 'var(--interactive-ghost)', // Subtle/ghost buttons
    ghostHover: 'var(--interactive-ghost-hover)', // Ghost hover

    destructive: 'var(--interactive-destructive)', // Delete/danger actions
    destructiveHover: 'var(--interactive-destructive-hover)', // Destructive hover
  },

  // Status/Feedback Tokens
  status: {
    success: 'var(--status-success)',
    successSubtle: 'var(--status-success-subtle)',

    warning: 'var(--status-warning)',
    warningSubtle: 'var(--status-warning-subtle)',

    error: 'var(--status-error)',
    errorSubtle: 'var(--status-error-subtle)',

    info: 'var(--status-info)',
    infoSubtle: 'var(--status-info-subtle)',
  },
} as const

export type SemanticTokens = typeof semanticTokens
