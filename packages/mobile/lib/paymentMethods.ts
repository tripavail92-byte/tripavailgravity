import { supabase } from '@/lib/supabase'

/**
 * Saved payment methods — port of web paymentMethodService
 * (user_payment_methods table). Mobile wallets (EasyPaisa/JazzCash) are just a
 * labelled phone number, so they work fully without Stripe; card entry waits
 * for the Stripe dev build.
 */

export type PaymentMethodType = 'card' | 'easypaisa' | 'jazzcash'

export interface UserPaymentMethod {
  id: string
  user_id: string
  method_type: PaymentMethodType
  provider: 'stripe' | 'easypaisa' | 'jazzcash'
  label: string
  last_four?: string | null
  exp_month?: number | null
  exp_year?: number | null
  card_brand?: string | null
  phone_number?: string | null
  is_default: boolean
  created_at: string
}

export async function fetchPaymentMethods(): Promise<UserPaymentMethod[]> {
  const { data, error } = await supabase
    .from('user_payment_methods')
    .select('*')
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as UserPaymentMethod[]
}

export async function addWalletMethod(params: {
  userId: string
  type: 'easypaisa' | 'jazzcash'
  phoneNumber: string
  makeDefault: boolean
}): Promise<void> {
  const existing = await fetchPaymentMethods().catch(() => [])
  const { error } = await supabase.from('user_payment_methods').insert({
    user_id: params.userId,
    method_type: params.type,
    provider: params.type,
    label: params.type === 'easypaisa' ? 'EasyPaisa' : 'JazzCash',
    phone_number: params.phoneNumber,
    is_default: existing.length === 0 ? true : params.makeDefault,
  })
  if (error) throw error
}

export async function deletePaymentMethod(id: string): Promise<void> {
  const { error } = await supabase.from('user_payment_methods').delete().eq('id', id)
  if (error) throw error
}

export async function setDefaultPaymentMethod(userId: string, id: string): Promise<void> {
  await supabase.from('user_payment_methods').update({ is_default: false }).eq('user_id', userId)
  const { error } = await supabase.from('user_payment_methods').update({ is_default: true }).eq('id', id)
  if (error) throw error
}
