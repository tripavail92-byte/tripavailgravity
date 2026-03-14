export interface TourOperatorAccessProfile {
  setup_completed?: boolean | null
  account_status?: string | null
  company_name?: string | null
  contact_person?: string | null
  phone_number?: string | null
  primary_city?: string | null
  categories?: string[] | null
  verification_documents?: unknown | null
}

export function hasCompletedTourOperatorSetup(
  profile: TourOperatorAccessProfile | null | undefined,
  verificationStatus?: string | null,
): boolean {
  if (profile?.setup_completed === true) return true
  if (verificationStatus !== 'approved') return false

  const accountStatus = profile?.account_status ?? 'active'
  if (accountStatus !== 'active') return false

  const hasSetupFootprint = Boolean(
    String(profile?.company_name || '').trim() ||
      String(profile?.contact_person || '').trim() ||
      String(profile?.phone_number || '').trim() ||
      String(profile?.primary_city || '').trim() ||
      (profile?.categories?.length ?? 0) > 0 ||
      profile?.verification_documents,
  )

  return hasSetupFootprint
}