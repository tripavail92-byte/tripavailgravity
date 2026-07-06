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
    'hero.exploreCountry': 'Explore {country}',
    // Search page
    'search.searchDestinations': 'Search destinations...',
    'search.filters': 'Filters',
    'search.sortRecommended': 'Recommended',
    'search.sortNearest': 'Nearest to me',
    'search.sortPriceLow': 'Price: low to high',
    'search.sortPriceHigh': 'Price: high to low',
    'search.sortRating': 'Top rated',
    'search.sortNewest': 'Newest',
    'search.priceRange': 'Price range',
    'search.min': 'Min',
    'search.max': 'Max',
    'search.available': 'Available',
    'search.minRating': 'Minimum rating',
    'search.any': 'Any',
    'search.country': 'Country',
    'search.all': 'All',
    'search.tours': 'Tours',
    'search.stays': 'Stays',
    'search.resultsFor': 'Results for “{query}”',
    'search.experiencesIn': 'Experiences in {country}',
    'search.exploreEverything': 'Explore everything',
    'search.searching': 'Searching…',
    'search.results': '{count} results',
    'search.loading': 'Loading…',
    'search.loadMore': 'Load more',
    'search.noResults': 'No experiences match your search',
    'search.noResultsSub': 'Try a different destination, widen your price range, or clear a filter.',
    'search.error': 'Something went wrong loading results. Please try again.',
    // Listing detail (primary)
    'detail.reserve': 'Book Now',
    'detail.from': 'From',
    'detail.perPerson': 'Per traveler',
    'detail.pricing': 'Pricing',
    'detail.onRequest': 'On request',
    'detail.payNow': 'Pay now',
    'detail.balanceLater': 'Balance paid before departure',
    'detail.contactOperator': 'Contact the operator',
    'detail.confirmBooking': 'Confirm Booking',
    'detail.payAndConfirm': 'Pay {amount} & Confirm Booking',
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
    'hero.exploreCountry': 'استكشف {country}',
    // Search page
    'search.searchDestinations': 'ابحث عن وجهات...',
    'search.filters': 'التصفية',
    'search.sortRecommended': 'موصى به',
    'search.sortNearest': 'الأقرب إليّ',
    'search.sortPriceLow': 'السعر: من الأقل إلى الأعلى',
    'search.sortPriceHigh': 'السعر: من الأعلى إلى الأقل',
    'search.sortRating': 'الأعلى تقييماً',
    'search.sortNewest': 'الأحدث',
    'search.priceRange': 'نطاق السعر',
    'search.min': 'الأدنى',
    'search.max': 'الأعلى',
    'search.available': 'المتاح',
    'search.minRating': 'أدنى تقييم',
    'search.any': 'الكل',
    'search.country': 'الدولة',
    'search.all': 'الكل',
    'search.tours': 'جولات',
    'search.stays': 'إقامات',
    'search.resultsFor': 'نتائج البحث عن «{query}»',
    'search.experiencesIn': 'تجارب في {country}',
    'search.exploreEverything': 'استكشف كل شيء',
    'search.searching': 'جارٍ البحث…',
    'search.results': '{count} نتيجة',
    'search.loading': 'جارٍ التحميل…',
    'search.loadMore': 'عرض المزيد',
    'search.noResults': 'لا توجد تجارب تطابق بحثك',
    'search.noResultsSub': 'جرّب وجهة أخرى، أو وسّع نطاق السعر، أو أزل أحد عوامل التصفية.',
    'search.error': 'حدث خطأ أثناء تحميل النتائج. يُرجى المحاولة مرة أخرى.',
    // Listing detail (primary)
    'detail.reserve': 'احجز الآن',
    'detail.from': 'ابتداءً من',
    'detail.perPerson': 'لكل مسافر',
    'detail.pricing': 'التسعير',
    'detail.onRequest': 'عند الطلب',
    'detail.payNow': 'ادفع الآن',
    'detail.balanceLater': 'يُدفع الباقي قبل المغادرة',
    'detail.contactOperator': 'تواصل مع المشغّل',
    'detail.confirmBooking': 'تأكيد الحجز',
    'detail.payAndConfirm': 'ادفع {amount} وأكّد الحجز',
  },
}

export type TranslationKey = keyof (typeof dictionaries)['en']
