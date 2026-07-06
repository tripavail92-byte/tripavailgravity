import { useCallback, useEffect } from 'react'

import { dictionaries, LOCALES } from '@/i18n/dictionaries'
import { useLocaleStore } from '@/store/localeStore'

/**
 * Returns a translator `t(key, vars?)`. Falls back to English, then to the raw key.
 * Interpolates `{name}` placeholders from `vars`.
 */
export function useT() {
  const locale = useLocaleStore((s) => s.locale)
  return useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const dict = dictionaries[locale] || dictionaries.en
      let str = dict[key] ?? dictionaries.en[key] ?? key
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v))
        }
      }
      return str
    },
    [locale],
  )
}

/** Keeps <html lang/dir> in sync with the chosen locale (RTL for Arabic). Mount once. */
export function useLocaleDirection() {
  const locale = useLocaleStore((s) => s.locale)
  useEffect(() => {
    const dir = LOCALES.find((l) => l.code === locale)?.dir ?? 'ltr'
    document.documentElement.setAttribute('lang', locale)
    document.documentElement.setAttribute('dir', dir)
  }, [locale])
}
