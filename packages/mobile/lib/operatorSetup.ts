import { supabase } from '@/lib/supabase'

/**
 * Tour-operator setup data layer — mirrors the web
 * `features/tour-operator/services/tourOperatorService.ts` (saveOnboardingData /
 * getOnboardingData), upserting a single `tour_operator_profiles` row keyed by
 * user_id. `setup_completed=true` is the gate that unlocks tour creation and
 * publishes the public storefront (read by app/operators/[slug].tsx).
 *
 * v1 collects the text essentials (no media upload yet — logo/profile picture
 * come with the expo-image-picker pass). KYC is a separate flow.
 */

export interface OperatorSetupData {
  // Personal
  operatorName: string
  contactPerson: string
  phone: string
  email: string
  // Business
  businessName: string
  description: string
  yearsInBusiness: string
  teamSize: string
  registrationNumber: string
  // Services
  categories: string[]
  // Coverage
  primaryCity: string
  radii: string[]
  // Resume index
  setupCurrentStep?: number
}

export const OPERATOR_CATEGORIES: Array<{ id: string; label: string }> = [
  { id: 'day-trip', label: 'Day trips' },
  { id: 'weekend', label: 'Weekend tours' },
  { id: 'hiking', label: 'Hiking & trekking' },
  { id: 'sightseeing', label: 'Sightseeing' },
  { id: 'festivals', label: 'Festivals & events' },
  { id: 'leisure', label: 'Leisure & relaxation' },
]

export const COVERAGE_RADII = ['Within city', 'Up to 100 km', 'Province-wide', 'Nationwide']

function splitName(full: string): { firstName: string; lastName: string } {
  const cleaned = (full || '').trim().replace(/\s+/g, ' ')
  if (!cleaned) return { firstName: '', lastName: '' }
  const [firstName, ...rest] = cleaned.split(' ')
  return { firstName, lastName: rest.join(' ') }
}

export async function getOperatorSetup(userId: string): Promise<OperatorSetupData | null> {
  const { data, error } = await supabase
    .from('tour_operator_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  const p = data as Record<string, any>
  return {
    operatorName: [p.first_name, p.last_name].filter(Boolean).join(' ').trim(),
    contactPerson: p.contact_person || '',
    phone: p.phone_number || '',
    email: p.email || '',
    businessName: p.company_name || '',
    description: p.description || '',
    yearsInBusiness: p.years_experience || '',
    teamSize: p.team_size || '',
    registrationNumber: p.registration_number || '',
    categories: Array.isArray(p.categories) ? p.categories : [],
    primaryCity: p.primary_city || '',
    radii: p.coverage_range ? String(p.coverage_range).split(', ').filter(Boolean) : [],
    setupCurrentStep: typeof p.setup_current_step === 'number' ? p.setup_current_step : 0,
  }
}

export async function saveOperatorSetup(
  userId: string,
  data: OperatorSetupData,
  setupCompleted = false,
  currentStep?: number,
): Promise<void> {
  const { firstName, lastName } = splitName(data.operatorName)
  const payload: Record<string, any> = {
    user_id: userId,
    first_name: firstName,
    last_name: lastName,
    contact_person: data.contactPerson.trim() || null,
    phone_number: data.phone.trim() || null,
    email: data.email.trim() || null,
    company_name: data.businessName.trim() || null,
    business_name: data.businessName.trim() || null,
    description: data.description.trim() || null,
    years_experience: data.yearsInBusiness.trim() || null,
    team_size: data.teamSize.trim() || null,
    registration_number: data.registrationNumber.trim() || null,
    categories: data.categories,
    primary_city: data.primaryCity.trim() || null,
    coverage_range: data.radii.join(', ') || null,
    setup_completed: setupCompleted,
    setup_current_step: setupCompleted ? 0 : currentStep ?? undefined,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase.from('tour_operator_profiles').upsert(payload)
  if (error) {
    // Same graceful fallback the web uses if the resume-step column is missing.
    const msg = String((error as any).message ?? '')
    if (msg.includes('setup_current_step')) {
      const rest: Record<string, any> = { ...payload }
      delete rest.setup_current_step
      const { error: retryError } = await supabase.from('tour_operator_profiles').upsert(rest)
      if (retryError) throw retryError
      return
    }
    throw error
  }
}

// ── Tour-creation gate (mirrors web hasCompletedTourOperatorSetup) ───────────

export interface OperatorGateProfile {
  setup_completed?: boolean | null
  account_status?: string | null
  company_name?: string | null
  contact_person?: string | null
  phone_number?: string | null
  primary_city?: string | null
  categories?: string[] | null
  verification_documents?: any
}

export async function fetchOperatorGateProfile(userId: string): Promise<OperatorGateProfile | null> {
  const { data, error } = await supabase
    .from('tour_operator_profiles')
    .select(
      'setup_completed, account_status, company_name, contact_person, phone_number, primary_city, categories, verification_documents',
    )
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return (data as OperatorGateProfile) ?? null
}

/** True when the operator may create/publish tours. `setup_completed` short-circuits. */
export function hasCompletedTourOperatorSetup(
  profile: OperatorGateProfile | null,
  verificationStatus?: string | null,
): boolean {
  if (!profile) return false
  if (profile.setup_completed === true) return true
  const approved = verificationStatus === 'approved'
  const active = (profile.account_status ?? 'active') === 'active'
  const footprint =
    Boolean(profile.company_name?.trim?.()) ||
    Boolean(profile.contact_person?.trim?.()) ||
    Boolean(profile.phone_number?.trim?.()) ||
    Boolean(profile.primary_city?.trim?.()) ||
    (Array.isArray(profile.categories) && profile.categories.length > 0) ||
    Boolean(profile.verification_documents)
  return approved && active && footprint
}
