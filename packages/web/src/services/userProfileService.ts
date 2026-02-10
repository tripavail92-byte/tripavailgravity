/**
 * User Profile Service
 * 
 * Handles all user profile operations including fetching, updating,
 * and managing verification for email/phone
 */

import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

export interface UserProfile {
  id: string
  email: string
  phone?: string
  first_name?: string
  last_name?: string
  avatar_url?: string
  bio?: string
  address?: string
  city?: string
  country?: string
  date_of_birth?: string
  email_verified?: boolean
  phone_verified?: boolean
  created_at?: string
  updated_at?: string
}

export interface UpdateProfileData {
  first_name?: string
  last_name?: string
  phone?: string
  avatar_url?: string
  bio?: string
  address?: string
  city?: string
  country?: string
  date_of_birth?: string
}

class UserProfileService {
  /**
   * Get current user's profile
   */
  async getProfile(): Promise<UserProfile | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('No authenticated user')
      }

      // NOTE: Avoid `.single()`/`.maybeSingle()` here.
      // PostgREST returns HTTP 406 when 0 rows match object-returning queries,
      // which shows up as noisy browser console errors even if handled.
      const { data: profiles, error } = await (supabase
        .from('profiles' as any) as any)
        .select('*')
        .eq('id', user.id)
        .limit(1)

      if (error) throw error

      const profile = Array.isArray(profiles) ? profiles[0] : profiles

      // Return merged user + profile data
      return {
        id: user.id,
        email: user.email || '',
        ...((profile || {}) as any)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      throw error
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(data: UpdateProfileData): Promise<UserProfile> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('No authenticated user')
      }

      // Update in profiles table
      const { data: updatedRows, error } = await (supabase
        .from('profiles' as any) as any)
        .upsert({
          id: user.id,
          ...data,
          email: user.email || '',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        })
        .select()

      if (error) throw error

      const updated = Array.isArray(updatedRows) ? updatedRows[0] : updatedRows

      toast.success('Profile updated successfully')
      
      return {
        id: user.id,
        email: user.email || '',
        ...(((updated ?? { ...data }) as unknown) as any)
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
      throw error
    }
  }

  /**
   * Send email verification link
   */
  async sendEmailVerification(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('No authenticated user')
      }

      // Resend verification email
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email || ''
      })

      if (error) throw error

      toast.success('Verification email sent. Check your inbox!')
    } catch (error) {
      console.error('Error sending verification email:', error)
      toast.error('Failed to send verification email')
      throw error
    }
  }

  /**
   * Send phone verification OTP
   */
  async sendPhoneVerification(phone: string): Promise<void> {
    try {
      // Verify phone with custom function or Twilio API
      const { error } = await supabase.functions.invoke('send-phone-otp', {
        body: { phone }
      })

      if (error) throw error

      toast.success('Verification code sent to your phone')
    } catch (error) {
      console.error('Error sending phone verification:', error)
      toast.error('Failed to send verification code')
      throw error
    }
  }

  /**
   * Verify phone OTP
   */
  async verifyPhoneOTP(phone: string, otp: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('No authenticated user')
      }

      // Verify OTP via custom function
      const { error } = await supabase.functions.invoke('verify-phone-otp', {
        body: { phone, otp }
      })

      if (error) throw error

      // Mark phone as verified in profile
      await (supabase
        .from('profiles' as any) as any)
        .update({ 
          phone_verified: true,
          phone: phone
        })
        .eq('id', user.id)

      toast.success('Phone number verified successfully!')
    } catch (error) {
      console.error('Error verifying phone OTP:', error)
      toast.error('Failed to verify phone number')
      throw error
    }
  }

  /**
   * Upload profile avatar
   */
  async uploadAvatar(file: File): Promise<string> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('No authenticated user')
      }

      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      // Store under <uid>/... so RLS policies can safely enforce ownership
      const filePath = `${user.id}/${fileName}`

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('user-avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      // Get public URL
      const { data } = supabase.storage
        .from('user-avatars')
        .getPublicUrl(filePath)

      // Update profile with new avatar
      await this.updateProfile({ avatar_url: data.publicUrl })

      return data.publicUrl
    } catch (error) {
      console.error('Error uploading avatar:', error)
      toast.error('Failed to upload avatar')
      throw error
    }
  }

  /**
   * Get profile completion percentage
   */
  calculateCompletion(profile: UserProfile): number {
    const fields = [
      profile.first_name,
      profile.email,
      profile.phone,
      profile.address,
      profile.city,
      profile.bio,
      profile.date_of_birth,
      profile.avatar_url,
    ]
    const weights = [15, 15, 15, 15, 10, 10, 10, 10]
    
    let total = 0
    fields.forEach((field, idx) => {
      if (field) total += weights[idx]
    })
    
    return total
  }
}

export const userProfileService = new UserProfileService()
