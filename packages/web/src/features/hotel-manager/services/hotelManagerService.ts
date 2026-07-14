import { supabase } from '@/lib/supabase'

export interface HotelManagerOnboardingData {
  personalInfo?: {
    firstName: string
    lastName: string
    email: string
    phoneNumber: string
  }
  profilePicture?: string
  businessInfo?: {
    businessName: string
    registrationNumber: string
    businessAddress: string
  }
  propertyDetails?: {
    propertyName: string
    propertyAddress: string
    ownershipType: 'owner' | 'manager' | 'lease'
  }
  verification?: {
    idCardUrl: string
    idBackUrl: string
    kycSessionToken?: string
    kycStatus?: string
    cnicNumber?: string | null
    expiryDate?: string | null
    businessDocs: Record<string, string>
    ownershipDocs: {
      titleDeedUrl: string
      utilityBillUrl: string
      propertyLivePhotoUrl: string
    }
  }
  bankInfo?: {
    bankName: string
    accountHolder: string
    accountNumber: string
    routingNumber: string
  }
}

export const hotelManagerService = {
  async saveOnboardingData(
    userId: string,
    data: Partial<HotelManagerOnboardingData>,
    setupCompleted: boolean = false,
  ) {
    if (!userId) throw new Error('User ID required')

    const profilePayload = {
      user_id: userId,
      first_name: data.personalInfo?.firstName,
      last_name: data.personalInfo?.lastName,
      email: data.personalInfo?.email,
      phone_number: data.personalInfo?.phoneNumber,
      profile_picture_url: data.profilePicture,
      business_name: data.businessInfo?.businessName,
      registration_number: data.businessInfo?.registrationNumber,
      business_address: data.businessInfo?.businessAddress,
      property_name: data.propertyDetails?.propertyName,
      property_address: data.propertyDetails?.propertyAddress,
      ownership_type: data.propertyDetails?.ownershipType,
      bank_info: data.bankInfo,
      verification_documents: {
        idCardUrl: data.verification?.idCardUrl,
        idBackUrl: data.verification?.idBackUrl,
        kycSessionToken: data.verification?.kycSessionToken,
        kycStatus: data.verification?.kycStatus,
        cnicNumber: data.verification?.cnicNumber,
        expiryDate: data.verification?.expiryDate,
        ownershipDocs: data.verification?.ownershipDocs,
      },
      verification_urls: data.verification?.businessDocs,
      setup_completed: setupCompleted,
      updated_at: new Date().toISOString(),
    }

    try {
      console.log('📤 Saving hotel manager profile:', profilePayload)
      const { error } = await supabase.from('hotel_manager_profiles').upsert(profilePayload)

      if (error) throw error

      return { success: true }
    } catch (error) {
      console.error('❌ Error saving hotel manager profile:', error)
      throw error
    }
  },

  async getOnboardingData(userId: string) {
    if (!userId) throw new Error('User ID required')

    try {
      const { data, error } = await supabase
        .from('hotel_manager_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') throw error

      if (!data) return null

      const profile = data as any
      return {
        personalInfo: {
          firstName: profile.first_name || '',
          lastName: profile.last_name || '',
          email: profile.email || '',
          phoneNumber: profile.phone_number || '',
        },
        profilePicture: profile.profile_picture_url,
        businessInfo: {
          businessName: profile.business_name || '',
          registrationNumber: profile.registration_number || '',
          businessAddress: profile.business_address || '',
        },
        propertyDetails: {
          propertyName: profile.property_name || '',
          propertyAddress: profile.property_address || '',
          ownershipType: profile.ownership_type || 'owner',
        },
        bankInfo: profile.bank_info || {},
        verification: profile.verification_documents
          ? {
              idCardUrl: profile.verification_documents.idCardUrl || '',
              idBackUrl: profile.verification_documents.idBackUrl || '',
              kycSessionToken: profile.verification_documents.kycSessionToken || '',
              kycStatus: profile.verification_documents.kycStatus || '',
              cnicNumber: profile.verification_documents.cnicNumber ?? null,
              expiryDate: profile.verification_documents.expiryDate ?? null,
              businessDocs: profile.verification_urls || {},
              ownershipDocs: profile.verification_documents.ownershipDocs || {
                titleDeedUrl: '',
                utilityBillUrl: '',
                propertyLivePhotoUrl: '',
              },
            }
          : undefined,
      } as HotelManagerOnboardingData
    } catch (error) {
      console.error('❌ Error fetching hotel manager profile:', error)
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
        .from('hotel-manager-assets')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from('hotel-manager-assets').getPublicUrl(filePath)

      return urlData.publicUrl
    } catch (error) {
      console.error('❌ Error uploading asset:', error)
      throw error
    }
  },

  // ── Trust documents (title deed, utility bill, property photo, …) ──
  // CONFIDENTIAL: uploaded to the PRIVATE kyc bucket via the operator-doc-upload edge function
  // (never the public hotel-manager-assets bucket / a public URL). Reads are short-lived signed URLs.

  async uploadTrustDoc(
    file: File,
    documentType: string,
    subjectRole: 'tour_operator' | 'hotel_manager' = 'hotel_manager',
  ): Promise<void> {
    const form = new FormData()
    form.append('subject_role', subjectRole)
    form.append('document_type', documentType)
    form.append('image', file)

    const { data, error } = await supabase.functions.invoke('operator-doc-upload', { body: form })
    if (error) {
      let serverMsg = ''
      try {
        serverMsg = ((await (error as any).context?.json?.()) as any)?.error || ''
      } catch {
        /* ignore — fall back to the generic message */
      }
      throw new Error(serverMsg || error.message || 'Upload failed')
    }
    if (data && (data as any).uploaded !== true) {
      throw new Error((data as any)?.error || 'Upload failed')
    }
  },

  /** Short-lived signed URL for a stored trust document (owner or admin). null if none/failed. */
  async getTrustDocUrl(operatorId: string, documentType: string): Promise<string | null> {
    const { data, error } = await supabase.functions.invoke('kyc-signed-url', {
      body: { doc_type: documentType, operator_id: operatorId },
    })
    if (error) return null
    return (data?.signedUrl as string) || null
  },

  /** The manager's current trust documents (one per type). RLS restricts to the owner. */
  async listTrustDocs(
    operatorId: string,
  ): Promise<Array<{ document_type: string; status: string; version: number; uploaded_at: string }>> {
    const { data, error } = await supabase
      .from('kyc_documents')
      .select('document_type, status, version, uploaded_at')
      .eq('operator_id', operatorId)
      .eq('is_current', true)
    if (error) throw new Error(error.message)
    return (data || []) as Array<{ document_type: string; status: string; version: number; uploaded_at: string }>
  },
}
