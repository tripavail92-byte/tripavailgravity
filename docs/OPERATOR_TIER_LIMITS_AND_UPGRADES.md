# Showing Tour Operators Their Package Limits & Upgrade Options

A design + implementation plan, grounded in how the tier system actually works today
(`packages/shared/src/commercial/engine.ts`, `useOperatorCommercialGate`, `operator_commercial_profiles`).

> **Status: Phase A is built, plus full admin control of every tier variable.**
> See §6 "What shipped" at the bottom. Phase B (upgrade-request flow) and Phase C
> (self-serve billing) remain as designed below.

---

## 1. What the system enforces today

Three tiers, defined in `DEFAULT_MEMBERSHIP_TIER_CONFIGS` (client) mirrored by `commercial_membership_tiers` (DB),
with per-operator `feature_overrides` on `operator_commercial_profiles`:

| Capability | Gold | Diamond | Platinum | Where enforced |
|---|---|---|---|---|
| Monthly fee | PKR 15,000 | PKR 30,000 | PKR 50,000 | billing rows |
| Platform commission | 20% | 13% | 10% | booking finance snapshot |
| Minimum deposit | 20% | 15% | 10% | pricing step + publish + submit (client), service |
| **Monthly publish limit** | **5 tours** | **25 tours** | **100 tours** | `canPublishAnotherTrip()` at publish + DB error `PUBLISH_LIMIT_REACHED` |
| Multi-city pickups | ✗ (1 pickup) | ✓ | ✓ | pickup step (client) |
| Google Maps tools | ✓ | ✓ | ✓ | all tiers (client + DB flag) |
| AI itinerary/templates | ✗ | ✓ (100 credits/mo) | ✓ (300/mo) | basics step (client); AI-suggest fallback now works on all tiers |
| Search ranking weight | 1.0 | 1.25 | 1.5 | discovery ranking |
| Support priority | standard | priority | dedicated | soft |

**Usage counters that exist today** (on `operator_commercial_profiles`, read by `useOperatorCommercialGate`):
- `monthly_published_tours_count` → publish slots used this cycle
- `ai_credits_used_current_cycle` → AI credits used
Both are cycle-scoped and available in real time — the data for a usage UI already exists; it just isn't shown outside one page.

## 2. Where the operator SEES limits today vs. where they only DISCOVER them by failing

| Limit | Visible in advance? | Discovered by hitting it |
|---|---|---|
| Publish limit | Only on `/operator/commercial` ("X/Y publish slots used") and on the wizard's final Review step | **Worst case:** operator builds all 7 steps, uploads photos, clicks Publish → "publish limit reached" toast. Effort wasted. |
| Min deposit | Pricing step shows the floor | Publish/submit bounces back to the Pricing step with a toast |
| Multi-city pickup | Small note on the pickup step | Toast "your membership allows one pickup" when saving a 2nd |
| AI credits | Only on `/operator/commercial` | AI features silently limited |
| Commission/fee | Only on `/operator/commercial` | Discovered on payout math |

**The core problem: the dashboard — the page every operator sees daily — shows nothing about their plan.**
And the create-tour wizard lets you invest 20 minutes of work before telling you there's no slot left.

## 3. Upgrade path today

- The commercial page has a 3-tier comparison ("Membership & upgrades") with an "Upgrade to X" CTA per tier.
- The CTA links to `/help` — **there is no upgrade flow**. The TripAvail team flips
  `membership_tier_code` manually after a support conversation.
- No Stripe/payment credentials exist yet (self-serve billing is deferred).

## 4. The plan

### Phase A — Make limits visible everywhere they matter (small, ship now)

Two shared components, used in four places:

- **`<TierBadge />`** — pill with tier name + gem icon, links to `/operator/commercial`.
- **`<UsageMeter />`** — "Publish slots · 4/5 used" progress bar (rose→amber→red as it fills) + "resets in N days".

Placements:
1. **Dashboard "Your plan" card** (top-right column, above Recent Bookings): tier badge, publish-slot
   meter, AI-credit meter (Diamond+), commission %, and an **Upgrade** button. This alone fixes
   "operators don't know their limits."
2. **Create-tour wizard entry banner**:
   - slots ≥ 80% used → amber banner "4/5 publish slots used this cycle";
   - slots exhausted → red banner "Publish limit reached — you can keep drafting; publishing
     unlocks on <cycle reset date> or with an upgrade" + Upgrade CTA.
   Drafting stays allowed (never block work, only publishing), but the operator knows **before**
   investing effort, not after step 7.
3. **Pickup step (Gold)**: replace the error-on-second-pickup with an upfront inline card:
   "Gold includes 1 pickup point — Diamond unlocks multi-city pickups →".
4. **Publish-blocked toast → panel**: when `canPublishAnotherTrip` fails, show a panel with the
   exact delta ("Diamond gives you 25 slots/mo + 13% commission") and two actions:
   *Request upgrade* / *Save as draft*.

Effort: ~1 day. All data already flows through `useOperatorCommercialGate` — add `aiMonthlyCredits`,
`aiCreditsUsed`, and `cycleResetDate` to the hook's return.

### Phase B — Upgrade *request* flow (no payments needed, ship next)

Since billing is manual today, formalize it instead of pointing at `/help`:

1. New table `tier_change_requests` (`operator_user_id`, `current_tier`, `requested_tier`,
   `status: pending|approved|rejected`, `note`, timestamps) + RLS (operator inserts/reads own).
2. "Upgrade to X" opens a confirm modal (shows fee delta, what unlocks) → inserts the request →
   notifies admins (existing notifications table + `send-notification-email` edge fn).
3. Commercial page shows a status chip: "Upgrade to Diamond requested · pending review".
4. Admin panel (`AdminCommercialPage`) gets an approve/reject queue; approval flips
   `membership_tier_code` and notifies the operator.

Effort: ~2-3 days. Turns "contact support" into a trackable funnel and gives the team an
upgrade-demand metric.

### Phase C — Self-serve billing (blocked on payment credentials)

When Stripe (or JazzCash/EasyPaisa for PKR) is ready:
- Checkout for the monthly fee → webhook flips the tier instantly and stamps the billing row.
- Proration: upgrades apply immediately, charge the difference; downgrades apply at next cycle.
- Failed renewal → grace period (7 days) → auto-downgrade to Gold with notification, never
  unpublish existing tours (they stay live; only *new* publishes use the lower limit).

### Guardrails / infra notes

- **Server-side enforcement**: keep the DB `PUBLISH_LIMIT_REACHED` check authoritative (client
  gates are UX, not security). Verify the monthly counter has a cycle-reset job — if reset is
  currently manual, add a scheduled function.
- **Fail closed on display, fail open on work**: `useOperatorCommercialGate` currently silently
  defaults to Gold on fetch errors — show "couldn't load your plan" + retry rather than quietly
  applying the wrong limits.
- **Copy principle**: a limit shown early is a *feature of the plan*; a limit hit late is a
  *punishment*. Always pair "you've used X of Y" with when it resets and what the next tier gives.

## 5. Priority order

1. ✅ Dashboard "Your plan" card + wizard entry banner (Phase A #1–2) — biggest pain, least work
2. ✅ Publish-blocked messaging with reset date + upgrade delta (A #4)
3. ✅ Pickup-step inline upsell (A #3)
4. ⬜ Upgrade-request flow (Phase B)
5. ✅ Gate error state (no more silent Gold downgrade) · ⬜ cycle-reset job verification
6. ⬜ Self-serve billing (Phase C, when credentials exist)

---

## 6. What shipped — admin-controlled tiers

**The core architectural change: `commercial_membership_tiers` is now the single source of truth.**
Previously the table was unreachable from the app — only `service_role` could write it and only
admins could *read* it, so tier values were effectively frozen in code
(`DEFAULT_MEMBERSHIP_TIER_CONFIGS`), and **operators could not read their own tier row at all**
(their entitlements card rendered every feature as disabled and the publish limit as
"Not configured yet"). That is fixed.

### Migration — `supabase/migrations/20260710000001_admin_tier_management.sql`
- **Adds admin-editable presentation columns**: `tagline`, `badge_hex`, `perks` (jsonb array),
  `currency`, `sort_order`, `is_active`, `is_publicly_listed`, `updated_by`.
- **Fixes RLS**: authenticated users can now *read* the catalogue (pricing isn't secret — an
  operator must see the plan they pay for); **admins can now UPDATE and INSERT**. No DELETE
  policy: tiers are referenced by operator profiles, so deactivate rather than delete.
- **Audit trail**: `commercial_tier_config_log` + a trigger that records only the columns that
  actually changed, with `auth.uid()` as `changed_by`.
- **Safety trigger**: deactivating a tier that still has operators assigned raises an exception
  instead of stranding them.
- Guard constraints: commission ≤ 100%, `perks` must be a JSON array.

### Admin UI — "Tiers" tab on `/admin/commercial`
`pages/admin/components/AdminTierEditor.tsx`. Every variable is editable per tier: name, tagline,
badge colour, monthly fee, commission %, minimum deposit %, publish limit, AI credits, ranking
weight, support priority, the three feature toggles (multi-city pickup / Google Maps / AI
itinerary), a free-form perks list, public listing, and active state. Saving validates before
write (e.g. it refuses "AI enabled with 0 credits", which would show operators a tool they can't
use) and reports what the database actually accepted.

### How a change propagates
`commercial_membership_tiers` → `mapTierRowToConfig()` → `useOperatorCommercialGate` → every
wizard gate, the dashboard plan card, and the upgrade comparison. **Every gate function now takes
a resolved tier config, not just a tier code** (`TierLike = MembershipTierCode |
MembershipTierConfig`), so raising a publish limit in the admin dashboard takes effect on the
operator's next page load — no deploy. Publish limits remain enforced in the database
(`PUBLISH_LIMIT_REACHED`), so the client gate is UX, never the security boundary.

### Operator-facing surfaces added
- `OperatorPlanCard` — dashboard card: tier badge, publish-slot meter, AI-credit meter,
  commission, monthly fee, upgrade CTA, and an explicit error state with Retry.
- `PublishLimitBanner` — top of the create-tour wizard: silent under 80% usage, amber warning
  near the limit, red explainer once exhausted ("you can keep drafting; publishing unlocks
  <reset date> or with an upgrade").
- `TierLockedFeature` — inline, *before* the operator acts (used on the pickup step), replacing
  the old error-toast-after-the-fact.
- `UsageMeter` / `TierBadge` / `formatCycleReset` — shared primitives; a limit is always paired
  with when it resets.
- Upgrade comparison on `/operator/commercial` now renders from the live catalogue (taglines,
  perks, colours) and shows a computed **"You would gain"** list via `describeTierUpgrade()`,
  so the sales copy can never contradict the configured values.

### Adding a fourth tier
Tier *values* are fully admin-controlled; tier *codes* are still enum-bound. A new code needs a
one-line migration (`ALTER TYPE membership_tier_code_enum ADD VALUE 'silver'`) plus an INSERT —
after that it is editable from the dashboard like the rest.

### Pre-migration safety
The client reads the tier row defensively (`select *`, optional columns) and falls back to the
built-in configs when the row is unreadable. So the code above is safe to deploy *before* the
migration is applied: operators keep today's behavior, and the admin Tiers tab loads read-only
and reports a clear permission error on save until the RLS policies land.
