import { useEffect } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { type Locale, LOCALES } from '@/i18n/dictionaries'

const VALID = new Set(LOCALES.map((l) => l.code))

interface LocaleState {
  locale: Locale
  /** True once the user manually picks a language — stops geo auto-detect from overriding. */
  explicit: boolean
  setLocale: (code: Locale, explicit?: boolean) => void
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: 'en',
      explicit: false,
      setLocale: (code, explicit = true) =>
        set((s) => ({
          locale: VALID.has(code) ? code : 'en',
          explicit: explicit ? true : s.explicit,
        })),
    }),
    { name: 'tripavail-locale' },
  ),
)

// Timezones for Arabic-speaking markets → 'ar'. Cheap, offline; the switcher always wins.
const AR_TIMEZONES = new Set([
  'Asia/Dubai',
  'Asia/Riyadh',
  'Asia/Qatar',
  'Asia/Bahrain',
  'Asia/Kuwait',
  'Asia/Muscat',
  'Asia/Baghdad',
  'Asia/Amman',
  'Asia/Beirut',
  'Asia/Damascus',
  'Asia/Aden',
  'Africa/Cairo',
  'Africa/Casablanca',
  'Africa/Tunis',
  'Africa/Algiers',
  'Africa/Tripoli',
  'Africa/Khartoum',
])

export function detectDefaultLocale(): Locale {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''
    if (AR_TIMEZONES.has(tz)) return 'ar'
  } catch {
    // ignore
  }
  return 'en'
}

/** Auto-sets the language from the visitor's timezone on first visit; a manual pick wins. */
export function useLocaleAutoDetect() {
  const explicit = useLocaleStore((s) => s.explicit)
  const setLocale = useLocaleStore((s) => s.setLocale)
  useEffect(() => {
    if (!explicit) setLocale(detectDefaultLocale(), false)
  }, [explicit, setLocale])
}
