import { supabase } from '../../../../../shared/src/core/client'

export interface OcrResult {
  fullName: string | null
  fatherName: string | null
  dateOfBirth: string | null
  idNumber: string | null
  expiryDate: string | null
  gender: string | null
  address: string | null
  docType: string | null
  cnicValid?: boolean
  expired?: boolean | null
}

export const aiVerificationService = {
  // Document checks + OCR only (biometric/face scanning is disabled)

  /**
   * Validate ID front — GPT checks blur, glare, crop, expiry
   */
  async validateIdCard(
    imageUrl: string,
    userId: string,
    role: 'tour_operator' | 'hotel_manager',
  ): Promise<{ valid: boolean; reason?: string; docType?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('verify-identity', {
        body: { idCardUrl: imageUrl, userId, role, taskType: 'validate_id' },
      })
      if (error) throw error
      return { valid: data.valid, reason: data.reason, docType: data.docType }
    } catch (error: any) {
      console.error('ID Front Validation Error:', error)
      return { valid: false, reason: error.message || 'Verification server busy' }
    }
  },

  /**
   * Validate ID back — GPT checks it is the rear side of a valid ID
   */
  async validateIdBack(
    imageUrl: string,
    userId: string,
    role: 'tour_operator' | 'hotel_manager',
  ): Promise<{ valid: boolean; reason?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('verify-identity', {
        body: { idCardUrl: imageUrl, userId, role, taskType: 'validate_id_back' },
      })
      if (error) throw error
      return { valid: data.valid, reason: data.reason }
    } catch (error: any) {
      console.error('ID Back Validation Error:', error)
      return { valid: false, reason: error.message || 'Verification server busy' }
    }
  },

  /**
   * OCR — extract structured fields from ID front (name, DOB, CNIC, expiry…)
   */
  async extractOcr(
    imageUrl: string,
    userId: string,
    role: 'tour_operator' | 'hotel_manager',
  ): Promise<OcrResult> {
    try {
      const { data, error } = await supabase.functions.invoke('verify-identity', {
        body: { idCardUrl: imageUrl, userId, role, taskType: 'extract_ocr' },
      })
      if (error) throw error
      return data as OcrResult
    } catch (error: any) {
      console.error('OCR Error:', error)
      return {
        fullName: null, fatherName: null, dateOfBirth: null, idNumber: null,
        expiryDate: null, gender: null, address: null, docType: null,
      }
    }
  },
}
