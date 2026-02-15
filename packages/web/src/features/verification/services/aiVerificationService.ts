import { supabase } from '../../../../../shared/src/core/client'

interface VerificationResult {
  success: boolean
  score: number
  match: boolean
  reason?: string
}

export const aiVerificationService = {
  // v3.0 - Backend Verification Active
  /**
   * Helper to log verification activity to Supabase
   */
  async logActivity(params: {
    userId: string
    role: 'tour_operator' | 'hotel_manager'
    eventType: 'document_validation' | 'biometric_match'
    status: 'success' | 'failure' | 'flagged'
    details: any
  }) {
    try {
      await (supabase.from('verification_activity_logs' as any) as any).insert({
        user_id: params.userId,
        role: params.role,
        event_type: params.eventType,
        status: params.status,
        details: params.details,
      })
    } catch (error) {
      console.error('Failed to log verification activity:', error)
    }
  },

  /**
   * Compare a selfie with an ID card photo
   * @param idCardUrl Public URL of the ID card image
   * @param selfieUrl Public URL of the selfie holding the ID
   */
  async compareFaceToId(
    idCardUrl: string,
    selfieUrl: string,
    userId: string,
    role: 'tour_operator' | 'hotel_manager',
  ): Promise<VerificationResult> {
    try {
      const { data, error } = await supabase.functions.invoke('verify-identity', {
        body: { idCardUrl, selfieUrl, userId, role, taskType: 'face_match' },
      })

      if (error) throw error

      return {
        success: true,
        score: data.score,
        match: data.match,
        reason: data.reason,
      }
    } catch (error: any) {
      console.error('AI Matching Error:', error)
      return {
        success: false,
        score: 0,
        match: false,
        reason: error.message || 'Verification server busy',
      }
    }
  },

  /**
   * Validate if an uploaded image is a government ID
   */
  async validateIdCard(
    imageUrl: string,
    userId: string,
    role: 'tour_operator' | 'hotel_manager',
  ): Promise<{ valid: boolean; reason?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('verify-identity', {
        body: { idCardUrl: imageUrl, userId, role, taskType: 'validate_id' },
      })

      if (error) throw error

      return {
        valid: data.valid,
        reason: data.reason,
      }
    } catch (error: any) {
      console.error('AI Validation Error:', error)
      return { valid: false, reason: `Error: ${error.message || 'Verification server busy'}` }
    }
  },
}
