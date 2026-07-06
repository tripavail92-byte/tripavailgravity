// Lightweight i18n for TripAvail (Gulf-first: English + Arabic). Dependency-free, matching
// the codebase's hook style (useMoney/useSeo). Strings migrate incrementally; this covers
// the core chrome (header + home hero) as the RTL/Arabic proof. Country names are still
// interpolated in English for now (a follow-up can translate the places catalogue).

export type Locale = 'en' | 'ar'

export interface LocaleMeta {
  code: Locale
  label: string
  dir: 'ltr' | 'rtl'
}

export const LOCALES: LocaleMeta[] = [
  { code: 'en', label: 'English', dir: 'ltr' },
  { code: 'ar', label: 'العربية', dir: 'rtl' },
]

export const dictionaries: Record<Locale, Record<string, string>> = {
  en: {
    'nav.login': 'Log In',
    'nav.signup': 'Sign Up',
    'nav.becomePartner': 'Become a Partner',
    'nav.exploreNow': 'Explore Now',
    'search.whereToNext': 'Where to next?',
    'common.viewAll': 'View All',
    'hero.explore': 'Explore',
    'hero.finding': 'Finding experiences near you…',
    'hero.curatedWorldwide': 'Curated worldwide',
    'hero.defaultTitle': 'Premium travel, curated for real moments.',
    'hero.defaultSub':
      'Boutique stays, romantic escapes & family getaways — transparent pricing, instant confirmation.',
    'hero.popularInEyebrow': 'Popular in {country}',
    'hero.discoverTitle': 'Discover {country}.',
    'hero.discoverSub':
      'Handpicked stays & experiences across {country} — transparent pricing, instant confirmation.',
    'hero.comingSoonEyebrow': 'Coming soon to {country}',
    'hero.expandingTitle': "We're expanding to {country}.",
    'hero.expandingSub':
      'Verified stays & tours are on their way to {country}. In the meantime, explore top experiences worldwide.',
    'hero.browseWorldwide': 'Browse worldwide',
    'hero.popularInTitle': 'Popular in {country}',
    'hero.trendingNearYou': 'Trending experiences near you',
  },
  ar: {
    'nav.login': 'تسجيل الدخول',
    'nav.signup': 'إنشاء حساب',
    'nav.becomePartner': 'كن شريكاً',
    'nav.exploreNow': 'استكشف الآن',
    'search.whereToNext': 'إلى أين وجهتك؟',
    'common.viewAll': 'عرض الكل',
    'hero.explore': 'استكشف',
    'hero.finding': 'نبحث عن تجارب قريبة منك…',
    'hero.curatedWorldwide': 'مختارة من حول العالم',
    'hero.defaultTitle': 'سفر مميّز، مصمّم للحظات حقيقية.',
    'hero.defaultSub': 'إقامات فندقية مختارة، رحلات رومانسية وعائلية — أسعار شفافة وتأكيد فوري.',
    'hero.popularInEyebrow': 'الأكثر رواجاً في {country}',
    'hero.discoverTitle': 'اكتشف {country}.',
    'hero.discoverSub': 'إقامات وتجارب مختارة بعناية في {country} — أسعار شفافة وتأكيد فوري.',
    'hero.comingSoonEyebrow': 'قريباً في {country}',
    'hero.expandingTitle': 'نتوسّع قريباً إلى {country}.',
    'hero.expandingSub':
      'إقامات وجولات موثّقة في طريقها إلى {country}. وبانتظار ذلك، استكشف أفضل التجارب حول العالم.',
    'hero.browseWorldwide': 'تصفّح حول العالم',
    'hero.popularInTitle': 'الأكثر رواجاً في {country}',
    'hero.trendingNearYou': 'تجارب رائجة بالقرب منك',
  },
}

export type TranslationKey = keyof (typeof dictionaries)['en']
