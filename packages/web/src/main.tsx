import './index.css'

import React from 'react'
import ReactDOM from 'react-dom/client'

import App from './App.tsx'
import { GlobalErrorBoundary } from './components/GlobalErrorBoundary'
import { ThemeProvider } from './theme/ThemeContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GlobalErrorBoundary>
      <ThemeProvider defaultMode="system" storageKey="tripavail-theme-mode">
        <App />
      </ThemeProvider>
    </GlobalErrorBoundary>
  </React.StrictMode>,
)

