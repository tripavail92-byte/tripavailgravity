# TripAvail Operator Marketplace: Next Major Todo List

Updated: 2026-03-28
Status: working backlog after Release 4.5 validation

## Why This Backlog Looks This Way

This backlog is shaped by the same patterns mature marketplaces use, so the product feels familiar instead of invented:

- Trust is shown before ranking is amplified.
- Response behavior matters, not just badges and star ratings.
- Ranking is based on a blend of quality, reliability, content completeness, and conversion behavior.
- Moderation and reporting exist before giving more visibility to operators.
- Operator tools should be simple and workflow-based, not admin-heavy or jargon-heavy.

In practical terms, TripAvail should feel closer to a trustworthy, easy-to-read marketplace profile than a dense internal dashboard.

## Industry-Shaped Product Rules

- Do not rank operators publicly on star rating alone.
- Do not expose featured placement until the internal quality score is stable.
- Do not add more storefront merchandising before moderation and reporting are solid.
- Do not force a big schema rewrite before search or ranking proves it is necessary.
- Prefer friendly language in the UI: use terms like `Response time`, `Verified documents`, `Report concern`, `Why this operator is trusted`, and `Popular with travelers`.

## Priority Order

1. Trust and attribution completion
2. Ranking calibration
3. Moderation tooling
4. Operator console cleanup
5. Public discovery integration
6. Measurement and operations hardening

## P0: Trust And Attribution Completion

Goal: make the public storefront feel trustworthy, understandable, and measurable before any ranking work changes discovery.

- [ ] Show response rate in the storefront hero.
- [ ] Show average response time in the storefront hero.
- [ ] Add a clear `Share profile` CTA on desktop and mobile.
- [ ] Add a clear `Report operator` CTA on desktop and mobile.
- [ ] Make the report flow visible, simple, and non-threatening.
- [ ] Confirm trust badges are understandable without internal jargon.
- [ ] Ensure awards have human-readable descriptions, not internal codes.
- [ ] Show why an operator is trusted in plain language, not just badge icons.
- [ ] Persist storefront session attribution into booking-start flow.
- [ ] Record booking starts that came from storefront visits.
- [ ] Expose attributed booking starts in operator analytics.
- [ ] Expose attributed booking starts in admin overview.
- [ ] Add operator-to-tour attribution breakdown, not only operator totals.
- [ ] Make attribution wording simple: `Bookings started after viewing this operator page`.
- [ ] Add regression coverage for storefront-to-booking attribution edge cases.

Definition of done:

- Travelers can see trust and responsiveness before scrolling.
- Operators and admins can tell whether storefront views influence booking starts.
- The storefront reads like a product travelers can understand quickly.

## P1: Ranking Calibration

Goal: create a ranking model that is explainable, measurable, and safe before it affects public discovery.

- [ ] Freeze the first quality score inputs and document them clearly.
- [ ] Keep the score admin-only during calibration.
- [ ] Score review quality with volume confidence, not raw average alone.
- [ ] Score verification strength separately from review quality.
- [ ] Score responsiveness using both reply rate and reply time.
- [ ] Score reliability using cancellation behavior and complaint pressure.
- [ ] Score storefront completeness using trust and content coverage.
- [ ] Score behavioral performance using engaged visitors and attributed booking starts.
- [ ] Add recency weighting so old reviews matter less than recent performance.
- [ ] Add minimum data thresholds so new operators are not over-ranked by tiny samples.
- [ ] Add reason codes for each score component so admins can explain outcomes.
- [ ] Show score breakdown in admin partner review.
- [ ] Add an admin ranked list of operators for calibration only.
- [ ] Compare score output against known strong and weak operators.
- [ ] Review false positives and false negatives with product and ops.
- [ ] Lock a v1 scoring policy before public ranking experiments begin.

Definition of done:

- Admins can explain why one operator ranks above another.
- The score does not over-reward hype, sparse reviews, or vanity content.
- The score is stable enough for limited ranking experiments.

## P2: Moderation And Risk Tooling

Goal: make visibility safer before adding more reach.

- [ ] Create an admin queue for flagged reviews.
- [ ] Surface moderation flags in a dedicated review triage view.
- [ ] Add review edit-window enforcement at the data layer.
- [ ] Add duplicate-text heuristics for reviews.
- [ ] Add profanity and abuse heuristics for reviews.
- [ ] Add simple suspicious-pattern heuristics for repeated low-effort reviews.
- [ ] Add operator dispute notes for moderation decisions.
- [ ] Add report-to-resolution workflow for operator complaints.
- [ ] Distinguish `open`, `in review`, `resolved`, and `dismissed` concern states clearly.
- [ ] Add admin visibility for complaint-heavy operators.
- [ ] Add soft suppression controls before hard removal.
- [ ] Add moderation audit history for high-impact actions.
- [ ] Add QA coverage for flagged review and report flows.

Definition of done:

- Admins can find risky content quickly.
- Operators have a readable governance path.
- Growth is not amplifying bad operators faster than the team can control.

## P3: Operator Console Cleanup

Goal: make operator workflows feel normal and easy, not stitched together.

- [ ] Split storefront editing into clear sections instead of one large settings surface.
- [ ] Add a dedicated `Verification` route.
- [ ] Add a dedicated `Public preview` route.
- [ ] Add a dedicated `Business profile` route if the current settings page is too dense.
- [ ] Add a dedicated `Fleet and guides` route if that content keeps growing.
- [ ] Keep labels friendly and business-oriented.
- [ ] Avoid admin words in operator UI where possible.
- [ ] Add inline completeness guidance: what is missing and why it matters.
- [ ] Add preview-safe save flow so operators understand what is public.
- [ ] Add simple progress indicators for storefront quality.
- [ ] Reuse existing data model where possible; do not normalize prematurely.

Definition of done:

- Operators know where to go for trust, content, and preview tasks.
- Storefront management feels like one coherent workflow.

## P4: Public Discovery Integration

Goal: expose quality signals to travelers in familiar marketplace patterns.

- [ ] Add trust-first sort options to search when calibration is ready.
- [ ] Add better operator cards in search results.
- [ ] Show a small, friendly trust summary on operator cards.
- [ ] Add `Why this operator stands out` snippets to cards and profile surfaces.
- [ ] Test featured placement rules using score plus reliability, not score alone.
- [ ] Add operator comparison surfaces for travelers choosing between similar tours.
- [ ] Use plain, familiar labels such as `Highly responsive`, `Well-reviewed`, `Low cancellation`, and `Complete profile`.
- [ ] Avoid exposing internal score numbers publicly at first.
- [ ] Add guardrails so new operators still get fair exposure.
- [ ] Run ranking experiments gradually, not marketplace-wide on day one.

Definition of done:

- Discovery feels helpful and recognizable.
- Travelers can understand why some operators are surfaced more prominently.
- New operator fairness is preserved.

## P5: Measurement And Operations Hardening

Goal: ensure decisions are based on outcomes, not vanity metrics.

- [ ] Add storefront funnel reporting: profile view -> engagement -> tour click -> booking start.
- [ ] Break down attribution by operator and by tour.
- [ ] Add time-window comparisons for operator performance.
- [ ] Add section engagement where useful, but only after core funnel is stable.
- [ ] Add complaint-rate tracking into quality reporting.
- [ ] Add cancellation and fulfillment reliability into admin summaries.
- [ ] Add repeat-traveler and rebooking signals where available.
- [ ] Add dashboard explanations for each metric so non-engineering teams can use them.
- [ ] Expand CI coverage for analytics and ranking regressions.
- [ ] Add seeded scenarios for high-quality, low-quality, and sparse-data operators.
- [ ] Add periodic QA runbook for storefront quality and ranking review.

Definition of done:

- Product and ops can tell whether storefront quality is improving marketplace outcomes.
- Metrics are decision-grade, not just directional.

## P6: Release And Rollout Gates

Goal: ship this safely and in a way people understand.

### Gate A: Trust And Attribution Ready

- [ ] Public hero shows response behavior.
- [ ] Report flow works on desktop and mobile.
- [ ] Attribution is visible in operator and admin analytics.
- [ ] Copy review confirms the storefront language feels friendly and not over-engineered.

### Gate B: Ranking Calibration Ready

- [ ] Admin-only score is live.
- [ ] Score inputs are inspectable.
- [ ] Known strong operators rank above known weak ones in calibration review.
- [ ] Sparse-data operators are not incorrectly over-promoted.

### Gate C: Discovery Experiment Ready

- [ ] Moderation queue is operational.
- [ ] Complaint-heavy operators can be suppressed or reviewed quickly.
- [ ] Search and featured placement rules are documented.
- [ ] Ranking changes are rolled out behind controlled flags or staged activation.

## What Not To Build Yet

- [ ] Do not publish a single visible `quality score` number for travelers yet.
- [ ] Do not rank based only on rating average.
- [ ] Do not create too many public badge types that people cannot understand.
- [ ] Do not redesign the storefront visually before the trust and ranking model is clearer.
- [ ] Do not do a large schema rewrite until ranking or performance requires it.

## Friendly Language Checklist

Use this when product copy is written:

- [ ] Replace internal phrases like `attributed conversion rate` in public UI with clearer user language.
- [ ] Prefer `Responds quickly` over `responsiveness score` in traveler-facing surfaces.
- [ ] Prefer `Verified documents on file` over `verification strength` in traveler-facing surfaces.
- [ ] Prefer `Report a concern` over `submit moderation report`.
- [ ] Prefer `Popular with travelers` over `behavioral performance`.
- [ ] Keep admin and operator wording more direct, but still readable.

## Recommended Sprint Breakdown

### Sprint 1

- [ ] Public trust completion
- [ ] Attribution completion
- [ ] Friendly copy pass on storefront trust UI

### Sprint 2

- [ ] Moderation queue and triage views
- [ ] Review safeguard hardening
- [ ] Operator console cleanup

### Sprint 3

- [ ] Admin quality score calibration
- [ ] Admin ranked list
- [ ] Discovery experiment design

### Sprint 4

- [ ] Search ranking experiments
- [ ] Operator comparison surfaces
- [ ] Featured placement rules and rollout controls

## Short Recommendation

If one sequence has to be followed strictly, use this:

1. Make trust readable.
2. Make attribution real.
3. Make moderation usable.
4. Make ranking explainable.
5. Make discovery smarter.

That sequence matches how good marketplaces usually evolve, and it keeps TripAvail understandable for both travelers and operators.