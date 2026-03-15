import { format } from 'date-fns'
import { BarChart3, CreditCard, Gem, Rocket, Wallet } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/PageHeader'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/hooks/useAuth'
import {
  commercialService,
  type OperatorBillingReportRow,
  type OperatorPayoutReportRow,
} from '@/features/commercial/services/commercialService'

function formatMoney(value: number) {
  return `PKR ${value.toLocaleString()}`
}

function formatDate(value?: string | null) {
  if (!value) return '—'
  return format(new Date(value), 'MMM d, yyyy')
}

function statusTone(status: string) {
  if (status === 'eligible' || status === 'paid') return 'text-emerald-600'
  if (status === 'scheduled') return 'text-sky-600'
  if (status === 'on_hold') return 'text-amber-600'
  return 'text-muted-foreground'
}

export default function OperatorCommercialPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [billingRows, setBillingRows] = useState<OperatorBillingReportRow[]>([])
  const [payoutRows, setPayoutRows] = useState<OperatorPayoutReportRow[]>([])
  const [profile, setProfile] = useState<Awaited<ReturnType<typeof commercialService.getOperatorCommercialOverview>>['profile']>(null)
  const [tier, setTier] = useState<Awaited<ReturnType<typeof commercialService.getOperatorCommercialOverview>>['tier']>(null)
  const [performance, setPerformance] = useState<Awaited<ReturnType<typeof commercialService.getOperatorCommercialOverview>>['performance']>(null)
  const [payoutBatches, setPayoutBatches] = useState<Awaited<ReturnType<typeof commercialService.getOperatorCommercialOverview>>['payoutBatches']>([])

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      if (!user?.id) return

      try {
        setLoading(true)
        const overview = await commercialService.getOperatorCommercialOverview(user.id)
        if (cancelled) return

        setProfile(overview.profile)
        setTier(overview.tier)
        setPerformance(overview.performance)
        setBillingRows(overview.billingRows)
        setPayoutRows(overview.payoutRows)
        setPayoutBatches(overview.payoutBatches)
        setError(null)
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Failed to load commercial data')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [user?.id])

  const eligibleBalance = useMemo(
    () => payoutRows.filter((row) => row.payout_status === 'eligible').reduce((sum, row) => sum + row.operator_payable_amount, 0),
    [payoutRows],
  )

  const stats = [
    {
      label: 'Current tier',
      value: tier?.display_name ?? '—',
      icon: Gem,
      caption: `${profile?.commission_rate ?? 0}% commission`,
    },
    {
      label: 'Cycle GMV',
      value: formatMoney(performance?.gmv ?? 0),
      icon: Rocket,
      caption: `${performance?.published_trips ?? 0} published trips`,
    },
    {
      label: 'Eligible payouts',
      value: formatMoney(eligibleBalance),
      icon: Wallet,
      caption: `${payoutRows.filter((row) => row.payout_status === 'eligible').length} items ready`,
    },
    {
      label: 'Next billing date',
      value: formatDate(profile?.next_billing_date),
      icon: CreditCard,
      caption: `${profile?.monthly_published_tours_count ?? 0}/${tier?.monthly_publish_limit ?? 0} publish slots used`,
    },
  ]

  return (
    <div className="min-h-screen bg-background pb-16">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          title="Commercial"
          subtitle="Track your tier, billing, payout readiness, and cycle performance from the database-backed commercial layer."
          showBackButton={false}
          actions={
            <Button asChild variant="outline" className="rounded-2xl">
              <Link to="/operator/tours/new">Create trip</Link>
            </Button>
          }
        />

        {error ? (
          <div className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="rounded-3xl border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <stat.icon className="h-4 w-4" />
                  {stat.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-foreground">{loading ? 'Loading…' : stat.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{stat.caption}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="overview" className="mt-8">
          <TabsList className="h-auto rounded-2xl bg-muted/70 p-1">
            <TabsTrigger value="overview" className="rounded-2xl">Overview</TabsTrigger>
            <TabsTrigger value="billing" className="rounded-2xl">Billing</TabsTrigger>
            <TabsTrigger value="payouts" className="rounded-2xl">Payouts</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 pt-4">
            <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
              <Card className="rounded-3xl border-border/60">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg"><BarChart3 className="h-5 w-5" />Cycle performance</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <Metric label="Confirmed bookings" value={String(performance?.confirmed_bookings ?? 0)} />
                  <Metric label="Commission earned" value={formatMoney(performance?.commission_paid ?? 0)} />
                  <Metric label="Payouts received" value={formatMoney(performance?.payouts_received ?? 0)} />
                  <Metric label="AI credits used" value={`${profile?.ai_credits_used_current_cycle ?? 0}/${tier?.ai_monthly_credits ?? 0}`} />
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-border/60">
                <CardHeader>
                  <CardTitle className="text-lg">Tier entitlements</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <Entitlement label="Multi-city pickup" enabled={Boolean(tier?.pickup_multi_city_enabled)} />
                  <Entitlement label="Google Maps support" enabled={Boolean(tier?.google_maps_enabled)} />
                  <Entitlement label="AI itinerary tools" enabled={Boolean(tier?.ai_itinerary_enabled)} />
                  <Entitlement label="Cycle publish limit" enabled description={`${tier?.monthly_publish_limit ?? 0} trips`} />
                </CardContent>
              </Card>
            </div>

            <Card className="rounded-3xl border-border/60">
              <CardHeader>
                <CardTitle className="text-lg">Recent payout batches</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Batch</TableHead>
                      <TableHead>Scheduled</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Operator payable</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payoutBatches.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">No payout batches yet.</TableCell>
                      </TableRow>
                    ) : (
                      payoutBatches.slice(0, 5).map((batch) => (
                        <TableRow key={batch.id}>
                          <TableCell className="font-medium">{batch.batch_reference}</TableCell>
                          <TableCell>{formatDate(batch.scheduled_for)}</TableCell>
                          <TableCell className={statusTone(batch.status)}>{batch.status}</TableCell>
                          <TableCell className="text-right">{formatMoney(batch.total_operator_payable)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing" className="pt-4">
            <Card className="rounded-3xl border-border/60">
              <CardHeader>
                <CardTitle className="text-lg">Billing cycles and invoices</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cycle</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Final charge</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {billingRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">No billing cycles available.</TableCell>
                      </TableRow>
                    ) : (
                      billingRows.map((row) => (
                        <TableRow key={row.billing_cycle_id}>
                          <TableCell>{formatDate(row.cycle_start)} to {formatDate(row.cycle_end)}</TableCell>
                          <TableCell className="capitalize">{row.membership_tier_code}</TableCell>
                          <TableCell>{row.invoice_number ?? 'Draft pending'}</TableCell>
                          <TableCell className="capitalize">{row.invoice_status}</TableCell>
                          <TableCell className="text-right">{formatMoney(row.final_membership_charge)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payouts" className="pt-4">
            <Card className="rounded-3xl border-border/60">
              <CardHeader>
                <CardTitle className="text-lg">Booking-level payout queue</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Trip</TableHead>
                      <TableHead>Travel date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Batch</TableHead>
                      <TableHead className="text-right">Payable</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payoutRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">No payout items found.</TableCell>
                      </TableRow>
                    ) : (
                      payoutRows.map((row) => (
                        <TableRow key={row.payout_item_id}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-foreground">{row.trip_name ?? 'Trip booking'}</p>
                              <p className="text-xs text-muted-foreground">Booking {row.booking_id.slice(0, 8).toUpperCase()}</p>
                            </div>
                          </TableCell>
                          <TableCell>{formatDate(row.travel_date)}</TableCell>
                          <TableCell className={statusTone(row.payout_status)}>{row.payout_status}</TableCell>
                          <TableCell>{row.batch_reference ?? 'Unbatched'}</TableCell>
                          <TableCell className="text-right">{formatMoney(row.operator_payable_amount)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-xl font-semibold text-foreground">{value}</p>
    </div>
  )
}

function Entitlement({ label, enabled, description }: { label: string; enabled: boolean; description?: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-muted/20 px-4 py-3">
      <div>
        <p className="font-medium text-foreground">{label}</p>
        {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
      </div>
      <span className={enabled ? 'text-emerald-600' : 'text-muted-foreground'}>{enabled ? 'Enabled' : 'Locked'}</span>
    </div>
  )
}