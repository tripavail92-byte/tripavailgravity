/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './theme/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Brand — ROLE-DRIVEN. `--primary` is swapped at runtime by ThemeProvider
        // based on the active role (traveller rose / operator coral / manager
        // purple), mirroring the web `:root[data-role='…']` system. The numeric
        // steps are translucent tints of the same brand hue so existing
        // `primary-50…900` classes keep working and re-tint per role.
        primary: {
          DEFAULT: 'hsl(var(--primary) / <alpha-value>)',
          foreground: 'hsl(var(--primary-foreground) / <alpha-value>)',
          light: 'hsl(var(--primary-light) / <alpha-value>)',
          50: 'hsl(var(--primary) / 0.08)',
          100: 'hsl(var(--primary) / 0.14)',
          200: 'hsl(var(--primary) / 0.24)',
          300: 'hsl(var(--primary) / 0.42)',
          400: 'hsl(var(--primary) / 0.70)',
          500: 'hsl(var(--primary) / <alpha-value>)',
          600: 'hsl(var(--primary) / <alpha-value>)',
          700: 'hsl(var(--primary) / <alpha-value>)',
          800: 'hsl(var(--primary) / <alpha-value>)',
          900: 'hsl(var(--primary) / <alpha-value>)',
        },
        // Text — ROLE-NEUTRAL but MODE-DRIVEN. `--ink*` are swapped at runtime by
        // ThemeProvider for light/dark (premium slate dark theme).
        ink: {
          DEFAULT: 'hsl(var(--ink) / <alpha-value>)',
          muted: 'hsl(var(--ink-muted) / <alpha-value>)',
          soft: 'hsl(var(--ink-soft) / <alpha-value>)',
        },
        // Surfaces — mode-driven (light slate-white / dark slate-navy).
        surface: {
          DEFAULT: 'hsl(var(--surface-card) / <alpha-value>)', // cards
          page: 'hsl(var(--surface-page) / <alpha-value>)', // screen background
          sunken: 'hsl(var(--surface-sunken) / <alpha-value>)', // inset / chips
        },
        line: 'hsl(var(--line) / <alpha-value>)', // hairline borders
        // Semantic
        success: { DEFAULT: '#16a34a', bg: '#dcfce7', fg: '#15803d' },
        warning: { DEFAULT: '#d97706', bg: '#fef3c7', fg: '#b45309' },
        danger: { DEFAULT: '#dc2626', bg: '#fee2e2', fg: '#b91c1c' },
      },
      borderRadius: {
        '4xl': '28px',
      },
    },
  },
  plugins: [],
}
