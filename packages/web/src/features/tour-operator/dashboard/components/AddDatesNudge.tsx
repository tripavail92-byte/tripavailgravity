import { AlertTriangle, ArrowRight, CalendarPlus, CheckCircle2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { TourBookability } from '@/features/tour-operator/hooks/useTourBookability'

/**
 * The friendly, actionable nudge at the top of the operator dashboard.
 *
 * Rather than let tours quietly become unbookable, this names the exact tours that need
 * dates and gives a one-click way to fix each — framed as "here's how to sell more",
 * not "you did something wrong".
 */
export function AddDatesNudge({
  unbookable,
  thin,
  onAddDates,
}: {
  unbookable: TourBookability[]
  thin: TourBookability[]
  onAddDates: (tourId: string) => void
}) {
  // Nothing to nudge — every live tour is bookable. Say so briefly; it's reassuring.
  if (unbookable.length === 0 && thin.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-success/25 bg-success/5 px-4 py-3">
        <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
        <p className="text-sm font-medium text-foreground">
          All your live tours have upcoming departures — travellers can book every one.
        </p>
      </div>
    )
  }

  const critical = unbookable.length > 0

  return (
    <div
      className={`rounded-3xl border p-5 ${
        critical ? 'border-destructive/30 bg-destructive/5' : 'border-warning/30 bg-warning/5'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
            critical ? 'bg-destructive/10' : 'bg-warning/10'
          }`}
        >
          <AlertTriangle className={`h-5 w-5 ${critical ? 'text-destructive' : 'text-warning'}`} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold text-foreground">
            {critical
              ? `${unbookable.length} ${unbookable.length === 1 ? 'tour' : 'tours'} can’t be booked right now`
              : `Add more departures to sell more seats`}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {critical
              ? 'These tours are live but have no upcoming dates, so travellers can’t book them. Add a departure date to open them for booking.'
              : 'These tours have only one upcoming date left. Add more so travellers have a choice and you don’t sell out to a dead end.'}
          </p>

          <ul className="mt-4 space-y-2">
            {[...unbookable, ...thin].slice(0, 6).map(({ tour, status, upcomingCount }) => (
              <li
                key={tour.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{tour.title}</p>
                  <p className="text-xs font-medium">
                    {status === 'unbookable' ? (
                      <span className="text-destructive">No upcoming dates</span>
                    ) : (
                      <span className="text-warning">{upcomingCount} date left — add more</span>
                    )}
                  </p>
                </div>
                <Button
                  size="sm"
                  className="shrink-0 rounded-full"
                  onClick={() => onAddDates(tour.id)}
                >
                  <CalendarPlus className="mr-1.5 h-4 w-4" />
                  Add dates
                </Button>
              </li>
            ))}
          </ul>

          {unbookable.length + thin.length > 6 ? (
            <p className="mt-3 flex items-center gap-1 text-xs font-medium text-muted-foreground">
              and {unbookable.length + thin.length - 6} more
              <ArrowRight className="h-3 w-3" />
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
