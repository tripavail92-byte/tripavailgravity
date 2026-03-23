# TripAvail Commercial Phase 7 Ops Runbook

## Purpose

This runbook defines the steady-state production checks for the Phase 7 commercial automation layer:

- due billing-cycle closure
- payout eligibility refresh and payout batch creation
- reconciliation drift monitoring
- payout backlog, recovery exposure, and stuck-settlement checks
- operator and support exception handling

Primary operational tools:

- `node scripts/run-operator-billing-worker.mjs`
- `node scripts/run-operator-payout-worker.mjs`
- `node scripts/run-commercial-ops-worker.mjs`
- `node scripts/commercial-ops-monitor.mjs`
- admin commercial page
- admin reports page support-escalation tab

## Job Paths

### Billing-cycle closure

Use:

```bash
node scripts/run-operator-billing-worker.mjs
```

Behavior:

- closes all operator billing cycles whose `next_billing_date` is due
- creates the next billing cycle and invoice state using the existing billing RPCs
- is safe to rerun because the worker RPC only processes operators still due on or before the run date

Dry run:

```bash
node scripts/run-operator-billing-worker.mjs --dry-run
```

### Payout orchestration

Use:

```bash
node scripts/run-operator-payout-worker.mjs
```

Behavior:

- refreshes payout eligibility
- creates the next payout batch if eligible rows exist
- leaves the batch scheduled for later release

Optional auto-settle mode for non-production or special finance runs:

```bash
node scripts/run-operator-payout-worker.mjs --auto-settle
```

### Combined daily commercial cycle

Use:

```bash
node scripts/run-commercial-ops-worker.mjs
```

Recommended cadence:

- run billing closure once daily shortly after midnight UTC
- run payout orchestration every 5 to 15 minutes depending on booking volume

## Monitoring Thresholds

Use:

```bash
node scripts/commercial-ops-monitor.mjs
```

Default warning thresholds:

- reconciliation delta greater than `PKR 0.01`
- eligible unbatched payout backlog greater than `PKR 500,000`
- on-hold payout exposure greater than `PKR 250,000`
- outstanding recovery balances greater than `PKR 250,000`
- any booking stuck in `completed_pending_payout` longer than `7` days

Configurable env vars:

- `COMMERCIAL_RECONCILIATION_TOLERANCE`
- `COMMERCIAL_ELIGIBLE_BACKLOG_WARN_PKR`
- `COMMERCIAL_ON_HOLD_WARN_PKR`
- `COMMERCIAL_RECOVERY_WARN_PKR`
- `COMMERCIAL_STUCK_SETTLEMENT_WARN_DAYS`

## Daily Review Sequence

1. Run `node scripts/commercial-ops-monitor.mjs`.
2. If it passes, inspect the admin commercial overview only for spot-checking.
3. If it warns, open the admin commercial page and review:
   - reconciliation alignment
   - eligible unbatched payouts
   - on-hold exposure
   - recovery exposure
4. Open the admin reports page and inspect support escalations if any operator exception is involved.
5. Export evidence packs only if another team needs follow-up data.

## Weekly Review Sequence

1. Run the monitor.
2. Run the billing worker in dry-run mode and confirm no unexpected operators are due.
3. Review payout backlog trends in the admin commercial reports tab.
4. Review recovery balances and on-hold exposures.
5. Review support escalations for unresolved operator payout questions.

## Latency Vs Corruption

Treat the issue as likely latency when:

- background job output is healthy
- reconciliation delta is within tolerance
- the source-of-truth pages converge after reload or the next job cycle

Treat the issue as potential corruption when:

- reconciliation delta exceeds tolerance
- payout or billing rows contradict the finance views after a reload
- a booking remains stuck beyond the settlement threshold
- a support escalation shows a finance state that cannot be explained by current payout or recovery data

## Escalation Path

### Dashboard summary disagrees with the source-of-truth page

1. Treat it as a release-blocking data-integrity issue.
2. Confirm whether the mismatch persists after a reload and one job cycle.
3. Compare:
   - operator commercial page
   - admin commercial page
   - admin reports escalation thread if operator support is involved
4. If the mismatch remains, capture the booking id, operator id, and current payout/billing state and escalate to engineering.

### Payout backlog exceeds threshold

1. Run `node scripts/run-operator-payout-worker.mjs` manually.
2. Re-run `node scripts/commercial-ops-monitor.mjs`.
3. If backlog remains high, review hold and recovery concentrations in admin commercial.
4. Escalate to finance if manual release decisions are required.

### Reconciliation delta exceeds tolerance

1. Stop manual payout releases or reversals.
2. Export the affected billing and payout views from admin commercial.
3. Identify whether the mismatch is concentrated in refunds, recovery, or on-hold rows.
4. Escalate to finance and engineering the same day.

## Minimum Evidence Before Manual Intervention

Before manual payout release, reversal, or recovery resolution, confirm all of the following:

- the booking state is understood
- the payout state is visible in the operator/admin commercial surfaces
- the recovery or refund effect is visible in finance data
- the admin reason references the evidence source
- support escalation notes are reviewed when the operator asked for manual intervention

## Support Validation Flow

When an operator asks about promo, payout, invoice, refund, or balance state:

1. Open the booking or payout context from the operator/admin commercial surface.
2. Confirm the current payout status and any hold or recovery markers.
3. Check whether promo funding or refund exposure is part of the reconciliation snapshot.
4. If needed, inspect the support escalation thread in admin reports.
5. Respond only after the booking, payout, and support thread tell the same story.