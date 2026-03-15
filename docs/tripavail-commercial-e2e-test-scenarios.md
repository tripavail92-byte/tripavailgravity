# TripAvail Commercial End-to-End Test Scenarios

## Purpose

This document defines end-to-end test scenarios for the full TripAvail commercial lifecycle:

- membership and operator setup
- tour or package creation and publishing
- traveller booking
- deposit and full-payment flows
- commission recognition
- settlement and payout readiness
- payout batching and recovery deductions
- refunds and disputes
- financial reconciliation
- frontend validation across operator, traveller, and admin surfaces

These scenarios are written to cover the connected system, not only isolated functions.

## Coverage Goals

Each scenario should validate as many of these layers as possible:

- backend data correctness in snapshots, ledgers, payout items, and reporting views
- admin and operator workflow behavior
- traveller checkout and confirmation behavior
- commercial rule enforcement by membership tier
- finance health and reconciliation integrity

## Recommended Execution Layers

- SQL integration tests for durable finance facts and reporting views
- frontend manual or browser tests for UX validation
- admin workflow checks for tier changes, payout actions, and finance visibility
- CLI checks for finance health and reconciliation output

## Scenario 1: New Gold Operator Onboarding To First Published Tour

### Objective

Verify a newly created operator receives the default commercial profile, completes setup, and can publish within Gold-tier rules.

### Setup

- Create a new operator account
- Ensure the operator has a `tour_operator_profiles` row
- Ensure no commercial data exists before bootstrap

### Steps

1. Create operator role and profile
2. Verify automatic commercial provisioning runs
3. Confirm default tier is Gold
4. Confirm KYC status mirrors current role verification state
5. Open operator commercial page
6. Create a new tour or package with valid schedules, pricing, and media
7. Publish the listing

### Expected Results

- `operator_commercial_profiles` is created automatically
- Gold defaults are applied:
  - 20% commission
  - Gold membership fee
  - Gold publish limit
- operator can publish within current limit
- operator dashboard shows the correct tier and commercial standing

### Validation Points

- `operator_commercial_profiles`
- `operator_feature_usage_monthly`
- operator commercial frontend
- operator create-tour or create-package frontend

## Scenario 2: Tier Upgrade Changes Deposit Rules And Publishing Entitlements

### Objective

Verify admin tier assignment changes live commercial behavior without rewriting historical finance records.

### Setup

- Existing Gold operator with at least one published tour
- Admin account with finance permissions

### Steps

1. Open admin commercial page
2. Change operator from Gold to Diamond or Platinum
3. Open operator create-tour flow again
4. Verify deposit choices update to the new tier minimum
5. Verify premium feature gates and publish limits reflect the new tier
6. Confirm previously created bookings still retain their original snapshot commission and tier context

### Expected Results

- admin tier assignment succeeds and is audited
- new listings use the updated tier rules
- old bookings do not get recomputed from the new tier

### Validation Points

- `admin_assign_operator_membership_tier(...)`
- `operator_tier_change_log`
- operator create-tour pricing UI
- existing booking finance snapshots remain historically stable

## Scenario 3: Partial-Online Deposit Booking From Checkout To Confirmation

### Objective

Verify a deposit-required booking collects only the upfront amount online and stores the correct finance split.

### Setup

- Operator has a published deposit-enabled tour or package
- Deposit percentage is valid for the current membership tier
- Traveller account is active

### Steps

1. Open traveller listing details page
2. Select guests and continue to checkout
3. Verify checkout shows:
  - pay now amount
  - pay later to operator amount
  - deposit policy text
4. Complete payment for the online deposit only
5. Load booking confirmation page
6. Open operator booking detail and admin commercial views

### Expected Results

- booking stores `payment_collection_mode = 'partial_online'`
- `upfront_amount`, `remaining_amount`, `amount_paid_online`, and `amount_due_to_operator` are correct
- traveller confirmation clearly shows remaining balance due directly to operator
- finance snapshot stores:
  - `payment_collected`
  - `commission_total`
  - `commission_collected`
  - `commission_remaining`
- reconciliation treats only collected marketplace cash as platform cash

### Validation Points

- `tour_bookings`
- `operator_booking_finance_snapshots`
- traveller checkout and confirmation frontend
- admin finance health view

## Scenario 4: Full-Online Booking From Booking To Paid-Pending-Service

### Objective

Verify a full-payment booking is recognized as full marketplace cash but not yet payout-eligible before service completion.

### Setup

- Published non-deposit tour or package
- Traveller account with successful payment method

### Steps

1. Complete a full-online booking
2. Confirm payment succeeds
3. Inspect booking and snapshot state before service date
4. Open operator and admin commercial pages

### Expected Results

- booking status is confirmed
- `payment_status = 'paid'`
- snapshot settlement state is `paid_pending_service`
- payout status is `not_ready`
- operator cash liability appears in finance health as collected cash not yet ready for payout

### Validation Points

- `operator_booking_finance_snapshots.settlement_state`
- `operator_booking_finance_snapshots.payout_status`
- `admin_finance_health_v`
- operator/admin commercial frontends

## Scenario 5: Service Completion To Payout Eligibility

### Objective

Verify completed and settled bookings move into the correct next-business-day payout path.

### Setup

- At least one full-online completed booking
- Operator KYC approved
- No payout hold active
- Threshold for payout release satisfied if applicable

### Steps

1. Mark the tour schedule as completed
2. Run payout eligibility refresh logic
3. Inspect booking snapshot and payout item rows
4. Open operator commercial page payout queue

### Expected Results

- settlement state advances to `eligible_for_payout` or `completed_pending_payout` depending on readiness checks
- payout item reflects the correct `payout_due_at`
- operator sees the item in the payout queue with correct commission and operator payable values

### Validation Points

- `refresh_all_operator_payout_eligibility()`
- `operator_payout_items`
- `operator_payout_report_v`
- operator commercial frontend payout table

## Scenario 6: Payout Batch Creation, Payment, And Reporting

### Objective

Verify eligible payout items are batched, paid, and reported correctly end to end.

### Setup

- Multiple eligible payout items for one or more operators
- Admin finance user available

### Steps

1. Create payout batch from admin or RPC
2. Verify batch totals for gross, commission, and operator payable
3. Verify payout items move to `scheduled`
4. Mark the batch paid
5. Re-open admin and operator commercial pages

### Expected Results

- batch reference is generated
- eligible items move to the batch
- `paid_at` is written when the batch is marked paid
- reporting views show scheduled then paid states correctly
- finance summary and payout reports remain consistent

### Validation Points

- `create_operator_payout_batch(...)`
- `mark_operator_payout_batch_paid(...)`
- `operator_payout_batches`
- `operator_payout_items`
- admin and operator commercial frontends

## Scenario 7: Operator-Fault Cancellations Trigger Automatic Safeguards

### Objective

Verify repeated operator-fault cancellations trigger restriction and payout hold automatically.

### Setup

- Active operator with approved KYC
- Three confirmed bookings inside the safeguard window

### Steps

1. Cancel the first booking with operator-fault metadata
2. Cancel the second booking with operator-fault metadata
3. Cancel the third booking with operator-fault metadata
4. Reload admin and operator commercial pages

### Expected Results

- operator fault cancellation count increments correctly
- cancellation penalty activates on threshold
- payout hold becomes true automatically
- operator operational status becomes restricted
- hold reason is visible in the admin and operator commercial screens

### Validation Points

- `operator_cancellation_penalty_events`
- `operator_commercial_profiles`
- `operator_finance_safeguards_phase1_test.sql`
- operator/admin commercial UI penalty state

## Scenario 8: Paid Batch Reversal And Automatic Recovery Deduction

### Objective

Verify reversing a paid payout creates recovery exposure and the next eligible payout is automatically netted down.

### Setup

- Existing paid payout batch
- Later booking becomes payout-eligible for the same operator

### Steps

1. Reverse a paid payout batch with a finance-admin reason
2. Verify reversed items move into recovery tracking
3. Create a future eligible payout for the same operator
4. Run payout batch creation again
5. Inspect net operator payable and recovery deduction values

### Expected Results

- reversed payout creates `recovery_pending` exposure
- future payout batch automatically applies recovery deductions
- batch totals reflect recovery offsets
- operator payout report shows:
  - recovery deduction amount
  - net operator payable amount
- admin and operator pages display the deduction clearly

### Validation Points

- `reverse_operator_payout_batch(...)`
- `operator_payout_recovery_deduction_test.sql`
- `operator_payout_report_v`
- admin/operator payout tables

## Scenario 9: Refund Or Dispute Flow Preserves Audit Trail And Finance Health

### Objective

Verify refunds or disputes do not silently erase finance history and remain visible in reporting.

### Setup

- Existing paid or deposit booking with finance snapshot
- Refund or dispute path available via booking/payment state updates

### Steps

1. Mark booking as refunded, partially refunded, or dispute-open according to the intended case
2. Refresh payout eligibility
3. Open finance summary and finance health views
4. Open admin commercial page

### Expected Results

- booking snapshot settlement state changes appropriately
- payout status moves to a hold or non-ready state as required
- refund totals appear in finance reports
- dispute or chargeback remains auditable
- reconciliation still uses cash-basis logic and stays explainable

### Validation Points

- `operator_booking_finance_snapshots`
- `operator_commission_ledger`
- `admin_finance_summary_v`
- `admin_finance_health_v`
- admin commercial finance overview

## Scenario 10: End-To-End Finance Reconciliation And Frontend Consistency

### Objective

Verify the full commercial flow remains consistent across database, reporting views, CLI output, and frontend UI.

### Setup

- Mixed dataset containing:
  - one full-online booking
  - one deposit booking
  - one payout hold case
  - one recovery case
  - one refund or dispute case

### Steps

1. Run the finance health CLI
2. Open admin commercial overview
3. Open operator commercial page for impacted operator
4. Compare key totals across all surfaces
5. Validate frontend labels reflect the cash-basis model correctly

### Expected Results

- CLI and admin UI read from the same shared health view
- customer payments, commission collected, recovery exposure, not-ready operator liability, and payout buckets align
- reconciliation delta is zero or explainably within tolerance
- frontend labels do not confuse accrued commission with collected commission

### Validation Points

- `pnpm db:finance:health`
- `admin_finance_health_v`
- `AdminCommercialPage.tsx`
- `OperatorCommercialPage.tsx`

## Suggested Implementation Mapping

If you want to convert these scenarios into automated coverage, the most practical split is:

- SQL regression tests:
  - Scenario 3
  - Scenario 5
  - Scenario 7
  - Scenario 8
  - Scenario 9
  - Scenario 10
- frontend browser or manual QA tests:
  - Scenario 1
  - Scenario 2
  - Scenario 3
  - Scenario 4
  - Scenario 6
  - Scenario 10
- admin workflow checks:
  - Scenario 2
  - Scenario 6
  - Scenario 8
  - Scenario 9
  - Scenario 10

## Minimum Release Set

If you need the shortest high-value release gate, run these first:

1. Scenario 2: Tier upgrade changes deposit rules and publish entitlements
2. Scenario 3: Partial-online deposit booking
3. Scenario 5: Service completion to payout eligibility
4. Scenario 7: Operator-fault cancellations trigger safeguards
5. Scenario 8: Paid batch reversal and recovery deduction
6. Scenario 10: End-to-end finance reconciliation and frontend consistency