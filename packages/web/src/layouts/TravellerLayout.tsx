import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'

import { SiteFooter } from '@/components/layout/SiteFooter'
import { useLocaleDirection } from '@/hooks/useT'
import { useCurrencyAutoDetect } from '@/store/currencyStore'
import { useLocaleAutoDetect } from '@/store/localeStore'

export default function TravellerLayout() {
  // Auto-pick the traveller's display currency from their locale on first visit
  // (a UAE visitor lands on AED); an explicit switcher choice always wins.
  useCurrencyAutoDetect()
  // Same for language (Gulf timezones → Arabic) + keep <html dir> in sync (RTL for Arabic).
  useLocaleAutoDetect()
  useLocaleDirection()

  return (
    <div
      className="min-h-screen bg-background font-sans"
      style={
        {
          // Override Primary Color to Airbnb Rose for Traveller Experience
          // #FF385C -> HSL 351 100% 61%
          '--primary': '351 100% 61%',
          '--primary-foreground': '0 0% 100%',
        } as React.CSSProperties
      }
    >
      <main className="min-h-screen relative">
        <Outlet />
      </main>

      <SiteFooter />
    </div>
  )
}
