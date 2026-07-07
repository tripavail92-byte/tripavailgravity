# TripAvail Mobile App — Execution Plan
> iOS + Android via React Native / Expo, built simultaneously with the existing web app.
> All phases target traveler-facing flows first; operator screens come last.

---

## Architecture at a Glance

```
packages/
├── shared/          ← Business logic, types, Supabase client (already exists)
├── web/             ← React (Vite) web app  ← no changes, runs in parallel
└── mobile/          ← React Native (Expo)   ← this plan
```

**Same Supabase backend. Same Edge Functions. Same pnpm monorepo.**  
A bug fix in `packages/shared` propagates to both web and mobile at the same time.

### Schema gotchas to remember

| Convention | Value |
|---|---|
| `tour_bookings` traveler column | `traveler_id` (not `user_id`) |
| `tour_bookings` price column | `total_price` (currency lives on `tours`) |
| Avatar storage bucket | `user-avatars` (kebab-case) |
| Booking messages table | `booking_conversation_messages` |
| Conversations table | `booking_conversations` |
| Role switch RPC | `switch_user_role(p_user_id, p_role_type)` |
| Active role flag | `user_roles.is_active` |

---

## What Already Exists (scaffolded)

| File | Status |
|---|---|
| `packages/mobile/package.json` | ✅ Done |
| `packages/mobile/app.json` | ✅ Done — iOS bundle ID `com.tripavail.app` |
| `packages/mobile/metro.config.js` | ✅ Done — pnpm-aware |
| `packages/mobile/babel.config.js` | ✅ Done — NativeWind v4 |
| `packages/mobile/tailwind.config.js` | ✅ Done — TripAvail teal |
| `packages/mobile/lib/supabase.ts` | ✅ Done — SecureStore session |
| `packages/mobile/lib/queryClient.ts` | ✅ Done |
| `packages/mobile/hooks/useAuth.ts` | ✅ Done — Google OAuth via expo-web-browser |
| `app/_layout.tsx` | ✅ Done — auth-aware root |
| `app/(auth)/login.tsx` | ✅ Done — email + Google |
| `app/(tabs)/_layout.tsx` | ✅ Done — bottom tab bar |
| `app/(tabs)/index.tsx` | ✅ Done — Explore / home |
| `app/(tabs)/tours.tsx` | ✅ Done — tours grid |
| `app/(tabs)/trips.tsx` | ✅ Done — my bookings |
| `app/(tabs)/profile.tsx` | ✅ Done — profile + sign out |
| `app/tours/[id].tsx` | ✅ Done — tour detail |

---

## Phase 0 — Environment Setup
> **Goal:** run the app on a real device via Expo Go.  
> **Owner:** Developer  
> **Duration:** 1–2 hours

### Steps

- [ ] **0.1** Install dependencies
  ```bash
  pnpm install
  ```

- [ ] **0.2** Create mobile env file
  ```bash
  cp packages/mobile/.env.example packages/mobile/.env.local
  ```
  Fill in the same `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` values from `packages/web/.env.local` but with `EXPO_PUBLIC_` prefix:
  ```
  EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
  EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
  ```

- [ ] **0.3** Start the dev server
  ```bash
  pnpm dev:mobile
  ```

- [ ] **0.4** Install **Expo Go** on your phone (iOS App Store / Google Play), scan the QR code

- [ ] **0.5** Add `tripavail` as a custom URL scheme in Supabase Dashboard → Authentication → URL Configuration:
  ```
  tripavail://auth/callback
  ```

- [ ] **0.6** Verify Google OAuth works end-to-end on device

---

## Phase 1 — Core Search & Discovery
> **Goal:** traveler can browse and search tours natively.  
> **Duration:** 3–5 days

### Screens to build

| Screen | Route | Notes |
|---|---|---|
| Search | `app/(tabs)/search.tsx` | Full-text + filters, reuse query from web `searchService` |
| Tour category | `app/explore/categories/[category].tsx` | Adventure / Nature / Cultural |
| Tour collection | `app/explore/collections/[collection].tsx` | Northern Pakistan etc. |
| Operator profile | `app/operators/[slug].tsx` | Public storefront |

### Tasks

- [x] **1.1** Add Search tab to `app/(tabs)/_layout.tsx`
- [x] **1.2** Build `app/(tabs)/search.tsx`
  - Search input with debounce (300 ms)
  - Filter sheet: price range, tour type, duration
  - Results list using existing `supabase.from('tours')` query pattern
- [x] **1.3** Build `app/explore/categories/[category].tsx` — grid of tours filtered by `tour_type`
- [x] **1.4** Build `app/explore/collections/[collection].tsx` — filter by `location->>country`
- [x] **1.5** Build `app/operators/[slug].tsx` — operator public profile
  - Avatar, name, rating, quality score
  - List of their published tours
  - "Follow" placeholder (Phase 5)
- [x] **1.6** Add tour image carousel to `app/tours/[id].tsx` (replace single image)

### Dependencies
- No new packages needed — all queries replicate the pattern in `packages/web/src/queries/tourQueries.ts`

---

## Phase 2 — Authentication & Profile
> **Goal:** full auth flow, profile editing, KYC status.  
> **Duration:** 3–4 days

### Screens to build

| Screen | Route | Notes |
|---|---|---|
| Account settings | `app/settings/index.tsx` | Name, email, avatar |
| Verification status | `app/settings/verification.tsx` | KYC badge, re-upload prompt |
| Partner onboarding | `app/partner/onboarding.tsx` | Choose hotel_manager or tour_operator |

### Tasks

- [ ] **2.1** `app/settings/index.tsx` — edit `full_name`, avatar upload via `expo-image-picker`
  - Avatar stored in Supabase **`user-avatars`** bucket (same as web — note kebab-case)
- [ ] **2.2** `app/settings/verification.tsx`
  - Show KYC status from `user_roles.verification_status`
  - "Start Verification" → deep link to mobile KYC flow
- [ ] **2.3** `app/partner/onboarding.tsx` — role selection card, calls existing `switch_user_role` RPC
- [ ] **2.4** Handle deep-link auth callback properly
  - `app/auth/callback.tsx` — parses `access_token` and `refresh_token` from URL, calls `supabase.auth.setSession`
- [ ] **2.5** Add `expo-image-picker` to `package.json`

---

## Phase 3 — Booking & Checkout (Stripe)
> **Goal:** traveler can book and pay for a tour natively with Apple Pay / Google Pay.  
> **Duration:** 1–2 weeks

### Packages to add

```bash
# from packages/mobile/
npx expo install @stripe/stripe-react-native
```

### Screens to build

| Screen | Route | Notes |
|---|---|---|
| Tour checkout | `app/checkout/tour/[id].tsx` | Guest count, schedule picker |
| Payment | `app/checkout/payment.tsx` | Stripe sheet + Apple Pay / Google Pay |
| Booking confirmation | `app/booking/confirmation.tsx` | Success state |
| Booking detail | `app/trips/[bookingId].tsx` | Full booking detail, messaging |

### Tasks

- [ ] **3.1** Add `StripeProvider` in `app/_layout.tsx`
  ```tsx
  import { StripeProvider } from '@stripe/stripe-react-native'
  // wrap around <InitialLayout />
  ```
- [ ] **3.2** `app/checkout/tour/[id].tsx`
  - Schedule date picker (`@react-native-community/datetimepicker` or custom flatlist)
  - Guest count stepper
  - Promo code input
  - Calls existing `stripe-create-payment-intent` Edge Function
- [ ] **3.3** `app/checkout/payment.tsx`
  - Uses `usePaymentSheet()` from `@stripe/stripe-react-native`
  - Apple Pay on iOS, Google Pay on Android — automatic via Stripe
  - Calls `stripe-verify-payment-intent` Edge Function on success
- [ ] **3.4** `app/booking/confirmation.tsx` — success screen with booking reference
- [ ] **3.5** `app/trips/[bookingId].tsx`
  - Booking details (tour, date, guests, amount paid)
  - Status badge
  - Cancellation request button
  - Link to messages thread
- [ ] **3.6** Wire up the Book Now button in `app/tours/[id].tsx` to point to checkout

### Notes
- **Apple Pay requires an Apple Developer account** ($99/year). All other Stripe flows work without it.
- Physical service bookings (tours, hotels) are **exempt** from Apple's 30% in-app purchase rule.

---

## Phase 4 — KYC (Identity Verification)
> **Goal:** traveler can complete identity verification on-device.  
> **Duration:** 1 week

### Packages to add

```bash
npx expo install expo-camera expo-image-picker
```

### Screens to build

| Screen | Route | Notes |
|---|---|---|
| KYC start | `app/kyc/index.tsx` | Explain what's needed |
| Document upload | `app/kyc/document.tsx` | Front + back of CNIC/passport |
| Selfie | `app/kyc/selfie.tsx` | Live camera capture |
| Submission | `app/kyc/submitted.tsx` | Waiting-for-review state |

### Tasks

- [ ] **4.1** `app/kyc/index.tsx` — intro screen, required document list
- [ ] **4.2** `app/kyc/document.tsx`
  - `expo-image-picker` for front/back images
  - Calls existing `kyc-signed-url` Edge Function to get upload URLs
  - Uploads directly to Supabase Storage
- [ ] **4.3** `app/kyc/selfie.tsx`
  - `expo-camera` live capture (front camera)
  - Calls existing `kyc-session` and `verify-identity` Edge Functions
- [ ] **4.4** `app/kyc/submitted.tsx` — status polling (5 s interval via `useQuery` refetch)
- [ ] **4.5** Add `NSCameraUsageDescription` and `NSPhotoLibraryUsageDescription` to `app.json` (already done in scaffold)

---

## Phase 5 — Messaging
> **Goal:** traveler and operator can message about a booking in-app.  
> **Duration:** 4–5 days

### Packages to add

```bash
npx expo install @supabase/realtime-js
# already included in @supabase/supabase-js, no extra install needed
```

### Screens to build

| Screen | Route | Notes |
|---|---|---|
| Inbox | `app/messages/index.tsx` | List of booking threads |
| Thread | `app/messages/[conversationId].tsx` | Real-time chat |

### Tasks

- [ ] **5.1** `app/messages/index.tsx` — list conversations from `booking_conversations` table
- [ ] **5.2** `app/messages/[conversationId].tsx`
  - FlatList of messages from **`booking_conversation_messages`** table, inverted (latest at bottom)
  - Real-time subscription via `supabase.channel('messages:...')` — same pattern as web
  - Text input with send button
  - Typing indicator (optional)
- [ ] **5.3** Add Messages icon to bottom tab bar
- [ ] **5.4** Badge count on tab icon using unread count from `booking_conversation_messages` table

---

## Phase 6 — Push Notifications
> **Goal:** traveler receives booking and message notifications on device.  
> **Duration:** 3–4 days

### Packages to add

```bash
npx expo install expo-notifications
```

### Tasks

- [ ] **6.1** Request push notification permission on first app open (after login)
- [ ] **6.2** Register device Expo push token, store in Supabase `profiles` table
  ```sql
  -- migration: add expo_push_token column to profiles
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS expo_push_token text;
  ```
- [ ] **6.3** Create `supabase/functions/send-push-notification/` Edge Function
  - Triggered by same `notifications` table trigger that fires the email function
  - Sends via Expo Push API (`https://exp.host/--/api/v2/push/send`)
- [ ] **6.4** Handle notification tap → navigate to correct screen
  - Booking notification → `app/trips/[bookingId].tsx`
  - Message notification → `app/messages/[conversationId].tsx`
- [ ] **6.5** APNs setup (iOS only)
  - Apple Developer account → Certificates → APNs key
  - Add to Expo EAS project secrets: `APNS_KEY_ID`, `APNS_KEY`

---

## Phase 7 — Operator Mobile Screens
> **Goal:** tour operators can manage bookings and view dashboard on phone.  
> **Duration:** 2–3 weeks

### Screens to build

| Screen | Route | Notes |
|---|---|---|
| Operator dashboard | `app/(operator)/dashboard.tsx` | KPIs, upcoming bookings |
| Bookings console | `app/(operator)/bookings.tsx` | List + status actions |
| Booking detail | `app/(operator)/bookings/[id].tsx` | Confirm / cancel |
| Calendar | `app/(operator)/calendar.tsx` | Schedule overview |
| Reviews | `app/(operator)/reviews.tsx` | Read + reply |

### Tasks

- [ ] **7.1** Add `(operator)` route group with its own layout
- [ ] **7.2** Role-aware navigation — if `activeRole.role_type === 'tour_operator'` show operator bottom bar
- [ ] **7.3** Build operator dashboard with real-time booking counts
- [ ] **7.4** Build bookings list with confirm/cancel/message actions
- [ ] **7.5** Build calendar view (FlatList of dates with booking indicators)
- [ ] **7.6** Build reviews screen with reply input

---

## Phase 8 — App Store Submission
> **Goal:** published on App Store and Google Play.  
> **Duration:** 3–5 days setup + review wait

### Pre-submission checklist

- [ ] **8.1** Create production `app.json` environment (EAS build profiles)
  ```bash
  npx eas build:configure
  ```
- [ ] **8.2** Add EAS project secrets
  ```bash
  eas secret:create --name EXPO_PUBLIC_SUPABASE_URL --value "..."
  eas secret:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "..."
  eas secret:create --name STRIPE_PUBLISHABLE_KEY --value "pk_live_..."
  ```
- [ ] **8.3** Create app icons and splash screen
  - Icon: 1024×1024 PNG, no alpha, no rounded corners (Apple adds them)
  - Splash: 2048×2048 PNG, centered logo on `#0f766e` background
  - Place in `packages/mobile/assets/`
- [ ] **8.4** Build for both platforms
  ```bash
  cd packages/mobile
  eas build --platform all --profile production
  ```
- [ ] **8.5 iOS** — submit via EAS
  ```bash
  eas submit --platform ios
  ```
  - Requires Apple Developer account enrollment + App Store Connect app record
- [ ] **8.6 Android** — submit via EAS
  ```bash
  eas submit --platform android
  ```
  - Requires Google Play Console account ($25 one-time fee)
- [ ] **8.7** App Store review — provide demo credentials in the review notes
  ```
  Demo traveler: traveler@test.com / demo123
  ```
- [ ] **8.8** Set up OTA (over-the-air) updates for hotfixes post-launch
  ```bash
  eas update --branch production --message "hotfix description"
  ```

---

## Running the Project

```bash
# Web and mobile simultaneously (two terminals)
pnpm dev:web       # terminal 1 — starts Vite on localhost:5173
pnpm dev:mobile    # terminal 2 — starts Expo Metro bundler

# Or run everything at once
pnpm dev           # turbo runs all dev scripts in parallel
```

---

## Technology Stack Summary

| Concern | Technology |
|---|---|
| Framework | Expo SDK 52 + Expo Router v4 |
| Navigation | Expo Router (file-based) |
| Styling | NativeWind v4 (Tailwind for React Native) |
| State / data | TanStack Query v5 + Zustand |
| Auth | Supabase Auth + expo-web-browser (Google OAuth) |
| Secure storage | expo-secure-store (replaces localStorage) |
| Payments | @stripe/stripe-react-native (Apple Pay + Google Pay built in) |
| Camera / KYC | expo-camera + expo-image-picker |
| Push notifications | expo-notifications → Expo Push API |
| Real-time chat | Supabase Realtime channels (same as web) |
| Build & deploy | EAS Build + EAS Submit (no Mac required) |
| OTA updates | EAS Update (hotfixes without store re-review) |

---

## Phase Completion Targets

| Phase | Scope | Target |
|---|---|---|
| 0 | Environment — app runs on device | Day 1 |
| 1 | Search & discovery | Day 6 |
| 2 | Auth, profile, KYC status | Day 10 |
| 3 | Booking & Stripe checkout | Day 20 |
| 4 | KYC on-device | Day 27 |
| 5 | In-app messaging | Day 32 |
| 6 | Push notifications | Day 36 |
| 7 | Operator screens | Day 57 |
| 8 | App Store submission | Day 62 |

> Traveler-only v1 (Phases 0–6) is independently shippable and provides the highest user value. Operator screens (Phase 7) can follow in a subsequent release.
