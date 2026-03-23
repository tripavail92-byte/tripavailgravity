# TripAvail Commercial Phase 5 Auditability Review

## Scope

This review covers the current auditability of the existing admin commercial actions that directly change money-state or operator commercial state:

- operator tier assignment
- operator payout hold / release
- payout batch reversal
- payout recovery resolution

The review traces each action from the admin UI service layer to the database write path and checks whether the following are persisted reliably:

- actor identity
- action reason
- timestamp
- previous state versus new state
- a durable admin-readable audit surface

## Evidence Reviewed

- [packages/web/src/features/commercial/services/commercialService.ts](packages/web/src/features/commercial/services/commercialService.ts)
- [packages/web/src/pages/admin/AdminCommercialPage.tsx](packages/web/src/pages/admin/AdminCommercialPage.tsx)
- [supabase/migrations/20260315000021_operator_commercial_foundation.sql](supabase/migrations/20260315000021_operator_commercial_foundation.sql)
- [supabase/migrations/20260315000025_operator_payout_reversal_and_scheduler_guards.sql](supabase/migrations/20260315000025_operator_payout_reversal_and_scheduler_guards.sql)
- [supabase/migrations/20260316000028_operator_payout_recovery_deductions.sql](supabase/migrations/20260316000028_operator_payout_recovery_deductions.sql)
- [supabase/migrations/20260216000001_admin_moderation_and_audit.sql](supabase/migrations/20260216000001_admin_moderation_and_audit.sql)

## Findings

### 1. High: payout hold and release actions are not actor-auditable today

Current path:

- UI calls [packages/web/src/features/commercial/services/commercialService.ts](packages/web/src/features/commercial/services/commercialService.ts#L891)
- service performs a direct update against `operator_commercial_profiles`
- the update writes only `payout_hold` and `payout_hold_reason`

What is missing:

- no dedicated RPC for the action
- no `admin_action_logs` entry
- no `changed_by` field
- no `changed_at` field separate from generic `updated_at`
- no preservation of previous hold state or previous reason

Impact:

- an admin can apply or release a payout hold, but the system cannot later answer who changed it or what the previous state was from a durable audit source
- automatic holds and manual holds share the same state fields, so without a distinct audit record they are easy to confuse retrospectively

Conclusion:

- this is the clearest Phase 5 auditability gap and should be the first remediation target

### 2. High: payout batch reversal records reason and timestamp, but not the acting admin

Current path:

- UI calls [packages/web/src/features/commercial/services/commercialService.ts](packages/web/src/features/commercial/services/commercialService.ts#L923)
- database action runs through `reverse_operator_payout_batch(...)` in [supabase/migrations/20260316000028_operator_payout_recovery_deductions.sql](supabase/migrations/20260316000028_operator_payout_recovery_deductions.sql#L386)

What is persisted today:

- batch status changes to reversed
- payout items move into reversed or recovery_pending
- `hold_reason` may store the reversal reason when recovery is created
- booking finance snapshot notes store:
  - `payout_reversed_at`
  - `payout_reversal_reason`
  - `payout_reversal_requires_recovery`

What is missing:

- no admin actor id is written to batch, payout item, snapshot notes, or `admin_action_logs`
- no previous-state/new-state payload is captured in a durable audit table

Impact:

- the reversal is reconstructable as an event, but not attributable to a specific admin without external logs
- this is below the standard used elsewhere in the repo where admin actions call `admin_log_action(...)`

### 3. High: payout recovery resolution records reason and amounts, but not the acting admin

Current path:

- UI calls [packages/web/src/features/commercial/services/commercialService.ts](packages/web/src/features/commercial/services/commercialService.ts#L933)
- database action runs through `resolve_operator_payout_recovery(...)` in [supabase/migrations/20260315000025_operator_payout_reversal_and_scheduler_guards.sql](supabase/migrations/20260315000025_operator_payout_reversal_and_scheduler_guards.sql#L364)

What is persisted today:

- recovery amount is reduced or cleared
- payout item status changes
- `hold_reason` changes when recovery remains outstanding
- booking finance snapshot notes store:
  - `payout_recovery_resolved_at`
  - `payout_recovery_resolution_reason`
  - `payout_recovered_amount`
  - `payout_recovery_remaining_amount`

What is missing:

- no admin actor id on the recovery-resolution event
- no `admin_action_logs` row
- no structured previous-state/new-state audit payload

Impact:

- finance state is updated correctly, but manual recovery handling is not attributable to a specific reviewer/operator of the admin console

### 4. Medium: operator tier assignment is auditably better than the other actions, but still fragmented

Current path:

- UI calls [packages/web/src/features/commercial/services/commercialService.ts](packages/web/src/features/commercial/services/commercialService.ts#L870)
- database action runs through `admin_assign_operator_membership_tier(...)` in [supabase/migrations/20260315000021_operator_commercial_foundation.sql](supabase/migrations/20260315000021_operator_commercial_foundation.sql#L830)

What is persisted today:

- `operator_tier_change_log` exists in [supabase/migrations/20260315000021_operator_commercial_foundation.sql](supabase/migrations/20260315000021_operator_commercial_foundation.sql#L157)
- it stores:
  - operator id
  - previous tier
  - new tier
  - changed_by
  - reason
  - changed_at

What is missing:

- the action is not mirrored into the shared `admin_action_logs` system
- if the admin UI later wants a single unified audit feed, tier changes currently live in a separate log model only

Impact:

- the action itself is auditable enough for attribution
- but the audit surface is fragmented relative to the rest of the admin governance model

### 5. Medium: the repo already has a general-purpose admin audit system, but commercial money-state actions are not using it consistently

Evidence:

- `admin_action_logs` exists in [supabase/migrations/20260216000001_admin_moderation_and_audit.sql](supabase/migrations/20260216000001_admin_moderation_and_audit.sql#L84)
- `admin_log_action(...)` exists in [supabase/migrations/20260216000001_admin_moderation_and_audit.sql](supabase/migrations/20260216000001_admin_moderation_and_audit.sql#L152)
- multiple moderation and admin workflows already call `admin_log_action(...)`

Gap:

- the commercial admin actions reviewed here do not call `admin_log_action(...)`
- the current `admin_action_logs` entity-type constraint also does not obviously include a dedicated commercial or payout entity type in the audited path used here

Impact:

- the platform already has the right pattern, but the commercial control plane has not been brought fully into it yet

## Action-by-Action Auditability Scorecard

| Action | Actor persisted | Reason persisted | Timestamp persisted | Prev/new state persisted | Durable audit surface |
| --- | --- | --- | --- | --- | --- |
| Tier assignment | Yes | Yes | Yes | Partial | Separate tier log only |
| Payout hold / release | No | Partial | Generic only | No | No |
| Payout batch reversal | No | Yes | Yes | Partial | No |
| Payout recovery resolution | No | Yes | Yes | Partial | No |

## Recommended Remediation Order

### 1. Replace direct payout-hold updates with a dedicated admin RPC

Minimum requirements:

- require admin authentication and finance-capable role
- require a reason for both hold and release actions
- capture previous and new state
- write to `admin_action_logs`
- record explicit actor and timestamp fields on the commercial profile or a dedicated hold-history table

### 2. Add admin audit logging to payout reversal

Minimum requirements:

- write a structured `admin_action_logs` row for the batch reversal
- include previous batch state and resulting recovery totals
- persist actor id in a durable field or note payload

### 3. Add admin audit logging to recovery resolution

Minimum requirements:

- write a structured `admin_action_logs` row for each manual recovery resolution
- include prior recovery amount, recovered amount applied, remaining amount, and resulting payout status
- persist actor id in a durable field or note payload

### 4. Decide whether to unify tier changes into `admin_action_logs`

This is lower priority than the gaps above, because `operator_tier_change_log` already preserves actor and reason.

The main question is whether the product wants one audit feed for all admin actions or accepts a split model.

## Recommended First Implementation Task

The first concrete Phase 5 implementation should be:

- create a dedicated admin RPC for payout hold / release with mandatory reason and `admin_action_logs` integration

Reason:

- it is currently the weakest audit path
- it changes operator payout eligibility directly
- it is the only reviewed action still going through a plain table update from the admin client layer

## Exit Criteria For This Review

This auditability review is complete once the next implementation step uses it as the source of truth for:

- the first admin commercial audit RPC
- the audit schema choice for commercial money-state actions
- the acceptance criteria for Phase 5 admin action traceability