# TripAvail Operator Marketplace Sprint Tickets

Updated: 2026-03-28
Source backlog: `docs/operator-marketplace-next-major-todo.md`
Planning horizon: 4 sprints

## Owner Legend

- Product: PM / product owner
- Design: product design
- Web: frontend implementation
- Data: Supabase / SQL / analytics implementation
- Ops: trust and moderation operations
- QA: test automation and manual verification

## Sprint 1: Trust, Attribution, And Friendly Copy

### T1. Public trust hero completion

- Owner: Web
- Supporting owners: Design, Product
- Dependencies: existing response metrics RPCs and public operator profile page
- Scope: show response rate, average reply time, trust wording cleanup, and clearer traveler-facing labels in the public storefront hero
- Acceptance criteria:
  - Public operator page shows response rate and average reply time above the fold.
  - Trust section heading and badge copy use plain language.
  - No traveler-facing label uses internal phrases like `attributed conversion rate` or `responsiveness score`.

### T2. Public sharing and concern reporting

- Owner: Web
- Supporting owners: Product, Ops
- Dependencies: public operator page and reports table flow
- Scope: ensure `Share profile` and `Report a concern` are visible on desktop and mobile, and simplify the concern-report flow copy
- Acceptance criteria:
  - Desktop and mobile both expose share and concern actions.
  - Concern dialog copy is readable and non-technical.
  - Concern submissions still create `reports` rows correctly.

### T3. Storefront-to-booking attribution hardening

- Owner: Data
- Supporting owners: Web, QA
- Dependencies: `record_operator_storefront_event`, booking-start instrumentation, operator storefront events table
- Scope: preserve storefront attribution through booking starts and validate that attributed starts remain accurate for anonymous and authenticated flows
- Acceptance criteria:
  - Booking starts after a storefront profile view are still counted correctly.
  - Direct booking starts without a prior profile view are not misclassified.
  - Regression coverage includes both attributed and non-attributed booking-start cases.

### T4. Per-tour attribution breakdown

- Owner: Web
- Supporting owners: Data, Product
- Dependencies: storefront events with `tour_id`, operator analytics page
- Scope: add a per-tour breakdown for tour clicks, booking starts, and bookings after a profile view
- Acceptance criteria:
  - Operator analytics page shows a per-tour funnel summary.
  - Exported summary includes per-tour rows.
  - Tour breakdown does not replace operator totals; it complements them.

### T5. Admin overview copy cleanup

- Owner: Web
- Supporting owners: Product
- Dependencies: admin storefront overview cards
- Scope: rename technical admin copy where simple language is better without losing operational meaning
- Acceptance criteria:
  - `Attributed starts` becomes clearer wording.
  - Technical explanatory copy is rewritten in plain English.
  - Admins can still understand what the metric means without engineering help.

## Sprint 2: Moderation And Governance

### T6. Flagged review triage queue

- Owner: Web
- Supporting owners: Ops, Product
- Dependencies: flagged review fields on `tour_booking_reviews`
- Scope: create a dedicated admin review queue for flagged reviews with useful moderation context
- Acceptance criteria:
  - Admins can filter and review flagged reviews in one place.
  - Moderation flags are visible and understandable.
  - Review actions are auditable.

### T7. Concern-to-resolution workflow

- Owner: Ops
- Supporting owners: Web, Product
- Dependencies: reports data model and admin reports surfaces
- Scope: make concern handling readable with status stages and operator-review notes
- Acceptance criteria:
  - Concern states distinguish `open`, `in review`, `resolved`, and `dismissed`.
  - Ops can record review notes and outcomes.
  - Complaint-heavy operators are easier to spot.

### T8. Review safeguard expansion

- Owner: Data
- Supporting owners: Ops, QA
- Dependencies: current review safeguard trigger and moderation flags
- Scope: strengthen heuristics for suspicious or low-value reviews
- Acceptance criteria:
  - Duplicate-text and abuse heuristics are expanded safely.
  - False positives are reviewed against seeded fixtures.
  - SQL regression coverage is updated.

## Sprint 3: Ranking Calibration

### T9. Admin-only quality score calibration

- Owner: Data
- Supporting owners: Product, Ops
- Dependencies: quality score RPC, admin storefront analytics, moderation inputs
- Scope: calibrate score weights, thresholds, and sparse-data handling for internal use only
- Acceptance criteria:
  - Known strong operators rank above known weak operators in calibration review.
  - Sparse-data operators are not over-promoted.
  - Score reasons are inspectable by admins.

### T10. Admin ranked operator list

- Owner: Web
- Supporting owners: Product, Data
- Dependencies: stable quality score output
- Scope: provide an internal ranked operator view for validation before public rollout
- Acceptance criteria:
  - Admins can sort and inspect operators by marketplace score.
  - Score inputs are visible enough for review.
  - No public discovery behavior changes yet.

## Sprint 4: Discovery Rollout

### T11. Trust-first search experiment

- Owner: Product
- Supporting owners: Web, Data, QA
- Dependencies: calibrated internal ranking and moderation readiness
- Scope: introduce limited trust-first discovery experiments for operator surfaces
- Acceptance criteria:
  - Ranking rules are documented before rollout.
  - Discovery changes can be staged or toggled.
  - QA can compare legacy and experiment behavior.

### T12. Operator comparison and featured placement

- Owner: Web
- Supporting owners: Product, Design
- Dependencies: trust-first search experiment and calibrated quality model
- Scope: build comparison and featured placement surfaces using friendly labels instead of raw score exposure
- Acceptance criteria:
  - Travelers can compare operators on recognizable trust signals.
  - Featured placement is based on blended quality, not rating alone.
  - Public UI does not expose raw internal score numbers.

## Cross-Sprint Validation Gates

### Gate A: Trust-ready

- Owner: QA
- Dependencies: Sprint 1 complete
- Acceptance criteria:
  - Public storefront hero shows response behavior.
  - Mobile concern reporting is present.
  - Operator analytics show per-tour funnel rows.

### Gate B: Moderation-ready

- Owner: Ops
- Dependencies: Sprint 2 complete
- Acceptance criteria:
  - Flagged reviews can be triaged quickly.
  - Concern handling is operationally understandable.
  - High-risk operators can be identified without engineering help.

### Gate C: Ranking-ready

- Owner: Product
- Dependencies: Sprint 3 complete
- Acceptance criteria:
  - Internal ranking feels explainable.
  - Score edge cases have been reviewed.
  - Public rollout plan is approved.

## Immediate Build Order

1. T1 Public trust hero completion
2. T2 Public sharing and concern reporting
3. T3 Storefront-to-booking attribution hardening
4. T4 Per-tour attribution breakdown
5. T5 Admin overview copy cleanup

That sequence keeps the current work aligned with recognizable marketplace practice: readable trust first, measurable outcomes second, amplification later.