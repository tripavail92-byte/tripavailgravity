# TripAvail Phase 6 Follow-Up Bug: Operator Dashboard Recent Bookings Mismatch

## Status

- Severity: medium
- Priority: post-Phase 6 follow-up
- Phase impact: not a Phase 6 sign-off blocker

## Summary

The production operator dashboard shows an empty Recent Bookings card even when the same operator has live bookings visible on the operator bookings page.

This creates an internal consistency issue between:

- `/operator/dashboard`
- `/operator/bookings`

The bookings console is correct and was used for Phase 6 production sign-off. The dashboard summary card is the mismatched surface.

## Production Evidence

Verified during Phase 6 production QA with the dedicated operator account:

- operator account: `phase6-operator-qa@tripavail.test`
- live bookings page showed:
  - confirmed promo deposit booking
  - cancelled or refunded promo booking
  - promo attribution, original total, refund amount, and cancellation reason
- live dashboard still showed:
  - `Recent Bookings`
  - `No bookings yet`

## Likely Root Cause

The operator dashboard currently imports the hotel-manager RecentBookings component instead of using the operator booking data path.

Relevant implementation references:

- `packages/web/src/features/tour-operator/dashboard/TourOperatorDashboard.tsx`
- `packages/web/src/features/hotel-manager/dashboard/components/RecentBookings.tsx`

The imported component currently hardcodes an empty bookings array:

- `const bookings: BookingCardProps[] = []`

That means the operator dashboard cannot reflect live operator booking state, even when `/operator/bookings` is populated correctly.

## Reproduction

1. Sign in as the Phase 6 operator QA account.
2. Open `/operator/bookings`.
3. Observe that bookings exist.
4. Open `/operator/dashboard`.
5. Observe that Recent Bookings still shows `No bookings yet`.

## Expected Behavior

The dashboard Recent Bookings card should reflect the same operator booking dataset as the operator bookings console, or a defined filtered subset of it.

At minimum it should surface:

- upcoming operator bookings
- booking confirmation state
- traveler label or safe contact state
- departure date
- amount summary or commercial badge state

## Actual Behavior

The dashboard always renders the empty state regardless of real operator bookings.

## Why This Is Not Blocking Phase 6

Phase 6 was specifically about promo, deposit, refund, and cancellation commercial consistency across the main operator and traveler booking surfaces.

Those production-critical surfaces are correct:

- operator bookings console
- traveler My Trips
- traveler booking detail

The dashboard card is a summary surface and does not invalidate the verified Phase 6 booking workflow behavior.

## Recommended Fix Scope

1. Replace the hotel-manager RecentBookings reuse in the operator dashboard with an operator-specific data source.
2. Reuse the operator booking record shape from the operator portal service where practical.
3. Define whether the dashboard should show:
   - all recent bookings, or
   - only upcoming bookings, or
   - the next N actionable bookings
4. Keep the dashboard card visually lighter than `/operator/bookings` while remaining consistent with real data.

## Acceptance Criteria

- the operator dashboard Recent Bookings card shows real operator bookings
- the card no longer hardcodes an empty dataset
- the card and `/operator/bookings` do not disagree for the same operator session
- empty state only appears when the operator truly has no matching bookings
- one regression test or service-level validation covers the non-empty path

## Suggested Owner

- Phase 7 commercial surfaces follow-up
