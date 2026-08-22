import { ArrowRight, BadgeHelp, CreditCard, LifeBuoy, MessageSquare, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/glass'
import { PageHeader } from '@/components/ui/PageHeader'
import { useAuth } from '@/hooks/useAuth'

// The hub is reachable by travellers AND operators. Showing operators' topics (bookings board,
// verification, payout) to a traveller sent them to /operator/* pages they can't open — an
// "Access Denied" dead end. Route the content by role.

const OPERATOR_TOPICS = [
  {
    title: 'Bookings & traveler operations',
    description: 'Handle booking flow questions, departure timing, cancellations, and traveler expectations.',
    icon: MessageSquare,
    cta: '/operator/bookings',
    label: 'Open bookings board',
  },
  {
    title: 'Payments & payout readiness',
    description: 'Review payment state, payout setup, and booking hold behavior before it becomes a support issue.',
    icon: CreditCard,
    cta: '/operator/settings#payout',
    label: 'Review payout settings',
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
    description: 'Refunds, privacy, service terms, and contact escalation points.',
    icon: BadgeHelp,
    cta: '/legal',
    label: 'Open legal hub',
  },
]

const TRAVELLER_TOPICS = [
  {
    title: 'Your trips & bookings',
    description: 'View upcoming and past trips, booking details, pickup points, and confirmations.',
    icon: MessageSquare,
    cta: '/trips',
    label: 'Open my trips',
  },
  {
    title: 'Cancellations & changes',
    description: "Check each tour's cancellation policy and start a change request from the booking.",
    icon: CreditCard,
    cta: '/trips',
    label: 'Manage a booking',
  },
  {
    title: 'Account & preferences',
    description: 'Update your contact details, notification, privacy, and app preferences.',
    icon: ShieldCheck,
    cta: '/settings',
    label: 'Open settings',
  },
  {
    title: 'Terms & privacy',
    description: 'Read our terms of service and privacy policy.',
    icon: BadgeHelp,
    cta: '/terms',
    label: 'Open terms',
  },
]

export default function HelpSupportHubPage() {
  const { activeRole } = useAuth()
  const isOperator =
    activeRole?.role_type === 'tour_operator' || activeRole?.role_type === 'hotel_manager'
  const topics = isOperator ? OPERATOR_TOPICS : TRAVELLER_TOPICS

  return (
    <div className="min-h-screen bg-background pb-16">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          title="Help & Support"
          subtitle={
            isOperator
              ? 'Quick routing to the tools you need — operational topics first, compliance one click away.'
              : 'Find your trips, manage a booking, or reach our team.'
          }
          showBackButton={false}
        />

        <GlassCard variant="card" className="mb-6 rounded-3xl p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                {isOperator ? 'Partner support desk' : 'Traveler support'}
              </p>
              <h2 className="mt-2 text-3xl font-black text-foreground">Get to the right answer fast</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {isOperator
                  ? 'Prioritize actions that unblock a live reservation, then route to compliance, policy, or account support.'
                  : "Start with your trips for anything about a booking, then reach our team if you're stuck."}
              </p>
            </div>
            <Button asChild className="rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90">
              <Link to="/contact">Contact support</Link>
            </Button>
          </div>
        </GlassCard>

        <div className="grid gap-4 md:grid-cols-2">
          {topics.map((topic) => (
            <GlassCard key={topic.title} variant="card" className="rounded-3xl p-6">
              <div className="w-fit rounded-2xl bg-primary/12 p-3 text-primary">
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
              <h3 className="text-lg font-black text-foreground">
                {isOperator ? 'Recommended operator workflow' : 'Still need a hand?'}
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {isOperator
                  ? '1. Check bookings first for any guest-impacting issue. 2. Review calendar availability if a traveler reports an inventory mismatch. 3. Use verification or legal routes for compliance and refunds.'
                  : 'Email support@tripavail.com and include your booking reference — it’s on the trip in “My Trips”.'}
              </p>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
