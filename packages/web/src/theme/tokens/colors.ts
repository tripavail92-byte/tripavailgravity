/**
 * Color Design Tokens
 *
 * Single source of truth for all color values in the application.
 * All colors use HSL format for better manipulation and consistency.
 */

export const colorTokens = {
  // ============================================
  // LIGHT MODE COLORS
  // ============================================
  light: {
    background: {
      primary: '0 0% 100%', // Pure white
      secondary: '0 0% 98%', // Off-white
      tertiary: '0 0% 96%', // Light gray
      surface: '0 0% 100%', // Card backgrounds
      overlay: '0 0% 0% / 0.5', // Modal overlay (50% black)
      hover: '0 0% 96%', // Hover states
    },
    foreground: {
      primary: '222.2 84% 4.9%', // Near black (text)
      secondary: '215.4 16.3% 46.9%', // Medium gray
      tertiary: '215 20.2% 65.1%', // Light gray
      disabled: '214.3 31.8% 91.4%', // Very light gray
    },
    border: {
      primary: '214.3 31.8% 91.4%', // Light gray border
      secondary: '214.3 31.8% 85%', // Slightly darker
      focus: '222.2 84% 4.9%', // Focus ring
      hover: '214.3 31.8% 80%', // Hover border
    },
  },

  // ============================================
  // DARK MODE COLORS (Slate/Navy - Premium Feel)
  // ============================================
  dark: {
    background: {
      primary: '222.2 47.4% 11.2%', // Slate background (#1A202C) - not pure black
      secondary: '217.2 32.6% 17.5%', // Slightly lighter slate
      tertiary: '215.4 16.3% 25%', // Medium slate
      surface: '222.2 47.4% 11.2%', // Card backgrounds
      overlay: '0 0% 0% / 0.8', // Modal overlay (80% black)
      hover: '217.2 32.6% 20%', // Hover states
    },
    foreground: {
      primary: '210 40% 98%', // Near white (text)
      secondary: '215 20.2% 65.1%', // Medium gray
      tertiary: '215.4 16.3% 46.9%', // Darker gray
      disabled: '217.2 32.6% 30%', // Very dark gray
    },
    border: {
      primary: '217.2 32.6% 20%', // Subtle borders
      secondary: '217.2 32.6% 25%', // Slightly lighter
      focus: '212.7 26.8% 83.9%', // Focus ring (light)
      hover: '217.2 32.6% 30%', // Hover border
    },
  },

  // ============================================
  // ROLE-BASED BRAND COLORS
  // ============================================
  roles: {
    traveller: {
      primary: '350.5 100% 60%', // #FF385C (Airbnb-style rose)
      primaryHover: '350.5 100% 55%',
      primaryActive: '350.5 100% 50%',
      primaryForeground: '0 0% 100%',
      gradient: 'linear-gradient(135deg, hsl(350.5 100% 60%) 0%, hsl(350.5 100% 70%) 100%)',
    },
    hotelManager: {
      primary: '274 70% 60%', // #9D4EDD (Purple)
      primaryHover: '274 70% 55%',
      primaryActive: '274 70% 50%',
      primaryForeground: '0 0% 100%',
      gradient: 'linear-gradient(135deg, hsl(274 70% 60%) 0%, hsl(186 100% 50%) 100%)',
    },
    tourOperator: {
      primary: '4 98% 66%', // #FD5E53 (Coral)
      primaryHover: '4 98% 61%',
      primaryActive: '4 98% 56%',
      primaryForeground: '0 0% 100%',
      gradient: 'linear-gradient(135deg, hsl(4 98% 66%) 0%, hsl(4 98% 76%) 100%)',
    },
  },

  // ============================================
  // SEMANTIC COLORS (Status & Feedback)
  // ============================================
  semantic: {
    success: {
      DEFAULT: '142 71% 45%', // Green
      foreground: '138 76% 97%',
      light: '142 76% 36%',
      dark: '142 71% 55%',
    },
    warning: {
      DEFAULT: '38 92% 50%', // Amber
      foreground: '48 96% 89%',
      light: '38 92% 40%',
      dark: '38 92% 60%',
    },
    error: {
      DEFAULT: '0 84.2% 60.2%', // Red
      foreground: '0 0% 100%',
      light: '0 84.2% 50.2%',
      dark: '0 84.2% 70.2%',
    },
    info: {
      DEFAULT: '199 89% 48%', // Blue
      foreground: '0 0% 100%',
      light: '199 89% 38%',
      dark: '199 89% 58%',
    },
  },

  // ============================================
  // COMPONENT-SPECIFIC COLORS
  // ============================================
  components: {
    card: {
      light: '0 0% 100%',
      dark: '222.2 84% 4.9%',
    },
    popover: {
      light: '0 0% 100%',
      dark: '222.2 84% 4.9%',
    },
    input: {
      light: '214.3 31.8% 91.4%',
      dark: '217.2 32.6% 17.5%',
    },
    ring: {
      light: '222.2 84% 4.9%',
      dark: '212.7 26.8% 83.9%',
    },
  },
  // ============================================
  // CATEGORIES (Brand Taxonomy)
  // ============================================
  categories: {
    budget: {
      DEFAULT: '142 71% 45%', // Green (money-saving)
      light: '142 71% 95%',
      dark: '142 71% 20%',
    },
    adventure: {
      DEFAULT: '25 95% 53%', // Orange (energetic)
      light: '25 95% 95%',
      dark: '25 95% 25%',
    },
    luxury: {
      DEFAULT: '274 70% 60%', // Purple (premium)
      light: '274 70% 95%',
      dark: '274 70% 25%',
    },
    romantic: {
      DEFAULT: '350 100% 60%', // Rose (love)
      light: '350 100% 95%',
      dark: '350 100% 25%',
    },
    family: {
      DEFAULT: '328 86% 70%', // Pink (warm)
      light: '328 86% 95%',
      dark: '328 86% 30%',
    },
    weekend: {
      DEFAULT: '221 83% 53%', // Blue (relaxed)
      light: '221 83% 95%',
      dark: '221 83% 25%',
    },
  },
} as const

export type ColorTokens = typeof colorTokens
