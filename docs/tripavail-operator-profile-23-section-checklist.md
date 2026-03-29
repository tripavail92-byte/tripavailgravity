# TripAvail Operator Profile System: 23-Section Completion Checklist

Updated: 2026-03-28
Status legend:

- `complete`: implemented and wired in product
- `partial`: meaningful implementation exists but does not satisfy the full target section
- `not started`: no meaningful implementation trail found yet

## Progress Table

| Section | Title | Status | Progress |
| --- | --- | --- | ---: |
| 1 | Objective | partial | 65% |
| 2 | Core Product Principle | complete | 100% |
| 3 | Final Product Scope | partial | 70% |
| 4 | User Flows | partial | 70% |
| 5 | Public Operator Profile Page Structure | partial | 85% |
| 6 | Internal Operator Dashboard Structure | partial | 60% |
| 7 | Database Plan | partial | 65% |
| 8 | Review System Rules | partial | 60% |
| 9 | Rating Model | partial | 45% |
| 10 | Trust Badge Logic | partial | 75% |
| 11 | Search & Ranking Impact | not started | 10% |
| 12 | UI/UX Style Direction | partial | 75% |
| 13 | Component Tree Plan | partial | 70% |
| 14 | Data Sources You Can Reuse From Existing Setup | complete | 100% |
| 15 | Admin / Moderation Requirements | partial | 70% |
| 16 | Analytics Plan | partial | 70% |
| 17 | Rollout Strategy | partial | 70% |
| 18 | Engineering Priorities | partial | 75% |
| 19 | API Planning | partial | 55% |
| 20 | Risk Areas | partial | 55% |
| 21 | Success Metrics | partial | 40% |
| 22 | Final Recommended Launch Order | partial | 70% |
| 23 | Final Product Positioning | partial | 75% |

Overall estimated completion against the full 23-section plan: `68%`

This is materially higher than the earlier archaeology estimate because the storefront, awards, analytics, admin review, QA automation, and dashboard work are now implemented.
## 1. Objective

Status: `partial`

- Completed:
  - operator storefront is now a public trust and conversion surface instead of a weak personal-profile substitute
  - travelers can inspect trust badges, awards, fleet, guides, policies, reviews, and tours before booking
  - storefront analytics now measure views and engagement behavior
- Remaining:
  - trust complaints, booking-confidence uplift, and ranking impact are not yet measured as business outcomes
  - marketplace-quality differentiation logic is still incomplete
## 2. Core Product Principle

Status: `complete`

- Completed:
  - personal profile remains separate from operator storefront
  - public operator route exists at `/operators/:slug`
  - operator summary links into the public storefront from the traveler experience
- Remaining:
  - none for the separation principle itself
## 3. Final Product Scope

Status: `partial`

- Completed:
  - Layer 1 public operator storefront exists
  - Layer 2 reputation engine foundations exist
  - Layer 3 capability presentation exists for fleet, guides, and gallery
  - Layer 4 verification and trust surfaces exist, including badges, awards, and admin review
  - Layer 5 internal console exists in partial form through settings, reputation, analytics, and reviews pages
- Remaining:
  - Layer 5 still lacks the dedicated business-profile, fleet, verification, and public-preview route structure described in the plan
  - full marketplace-quality ranking behavior is not yet implemented
## 4. User Flows

Status: `partial`

- Completed:
  - traveler flow from tour context into `/operators/:slug` works
  - operator setup/edit flow exists through storefront settings fields
  - post-trip review flow supports verified booking reviews and category ratings
  - operator response flow exists through public review replies
  - admin storefront verification review flow exists for trust documents and awards
- Remaining:
  - operator onboarding is not yet a dedicated staged commercial-profile setup flow
  - review moderation and reply governance are not yet exposed as richer SLA/state workflows
## 5. Public Operator Profile Page Structure

Status: `partial`

- Completed:
  - hero header
  - trust snapshot cards
  - about section
  - verification and trust badges section
  - fleet and capabilities section
  - reviews and ratings section
  - tours by operator section
  - policies and business standards section
  - media gallery section
  - awards and recognition section
  - sticky CTA surface
- Remaining:
  - share-profile action is still not surfaced as a dedicated storefront CTA
  - report-operator CTA is not yet present as a distinct public control
  - response time and response rate are not yet rendered in the hero as planned
## 6. Internal Operator Dashboard Structure

Status: `partial`

- Completed:
  - operator reviews page exists
  - operator reputation page exists
  - operator analytics page exists
  - operator settings page edits core storefront content, gallery, trust inputs, fleet, guides, and policies
- Remaining:
  - dedicated `/operator-dashboard/business-profile`
  - dedicated `/operator-dashboard/fleet`
  - dedicated `/operator-dashboard/verification`
  - dedicated `/operator-dashboard/public-preview`
## 7. Database Plan

Status: `partial`

- Completed:
  - review table exists
  - review reply table exists
  - operator public metrics snapshot table exists
  - operator awards table exists
  - verification review records exist
  - storefront analytics events table exists
  - `tour_operator_profiles` now carries public storefront fields for slug, fleet, guides, gallery, policies, and verification documents
- Remaining:
  - the normalized business schema proposed in the plan is not fully built as separate tables for regions, capabilities, assets, guides, and verifications
  - the current implementation still extends `tour_operator_profiles` instead of introducing a dedicated `operator_business_profiles` root
## 8. Review System Rules

Status: `partial`

- Completed:
  - verified booking linkage exists
  - one-review-per-booking rules exist
  - review moderation status exists
  - public replies exist
- Remaining:
  - configurable review window policy
  - explicit 48-hour edit-window enforcement
  - stronger abuse detection such as profanity, spam, or duplicate heuristics
## 9. Rating Model

Status: `partial`

- Completed:
  - overall rating aggregation exists
  - structured category scores exist
  - category averages are stored in `operator_public_metrics`
- Remaining:
  - weighted displayed score combining reputation and operational performance
  - recency weighting
  - confidence weighting by review volume
  - complaint and cancellation behavior in one surfaced ranking score
## 10. Trust Badge Logic

Status: `partial`

- Completed:
  - storefront trust badges render from verification state and public support signals
  - system awards now exist with expiry windows
  - admin award overrides exist
  - awards refresh automatically from storefront and reputation state
- Remaining:
  - the badge and award set still does not cover every planned scenario
  - some business logic remains simpler than the final quality-engine vision
## 11. Search & Ranking Impact

Status: `not started`

- Completed:
  - only foundational data now exists for future ranking work
- Remaining:
  - search ranking influence
  - featured operator placement
  - trust sorting
  - operator comparison logic
## 12. UI/UX Style Direction

Status: `partial`

- Completed:
  - premium hero and stat-card treatment
  - strong trust-first hierarchy
  - gallery, awards, and sticky CTA now help the page read like a commercial storefront
  - review and capability sections are clearly segmented
- Remaining:
  - final polish pass on premium hierarchy once response metrics and richer CTA set are added
## 13. Component Tree Plan

Status: `partial`

- Completed:
  - public page now covers most planned storefront sections
  - operator-side analytics, reputation, reviews, and settings surfaces exist
- Remaining:
  - some planned components remain embedded inside larger pages instead of standing as dedicated modules
  - public preview and specialized manager components are still absent as distinct screens
## 14. Data Sources You Can Reuse From Existing Setup

Status: `complete`

- Completed:
  - reused business name, location, categories, support details, and verification-linked setup data
  - extended the same setup source with gallery, fleet, guides, and policy fields
- Remaining:
  - none for the reuse principle itself, though later normalization may still be desirable
## 15. Admin / Moderation Requirements

Status: `partial`

- Completed:
  - admin partner governance exists
  - storefront verification dialog exists
  - award overrides exist
  - admin dashboard now surfaces storefront analytics overview
- Remaining:
  - complaint-heavy operator monitoring specific to storefront risk
  - fake media review tooling
  - stronger trust-score suppression or featured-placement controls
## 16. Analytics Plan

Status: `partial`

- Completed:
  - operator profile views
  - CTA clicks
  - tour click-through from storefront
  - operator analytics page with export
  - admin storefront analytics in partner review and dashboard overview
  - bounded engagement rate based on engaged visitors over unique visitors
- Remaining:
  - time on operator page
  - conversion after viewing operator page
  - section engagement analytics
  - review filter usage analytics
  - booking outcome attribution after storefront view
## 17. Rollout Strategy

Status: `partial`

- Completed:
  - Phase 1 is complete
  - Phase 2 is mostly complete
  - Phase 3 is materially implemented
  - Phase 4 has started with verification workflow and award logic
- Remaining:
  - deeper Phase 4 badge sophistication
  - Phase 5 ranking and marketplace integration
## 18. Engineering Priorities

Status: `partial`

- Completed:
  - migrations for reviews, replies, public storefront, awards, analytics, verification, and public RLS fixes
  - public route, operator analytics, admin review flow, and QA automation now exist
  - CI example gate exists for storefront QA
- Remaining:
  - jobs for richer metrics aggregation, rankings, and background trust logic
  - more formal backend API layer if the team wants to reduce direct client-side Supabase coupling
## 19. API Planning

Status: `partial`

- Completed:
  - equivalent data access exists through Supabase queries and RPCs
  - admin verification and award-control RPCs exist
  - storefront analytics RPC exists
- Remaining:
  - canonical HTTP API layer matching the full endpoint map has not been built
  - dedicated dashboard API contracts for preview and business-profile management are still absent
## 20. Risk Areas

Status: `partial`

- Completed:
  - verified-booking review rules reduce fake review risk
  - admin verification and award controls reduce self-claimed trust inflation
  - new operators can now show stronger trust through verification and completeness even before reviews mature
- Remaining:
  - stronger anti-fraud checks for fake capabilities
  - richer moderation around media abuse and operator disputes
  - further performance optimization as the page grows heavier
## 21. Success Metrics

Status: `partial`

- Completed:
  - storefront behavioral analytics now exist
  - engagement can now be compared by window for operators and admins
- Remaining:
  - trust complaint reduction measurement
  - booking-conversion uplift measurement
  - repeat traveler and cancellation outcome measurement tied to storefront quality
## 22. Final Recommended Launch Order

Status: `partial`

- Completed:
  - Release 1 complete
  - Release 2 largely complete
  - Release 3 materially complete
  - Release 4 partially underway
- Remaining:
  - full Release 4 completion
  - Release 5 ranking and marketplace integration
## 23. Final Product Positioning

Status: `partial`

- Completed:
  - the public storefront now reads as a business credibility surface instead of a basic personal profile
  - verification, awards, fleet, guides, and policies all reinforce the commercial identity
- Remaining:
  - search/ranking impact and stronger quality hierarchy are still needed to fully realize the premium-marketplace positioning
## Current Overall Read

- Fully complete or near-complete: storefront separation, public operator page, trust surfaces, reviews/replies, awards, gallery, policies, fleet/guides, operator analytics, admin verification flow, admin analytics overview, and QA automation
- Still clearly incomplete: ranking/search impact, weighted quality scoring, richer review-abuse controls, formal operator dashboard route split, and outcome-level success measurement
- Best current framing: the storefront and governance MVP is strong, but the long-term marketplace-quality engine is still mid-build

## Recommended Changes

- Keep the current `tour_operator_profiles` extension strategy for now; do not pay the migration cost of a fully normalized business schema until search/ranking work actually needs it
- Prioritize Phase 5 next: ranking influence, featured placement, and operator comparison will unlock the largest strategic value beyond the current MVP
- Add response-rate and response-time metrics to the public hero before doing cosmetic polish passes, because they are high-trust signals that are still missing
- Add booking-after-storefront-view attribution before trying to claim conversion uplift, otherwise success metrics will remain impression-heavy and outcome-light
- Add lightweight review-abuse heuristics before opening review media more broadly, because media fraud and low-quality reviews will become the next trust gap

See also: [docs/tripavail-operator-profile-benchmark-roadmap.md](docs/tripavail-operator-profile-benchmark-roadmap.md) for the benchmark-informed execution decision and next-sprint authority plan.

## Next Sprint Execution Plan

Sprint goal: move the system from strong storefront/governance MVP to the first real marketplace-quality engine slice.

### 1. Public Trust Completion

Target outcome:

- finish the missing high-trust public signals above the fold

Scope:

- add response rate to the public hero
- add average response time to the public hero
- add explicit share-profile CTA
- add explicit report-operator CTA

Definition of done:

- `/operators/:slug` shows response behavior in hero and trust summary
- all CTA controls work on desktop and mobile

### 2. Conversion Attribution

Target outcome:

- measure whether storefront views influence bookings instead of only measuring engagement

Scope:

- persist storefront-view session attribution into booking initiation path
- record booking-after-storefront-view signal
- expose attributed conversions in operator analytics and admin dashboard overview

Definition of done:

- operators and admins can see bookings influenced by storefront traffic
- release metrics can move beyond page views and clicks

### 3. Review Quality Safeguards

Target outcome:

- reduce low-quality or abusive review risk before richer media/review growth

Scope:

- add review edit-window enforcement
- add basic profanity and duplicate review heuristics
- add admin-facing flagged-review visibility for operator reviews

Definition of done:

- review mutations respect policy windows
- suspicious reviews can be surfaced for moderation

### 4. Ranking Foundation

Target outcome:

- start Phase 5 with data-backed operator quality signals

Scope:

- define first operator quality score inputs
- combine rating, cancellation behavior, verification strength, and response behavior into an internal score
- expose the score only to admin first

Definition of done:

- admin can compare operators by a single internal quality score
- no public ranking impact yet unless explicitly approved

### 5. Console Structure Cleanup

Target outcome:

- reduce the gap between current screens and the planned operator dashboard IA

Scope:

- split verification concerns into a dedicated operator route
- split public preview into a dedicated operator route
- keep existing settings editor as the implementation base

Definition of done:

- route map better matches the planned dashboard structure without a large data-model rewrite

### Sprint Order

1. Response metrics in public hero
2. Storefront-to-booking attribution
3. Review safeguards
4. Internal operator quality score
5. Dashboard route split for verification and preview

## Release Breakdown

### Release 1 — Separate Public Operator Page

Status: `complete`

Done:

- separate public operator page at `/operators/:slug`
- basic trust summary
- operator tours section
- simple review section
- tour-to-operator profile CTA path

Remaining:

- none required to call Release 1 complete

### Release 2 — Structured Reputation System

Status: `mostly complete`

Done:

- structured ratings
- category breakdown
- review replies
- public metrics snapshot
- operator reputation page
- operator analytics page

Remaining:

- stronger review filter analytics
- richer review-abuse safeguards
- more advanced displayed scoring model

### Release 3 — Fleet and Capabilities

Status: `materially complete`

Done:

- fleet section
- guide section
- gallery/media section
- policies/business standards section
- operator settings support for these storefront inputs

Remaining:

- fuller service-style and equipment modeling from the original long-form plan
- more explicit business readiness presentation where useful

### Release 4 — Badges, Verification, Trust Hierarchy

Status: `partially complete`

Done:

- verification review workflow
- public trust badges
- awards section
- admin award overrides
- expiry windows and richer award rules
- admin storefront analytics in review dialog and dashboard overview

Remaining:

- richer badge set coverage
- response-time and response-rate hero trust signals
- stronger moderation around fake media and complaint-heavy operators
- final premium hierarchy polish

### Release 5 — Ranking and Marketplace Integration

Status: `not started`

Done:

- foundation only: analytics, metrics, verification, and awards data now exist to support ranking later

Remaining:

- operator quality score
- search ranking impact
- featured operator logic
- trust-based discovery and sorting
- operator comparison experience
- outcome metrics proving booking-confidence uplift
