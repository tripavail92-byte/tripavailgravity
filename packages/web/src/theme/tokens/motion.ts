/**
 * Motion Design Tokens
 *
 * Consistent animation and transition timing.
 * Creates polished, professional user experience.
 */

export const motionTokens = {
  // Transition Durations
  duration: {
    instant: '0ms',
    fast: '150ms', // Quick interactions (hover states)
    base: '250ms', // Default transitions
    slow: '400ms', // Complex animations
    slower: '600ms', // Page transitions
  },

  // Easing Functions
  easing: {
    // Standard easing for most transitions
    standard: 'cubic-bezier(0.4, 0.0, 0.2, 1)',

    // Accelerate (slow start, fast end)
    accelerate: 'cubic-bezier(0.4, 0.0, 1, 1)',

    // Decelerate (fast start, slow end)
    decelerate: 'cubic-bezier(0.0, 0.0, 0.2, 1)',

    // Sharp (instant start/end)
    sharp: 'cubic-bezier(0.4, 0.0, 0.6, 1)',

    // Bounce
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },

  // Common Transition Presets
  transition: {
    all: 'all 250ms cubic-bezier(0.4, 0.0, 0.2, 1)',
    colors: 'color, background-color, border-color 250ms cubic-bezier(0.4, 0.0, 0.2, 1)',
    transform: 'transform 250ms cubic-bezier(0.4, 0.0, 0.2, 1)',
    opacity: 'opacity 250ms cubic-bezier(0.4, 0.0, 0.2, 1)',
  },
} as const

export type MotionTokens = typeof motionTokens
