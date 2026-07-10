# Operator Wizards → Micro-Steps

A plan to turn the two long, scroll-heavy operator wizards into short, one-question-at-a-time
screens with a visible sense of progress ("Personal Information · 2 of 4").

> **Status: Phases 0–3 are shipped.** Decisions taken: Profile Picture stays its own
> stage; Launch Promo removed from the wizard; Primary Contact Person removed; Continue is never
> blocked — missing fields go red, the sub-step dot goes red, and focus jumps to the first one.

---

## 1. What exists today (measured, not guessed)

### Setup wizard — `/operator/setup` — 10 top-level steps

| # | Step | File | Lines | Form controls | Splittable? |
|---|---|---|---|---|---|
| 1 | Welcome | `WelcomeStep` | 97 | 0 | no — intro screen |
| 2 | Personal Info | `PersonalInfoStep` | 437 | 5 + OTP | **yes → 4** |
| 3 | Profile Picture | `ProfilePictureStep` | 150 | 1 | no — already one action |
| 4 | Business Info | `BusinessInfoStep` | 337 | 6 | **yes → 3** |
| 5 | Tour Services | `ServicesStep` | 175 | 1 + chips | no — one grid |
| 6 | Coverage Area | `CoverageAreaStep` | 181 | 1 + 4 tiles | no — one grid |
| 7 | Fleet & Vehicles | `FleetStep` | 326 | 5 per vehicle | **repeater** (see §3) |
| 8 | Meet Your Guides | `GuidesStep` | 334 | 6 per guide | **repeater** (see §3) |
| 9 | Policies | `PoliciesStep` | 549 | 3 + 4 templates | **yes → 3** |
| 10 | Complete | `CompletionStep` | 125 | 0 | no |

**Personal Info** today asks, on one screen: full name\*, account email (read-only), phone\* **with a
6-box WhatsApp OTP flow**, and primary contact person. Profile photo is a *separate* step already.

**Business Info** today asks: company logo (upload), registered business name\*, registration number,
years of experience (select), team size (select), business description (textarea).

**Policies** today has a mode toggle (templates | upload), four editable policy templates
(cancellation, liability, safety, booking), a platform-agreement accordion with an accept checkbox,
and two required document uploads.

### Create-tour wizard — `/operator/tours/new` — 7 top-level steps

| # | Step | File | Lines | Form controls | Splittable? |
|---|---|---|---|---|---|
| 1 | Basics | `TourBasicsStep` | 767 | 6 + pickers | **yes → 5** |
| 2 | Pickup Locations | `TourPickupLocationsStep` | 1581 | 6 | already progressive (shipped) |
| 3 | Itinerary | `TourItineraryStep` | 563 | 4 per activity | **repeater** |
| 4 | Pricing & Policies | `TourPricingStep` | 1056 | **16** | **yes → 6** ← worst offender |
| 5 | Requirements | `TourDetailsStep` | 364 | 1 + 3 grids | **yes → 3** |
| 6 | Media | `TourMediaStep` | 390 | dropzone | no — one action |
| 7 | Review | `TourReviewStep` | 311 | 0 | no — summary |

**Basics** asks: tour title\*, tour category\* (grid + custom), duration\* (scroller), destination\*
(primary city + additional cities), capacity/seats\*, departure date\* + start time\* (wheel pickers),
short description + AI Suggest panel.

**Pricing & Policies** is the heaviest screen in the product. In one scroll it asks for: base price\*,
currency, deposit collection (+ a confirm dialog), launch promo (title, code, discount type, value,
max discount, description), cancellation policy, group-discount pricing tiers (repeater: name, group
size, discount %), seasonal pricing multipliers, what's included, what's excluded.

---

## 2. The core architectural decision: **nest, don't renumber**

This is the constraint that shapes everything, and getting it wrong would corrupt live data.

Both wizards persist their position **as an integer index**:

- Setup writes `tour_operator_profiles.setup_current_step` (see `tourOperatorService.saveOnboardingData`),
  and the dashboard turns that integer into a deep-link slug via `setupStepSlugForIndex()`.
- Create-tour writes `tours.draft_data._workflow = { version: 1, currentStep, currentStepId,
  visitedSteps: number[], stepStatuses }`.

If we flatten Personal Info into four top-level steps, every index after it shifts. Every operator
mid-setup resumes on the wrong screen, and every saved tour draft's `visitedSteps` points at the
wrong steps. That is exactly the class of bug that already bit us once (the `STEP_SLUGS` drift).

**Therefore: the 10 setup steps and 7 tour steps stay as the persisted "stages". Sub-steps are a
second, nested index.** The progress bar still shows 10 (or 7) segments; the header gains a
sub-counter.

```
stage  = persisted, stable, what the DB and deep links already know   (e.g. "personal")
substep = ephemeral screen within a stage, 0-based                    (e.g. 1 of 4)
```

Persistence changes, both backward-compatible:
- `setup_current_step` keeps meaning **stage index**. The sub-step rides in the URL query
  (`?step=business&sub=1`) instead of a new column — it survives reload and the back button, and
  needs no migration. *(Shipped this way; the column below was the original proposal.)*
- `_workflow.version` → `2`, adding `subStep: number`. A v1 snapshot loads with `subStep = 0`,
  which lands the operator at the top of the right stage — a correct, safe fallback.

Deep links extend from `?step=fleet` to `?step=fleet&sub=2`, with `sub` optional and clamped.

---

## 3. What must NOT be split

Three patterns look splittable and aren't:

1. **Repeaters** — Fleet (N vehicles), Guides (N guides), Itinerary (N activities), Pricing tiers
   (N tiers). Splitting "add a vehicle" into four screens per vehicle would be torture on the third
   vehicle. Instead these adopt the **progressive-disclosure pattern already shipped on the pickup
   step**: ask for one, reveal fields as answers arrive, save it, collapse to a summary card, then
   offer "Add another". Same feeling of achievement, no index explosion.

2. **Choice grids** — Services, Coverage, Tour Category, Difficulty. These are a single decision
   rendered as tiles. They are already one question per screen.

3. **Review** — the whole point is seeing everything at once.

---

## 4. Proposed sub-step maps

### Setup wizard: 10 stages → 21 screens

| Stage | Sub-steps | Required to advance |
|---|---|---|
| Welcome | 1 | — |
| **Personal Information** | **4** — ① Your name ② Phone + OTP verify ③ Primary contact person (skippable) ④ Profile photo | ①name ②phone (OTP if changed) |
| Business Details | **3** — ① Business name + registration number ② Years of experience + team size ③ Description + logo | ①name, reg-number format |
| Tour Services | 1 | ≥1 category |
| Coverage Area | 1 | primary city |
| Fleet | 1 (progressive repeater) | — |
| Guides | 1 (progressive repeater) | — |
| **Policies** | **3** — ① Platform agreement (accept) ② Your policies (templates *or* upload) ③ Required documents | ①accepted ③both docs |
| Complete | 1 | — |

Profile Picture folds into Personal Information as sub-step ④, removing a whole top-level stage from
the bar — but see §6, this changes indices, so it happens **only** with the mapping table below.

### Create-tour wizard: 7 stages → 23 screens

| Stage | Sub-steps | Required to advance |
|---|---|---|
| **Basics** | **5** — ① Title ② Category ③ Destination + duration ④ Capacity + departure date/time ⑤ Short description (+ AI Suggest) | ①title ②category ③city+duration ④capacity+schedule |
| Pickup | 1 (progressive, shipped) | ≥1 pickup |
| Itinerary | 1 (progressive repeater) | ≥1 activity |
| **Pricing & Policies** | **6** — ① Base price + currency ② Deposit ③ Cancellation policy ④ Group discounts (repeater) ⑤ Seasonal pricing ⑥ Included / excluded | ①price>0 ②deposit ≥ tier minimum |
| **Requirements** | **3** — ① Difficulty ② Age range + languages ③ Requirements text | — |
| Media | 1 | ≥1 image + cover |
| Review | 1 | — |

**Launch Promo** moves out of Pricing entirely — it is a marketing action, not part of publishing a
tour, and it already has its own home on `/operator/commercial` (promotions). Recommend removing it
from the wizard rather than giving it a sub-step. *(Open question — see §8.)*

---

## 5. Shared machinery to build once

A single reusable layer, used by both wizards, so we never hand-maintain two step lists again
(the `STEP_SLUGS` drift bug is the cautionary tale):

- **`wizardFlow.ts`** — declarative definition: `Stage[] = { id, title, subSteps: SubStep[] }`,
  where `SubStep = { id, title, component, validate?(data): string | null, isOptional?: boolean }`.
  The existing `SETUP_STEP_SLUGS` becomes derived from this, not parallel to it.
- **`useWizardFlow(flow, persisted)`** — owns `stage`, `subStep`, `maxReached`, `goNext`, `goBack`,
  `goToStage`, `goToSubStep`; validates on `goNext`; emits the persistence snapshot.
- **`<WizardHeader>`** — brand, stage name, **"Personal Information · 2 of 4"**, tappable stage bar
  (already built), and a thin sub-step dot row.
- **`<WizardScreen>`** — the one-question shell: heading, helper text, the field(s), Back / Continue.
  Fixed footer so Continue is always reachable without scrolling — the actual complaint.
- **`<StageCompleteToast>`** — the "sense of achievement" beat when a stage's last sub-step is
  answered ("Personal info done — 2 of 10").

`deriveStepWorkflow` keeps evaluating **by stage id** (it drives the top progress bar and the
"needs attention" state). Sub-step validation is additive and lives in the flow definition.

---

## 6. Migration & compatibility (the risky part)

| Risk | Mitigation |
|---|---|
| `setup_current_step` indices shift if Profile Picture folds into Personal Info | Ship a `stageIndexV1toV2` mapping table applied on load; write only v2 indices thereafter. Or: **keep Profile Picture as its own stage** and accept 10 stages. *Recommend the latter — zero migration.* |
| `_workflow.version = 1` drafts | Read v1, default `subStep = 0`, write v2. No data loss. |
| Dashboard "Resume Setup" deep link | Already routes through `setupStepSlugForIndex`; extend with `&sub=`. The DEV drift assertion stays. |
| `visitedSteps: number[]` are stage indices | Unchanged — stages don't move (given the recommendation above). |
| Mobile app has its own operator wizard | Out of scope. Web-only for now; note parity debt. |
| Phone OTP re-verification | Sub-step ② must only demand OTP when the number **changed** (known friction from the earlier audit). |

---

## 7. Dead code found during this study (fix while we're in here)

- **`TourSchedulingStep.tsx` (167 lines) is never imported.** Departure date/time live in Basics.
- **`stepWorkflow.ts` declares `StepId = … | 'scheduling' | 'media'`** but the wizard renders 7 steps
  with no `scheduling`. The union is stale.
- **`TourBasicsStep.txt`** — a 44 KB dead copy sitting in `src/`.

---

## 8. Open questions (need your call before I build)

1. **Profile Picture**: keep as its own stage (zero migration, 10 stages), or fold into Personal
   Information as sub-step ④ (nicer flow, needs an index mapping)? *I recommend keeping it separate.*
2. **Launch Promo**: remove from the create-tour wizard (it duplicates `/operator/commercial`
   promotions), or keep it as Pricing sub-step? *I recommend removing.*
3. **Primary contact person**: you wrote "remove POC". Confirm — delete the field entirely, or keep
   it as an optional, skippable sub-step?
4. **Sub-step skipping**: should Continue be blocked until a required field is filled (current
   behaviour, per stage), or allowed with a "needs attention" mark so operators can move fast?

---

## 9. Phasing

- ✅ **Phase 0 — machinery.** `features/wizard/{types,useSubStepFlow,WizardScreen,SubStepProgress}`,
  workflow snapshot v2 (`subSteps` keyed by stage id, v1 degrades to sub-step 0).
- ✅ **Phase 1 — Pricing & Policies** split into 6 screens; Launch Promo deleted.
- ✅ **Phase 2 — Basics** (5 screens) and **Requirements** (3 screens).
- ✅ **Phase 3 — Setup wizard**: Personal Information (2), Business Details (3), Policies (2).
  Sub-step lives in the **URL** (`?step=business&sub=1`), not a new DB column — `setup_current_step`
  still stores the stage, so no migration was needed and deep links/reload/back all survive.
- ⬜ Phase 4 — Repeaters adopt the progressive pattern.
- ⬜ Phase 5 — Polish.

<details><summary>Original phase notes</summary>

- **Phase 0 — machinery.** `wizardFlow.ts`, `useWizardFlow`, `<WizardScreen>`, header sub-counter,
  persistence v2. No visible split yet; both wizards run with 1 sub-step per stage. Ship + verify
  that resume, deep links and autosave are untouched.
- **Phase 1 — Pricing & Policies** (6 screens). The single worst screen; biggest payoff, and it
  proves the model on the hardest case.
- **Phase 2 — Basics** (5 screens) and **Requirements** (3 screens).
- **Phase 3 — Setup wizard**: Personal Information (4), Business Details (3), Policies (3).
- **Phase 4 — Repeaters**: Fleet, Guides, Itinerary, Pricing tiers adopt the progressive pattern.
- **Phase 5 — Polish**: stage-complete beat, sub-step dots, transitions, dead-code removal.

Each phase is independently shippable and independently revertible.

## 10. Acceptance criteria

- No screen requires scrolling to reach **Continue** at 1280×800 or on a 375 px phone.
- Resume lands on the exact stage **and** sub-step it was left on; a v1 draft lands on the right stage.
- Every existing validation rule still fires, at the sub-step that owns its field.
- The `STEPS` ↔ `SETUP_STEP_SLUGS` DEV assertion still passes; a new one guards stage↔flow drift.
- Autosave fires on each Continue, not on every keystroke.

</details>
