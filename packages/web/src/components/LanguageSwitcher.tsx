import { useEffect } from 'react'

import { type Locale, LOCALES } from '@/i18n/dictionaries'
import { cn } from '@/lib/utils'
import { useLocaleStore } from '@/store/localeStore'

// English-first launch: only English is exposed until the rest of the app is translated. The i18n
// plumbing (localeStore, dictionaries, RTL flip) stays intact — re-enable a locale by adding its
// code here once its strings are ready.
const ENABLED_LOCALES: Locale[] = ['en']

/** Native language picker (English / العربية). Sets the locale + persists; RTL flips via useLocaleDirection. */
export function LanguageSwitcher({ className }: { className?: string }) {
  const locale = useLocaleStore((s) => s.locale)
  const setLocale = useLocaleStore((s) => s.setLocale)

  // Bring anyone who had previously switched to a now-hidden locale back to English.
  useEffect(() => {
    if (!ENABLED_LOCALES.includes(locale)) setLocale('en')
  }, [locale, setLocale])

  const options = LOCALES.filter((l) => ENABLED_LOCALES.includes(l.code))
  // With a single enabled language the switcher is just noise — hide it entirely.
  if (options.length <= 1) return null

  return (
    <select
      aria-label="Language"
      value={locale}
      onChange={(e) => setLocale(e.target.value as Locale)}
      className={cn(
        'h-9 rounded-full border border-border bg-background px-3 text-sm font-semibold text-foreground',
        className,
      )}
    >
      {options.map((l) => (
        <option key={l.code} value={l.code} title={l.label}>
          {l.short}
        </option>
      ))}
    </select>
  )
}
