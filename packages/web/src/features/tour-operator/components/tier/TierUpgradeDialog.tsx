import {
  describeTierUpgrade,
  type MembershipTierConfig,
} from '@tripavail/shared/commercial/engine'
import { formatMoney } from '@tripavail/shared/utils/money'
import { ArrowRight, Check, Loader2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { tierChangeRequestService } from '@/features/commercial/services/tierChangeRequestService'

interface TierUpgradeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentTier: MembershipTierConfig
  targetTier: MembershipTierConfig
  onSubmitted: () => void
}

/**
 * Confirms a tier change before it becomes a request. Shows the fee delta and exactly what
 * changes — both computed from the live (admin-edited) tier configs, never hardcoded — so the
 * operator can't be surprised by what they agreed to.
 */
export function TierUpgradeDialog({
  open,
  onOpenChange,
  currentTier,
  targetTier,
  onSubmitted,
}: TierUpgradeDialogProps) {
  const [note, setNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const delta = useMemo(() => describeTierUpgrade(currentTier, targetTier), [currentTier, targetTier])
  const isUpgrade = delta.monthlyFeeDifference > 0
  const currency = targetTier.currency ?? 'PKR'

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      await tierChangeRequestService.request(targetTier.code, note)
      toast.success('Request sent — our team will review it shortly.')
      setNote('')
      onOpenChange(false)
      onSubmitted()
    } catch (error) {
      console.error('[TierUpgradeDialog] Failed to submit tier change request', error)
      toast.error(error instanceof Error ? error.message : 'Could not send your request.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isUpgrade ? 'Upgrade to' : 'Switch to'} {targetTier.label}
          </DialogTitle>
          <DialogDescription>
            Our team reviews every change. Nothing is charged now — we&apos;ll confirm before your
            next billing cycle.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-muted/30 p-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Current</p>
              <p className="mt-0.5 font-bold text-foreground">{currentTier.label}</p>
              <p className="text-xs text-muted-foreground">
                {formatMoney(currentTier.monthlyFee, currentTier.currency ?? currency)} / mo
              </p>
            </div>
            <ArrowRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" aria-hidden="true" />
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">New</p>
              <p className="mt-0.5 font-bold text-primary">{targetTier.label}</p>
              <p className="text-xs text-muted-foreground">
                {formatMoney(targetTier.monthlyFee, currency)} / mo
              </p>
            </div>
          </div>

          {delta.highlights.length > 0 ? (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                What changes
              </p>
              <ul className="mt-2 space-y-1.5">
                {delta.highlights.map((highlight) => (
                  <li key={highlight} className="flex items-start gap-2 text-sm text-foreground">
                    <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-primary" aria-hidden="true" />
                    {highlight}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              This plan has fewer entitlements than your current one. Your published tours stay live;
              the new limits apply to future publishing.
            </p>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="tier-note" className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Anything we should know? (optional)
            </Label>
            <Textarea
              id="tier-note"
              rows={3}
              maxLength={500}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. we're launching a new season in August and need more publish slots"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="gap-2">
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Send request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
