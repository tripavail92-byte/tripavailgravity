/**
 * Z-Index Design Tokens
 *
 * Layering hierarchy for overlapping elements.
 * Prevents z-index wars and maintains consistent stacking.
 */

export const zIndexTokens = {
  zIndex: {
    // Base content
    base: 0,

    // Elevated elements
    dropdown: 1000,
    sticky: 1100,
    fixed: 1200,

    // Overlays
    overlay: 1300,
    drawer: 1400,
    modal: 1500,
    popover: 1600,

    // Notifications
    toast: 1700,
    tooltip: 1800,

    // Top-most
    alert: 1900,
    max: 9999,
  },
} as const

export type ZIndexTokens = typeof zIndexTokens
