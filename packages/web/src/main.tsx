import './index.css'

import React from 'react'
import ReactDOM from 'react-dom/client'

import App from './App.tsx'
import { GlobalErrorBoundary } from './components/GlobalErrorBoundary'
import { reloadForFreshAssets } from './lib/chunkReload'
import { ThemeProvider } from './theme/ThemeContext'

// Force cache invalidation - 2026-02-18
console.info('TripAvail Web v2.0.2')

// First line of defense for stale-deploy chunk 404s: Vite fires this when a preloaded route chunk
// fails to load (a tab opened before a new deploy). Reload once to fetch the current index.html +
// chunks, so the user never sees an error screen for a page that only changed its filename hash.
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault()
  reloadForFreshAssets()
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <GlobalErrorBoundary>
    <ThemeProvider defaultMode="system" storageKey="tripavail-theme-mode">
      <App />
    </ThemeProvider>
  </GlobalErrorBoundary>,
)
