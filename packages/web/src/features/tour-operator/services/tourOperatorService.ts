import { supabase } from '@/lib/supabase'

import type {
  OperatorFleetAsset,
  OperatorGalleryItem,
  OperatorGuideProfile,
  OperatorProfileDocumentLinks,
  OperatorPublicPolicies,
} from '@/features/tour-operator/types/operatorProfile'

export interface OperatorPublicProfileEditorData {
  businessName: string
  description: string
  primaryCity: string
  coverageRange: string
  yearsExperience: string
  teamSize: string
  registrationNumber: string
  phoneNumber: string
  email: string
  fleetAssets: OperatorFleetAsset[]
  guideProfiles: OperatorGuideProfile[]
  galleryMedia: OperatorGalleryItem[]
  publicPolicies: OperatorPublicPolicies
  verificationUrls: OperatorProfileDocumentLinks
}

const EMPTY_PUBLIC_POLICIES: OperatorPublicPolicies = {
  cancellation: '',
  deposit: '',
  pickup: '',
  child: '',
  refund: '',
  weather: '',
  emergency: '',
  supportHours: '',
}

const EMPTY_DOCUMENT_LINKS: OperatorProfileDocumentLinks = {
  businessRegistration: '',
  insurance: '',
  vehicleDocs: '',
  guideLicense: '',
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map((item) => String(item || '').trim()).filter(Boolean)
}

function normalizeFleetAssets(value: unknown): OperatorFleetAsset[] {
  if (!Array.isArray(value)) return []
  return value
    .map((row: any, index) => ({
      id: String(row?.id || `fleet-${index + 1}`),
      type: String(row?.type || '').trim(),
      name: String(row?.name || '').trim(),
      quantity: Math.max(1, Number(row?.quantity || 1)),
      capacity: row?.capacity == null || row?.capacity === '' ? null : Math.max(1, Number(row.capacity)),
      details: String(row?.details || '').trim(),
    }))
    .filter((row) => row.type || row.name || row.details)
}

function normalizeGuideProfiles(value: unknown): OperatorGuideProfile[] {
  if (!Array.isArray(value)) return []
  return value
    .map((row: any, index) => ({
      id: String(row?.id || `guide-${index + 1}`),
      name: String(row?.name || '').trim(),
      languages: normalizeStringArray(row?.languages),
      specialties: normalizeStringArray(row?.specialties),
      certifications: normalizeStringArray(row?.certifications),
      yearsExperience:
        row?.yearsExperience == null || row?.yearsExperience === ''
          ? null
          : Math.max(0, Number(row.yearsExperience)),
      bio: String(row?.bio || '').trim(),
    }))
    .filter((row) => row.name || row.languages.length || row.specialties.length || row.certifications.length || row.bio)
}

function normalizeGalleryMedia(value: unknown): OperatorGalleryItem[] {
  if (!Array.isArray(value)) return []
  return value
    .map((row: any, index) => ({
      id: String(row?.id || `gallery-${index + 1}`),
      url: String(row?.url || '').trim(),
      title: String(row?.title || '').trim(),
      category: ['operator', 'vehicle', 'traveler', 'accommodation', 'food'].includes(String(row?.category || ''))
        ? row.category
        : 'operator',
    }))
    .filter((row) => row.url)
}

function normalizePublicPolicies(value: unknown): OperatorPublicPolicies {
  const source = value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
  return {
    cancellation: String(source.cancellation || ''),
    deposit: String(source.deposit || ''),
    pickup: String(source.pickup || ''),
    child: String(source.child || ''),
    refund: String(source.refund || ''),
    weather: String(source.weather || ''),
    emergency: String(source.emergency || ''),
    supportHours: String(source.supportHours || ''),
  }
}

function normalizeDocumentLinks(value: unknown): OperatorProfileDocumentLinks {
  const source = value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
  return {
    businessRegistration: String(source.businessRegistration || ''),
    insurance: String(source.insurance || ''),
    vehicleDocs: String(source.vehicleDocs || ''),
    guideLicense: String(source.guideLicense || ''),
  }
}

export interface TourOperatorOnboardingData {
  setupCurrentStep?: number
  personalInfo?: {
    operatorName: string
    email: string
    phone: string
    contactPerson: string
  }
  profilePicture?: string
  businessInfo?: {
    companyLogo: string | null
    businessName: string
    yearsInBusiness: string
    teamSize: string
    businessDescription: string
    registrationNumber?: string
  }
  services?: {
    selected: string[]
    custom: string[]
  }
  coverage?: {
    primaryLocation: string
    radii: string[]
  }
  policies?: {
    accepted: boolean
    mode: 'templates' | 'upload'
    custom: Record<string, string>
    uploads: Record<string, boolean>
  }
  verification?: {
    idCardUrl: string
    idBackUrl: string
    kycSessionToken?: string
    kycStatus?: string
    cnicNumber?: string | null
    expiryDate?: string | null
    businessDocs: Record<string, string>
  }
}

const KNOWN_SERVICE_CATEGORY_IDS = new Set([
  'day-trip',
  'weekend',
  'hiking',
  'sightseeing',
  'festivals',
  'leisure',
])

function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const cleaned = (fullName || '').trim().replace(/\s+/g, ' ')
  if (!cleaned) return { firstName: '', lastName: '' }
  const [firstName, ...rest] = cleaned.split(' ')
  return { firstName, lastName: rest.join(' ') }
}

function normalizeCategories(services?: TourOperatorOnboardingData['services']): string[] {
  const selected = services?.selected ?? []
  const custom = services?.custom ?? []
  const combined = [...selected, ...custom].map((s) => s.trim()).filter(Boolean)
  return Array.from(new Set(combined))
}

export const tourOperatorService = {
  async getPublicProfileEditorData(userId: string): Promise<OperatorPublicProfileEditorData> {
    if (!userId) throw new Error('User ID required')

    const { data, error } = await supabase
      .from('tour_operator_profiles')
      .select('company_name, description, primary_city, coverage_range, years_experience, team_size, registration_number, phone_number, email, fleet_assets, guide_profiles, gallery_media, public_policies, verification_urls')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) throw error

    const profile = (data ?? {}) as any
    return {
      businessName: profile.company_name || '',
      description: profile.description || '',
      primaryCity: profile.primary_city || '',
      coverageRange: profile.coverage_range || '',
      yearsExperience: profile.years_experience || '',
      teamSize: profile.team_size || '',
      registrationNumber: profile.registration_number || '',
      phoneNumber: profile.phone_number || '',
      email: profile.email || '',
      fleetAssets: normalizeFleetAssets(profile.fleet_assets),
      guideProfiles: normalizeGuideProfiles(profile.guide_profiles),
      galleryMedia: normalizeGalleryMedia(profile.gallery_media),
      publicPolicies: normalizePublicPolicies(profile.public_policies),
      verificationUrls: normalizeDocumentLinks(profile.verification_urls),
    }
  },

  async updatePublicProfileEditorData(userId: string, data: OperatorPublicProfileEditorData) {
    if (!userId) throw new Error('User ID required')

    const payload = {
      user_id: userId,
      company_name: data.businessName.trim() || null,
      business_name: data.businessName.trim() || null,
      description: data.description.trim() || null,
      primary_city: data.primaryCity.trim() || null,
      coverage_range: data.coverageRange.trim() || null,
      years_experience: data.yearsExperience.trim() || null,
      team_size: data.teamSize.trim() || null,
      registration_number: data.registrationNumber.trim() || null,
      phone_number: data.phoneNumber.trim() || null,
      email: data.email.trim() || null,
      fleet_assets: data.fleetAssets,
      guide_profiles: data.guideProfiles,
      gallery_media: data.galleryMedia,
      public_policies: data.publicPolicies,
      verification_urls: data.verificationUrls,
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase.from('tour_operator_profiles').upsert(payload)
    if (error) throw error
    return { success: true }
  },

  async saveOnboardingData(
    userId: string,
    data: Partial<TourOperatorOnboardingData>,
    setupCompleted: boolean = false,
    currentStep?: number,
  ) {
    if (!userId) throw new Error('User ID required')

    const { firstName, lastName } = splitFullName(data.personalInfo?.operatorName || '')
    const categories = normalizeCategories(data.services)

    const profilePayload = {
      user_id: userId,
      first_name: firstName,
      last_name: lastName,
      email: data.personalInfo?.email,
      phone_number: data.personalInfo?.phone,
      contact_person: data.personalInfo?.contactPerson,
      profile_picture_url: data.profilePicture,
      company_logo_url: data.businessInfo?.companyLogo,
      company_name: data.businessInfo?.businessName,
      years_experience: data.businessInfo?.yearsInBusiness,
      team_size: data.businessInfo?.teamSize,
      description: data.businessInfo?.businessDescription,
      registration_number: data.businessInfo?.registrationNumber,
      categories,
      primary_city: data.coverage?.primaryLocation,
      coverage_range: (data.coverage?.radii ?? []).join(', ') || null,
      policies: data.policies,
      verification_documents: {
        idCardUrl: data.verification?.idCardUrl,
        idBackUrl: data.verification?.idBackUrl,
        kycSessionToken: data.verification?.kycSessionToken,
        kycStatus: data.verification?.kycStatus,
        cnicNumber: data.verification?.cnicNumber,
        expiryDate: data.verification?.expiryDate,
      },
      verification_urls: data.verification?.businessDocs,
      setup_completed: setupCompleted,
      // Persist step index so wizard can resume; clear when finished
      setup_current_step: setupCompleted ? 0 : (currentStep ?? undefined),
      updated_at: new Date().toISOString(),
    }

    try {
      console.log('📤 Saving tour operator profile:', profilePayload)
      const { error } = await supabase.from('tour_operator_profiles').upsert(profilePayload)

      if (error) {
        // If the error is about setup_current_step column not existing yet (migration pending),
        // retry without it so the rest of the data still saves correctly.
        if (
          error.message?.includes('setup_current_step') ||
          error.details?.includes('setup_current_step')
        ) {
          console.warn(
            '⚠️  setup_current_step column not found — retrying without it. Run the pending migration in Supabase dashboard.',
          )
          const { setup_current_step: _omitted, ...payloadWithoutStep } = profilePayload
          const { error: retryError } = await supabase
            .from('tour_operator_profiles')
            .upsert(payloadWithoutStep)
          if (retryError) throw retryError
        } else {
          throw error
        }
      }

      return { success: true }
    } catch (error) {
      console.error('❌ Error saving tour operator profile:', error)
      throw error
    }
  },

  async getOnboardingData(userId: string) {
    if (!userId) throw new Error('User ID required')

    try {
      const { data, error } = await supabase
        .from('tour_operator_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') throw error

      if (!data) return null

      // Map DB columns back to frontend structure
      const profile = data as any

      const allCategories: string[] = profile.categories || []
      const selected = allCategories.filter((id) => KNOWN_SERVICE_CATEGORY_IDS.has(id))
      const custom = allCategories.filter((id) => !KNOWN_SERVICE_CATEGORY_IDS.has(id))

      const operatorName = [profile.first_name, profile.last_name]
        .filter(Boolean)
        .join(' ')
        .trim()
      const onboardingData: TourOperatorOnboardingData = {
        setupCurrentStep: typeof profile.setup_current_step === 'number' ? profile.setup_current_step : 0,
        personalInfo: {
          operatorName,
          email: profile.email || '',
          phone: profile.phone_number || '',
          contactPerson: profile.contact_person || '',
        },
        profilePicture: profile.profile_picture_url,
        businessInfo: {
          companyLogo: profile.company_logo_url || '',
          businessName: profile.company_name || '',
          yearsInBusiness: profile.years_experience || '',
          teamSize: profile.team_size || '',
          businessDescription: profile.description || '',
        },
        services: {
          selected,
          custom,
        },
        coverage: {
          primaryLocation: profile.primary_city || '',
          radii: profile.coverage_range
            ? profile.coverage_range.split(', ').filter(Boolean)
            : [],
        },
        policies: profile.policies,
        verification: profile.verification_documents
          ? {
              idCardUrl: profile.verification_documents.idCardUrl || '',
              idBackUrl: profile.verification_documents.idBackUrl || '',
              kycSessionToken: profile.verification_documents.kycSessionToken || '',
              kycStatus: profile.verification_documents.kycStatus || '',
              cnicNumber: profile.verification_documents.cnicNumber ?? null,
              expiryDate: profile.verification_documents.expiryDate ?? null,
              businessDocs: profile.verification_urls || {},
            }
          : undefined,
      }

      return onboardingData
    } catch (error) {
      console.error('❌ Error fetching tour operator profile:', error)
      throw error
    }
  },

  async uploadAsset(userId: string, file: File, folder: string) {
    if (!userId) throw new Error('User ID required')

    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random()}.${fileExt}`
    const filePath = `${userId}/${folder}/${fileName}`

    try {
      const { error: uploadError } = await supabase.storage
        .from('tour-operator-assets')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from('tour-operator-assets').getPublicUrl(filePath)

      return urlData.publicUrl
    } catch (error) {
      console.error('❌ Error uploading asset:', error)
      throw error
    }
  },
}
