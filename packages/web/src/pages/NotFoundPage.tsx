import { Compass, Home } from 'lucide-react'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'

/**
 * Real 404. The router previously sent every unknown URL to the homepage (a silent soft-404 that
 * masks broken links and confuses search engines); this gives visitors an honest dead-end with a
 * way back. Rendered by the catch-all route in App.tsx.
 */
export default function NotFoundPage() {
  const navigate = useNavigate()

  useEffect(() => {
    const previous = document.title
    document.title = 'Page not found · TripAvail'
    return () => {
      document.title = previous
    }
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="max-w-md text-center">
        <p className="text-7xl font-black tracking-tight text-primary">404</p>
        <h1 className="mt-3 text-2xl font-bold text-foreground">This trail doesn’t exist</h1>
        <p className="mt-2 text-muted-foreground">
          The page you’re looking for may have moved, or the link is broken. Let’s get you back on
          route.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button onClick={() => navigate('/')}>
            <Home className="mr-2 h-4 w-4" />
            Back home
          </Button>
          <Button variant="outline" onClick={() => navigate('/tours')}>
            <Compass className="mr-2 h-4 w-4" />
            Browse trips
          </Button>
        </div>
      </div>
    </div>
  )
}
