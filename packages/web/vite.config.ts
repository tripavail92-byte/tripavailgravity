import react from '@vitejs/plugin-react'
/// <reference types="vitest" />
import path from 'path'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  envDir: '../../',
  resolve: {
    // Force a single physical copy of these across the app and any transitively
    // hoisted consumers (e.g. @tanstack/react-query-devtools, an undeclared dep in
    // this pnpm monorepo that otherwise pre-bundles its own react-query copy and
    // breaks React context — "No QueryClient set"). The repo also has both React 18
    // (web) and 19 (mobile) installed, so pinning react/react-dom avoids dup-React.
    dedupe: ['react', 'react-dom', '@tanstack/react-query'],
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tripavail/shared': path.resolve(__dirname, '../shared/src'),
    },
  },
  preview: {
    port: parseInt(process.env.PORT || '4173'),
    host: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['cmdk', 'lucide-react', 'date-fns', 'react-day-picker'],
          'vendor-motion': ['motion', 'motion/react'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-stripe': ['@stripe/react-stripe-js', '@stripe/stripe-js'],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    css: true,
  },
} as any)
