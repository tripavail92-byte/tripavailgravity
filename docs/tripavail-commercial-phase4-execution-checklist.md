# TripAvail Commercial Phase 4 Execution Checklist

## Scope

This document turns the next commercial phase into an execution checklist.

For the commercial/admin track, the practical next phase is the promo-system completion layer on top of the already-shipped finance foundation.

Relevant existing references:

- [docs/tripavail-tour-operator-commercial-system-plan.md](docs/tripavail-tour-operator-commercial-system-plan.md)
- [docs/tripavail-tour-operator-commercial-system-implementation-summary.md](docs/tripavail-tour-operator-commercial-system-implementation-summary.md)

## Current Baseline Already Delivered

The following promo foundations already exist in the live codebase:

### Database and finance layer

- `operator_promotions` table exists with RLS and admin/operator management rules
- `tour_bookings` stores promo-linked finance fields:
  - `promo_campaign_id`
  - `promo_owner`
  - `promo_funding_source`
  - `promo_discount_value`
  - `price_before_promo`
- `resolve_tour_promotion(...)` exists and resolves valid promo code applications
- booking finance snapshot sync already incorporates promo attribution
- platform-funded promo allocation logic already adjusts commission handling instead of corrupting operator payable values

### Frontend surfaces already present

- operator commercial page already supports promo create/update/list flows
- admin commercial page already supports promo inventory and promo editing flows
- traveller checkout already supports promo-code preview and discounted totals
- tour booking creation already persists promo attribution into booking records

## Phase 4 Goal

Complete the promo system so it is not only implemented, but operationally safe, auditable, and sign-off ready.

## Execution Checklist

### 1. Confirm source-of-truth promo rules

- [ ] Lock the canonical business rule for `owner_label` semantics
- [ ] Confirm when `funding_source = platform` is allowed and who can create those promos
- [ ] Confirm whether promo codes must remain globally unique or only unique per operator
- [ ] Confirm whether inactive promos must remain reusable or permanently reserved

### 2. Close finance scenario coverage

- [ ] Add scenario-level tests for operator-funded fixed-amount promos
- [ ] Add scenario-level tests for operator-funded percentage promos with `max_discount_value`
- [ ] Add scenario-level tests for platform-funded promos where discount is absorbed by platform margin
- [ ] Add scenario-level tests for bookings without promos to confirm no regression in payout math
- [ ] Add scenario-level tests for refunds and cancellations on promo-applied bookings
- [ ] Add scenario-level tests for payout eligibility after promo-applied booking completion

### 3. Harden admin promo controls

- [ ] Verify admin can create platform-funded promos intentionally and auditably
- [ ] Add explicit UI labeling that distinguishes operator-funded vs platform-funded campaigns
- [ ] Add guardrails to prevent operators from creating platform-funded campaigns
- [ ] Add audit-log coverage for admin promo create/update actions if not already captured elsewhere

### 4. Finish reporting and observability

- [ ] Add admin reporting for promo performance by campaign
- [ ] Add reporting for promo-funded discount totals by funding source
- [ ] Add reporting for operator margin impact versus platform margin impact
- [ ] Add finance reconciliation checks ensuring promo discounts never rewrite historical commercial snapshots
- [ ] Add a simple verification query or dashboard slice for promo-attributed bookings

### 5. Tighten traveller-facing UX

- [ ] Confirm checkout shows promo attribution consistently before payment
- [ ] Confirm booking confirmation preserves promo-adjusted total and does not show stale pre-discount totals
- [ ] Confirm any deposit calculations use the discounted booking total intentionally
- [ ] Confirm invalid, expired, and inapplicable promo states return clear errors

### 6. Tighten operator-facing UX

- [ ] Show promo scope and funding source clearly in operator promo inventory
- [ ] Confirm operators can distinguish all-trip promos from tour-specific promos
- [ ] Confirm edit/update paths do not silently change finance meaning for already-booked reservations
- [ ] Confirm operator UI does not expose platform-only internal finance detail beyond what is intended

### 7. Production sign-off checklist

- [ ] Create one operator-funded promo in production or staging-equivalent validation environment
- [ ] Apply the promo in traveller checkout and complete a booking
- [ ] Confirm booking record persists promo attribution fields
- [ ] Confirm admin commercial and admin bookings surfaces show the promo-attributed booking correctly
- [ ] Confirm payout/commission math remains correct for that booking snapshot

## Definition of Done

Phase 4 is complete when all of the following are true:

- promo attribution is correct at booking time and preserved historically
- platform-funded promos reduce platform margin without corrupting operator payable calculations
- operator-funded promos reduce operator receivable in a traceable and reportable way
- admin can inspect promo activity and funding source without bypassing auditability
- traveller checkout, booking confirmation, admin reporting, and payout math all agree on the same promo-adjusted commercial outcome

## Recommended Implementation Order

1. Finance scenario tests
2. Admin promo control hardening
3. Reporting and reconciliation views
4. Traveller/operator UX cleanup
5. Final production promo sign-off run

## Current Assessment

This is not a zero-to-one build anymore.

The repo already has most of the promo foundation in place. The remaining work is primarily:

- scenario validation
- finance/reporting hardening
- admin/control polish
- final end-to-end sign-off for promo-attributed bookings