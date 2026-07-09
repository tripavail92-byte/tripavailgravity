# Tour Operator Pages — Full Audit (July 2026)

Every operator-facing page was read end-to-end. Findings are ordered by severity within each page.
Severity: **HIGH** = broken behavior a real operator will hit · **MED** = wrong/confusing but survivable · **LOW** = polish.

> **Update (July 2026):** the items marked ✅ below are fixed and merged. A further HIGH bug was
> found while implementing: `commercial_membership_tiers` RLS granted SELECT to admins only, so
> **no operator could read their own tier row** — the entitlements card showed every feature as
> disabled and the publish limit as "Not configured yet". Fixed in
> `20260710000001_admin_tier_management.sql`. See `OPERATOR_TIER_LIMITS_AND_UPGRADES.md` §6.

Routes covered: `/operator/dashboard`, `/operator/bookings`, `/operator/calendar`, `/operator/commercial`,
`/operator/reviews`, `/operator/reputation`, `/operator/analytics`, `/operator/settings`,
`/operator-dashboard/business-profile`, `/operator-dashboard/fleet`, `/operator/setup` (wizard),
`/operator/tours/new` (wizard), plus the dashboard sub-components.

---

## 1. Dashboard — `features/tour-operator/dashboard/TourOperatorDashboard.tsx`

| Sev | Finding | Where |
|---|---|---|
| ✅ **HIGH** | **"Resume Setup" resumed at the wrong step.** `STEP_SLUGS` had 8 entries while the wizard has 10 (`fleet`, `guides` missing), so anyone saved at step ≥ 6 was deep-linked to the wrong step. *Fixed:* both sites now import `SETUP_STEP_SLUGS`, with a DEV assertion that fails loudly on future drift. | `constants/setupSteps.ts` |
| MED | **Dead "View all" button** above Active Tour Packages — rendered with hover styles but no `onClick`/`Link`. | `:651` |
| LOW | Draft-count stat uses `continuableTours.length \|\| drafts.length` — shows a different number than the DraftsAlert below it when continuable = 0. | `:184` |
| LOW | `Active Tours` shows `—` when the count is 0 (`length \|\| '—'`); 0 is a real value. | `:178` |
| LOW | Emoji in hero (`🎒`) and empty state (`🗺️`) — inconsistent with the premium-Lucide direction the team just asked for. | `:240`, `:671` |
| LOW | Data-load failure is `console.error` only — the page silently renders zeros with no error banner. | `:141` |

**Improvements:** add a tier/publish-slot usage card (see the companion doc); make each quick-stat clickable (only Avg Rating navigates today); show revenue on the dashboard (currently only bookings count).

## 2. Bookings — `pages/tour-operator/OperatorBookingsPage.tsx`

| Sev | Finding | Where |
|---|---|---|
| MED | **Revenue stat undercounts:** it sums only `confirmed` bookings, so the moment a booking is marked *completed* it drops out of Revenue. Should include completed (and arguably use paid amounts). | `:114-119` |
| MED | **"Upcoming" counts cancelled and pending bookings** — the filter is date-only, no status check. A cancelled future booking still inflates "Upcoming". | `:116-118` |
| MED | **Internal jargon in user-facing copy:** subtitle says "Booking.com-style reservation board…"; the privacy card says "…until the dedicated messenger service is shipped"; rows say "Messaging rollout required". Operators shouldn't see roadmap/competitor language. | `:240`, `:289-293`, `:434` |
| LOW | All money hardcoded `PKR` (`formatMoney(x, 'PKR')`, 6 sites with TODOs) — known deferred item (booking.currency threading). | `:268` etc. |
| LOW | `text-emerald-700` promo line is unreadable in dark mode. | `:607` |
| LOW | Raw error message string rendered directly on failure (can expose Supabase internals). | `:378` |
| LOW | No pagination — all bookings load at once; tabs have no per-status counts. | — |

**Improvements:** search (traveler / tour / ref), date-range filter, CSV export, tab counts.

## 3. Calendar — `pages/tour-operator/OperatorCalendarPage.tsx`

| Sev | Finding | Where |
|---|---|---|
| MED | **"Add Departure" is mislabeled** — it routes to the create-tour wizard (a brand-new tour), not to adding a departure/schedule to an existing tour. | `:100-105` |
| MED | Internal jargon again: "Airbnb-style departure planning", "Follow the Booking.com availability pattern", "inspired by Airbnb experience host calendars". | `:97`, `:184`, `:212` |
| LOW | "Next departures" card has **no empty state** — if everything is in the past it renders an empty box. | `:269-281` |
| LOW | Schedule cards aren't clickable — no path from a departure to its tour or its bookings. | — |

**Improvements:** link each departure to `/operator/bookings?…`, month-occupancy heat shading on the calendar, "edit schedules" shortcut to the tour's scheduling step.

## 4. Reviews — `pages/tour-operator/OperatorReviewsPage.tsx` ✅ healthiest page

| Sev | Finding | Where |
|---|---|---|
| LOW | No filter/sort (e.g. unanswered-first) and no pagination. | — |
| LOW | `(review as any).tour_title` type-cast — the service type should carry `tour_title`. | `:137` |

**Improvements:** support `?filter=unanswered` so Reputation's "Reply Now" lands pre-filtered; show the tour name as a link.

## 5. Reputation — `pages/tour-operator/OperatorReputationPage.tsx`

| Sev | Finding | Where |
|---|---|---|
| MED | **One failed fetch silently zeroes the whole page.** Five requests run in a single `Promise.all(...).catch(console.error)` — any single failure aborts all five and the page renders `—`/0 everywhere with no error state or retry. | `:122-138` |
| LOW | Stat icons use `text-yellow-400 / green-400 / blue-400 / rose-400` — weak contrast in light mode. | `:263-296` |
| LOW | "Storefront Analytics (30 Days)" grid is `lg:grid-cols-8` with 9 cells — the 9th orphan-wraps. | `:381` |

## 6. Storefront Analytics — `pages/tour-operator/OperatorStorefrontAnalyticsPage.tsx`

| Sev | Finding | Where |
|---|---|---|
| MED | **Charts silently undercount:** events are fetched with a hard cap of 250 (`listStorefrontEvents(user.id, 250)`) while the stat cards are server-computed. For a busy operator (or the 90-day window) the daily chart, event mix, and per-tour journey run on truncated data and **disagree with the cards above them**. | `:113`, `:138-183` |
| MED | Event-mix badge tones (`text-emerald-300`, `text-amber-300`, `text-rose-300`) are dark-mode-only — near-invisible on light backgrounds. | `:579-581` |
| LOW | Trend chart hardcodes `#14b8a6` + legend `bg-teal-500` — the **old teal brand** leaking into a rose-brand app. (Same legacy teal in the pickup static-map markers: `color:0x0f766e`, `TourPickupLocationsStep.tsx:100`.) | `:516`, `:562` |
| LOW | `.catch(console.error)` — silent failure, no error state. | `:128` |

**Improvements:** raise/paginate the event fetch or compute series server-side; add a date-range comparison (vs previous period).

## 7. Settings — `pages/tour-operator/TourOperatorSettingsPage.tsx`

| Sev | Finding | Where |
|---|---|---|
| ✅ MED | **Four of seven "Settings Sections" cards linked to the page itself** — *Tour Pricing*, *Cancellation*, *Notifications*, *Security* all had `href: '/operator/settings'`. *Fixed:* they now deep-link to anchors for the sections that already live on this page (`#tour-defaults`, `#cancellation`, `#notifications`, `#security`), and the page scrolls to them. | `:72-143` |
| MED | **Two-Factor Authentication toggle is cosmetic** — it persists a `two_factor_enabled` flag but no 2FA enrollment/challenge exists anywhere. Gives operators a false sense of security. | `:509-515` |
| ✅ LOW | **"Base Tour Price" rendered `undefined 0.00`** when currency was null, and "Payment & Earnings" always showed an unexplained warning triangle. *Fixed:* `formatMoney` with a PKR fallback; the unconditional `hasWarning` is gone. | `:396-408`, `:98` |
| LOW | "Base Tour Price" and "Max Group Size" are displayed but not editable anywhere on the page (the card that should edit them is one of the self-links). | `:396-408` |
| LOW | "Payment & Earnings" `hasWarning` triangle renders in `text-primary` and nothing explains what the warning is. | `:98`, `:758` |

**Improvements:** either build the four missing sub-sections or collapse the card list to the sections that exist; hide the 2FA toggle until real 2FA ships.

## 8. Commercial — `pages/tour-operator/OperatorCommercialPage.tsx` + gate + engine

Overall in good shape (tier hero, `X/Y publish slots used` caption, entitlements card, 3-tier comparison with upgrade CTA).

| Sev | Finding | Where |
|---|---|---|
| ✅ MED | **Gate hook failed open to Gold** on any fetch error — a Platinum operator on a flaky connection silently got Gold gates. *Fixed:* the hook exposes `status: 'loading' \| 'ready' \| 'error'` and the plan card shows "Couldn't load your plan" + Retry instead of applying the wrong limits. | `useOperatorCommercialGate.ts` |
| LOW | Money assumes PKR everywhere (engine values are PKR-denominated but unlabeled in places). | — |

## 9. Setup wizard — reviewed + hardened this session

Fixed this week: typed-city commit, legacy Places fallback, tappable progress bar, coverage icons, per-step validation. Remaining known friction: re-editing *Personal Info* forces phone OTP re-verification (blocks quick edits); consider only requiring OTP when the number actually changed.

## 10. Create-tour wizard — reviewed + hardened this session

Fixed this week: Lucide activity icons, mandatory activity time, submit-routes-through-Review with confirm, AI-suggest for all tiers with fallbacks, char counters, humanized error codes, pickup-array validation. Remaining nits: stray `components/TourBasicsStep.txt` (44 KB dead file in src — delete), orphaned `showTimePicker` state (harmless), publish-limit still discovered late (addressed in the companion plan).

---

## Cross-cutting themes (fix once, everywhere)

1. **Internal/competitor jargon in operator-facing copy** — "Booking.com-style", "Airbnb-style", "until the messenger service is shipped". Sweep all operator pages and rewrite in TripAvail voice.
2. **Silent failures** — the `.catch(console.error)` pattern (dashboard, reputation, analytics) renders zeros instead of an error state. Add a shared error banner + retry.
3. **Currency hardcoded to PKR** across operator money surfaces — waiting on booking.currency threading (known deferred).
4. **Legacy teal remnants** — `#14b8a6` chart lines, `0x0f766e` static-map markers.
5. **Emoji vs Lucide** — dashboard hero/empty states still use emoji; wizards were just converted.
6. **Dark-mode-only accent colors** (`*-300` text tones, `emerald-700`) that fail in the opposite theme — audit with both themes.

## Suggested fix order

1. ✅ `STEP_SLUGS` resume bug (2-line fix, real user impact)
2. ✅ Settings self-links — ⬜ cosmetic 2FA toggle still to remove/build
3. ⬜ Reputation/analytics silent-failure states
4. ⬜ Bookings revenue/upcoming stat math
5. ⬜ Copy sweep (jargon)
6. ⬜ Analytics event cap + light-mode tones + teal remnants
7. ✅ The tier-visibility work (companion doc) — Phase A + admin control shipped
