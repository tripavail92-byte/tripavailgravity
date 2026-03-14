import { ArrowRight, FileText, Lock, RefreshCcw, Shield } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/glass'
import { PageHeader } from '@/components/ui/PageHeader'

const LEGAL_LINKS = [
  {
    title: 'Terms of Service',
    description: 'Platform usage terms, operator responsibilities, and general service rules.',
    href: '/terms',
    icon: FileText,
  },
  {
    title: 'Privacy Policy',
    description: 'How TripAvail handles account, booking, and traveler data.',
    href: '/privacy',
    icon: Lock,
  },
  {
    title: 'Refund & cancellation policy',
    description: 'Consumer-facing refund mechanics and cancellation handling that affect operator operations.',
    href: '/refunds',
    icon: RefreshCcw,
  },
  {
    title: 'Contact & dispute support',
    description: 'Use this route for formal support requests, booking disputes, and documented escalations.',
    href: '/contact',
    icon: Shield,
  },
]

export default function LegalPoliciesHubPage() {
  return (
    <div className="min-h-screen bg-background pb-16">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          title="Legal & Policies"
          subtitle="Central operator policy hub, modeled on marketplace partner centers: clear document routing, refund visibility, and dispute escalation paths."
          showBackButton={false}
        />

        <GlassCard variant="card" className="mb-6 rounded-3xl p-8">
          <h2 className="text-3xl font-black text-foreground">Know the rules behind every booking flow</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
            These documents already exist in the platform. This hub makes them reachable from the operator drawer so the legal path matches the rest of the operator workflow instead of dropping users into orphaned pages.
          </p>
        </GlassCard>

        <div className="grid gap-4 md:grid-cols-2">
          {LEGAL_LINKS.map((item) => (
            <GlassCard key={item.title} variant="card" className="rounded-3xl p-6">
              <div className="rounded-2xl bg-primary/12 p-3 text-primary w-fit">
                <item.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-black text-foreground">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
              <Button asChild variant="outline" className="mt-5 rounded-2xl border-border/60 bg-background/60 hover:bg-accent">
                <Link to={item.href}>
                  Open document
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </GlassCard>
          ))}
        </div>
      </div>
    </div>
  )
}