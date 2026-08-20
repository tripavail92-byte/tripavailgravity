import { BadgeCheck, CalendarCheck, CreditCard, Search, Wallet } from 'lucide-react'
import { Link } from 'react-router-dom'

/**
 * The non-inventory homepage sections: why to trust TripAvail, how booking works,
 * price entry points, and the operator supply CTA.
 *
 * These carry no claim the product can't back — the trust band describes how the
 * marketplace actually works rather than asserting per-listing badges.
 */

export function TrustBand() {
  const items = [
    {
      Icon: BadgeCheck,
      title: 'Verified operators',
      body: 'Operators complete identity and business checks before their trips go live.',
    },
    {
      Icon: CreditCard,
      title: 'Secure checkout',
      body: 'You pay TripAvail — never a stranger’s personal account.',
    },
    {
      Icon: CalendarCheck,
      title: 'Clear terms upfront',
      body: 'Departure, price and cancellation policy shown before you pay.',
    },
  ]
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid gap-4 rounded-3xl border border-border/60 bg-muted/20 p-5 sm:grid-cols-3 sm:p-6">
        {items.map(({ Icon, title, body }) => (
          <div key={title} className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">{title}</p>
              <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

/** Price entry points — /search already understands minPrice/maxPrice. */
export function BudgetChips() {
  const bands = [
    { label: 'Under ₨25,000', params: 'maxPrice=25000' },
    { label: '₨25k – ₨50k', params: 'minPrice=25000&maxPrice=50000' },
    { label: '₨50k – ₨100k', params: 'minPrice=50000&maxPrice=100000' },
    { label: '₨100,000+', params: 'minPrice=100000' },
  ]
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-4 flex items-center gap-2">
        <Wallet className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Trips by budget
        </h2>
      </div>
      <div className="flex flex-wrap gap-2.5">
        {bands.map((b) => (
          <Link
            key={b.label}
            to={`/search?types=tour&sort=price_asc&${b.params}`}
            className="rounded-full border border-border/70 bg-background px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            {b.label}
          </Link>
        ))}
      </div>
    </section>
  )
}

export function HowItWorks() {
  const steps = [
    {
      Icon: Search,
      title: 'Find your trip',
      body: 'Browse trips by destination, length or budget — with real photos and full itineraries.',
    },
    {
      Icon: CreditCard,
      title: 'Book your seat',
      body: 'Pay securely online. Some operators take a deposit now and the rest before departure.',
    },
    {
      Icon: CalendarCheck,
      title: 'Meet your operator',
      body: 'Get your pickup point and operator contact — then just show up and travel.',
    },
  ]
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h2 className="mb-6 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        How TripAvail works
      </h2>
      <ol className="grid gap-5 sm:grid-cols-3">
        {steps.map(({ Icon, title, body }, i) => (
          <li
            key={title}
            className="relative rounded-2xl border border-border/60 bg-background p-5"
          >
            <div className="mb-3 flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {i + 1}
              </span>
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <p className="font-semibold text-foreground">{title}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}

/** Supply is the binding constraint at this catalogue size — ask for it on the homepage. */
export function OperatorCta() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-3xl bg-[#0C1322] px-6 py-10 sm:px-10">
        <div className="flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Run tours in the north? List them on TripAvail.
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-white/70 sm:text-base">
              Reach travellers searching for trips like yours — and get paid securely for every
              seat.
            </p>
            <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/85">
              <li>· Free to list</li>
              <li>· Verified-operator badge</li>
              <li>· Secure online payments</li>
            </ul>
          </div>
          <Link
            to="/partner/onboarding"
            className="shrink-0 rounded-full bg-primary px-7 py-3.5 text-base font-bold text-primary-foreground shadow-lg transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          >
            Start listing
          </Link>
        </div>
      </div>
    </section>
  )
}
