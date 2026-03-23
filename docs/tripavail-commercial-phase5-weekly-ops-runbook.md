# TripAvail Commercial Phase 5 Weekly Ops Runbook

## Purpose

This runbook defines the minimum weekly review flow for commercial admins now that the Phase 5 control plane is live.

Use it to review payout readiness, recovery exposure, reconciliation health, billing integrity, promo impact, and operator risk without relying on tribal knowledge.

Primary surface:

- admin commercial page
- reports tab for weekly review filters, exports, and reconciliation checks
- history tab for actor-and-reason traceability

## Weekly Review Sequence

1. Open the admin commercial page and move to the reports tab.
2. Set the review date window for the operating week being reviewed.
3. Check the weekly ops review pack cards first.
4. Review reconciliation alignment before approving any money-state action.
5. Export billing, payout, promo, and risk views if finance or leadership needs an evidence pack.
6. Move to history and confirm any hold, release, reversal, recovery, tier, or promo actions are attributable to an admin, timestamp, and reason.

## Minimum Checks

### Payout readiness

- Review operators in payout hold state.
- Review payout rows still in `eligible`, `scheduled`, `on_hold`, and `recovery_pending`.
- Confirm no unexplained increase in on-hold or recovery exposure versus the prior review window.

### Recovery exposure

- Inspect all operators with outstanding recovery exposure.
- Confirm whether the recovery is expected from reversal, refund correction, or manual finance recovery.
- Validate that recovery resolution actions in history include a clear reason and evidence reference.

### Reconciliation status

- Read the reconciliation alignment panel before any payout release or reversal decision.
- Treat any non-trivial delta between SQL or view totals and row-derived totals as a release blocker.
- Escalate immediately if the reconciliation blocker cannot be explained the same day.

### Billing integrity

- Review billing lifecycle rows for overdue or inconsistent invoice statuses.
- Confirm billing formula integrity: membership fee minus prior-cycle commission credit minus adjustments equals final charge.
- Review any billing formula breaks before cycle close or invoice follow-up.

### KYC and risk

- Review operators with `KYC blocker`, `Fraud review`, `Payout hold`, `Recovery pending`, or `Cancellation penalty` risk states.
- Confirm the risk state is current and that there is a clear next owner.
- Export the risk report when another team needs a follow-up list.

### Promo impact

- Review promo performance rows by operator and funding source.
- Compare operator-funded versus platform-funded discount totals.
- Investigate sudden discount growth that is not matched by expected booking or payout behavior.

## Evidence Required Before Manual Hold Release

Do not release a payout hold unless all of the following are true:

- KYC status is acceptable for payout release.
- Fraud review is cleared or there is explicit approval from the reviewer.
- Recovery exposure is either zero or explicitly understood and approved.
- The release reason is recorded in the action form and visible in history.
- Supporting evidence is available from finance, compliance, or support if the hold was caused by an exception.

## Evidence Required Before Recovery Resolution

Do not resolve or write down a recovery item unless all of the following are true:

- The recovery source is understood: payout reversal, refund correction, manual receivable, or finance write-down.
- The recovered amount matches the supporting finance record or approved write-down amount.
- The admin reason references the supporting evidence or approval.
- The resulting remaining recovery amount is checked in the payout and reconciliation surfaces.

## Escalation Path

### Finance mismatch

1. Stop the release or reversal flow.
2. Export the affected payout and billing views.
3. Capture the reconciliation comparison with the delta.
4. Escalate to finance ownership for same-day review.

### Chargeback or suspicious cash movement

1. Place or keep the operator in payout hold if exposure is unresolved.
2. Gather booking, refund, payout, and recovery context.
3. Escalate to finance and fraud reviewers together.

### Suspicious cancellation pattern

1. Review cancellation counts, penalty flags, and payout status.
2. Check whether fraud review is already triggered.
3. Escalate to operations and fraud review if the pattern is not already explained.

## Evidence Pack Exports

When another stakeholder needs an operational snapshot, export these from the reports or history tabs:

- billing lifecycle CSV
- payout operations CSV
- promo performance CSV
- risk review CSV
- commercial audit history CSV

## Sign-Off Standard

The weekly review is considered complete only when:

- reconciliation has no unexplained blocker
- payout holds and recovery exposure are reviewed
- KYC or fraud blockers are identified with an owner
- billing anomalies are either resolved or escalated
- promo impact is reviewed for unusual discount behavior
- all manual money-state actions for the period are traceable in history