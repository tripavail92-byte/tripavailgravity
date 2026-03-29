# TripAvail Full UI Audit Report
**Date**: 2026-01  
**Scope**: All 4 roles — Public, Traveller, Admin, Tour Operator, Hotel Manager  
**Result**: 37 PASS · 2 FIXED · 2 WARN (known stubs)

---

## Summary

| Category        | Count |
|----------------|-------|
| ✅ PASS          | 37    |
| ✅ FIXED         | 2     |
| ⚠️ WARN (stub)   | 2     |
| ❌ FAIL (open)   | 0     |

---

## Bug Fixes Applied This Session

### BUG-1 — `/trips` page — FIXED ✅
- **Symptom**: `column tours_1.pickup_locations does not exist` (HTTP 400 from Supabase)
- **Root cause**: `bookingService.ts` was selecting `pickup_locations` as a scalar column on the `tours` table. It is actually a separate `tour_pickup_locations` table joined via FK.
- **Files changed**:
  - `packages/web/src/features/booking/services/bookingService.ts` — two select queries updated: `pickup_locations` → `tour_pickup_locations(*)`
  - `packages/web/src/pages/traveller/TravelerBookingDetailPage.tsx` — reference updated: `booking.tours.pickup_locations` → `booking.tours.tour_pickup_locations`

### BUG-2 — `/payment-methods` page — FIXED ✅
- **Symptom**: `Could not find the table 'public.user_payment_methods' in the schema cache` (PGRST205)
- **Root cause**: Migration `20260211164500_create_user_payment_methods.sql` was recorded in the Supabase CLI migration history but never physically applied to the remote database (schema drift).
- **Fix applied**: Executed migration SQL directly via `npx supabase db query --linked -f <migration-file>`. Table created with correct schema, RLS enabled, and policies applied.
- **Verification**: PostgREST schema cache confirmed table access; `/payment-methods` page renders "No payment methods saved" empty state with no errors.

---

## Enhancements Shipped

### G1 — Cancellation Rate StatCard
- Added to `OperatorProfilePage.tsx` as 5th conditional metric card
- Displays when `metrics?.cancellation_rate != null`
- Grid updated to `xl:grid-cols-5`

### G2 — Review Sort Toggle
- Added below star filters on `OperatorProfilePage.tsx`
- `Newest` / `Top Rated` toggle buttons
- `filteredReviews` useMemo sorts by `created_at` (desc) or `overall_rating + created_at`
- Only appears when there are reviews (data-driven, expected)

---

## Complete Audit Results

### Public Pages

| Route | Status | Notes |
|-------|--------|-------|
| `/` | ✅ PASS | Hero, search bar, nav |
| `/explore` | ✅ PASS | "Wander often, wonder always" |
| `/tours` | ✅ PASS | Sort dropdown, tour cards |
| `/hotels` | ✅ PASS | Featured packages |
| `/search` | ✅ PASS | Filters + listing cards |
| `/auth` | ✅ PASS | Login form, Google SSO, dev bypass |

### Traveller (Authenticated)

| Route | Status | Notes |
|-------|--------|-------|
| `/dashboard/overview` | ✅ PASS | Welcome, profile 40%, quick nav |
| `/profile` | ✅ PASS | Contact info, completion 15% |
| `/trips` | ✅ FIXED | BUG-1 fixed (pickup_locations) |
| `/wishlist` | ✅ PASS | Tabs + empty state |
| `/settings` | ✅ PASS | Security / Notifications / Privacy |
| `/payment-methods` | ✅ FIXED | BUG-2 fixed (user_payment_methods table) |
| `/messages` | ✅ PASS | Inbox with search |

### Admin Role

| Route | Status | Notes |
|-------|--------|-------|
| `/admin/dashboard` | ✅ PASS | Stats, P5 reliability working |
| `/admin/users` | ✅ PASS | 8 users, status controls |
| `/admin/partners` | ✅ PASS | 13 entries, 3 approved |
| `/admin/kyc` | ✅ PASS | Queue accessible |
| `/admin/reports` | ✅ PASS | P2 pipeline live |
| `/admin/listings` | ✅ PASS | Moderation controls |
| `/admin/bookings` | ✅ PASS | 31 bookings listed |
| `/admin/commercial` | ✅ PASS | PKR 155k revenue |
| `/admin/audit-logs` | ✅ PASS | Navigated successfully |
| `/admin/settings` | ⚠️ WARN | "Coming soon." stub — G3 known gap |

### Tour Operator Role

| Route | Status | Notes |
|-------|--------|-------|
| `/operator/dashboard` | ✅ PASS | Stats: 1 active, 1 draft, 6 bookings |
| `/operator/bookings` | ✅ PASS | 2 CONFIRMED bookings |
| `/operator/calendar` | ✅ PASS | 1 upcoming departure, Add Departure CTA |
| `/operator/commercial` | ✅ PASS | Gold tier, 20% platform fee |
| `/operator/settings` | ✅ PASS | Business settings, Base Tour Price, Max Group Size |
| `/operator/reviews` | ✅ PASS | "No reviews yet" empty state |
| `/operator/reputation` | ✅ PASS | AVG RATING: —, REVIEWS: 0, quick links |
| `/operator/analytics` | ✅ PASS | Storefront analytics, 7/30/90 day filter, Export |
| `/operator/verification` | ✅ PASS | "Verified Partner ✓" green badge |
| `/operator/tours/new` | ✅ PASS | Multi-step wizard, Step 2+, auto-save |
| `/operator/public-profile` | ⚠️ WARN | Route not registered — resolves to landing page |
| `/operators/northern-summit-expeditions` | ✅ PASS | Public profile loads, Browse tours CTA |

> **Note on `/operator/public-profile`**: The operator profile is accessed via `/operators/[slug]` (e.g., `/operators/northern-summit-expeditions`). The `/operator/public-profile` route is not registered in the router. Non-critical — operators can still access their public profile. No G2 sort buttons visible (no reviews yet — expected data-driven behavior).

### Hotel Manager Role

| Route | Status | Notes |
|-------|--------|-------|
| `/manager/dashboard` | ✅ PASS | Welcome, 2 published properties |
| `/manager/bookings` | ✅ PASS | 3 CONFIRMED bookings |
| `/manager/list-hotel` | ✅ PASS | Listing wizard |
| `/manager/list-package` | ✅ PASS | 11-step package creator, auto-save |
| `/manager/settings` | ✅ PASS | Hotel settings, $0.00/night base price, 4 notifications active |
| `/manager/verification` | ✅ PASS | "Application Under Review" clock badge |
| `/manager/setup` | ✅ PASS | Hotel Setup Step 1 wizard, Save & Exit |

---

## Database Migrations Applied

During this session, the following migrations were applied to the remote Supabase project (`zkhppxjeaizpyinfpecj`):

| Migration | Status |
|-----------|--------|
| `20260211164500_create_user_payment_methods.sql` | ✅ Applied (via db query --linked) |
| `20260326000020_category_ratings.sql` | ✅ Applied (via db push) |
| `20260328000001_operator_public_profile_phase13.sql` | ✅ Applied |
| `20260328000002_operator_profile_awards_and_media.sql` | ✅ Applied |
| `20260328000003_operator_storefront_analytics.sql` | ✅ Applied (after DROP FUNCTION conflict resolved) |
| `20260328000004_operator_awards_phase2.sql` | ✅ Applied |
| `20260328000005_public_operator_storefront_rls_fix.sql` | ✅ Applied |
| `20260328000006_operator_storefront_engagement_rate.sql` | ✅ Applied |
| `20260328000007_operator_release45_trust_and_quality.sql` | ✅ Applied |
| `20260328000008_notifications_schema_compatibility.sql` | ✅ Applied |
| `20260328000008_operator_quality_score_explainability.sql` | ✅ Applied (via db query --linked) |
| `20260328000009_operator_quality_score_confidence_penalty.sql` | ✅ Applied |
| `20260328000010_operator_quality_score_partial_signal_tuning.sql` | ✅ Applied |

---

## Test Credentials Used

| Role | Email | Password |
|------|-------|----------|
| Admin | `rbac-admin@tripavail.test` | `Test-Only_RBAC_Admin_2026!ChangeMe` |
| Tour Operator | `phase6-operator-qa@tripavail.test` | `Phase6-Operator-QA_2026!` |
| Hotel Manager | `coastal-retreats@tripavail.demo` | `demo123` |
| Traveller | Dev bypass button | N/A |
