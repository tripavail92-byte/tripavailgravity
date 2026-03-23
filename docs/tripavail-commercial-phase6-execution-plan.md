# TripAvail Commercial Phase 6 Implementation Plan

## Scope

This document defines the canonical implementation plan for Phase 6 of the commercial roadmap.

Per the commercial system plan, Phase 6 is the promotions layer that sits on top of the now-complete finance foundation and Phase 5 admin control plane.

Canonical source:

- `docs/tripavail-tour-operator-commercial-system-plan.md`

Related implementation history:

- `docs/tripavail-commercial-phase4-execution-checklist.md`
- `docs/tripavail-commercial-phase5-execution-checklist.md`
- `docs/tripavail-commercial-phase5-weekly-ops-runbook.md`

## Phase 6 Goal

Finish the promotion system so promo ownership, traveller pricing, booking persistence, payout effects, refund behavior, and reporting all remain internally consistent and operationally safe.

Phase 6 is complete when promo behavior is no longer merely implemented, but fully sign-off ready across checkout, booking creation, finance snapshots, payout math, admin reporting, and production validation.

## Canonical Deliverables

- promo ownership and funding logic
- traveller invoice adjustments
- promo-funded margin handling without corrupting operator payable logic

## Canonical Acceptance

- promotions never rewrite historical commercial snapshots incorrectly

## Current Baseline Already Delivered

The repo already contains much of the Phase 6 foundation.

### Promo persistence already present

- `operator_promotions` exists with admin and operator rules
- `tour_bookings` stores `promo_campaign_id`, `promo_owner`, `promo_funding_source`, `promo_discount_value`, and `price_before_promo`
- booking creation already persists promo attribution into booking records
- promo-linked fields already propagate into finance snapshots

### Pricing and payout foundations already present

- `resolve_tour_promotion(...)` already resolves valid promo applications
- traveller checkout already previews discounted totals
- platform-funded promo allocation logic already reduces platform margin instead of corrupting operator payable values
- promo data already appears in admin commercial reporting and payout reporting

### Admin and operator control surfaces already present

- operator commercial page supports promo create, list, and update paths
- admin commercial page supports promo inventory, promo editing, reporting, and promo audit history

## What Still Needs To Be Closed In Phase 6

The remaining work is not greenfield promo CRUD.

The remaining work is mostly:

- locking unresolved business rules
- closing scenario coverage around booking, payout, refund, and cancellation flows
- tightening traveller and operator UX around promo meaning
- verifying finance integrity under promo-applied edge cases
- completing production sign-off for a real promo-attributed booking lifecycle

## Implementation Streams

### Stream 1. Lock canonical promo business rules

Decisions to finalize before broader implementation:

- define the meaning of `owner_label` and where it is displayed
- confirm when `funding_source = platform` is allowed and which roles may create it
- confirm whether promo codes remain globally unique or only unique per operator
- confirm whether inactive promo codes remain permanently reserved or can be recycled
- confirm whether edits to active promos can affect future bookings only, never historical bookings

Output:

- one canonical rules document or checklist update that product, finance, and engineering all use

### Stream 2. Close promo finance scenario coverage

The key risk in Phase 6 is not CRUD failure but incorrect money movement under real scenarios.

Required coverage:

- operator-funded fixed amount promos
- operator-funded percentage promos with `max_discount_value`
- platform-funded promos where discount is absorbed by platform margin
- bookings without promos to prove no regression in core payout math
- cancellations and refunds on promo-applied bookings
- payout eligibility after promo-applied booking completion
- deposit flows where discounted total affects downstream payment terms

Implementation expectation:

- SQL regression or integration tests for the finance layer
- targeted UI or service tests for booking and checkout surfaces where needed

### Stream 3. Harden traveller pricing and invoice behavior

Traveller-facing promo behavior must remain coherent before payment and after booking creation.

Required outcomes:

- checkout shows base price, promo effect, and discounted total consistently
- deposit calculations intentionally use the discounted total when business rules require it
- invalid, expired, inactive, or inapplicable promo errors are explicit
- booking confirmation reflects the promo-adjusted commercial outcome and does not revert to stale pre-promo values
- booking review and payment flows never disagree about the final payable amount

### Stream 4. Harden operator and admin promo controls

Even though promo create and edit surfaces exist, Phase 6 still needs control hardening.

Required outcomes:

- clear UI distinction between operator-funded and platform-funded promos
- clear distinction between all-trip promos and trip-scoped promos
- operators cannot create or mutate platform-funded campaigns
- edits to promos cannot silently change the finance meaning of already-booked reservations
- admin-created promo actions remain auditable in history

### Stream 5. Finish promo reporting and observability

Phase 5 delivered the reporting control plane. Phase 6 should deepen promo-specific evidence within that plane.

Required outcomes:

- promo performance by campaign is reliable enough for commercial review
- discount totals by funding source are visible and explainable
- operator margin impact versus platform margin impact is distinguishable
- promo-attributed bookings can be isolated for support and finance review
- reconciliation views prove that historical promo-applied bookings do not mutate older finance snapshots incorrectly

### Stream 6. Validate refund and cancellation integrity

Promo math is not complete until post-booking adverse flows are verified.

Required outcomes:

- traveller cancellation on promo-applied booking preserves historical promo attribution
- operator cancellation on promo-applied booking preserves commercial snapshot integrity
- refund overrides and chargeback-like adjustments do not remove promo history incorrectly
- payout recovery, reversal, and refund reporting continue to reconcile when promo-applied bookings are involved

### Stream 7. Complete production sign-off

Phase 6 should end with a real or staging-equivalent end-to-end promo lifecycle check.

Required steps:

- create a controlled operator-funded promo
- apply it in traveller checkout
- complete a booking with that promo
- confirm booking persistence of promo fields
- confirm admin surfaces show the promo-attributed booking correctly
- confirm payout and commission math remain correct for that booking snapshot
- if possible, validate one refund or cancellation path on a promo-attributed booking in a non-destructive environment

## Recommended Implementation Order

1. Lock business rules and missing promo semantics
2. Add finance scenario coverage and deposit-path coverage
3. Harden traveller pricing and booking confirmation behavior
4. Harden operator and admin promo controls
5. Expand promo observability and promo-attributed booking views
6. Validate refund and cancellation integrity
7. Execute final production or staging sign-off run

## Engineering Plan

### Milestone A. Rules and schema validation

- verify the canonical promo business rules against current constraints and RLS
- document any rule gaps before UI or finance edits

### Milestone B. Finance and booking correctness

- add scenario coverage for promo booking, payout, refund, and cancellation cases
- verify snapshot immutability behavior for historical bookings

### Milestone C. UX consistency

- tighten traveller checkout and confirmation messaging
- tighten operator inventory labeling and edit semantics

### Milestone D. Promo operations visibility

- ensure promo-attributed bookings and margin impact can be reviewed in admin surfaces
- add any missing promo-specific slices needed for finance or support review

### Milestone E. Sign-off validation

- perform the end-to-end validation run
- record evidence and final acceptance against the canonical Phase 6 checklist

## Risks To Manage

- promo edits accidentally changing finance meaning for future and historical bookings differently
- deposit flows using inconsistent totals between checkout, payment, and booking confirmation
- platform-funded margin offsets mutating commission or payout values incorrectly
- refund and cancellation flows stripping promo attribution or rewriting finance snapshots
- reporting views showing promo labels without enough evidence to explain commercial impact

## Definition Of Done

Phase 6 is complete when all of the following are true:

- promo rules are canonical and documented
- promo-applied booking math is covered for fixed, percentage, platform-funded, operator-funded, refund, cancellation, and payout flows
- traveller checkout, booking confirmation, booking persistence, admin reporting, and payout math agree on the same promo-adjusted outcome
- operator and admin promo controls are explicit and safe
- promo-attributed bookings can be inspected without bypassing auditability or reading raw database tables manually
- final production or staging sign-off proves that promo-applied bookings preserve historical finance state correctly