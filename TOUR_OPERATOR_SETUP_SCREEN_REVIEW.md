# Tour Operator Setup Screen Review

Scope: Code/UX review of the Tour Operator onboarding wizard (local code), plus a quick production check.

## Production check (limited)
- URL: `/operator/setup` on production loads the login screen when unauthenticated.
- Because the route is auth-gated, the actual setup wizard UI cannot be visually verified from production without an authenticated session.

## Key findings (high impact)

### 1) Onboarding data shape mismatch (data not saving / not rehydrating)
**Impact:** Users can fill the wizard, but critical fields either don’t persist to `tour_operator_profiles` or don’t load back into the wizard correctly.

**Root cause:** The UI step components were writing a different data shape than `tourOperatorService.saveOnboardingData()` expected.

Examples:
- Personal info step wrote `{ operatorName, phone }` while the service expected `{ firstName, lastName, phoneNumber }`.
- Business info step wrote `businessDescription` while the service saved `description`.
- Services step wrote `{ selected, custom }` while the service expected `{ categories, customServices }`.

**Fix implemented:** Normalized the service layer to match the current wizard’s shape and added safe normalization:
- Name is split into `first_name`/`last_name` for DB persistence.
- Services are persisted as a single `categories` array combining selected IDs + custom entries.
- `getOnboardingData()` now maps DB data back into the wizard’s `{ selected, custom }` shape.

Where: [packages/web/src/features/tour-operator/services/tourOperatorService.ts](packages/web/src/features/tour-operator/services/tourOperatorService.ts)

### 2) Policies upload mode doesn’t store document URLs
**Impact:** In upload mode, the UI tracks `uploads[id] = true`, but doesn’t store a URL to the uploaded document. That means:
- The partner can’t see what they uploaded later.
- Admin/compliance can’t review the document unless you have another tracking system.

Current behavior:
- `PoliciesStep.handleUpload()` uploads the asset but stores only a boolean.

Suggested improvement:
- Store URLs (e.g., `uploads: Record<string, string>` or `uploadUrls` separately) and persist them in `tour_operator_profiles.policies` (JSONB) or a dedicated column.

Where: [packages/web/src/pages/tour-operator/setup/components/PoliciesStep.tsx](packages/web/src/pages/tour-operator/setup/components/PoliciesStep.tsx)

### 3) No required-field validation / users can “Finish Setup” with empty data
**Impact:** Setup can be marked complete without required fields, which creates downstream issues (incomplete profiles, verification stuck, poor trust signals).

Suggested improvement (minimal UX change):
- Add step-level validation and disable “Next” until required fields are present.
- At minimum:
  - Personal: operator name, email, phone
  - Business: registered name
  - Coverage: primary city + radius
  - Policies: must accept platform terms, and require policy content or required uploads

Where: [packages/web/src/pages/tour-operator/setup/TourOperatorSetupPage.tsx](packages/web/src/pages/tour-operator/setup/TourOperatorSetupPage.tsx)

## Medium impact findings

### 4) Google Maps API key dependency may break the coverage step
**Impact:** `CoverageAreaStep` renders `APIProvider` even when `VITE_GOOGLE_MAPS_API_KEY` is empty. Depending on the library behavior, this can cause runtime errors or degraded UX.

Suggested improvement:
- If key is missing, render a fallback input (plain text) and a warning, or disable autocomplete.

Where: [packages/web/src/pages/tour-operator/setup/components/CoverageAreaStep.tsx](packages/web/src/pages/tour-operator/setup/components/CoverageAreaStep.tsx)

### 5) “Select Files” button in policy upload section is non-functional
**Impact:** The big call-to-action button in upload mode doesn’t open a file picker; only the per-document upload controls do.

Suggested improvement:
- Either wire it to a hidden multi-file input or remove it to avoid dead UI.

Where: [packages/web/src/pages/tour-operator/setup/components/PoliciesStep.tsx](packages/web/src/pages/tour-operator/setup/components/PoliciesStep.tsx)

### 6) File upload hardening
Suggested improvements:
- Validate file types (`accept` + runtime checks) and max sizes before upload.
- Consider naming scheme (avoid `Math.random()` collisions) and store metadata (original filename, mime type).

Where: [packages/web/src/features/tour-operator/services/tourOperatorService.ts](packages/web/src/features/tour-operator/services/tourOperatorService.ts)

## Low impact / polish

### 7) Back button behavior
- On step 0, “Back” navigates to `/operator/dashboard`. Depending on onboarding flow, it may be better to confirm leaving or route back to `/dashboard` and let `DashboardRedirect` decide.

Where: [packages/web/src/pages/tour-operator/setup/TourOperatorSetupPage.tsx](packages/web/src/pages/tour-operator/setup/TourOperatorSetupPage.tsx)

### 8) Completion screen links should respect gating
- Completion screen links to `/operator/tours/new`. This is correct once setup is completed, but it relies on setup completion persisting successfully.
- With the data-shape fix, this should be reliable; still, it’s worth keeping the create-tour guard in place.

Where: [packages/web/src/pages/tour-operator/setup/components/CompletionStep.tsx](packages/web/src/pages/tour-operator/setup/components/CompletionStep.tsx)

## Quick verification checklist (manual)
1. Start `/operator/setup` and fill steps.
2. Click `Save & Exit`, reload the page, confirm fields are rehydrated.
3. Finish setup; confirm `tour_operator_profiles.setup_completed = true`.
4. Confirm `/dashboard` redirects to operator dashboard, and `/operator/tours/new` is enabled.
5. In Services step, confirm selected categories + custom specialties persist across reload.

---

If you want, I can also:
- Implement required-field validation and `nextDisabled` per step.
- Upgrade policy uploads to persist and display uploaded document URLs.
