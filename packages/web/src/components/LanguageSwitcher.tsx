import { LOCALES, type Locale } from '@/i18n/dictionaries'
import { useLocaleStore } from '@/store/localeStore'
import { cn } from '@/lib/utils'

/** Native language picker (English / العربية). Sets the locale + persists; RTL flips via useLocaleDirection. */
export function LanguageSwitcher({ className }: { className?: string }) {
  const locale = useLocaleStore((s) => s.locale)
  const setLocale = useLocaleStore((s) => s.setLocale)

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
      {LOCALES.map((l) => (
        <option key={l.code} value={l.code} title={l.label}>
          {l.short}
        </option>
      ))}
    </select>
  )
}
