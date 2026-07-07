import { supabase } from '@/lib/supabase'

/**
 * Hotel-manager onboarding data layer — 1:1 analogue of lib/operatorSetup.ts.
 * Upserts a single `hotel_manager_profiles` row keyed by user_id (bank details).
 *
 * NOTE: unlike operators, the HARD gate that unlocks the manager dashboard /
 * package creation is "≥1 published hotel" (`hasPublishedHotel`), not
 * `setup_completed`. `setup_completed` is just an advisory flag.
 */

export interface ManagerSetupData {
  bankName: string
  accountHolder: string
  accountNumber: string
  routingNumber: string
  setupCurrentStep?: number
}

export async function getManagerSetup(userId: string): Promise<ManagerSetupData | null> {
  const { data, error } = await supabase.from('hotel_manager_profiles').select('*').eq('user_id', userId).maybeSingle()
  if (error) throw error
  if (!data) return null
  const p = data as Record<string, any>
  const bank = (p.bank_info as Record<string, any>) || {}
  return {
    bankName: bank.bankName || '',
    accountHolder: bank.accountHolder || '',
    accountNumber: bank.accountNumber || '',
    routingNumber: bank.routingNumber || '',
    setupCurrentStep: typeof p.setup_current_step === 'number' ? p.setup_current_step : 0,
  }
}

export async function saveManagerSetup(
  userId: string,
  data: ManagerSetupData,
  setupCompleted = false,
  currentStep?: number,
): Promise<void> {
  const payload: Record<string, any> = {
    user_id: userId,
    bank_info: {
      bankName: data.bankName.trim(),
      accountHolder: data.accountHolder.trim(),
      accountNumber: data.accountNumber.trim(),
      routingNumber: data.routingNumber.trim(),
    },
    setup_completed: setupCompleted,
    setup_current_step: setupCompleted ? 0 : currentStep ?? undefined,
    updated_at: new Date().toISOString(),
  }
  const { error } = await supabase.from('hotel_manager_profiles').upsert(payload)
  if (error) {
    if (String((error as any).message ?? '').includes('setup_current_step')) {
      const rest: Record<string, any> = { ...payload }
      delete rest.setup_current_step
      const { error: e2 } = await supabase.from('hotel_manager_profiles').upsert(rest)
      if (e2) throw e2
      return
    }
    throw error
  }
}

/** Advisory flag (true after the bank step) — use for a "finish setup" banner. */
export function hasCompletedHotelManagerSetup(
  profile: { setup_completed?: boolean | null; account_status?: string | null } | null,
): boolean {
  if (!profile) return false
  if (profile.setup_completed === true) return true
  return (profile.account_status ?? 'active') === 'active'
}

/** HARD gate: ≥1 published hotel unlocks the dashboard + package creation. */
export async function hasPublishedHotel(userId: string): Promise<boolean> {
  const { count } = await supabase
    .from('hotels')
    .select('*', { count: 'exact', head: true })
    .eq('owner_id', userId)
    .eq('is_published', true)
  return (count ?? 0) > 0
}
