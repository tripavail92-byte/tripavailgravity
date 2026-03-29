# TripAvail Operator Marketplace Complete Todo List

Date: 2026-03-28
Status: live execution tracker
Scope: P1 to P5, rollout gates, guardrails, and friendly-language checklist

## How To Read This

- Status values:
  - DONE: implemented and validated in code and/or remote regression
  - IN PROGRESS: partially implemented or validated, but still needs follow-up
  - NOT STARTED: planned but no committed implementation yet

## P1 Ranking Calibration

Overall status: IN PROGRESS (major slice complete)

- [x] DONE: Admin-only quality scoring RPC with explainability fields
- [x] DONE: Reason codes and input snapshots for component explainability
- [x] DONE: Internal ranking calibration tab for admins
- [x] DONE: Sparse-data confidence controls for low and partial signal
- [x] DONE: Strong-vs-weak ordering assertions in SQL regression
- [x] DONE: Live ranked snapshot captured for product and ops sign-off
- [ ] IN PROGRESS: Recency weighting of score inputs
- [ ] IN PROGRESS: False-positive and false-negative review loop with product and ops

## P2 Moderation And Risk Tooling

Overall status: IN PROGRESS

- [x] DONE: Dedicated flagged-review triage queue in admin reports
- [x] DONE: Moderation flag visibility in review triage flow
- [ ] IN PROGRESS: Concern-to-resolution workflow hardening across report statuses and review notes
- [ ] IN PROGRESS: Complaint-heavy operator visibility summary for faster triage
- [ ] NOT STARTED: Duplicate-text heuristics for suspicious reviews
- [ ] NOT STARTED: Profanity/abuse heuristics expansion
- [ ] NOT STARTED: Soft suppression controls before hard removal
- [ ] NOT STARTED: Additional moderation audit history for high-impact actions

## P3 Operator Console Cleanup

Overall status: IN PROGRESS

- [x] DONE: Dedicated business profile route
- [x] DONE: Dedicated fleet and guides route
- [x] DONE: Dedicated verification route
- [x] DONE: Dedicated public preview route
- [x] DONE: Route-aware sectioning in operator settings
- [ ] IN PROGRESS: Inline completeness guidance and quality progress visibility
- [ ] IN PROGRESS: Preview-safe save flow clarity across storefront sections

## P4 Public Discovery Integration

Overall status: NOT STARTED

- [ ] NOT STARTED: Trust-first sort experiments in search
- [ ] NOT STARTED: Operator-card trust summaries for discovery
- [ ] NOT STARTED: Why-this-operator-stands-out snippets
- [ ] NOT STARTED: Featured placement rules based on blended quality
- [ ] NOT STARTED: Operator comparison surfaces
- [ ] NOT STARTED: Fairness guardrails for new operators in discovery ranking

## P5 Measurement And Ops Hardening

Overall status: IN PROGRESS

- [x] DONE: Storefront attribution split hardening in SQL regression
- [x] DONE: End-to-end smoke checks for attributed vs direct booking starts
- [x] DONE: CI log marker enforcement for attribution split validation
- [x] DONE: Seeded ranking fixtures for strong, weak, and sparse calibration cases
- [ ] IN PROGRESS: Time-window comparison reporting in admin and operator views
- [ ] IN PROGRESS: Complaint-rate integration into quality reporting summaries
- [ ] NOT STARTED: Repeat-traveler and rebooking signal integration
- [ ] NOT STARTED: Periodic QA runbook automation for ranking review cadence

## Rollout Gates

### Gate A Trust And Attribution Ready

Status: DONE

- [x] Public trust/response language upgraded
- [x] Concern reporting available in public storefront action flows
- [x] Attribution surfaced in operator and admin analytics
- [x] Regression and smoke coverage validated

### Gate B Ranking Calibration Ready

Status: IN PROGRESS

- [x] Admin-only score and inspectable inputs live
- [x] Strong-vs-weak and sparse-data behavior validated by regression
- [x] Product and ops calibration note captured
- [ ] In-progress: Repeat calibration once review volume broadens across operators

### Gate C Discovery Experiment Ready

Status: NOT STARTED

- [ ] Moderation and suppression controls must be fully operational
- [ ] Discovery ranking rules must be documented and staged
- [ ] Rollout controls/flags must be ready before enabling experiments

## Do Not Build Yet Guardrails

Status: ACTIVE CONSTRAINTS (must remain true)

- [x] Keep internal score admin-only (no raw public score exposure)
- [x] Do not rank publicly on rating average alone
- [x] Avoid overloading public badge taxonomy
- [x] Avoid large schema rewrites unless ranking/search pressure requires them

## Friendly-Language Checklist

Status: IN PROGRESS

- [x] Applied in major traveler, operator, and admin storefront surfaces
- [x] Replaced several internal terms with plain-language alternatives
- [ ] In-progress: Complete non-page shared-component label sweep
- [ ] In-progress: Complete service-driven string review where technical wording can leak into UI

## Immediate Build Queue (Execution Order)

1. P2 concern-to-resolution workflow hardening and complaint-heavy summary panel
2. P3 inline completeness guidance and public-preview-safe save flow hints
3. P5 complaint-rate and reliability rollup into admin quality summaries
4. P4 staged trust-first discovery experiment behind controlled rollout flags

## Validation Checklist For Next Work Session

- [ ] Rerun remote operator quality regression after every scoring-policy change
- [ ] Browser-check admin ranking tab after each calibration change
- [ ] Browser-check admin reports triage flows after moderation changes
- [ ] Run storefront smoke flow when attribution logic changes