import { Outlet } from 'react-router-dom'
import { useEffect } from 'react'
import { SiteFooter } from '@/components/layout/SiteFooter'

export default function TravellerLayout() {
  // We can also enforce the data-role attribute here if needed,
  // but CSS variables in the wrapper is cleaner for scoped theming.

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
