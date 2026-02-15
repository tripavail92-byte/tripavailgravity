/**
 * Account Settings Service
 *
 * Handles all account-related settings for travellers
 */

import toast from 'react-hot-toast'

import { supabase } from '@/lib/supabase'

export interface AccountSettings {
  user_id: string
  // Security Settings
  two_factor_enabled: boolean

  // Notification Preferences
  email_notifications_enabled: boolean
  booking_reminders: boolean
  marketing_emails: boolean
  push_notifications_enabled: boolean
  sms_notifications_enabled: boolean

  // Privacy Settings
  profile_visibility: 'public' | 'private' | 'friends_only'
  show_activity: boolean
  allow_messages_from_anyone: boolean
  share_location_with_hosts: boolean

  // App Preferences
  theme: 'light' | 'dark' | 'auto'
  language: string
  currency: string

  updated_at: string
}

export interface NotificationPreference {
  id: string
  name: string
  type: 'email' | 'push' | 'sms'
  enabled: boolean
  description: string
}

class AccountSettingsServiceClass {
  async getSettings(userId: string): Promise<AccountSettings> {
    try {
      const { data, error } = await supabase
        .from('account_settings' as any)
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (error) throw error

      // If no settings exist, return defaults
      if (!data) {
        return {
          user_id: userId,
          two_factor_enabled: false,
          email_notifications_enabled: true,
          booking_reminders: true,
          marketing_emails: false,
          push_notifications_enabled: true,
          sms_notifications_enabled: false,
          profile_visibility: 'public',
          show_activity: true,
          allow_messages_from_anyone: true,
          share_location_with_hosts: false,
          theme: 'auto',
          language: 'en',
          currency: 'USD',
          updated_at: new Date().toISOString(),
        }
      }

      return data as unknown as AccountSettings
    } catch (error) {
      console.error('Failed to fetch settings:', error)
      throw error
    }
  }

  async updateSettings(
    userId: string,
    updates: Partial<AccountSettings>,
  ): Promise<AccountSettings> {
    try {
      const { data, error } = await supabase
        .from('account_settings' as any)
        .upsert({
          user_id: userId,
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error

      toast.success('Settings updated successfully')
      return data as unknown as AccountSettings
    } catch (error) {
      console.error('Failed to update settings:', error)
      toast.error('Failed to update settings')
      throw error
    }
  }

  // Toggle individual settings
  async toggleEmailNotifications(userId: string, enabled: boolean): Promise<void> {
    await this.updateSettings(userId, {
      email_notifications_enabled: enabled,
    })
  }

  async toggleBookingReminders(userId: string, enabled: boolean): Promise<void> {
    await this.updateSettings(userId, {
      booking_reminders: enabled,
    })
  }

  async toggleMarketingEmails(userId: string, enabled: boolean): Promise<void> {
    await this.updateSettings(userId, {
      marketing_emails: enabled,
    })
  }

  async togglePushNotifications(userId: string, enabled: boolean): Promise<void> {
    await this.updateSettings(userId, {
      push_notifications_enabled: enabled,
    })
  }

  async toggleSmsNotifications(userId: string, enabled: boolean): Promise<void> {
    await this.updateSettings(userId, {
      sms_notifications_enabled: enabled,
    })
  }

  // Privacy settings
  async setProfileVisibility(
    userId: string,
    visibility: 'public' | 'private' | 'friends_only',
  ): Promise<void> {
    await this.updateSettings(userId, {
      profile_visibility: visibility,
    })
  }

  async toggleShowActivity(userId: string, enabled: boolean): Promise<void> {
    await this.updateSettings(userId, {
      show_activity: enabled,
    })
  }

  async toggleAllowMessagesFromAnyone(userId: string, enabled: boolean): Promise<void> {
    await this.updateSettings(userId, {
      allow_messages_from_anyone: enabled,
    })
  }

  async toggleShareLocationWithHosts(userId: string, enabled: boolean): Promise<void> {
    await this.updateSettings(userId, {
      share_location_with_hosts: enabled,
    })
  }

  // App preferences
  async setTheme(userId: string, theme: 'light' | 'dark' | 'auto'): Promise<void> {
    await this.updateSettings(userId, { theme })
    // Also apply to document
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }

  async setLanguage(userId: string, language: string): Promise<void> {
    await this.updateSettings(userId, { language })
    localStorage.setItem('language', language)
  }

  async setCurrency(userId: string, currency: string): Promise<void> {
    await this.updateSettings(userId, { currency })
    localStorage.setItem('currency', currency)
  }

  // Security
  async enableTwoFactor(userId: string): Promise<void> {
    await this.updateSettings(userId, { two_factor_enabled: true })
  }

  async disableTwoFactor(userId: string): Promise<void> {
    await this.updateSettings(userId, { two_factor_enabled: false })
  }

  async changePassword(_oldPassword: string, newPassword: string): Promise<void> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) throw error

      toast.success('Password changed successfully')
    } catch (error) {
      console.error('Failed to change password:', error)
      toast.error('Failed to change password')
      throw error
    }
  }
}

export const accountSettingsService = new AccountSettingsServiceClass()
