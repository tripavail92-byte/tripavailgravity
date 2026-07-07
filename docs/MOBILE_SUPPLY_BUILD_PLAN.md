# TripAvail — Mobile Supply-Side Architecture & Phased Build Plan

> Synthesized from a 9-subsystem deep read of the web app + DB. This is the plan for porting the **supply side** (partner listing/creation) into the Expo app, and how each piece links to the already-built traveller experience.

## How the system works (the loop)

Two-sided marketplace on Supabase/Postgres. **3 actors** (traveller, tour operator, hotel manager) × **2 product lines** (tours, packages) on near-identical plumbing.

**Role model:** one auth user → many `user_roles`, but **exactly one** partner role (operator XOR manager — enforced by trigger `check_partner_role_exclusivity`). `profiles.partner_type` is permanently locked on first pick. The single `user_roles.is_active=true` row drives routing. Role changes go **only** through the `switch_user_role` RPC. Admin lives in `admin_users` (out of mobile scope).

**End-to-end:** become partner (role switch) → submit KYC → **admin approves** (`admin_approve_partner` → `user_roles.verification_status='approved'`) → complete setup wizard → create supply → **publish** (flips visibility flags) → traveller discovers → books (10-min hold → Stripe → confirmed) → travels → reviews (tours only) → booking flows to partner console; tours also generate commission→payout and feed `tours.rating` ranking.

**The visibility gate (most important fact):**
- **Tours:** `is_active=true AND is_published=true AND status='live'`
- **Packages:** `is_published=true AND status='live'`
- **Hotels:** `is_published=true`
- `status` (moderation_status_enum) defaults `'live'`, admin-only writable → **publishing is self-serve** (no per-listing admin approval), bounded by membership-tier `monthly_publish_limit`.

## Data model (key tables + gates)

- **Identity/roles:** `users`, `user_roles` (master partner gate), `profiles` (locked `partner_type`), `tour_operator_profiles` (1:1, `slug`, `setup_completed`, public storefront), `hotel_manager_profiles` (1:1, `bank_info`, `setup_completed`).
- **Line A:** `tours` (3-flag gate; read **canonical** pricing cols `base_price`/`included`/`excluded`/`require_deposit`, kept in sync by trigger) → `tour_schedules` (regenerated from `tours.schedules` JSON via `sync_tour_schedules_from_json`; availability via `get_available_slots`) → `tour_bookings` (pending 10-min hold → confirmed → completed) → `tour_booking_reviews` (→ trigger → `tours.rating`) → `tour_review_replies`.
- **Line B:** `hotels` (`is_published`; photos base64 in `hotels.images`) → `rooms` → `packages` (`hotel_id` link; gate `is_published+status='live'`; use `room_configuration` not `rooms_config`) → `package_bookings`. **No reviews/commission/payout on this line.**
- **KYC:** `kyc_sessions`→`kyc_documents` (private `kyc` bucket) + `partner_verification_requests` (admin queue gating `verification_status`).
- **Finance (tours only):** `operator_commercial_profiles` (`operational_status='active'` gates publish) → on confirm, trigger writes commission/payout ledger.

## Mobile gap & buildability

Data layer is 100% Supabase JS → **every read/write ports with zero native code.** Only **two things force a dev build:** real Stripe payment + premium KYC camera. Everything else is Expo-Go-buildable with managed `expo-image-picker`.

Already built on mobile: traveller tour discovery/detail/booking (payment stubbed), operator storefront, wishlist/notifications/messaging/reviews, read-only operator+manager dashboards/consoles, status-only KYC. (Note: mobile `lib/tourDiscovery.ts` already chains the full 3-flag gate — correct.)

## Phased plan

**Sequencing: supply engine first (Expo Go), then dev-build cutover for payment + KYC.**

| Phase | Scope | Build | Effort |
|---|---|---|---|
| **0** | Become-Partner + role switch (`switch_user_role`) | Expo Go | S |
| **1** | Operator setup wizard (10 steps → single `tour_operator_profiles` upsert; hard-gate phone OTP only) | Expo Go | M |
| **2** | **Create-Tour wizard** (7 steps; draft `tours`, image upload, manual-coord pickups, schedules, publish) — **supply goes live for travellers here** | Expo Go | L ← highest value |
| **3** | Hotel listing (9) + package creation (11) wizards | Expo Go | L |
| **4** | Traveller packages browse + detail (closes line B demand) | Expo Go | M |
| **— DEV-BUILD CUTOVER —** | `expo prebuild` + EAS + Stripe RN plugin | | |
| **5** | Real payment (tours + packages) — Stripe PaymentSheet | Dev build | M-L |
| **6** | KYC capture (CNIC + selfie) + maps/places polish | Dev build | M |
| **7** | Remaining mgmt tools (calendar, reputation, analytics, commercial, settings; manager bookings/settings) | Expo Go | M |

**Order:** 0 → 1 → 2 *(supply live)* → 3 → 4 → **[dev build]** → 5 → 6 → 7.

## Recommendation

Build **Phase 2 (Create-Tour)**, preceded by minimal **0 + 1**, all in Expo Go. The instant a tour publishes, it appears in the already-built mobile discovery surfaces with zero further work — the supply engine immediately lights up the existing demand engine, with **no dev build** required. Defer the Stripe dev-build cutover until the whole supply→browse loop runs on stubbed payment.

**First commit:** `lib/tourAuthoring.ts` mirroring web `features/tour-operator/services/tourService.ts` (`saveWorkflowDraft`/`createTour`/`uploadTourMediaAtomic` + `sync_tour_schedules_from_json`) + `app/operator/tours/create/` step screens.
