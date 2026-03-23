# JWT Claim Audit Note

Use this note when auditing for legacy `request.jwt.claim.*` usage.

## Ignore In Future Audits

These migration hits are intentionally historical snapshots and should not be treated as active defects when a newer migration already overrides the function body:

- `supabase/migrations/20260315000024_operator_payout_batch_worker_rpc.sql`
- `supabase/migrations/20260323000002_admin_commercial_auditability.sql`
- `supabase/migrations/20260323000004_commercial_promo_audit_feed.sql`
- `supabase/migrations/20260323000009_phase7_billing_worker_and_ops_thresholds.sql`

They remain in the repository for migration history, but their live behavior is superseded by:

- `supabase/migrations/20260323000010_request_jwt_role_finance_fix.sql`
- `supabase/migrations/20260323000011_admin_commercial_request_jwt_role_followup.sql`

## Still Valid To Keep

This fallback is intentional and should remain audit-safe:

- `supabase/migrations/20260323000010_request_jwt_role_finance_fix.sql`

It reads `request.jwt.claims` first, then falls back to `request.jwt.claim.role`, then `auth.jwt()` to preserve compatibility across execution contexts.

## Current Audit Rule

Treat any new direct use of `request.jwt.claim.role`, `request.jwt.claim.sub`, or similar `request.jwt.claim.*` keys outside the compatibility helper above as a regression unless it is clearly confined to a historical migration snapshot.