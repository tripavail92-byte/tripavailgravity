# TripAvail Web Audit — June 11, 2026

Live page-by-page audit of the web app (local build against the production
Supabase backend — same code as tripavail.com), per role, with the drawer/menu
system mapped and verified. Conducted with real QA logins:
traveller `traveler@test.com`, operator `phase6-operator-qa@tripavail.test`,
manager `coastal-retreats@tripavail.demo`.

---

## 1. The drawer system (the canonical navigation)

Two drawer components exist; **`components/navigation/RoleBasedDrawer.tsx` is
the live one** (the older `components/layout/DrawerMenu.tsx` is legacy).
It renders `config/navigation.ts → ROLE_NAVIGATION`:

| Role | Items (in order) |
|---|---|
| Traveller | Dashboard, My Profile, My Trips, Messages, Wishlist, Payment Methods, Account Settings, Help & Support |
| Hotel manager | Dashboard, List Your Hotel, List Packages, Calendar*, Bookings, Messages, Verification, Settings, Help & Support, Legal & Policies |
| Tour operator | Tour Operator Setup ("Complete your profile"), Create New Tour Packages ("Design a new tour experience"), Dashboard, Analytics, Business Profile, Public Preview, Verification, Commercial, Calendar, Bookings, Messages, Settings, Help & Support, Legal & Policies |

Plus appended actions: partner-dashboard shortcut (traveller with partnerType —
**this is the role toggle**: `switchRole()` then navigate), Become a Partner,
Switch to Traveler (partners), Sign Out.

**Design language:** trigger = hamburger+avatar pill (top-right); panel =
right-side floating rounded-32 glass card inset 12px, spring animation,
backdrop blur; header = squircle avatar in primary ring, first name, email,
role chip (MapPin + label); "NAVIGATION" section label; active-route item
highlighted; per-item icon hover animations; gating (operator create-tour
locked until setup complete, manager List Packages locked until a hotel is
published).

\* `/manager/calendar` has **no route** — dead link (see bugs).

## 2. Bugs found & FIXED this session (web)

1. **My Trips "not loading"** — all of the account's bookings were date-past;
   the page defaults to the Upcoming tab whose empty state said "you haven't
   booked any adventures yet" while the header showed "28 TOTAL BOOKINGS".
   *Fixed:* smart default tab (auto-opens Past when Upcoming is empty), tab
   counts `UPCOMING (0) / PAST (28)`, honest empty copy. `MyTripsPage.tsx`
2. **/profile infinite spinner + retry loop** — effect depended on the `user`
   object (new reference every render) → `loadProfile` looped forever (500+
   console errors with the dev-bypass session). *Fixed:* depend on `user?.id`.
   `TravellerProfilePage.tsx`
3. **Legacy drawer dead links** (`DrawerMenu.tsx`): Payment Methods → `/payments`
   (route is `/payment-methods`); operator My Tours → `/tours` (public browse!),
   Bookings → `/bookings` (no route), Settings → `/settings` (traveller);
   manager My Properties → `/properties` (no route), Settings → `/settings`.
   *Fixed:* all repointed to real routes.
4. **TourOperatorSettingsPage tsc errors** — a `{false && (...)}` dead JSX block
   (~100 lines, disabled fleet/guides/gallery editors superseded by the
   storefront editor) had 6 null-safety errors. *Fixed:* dead block removed.
   `pnpm --filter web typecheck` is now clean.

Known, not fixed (decision needed): manager drawer "Calendar" →
`/manager/calendar` has no route (no manager calendar page exists at all).

## 3. Premium patterns worth noting (and their mobile status)

| Web pattern | Where | Mobile |
|---|---|---|
| Onboarding coachmarks ("Find Your Next Trip — Step 1 of 3", per-role variants) | all pages, data-tour anchors | ❌ later |
| Floating rounded glass drawer w/ role toggle | RoleBasedDrawer | ✅ ported this session |
| Dark navy hero + rose CTAs, trust chips (Verified partners / Instant confirmation / Secure checkout / Top-rated stays) | Home | ✅ equivalent hero |
| Package rails ×7 + Northern Pakistan tours rail | Home | ✅ magazine home (fewer rails) |
| Profile completion % + bio + contact verify + change password | /profile | ⚠️ partial (mobile settings simpler) |
| Payment methods (cards + EasyPaisa/JazzCash wallets, default, delete) | /payment-methods (`user_payment_methods`) | ✅ built this session (wallets live; cards await Stripe) |
| Trips: settlement lines (Paid X now / Remaining Y / total), Manage booking, Thread | /trips | ✅ rebuilt this session (merged tours+packages, tabs, settlement) |
| Operator dashboard: continue-editing rail w/ completion % per draft, deposit/due on bookings, View Live | /operator/dashboard | ⚠️ partial (drafts open in editor; no completion % rail yet) |
| Operator storefront editor: completeness 1/7, fleet, guides, gallery, public policies, public preview | /operator-dashboard/business-profile | ❌ web-only for now |
| Reputation page (Analytics / Review Inbox split) | /operator/reputation | ✅ equivalent (Analytics + Reviews screens) |

## 4. Mobile implementations from this audit (all tsc-clean, bundle 200, drawer verified on emulator)

- **RoleDrawer rebuilt** to the web spec: right-side floating rounded-32 panel,
  role chip header, NAVIGATION section, active-route highlight, item subtexts,
  full per-role item sets (traveller 8, manager 8, operator 12 — mobile maps of
  ROLE_NAVIGATION), partner-dashboard shortcut / Become a Partner / Switch to
  Traveler / Sign Out. Verified live: traveller drawer + manager drawer +
  role-switch toggle (rose → purple).
- **My Trips rebuilt** (`lib/trips.ts` + trips tab): merges `tour_bookings`
  (with schedule departure time) + `package_bookings` (check-in/out, nights) —
  package stays were previously invisible; Upcoming/Past tabs with counts and
  smart default; settlement (Paid/Remaining/total); Tour/Stay chips.
- **Payment Methods screen** (`/payment-methods` + `lib/paymentMethods.ts`):
  list/default/delete; add EasyPaisa/JazzCash wallets natively; cards gated on
  the Stripe dev build.
- **Help & Support screen** (`/help`): email support, booking-thread shortcut,
  refunds pointer, partner pointer, legal links.
- Profile menu gained Payment Methods + working Help & Support rows.

## 5. Route map (web) for reference

Traveller: `/` `/explore` `/search` `/hotels` `/tours` `/packages/:id` `/stays/:id`
`/hotel/:id` `/tours/:id` `/operators/:slug` `/checkout/tour|package/:id`
`/booking/(package/)confirmation` `/profile` `/wishlist` `/trips(/:id)`
`/payment-methods` `/settings` `/messages(/:id)` `/help` `/legal` `/partner/onboarding`
Operator: `/operator/{dashboard,setup,calendar,bookings,commercial,analytics,reviews,reputation,settings,verification,public-profile}`
`/operator/tours/{new,edit/:id}` `/operator-dashboard/{business-profile,fleet,verification,public-preview}`
Manager: `/manager/{dashboard,setup,list-hotel,list-package,bookings,settings,verification}`
Shared: `/auth` `/kyc/mobile` `/dashboard` (role redirect hub) · Admin: `/admin` (web-only by design)
