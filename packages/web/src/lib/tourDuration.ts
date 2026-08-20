/**
 * One duration label for the whole app.
 *
 * The homepage rendered `${durationDays} days` (so a one-day trip read "1 days")
 * while /tours, category and collection pages hardcoded "Multi-day" for everything.
 */
export function formatTourDuration(days?: number | null): string {
  const n = Number(days)
  if (!Number.isFinite(n) || n <= 0) return 'Flexible'
  if (n === 1) return 'Day trip'
  return `${n} days`
}

/** Trip-length buckets used by the homepage rails and the budget/length filters. */
export function isShortEscape(days?: number | null): boolean {
  const n = Number(days)
  return Number.isFinite(n) && n > 0 && n <= 3
}

export function isExpedition(days?: number | null): boolean {
  const n = Number(days)
  return Number.isFinite(n) && n >= 7
}
