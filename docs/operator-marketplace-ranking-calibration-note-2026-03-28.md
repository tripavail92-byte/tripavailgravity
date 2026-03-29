# Operator Marketplace Ranking Calibration Note

Date: 2026-03-28
Scope: post-tuning snapshot for admin-only marketplace score ordering
Status: ready for product and ops sign-off

## Policy Snapshot

Current policy version: `operator_quality_v2`

Confidence adjustment now applied:

- low confidence: multiplier `0.70` when `total_reviews < 5` and `booking_starts < 3`
- medium confidence: multiplier `0.80` when only one of those signals is still sparse
- no penalty: multiplier `1.00` once both signals clear the sparse threshold

Why this tuning was applied:

- the live operator set is still heavily sparse
- one operator already has meaningful booking-intent data but no review volume yet
- reducing the medium-confidence multiplier from `0.85` to `0.80` keeps that operator clearly ahead, while avoiding over-promoting a review-light profile

## Live Distribution Snapshot

Captured from the live admin score RPC after applying the tuning migration.

- total operators scored: `8`
- low confidence: `7`
- medium confidence: `1`
- high confidence: `0`
- operators with fewer than 5 reviews: `8`
- operators with fewer than 3 booking starts: `7`
- operators sparse on both signals: `7`
- average adjusted marketplace score: `18.23`
- average raw marketplace score before confidence adjustment: `24.93`

Interpretation:

- the current dataset is still early and review-light
- only one live operator currently has enough booking-intent signal to avoid the strict low-confidence bucket
- no operator has enough combined review and booking signal yet to be treated as high-confidence

## Current Ranked Order

1. Northern Summit Expeditions
   - adjusted score: `49.78`
   - raw score: `62.22`
   - confidence: `medium`
   - multiplier: `0.80`
   - reviews: `0`
   - booking starts: `7`
   - bookings after profile views: `4`
   - note: clear top candidate, but still not review-established

2. mian tours
   - adjusted score: `22.17`
   - raw score: `31.67`
   - confidence: `low`
   - multiplier: `0.70`
   - reviews: `0`
   - booking starts: `0`

3. Test Operator
   - adjusted score: `14.83`
   - raw score: `21.19`
   - confidence: `low`
   - multiplier: `0.70`
   - reviews: `0`
   - booking starts: `0`

4. MMA ADVENTURES
   - adjusted score: `14.70`
   - raw score: `21.00`
   - confidence: `low`
   - multiplier: `0.70`
   - reviews: `0`
   - booking starts: `0`

5. MMA ADVENTURES PVT
   - adjusted score: `14.70`
   - raw score: `21.00`
   - confidence: `low`
   - multiplier: `0.70`
   - reviews: `0`
   - booking starts: `0`

6. extreme-sports@tripavail.demo
   - adjusted score: `11.43`
   - raw score: `16.33`
   - confidence: `low`
   - multiplier: `0.70`
   - reviews: `0`
   - booking starts: `0`

7. operator@tripavail.com
   - adjusted score: `10.97`
   - raw score: `15.67`
   - confidence: `low`
   - multiplier: `0.70`
   - reviews: `0`
   - booking starts: `0`

8. Phase 6 Operator QA Co.
   - adjusted score: `7.23`
   - raw score: `10.33`
   - confidence: `low`
   - multiplier: `0.70`
   - reviews: `0`
   - booking starts: `0`

## Sign-Off Recommendation

Recommended product and ops sign-off for this snapshot:

- accept the current ordering as an internal calibration-only view, not a public ranking
- accept Northern Summit Expeditions as the current top internal candidate because it is the only operator with meaningful live booking-intent data
- keep all other operators in low-confidence treatment until they accumulate either review volume or booking-start signal
- do not introduce a public quality score or public operator sort based on this list yet

## Next Trigger For Recalibration

Revisit the thresholds when either of these becomes true:

- at least `3` live operators have `booking_starts >= 3`
- at least `3` live operators have `total_reviews >= 5`
- the current top operator gains reviews and still materially outperforms the pack
