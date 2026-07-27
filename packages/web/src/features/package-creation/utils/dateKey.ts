/**
 * The `YYYY-MM-DD` key for a calendar day the partner picked in a date grid.
 *
 * Why this is not `date.toISOString().split('T')[0]`, which is what the availability calendar used:
 * the grid builds each cell with `new Date(year, month, day)`, i.e. LOCAL midnight, and
 * `toISOString()` converts to UTC before formatting. At any positive UTC offset local midnight is
 * still the previous day in UTC, so the round trip silently shifts the answer back one day —
 * clicking 14 August in Asia/Karachi (UTC+5, the platform's home market) yields '2026-08-13'.
 *
 * That was invisible while blackout dates were discarded at publish. Now that they are stored and
 * enforced by create_package_booking_atomic, an off-by-one is worse than the original bug: the
 * partner's chosen day stays bookable and the day before it is closed to guests instead.
 *
 * Reading the local components directly keeps the key equal to the number the partner clicked, in
 * every timezone.
 */
export function toDateKey(date: Date): string {
  const year = String(date.getFullYear()).padStart(4, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
