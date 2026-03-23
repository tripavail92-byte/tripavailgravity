# TripAvail Commercial Phase 6 Promo Rules And Schema Audit

## Purpose

This document locks the current canonical promo rules for Phase 6 and audits the live schema and implementation against those rules.

It exists to close the first two Phase 6 tasks before deeper behavior changes are made.

Primary references:

- `docs/tripavail-tour-operator-commercial-system-plan.md`
- `docs/tripavail-commercial-phase6-execution-plan.md`

Implementation references:

- `supabase/migrations/20260316000037_promo_pricing_allocation.sql`
- `packages/web/src/features/booking/services/bookingService.ts`
- `packages/web/src/pages/admin/AdminCommercialPage.tsx`
- `packages/web/src/pages/tour-operator/OperatorCommercialPage.tsx`
- `packages/web/src/pages/tour-operator/tours/create/CreateTourPage.tsx`

## Canonical Promo Rules

### 1. Promo code uniqueness

Locked rule:

- promo codes are globally unique across the system, not merely unique per operator

Reason:

- the database enforces a unique index on `UPPER(BTRIM(code))`
- this avoids ambiguous traveler-facing code resolution across operators

Phase 6 implication:

- all UX and validation should continue to treat promo code collisions as global collisions

### 2. Platform-funded promo authority

Locked rule:

- platform-funded promos are admin-only finance controls
- operators may create and manage only operator-funded promos

Reason:

- RLS allows operators to manage only rows where `funding_source = 'operator'`
- operator UI hardcodes `funding_source: 'operator'`
- admin UI is the only current surface that can intentionally create platform-funded promos

Phase 6 implication:

- this is no longer an open business-rule question unless product explicitly changes the roadmap

### 3. Owner label semantics

Locked rule:

- `owner_label` is the persisted display attribution label copied into booking and finance records for promo-related review surfaces
- current canonical behavior is that `owner_label` defaults to the normalized promo code

Reason:

- operator promo creation sets `owner_label = code`
- tour-create promo draft creation sets `owner_label = code`
- admin promo creation currently also sets `owner_label = code`
- checkout resolution and booking persistence propagate `owner_label` into booking records

Phase 6 implication:

- unless there is a deliberate product decision later, Phase 6 should preserve the rule that `owner_label` is a stable booking/reporting attribution label and not a mutable freeform finance owner concept

### 4. Inactive promo reuse

Locked rule:

- inactive promo codes remain reserved and are not reusable by creating a new promo with the same code

Reason:

- the global unique index on normalized code remains in force regardless of active state

Phase 6 implication:

- operator and admin UX should communicate that deactivation disables future use but does not release the code for reuse

### 5. Promo scope resolution

Locked rule:

- promo resolution is operator-scoped first, then optionally narrowed to a specific tour
- a promo is valid only when it is active, within its validity window, and either global to the operator or attached to the requested tour

Reason:

- `resolve_tour_promotion(...)` enforces:
  - same operator as the tour
  - active status
  - starts and ends window
  - applicable tour match when present

### 6. Historical promo preservation

Locked rule:

- booking-time promo attribution is copied into booking records and finance snapshots so later promo edits do not rewrite historical booking meaning

Reason:

- booking creation persists:
  - `promo_campaign_id`
  - `promo_owner`
  - `promo_funding_source`
  - `promo_discount_value`
  - `price_before_promo`
- finance snapshot sync copies promo-linked fields into snapshot rows

Phase 6 implication:

- the promo row itself is not the historical source of truth after booking creation; the booking and finance snapshot are

### 7. Margin handling rule

Locked rule:

- platform-funded promos reduce platform margin before corrupting operator payable logic
- operator-funded promos remain on the operator side of the commercial outcome

Reason:

- the live promo finance migrations and commercial tests already implement this model

### 8. Traveler-facing price rule

Locked rule:

- the traveler pays the discounted booking total after promo application
- `price_before_promo` remains preserved for attribution and audit

Reason:

- checkout resolves promo previews against the base booking total
- booking creation stores both the discounted total and `price_before_promo`

## Schema And Implementation Audit

### Aligned with the locked rules

#### Promo table and uniqueness

- `operator_promotions` exists with normalized-code uniqueness via a global unique index
- discount type, positive value, percentage bounds, and valid date-window constraints are present

Status:

- aligned

#### RLS authority model

- operators can read their own promotions
- operators can manage only their own operator-funded promotions
- admins can manage all promotions

Status:

- aligned

#### Booking persistence

- `tour_bookings` stores all core promo attribution fields
- booking creation persists promo fields at booking time

Status:

- aligned

#### Promo resolution

- `resolve_tour_promotion(...)` enforces operator ownership, active state, time window, and optional tour scoping
- percentage promos respect `max_discount_value`

Status:

- aligned

#### Snapshot propagation

- finance snapshot sync copies promo ownership, funding source, discount value, and pre-promo pricing context into finance snapshots

Status:

- aligned

## Identified Gaps

These are not contradictions to the locked rules, but they are the Phase 6 gaps that remain to implement.

### Gap 1. `owner_label` semantics are implemented by convention, not enforced centrally

Current state:

- the UI consistently writes `owner_label = code`
- the database does not currently enforce that convention

Risk:

- a future client or script could write a different `owner_label` and silently change reporting semantics

Phase 6 action:

- decide whether to keep this as a documented convention or harden it with server-side normalization or validation

### Gap 2. Promo edit behavior is historically safe but not yet explicitly sign-off tested

Current state:

- historical bookings should remain safe because attribution is copied into booking and snapshot rows

Risk:

- refund, cancellation, and post-booking edit scenarios have not yet been fully validated end to end for promo-applied bookings

Phase 6 action:

- add targeted scenario coverage and production or staging sign-off

### Gap 3. Traveler-facing error states are still coarse

Current state:

- invalid promo resolution currently surfaces a generic invalid or inactive error path

Risk:

- traveler UX may not clearly distinguish expired, inactive, wrong-tour, or otherwise inapplicable promos

Phase 6 action:

- tighten promo validation UX and messaging in checkout

### Gap 4. Promo-attributed booking observability can be improved

Current state:

- promo performance appears in admin commercial reporting

Risk:

- support and finance may still need a more direct slice for promo-attributed bookings themselves, not just campaign totals

Phase 6 action:

- add a direct promo-attributed booking verification slice or query path

### Gap 5. Deposit-path behavior still needs deliberate validation

Current state:

- checkout recalculates payment terms from the discounted total

Risk:

- this is the correct intended behavior only if downstream booking confirmation and payment flows always agree with it

Phase 6 action:

- explicitly test promo-applied deposit flows and confirmation output

## Conclusion

The first two Phase 6 tasks are now closed at the planning and audit level:

- promo business rules are locked to the current live implementation
- the current schema and codepath audit shows the core model is already aligned

The next implementation work should move to scenario coverage, traveller pricing integrity, refund and cancellation validation, and promo-attributed booking sign-off.