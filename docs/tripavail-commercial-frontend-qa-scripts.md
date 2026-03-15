# TripAvail Commercial Frontend QA Scripts

## Purpose

These manual QA scripts cover the full user journey across operator, traveller, and admin commercial surfaces.

Use them together with the SQL finance regressions and the payout-cycle checks before release.

## Operator UI Script

### Operator Commercial Overview

Open the operator commercial page and verify:

- Current tier is visible
- Commission rate is visible in the tier card caption
- Trips used versus limit is visible in the next billing card caption
- Commission earned is visible in cycle performance
- Next billing date is visible
- Outstanding recovery is visible
- Cancellation penalty and payout hold state are visible

### Operator Billing Page

Open the Billing tab and verify:

- invoice rows are visible
- membership fee is visible per billing cycle
- commission credit is visible as prior-cycle credit
- final charge is visible
- invoice status is visible

### Operator Payout Page

Open the Payouts tab and verify:

- upcoming payouts are visible through `eligible` and `scheduled` rows
- completed payouts are visible through `paid` rows
- held payouts are visible through `on_hold` rows
- recovery balances are visible through `recovery_pending` rows
- each payout row shows commission split, recovery deduction, and net operator payable

### Operator Tour Or Package Create Flow

Open the create-tour flow for the operator and verify:

- deposit options respect the current membership tier minimum
- publish-limit messaging appears when limits are reached
- review step shows deposit requirement correctly

## Traveller UI Script

### Booking Page

Open a listing details page and continue to checkout. Verify:

- trip price is correct
- deposit requirement is clearly shown when enabled
- remaining amount payable to operator is shown for partial-online bookings
- cancellation policy is visible
- payment policy text matches the selected booking mode

### Booking Confirmation Page

After payment success, verify:

- deposit paid is shown for partial-online bookings
- remaining payable to operator is shown clearly
- booking confirmation includes tour details, travel dates, and payment breakdown

## Admin UI Script

### Admin Commercial Dashboard

Open the admin commercial page and verify:

- customer payments are visible
- commission accrued is visible
- held payouts are visible
- operator payouts are visible
- recovery offsets are visible
- finance health section shows:
  - commission collected
  - not-ready operator liability
  - reconciliation RHS
  - recovery exposure

### Admin Reconciliation Status

Verify:

- reconciliation delta is visible
- bucket table includes:
  - operator liability not ready for payout
  - eligible unbatched payouts
  - scheduled payouts
  - completed payouts
  - held payouts
  - collected commission
  - refunds

## Cross-Surface Validation Script

For the same operator and booking dataset, compare:

- operator payout balances versus admin payout rows
- operator billing rows versus admin billing rows
- traveller booking payment breakdown versus operator finance snapshot output
- admin finance health totals versus `pnpm db:finance:health`

## Pass Criteria

The frontend QA pass is successful when:

- no screen shows a deposit or commission value inconsistent with the database-backed commercial rules
- admin and operator payout totals align with reporting views
- traveller deposit and balance messaging matches actual finance snapshot behavior
- reconciliation labels distinguish accrued commission from collected commission