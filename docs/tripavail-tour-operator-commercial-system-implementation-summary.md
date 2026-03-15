# TripAvail Tour Operator Commercial System Implementation Summary

## Purpose

This document records what was implemented for the first production foundation of the TripAvail Tour Operator Commercial System.

The goal of this pass was not to build every operator/admin screen immediately. The goal was to establish the commercial domain model, persistent finance structures, reusable business rules, reporting primitives, and database automation so the rest of the product can attach to one stable commercial backbone.

## What Was Delivered

This implementation delivered three core pieces:

1. A detailed implementation blueprint adapted to the current repo.
2. A reusable shared commercial rules engine for tiers, commission, billing adjustment, and payout timing.
3. A deployed Supabase schema foundation covering membership tiers, operator commercial profiles, billing cycles, invoices, finance snapshots, ledgers, payouts, admin controls, and reporting views.

## Files Added Or Updated

### Planning and handoff documents

- `docs/tripavail-tour-operator-commercial-system-plan.md`
- `docs/tripavail-tour-operator-commercial-system-implementation-summary.md`

### Shared commercial rules engine

- `packages/shared/src/commercial/engine.ts`
- `packages/shared/src/index.ts`

### Test coverage

- `packages/web/src/features/commercial/commercialEngine.test.ts`

### Database foundation

- `supabase/migrations/20260315000021_operator_commercial_foundation.sql`

## Detailed Breakdown

## 1. Commercial System Plan Document

The file `docs/tripavail-tour-operator-commercial-system-plan.md` was created as the master execution blueprint.

It includes:

- the business objective for the commercial system
- how the design maps to the current repo instead of replacing existing flows blindly
- the connected end-to-end operator commercial lifecycle
- phased implementation order
- canonical statuses for operator standing, KYC, membership, settlement, and payouts
- the target data model
- design rules for historical finance integrity
- testing strategy across unit, integration, end-to-end, and reconciliation layers

This plan was written to ensure future implementation stays aligned with the live onboarding, KYC, booking, and Stripe architecture already in the codebase.

## 2. Shared Commercial Rules Engine

The file `packages/shared/src/commercial/engine.ts` was added as the first reusable commercial rules module.

This shared engine now contains:

- canonical membership tier codes: `gold`, `diamond`, `platinum`
- default configuration for each tier
- monthly membership fee per tier
- commission rate per tier
- publish limit per tier
- feature entitlements for:
  - multi-city pickup
  - Google Maps support
  - AI itinerary access
- AI monthly credit allocation
- support priority and ranking weight

### Functions added

- `getMembershipTierConfig(...)`
  - resolves the default commercial configuration for a tier
- `calculateCommissionAmount(...)`
  - calculates TripAvail commission from gross booking amount and commission percent
- `calculateMembershipAdjustment(...)`
  - applies the business rule `max(0, membership_fee - prior_cycle_commission_credit)`
- `buildBookingFinanceSnapshot(...)`
  - produces a normalized booking finance snapshot with commission amount and operator receivable estimate
- `getPublishLimitForTier(...)`
  - returns the tour publish limit for the current tier
- `canPublishAnotherTrip(...)`
  - resolves whether an operator can publish another trip in the current cycle
- `resolveFeatureGate(...)`
  - resolves whether a tier has access to a premium feature
- `calculateNextBusinessDay(...)`
  - advances payout eligibility to the next working day
- `calculatePayoutReleaseDate(...)`
  - wraps payout timing logic for service completion payout release

### Why this was important

Before this, there was no central commercial rules engine. That would have forced tier logic to be duplicated across UI, backend, admin tools, and tests. The new shared engine creates one place to define commercial rules and reuse them consistently.

### Export integration

`packages/shared/src/index.ts` was updated so the commercial engine is exported through the shared package entrypoint.

That keeps the new engine accessible to web, future workers, admin tooling, and any backend utilities that import from `@tripavail/shared`.

## 3. Commercial Engine Test Coverage

The file `packages/web/src/features/commercial/commercialEngine.test.ts` was added to validate the shared rules engine.

The test suite covers:

- commission calculation examples across tier rates
- full membership fee waiver by prior-cycle commission credit
- partial membership adjustment when credit does not cover the entire fee
- booking finance snapshot generation
- premium feature gating
- publish limit enforcement
- next-business-day payout timing

### What the tests prove

These tests prove the shared engine is stable enough to use as the commercial rules source for later UI and workflow integration.

## 4. Supabase Commercial Schema Foundation

The main delivery is the migration:

- `supabase/migrations/20260315000021_operator_commercial_foundation.sql`

This migration was not only written. It was also pushed successfully to the remote Supabase database.

## 5. New Enum Types Introduced

The migration introduces domain enums needed for consistent commercial behavior:

- `membership_tier_code_enum`
  - `gold`, `diamond`, `platinum`
- `operator_operational_status_enum`
  - `pending`, `active`, `restricted`, `suspended`
- `commercial_kyc_status_enum`
  - `not_submitted`, `pending_review`, `approved`, `rejected`, `resubmission_required`
- `membership_status_enum`
  - `active`, `grace_period`, `payment_due`, `overdue`, `suspended`
- `settlement_state_enum`
  - lifecycle states for booking settlement and payout readiness
- `payout_status_enum`
  - payout readiness, scheduling, hold, reverse, recovery status
- `ledger_entry_type_enum`
  - accounting-style commercial ledger event categories
- `invoice_status_enum`
  - invoice lifecycle states

### Admin role expansion

The migration also extends the existing `admin_role_enum` with:

- `finance_admin`
- `compliance_admin`

This was added so finance and commercial workflows can be permissioned separately from the existing broader admin roles.

## 6. New Commercial Tables

### `commercial_membership_tiers`

Stores tier-level defaults and capabilities.

It contains:

- monthly fee
- commission rate
- monthly publish limit
- premium feature booleans
- AI credit allowance
- support priority
- ranking weight

The table is seeded with three default tiers:

- Gold
- Diamond
- Platinum

### `operator_commercial_profiles`

Stores the live commercial state for each operator.

It contains:

- operational status
- commercial KYC status
- active membership tier
- membership standing
- commission rate snapshot at operator level
- monthly membership fee
- billing cycle dates
- next billing date
- payout hold state
- usage counters
- feature overrides

This table is the canonical operator-level commercial profile.

### `operator_tier_change_log`

Stores tier changes for auditability.

It captures:

- previous tier
- new tier
- admin who changed it
- reason
- timestamp

### `operator_feature_usage_monthly`

Stores commercial feature usage for the current or prior cycle.

It captures:

- published tours count
- multi-city pickup usage
- Google Maps usage
- AI itinerary credit usage

### `operator_billing_cycles`

Stores billing-cycle financial state.

It captures:

- cycle start/end
- membership fee
- prior-cycle commission credit
- adjustment applied
- final membership charge
- invoice status
- close timestamp

### `operator_membership_invoices`

Stores invoice/statement records tied to a billing cycle.

It captures:

- invoice number
- plan name
- membership fee
- commission credit
- adjustment applied
- final charge
- due date
- issued/paid timestamps
- payment status

### `operator_booking_finance_snapshots`

Stores booking-level commercial facts.

This is critical for audit-safe settlement.

It captures:

- operator and traveler identity
- operator membership tier at booking snapshot time
- membership standing at snapshot time
- booking total
- collected amount
- refund amount
- commission rate
- commission amount
- operator receivable estimate
- settlement state
- payout status
- payout availability timestamp
- structured notes

### `operator_commission_ledger`

Stores commission ledger rows linked to bookings.

It captures:

- booking total
- commission rate
- commission amount
- operator receivable estimate
- settlement state
- payout state
- recognition timestamp
- payout availability timestamp

### `operator_payout_batches`

Stores grouped payout runs.

It captures:

- batch reference
- scheduled date
- status
- gross / commission / payable totals
- processing admin

### `operator_payout_items`

Stores per-booking payout records.

It captures:

- payout batch linkage
- booking linkage
- operator linkage
- gross amount
- commission amount
- refund amount
- payable amount
- payout due date
- payout paid timestamp
- hold reason
- recovery amount

## 7. RLS and Access Control

Row Level Security was enabled on all newly introduced commercial tables.

Policies were created so that:

- service role can fully manage seed/config tables where needed
- operators can read their own commercial profile, billing, ledger, snapshot, usage, and payout rows
- travelers can read their own booking finance snapshots
- admins can manage the commercial datasets through authenticated access with `public.is_admin(auth.uid())`

This keeps the commercial system aligned with the repo’s existing security model instead of adding a separate access framework.

## 8. Commercial Helper Functions

### `commercial_map_verification_status(...)`

Maps the current `user_roles.verification_status` model to the new commercial KYC enum.

Current mapping:

- `approved` -> `approved`
- `rejected` -> `rejected`
- `pending` -> `pending_review`
- `incomplete` -> `not_submitted`

### `commercial_next_business_day(...)`

Moves a timestamp forward to the next business day, skipping Saturday and Sunday.

This is used for payout eligibility timing.

## 9. Automatic Operator Commercial Provisioning

### `provision_operator_commercial_profile(...)`

This function ensures an operator gets a commercial profile automatically.

On provision, it creates:

- a Gold tier commercial profile
- default commission rate from the Gold tier
- default membership fee from the Gold tier
- the initial billing cycle row

### Trigger: `tour_operator_profile_commercial_bootstrap`

This trigger runs after insert on `tour_operator_profiles`.

Effect:

- every new operator profile automatically gets its commercial profile provisioned
- no manual admin setup is required to start commercial tracking

## 10. KYC Sync Automation

### `sync_operator_commercial_kyc_status()`

This trigger function keeps the new commercial KYC status in sync with the existing role verification system.

It also updates operator operational status:

- approved KYC -> `active`
- pending or incomplete -> `pending`
- rejected or resubmission required -> `restricted`

### Trigger: `user_roles_sync_operator_commercial_kyc`

This trigger runs after insert or verification status update on `user_roles`.

Effect:

- the commercial system stays aligned with the already-live KYC system
- existing admin KYC tools can continue to drive commercial activation indirectly

## 11. Booking Finance Snapshot Automation

### `sync_operator_booking_finance_snapshot()`

This is the booking-commercial automation trigger.

When a booking is inserted or updated, it now:

- resolves the operator for the booked tour
- provisions the operator commercial profile if missing
- reads current operator tier, commission, membership state, and payout-hold state
- computes booking total
- computes collected amount from payment fields
- computes commission amount
- computes operator receivable estimate
- resolves settlement state from booking status and payment state
- resolves payout status
- calculates next-business-day payout availability once service is completed
- upserts a row into `operator_booking_finance_snapshots`
- upserts a matching row into `operator_commission_ledger`
- upserts a matching row into `operator_payout_items`

### Trigger: `tour_bookings_sync_operator_finance_snapshot`

This trigger runs after insert and after updates to important booking/payment fields.

Effect:

- commercial finance records stay synchronized with booking lifecycle changes
- the system now stores finance facts server-side instead of depending on later ad hoc reconstruction

## 12. Admin Commercial RPCs

### `admin_assign_operator_membership_tier(...)`

Allows an authorized admin to assign an operator membership tier.

Current access rule:

- requires authenticated admin
- only `super_admin` and `finance_admin` can assign tiers

This function:

- provisions the commercial profile if missing
- loads the target tier config
- updates the operator profile fee/rate/tier
- writes an audit row to `operator_tier_change_log`

### `admin_close_operator_billing_cycle(...)`

Allows an authorized admin to close the current cycle and open the next one.

Current access rule:

- requires authenticated admin
- only `super_admin` and `finance_admin` can close billing cycles

This function now follows the corrected business rule:

- sums commission earned in the just-finished cycle
- closes that cycle
- rolls the commission credit into the next cycle
- computes next-cycle fee adjustment
- computes next-cycle final membership charge
- creates or updates the next-cycle billing row
- creates or updates the invoice tied to that next cycle
- advances the operator’s cycle dates

### Important correction made during implementation

The first draft incorrectly applied the current cycle’s commission credit back onto the same cycle.

That was corrected before final handoff.

The live logic now applies prior-cycle commission credit to the next cycle, which matches the intended commercial model.

## 13. Reporting Views Added

### `operator_billing_report_v`

Provides billing cycle plus invoice visibility in one reporting surface.

### `operator_payout_report_v`

Provides payout item reporting joined with booking, trip, schedule, and payout batch information.

### `operator_performance_report_v`

Provides per-operator rollups for:

- published trips
- confirmed bookings
- GMV
- commission paid
- payouts received
- feature usage

### `admin_finance_summary_v`

Provides platform-level finance summary for:

- customer payments collected
- commission earned
- membership fees charged
- membership adjustments / waivers
- operator payouts
- held payouts
- refunds
- recovery pending
- chargebacks / disputes count

### `membership_tier_report_v`

Provides tier-level analytics for:

- operator count per tier
- average GMV
- average payout
- average AI usage
- average pickup usage
- average map usage

### Important correction made during implementation

The first version of the reporting layer risked inflated totals because of one-to-many joins.

That was corrected before final handoff.

The final views aggregate each source separately before combining the results, which avoids multiplication errors in finance reporting.

## 14. Backfill Behavior Added

The migration also backfills existing production data into the new commercial domain.

It provisions commercial profiles for existing operators.

It creates initial billing cycles for those operators.

It backfills booking finance snapshots, commission ledger rows, and payout item rows for existing bookings.

This means the commercial system starts with historical data rather than only tracking future events.

## 15. What Was Validated

### TypeScript validation

Executed successfully:

- `pnpm --filter @tripavail/shared typecheck`
- `pnpm --filter @tripavail/web typecheck`

### Test validation

Executed successfully:

- `pnpm --filter @tripavail/web test --run src/features/commercial/commercialEngine.test.ts`

Result:

- 1 test file passed
- 7 tests passed

### Database deployment

Executed successfully:

- `npx supabase db push`

Result:

- migration `20260315000021_operator_commercial_foundation.sql` applied to the remote Supabase database

## 16. What This Foundation Enables Next

This implementation enables the next phase of work without requiring schema redesign.

The following can now be built on top safely:

- operator commercial dashboard cards and billing views
- admin finance operations screens
- admin tier assignment UI
- operator invoice history pages
- operator payout history pages
- feature gating in actual tour creation/edit flows
- billing-cycle jobs / automation workers
- settlement and payout orchestration jobs
- dispute and recovery workflows
- commercial analytics dashboards

## 17. What Was Intentionally Not Built Yet

This pass established the commercial foundation, but did not yet complete every application surface.

Not yet implemented in this pass:

- operator-facing billing and payout UI screens
- admin-facing finance management screens
- automatic scheduled billing-cycle closures
- actual payout execution integrations
- automated hold/release/recovery operations UI
- promo funding and margin logic
- enforcement of tier gates in all live product entry points

These are next-slice application features, not missing database foundation.

## 18. Important Notes About Existing Unrelated Changes

The following unrelated local changes were left untouched:

- `packages/python-worker/railway.json`
- `supabase/.temp/cli-latest`
- `Screenshot 2026-03-14 030312.png`
- `Screenshot 2026-03-14 030428.png`

They were not part of the commercial system implementation.

## 19. Summary

The commercial system is now established at the domain and persistence layer.

TripAvail now has:

- membership tiers
- operator commercial profiles
- billing cycles
- invoices
- booking finance snapshots
- commission ledger
- payout tracking tables
- admin tier and billing RPCs
- automatic onboarding/KYC/booking sync into the commercial model
- reporting views for billing, payout, performance, finance summary, and tier analytics
- shared reusable commercial business logic with passing tests

This is the correct foundation for completing the operator commercial model without rewriting the current booking, KYC, or onboarding systems.

## 20. Critical Rule Verification

This section verifies the most important commercial rules against the implemented foundation.

### Commission snapshot rule

Required rule:

- commission must be stored at booking time
- later tier changes must not rewrite historical booking commission

Example:

- booking created while operator is Gold
- stored commission remains 20%
- operator later upgrades to Diamond
- old booking must still remain 20%

Implementation status:

- implemented correctly

Reason:

- `operator_booking_finance_snapshots` stores `commission_rate`
- `operator_commission_ledger` stores `commission_rate`
- booking-trigger upserts use the booking-time operator commercial profile values
- later tier reassignment updates the operator profile, not historical booking ledger rows directly

Conclusion:

- this rule is implemented correctly in the current foundation

### Membership adjustment rule

Required rule:

- prior-cycle commission credit reduces the next cycle membership fee

Implementation status:

- implemented correctly after correction during development

Important note:

- the first draft incorrectly applied commission credit to the same cycle
- this was corrected before handoff
- the final billing close logic now carries credit from the closed cycle into the newly opened next cycle

Conclusion:

- this rule is implemented correctly in the current foundation

### Billing formula

Required formula:

- `final_membership_charge = max(0, membership_fee - prior_cycle_commission_credit)`

Implementation status:

- implemented correctly

Reason:

- both the shared commercial engine and the billing-cycle close RPC apply this formula

Conclusion:

- this rule is implemented correctly in the current foundation

## 21. Important Improvement Still Needed

This gap was closed in a follow-up implementation after the initial foundation pass.

### Publish limit enforcement gap

Original state:

- the shared engine contains `canPublishAnotherTrip(...)`
- this gives the correct rule logic in application code
- however, the database initially did not reject a publish action when the operator had exceeded their tier limit

Risk:

- if a frontend or client-side validation path is bypassed
- and backend service enforcement is not added consistently
- an operator could publish more trips than their tier allows

What was implemented to close it:

- a database trigger now checks publish transitions on `public.tours`
- the trigger provisions the operator commercial profile if needed
- it loads the operator current-cycle tier and `monthly_publish_limit`
- it counts already-published tours in the active billing cycle
- it rejects the publish transition if the operator has already used all allowed publish slots
- it sets `approved_at` automatically on successful first publish if not already set
- a usage-sync trigger now updates:
  - `operator_feature_usage_monthly.published_tours_count`
  - `operator_commercial_profiles.monthly_published_tours_count`
- the database now returns a machine-readable publish error message:
  - `PUBLISH_LIMIT_REACHED`
- the frontend translates that into a clear operator-facing error message

Recommended enforcement locations:

- preferred: backend service validation in the publish/update workflow
- stronger: database RPC or trigger-based enforcement for publish state transitions

Implemented location:

- database trigger-based enforcement on publish state transitions
- operator UI now surfaces the publish-limit rejection message instead of only showing a generic error

Recommended rule:

- compare `operator_feature_usage_monthly.published_tours_count`
- against `commercial_membership_tiers.monthly_publish_limit`
- reject publish if usage has reached the limit

Implementation status:

- implemented

Remaining note:

- broader premium feature-gate enforcement across all operator workflows is still a separate next-step item

## 22. Financial Rule That Still Needs Explicit Enforcement

This rule was hardened in a follow-up implementation after the initial foundation pass.

### Required payout rule

Payout should only become eligible after both of the following are true:

- the tour is completed
- the booking payment is actually paid

Current state:

- payout readiness is now recalculated through a dedicated operator payout-eligibility sync function
- payout is no longer advanced only from booking completion by itself
- the hardened logic now requires all of the following before a booking can become payout-eligible:
  - `booking.status = completed`
  - `payment_status = paid`
  - Stripe payment intent evidence is present
  - if payment webhook records exist, a `payment_intent.succeeded` event must exist
  - schedule end time has passed
  - `refund_amount = 0`
  - no chargeback-open settlement state
  - operator KYC status is `approved`
  - operator payout hold is `false`

Additional protection now added:

- minimum payout threshold is enforced at `5000` for eligibility release logic
- bookings below threshold remain in `completed_pending_payout` / `not_ready` carry-forward state until the operator’s eligible balance reaches threshold

What must be confirmed or tightened next:

- scheduled payout workers should re-check these conditions before batch creation
- payout batch creation should use operator-level aggregate threshold logic when assembling batches
- chargeback ingestion should eventually write explicit commercial state changes when dispute automation is added

Implementation status:

- implemented at the commercial eligibility layer
- still requires future worker orchestration for actual payout scheduling and release

## 23. Next Implementation Order

The foundation work is complete enough that the next steps should focus on product surfaces and orchestration in this order.

### Phase 1: Operator UI

Operators need to see the commercial system.

Build:

- operator commercial dashboard
- operator billing page
- operator payout page

Operator commercial dashboard should display:

- current tier
- commission rate
- membership fee
- commission earned this cycle
- membership adjustment credit
- next billing date
- trips used this month
- feature access status

Operator billing page should display:

- billing cycles
- invoices
- adjustments
- payments
- membership history

Operator payout page should display:

- upcoming payouts
- completed payouts
- held payouts
- payout batch history

### Phase 2: Admin Finance UI

Admins need operational finance controls.

Build:

- admin operator commercial profile page
- admin billing control panel
- admin payout manager

Admin operator commercial profile page should allow:

- assign tier
- override commission
- override membership fee
- place payout hold
- release payout hold
- reset usage counters

Admin billing control panel should allow:

- close billing cycle
- regenerate invoice
- waive membership fee
- issue adjustment credit

Admin payout manager should allow:

- see eligible payouts
- see payout batches
- see holds
- see recovery balances
- release payout
- hold payout
- reverse payout
- mark recovered funds

### Phase 3: Scheduled Workers

The system now needs scheduled jobs.

Daily job:

- check bookings
- mark completed bookings payout eligible when all rules are satisfied

Next-business-day job:

- create payout batch
- attach eligible payout items

Monthly job:

- close billing cycle
- generate invoices
- apply commission credit
- open new cycle

### Phase 4: Promo System

The promo system can now be built safely on top of the finance structure.

Promo flow should store:

- `promo_owner`
- `promo_funding_source`
- `promo_discount_value`

This is needed so discount cost attribution does not corrupt operator payable and margin logic.

## 24. Scenario Test Matrix Still Needed

The unit tests validate the rules engine, but scenario-level finance tests are still required.

### Test 1: Gold booking

Input:

- booking amount = 100000
- tier = Gold
- commission = 20%

Expected result:

- commission amount = 20000
- operator receivable = 80000
- ledger row matches snapshot

### Test 2: Diamond booking

Input:

- booking amount = 100000
- tier = Diamond
- commission = 13%

Expected result:

- commission amount = 13000
- operator receivable = 87000

### Test 3: Membership adjustment

Input:

- Diamond membership fee = 30000
- prior-cycle commission credit = 22000

Expected result:

- next invoice = 8000

### Test 4: Full membership waiver

Input:

- membership fee = 30000
- prior-cycle commission credit = 35000

Expected result:

- next invoice = 0

### Test 5: Operator cancellation before payout

Expected result:

- payout amount = 0
- commission reversed or adjusted appropriately
- payout row no longer remains payable

### Test 6: Refund case

Expected result:

- finance snapshot updated correctly
- ledger adjusted correctly
- payout reduced correctly

### Test 7: Tier upgrade

Input:

- operator changes from Gold to Diamond

Expected result:

- new bookings use 13%
- old bookings remain at 20%

## 25. Overall Engineering Verdict

This foundation completed the hardest engineering layer of the commercial system.

Solved already:

- finance ledger structure
- billing cycle structure
- membership adjustment logic
- payout data structure
- booking finance snapshots
- reporting views
- automation triggers
- KYC sync

What remains is primarily:

- UI screens
- worker jobs
- enforcement checks
- payout integrations

Assessment:

- this work established the domain layer
- this work established the rules layer
- this work established the persistence layer
- this work established the automation layer
- this work established the reporting layer

This is the correct architecture for a marketplace finance system, and it gives the next implementation phase a stable base rather than forcing those later features to invent their own financial logic.