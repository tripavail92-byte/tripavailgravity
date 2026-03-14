import { ArrowRight, BadgeHelp, CreditCard, LifeBuoy, MessageSquare, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/glass'
import { PageHeader } from '@/components/ui/PageHeader'

const HELP_TOPICS = [
  {
    title: 'Bookings & traveler operations',
    description: 'Handle booking flow questions, departure timing, cancellations, and traveler expectations using a Booking.com partner playbook structure.',
    icon: MessageSquare,
    cta: '/operator/bookings',
    label: 'Open bookings board',
  },
  {
    title: 'Payments & payout readiness',
    description: 'Review payment state, payout setup, and booking hold behavior before it becomes a support issue.',
    icon: CreditCard,
    cta: '/operator/settings',
    label: 'Review settings',
  },
  {
    title: 'Verification & trust',
    description: 'Resolve KYC blockers, document quality issues, and approval-state questions quickly.',
    icon: ShieldCheck,
    cta: '/operator/verification',
    label: 'Open verification',
  },
  {
    title: 'Legal & policy guidance',
    description: 'Use the operator legal hub for refunds, privacy, service terms, and contact escalation points.',
    icon: BadgeHelp,
    cta: '/legal',
    label: 'Open legal hub',
  },
]

export default function HelpSupportHubPage() {
  return (
    <div className="min-h-screen bg-background pb-16">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          title="Help & Support"
          subtitle="Structured like a modern host help center: quick routing, operational topics first, and legal escalation one click away."
          showBackButton={false}
        />

        <GlassCard variant="card" className="mb-6 rounded-3xl p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Partner support desk</p>
              <h2 className="mt-2 text-3xl font-black text-foreground">Get to the right answer fast</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                This support hub follows the Airbnb and Booking.com host pattern: prioritize actions that unblock a live reservation, then route to compliance, policy, or account support.
              </p>
            </div>
            <Button asChild className="rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90">
              <Link to="/contact">Contact support</Link>
            </Button>
          </div>
        </GlassCard>

        <div className="grid gap-4 md:grid-cols-2">
          {HELP_TOPICS.map((topic) => (
            <GlassCard key={topic.title} variant="card" className="rounded-3xl p-6">
              <div className="rounded-2xl bg-primary/12 p-3 text-primary w-fit">
                <topic.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-black text-foreground">{topic.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{topic.description}</p>
              <Button asChild variant="outline" className="mt-5 rounded-2xl border-border/60 bg-background/60 hover:bg-accent">
                <Link to={topic.cta}>
                  {topic.label}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </GlassCard>
          ))}
        </div>

        <GlassCard variant="light" className="mt-6 rounded-3xl p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-success/12 p-3 text-success">
              <LifeBuoy className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-foreground">Recommended operator workflow</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                1. Check bookings first for any guest-impacting issue. 2. Review calendar availability if a traveler reports inventory mismatch. 3. Use verification or legal routes for compliance and refunds.
              </p>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}