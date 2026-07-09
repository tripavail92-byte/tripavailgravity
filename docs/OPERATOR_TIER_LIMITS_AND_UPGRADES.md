# Showing Tour Operators Their Package Limits & Upgrade Options

A design + implementation plan, grounded in how the tier system actually works today
(`packages/shared/src/commercial/engine.ts`, `useOperatorCommercialGate`, `operator_commercial_profiles`).

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

1. Dashboard "Your plan" card + wizard entry banner (Phase A #1–2) — biggest pain, least work
2. Publish-blocked panel with upgrade delta (A #4)
3. Pickup-step inline upsell (A #3)
4. Upgrade-request flow (Phase B)
5. Cycle-reset verification + gate error state (guardrails)
6. Self-serve billing (Phase C, when credentials exist)
