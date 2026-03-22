# TripAvail Admin Panel — Phase 1–3 Completion Audit

Date: 2026-02-16

This file is a review artifact summarizing what has been completed in Phase 1 and Phase 2, and what is currently completed vs pending in Phase 3.

---

## Phase 1 — DB + RLS + Audit Foundation (Completed)

### What was implemented

- **Admin identity + roles**
  - Table: `public.admin_users`
  - Roles: `super_admin`, `moderator`, `support`
  - Helpers (SECURITY DEFINER): `public.is_admin(uuid)`, `public.get_admin_role(uuid)`

- **Audit logging**
  - Table: `public.admin_action_logs`
  - Captures: `admin_id`, `entity_type`, `entity_id`, `action_type`, `reason`, `previous_state`, `new_state`, timestamps
  - Logging function (SECURITY DEFINER): `public.admin_log_action(...)`

- **Moderation (soft-delete only) for marketplace listings**
  - `public.packages`:
    - Added fields: `status`, `moderation_reason`, `moderated_by`, `moderated_at`, `deleted_at`
    - Enforced **no hard delete**: revoked DELETE, dropped user delete policy
    - Admin moderation RPC (SECURITY DEFINER): `public.admin_moderate_package(...)` which also logs
  - `public.tours`:
    - Added fields: `status`, `moderation_reason`, `moderated_by`, `moderated_at`, `deleted_at`
    - Enforced **no hard delete**: revoked DELETE
    - Admin moderation RPC (SECURITY DEFINER): `public.admin_moderate_tour(...)` which also logs

- **Account status moderation for people (soft-delete style)**
  - `public.profiles`:
    - Added fields: `account_status`, `status_reason`, `status_updated_by`, `status_updated_at`
    - Admin RPC: `public.admin_set_traveler_status(...)` which also logs
  - `public.hotel_manager_profiles` + `public.tour_operator_profiles`:
    - Added fields: `account_status`, `status_reason`, `status_updated_by`, `status_updated_at`
    - Admin RPCs: `public.admin_set_hotel_manager_status(...)`, `public.admin_set_tour_operator_status(...)` which also log

- **RLS policies + privileges aligned to the rules**
  - Admin read policies added for moderation UI
  - Audit log policies:
    - Admins can SELECT logs
    - Admins can INSERT logs (needed for authenticated-admin action logging)
    - Service role can INSERT logs
  - Privilege-level blocks:
    - Revoked UPDATE on moderation/status columns for non-admin roles

### External audit fixes already applied

- `entity_type` constraint includes `tour`
- Tour moderation logs use `entity_type = 'tour'` (not `'package'`)
- `deleted_at` clears when status moves away from `deleted` (true undelete)

### Where

- Migration: [supabase/migrations/20260216000001_admin_moderation_and_audit.sql](supabase/migrations/20260216000001_admin_moderation_and_audit.sql)

### Verification artifacts (connectivity + bootstrap)

- Connectivity/object checks script: [scripts/check-supabase.mjs](scripts/check-supabase.mjs)
- Bootstrap seeding script: [scripts/seed-super-admin.mjs](scripts/seed-super-admin.mjs)

### Phase 1 rules coverage (explicit)

- **Packages are auto-approved**: no approval workflow added; admin actions are moderation-only (hide/suspend/delete).
- **No hard deletes**: enforced by revoking DELETE + removing user delete policy on `packages`; revoked DELETE on `tours`.
- **Everything logged**: all admin mutation functions call `admin_log_action` with before/after snapshots and reason.

---

## Phase 2 — Admin UI Skeleton (Completed)

### What was implemented

- **Admin route group**
  - `/admin/*` routes added under React Router.

- **Admin access guard**
  - `AdminGuard` checks `admin_users` for the signed-in user; non-admins are redirected away.

- **Admin layout**
  - Desktop sidebar nav
  - Mobile-friendly nav: top bar + “Menu” toggle that expands/collapses links inline

- **Placeholder admin pages**
  - Dashboard, Users, Partners, Listings, Bookings, Reports, Audit Logs, Settings

### Where

- Router wiring: [packages/web/src/App.tsx](packages/web/src/App.tsx)
- Guard: [packages/web/src/components/auth/AdminGuard.tsx](packages/web/src/components/auth/AdminGuard.tsx)
- Layout: [packages/web/src/layouts/AdminLayout.tsx](packages/web/src/layouts/AdminLayout.tsx)
- Pages (placeholders):
  - [packages/web/src/pages/admin/AdminDashboardPage.tsx](packages/web/src/pages/admin/AdminDashboardPage.tsx)
  - [packages/web/src/pages/admin/AdminUsersPage.tsx](packages/web/src/pages/admin/AdminUsersPage.tsx)
  - [packages/web/src/pages/admin/AdminPartnersPage.tsx](packages/web/src/pages/admin/AdminPartnersPage.tsx)
  - [packages/web/src/pages/admin/AdminListingsPage.tsx](packages/web/src/pages/admin/AdminListingsPage.tsx)
  - [packages/web/src/pages/admin/AdminBookingsPage.tsx](packages/web/src/pages/admin/AdminBookingsPage.tsx)
  - [packages/web/src/pages/admin/AdminReportsPage.tsx](packages/web/src/pages/admin/AdminReportsPage.tsx)
  - [packages/web/src/pages/admin/AdminAuditLogsPage.tsx](packages/web/src/pages/admin/AdminAuditLogsPage.tsx)
  - [packages/web/src/pages/admin/AdminSettingsPage.tsx](packages/web/src/pages/admin/AdminSettingsPage.tsx)

---

## Phase 3 — Commercial + Admin QA Closure (Pending Final Manual Payment Sign-Off)

Phase 3 is now functionally complete from an engineering and production-fix perspective, but it is not yet fully signed off. The remaining gate is one final manual traveller payment pass using direct human Stripe entry.

Current status: `Pending final manual payment sign-off`

What is complete:

- operator commercial production issues fixed and redeployed
- admin commercial production issues fixed and redeployed
- operator create-tour draft slug collision fixed and revalidated in production
- pricing-step uncontrolled-to-controlled switch warning fixed and revalidated in production
- operator commission amounts removed from operator-facing commercial surfaces
- operator commercial `400` root cause fixed by removing the admin-only payout batch query from the operator path
- Phase 3 runbook updated to reflect operator payout-only visibility and the manual Stripe sign-off requirement

Remaining sign-off requirement:

- one manual traveller checkout on production using direct human entry into Stripe Elements

Why this remains open:

- browser automation is not a reliable authority for Stripe iframe completion state
- prior checkout investigation showed the app flow itself was responsive, but automated iframe keystrokes can be rejected with incomplete-card validation even when the product is functioning correctly

Phase 3 should be marked fully complete only after that manual traveller payment pass succeeds.

---

## Earlier Phase 3 Foundation Work (Completed)

Phase 3 in the original plan was “real admin modules (moderation-only).” That foundation work was completed earlier and remains part of the overall Phase 3 delivery.

### Completed in Phase 3 (read-only visibility)

- **Audit Logs viewer (read-only list)**
  - Fetches last 50 rows from `admin_action_logs`, ordered by `created_at DESC`
  - Shows loading/empty/error states
  - File: [packages/web/src/pages/admin/AdminAuditLogsPage.tsx](packages/web/src/pages/admin/AdminAuditLogsPage.tsx)

- **Users viewer (read-only list)**
  - Fetches last 50 rows from `profiles` (admin policy allows select)
  - Shows basic identity + `account_status`
  - File: [packages/web/src/pages/admin/AdminUsersPage.tsx](packages/web/src/pages/admin/AdminUsersPage.tsx)

- **Partners viewer (read-only list)**
  - Fetches hotel managers from `hotel_manager_profiles` and tour operators from `tour_operator_profiles`
  - Also looks up identity in `profiles` for email/name display
  - File: [packages/web/src/pages/admin/AdminPartnersPage.tsx](packages/web/src/pages/admin/AdminPartnersPage.tsx)

- **Listings viewer (read-only list)**
  - Fetches packages from `packages` and tours from `tours`
  - Shows moderation `status` plus publish/active flags
  - File: [packages/web/src/pages/admin/AdminListingsPage.tsx](packages/web/src/pages/admin/AdminListingsPage.tsx)

### Phase 3 write actions (Completed)

- **Write actions in UI (moderation buttons + reason input)**
  - Listings: Packages + Tours moderation calls are implemented on the Listings page.
  - Users: Traveler account status moderation calls are implemented on the Users page.
  - Partners: Hotel manager + tour operator account status moderation calls are implemented on the Partners page.

Until these UI actions are used, **`admin_action_logs` will remain empty** (by design).

### Phase 3 hardening (Completed)

- **Auto-refresh audit logs after action**
  - After successful moderation actions, the UI dispatches an event and the Audit Logs page auto-refreshes when open.
  - Success toasts now clearly indicate to check Audit Logs.

- **Loading / disabled states**
  - Apply buttons are disabled during RPC execution and show a spinner to prevent double-submit.
  - Inputs (status + reason) are disabled while the action is running.

- **Confirmation modal for `deleted`**
  - When an admin chooses `deleted`, a confirmation dialog appears explaining it is a soft-delete.

- **Reason minimum length**
  - UI enforces reason required + minimum length (12 characters) to keep audit logs meaningful.

---

## Known Notes / Non-blockers

- `pnpm -C packages/web typecheck` currently reports pre-existing type errors in other unrelated parts of the web app (hotel listing flow etc.). The new admin files/pages introduced in Phase 2/3 do not introduce TypeScript errors in the Problems panel.

---

## Suggested Next Step

Proceed to **Reports** next (not Bookings yet). Reports now have a minimal foundation:

- DB: `public.reports` + `public.report_status_enum` + `public.admin_set_report_status(...)` (logged)
- UI: Admin Reports page supports read + status update with reason
