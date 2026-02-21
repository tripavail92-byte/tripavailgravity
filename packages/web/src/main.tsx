import './index.css'

import React from 'react'
import ReactDOM from 'react-dom/client'

import App from './App.tsx'
import { GlobalErrorBoundary } from './components/GlobalErrorBoundary'
import { ThemeProvider } from './theme/ThemeContext'

// Force cache invalidation - 2026-02-18
console.info('TripAvail Web v2.0.1')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <GlobalErrorBoundary>
    <ThemeProvider defaultMode="system" storageKey="tripavail-theme-mode">
      <App />
    </ThemeProvider>
  </GlobalErrorBoundary>,
)
