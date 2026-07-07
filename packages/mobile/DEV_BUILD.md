# TripAvail Mobile — Dev Build (EAS) Guide

Everything in the app now runs in **Expo Go** except three things that need a
custom native build (a "dev build"): **remote push notifications**, the
standalone **Google Maps key**, and (later) **Stripe payment sheets**.
The code for KYC capture, map pickers, and push is already in place — the dev
build just unlocks the native bits.

## One-time setup (run these yourself — they need your Expo account)

```powershell
cd D:\Tripfinal\packages\mobile
npx eas-cli login                 # or: npm i -g eas-cli && eas login
npx eas-cli init                  # links the app to an EAS project,
                                  # writes extra.eas.projectId into app.json
```

`extra.eas.projectId` is what `lib/push.ts` reads to mint Expo push tokens —
push registration silently skips until it exists.

## Build a development client (Android)

```powershell
npx eas-cli build --profile development --platform android
```

Install the resulting APK on the emulator/device, then run `npx expo start`
and open the app — it connects to Metro like Expo Go but with all native
modules included.

A local build (no EAS queue) also works if Android Studio is set up:

```powershell
npx expo run:android
```

## Google Maps key (standalone builds only)

Maps already render in Expo Go (it bundles its own key). For dev/production
builds, create an Android Maps SDK key in Google Cloud Console and add to
`app.json`:

```json
"android": { "config": { "googleMaps": { "apiKey": "YOUR_KEY" } } }
```

## Push notifications — server side (one-time, Supabase dashboard)

The mobile app stores each user's Expo push token in auth `user_metadata`
(no schema change). The new edge function relays notifications to Expo:

1. Deploy it:
   ```powershell
   supabase functions deploy send-push --project-ref zkhppxjeaizpyinfpecj
   ```
2. Dashboard → Database → Webhooks → **Create webhook**:
   - Table: `notifications` · Events: **INSERT**
   - Type: Supabase Edge Function → `send-push`
   (this mirrors the existing `send-notification-email` webhook — both can
   run off the same event)

After that, any row inserted into `notifications` (bookings, messages,
reviews…) lands as a push notification on signed-in devices. Tapping one
deep-links via `metadata` (`conversation_id` → chat, `booking_id` → trip,
`tour_id` → tour, else the notifications screen).

## What still waits for Stripe (skipped on request)

`stripe-create-payment-intent` / `stripe-verify-payment-intent` functions
exist server-side; the mobile checkout stops at the hold step. When ready:
`npx expo install @stripe/stripe-react-native`, wire the PaymentSheet into
`app/checkout/[tourId].tsx`, and rebuild the dev client.
