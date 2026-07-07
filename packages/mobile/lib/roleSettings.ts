import { supabase } from '@/lib/supabase'

/**
 * Role business settings — ports of web tourOperatorSettingsService and
 * hotelManagerSettingsService. Both tables are plain upserts keyed by the
 * user id (operator_id / manager_id); missing rows fall back to defaults.
 * `pause_bookings` is the operator-side kill switch the web calendar and
 * bookings pages surface as a warning banner.
 */

export type CancellationTier = 'strict' | 'moderate' | 'flexible'
export type PricingStrategy = 'fixed' | 'dynamic' | 'seasonal'

export interface OperatorSettings {
  operator_id: string
  business_name: string
  business_registration_number: string
  tax_id: string
  business_phone: string
  business_email: string
  website_url: string
  base_tour_price: number
  currency: string
  pricing_strategy: PricingStrategy
  cancellation_policy: CancellationTier
  cancellation_days_before: number
  refund_percentage: number
  booking_notifications: boolean
  tour_reminders: boolean
  messaging_notifications: boolean
  review_notifications: boolean
  payment_notifications: boolean
  pause_bookings: boolean
  max_group_size: number
}

export interface ManagerSettings {
  manager_id: string
  business_name: string
  business_registration_number: string
  tax_id: string
  business_phone: string
  business_email: string
  website_url: string
  base_price_per_night: number
  currency: string
  pricing_strategy: PricingStrategy
  cancellation_policy: CancellationTier
  cancellation_days_before: number
  booking_notifications: boolean
  messaging_notifications: boolean
  review_notifications: boolean
  payment_notifications: boolean
}

function operatorDefaults(operatorId: string): OperatorSettings {
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
  }
}

function managerDefaults(managerId: string): ManagerSettings {
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
    cancellation_policy: 'flexible',
    cancellation_days_before: 7,
    booking_notifications: true,
    messaging_notifications: true,
    review_notifications: true,
    payment_notifications: true,
  }
}

export async function fetchOperatorSettings(operatorId: string): Promise<OperatorSettings> {
  const { data, error } = await supabase
    .from('tour_operator_settings')
    .select('*')
    .eq('operator_id', operatorId)
    .maybeSingle()
  if (error) throw error
  if (!data) return operatorDefaults(operatorId)
  return { ...operatorDefaults(operatorId), ...(data as Record<string, any>) }
}

export async function saveOperatorSettings(
  operatorId: string,
  updates: Partial<OperatorSettings>,
): Promise<void> {
  const { error } = await supabase.from('tour_operator_settings').upsert({
    operator_id: operatorId,
    ...updates,
    updated_at: new Date().toISOString(),
  })
  if (error) throw error
}

export async function fetchManagerSettings(managerId: string): Promise<ManagerSettings> {
  const { data, error } = await supabase
    .from('hotel_manager_settings')
    .select('*')
    .eq('manager_id', managerId)
    .maybeSingle()
  if (error) throw error
  if (!data) return managerDefaults(managerId)
  return { ...managerDefaults(managerId), ...(data as Record<string, any>) }
}

export async function saveManagerSettings(
  managerId: string,
  updates: Partial<ManagerSettings>,
): Promise<void> {
  const { error } = await supabase.from('hotel_manager_settings').upsert({
    manager_id: managerId,
    ...updates,
    updated_at: new Date().toISOString(),
  })
  if (error) throw error
}

/** Just the pause flag — used by the operator calendar banner. */
export async function fetchPauseBookings(operatorId: string): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('tour_operator_settings')
      .select('pause_bookings')
      .eq('operator_id', operatorId)
      .maybeSingle()
    return Boolean((data as Record<string, any> | null)?.pause_bookings)
  } catch {
    return false
  }
}
