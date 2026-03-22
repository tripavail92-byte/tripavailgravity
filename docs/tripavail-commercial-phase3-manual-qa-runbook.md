# TripAvail Commercial Phase 3 Manual QA Runbook

## Goal

Run one ordered manual QA pass across operator, traveller, and admin commercial flows after:

- Phase 1 remote regressions are green
- Phase 2 clean migration replay is green

## Prerequisites

- One operator account with access to at least one published tour
- One traveller account that can complete checkout
- One admin account with access to the commercial dashboard
- A target environment URL for the web app
- A payment/testing setup that supports the required booking flow

## Recommended Order

1. Operator commercial overview
2. Operator billing and payouts
3. Operator create-tour pricing and deposit validation
4. Traveller checkout and confirmation flow
5. Admin commercial dashboard and reconciliation
6. Cross-surface value comparison against CLI output

## Operator Checks

### Operator Commercial Overview

Verify:

- current tier is visible
- commission rate is visible
- trips used versus publish limit is visible
- commission earned is visible
- next billing date is visible
- outstanding recovery is visible
- cancellation penalty and payout hold state are visible

### Operator Billing Tab

Verify:

- invoice rows are visible
- membership fee is visible
- prior-cycle commission credit is visible when applicable
- final charge is visible
- invoice status is visible

### Operator Payouts Tab

Verify:

- eligible or scheduled payouts are visible when expected
- paid payouts are visible when expected
- on-hold payouts are visible when expected
- recovery-pending rows are visible when expected
- each row shows commission split, recovery deduction, and net operator payable

### Operator Create-Tour Flow

Verify:

- deposit behavior respects the membership-tier minimum
- publish-limit messaging appears when limits are reached
- review step shows deposit requirement correctly
- launch promo details appear correctly when used

## Traveller Checks

### Checkout

Verify:

- trip price matches the listing and selected options
- deposit requirement is clearly shown when enabled
- pay-now and pay-later split is shown for partial-online bookings
- cancellation policy is visible
- payment policy text matches the selected booking mode

### Confirmation Page

Verify:

- deposit paid is shown for partial-online bookings
- remaining payable to operator is shown clearly
- confirmation includes trip details, travel dates, and payment breakdown

## Admin Checks

### Admin Commercial Dashboard

Verify:

- customer payments are visible
- commission accrued is visible
- held payouts are visible
- operator payouts are visible
- recovery offsets are visible
- finance health shows commission collected, not-ready operator liability, reconciliation RHS, and recovery exposure

### Admin Reconciliation Status

Verify:

- reconciliation delta is visible
- bucket table includes not-ready operator liability
- bucket table includes eligible unbatched payouts
- bucket table includes scheduled payouts
- bucket table includes completed payouts
- bucket table includes held payouts
- bucket table includes collected commission
- bucket table includes refunds

## Cross-Surface Validation

For the same operator and booking dataset, compare:

- operator payout balances versus admin payout rows
- operator billing rows versus admin billing rows
- traveller booking payment breakdown versus operator finance snapshot behavior
- admin finance health totals versus `pnpm db:finance:health`

## Evidence To Capture

- operator commercial overview screenshot
- operator billing screenshot
- operator payouts screenshot
- traveller checkout screenshot
- traveller confirmation screenshot
- admin commercial dashboard screenshot
- admin reconciliation screenshot
- CLI output for `pnpm db:finance:health`

## Pass Rule

Phase 3 passes only if:

- manual role-based surfaces match backend commercial behavior
- payout and billing values align across operator and admin views
- traveller deposit and balance messaging matches booking finance behavior
- reconciliation remains at zero delta

## References

- [docs/tripavail-commercial-frontend-qa-scripts.md](docs/tripavail-commercial-frontend-qa-scripts.md)
- [docs/tripavail-commercial-e2e-test-scenarios.md](docs/tripavail-commercial-e2e-test-scenarios.md)
- [docs/tripavail-commercial-release-checklist.md](docs/tripavail-commercial-release-checklist.md)