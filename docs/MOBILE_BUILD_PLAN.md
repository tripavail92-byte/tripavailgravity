# TripAvail Mobile — Build Plan (from web-architecture research)

> Goal: premium, Airbnb-grade native app. Build against the **real** Supabase schema + RPCs the web app uses.
> Stack locked: Expo + RN + TS, NativeWind, TanStack Query, Zustand, Lucide icons. (See `packages/mobile/README.md`.)

## Buildability key
- **🟢 NOW** = works in Expo Go (all Supabase reads/writes/RPCs, realtime, forms, pickers).
- **🔵 DEV BUILD** = needs a development build (native module): Stripe payment sheet, image upload (`expo-image-picker`), maps (`react-native-maps`), camera (KYC). We make the dev build once at the Stripe stage; image upload + maps come with it.

---

## MODULE A — Traveller (priority 1, closest to shippable)

| Feature | Status | Backend (tables / RPCs / functions) | Web ref |
|---|---|---|---|
| Discovery (home, search, tours, categories, operator) | ✅ done | `tours` reads | — |
| **Tour detail enrichment** | 🟢 build | `tours.included_features`/`excluded_features` (JSONB `{label, icon_key}`), `itinerary` (JSONB), `highlights`, `requirements` → render with `tourFeatureIcon` | `tours/create/components/TourPricingStep`, `TourIconRegistry` |
| **Reviews on tour detail + leave review** | 🟢 build | `tour_booking_reviews` (rating 1-5 + category ratings, title, body), `tour_review_replies`; `submitTourReview`, `getTourReviewsWithReplies`, `getTravelerReviewForBooking` | `features/booking/services/reviewService.ts` |
| **Wishlist** (heart on cards + screen) | 🟢 build | `wishlist` (user_id, item_id, item_type); toggle/get/isWishlisted/sync | `lib/wishlistService.ts` |
| **Messaging** (inbox + thread, realtime) | 🟢 build | `booking_conversations`, `booking_conversation_messages`, `_participants`; RPCs: `messaging_list_conversations`, `messaging_get_conversation_messages` (cursor `p_before`), `messaging_send_message`, `messaging_mark_conversation_read`, `messaging_get_or_create_booking_conversation`; realtime on `booking_conversation_messages` filter `conversation_id=eq.X` + `_participants` filter `user_id=eq.X` | `queries/messagingQueries.ts`, `components/messaging/BookingConversationPanel.tsx` |
| **Notifications** (bell + realtime) | 🟢 build | `notifications` (type, title, body, metadata, read); realtime filter `user_id=eq.X`; `mark_notifications_read` | `queries/adminQueries.ts`, `components/notifications/NotificationBell.tsx` |
| **Booking flow** (schedule → guests → promo → pricing → hold) | 🟢 build (UI + hold) | `tour_schedules` (capacity, booked_count); RPC `get_available_slots(schedule_id)`, `inspect_tour_promotion(tour_id, code, total)`; create pending booking (`tour_bookings`, `expires_at`=now+10min, `status='pending'`); pricing via deposit %/tiers | `pages/checkout/TourCheckoutPage.tsx`, `features/booking/utils/tourPaymentTerms.ts` |
| **Stripe payment** | 🔵 dev build | edge fns `stripe-create-payment-intent` (in: booking_id, type), `stripe-verify-payment-intent`; then `pending→confirmed` | `stripe-*` functions |
| Booking detail / confirmation | 🟢 build | `tour_bookings` read; cancel/complete RPCs `traveler_request_tour_booking_cancellation`, `traveler_confirm_tour_booking_completion` | `BookingConfirmationPage.tsx` |
| KYC capture | 🔵 dev build | `kyc-session`, `kyc-mobile-upload`, `verify-identity` | — |

## MODULE B — Tour Operator (priority 2)

| Feature | Status | Backend | Web ref |
|---|---|---|---|
| **Operator dashboard** (stats, tours, bookings, alerts) | 🟢 build | `tours` (own), `tour_bookings`, `operator_commercial_profiles` (kyc_status, payout_hold), avg rating | `features/tour-operator/dashboard/TourOperatorDashboard.tsx` |
| **Bookings console** (filter, detail, actions) | 🟢 build | `tour_bookings`; actions cancel/complete/message | `pages/tour-operator/OperatorBookingsPage.tsx` |
| Calendar | 🟢 build | `tour_schedules` + bookings | `OperatorCalendarPage.tsx` |
| Reviews (read + reply) | 🟢 build | `operatorReviewService.listMyReviews/submitReply` | `OperatorReviewsPage.tsx` |
| Commercial / payouts | 🟢 build (read) | `operator_payout_report_v`, `operator_billing_report_v`, ledger | `OperatorCommercialPage.tsx` |
| **Setup wizard** (10 steps) | 🟢 build (no image) | `tour_operator_profiles` (+ `draft_data`); `saveOnboardingData` | `pages/tour-operator/setup/*` |
| **Create tour** (7 steps) | 🟢 build (no image/maps) | `tours` (+ `draft_data`); `sync_tour_schedules_from_json` | `pages/tour-operator/tours/create/*` |
| Settings | 🟢 build | `tour_operator_settings` | `TourOperatorSettingsPage.tsx` |

## MODULE C — Hotel Manager (priority 3)

| Feature | Status | Backend | Web ref |
|---|---|---|---|
| **Manager dashboard** (stats, listings, drafts, bookings) | 🟢 build | `hotels` (own), `draft_data`; `fetchPublishedListings`, `fetchDrafts` | `features/hotel-manager/dashboard/*` |
| **Listing wizard** (9 steps) | 🟢 build (no photos/maps) | `hotels` + `rooms`; `saveDraft`/`publishListing` | `features/hotel-listing/components/steps/*` |
| Bookings / Settings | 🟢 build | `hotels`, `hotel_manager_profiles`, `hotelManagerSettingsService` | `pages/hotel-manager/*` |

---

## Build order (value × buildability)

**Phase 1 — Traveller depth (all 🟢):**
1. Tour detail enrichment (included/excluded + itinerary + reviews) ← start here, uses data already fetched
2. Wishlist (heart on cards + screen)
3. Notifications (bell + realtime)
4. Messaging (inbox + thread + realtime)
5. Booking flow UI + hold (payment = "coming soon" until dev build)

**Phase 2 — Operator (read-first, all 🟢):**
6. Operator dashboard + bookings console + reviews-reply + calendar
7. Operator setup wizard + create-tour (text/picker steps; image steps stubbed)

**Phase 3 — Manager (all 🟢 except photos/maps):**
8. Manager dashboard + listing wizard (text steps)

**Phase 4 — Dev build (one-time): Stripe payment, image upload across wizards, maps, KYC camera.**

## Role-aware navigation
Mobile is traveller-first. Operator/manager screens live behind a role check (`useAuth().activeRole.role_type`) + `switch_user_role` RPC. Add an `(operator)` / `(manager)` route group with its own tab bar, shown when the active role matches (mirrors web `RoleBasedDrawer`).

## Schema gotchas (confirmed)
- `tour_bookings.traveler_id` (not user_id), `total_price`, `pax_count`, `expires_at`, deposit fields (`upfront_amount`, `remaining_amount`, `payment_collection_mode`).
- Messaging is RPC-driven (don't hit tables directly — use `messaging_*` RPCs; they handle RLS, unread, notifications).
- Drafts live in `*.draft_data` JSONB for hotels and tours.
