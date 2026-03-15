import { format } from 'date-fns'
import { Banknote, CircleDollarSign, ShieldAlert, Users, Wallet } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {
  commercialService,
  type MembershipTierCode,
  type OperatorCommercialProfile,
} from '@/features/commercial/services/commercialService'

function formatMoney(value: number) {
  return `PKR ${value.toLocaleString()}`
}

function formatDate(value?: string | null) {
  if (!value) return '—'
  return format(new Date(value), 'MMM d, yyyy')
}

export default function AdminCommercialPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedOperatorId, setSelectedOperatorId] = useState<string>('')
  const [tierCode, setTierCode] = useState<MembershipTierCode>('gold')
  const [tierReason, setTierReason] = useState('')
  const [holdReason, setHoldReason] = useState('')
  const [selectedBatchId, setSelectedBatchId] = useState('')
  const [batchActionReason, setBatchActionReason] = useState('')
  const [selectedRecoveryItemId, setSelectedRecoveryItemId] = useState('')
  const [recoveryAmount, setRecoveryAmount] = useState('')
  const [recoveryReason, setRecoveryReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [overview, setOverview] = useState<Awaited<ReturnType<typeof commercialService.getAdminCommercialOverview>> | null>(null)

  const load = async () => {
    try {
      setLoading(true)
      const nextOverview = await commercialService.getAdminCommercialOverview()
      setOverview(nextOverview)
      if (!selectedOperatorId && nextOverview.operatorProfiles[0]?.operator_user_id) {
        const firstOperator = nextOverview.operatorProfiles[0]
        setSelectedOperatorId(firstOperator.operator_user_id)
        setTierCode(firstOperator.membership_tier_code)
        setHoldReason(firstOperator.payout_hold_reason ?? '')
      }
      if (!selectedBatchId && nextOverview.payoutBatches[0]?.id) {
        setSelectedBatchId(nextOverview.payoutBatches[0].id)
      }
      if (!selectedRecoveryItemId) {
        const firstRecoveryItem = nextOverview.payoutRows.find((row) => row.payout_status === 'recovery_pending')
        if (firstRecoveryItem) {
          setSelectedRecoveryItemId(firstRecoveryItem.payout_item_id)
          setRecoveryAmount(firstRecoveryItem.recovery_amount.toString())
        }
      }
      setError(null)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load commercial admin data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const selectedOperator = useMemo<OperatorCommercialProfile | null>(() => {
    return overview?.operatorProfiles.find((profile) => profile.operator_user_id === selectedOperatorId) ?? null
  }, [overview?.operatorProfiles, selectedOperatorId])

  useEffect(() => {
    if (!selectedOperator) return
    setTierCode(selectedOperator.membership_tier_code)
    setHoldReason(selectedOperator.payout_hold_reason ?? '')
  }, [selectedOperator])

  const summaryCards = overview?.financeSummary
    ? [
        { label: 'Customer payments', value: formatMoney(overview.financeSummary.total_customer_payments_collected), icon: CircleDollarSign },
        { label: 'Commission earned', value: formatMoney(overview.financeSummary.total_commission_earned), icon: Banknote },
        { label: 'Held payouts', value: formatMoney(overview.financeSummary.total_held_amounts), icon: ShieldAlert },
        { label: 'Operator payouts', value: formatMoney(overview.financeSummary.total_operator_payouts), icon: Wallet },
      ]
    : []

  const filteredBillingRows = useMemo(() => {
    if (!overview) return []
    if (!selectedOperatorId) return overview.billingRows
    return overview.billingRows.filter((row) => row.operator_user_id === selectedOperatorId)
  }, [overview, selectedOperatorId])

  const filteredPayoutRows = useMemo(() => {
    if (!overview) return []
    if (!selectedOperatorId) return overview.payoutRows
    return overview.payoutRows.filter((row) => row.operator_user_id === selectedOperatorId)
  }, [overview, selectedOperatorId])

  const selectedBatch = useMemo(() => {
    return overview?.payoutBatches.find((batch) => batch.id === selectedBatchId) ?? null
  }, [overview?.payoutBatches, selectedBatchId])

  const recoveryRows = useMemo(() => {
    return filteredPayoutRows.filter((row) => row.payout_status === 'recovery_pending')
  }, [filteredPayoutRows])

  const selectedRecoveryRow = useMemo(() => {
    return filteredPayoutRows.find((row) => row.payout_item_id === selectedRecoveryItemId) ?? null
  }, [filteredPayoutRows, selectedRecoveryItemId])

  useEffect(() => {
    if (!selectedRecoveryRow) return
    setRecoveryAmount(selectedRecoveryRow.recovery_amount.toString())
  }, [selectedRecoveryRow])

  const handleAssignTier = async () => {
    if (!selectedOperatorId) return

    try {
      setSubmitting(true)
      await commercialService.assignOperatorTier(selectedOperatorId, tierCode, tierReason)
      toast.success('Operator membership tier updated')
      setTierReason('')
      await load()
    } catch (actionError) {
      toast.error(actionError instanceof Error ? actionError.message : 'Failed to update tier')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleHold = async () => {
    if (!selectedOperator) return

    try {
      setSubmitting(true)
      await commercialService.updateOperatorPayoutHold(
        selectedOperator.operator_user_id,
        !selectedOperator.payout_hold,
        holdReason,
      )
      toast.success(selectedOperator.payout_hold ? 'Payout hold released' : 'Payout hold applied')
      await load()
    } catch (actionError) {
      toast.error(actionError instanceof Error ? actionError.message : 'Failed to update payout hold')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCloseBillingCycle = async () => {
    if (!selectedOperatorId) return

    try {
      setSubmitting(true)
      await commercialService.closeBillingCycle(selectedOperatorId)
      toast.success('Billing cycle closed and next invoice generated')
      await load()
    } catch (actionError) {
      toast.error(actionError instanceof Error ? actionError.message : 'Failed to close billing cycle')
    } finally {
      setSubmitting(false)
    }
  }

  const handleScheduleBatch = async () => {
    try {
      setSubmitting(true)
      const batch = await commercialService.schedulePayoutBatch()
      toast.success(batch ? `Scheduled ${batch.batch_reference}` : 'No eligible payout items to batch')
      await load()
    } catch (actionError) {
      toast.error(actionError instanceof Error ? actionError.message : 'Failed to schedule payout batch')
    } finally {
      setSubmitting(false)
    }
  }

  const handleMarkBatchPaid = async () => {
    if (!selectedBatchId) return

    try {
      setSubmitting(true)
      const batch = await commercialService.markPayoutBatchPaid(selectedBatchId)
      toast.success(batch ? `${batch.batch_reference} marked paid` : 'Batch paid')
      await load()
    } catch (actionError) {
      toast.error(actionError instanceof Error ? actionError.message : 'Failed to mark batch paid')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReverseBatch = async () => {
    if (!selectedBatchId) return

    try {
      setSubmitting(true)
      const result = await commercialService.reversePayoutBatch(selectedBatchId, batchActionReason)
      if (result?.previous_status === 'paid') {
        toast.success(`${result.batch_reference} reversed into recovery`) 
      } else {
        toast.success(`${result?.batch_reference ?? 'Batch'} unscheduled and returned to eligible`) 
      }
      setBatchActionReason('')
      await load()
    } catch (actionError) {
      toast.error(actionError instanceof Error ? actionError.message : 'Failed to reverse payout batch')
    } finally {
      setSubmitting(false)
    }
  }

  const handleResolveRecovery = async () => {
    if (!selectedRecoveryItemId) return

    try {
      setSubmitting(true)
      const amount = recoveryAmount.trim() ? Number(recoveryAmount) : undefined
      const result = await commercialService.resolvePayoutRecovery(selectedRecoveryItemId, amount, recoveryReason)
      if (result?.remaining_recovery_amount) {
        toast.success(`Recovery updated. PKR ${result.remaining_recovery_amount.toLocaleString()} still outstanding`)
      } else {
        toast.success('Recovery completed and payout item closed')
      }
      setRecoveryReason('')
      await load()
    } catch (actionError) {
      toast.error(actionError instanceof Error ? actionError.message : 'Failed to resolve recovery')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Commercial</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Finance overview, operator commercial controls, billing cycle actions, and payout batch management.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleScheduleBatch} disabled={submitting || loading}>Create payout batch</Button>
          <Button onClick={handleMarkBatchPaid} disabled={submitting || loading || !selectedBatchId}>Mark batch paid</Button>
        </div>
      </div>

      {error ? <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
                <card.icon className="h-4 w-4" />
                {card.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{loading ? 'Loading…' : card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview" className="mt-8">
        <TabsList className="h-auto p-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="operators">Operators</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tier performance</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tier</TableHead>
                    <TableHead>Operators</TableHead>
                    <TableHead className="text-right">Average GMV</TableHead>
                    <TableHead className="text-right">Average payout</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(overview?.tierReportRows ?? []).map((row) => (
                    <TableRow key={row.membership_tier_code}>
                      <TableCell>{row.display_name}</TableCell>
                      <TableCell>{row.operators_count}</TableCell>
                      <TableCell className="text-right">{formatMoney(row.average_gmv)}</TableCell>
                      <TableCell className="text-right">{formatMoney(row.average_payout)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="operators" className="space-y-6 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Operator finance controls</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">Select operator</label>
                <Select value={selectedOperatorId} onValueChange={setSelectedOperatorId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose operator" />
                  </SelectTrigger>
                  <SelectContent>
                    {(overview?.operatorProfiles ?? []).map((profile) => (
                      <SelectItem key={profile.operator_user_id} value={profile.operator_user_id}>
                        {profile.tour_operator_profiles?.company_name || profile.tour_operator_profiles?.contact_person || profile.operator_user_id.slice(0, 8)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedOperator ? (
                  <div className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">{selectedOperator.tour_operator_profiles?.company_name || 'Unnamed operator'}</p>
                    <p>City: {selectedOperator.tour_operator_profiles?.primary_city || '—'}</p>
                    <p>KYC: {selectedOperator.kyc_status}</p>
                    <p>Operational status: {selectedOperator.operational_status}</p>
                  </div>
                ) : null}
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-3 rounded-lg border border-border p-4">
                  <p className="font-medium text-foreground">Membership tier</p>
                  <Select value={tierCode} onValueChange={(value) => setTierCode(value as MembershipTierCode)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gold">Gold</SelectItem>
                      <SelectItem value="diamond">Diamond</SelectItem>
                      <SelectItem value="platinum">Platinum</SelectItem>
                    </SelectContent>
                  </Select>
                  <Textarea
                    value={tierReason}
                    onChange={(event) => setTierReason(event.target.value)}
                    placeholder="Reason for tier change"
                  />
                  <Button onClick={handleAssignTier} disabled={submitting || !selectedOperatorId}>Apply tier change</Button>
                </div>

                <div className="space-y-3 rounded-lg border border-border p-4">
                  <p className="font-medium text-foreground">Payout hold</p>
                  <Input
                    value={holdReason}
                    onChange={(event) => setHoldReason(event.target.value)}
                    placeholder="Hold reason shown on payout items"
                  />
                  <Button variant="outline" onClick={handleToggleHold} disabled={submitting || !selectedOperator}>
                    {selectedOperator?.payout_hold ? 'Release payout hold' : 'Apply payout hold'}
                  </Button>
                  <Button onClick={handleCloseBillingCycle} disabled={submitting || !selectedOperatorId}>
                    Close billing cycle
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg"><Users className="h-5 w-5" />Billing cycles</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Operator</TableHead>
                    <TableHead>Cycle</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Final charge</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBillingRows.map((row) => (
                    <TableRow key={row.billing_cycle_id}>
                      <TableCell>{row.operator_user_id.slice(0, 8)}</TableCell>
                      <TableCell>{formatDate(row.cycle_start)} to {formatDate(row.cycle_end)}</TableCell>
                      <TableCell>{row.invoice_status}</TableCell>
                      <TableCell className="text-right">{formatMoney(row.final_membership_charge)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payouts" className="space-y-6 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Payout batches</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={selectedBatchId} onValueChange={setSelectedBatchId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose payout batch" />
                </SelectTrigger>
                <SelectContent>
                  {(overview?.payoutBatches ?? []).map((batch) => (
                    <SelectItem key={batch.id} value={batch.id}>
                      {batch.batch_reference} · {batch.status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="grid gap-4 rounded-lg border border-border p-4 md:grid-cols-[1fr_auto_auto] md:items-end">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Batch reversal reason</p>
                  <Textarea
                    value={batchActionReason}
                    onChange={(event) => setBatchActionReason(event.target.value)}
                    placeholder="Explain why this batch is being reversed or unscheduled"
                  />
                  <p className="text-xs text-muted-foreground">
                    {selectedBatch?.status === 'paid'
                      ? 'Paid batches move items into recovery_pending with full recovery amounts.'
                      : 'Scheduled batches are unwound back to eligible so they can be re-batched.'}
                  </p>
                </div>
                <Button variant="outline" onClick={handleReverseBatch} disabled={submitting || loading || !selectedBatchId || selectedBatch?.status === 'reversed'}>
                  Reverse batch
                </Button>
                <Button onClick={handleMarkBatchPaid} disabled={submitting || loading || !selectedBatchId || selectedBatch?.status === 'paid' || selectedBatch?.status === 'reversed'}>
                  Mark batch paid
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Batch</TableHead>
                    <TableHead>Scheduled</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Payable</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(overview?.payoutBatches ?? []).map((batch) => (
                    <TableRow key={batch.id}>
                      <TableCell>{batch.batch_reference}</TableCell>
                      <TableCell>{formatDate(batch.scheduled_for)}</TableCell>
                      <TableCell>{batch.status}</TableCell>
                      <TableCell className="text-right">{formatMoney(batch.total_operator_payable)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recovery resolution</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">Recovery item</label>
                <Select value={selectedRecoveryItemId} onValueChange={setSelectedRecoveryItemId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose recovery item" />
                  </SelectTrigger>
                  <SelectContent>
                    {recoveryRows.map((row) => (
                      <SelectItem key={row.payout_item_id} value={row.payout_item_id}>
                        {(row.trip_name ?? row.booking_id.slice(0, 8))} · {formatMoney(row.recovery_amount)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedRecoveryRow ? (
                  <div className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">{selectedRecoveryRow.trip_name ?? selectedRecoveryRow.booking_id.slice(0, 8)}</p>
                    <p>Outstanding recovery: {formatMoney(selectedRecoveryRow.recovery_amount)}</p>
                    <p>Batch: {selectedRecoveryRow.batch_reference ?? '—'}</p>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                    No recovery items are waiting for settlement.
                  </div>
                )}
              </div>

              <div className="space-y-3 rounded-lg border border-border p-4">
                <p className="font-medium text-foreground">Resolve recovery</p>
                <Input
                  value={recoveryAmount}
                  onChange={(event) => setRecoveryAmount(event.target.value)}
                  placeholder="Amount recovered in PKR"
                />
                <Textarea
                  value={recoveryReason}
                  onChange={(event) => setRecoveryReason(event.target.value)}
                  placeholder="Recovery note or evidence reference"
                />
                <Button onClick={handleResolveRecovery} disabled={submitting || !selectedRecoveryItemId}>
                  Apply recovery settlement
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Payout queue</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Trip</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Payable</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayoutRows.map((row) => (
                    <TableRow key={row.payout_item_id}>
                      <TableCell>{row.trip_name ?? row.booking_id.slice(0, 8)}</TableCell>
                      <TableCell>{row.batch_reference ?? 'Unbatched'}</TableCell>
                      <TableCell>{row.payout_status}</TableCell>
                      <TableCell className="text-right">{formatMoney(row.operator_payable_amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}