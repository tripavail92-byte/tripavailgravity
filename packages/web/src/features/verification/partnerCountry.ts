// Country helpers for partner onboarding / KYC. Lets a foreign (non-PK) partner complete
// verification without Pakistan-specific documents. Phase 4a.

/** Dial code → ISO-3166 alpha-2, longest-prefix matched. Mirrors PersonalInfoStep's list. */
const DIAL_ISO: Array<[string, string]> = [
  ['+971', 'AE'], ['+966', 'SA'], ['+974', 'QA'], ['+973', 'BH'], ['+965', 'KW'],
  ['+968', 'OM'], ['+964', 'IQ'], ['+962', 'JO'], ['+961', 'LB'], ['+98', 'IR'],
  ['+92', 'PK'], ['+91', 'IN'], ['+880', 'BD'], ['+977', 'NP'], ['+94', 'LK'],
  ['+44', 'GB'], ['+353', 'IE'], ['+49', 'DE'], ['+33', 'FR'], ['+34', 'ES'],
  ['+39', 'IT'], ['+31', 'NL'], ['+32', 'BE'], ['+41', 'CH'], ['+43', 'AT'],
  ['+351', 'PT'], ['+30', 'GR'], ['+46', 'SE'], ['+47', 'NO'], ['+45', 'DK'],
  ['+358', 'FI'], ['+48', 'PL'], ['+420', 'CZ'], ['+36', 'HU'], ['+40', 'RO'],
  ['+359', 'BG'], ['+380', 'UA'], ['+7', 'RU'], ['+90', 'TR'], ['+20', 'EG'],
  ['+212', 'MA'], ['+216', 'TN'], ['+234', 'NG'], ['+254', 'KE'], ['+233', 'GH'],
  ['+27', 'ZA'], ['+1', 'US'], ['+52', 'MX'], ['+55', 'BR'], ['+54', 'AR'],
  ['+56', 'CL'], ['+57', 'CO'], ['+51', 'PE'], ['+81', 'JP'], ['+82', 'KR'],
  ['+86', 'CN'], ['+852', 'HK'], ['+65', 'SG'], ['+60', 'MY'], ['+62', 'ID'],
  ['+66', 'TH'], ['+63', 'PH'], ['+84', 'VN'], ['+61', 'AU'], ['+64', 'NZ'],
]

/** Best-effort ISO country from a stored phone number (e.g. "+971501234567" → "AE"). */
export function isoFromPhone(phone: string | null | undefined): string | null {
  const p = (phone || '').replace(/[^\d+]/g, '')
  if (!p.startsWith('+')) return null
  const byLen = [...DIAL_ISO].sort((a, b) => b[0].length - a[0].length)
  for (const [dial, iso] of byLen) {
    if (p.startsWith(dial)) return iso
  }
  return null
}

export interface RequiredDoc {
  id: string
  title: string
  desc: string
  /** Icon key resolved to a component in the UI. */
  icon: 'incorporation' | 'license' | 'tax'
  optional?: boolean
  /** Which step of the 2-step business-docs flow this doc belongs to. */
  step: 1 | 2
}

// Two steps only: (1) business registration — required, (2) tour licence — optional.
// The NTN / tax registration document is intentionally NOT collected.
const PK_DOCS: RequiredDoc[] = [
  { id: 'secp_certificate', title: 'SECP Certificate', desc: 'Company incorporation doc', icon: 'incorporation', step: 1 },
  { id: 'tourism_license', title: 'Tourism License', desc: 'DTS government permit — optional', icon: 'license', optional: true, step: 2 },
]

const GENERIC_DOCS: RequiredDoc[] = [
  { id: 'business_registration', title: 'Business Registration', desc: 'Company incorporation / trade license', icon: 'incorporation', step: 1 },
  { id: 'tour_license', title: 'Tourism License', desc: 'Travel/tourism permit — if required in your country', icon: 'license', optional: true, step: 2 },
]

/** Business-credential documents required for a partner's country. NULL/PK → Pakistan set. */
export function requiredBusinessDocs(countryCode: string | null | undefined): RequiredDoc[] {
  const cc = (countryCode || 'PK').toUpperCase()
  return cc === 'PK' ? PK_DOCS : GENERIC_DOCS
}
