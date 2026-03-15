# TripAvail Tour Operator Commercial System Plan

## Objective

Build the TripAvail tour-operator commercial system as one connected operating model across onboarding, KYC, membership, commission, billing, booking finance, settlement, payout control, admin operations, and reporting.

This plan adapts your commercial proposal to the current codebase:

- React + TypeScript web app in `packages/web`
- Shared reusable logic in `packages/shared`
- Supabase Postgres + migrations + RPCs in `supabase`
- Existing tour operator onboarding, KYC, tour publishing, bookings, Stripe deposit flow, admin moderation, and dashboard surfaces already live

The implementation must be phased, but the data model and status flow must be designed end-to-end so that later phases do not require destructive rewrites.

## Current Repo Alignment

### Already present

- Tour operator onboarding profile and setup workflow
- KYC session flow, admin KYC review, KYC audit linkage
- Tour creation, publishing, schedules, pricing tiers, deposits
- Tour booking payment flow, Stripe payment-intent lifecycle
- Admin role system with `super_admin`, `moderator`, and `support`
- Basic operator/admin dashboards

### Gaps this commercial system must close

- No formal operator membership tier model
- No commission ledger tied to operator tier snapshots
- No cycle-based membership fee adjustment engine
- No invoice/statement model for membership charges
- No booking finance snapshot table for settlement-safe auditing
- No payout eligibility / payout batch domain model for tour operators
- No commercial reporting layer spanning billing, payouts, reconciliation, and tier analytics
- No reusable server-safe finance engine shared across frontend, backend, tests, and admin logic

## Connected Flow

The intended production flow is:

1. Operator role created
2. Operator commercial profile provisioned with default Gold tier
3. Onboarding data captured
4. KYC submitted and reviewed
5. Feature gates resolved from tier + overrides + KYC + account standing
6. Tour publish limits enforced
7. Traveller books and pays through TripAvail
8. Booking finance snapshot stored at booking time and updated through lifecycle
9. Tour completes
10. Settlement engine marks booking eligible next business day
11. Payout batch releases operator payable amount
12. Billing cycle closes and previous-cycle commission offsets next membership charge
13. Invoice / statement generated
14. Admin dashboards and reports reconcile all amounts end-to-end

## Implementation Order

### Phase 1: Operator foundation

Deliverables:

- Operator commercial profile linked 1:1 to `tour_operator_profiles`
- Default commercial bootstrap on operator creation
- Tier catalog with Gold / Diamond / Platinum
- Commercial status model for operator operational state
- Commercial KYC status mirror aligned to current `user_roles.verification_status`
- Tier-based feature gates and publish limits resolved through a shared engine

Acceptance:

- New operator gets Gold, 20% commission, Gold fee, Gold feature gates automatically
- Operator commercial row exists without manual admin work
- Commercial KYC state stays in sync with current role verification status

### Phase 2: Tier and billing engine

Deliverables:

- Membership fee configuration per tier
- Commission configuration per tier
- Billing cycle table
- Membership invoice / statement table
- Commission ledger sourced from booking snapshots
- Membership adjustment formula using prior-cycle commission credit
- Admin tier assignment RPC and tier audit log

Acceptance:

- Cycle close computes `max(0, membership_fee - prior_cycle_commission_credit)`
- Invoice rows store fee, credit, adjustment, and final charge
- Tier changes do not rewrite historical booking finance snapshots

### Phase 3: Operator product controls

Deliverables:

- Tier-based trip publish limits
- Pickup multi-city gating
- Google Maps gating
- AI itinerary entitlement gating
- Monthly feature usage tracking

Acceptance:

- Gold cannot use Diamond / Platinum commercial features beyond configured limits
- Diamond and Platinum usage is metered and reportable

### Phase 4: Bookings and finance

Deliverables:

- Booking finance snapshot table keyed to booking
- Snapshot stores membership tier, commission %, commission amount, operator receivable estimate, collected amount, settlement state, payout state
- Settlement schedule helper using next-business-day payout rule after completion
- Payout batch and payout item tables
- Recovery and hold support in payout model

Acceptance:

- Historical bookings keep their original commission snapshot even after tier changes
- Booking completion drives payout eligibility, not booking date or payment date

### Phase 5: Admin control and reporting

Deliverables:

- Admin tier management
- Admin finance controls for hold / release / reverse / recovery
- Reporting views for operator billing, payouts, performance, admin finance summary, tier analytics, KYC/compliance, and cancellation risk

Acceptance:

- Admin can inspect commercial state without bypassing auditability
- Reports reconcile collected, commission, payout, invoice, hold, refund, and recovery amounts

### Phase 6: Promotions after commercial foundation

Deliverables:

- Promo ownership and funding logic
- Traveller invoice adjustments
- Promo-funded margin handling without corrupting operator payable logic

Acceptance:

- Promotions never rewrite historical commercial snapshots incorrectly

## Canonical Status Model

### Operator commercial status

- `pending`
- `active`
- `restricted`
- `suspended`

### Commercial KYC status

- `not_submitted`
- `pending_review`
- `approved`
- `rejected`
- `resubmission_required`

### Membership status

- `active`
- `grace_period`
- `payment_due`
- `overdue`
- `suspended`

### Settlement state

- `draft`
- `pending_payment`
- `paid_pending_service`
- `completed_pending_payout`
- `eligible_for_payout`
- `paid_out`
- `cancelled_by_traveller`
- `cancelled_by_operator`
- `refunded`
- `partially_refunded`
- `payout_on_hold`
- `chargeback_open`

### Payout status

- `not_ready`
- `eligible`
- `scheduled`
- `paid`
- `on_hold`
- `reversed`
- `recovery_pending`

## Data Model Summary

### Tier configuration

- `commercial_membership_tiers`
  - fee, commission rate, publish limit, premium feature flags, AI credits, support priority, ranking weight

### Operator commercial state

- `operator_commercial_profiles`
  - tier, commission, membership fee, cycle dates, operational status, KYC state, payout hold flags, counters, overrides

### Billing and invoicing

- `operator_billing_cycles`
- `operator_membership_invoices`
- `operator_tier_change_log`

### Booking finance and ledger

- `operator_booking_finance_snapshots`
- `operator_commission_ledger`

### Payouts

- `operator_payout_batches`
- `operator_payout_items`

### Usage tracking

- `operator_feature_usage_monthly`

### Reporting views

- `operator_billing_report_v`
- `operator_payout_report_v`
- `operator_performance_report_v`
- `admin_finance_summary_v`
- `membership_tier_report_v`

## Design Rules

1. Commission is snapshotted per booking and never recomputed from current tier later.
2. Membership fee adjustment always uses prior-cycle commission credit.
3. Payouts are delayed until service completion and next business day.
4. Holds, reversals, refunds, and recovery events must remain auditable and additive.
5. Tier defaults are admin-configurable, but system bootstrap always has safe defaults.
6. Feature gates should resolve from one reusable rules engine rather than ad hoc UI checks.
7. Reports must be derivable from stored server-side facts rather than client-side calculations.

## Testing Strategy

### Unit tests

- Tier commission math
- Membership adjustment formula
- Booking finance snapshot math
- Publish limit gating
- Feature access gating
- Next-business-day payout date logic

### Integration tests

- Operator creation provisions commercial profile
- User role verification changes sync commercial KYC status
- Tour booking insert/upsert creates booking finance snapshot and commission ledger rows
- Billing cycle close creates invoice with prior-cycle commission credit

### End-to-end targets

- Operator signup to commercial bootstrap
- Admin KYC review to active commercial profile
- Tier change to updated publish limits
- Booking to payout-eligible state transition after completion
- Invoice view and payout report visibility

### Reconciliation checks

- Gross booking amount = commission + operator receivable estimate
- Billing cycle credit = sum of prior-cycle commission ledger
- Final fee = max(0, fee - credit)
- Held / reversed payouts remain visible in finance summaries

## Execution Notes For This Pass

This pass should prioritize safe, high-leverage foundation work:

1. Add the commercial plan and canonical domain model.
2. Add reusable finance/tier rules in shared code with tests.
3. Add Supabase schema foundation, provisioning triggers, billing tables, booking snapshot tables, payout tables, and reporting views.
4. Keep historical compatibility with current onboarding, KYC, booking, and deposit flows.

UI dashboards and admin workflows can then bind to these persisted commercial primitives without replacing the current product flow.