import { supabase } from '@/lib/supabase';

export type PaymentMethodType = 'card' | 'easypaisa' | 'jazzcash';

export interface UserPaymentMethod {
  id: string;
  user_id: string;
  method_type: PaymentMethodType;
  provider: 'stripe' | 'easypaisa' | 'jazzcash';
  label: string;
  last_four?: string;
  exp_month?: number;
  exp_year?: number;
  card_brand?: string;
  phone_number?: string;
  stripe_payment_method_id?: string;
  is_default: boolean;
  metadata?: any;
  created_at: string;
}

export const paymentMethodService = {
  /**
   * Get all saved payment methods for the current user
   */
  async getPaymentMethods(): Promise<UserPaymentMethod[]> {
    const { data, error } = await supabase
      .from('user_payment_methods')
      .select('*')
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as UserPaymentMethod[];
  },

  /**
   * Save a new payment method
   */
  async savePaymentMethod(method: Omit<UserPaymentMethod, 'id' | 'user_id' | 'created_at'>): Promise<UserPaymentMethod> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // If this is the first method, make it default
    const existing = await this.getPaymentMethods();
    const isDefault = existing.length === 0 ? true : method.is_default;

    const { data, error } = await supabase
      .from('user_payment_methods')
      .insert({
        ...method,
        user_id: user.id,
        is_default: isDefault
      })
      .select()
      .single();

    if (error) throw error;
    return data as UserPaymentMethod;
  },

  /**
   * Delete a payment method
   */
  async deletePaymentMethod(id: string): Promise<void> {
    const { error } = await supabase
      .from('user_payment_methods')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Set a payment method as default
   */
  async setDefault(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Use a transaction-like approach (or let the DB constraint handle it if we had a function)
    // For simplicity here, we do two calls. In production, a stored procedure is safer.
    
    // 1. Unset all defaults for this user
    await supabase
      .from('user_payment_methods')
      .update({ is_default: false })
      .eq('user_id', user.id);

    // 2. Set new default
    const { error } = await supabase
      .from('user_payment_methods')
      .update({ is_default: true })
      .eq('id', id);

    if (error) throw error;
  }
};
