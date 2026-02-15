import { supabase } from '../../../../../shared/src/core/client'

export interface TourOperatorOnboardingData {
  personalInfo?: {
    firstName: string
    lastName: string
    email: string
    phoneNumber: string
    contactPerson: string
  }
  profilePicture?: string
  businessInfo?: {
    companyLogo: string
    businessName: string
    yearsInBusiness: string
    teamSize: string
    description: string
    registrationNumber?: string
  }
  services?: {
    categories: string[]
    customServices: string[]
  }
  coverage?: {
    primaryLocation: string
    radius: string
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
    selfieUrl: string
    matchingScore: number
    businessDocs: Record<string, string>
  }
}

export const tourOperatorService = {
  async saveOnboardingData(
    userId: string,
    data: Partial<TourOperatorOnboardingData>,
    setupCompleted: boolean = false,
  ) {
    if (!userId) throw new Error('User ID required')

    const profilePayload = {
      user_id: userId,
      first_name: data.personalInfo?.firstName,
      last_name: data.personalInfo?.lastName,
      email: data.personalInfo?.email,
      phone_number: data.personalInfo?.phoneNumber,
      contact_person: data.personalInfo?.contactPerson,
      profile_picture_url: data.profilePicture,
      company_logo_url: data.businessInfo?.companyLogo,
      company_name: data.businessInfo?.businessName,
      years_experience: data.businessInfo?.yearsInBusiness,
      team_size: data.businessInfo?.teamSize,
      description: data.businessInfo?.description,
      registration_number: data.businessInfo?.registrationNumber,
      categories: data.services?.categories,
      primary_city: data.coverage?.primaryLocation,
      coverage_range: data.coverage?.radius,
      policies: data.policies,
      verification_documents: {
        idCardUrl: data.verification?.idCardUrl,
        idBackUrl: data.verification?.idBackUrl,
        selfieUrl: data.verification?.selfieUrl,
        matchingScore: data.verification?.matchingScore,
      },
      verification_urls: data.verification?.businessDocs,
      setup_completed: setupCompleted,
      updated_at: new Date().toISOString(),
    }

    try {
      console.log('📤 Saving tour operator profile:', profilePayload)
      const { error } = await supabase.from('tour_operator_profiles').upsert(profilePayload)

      if (error) throw error

      // If setup is completed, update the user_role status from 'incomplete' to 'pending'
      if (setupCompleted) {
        await supabase
          .from('user_roles')
          .update({ verification_status: 'pending' })
          .eq('user_id', userId)
          .eq('role_type', 'tour_operator')
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
      const onboardingData: TourOperatorOnboardingData = {
        personalInfo: {
          firstName: profile.first_name || '',
          lastName: profile.last_name || '',
          email: profile.email || '',
          phoneNumber: profile.phone_number || '',
          contactPerson: profile.contact_person || '',
        },
        profilePicture: profile.profile_picture_url,
        businessInfo: {
          companyLogo: profile.company_logo_url || '',
          businessName: profile.company_name || '',
          yearsInBusiness: profile.years_experience || '',
          teamSize: profile.team_size || '',
          description: profile.description || '',
        },
        services: {
          categories: profile.categories || [],
          customServices: [],
        },
        coverage: {
          primaryLocation: profile.primary_city || '',
          radius: profile.coverage_range || '',
        },
        policies: profile.policies,
        verification: profile.verification_documents
          ? {
              idCardUrl: profile.verification_documents.idCardUrl || '',
              idBackUrl: profile.verification_documents.idBackUrl || '',
              selfieUrl: profile.verification_documents.selfieUrl || '',
              matchingScore: profile.verification_documents.matchingScore || 0,
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
