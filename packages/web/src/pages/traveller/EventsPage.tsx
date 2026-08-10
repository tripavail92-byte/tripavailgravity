import { CalendarDays, MapPin, Ticket } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import { ExploreControls } from '@/components/home/ExploreControls'
import { Button } from '@/components/ui/button'

/**
 * Events landing — a "coming soon" placeholder. Events are a planned partner role
 * (concerts, festivals, workshops, admission tickets) that isn't built yet; this
 * gives the Hotels · Tours · Events nav a real destination without faking listings.
 */
export default function EventsPage() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 pt-10">
        {/* Same search + Hotels/Tours/Events row as every other browse page. */}
        <ExploreControls
          activeMode="events"
          onModeSelect={(m) => navigate(m === 'hotels' ? '/hotels' : m === 'tours' ? '/tours' : '/events')}
        />
      </div>
      <main className="max-w-3xl mx-auto px-4 py-16 md:py-20 text-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-6">
          <Ticket className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-3 text-balance">Events are coming</h1>
        <p className="text-muted-foreground text-lg mb-10 max-w-xl mx-auto">
          Concerts, festivals, workshops and local experiences — with real tickets, booked and
          verified on TripAvail. We&apos;re building it now.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12 text-left">
          {[
            { icon: CalendarDays, title: 'Live dates', body: 'Concerts, sports and festival line-ups with real timings.' },
            { icon: Ticket, title: 'Verified tickets', body: 'General, VIP and group tickets — no fakes, no resale.' },
            { icon: MapPin, title: 'Near your trip', body: "What's on where you're staying, alongside stays and tours." },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border border-border/60 bg-muted/20 p-5">
              <f.icon className="w-5 h-5 text-primary mb-3" />
              <div className="font-semibold text-foreground">{f.title}</div>
              <p className="text-sm text-muted-foreground mt-1">{f.body}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild className="rounded-xl">
            <Link to="/hotels">Browse hotels</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-xl">
            <Link to="/tours">Browse tours</Link>
          </Button>
        </div>
      </main>
    </div>
  )
}
