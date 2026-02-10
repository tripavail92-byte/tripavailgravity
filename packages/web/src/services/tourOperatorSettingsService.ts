/**
 * Tour Operator Settings Service
 * 
 * Handles all business settings for tour operators
 */

import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

export interface TourOperatorSettings {
  operator_id: string
  
  // Business Information
  business_name: string
  business_registration_number: string
  tax_id: string
  business_phone: string
  business_email: string
  website_url: string
  
  // Tour Pricing
  base_tour_price: number
  currency: string
  pricing_strategy: 'fixed' | 'dynamic' | 'seasonal'
  
  // Payment Settings
  payment_method: string
  bank_account_number: string
  stripe_account_id: string
  payment_verified: boolean
  
  // Cancellation & Refund Policy
  cancellation_policy: 'strict' | 'moderate' | 'flexible'
  cancellation_days_before: number
  refund_percentage: number
  
  // Notification Settings
  booking_notifications: boolean
  tour_reminders: boolean
  messaging_notifications: boolean
  review_notifications: boolean
  payment_notifications: boolean
  
  // Tour Management
  pause_bookings: boolean
  max_group_size: number
  
  // Analytics Settings
  track_analytics: boolean
  track_bookings: boolean
  
  // Security
  two_factor_enabled: boolean
  
  updated_at: string
}

class TourOperatorSettingsServiceClass {
  async getSettings(operatorId: string): Promise<TourOperatorSettings> {
    try {
      const { data, error } = await (supabase
        .from('tour_operator_settings' as any) as any)
        .select('*')
        .eq('operator_id', operatorId)
        .maybeSingle()

      if (error) throw error

      if (!data) {
        return {
          operator_id: operatorId,
          business_name: '',
          business_registration_number: '',
          tax_id: '',
          business_phone: '',
          business_email: '',
          website_url: '',
          base_tour_price: 0,
          currency: 'USD',
          pricing_strategy: 'fixed',
          payment_method: '',
          bank_account_number: '',
          stripe_account_id: '',
          payment_verified: false,
          cancellation_policy: 'flexible',
          cancellation_days_before: 7,
          refund_percentage: 100,
          booking_notifications: true,
          tour_reminders: true,
          messaging_notifications: true,
          review_notifications: true,
          payment_notifications: true,
          pause_bookings: false,
          max_group_size: 50,
          track_analytics: true,
          track_bookings: true,
          two_factor_enabled: false,
          updated_at: new Date().toISOString()
        }
      }

      return (data as unknown) as TourOperatorSettings
    } catch (error) {
      console.error('Failed to fetch tour operator settings:', error)
      throw error
    }
  }

  async updateSettings(operatorId: string, updates: Partial<TourOperatorSettings>): Promise<TourOperatorSettings> {
    try {
      const { data, error } = await (supabase
        .from('tour_operator_settings' as any) as any)
        .upsert({
          operator_id: operatorId,
          ...updates,
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      toast.success('Tour operator settings updated')
      return (data as unknown) as TourOperatorSettings
    } catch (error) {
      console.error('Failed to update tour operator settings:', error)
      toast.error('Failed to update settings')
      throw error
    }
  }

  // Business information
  async updateBusinessInfo(operatorId: string, info: {
    business_name: string
    business_registration_number: string
    tax_id: string
    business_phone: string
    business_email: string
    website_url: string
  }): Promise<void> {
    await this.updateSettings(operatorId, info)
  }

  // Tour Pricing
  async updateTourPricing(operatorId: string, pricing: {
    base_tour_price: number
    pricing_strategy: 'fixed' | 'dynamic' | 'seasonal'
  }): Promise<void> {
    await this.updateSettings(operatorId, pricing)
  }

  // Payment
  async updatePaymentMethod(operatorId: string, payment: {
    payment_method: string
    bank_account_number: string
    stripe_account_id: string
  }): Promise<void> {
    await this.updateSettings(operatorId, payment)
  }

  // Cancellation & Refund Policy
  async updateCancellationPolicy(operatorId: string, policy: {
    cancellation_policy: 'strict' | 'moderate' | 'flexible'
    cancellation_days_before: number
    refund_percentage: number
  }): Promise<void> {
    await this.updateSettings(operatorId, policy)
  }

  // Notifications
  async toggleBookingNotifications(operatorId: string, enabled: boolean): Promise<void> {
    await this.updateSettings(operatorId, { booking_notifications: enabled })
  }

  async toggleTourReminders(operatorId: string, enabled: boolean): Promise<void> {
    await this.updateSettings(operatorId, { tour_reminders: enabled })
  }

  async toggleMessagingNotifications(operatorId: string, enabled: boolean): Promise<void> {
    await this.updateSettings(operatorId, { messaging_notifications: enabled })
  }

  async toggleReviewNotifications(operatorId: string, enabled: boolean): Promise<void> {
    await this.updateSettings(operatorId, { review_notifications: enabled })
  }

  async togglePaymentNotifications(operatorId: string, enabled: boolean): Promise<void> {
    await this.updateSettings(operatorId, { payment_notifications: enabled })
  }

  // Tour Management
  async togglePauseBookings(operatorId: string, paused: boolean): Promise<void> {
    await this.updateSettings(operatorId, { pause_bookings: paused })
  }

  async setMaxGroupSize(operatorId: string, size: number): Promise<void> {
    await this.updateSettings(operatorId, { max_group_size: size })
  }

  // Analytics
  async toggleAnalytics(operatorId: string, enabled: boolean): Promise<void> {
    await this.updateSettings(operatorId, { track_analytics: enabled })
  }

  async toggleBookingTracking(operatorId: string, enabled: boolean): Promise<void> {
    await this.updateSettings(operatorId, { track_bookings: enabled })
  }

  // Security
  async enableTwoFactor(operatorId: string): Promise<void> {
    await this.updateSettings(operatorId, { two_factor_enabled: true })
  }

  async disableTwoFactor(operatorId: string): Promise<void> {
    await this.updateSettings(operatorId, { two_factor_enabled: false })
  }
}

export const tourOperatorSettingsService = new TourOperatorSettingsServiceClass()
