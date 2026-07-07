/** "just now" / "5m ago" / "3h ago" / "2d ago" / "12 Jun" */
export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return ''
  const then = new Date(iso).getTime()
  const mins = Math.floor((Date.now() - then) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })
}
