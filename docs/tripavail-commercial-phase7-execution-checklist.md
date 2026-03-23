# TripAvail Commercial Phase 7 Execution Checklist

## Scope

This document defines the practical next phase after Phase 6 commercial sign-off.

The canonical commercial roadmap in `docs/tripavail-tour-operator-commercial-system-plan.md` ends at Phase 6 promotions.

Phase 7 is therefore defined here as the next application-layer and operations slice enabled by the already-shipped commercial foundation, admin control plane, and Phase 6 promotion validation.

Relevant references:

- `docs/tripavail-tour-operator-commercial-system-plan.md`
- `docs/tripavail-tour-operator-commercial-system-implementation-summary.md`
- `docs/tripavail-commercial-phase5-execution-checklist.md`
- `docs/tripavail-commercial-phase6-execution-plan.md`
- `docs/tripavail-phase6-follow-up-operator-dashboard-bookings-bug.md`

## Why Phase 7 Exists

By the end of Phase 6, TripAvail has:

- finance and snapshot foundations
- payout domain models and reports
- admin commercial controls
- promotion rules, tests, and production sign-off
- traveler and operator booking UX that now reflects commercial reality

What remains is the next operational layer on top of that foundation:

- operator-facing commercial visibility
- admin exception workflows that feel production-ready end to end
- recurring automation for billing and payout orchestration
- production-safe reconciliation and monitoring loops

## Phase 7 Name

Phase 7: Commercial Surfaces and Operations Automation

## Phase 7 Goal

Turn the commercial system from a validated domain foundation into an operator-usable and operations-ready product layer.

Phase 7 is complete when operators, admins, and background workflows can all act on the same commercial state without depending on ad hoc SQL inspection or partial dashboard views.

## Inputs From Prior Phases

Already complete and available:

- Phase 1 operator commercial foundation
- Phase 2 tier and billing engine
- Phase 3 operator product controls foundation
- Phase 4 bookings and finance snapshots
- Phase 5 admin control and reporting
- Phase 6 promotions sign-off on production booking surfaces

## Execution Checklist

### 1. Close summary-surface mismatches

- [ ] Fix the operator dashboard Recent Bookings mismatch so it reflects live operator booking data
- [ ] Audit other summary cards or dashboard widgets for data paths that diverge from the primary booking or finance surfaces
- [ ] Ensure every summary widget has a defined source of truth and empty-state rule
- [ ] Treat any UI mismatch between dashboard summaries and detail pages as a release-blocking data-integrity bug for this phase

### 2. Build operator-facing commercial visibility

- [ ] Add operator-facing billing summary cards showing current tier, membership fee, prior-cycle commission credit, and invoice status
- [ ] Add operator invoice history view using the existing billing and invoice data model
- [ ] Add operator payout history view using payout batch and payout item data
- [ ] Add operator explanation copy for payout holds, reversals, recovery balances, and payout eligibility timing
- [ ] Ensure operators can inspect their own commercial state without needing admin support for routine questions

### 3. Finish live feature-gate enforcement

- [ ] Audit actual tour creation and editing entry points against tier-based feature entitlements
- [ ] Enforce publish limits from the shared commercial rules engine across all live product paths
- [ ] Enforce gated premium features consistently in the operator UI, not only in backend logic or planning docs
- [ ] Add regression coverage for live feature-gated entry points that are still relying on soft UI assumptions

### 4. Automate billing-cycle and payout orchestration

- [ ] Define the production job path for billing-cycle closure
- [ ] Define the production job path for settlement eligibility updates after completion
- [ ] Define the production job path for payout batch creation and scheduled release
- [ ] Ensure every automation job is idempotent and safe to rerun
- [ ] Add operator-visible timestamps or status markers so background automation effects are traceable in the UI

### 5. Strengthen dispute, hold, and recovery workflows

- [ ] Add clearer operational drill-down for payout holds, reversals, and recovery balances
- [ ] Ensure support and finance teams can trace a booking from booking state to payout state to recovery state without raw SQL
- [ ] Add or refine UI surfaces for chargeback-like or dispute-related exceptional booking states if those workflows are still only partially modeled
- [ ] Validate that promo-applied bookings continue to reconcile correctly when hold or recovery workflows are involved

### 6. Expand reconciliation and monitoring loops

- [ ] Add a repeatable Phase 7 reconciliation checklist that compares UI totals, report views, and worker outcomes
- [ ] Define alert thresholds for payout backlog, recovery exposure, reconciliation mismatches, and stuck settlement states
- [ ] Add a support-ready slice for bookings whose UI surface and finance state disagree
- [ ] Ensure production monitoring distinguishes data-latency issues from true state corruption

### 7. Finish operator and admin productization

- [ ] Review operator dashboard information architecture so bookings, payouts, invoices, and exceptions form a coherent operator experience
- [ ] Review admin commercial workflows for excessive dependence on manual query inspection
- [ ] Add drill-down paths from summary cards into operator invoice, payout, risk, and booking detail views
- [ ] Remove temporary or placeholder commercial summary widgets that no longer meet production expectations

### 8. Record the Phase 7 operational runbook

- [ ] Define the daily or weekly checks for billing-cycle automation, payout readiness, reconciliation drift, and operator exceptions
- [ ] Define the escalation path when a dashboard summary and source-of-truth page disagree
- [ ] Define the minimum evidence required before manual intervention in automated payout or billing workflows
- [ ] Document how support should validate operator questions about promo, payout, balance-due, refund, and invoice state

## Definition of Done

Phase 7 is complete when all of the following are true:

- operator dashboards and commercial pages reflect live server truth consistently
- operators can inspect invoices, payout history, and major commercial states directly in product
- live feature-gate enforcement matches the commercial rules engine across real entry points
- billing and payout orchestration jobs are defined, repeatable, and observable
- hold, reversal, recovery, and dispute flows can be traced across booking, finance, and UI surfaces without ad hoc database inspection
- reconciliation and monitoring loops are documented and actionable for production operations

## Recommended Implementation Order

1. Fix dashboard summary mismatches
2. Deliver operator billing and payout visibility surfaces
3. Enforce feature gates across live entry points
4. Formalize billing and payout automation
5. Strengthen dispute, hold, and recovery workflows
6. Close monitoring and runbook gaps

## Concrete Execution Order And Code Targets

### 1. Dashboard summary mismatches

- [x] Wire live operator bookings into the dashboard recent bookings panel
- Primary files:
	- `packages/web/src/features/tour-operator/dashboard/TourOperatorDashboard.tsx`
	- `packages/web/src/features/tour-operator/dashboard/components/OperatorRecentBookings.tsx`
	- `packages/web/src/features/tour-operator/services/operatorPortalService.ts`
- Follow-on audit targets:
	- `packages/web/src/pages/tour-operator/OperatorBookingsPage.tsx`
	- `packages/web/src/pages/tour-operator/OperatorCommercialPage.tsx`
	- `packages/web/src/features/tour-operator/dashboard/components/ActiveToursGrid.tsx`

### 2. Operator billing and payout visibility

- [ ] Add billing summary cards to the operator commercial surface
- Primary files:
	- `packages/web/src/pages/tour-operator/OperatorCommercialPage.tsx`
	- `packages/web/src/features/tour-operator/services/operatorCommercialService.ts`
	- `packages/shared/src/commercial/*`
- [ ] Add operator invoice history and drill-down surfaces
- Primary files:
	- `packages/web/src/pages/tour-operator/OperatorCommercialPage.tsx`
	- `packages/web/src/features/tour-operator/components/*`
	- `supabase/migrations/*invoice*`
- [ ] Add operator payout history and payout state explanations
- Primary files:
	- `packages/web/src/pages/tour-operator/OperatorCommercialPage.tsx`
	- `packages/web/src/features/tour-operator/services/operatorCommercialService.ts`
	- `packages/shared/src/commercial/payouts/*`

### 3. Live feature-gate enforcement

- [ ] Audit all tour creation and editing entry points against live entitlements
- Primary files:
	- `packages/web/src/pages/tour-operator/TourBuilderPage.tsx`
	- `packages/web/src/features/tour-operator/utils/operatorAccess.ts`
	- `packages/shared/src/commercial/*`
- [ ] Add regression coverage for publish limits and premium gates
- Primary files:
	- `packages/web/src/features/tour-operator/**/*test*.ts*`
	- `packages/shared/src/commercial/**/*test*.ts`

### 4. Billing-cycle and payout automation

- [ ] Define and implement idempotent billing-cycle closure jobs
- Primary files:
	- `packages/python-worker/*`
	- `scripts/*billing*`
	- `supabase/functions/*`
- [ ] Define and implement settlement eligibility and payout batch jobs
- Primary files:
	- `packages/python-worker/*`
	- `scripts/*payout*`
	- `packages/shared/src/commercial/payouts/*`

### 5. Dispute, hold, and recovery workflows

- [ ] Add operator/admin drill-down for holds, reversals, and recovery balances
- Primary files:
	- `packages/web/src/pages/tour-operator/OperatorCommercialPage.tsx`
	- `packages/web/src/pages/admin/AdminCommercialPage.tsx`
	- `packages/shared/src/commercial/recovery/*`
- [ ] Validate promo-applied bookings through exception paths
- Primary files:
	- `packages/web/src/features/booking/**/*test*.ts*`
	- `packages/shared/src/commercial/**/*test*.ts`
	- `supabase/tests/*`

### 6. Reconciliation and monitoring loops

- [ ] Add repeatable reconciliation checklist and support-facing mismatch slice
- Primary files:
	- `docs/stripe-go-live-readiness.md`
	- `docs/pickup-locations-monitoring.md`
	- `docs/tripavail-commercial-phase7-execution-checklist.md`
	- `packages/web/src/pages/admin/AdminReportsPage.tsx`
- [ ] Define alert thresholds and stuck-state reporting
- Primary files:
	- `packages/python-worker/*`
	- `scripts/*monitor*`
	- `packages/web/src/pages/admin/AdminReportsPage.tsx`

### 7. Operational runbook

- [ ] Record the steady-state operator/admin support runbook for automated billing and payout exceptions
- Primary files:
	- `docs/tripavail-commercial-phase7-execution-checklist.md`
	- `docs/tripavail-phase6-follow-up-operator-dashboard-bookings-bug.md`
	- `docs/*runbook*`

## Current Assessment

There is no canonical pre-written Phase 7 artifact in the original commercial roadmap.

The intended next phase is therefore the practical next slice implied by:

- the implementation summary section `What This Foundation Enables Next`
- the application surfaces intentionally not built in the earlier foundation pass
- the now-completed Phase 6 production sign-off

That makes Phase 7 the correct place to close the operator commercial product layer and the automation-backed operational layer built on top of the completed commercial system.
