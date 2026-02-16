import type { Config } from 'tailwindcss'
import tailwindcssAnimate from 'tailwindcss-animate'

import { radiusTokens, shadowTokens, spacingTokens, typographyTokens } from './src/theme/tokens'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      // Use centralized spacing tokens
      spacing: spacingTokens.space,

      // Use centralized typography tokens
      fontFamily: typographyTokens.fontFamily,
      fontSize: typographyTokens.fontSize,
      fontWeight: typographyTokens.fontWeight,
      letterSpacing: typographyTokens.letterSpacing,
      lineHeight: typographyTokens.lineHeight,

      // Use centralized shadow tokens
      boxShadow: shadowTokens.boxShadow,
      dropShadow: shadowTokens.dropShadow,

      // Use centralized radius tokens
      borderRadius: radiusTokens.borderRadius,

      backgroundImage: {
        'primary-gradient': 'var(--primary-gradient)',
        'glass-gradient-light':
          'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
        'glass-gradient-dark': 'linear-gradient(135deg, rgba(0,0,0,0.2), rgba(0,0,0,0.1))',
      },
      backdropBlur: {
        xs: '2px',
        '4xl': '80px',
      },
      // Colors use CSS variables for dynamic theming
      colors: {
        glass: {
          light: 'rgba(255, 255, 255, 0.1)',
          'light-border': 'rgba(255, 255, 255, 0.2)',
          dark: 'rgba(0, 0, 0, 0.1)',
          'dark-border': 'rgba(255, 255, 255, 0.1)',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // Semantic colors for validation and status
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
        },
        error: {
          DEFAULT: 'hsl(var(--error))',
          foreground: 'hsl(var(--error-foreground))',
        },
        info: {
          DEFAULT: 'hsl(var(--info))',
          foreground: 'hsl(var(--info-foreground))',
        },
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [tailwindcssAnimate],
}

export default config
