/**
 * Copy helpers for billing-cycle dates. A limit is only fair if the operator can see when
 * it resets, so every usage meter pairs "X of Y used" with one of these captions.
 */

export function daysUntil(isoDate: string | null | undefined): number | null {
  if (!isoDate) return null
  const end = new Date(isoDate)
  if (Number.isNaN(end.getTime())) return null

  const today = new Date()
  const startOfToday = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  const endOfCycle = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate())

  return Math.round((endOfCycle - startOfToday) / 86_400_000)
}

/** "resets in 6 days" · "resets tomorrow" · "resets today" · null when unknown. */
export function formatCycleReset(isoDate: string | null | undefined): string | null {
  const days = daysUntil(isoDate)
  if (days === null || days < 0) return null
  if (days === 0) return 'resets today'
  if (days === 1) return 'resets tomorrow'
  return `resets in ${days} days`
}

/** "1 August" — the day slots come back. */
export function formatCycleResetDate(isoDate: string | null | undefined): string | null {
  if (!isoDate) return null
  const end = new Date(isoDate)
  if (Number.isNaN(end.getTime())) return null
  return end.toLocaleDateString(undefined, { day: 'numeric', month: 'long' })
}
