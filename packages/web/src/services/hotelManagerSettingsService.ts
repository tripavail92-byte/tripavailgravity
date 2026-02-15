/**
 * Hotel Manager Settings Service
 *
 * Handles all business settings for hotel managers
 */

import toast from 'react-hot-toast'

import { supabase } from '@/lib/supabase'

export interface HotelManagerSettings {
  manager_id: string
  property_id?: string

  // Business Information
  business_name: string
  business_registration_number: string
  tax_id: string
  business_phone: string
  business_email: string
  website_url: string

  // Pricing Settings
  base_price_per_night: number
  currency: string
  pricing_strategy: 'fixed' | 'dynamic' | 'seasonal'

  // Payment Settings
  payment_method: string
  bank_account_number: string
  bank_routing_number: string
  stripe_account_id: string
  payment_verified: boolean

  // Cancellation Policy
  cancellation_policy: 'strict' | 'moderate' | 'flexible'
  cancellation_days_before: number

  // Notification Settings
  booking_notifications: boolean
  messaging_notifications: boolean
  review_notifications: boolean
  payment_notifications: boolean

  // Analytics Settings
  track_analytics: boolean

  // Security
  two_factor_enabled: boolean

  updated_at: string
}

class HotelManagerSettingsServiceClass {
  async getSettings(managerId: string): Promise<HotelManagerSettings> {
    try {
      const { data, error } = await supabase
        .from('hotel_manager_settings' as any)
        .select('*')
        .eq('manager_id', managerId)
        .maybeSingle()

      if (error) throw error

      if (!data) {
        return {
          manager_id: managerId,
          business_name: '',
          business_registration_number: '',
          tax_id: '',
          business_phone: '',
          business_email: '',
          website_url: '',
          base_price_per_night: 0,
          currency: 'USD',
          pricing_strategy: 'fixed',
          payment_method: '',
          bank_account_number: '',
          bank_routing_number: '',
          stripe_account_id: '',
          payment_verified: false,
          cancellation_policy: 'flexible',
          cancellation_days_before: 7,
          booking_notifications: true,
          messaging_notifications: true,
          review_notifications: true,
          payment_notifications: true,
          track_analytics: true,
          two_factor_enabled: false,
          updated_at: new Date().toISOString(),
        }
      }

      return data as unknown as HotelManagerSettings
    } catch (error) {
      console.error('Failed to fetch hotel settings:', error)
      throw error
    }
  }

  async updateSettings(
    managerId: string,
    updates: Partial<HotelManagerSettings>,
  ): Promise<HotelManagerSettings> {
    try {
      const { data, error } = await supabase
        .from('hotel_manager_settings' as any)
        .upsert({
          manager_id: managerId,
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error

      toast.success('Hotel settings updated')
      return data as unknown as HotelManagerSettings
    } catch (error) {
      console.error('Failed to update hotel settings:', error)
      toast.error('Failed to update settings')
      throw error
    }
  }

  // Business information
  async updateBusinessInfo(
    managerId: string,
    info: {
      business_name: string
      business_registration_number: string
      tax_id: string
      business_phone: string
      business_email: string
      website_url: string
    },
  ): Promise<void> {
    await this.updateSettings(managerId, info)
  }

  // Pricing
  async updatePricing(
    managerId: string,
    pricing: {
      base_price_per_night: number
      pricing_strategy: 'fixed' | 'dynamic' | 'seasonal'
    },
  ): Promise<void> {
    await this.updateSettings(managerId, pricing)
  }

  // Payment
  async updatePaymentMethod(
    managerId: string,
    payment: {
      payment_method: string
      bank_account_number: string
      stripe_account_id: string
    },
  ): Promise<void> {
    await this.updateSettings(managerId, payment)
  }

  // Cancellation Policy
  async updateCancellationPolicy(
    managerId: string,
    policy: {
      cancellation_policy: 'strict' | 'moderate' | 'flexible'
      cancellation_days_before: number
    },
  ): Promise<void> {
    await this.updateSettings(managerId, policy)
  }

  // Notifications
  async toggleBookingNotifications(managerId: string, enabled: boolean): Promise<void> {
    await this.updateSettings(managerId, { booking_notifications: enabled })
  }

  async toggleMessagingNotifications(managerId: string, enabled: boolean): Promise<void> {
    await this.updateSettings(managerId, { messaging_notifications: enabled })
  }

  async toggleReviewNotifications(managerId: string, enabled: boolean): Promise<void> {
    await this.updateSettings(managerId, { review_notifications: enabled })
  }

  async togglePaymentNotifications(managerId: string, enabled: boolean): Promise<void> {
    await this.updateSettings(managerId, { payment_notifications: enabled })
  }

  // Analytics
  async toggleAnalytics(managerId: string, enabled: boolean): Promise<void> {
    await this.updateSettings(managerId, { track_analytics: enabled })
  }

  // Security
  async enableTwoFactor(managerId: string): Promise<void> {
    await this.updateSettings(managerId, { two_factor_enabled: true })
  }

  async disableTwoFactor(managerId: string): Promise<void> {
    await this.updateSettings(managerId, { two_factor_enabled: false })
  }

  async suspendListings(managerId: string): Promise<void> {
    await supabase
      .from('hotel_listings' as any)
      .update({ suspended: true, suspended_at: new Date().toISOString() })
      .eq('manager_id', managerId)

    toast.success('All listings suspended')
  }

  async resumeListings(managerId: string): Promise<void> {
    await supabase
      .from('hotel_listings' as any)
      .update({ suspended: false, suspended_at: null })
      .eq('manager_id', managerId)

    toast.success('All listings resumed')
  }
}

export const hotelManagerSettingsService = new HotelManagerSettingsServiceClass()
