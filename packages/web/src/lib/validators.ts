/**
 * Shared input validators.
 *
 * Created because nothing in packages/web validated an email address anywhere. The hotel listing
 * wizard gated its Continue button on `!!contactEmail` alone, so a partner typed their own name
 * into "Contact Email *", passed every check, and published a property whose booking address was
 * "khayam ali shujhat". `<input type="email">` does not help on its own — the browser only enforces
 * it on native form submission, and this wizard never submits a form.
 */

/**
 * Pragmatic email check: one @, no whitespace, and a dot-something domain.
 *
 * Deliberately NOT RFC 5322. A fully compliant regex accepts addresses no mail provider will issue
 * and is unreadable to the next person; the only real test of an address is sending to it. This
 * catches the mistakes people actually make — a name, a missing @, a bare domain, a trailing
 * comma — without rejecting anything legitimate.
 */
export function isValidEmail(value?: string | null): boolean {
  if (!value) return false
  const trimmed = value.trim()
  if (trimmed.length > 254) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed)
}
