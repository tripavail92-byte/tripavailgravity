# TripAvail Operator Marketplace Work Log

Date: 2026-03-28
Scope: roadmap planning, P0 implementation, copy cleanup, analytics hardening, regression coverage, smoke QA hardening

## Summary

This work session moved the operator marketplace effort from release hardening into structured next-phase execution.

The day covered five main tracks:

1. finish Release 4.5 validation and hardening
2. create an industry-shaped backlog for the next major operator marketplace work
3. convert that backlog into sprint tickets
4. implement the remaining P0 trust, attribution, and copy gaps
5. harden automated validation so attribution failures are easier to detect in CI

## What Was Completed

### 1. Release 4.5 validation and hardening

Completed earlier in the day:

- Expanded storefront smoke QA to cover multiple public operators and a real traveler permutation.
- Added a real CI workflow for storefront QA.
- Fixed notification schema drift with a compatibility migration.
- Removed the old trigger-suppression workaround from the storefront RPC regression.
- Deployed the compatibility migration remotely.
- Re-ran the remote storefront SQL regression successfully.
- Re-ran the storefront smoke flow successfully.

Key result:

- Release 4.5 validation and hardening was brought to a completed state before moving into new feature work.

### 2. Industry-shaped backlog and planning

Created a benchmark-informed backlog for what should come next after Release 4.5.

Research and framing used:

- internal repo planning and benchmark docs
- public marketplace patterns aligned to Airbnb-style trust rules and Booking.com-style visibility, content quality, and conversion behavior

Created:

- [docs/operator-marketplace-next-major-todo.md](docs/operator-marketplace-next-major-todo.md)

This backlog defines:

- product rules for trust-first marketplace growth
- P0 to P6 priority order
- rollout gates
- friendly-language guidelines
- a recommended sprint sequence

### 3. Sprint ticket conversion

Converted the backlog into ticket-ready sprint work with owners, dependencies, and acceptance criteria.

Created:

- [docs/operator-marketplace-sprint-tickets.md](docs/operator-marketplace-sprint-tickets.md)

The sprint ticket doc includes:

- Sprint 1: trust, attribution, and friendly copy
- Sprint 2: moderation and governance
- Sprint 3: ranking calibration
- Sprint 4: discovery rollout
- validation gates and immediate build order

Important scope note:

- The P1 to P5 tracks, rollout gates, `do not build yet` guardrails, and the friendly-language checklist were defined and documented today, but they were not implemented today except where the session explicitly completed remaining P0 work and copy cleanup.

### 3a. Planned today but not implemented today

These tasks were part of the planning output created today and are now captured in the backlog and sprint docs, but they remain follow-up work rather than completed implementation.

P1 ranking calibration:

- freeze and document first score inputs
- keep score admin-only during calibration
- add reason codes and inspectable score inputs
- calibrate sparse-data handling and known strong-versus-weak operator ordering

P2 moderation and risk tooling:

- create a flagged review triage queue
- expand suspicious-review heuristics
- add clearer concern-to-resolution workflow states
- improve complaint-heavy operator visibility and auditability

P3 operator console cleanup:

- split verification into its own route
- split public preview into its own route
- potentially split business profile, fleet, and other storefront editing areas into clearer dedicated surfaces

P4 public discovery integration:

- trust-first search experiments
- operator comparison surfaces
- featured placement rules based on blended quality rather than rating alone

P5 measurement and ops hardening:

- richer storefront funnel reporting
- operator-versus-tour attribution comparisons
- time-window comparison views
- complaint-rate and reliability integration into operational reporting
- stronger QA and seeded scenario coverage for ranking and quality outcomes

Rollout gates defined today:

- Gate A: Trust and attribution ready
- Gate B: Ranking calibration ready
- Gate C: Discovery experiment ready

`Do not build yet` guardrails defined today:

- do not expose raw public quality scores yet
- do not rank publicly on star rating alone
- do not overbuild badge systems that travelers cannot understand
- do not do a major schema rewrite before the ranking/search layer proves it is necessary

Friendly-language checklist defined today:

- replace internal metric names in public UI with readable product language
- prefer plain-language trust and concern wording
- keep admin and operator wording direct but understandable

Where these were documented:

- [docs/operator-marketplace-next-major-todo.md](docs/operator-marketplace-next-major-todo.md)
- [docs/operator-marketplace-sprint-tickets.md](docs/operator-marketplace-sprint-tickets.md)

### 4. Public storefront trust and concern-reporting completion

Updated the public operator storefront in:

- [packages/web/src/pages/traveller/OperatorProfilePage.tsx](packages/web/src/pages/traveller/OperatorProfilePage.tsx)

Changes made:

- Added clearer traveler-facing response behavior wording in the hero.
- Changed response copy from technical phrasing to plain language.
- Renamed the trust section to `Why travelers trust this operator`.
- Renamed the report action from `Report operator` to `Report a concern`.
- Simplified the concern-report dialog title, description, placeholder, and submit CTA.
- Added an explicit mobile concern CTA in the bottom action bar.
- Preserved desktop share and concern actions and made the public trust layer feel more product-facing and less internal.

Key result:

- Public storefront trust and concern reporting now read more like a traveler product and less like internal moderation tooling.

### 5. Operator storefront analytics improvements

Updated operator-facing analytics in:

- [packages/web/src/pages/tour-operator/OperatorStorefrontAnalyticsPage.tsx](packages/web/src/pages/tour-operator/OperatorStorefrontAnalyticsPage.tsx)

Functional work completed:

- Added a per-tour booking journey breakdown.
- Added client-side computation of per-tour journey rows from storefront event data.
- Used `tour_id` plus session-scoped profile-view tracking to derive per-tour attribution without introducing a new backend RPC.
- Added per-tour export rows to the analytics CSV export.

Copy and wording improvements completed:

- `Attributed Starts` -> `Bookings After A Profile View`
- `Attribution Rate` -> `Profile View To Booking Rate`
- `Response behaviour` -> `Reply behavior`
- simplified the analytics subtitle and highlight text to plain language

Key result:

- Operators can now inspect tour-level journey behavior instead of only seeing operator totals.

### 6. Operator reputation copy cleanup

Updated:

- [packages/web/src/pages/tour-operator/OperatorReputationPage.tsx](packages/web/src/pages/tour-operator/OperatorReputationPage.tsx)

Changes made:

- Renamed `Attributed Starts` to `Bookings After Profile Views`.
- Renamed `Attribution Rate` to `Profile View To Booking Rate`.
- Simplified response wording to `Replies to ... of traveler messages`.
- Replaced technical `response behaviour` phrasing with `reply behavior`.

Key result:

- Operator reputation surfaces now use clearer marketplace language for trust and attribution metrics.

### 7. Admin storefront wording cleanup

Updated:

- [packages/web/src/pages/admin/AdminDashboardPage.tsx](packages/web/src/pages/admin/AdminDashboardPage.tsx)
- [packages/web/src/pages/admin/AdminPartnersPage.tsx](packages/web/src/pages/admin/AdminPartnersPage.tsx)

Changes made:

- `Attributed starts` -> `Bookings after profile views`
- `Attribution rate` -> `Profile view to booking rate`
- `quality score` -> `marketplace score`
- simplified explanatory copy so admins can understand the metrics without engineering translation

Key result:

- Admin storefront analytics now keep operational meaning while reading more clearly.

### 8. Traveler booking and checkout copy cleanup

Updated:

- [packages/web/src/pages/checkout/BookingConfirmationPage.tsx](packages/web/src/pages/checkout/BookingConfirmationPage.tsx)
- [packages/web/src/pages/traveller/TravelerBookingDetailPage.tsx](packages/web/src/pages/traveller/TravelerBookingDetailPage.tsx)

Changes made:

- `Promo attribution` -> `Promo source`

Key result:

- The last clearly traveler-facing promo wording in booking surfaces was simplified.

### 9. Internal operator commercial wording cleanup

Updated:

- [packages/web/src/pages/tour-operator/OperatorCommercialPage.tsx](packages/web/src/pages/tour-operator/OperatorCommercialPage.tsx)

Change made:

- `Verify payout status, promo attribution, and traveler outcome.` -> `Verify payout status, promo source, and traveler outcome.`

Key result:

- Internal operator ops copy now avoids the last visible internal-sounding promo phrase in the reviewed page surfaces.

### 10. Storefront SQL regression hardening

Updated:

- [supabase/tests/operator_storefront_quality_rpc_test.sql](supabase/tests/operator_storefront_quality_rpc_test.sql)

What changed:

- Added a second booking-start control case with no prior profile view.
- Preserved the original attributed booking-start case.
- Added explicit assertions that:
  - profile views = 2
  - unique visitors = 2
  - engaged visitors = 1
  - booking starts = 2
  - attributed booking starts = 1
  - attributed conversion rate = 50.00
- Updated quality-score assertions so booking starts total 2 while attributed booking starts remain 1.

Key result:

- The regression now proves that direct booking starts are not misclassified as storefront-attributed booking starts.

### 11. End-to-end storefront smoke hardening

Updated:

- [scripts/qa_storefront_flows.mjs](scripts/qa_storefront_flows.mjs)

What changed:

- Added an explicit traveler-attributed booking-start session.
- Added an explicit traveler direct-booking session with no profile view.
- Added event-stream checks proving:
  - attributed session contains `profile_view -> tour_click -> booking_start`
  - direct session contains only `booking_start`
- Added analytics-delta checks proving:
  - booking starts delta = 2
  - attributed booking starts delta = 1
  - at least one new booking start remains outside attributed counts
- Added a dedicated smoke check named `storefront_booking_attribution_split`.

Key result:

- The live QA flow now validates the same direct-vs-attributed booking distinction end to end, not just in isolated SQL regression.

### 12. CI diagnostics improvement for attribution split

Updated:

- [scripts/qa_storefront_flows.mjs](scripts/qa_storefront_flows.mjs)
- [.github/workflows/storefront-qa.yml](.github/workflows/storefront-qa.yml)
- [.github/workflows/storefront-qa-example.yml](.github/workflows/storefront-qa-example.yml)

What changed:

- Added a dedicated machine-greppable log marker to the smoke run:
  - `STORE_FRONT_ATTRIBUTION_SPLIT=PASS attributed_booking_delta=1 direct_booking_delta=1`
- Updated both workflow variants to fail if that marker is missing.

Key result:

- GitHub Actions can now report attribution-split failures more directly instead of only surfacing a generic smoke failure.

## Validation Performed

### Diagnostics

Verified editor diagnostics with no errors for the files edited during this work.

This included checks on:

- public storefront pages
- operator analytics and reputation pages
- admin dashboard and partner review pages
- booking confirmation and booking detail pages
- operator commercial page
- smoke script and workflow files

### Commands Run

Executed during the session:

- `npm run db:test:operator-quality:remote`
- `npm run qa:storefront:flows`

Observed results:

- Remote SQL regression completed successfully after the direct-vs-attributed control case was added.
- Storefront smoke suite passed after end-to-end attribution split assertions were added.
- Storefront smoke suite passed again after the dedicated attribution log marker was added.

### Smoke Output Highlights

Confirmed in live smoke output:

- attributed session events: `profile_view`, `tour_click`, `booking_start`
- direct session events: `booking_start`
- analytics delta:
  - `booking_starts = 2`
  - `attributed_booking_starts = 1`
- marker emitted:
  - `STORE_FRONT_ATTRIBUTION_SPLIT=PASS attributed_booking_delta=1 direct_booking_delta=1`

## Files Created Today

- [docs/operator-marketplace-next-major-todo.md](docs/operator-marketplace-next-major-todo.md)
- [docs/operator-marketplace-sprint-tickets.md](docs/operator-marketplace-sprint-tickets.md)
- [docs/operator-marketplace-work-log-2026-03-28.md](docs/operator-marketplace-work-log-2026-03-28.md)

## Files Updated Today In This Workstream

- [packages/web/src/pages/traveller/OperatorProfilePage.tsx](packages/web/src/pages/traveller/OperatorProfilePage.tsx)
- [packages/web/src/pages/tour-operator/OperatorStorefrontAnalyticsPage.tsx](packages/web/src/pages/tour-operator/OperatorStorefrontAnalyticsPage.tsx)
- [packages/web/src/pages/tour-operator/OperatorReputationPage.tsx](packages/web/src/pages/tour-operator/OperatorReputationPage.tsx)
- [packages/web/src/pages/admin/AdminDashboardPage.tsx](packages/web/src/pages/admin/AdminDashboardPage.tsx)
- [packages/web/src/pages/admin/AdminPartnersPage.tsx](packages/web/src/pages/admin/AdminPartnersPage.tsx)
- [packages/web/src/pages/checkout/BookingConfirmationPage.tsx](packages/web/src/pages/checkout/BookingConfirmationPage.tsx)
- [packages/web/src/pages/traveller/TravelerBookingDetailPage.tsx](packages/web/src/pages/traveller/TravelerBookingDetailPage.tsx)
- [packages/web/src/pages/tour-operator/OperatorCommercialPage.tsx](packages/web/src/pages/tour-operator/OperatorCommercialPage.tsx)
- [supabase/tests/operator_storefront_quality_rpc_test.sql](supabase/tests/operator_storefront_quality_rpc_test.sql)
- [scripts/qa_storefront_flows.mjs](scripts/qa_storefront_flows.mjs)
- [.github/workflows/storefront-qa.yml](.github/workflows/storefront-qa.yml)
- [.github/workflows/storefront-qa-example.yml](.github/workflows/storefront-qa-example.yml)

## Important Decisions Made

- Much of the original P0 work already existed in the repo, so the session focused on the real remaining gaps instead of duplicating implementation.
- Per-tour attribution was derived client-side from existing storefront events rather than adding a new RPC immediately.
- Copy cleanup targeted visible traveler, operator, and admin product wording first, rather than renaming internal implementation symbols.
- Attribution validation was strengthened at two levels:
  - isolated SQL regression
  - end-to-end smoke QA with CI markers

## Remaining Follow-Up Work

Still open after today:

- P1 ranking calibration follow-up iteration (recency weighting and broader live-data recalibration)
- P2 moderation and risk tooling expansion
- P3 operator console cleanup follow-up guidance and preview-flow clarity
- P4 public discovery integration implementation
- P5 measurement and ops hardening expansion
- rollout-gate execution and readiness reviews
- `do not build yet` guardrails should be preserved as constraints during future implementation
- friendly-language checklist should continue to be applied in future copy and UX work
- broader non-page copy sweep through shared components and service-driven labels if needed
- additional moderation/governance tickets from Sprint 2
- ranking calibration and admin-only quality-score iteration from Sprint 3
- public discovery rollout from Sprint 4

Latest tracker:

- [docs/operator-marketplace-complete-todolist-2026-03-28.md](docs/operator-marketplace-complete-todolist-2026-03-28.md)
- [docs/operator-marketplace-ranking-calibration-note-2026-03-28.md](docs/operator-marketplace-ranking-calibration-note-2026-03-28.md)

## Notes

- This log is scoped to the operator marketplace, trust, attribution, copy, and validation work completed in this session.
- The workspace may contain unrelated changes from other parallel workstreams that are not part of this log.