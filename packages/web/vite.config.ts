import react from '@vitejs/plugin-react'
/// <reference types="vitest" />
import path from 'path'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  envDir: '../../',
  resolve: {
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
