# TripAvail Commercial Phase 5 Execution Checklist

## Scope

This document turns the next commercial/admin phase into a concrete execution checklist.

For the canonical commercial roadmap, Phase 5 is the admin control and reporting layer that sits on top of the finance and promo foundations already shipped.

Relevant references:

- [docs/tripavail-tour-operator-commercial-system-plan.md](docs/tripavail-tour-operator-commercial-system-plan.md)
- [docs/tripavail-tour-operator-commercial-system-implementation-summary.md](docs/tripavail-tour-operator-commercial-system-implementation-summary.md)
- [docs/tripavail-commercial-phase4-execution-checklist.md](docs/tripavail-commercial-phase4-execution-checklist.md)
- [docs/tripavail-commercial-release-checklist.md](docs/tripavail-commercial-release-checklist.md)

## Current Baseline Already Delivered

The repo already contains much of the Phase 5 foundation.

### Admin commercial controls already present

- admin commercial overview page exists
- admin can assign operator membership tiers
- admin can place and release operator payout holds
- admin can reverse payout batches into recovery
- admin can resolve recovery balances manually
- admin can create and edit promotions, including platform-funded promos

### Reporting and finance visibility already present

- admin finance health reporting exists
- operator payout reporting exists with hold and recovery fields
- tier performance reporting exists
- reconciliation coverage exists in SQL regression tests
- admin reports surface exists for moderation/support workflows

### Validation already present

- remote SQL regressions cover core finance, payout, recovery, promo attribution, and reconciliation flows
- manual Phase 3 commercial/admin QA was completed
- payout-cycle verification exists as an executable integration script

## Phase 5 Goal

Turn the existing admin/commercial surface into an operational control plane that is auditable, decision-ready, and safe for ongoing production use.

This phase is about closing the gap between "the core controls exist" and "admins can run the commercial system confidently from them."

## Execution Checklist

### 1. Lock the canonical admin-commercial scope

- [x] Confirm that the commercial roadmap now treats promo completion as Phase 4 and admin control/reporting as Phase 5
- [x] Mark which existing Phase 5 deliverables are already satisfied by the current admin commercial page and finance views
- [x] Separate true Phase 5 gaps from already-delivered capabilities so work does not duplicate existing functionality
- [x] Record the canonical acceptance criteria for admin actions that change money state versus those that are read-only

### 2. Harden admin money-state actions

- [x] Verify every admin money-state action requires a reason and persists that reason historically
- [x] Verify payout hold apply/release actions are clearly distinguishable from automatic holds
- [x] Verify payout batch reversal leaves a complete audit trail linking the original batch, reversal event, and resulting recovery exposure
- [x] Verify manual recovery resolution records who performed the action, when, and why
- [x] Add targeted regression coverage for admin-triggered hold, release, reversal, and recovery flows if any state transitions remain untested

### 3. Finish auditability and admin traceability

- [x] Add or confirm an admin action log for commercial operations if one does not already exist elsewhere
- [x] Ensure tier changes record operator, old tier, new tier, actor, timestamp, and reason in an admin-readable way
- [x] Ensure payout-hold history is visible, not just current payout-hold state
- [x] Ensure reversal and recovery history can be reconstructed without reading raw database tables manually
- [x] Ensure promo create/edit actions by admins are auditable separately from operator-created promos

### 4. Expand reporting from finance health into decision support

- [x] Add a dedicated report for operator billing lifecycle by cycle and invoice status
- [x] Add a dedicated report for payout operations by status: eligible, scheduled, paid, reversed, recovery pending, on hold
- [x] Add a dedicated report for promo performance by campaign, operator, and funding source
- [x] Add a dedicated report for operator risk signals including payout holds, repeated cancellations, KYC blockers, and fraud-review flags
- [x] Add a report or dashboard slice for commercial trend monitoring over time instead of single-point totals only

### 5. Close reconciliation coverage for admin-facing totals

- [x] Confirm admin UI totals reconcile with the CLI and SQL reconciliation outputs for all major buckets
- [x] Add a verification path for invoice totals versus commission credits and membership fees by billing cycle
- [x] Add a verification path for hold, refund, reversal, and recovery totals against payout report outputs
- [x] Add a verification path for promo-funded discount totals versus payout margin effects
- [x] Treat any unexplained mismatch between admin UI and SQL views as a release blocker

### 6. Improve admin usability for exception handling

- [x] Add clearer grouping for operators who require immediate attention: payout hold, fraud review, recovery pending, KYC blocked
- [x] Add filters for payout status, tier, KYC status, promo funding source, and risk state
- [x] Add direct drill-down from summary cards into the underlying operator or payout rows
- [x] Add exportable views for finance operations where admins currently need to copy values manually
- [x] Make high-risk actions visually explicit so reversal and recovery operations cannot be confused with read-only inspection

### 7. Define the Phase 5 operational review pack

- [x] Create a single runbook for weekly commercial admin review
- [x] Define the minimum checks for payout readiness, recovery exposure, reconciliation status, and KYC blockers
- [x] Define the minimum evidence needed before an admin manually releases a payout hold
- [x] Define the minimum evidence needed before an admin resolves or writes down a recovery item
- [x] Define the escalation path for finance mismatches, chargebacks, and suspicious cancellation patterns

## Definition of Done

Phase 5 is complete when all of the following are true:

- admins can inspect and change commercial money-state safely without bypassing auditability
- every hold, release, reversal, recovery, and tier-change action is attributable to an actor and reason
- admin reporting covers billing, payout, finance health, promo impact, and operator risk clearly enough for operational decisions
- admin-visible totals reconcile with SQL and CLI finance checks without unexplained mismatches
- operational review and exception-handling steps are documented well enough to run repeatedly without tribal knowledge

## Recommended Implementation Order

1. Auditability gap review for existing admin actions
2. Regression coverage for admin-triggered money-state changes
3. Reporting and drill-down expansion
4. Reconciliation alignment between UI and SQL outputs
5. Weekly operations runbook and sign-off criteria

## Current Assessment

Phase 5 is not a greenfield build.

The foundation already exists in the admin commercial page, payout report views, finance health views, recovery workflows, and reconciliation tests.

The remaining work described above has been completed through the shipped admin commercial history feed, the reporting and reconciliation surfaces on the admin commercial page, and the weekly operations runbook in `docs/tripavail-commercial-phase5-weekly-ops-runbook.md`.

Phase 5 is therefore complete against the canonical admin control and reporting scope.