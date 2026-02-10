import { supabase } from '@/lib/supabase';

export interface TourBooking {
  id: string;
  tour_id: string;
  schedule_id: string;
  traveler_id: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  total_price: number;
  pax_count: number;
  booking_date: string;
  stripe_payment_intent_id?: string;
  payment_status?: 'unpaid' | 'processing' | 'paid' | 'failed' | 'refunded';
  payment_method?: string;
  paid_at?: string;
  payment_metadata?: any;
  metadata?: any;
}

export interface PackageBooking {
  id: string;
  package_id: string;
  traveler_id: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'refunded';
  total_price: number;
  guest_count: number;
  check_in_date?: string;
  check_out_date?: string;
  booking_date: string;
  stripe_payment_intent_id?: string;
  payment_status?: 'unpaid' | 'processing' | 'paid' | 'failed' | 'refunded';
  payment_method?: string;
  paid_at?: string;
  payment_metadata?: any;
  metadata?: any;
}

/**
 * Tour Booking Service
 */
export const tourBookingService = {
  async getTravelerBookings(travelerId: string): Promise<TourBooking[]> {
    const { data, error } = await supabase
      .from('tour_bookings')
      .select('*')
      .eq('traveler_id', travelerId)
      .order('booking_date', { ascending: false });

    if (error) throw error;
    return data as TourBooking[];
  },

  async getOperatorBookings(operatorId: string): Promise<TourBooking[]> {
    const { data, error } = await supabase
      .from('tour_bookings')
      .select('*, tours(id, title, operator_id)')
      .order('booking_date', { ascending: false });

    if (error) throw error;
    // Filter by operator (since we can't do complex joins in RLS)
    return (data as any[]).filter(b => b.tours?.operator_id === operatorId) as TourBooking[];
  },

  async createBooking(booking: Omit<TourBooking, 'id' | 'booking_date'>): Promise<TourBooking> {
    const { data, error } = await supabase
      .from('tour_bookings')
      .insert(booking)
      .select()
      .single();

    if (error) throw error;
    return data as TourBooking;
  },

  async updatePaymentStatus(
    bookingId: string,
    paymentStatus: string,
    stripePaymentIntentId?: string,
    paymentMethod?: string
  ): Promise<TourBooking> {
    const updates: any = {
      payment_status: paymentStatus,
      paid_at: paymentStatus === 'paid' ? new Date().toISOString() : null,
    };

    if (stripePaymentIntentId) updates.stripe_payment_intent_id = stripePaymentIntentId;
    if (paymentMethod) updates.payment_method = paymentMethod;

    const { data, error } = await supabase
      .from('tour_bookings')
      .update(updates)
      .eq('id', bookingId)
      .select()
      .single();

    if (error) throw error;
    return data as TourBooking;
  },

  async getBookingByPaymentIntent(paymentIntentId: string): Promise<TourBooking | null> {
    const { data, error } = await supabase
      .from('tour_bookings')
      .select('*')
      .eq('stripe_payment_intent_id', paymentIntentId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows found
    return (data as TourBooking) || null;
  },
};

/**
 * Package Booking Service
 */
export const packageBookingService = {
  async getTravelerBookings(travelerId: string): Promise<PackageBooking[]> {
    const { data, error } = await supabase
      .from('package_bookings')
      .select('*')
      .eq('traveler_id', travelerId)
      .order('booking_date', { ascending: false });

    if (error) throw error;
    return data as PackageBooking[];
  },

  async getOwnerBookings(ownerId: string): Promise<PackageBooking[]> {
    const { data, error } = await supabase
      .from('package_bookings')
      .select('*, packages(id, name, owner_id)')
      .order('booking_date', { ascending: false });

    if (error) throw error;
    // Filter by owner (since we can't do complex joins in RLS)
    return (data as any[]).filter(b => b.packages?.owner_id === ownerId) as PackageBooking[];
  },

  async createBooking(booking: Omit<PackageBooking, 'id' | 'booking_date'>): Promise<PackageBooking> {
    const { data, error } = await supabase
      .from('package_bookings')
      .insert(booking)
      .select()
      .single();

    if (error) throw error;
    return data as PackageBooking;
  },

  async updatePaymentStatus(
    bookingId: string,
    paymentStatus: string,
    stripePaymentIntentId?: string,
    paymentMethod?: string
  ): Promise<PackageBooking> {
    const updates: any = {
      payment_status: paymentStatus,
      paid_at: paymentStatus === 'paid' ? new Date().toISOString() : null,
    };

    if (stripePaymentIntentId) updates.stripe_payment_intent_id = stripePaymentIntentId;
    if (paymentMethod) updates.payment_method = paymentMethod;

    const { data, error } = await supabase
      .from('package_bookings')
      .update(updates)
      .eq('id', bookingId)
      .select()
      .single();

    if (error) throw error;
    return data as PackageBooking;
  },

  async getBookingByPaymentIntent(paymentIntentId: string): Promise<PackageBooking | null> {
    const { data, error } = await supabase
      .from('package_bookings')
      .select('*')
      .eq('stripe_payment_intent_id', paymentIntentId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return (data as PackageBooking) || null;
  },
};

/**
 * Payment Webhook Service (for tracking Stripe events)
 */
export interface PaymentWebhook {
  id: string;
  stripe_event_id: string;
  event_type: string;
  booking_type: 'tour' | 'package';
  booking_id: string;
  event_data: any;
  processed: boolean;
  processed_at?: string;
  error_message?: string;
  created_at: string;
}

export const paymentWebhookService = {
  async recordWebhook(webhook: Omit<PaymentWebhook, 'id' | 'created_at'>): Promise<PaymentWebhook> {
    const { data, error } = await supabase
      .from('payment_webhooks')
      .insert(webhook)
      .select()
      .single();

    if (error) throw error;
    return data as PaymentWebhook;
  },

  async markProcessed(webhookId: string, processed: boolean = true, errorMessage?: string): Promise<PaymentWebhook> {
    const { data, error } = await supabase
      .from('payment_webhooks')
      .update({
        processed,
        processed_at: processed ? new Date().toISOString() : null,
        error_message: errorMessage || null,
      })
      .eq('id', webhookId)
      .select()
      .single();

    if (error) throw error;
    return data as PaymentWebhook;
  },

  async getWebhookByStripeEventId(stripeEventId: string): Promise<PaymentWebhook | null> {
    const { data, error } = await supabase
      .from('payment_webhooks')
      .select('*')
      .eq('stripe_event_id', stripeEventId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return (data as PaymentWebhook) || null;
  },
};
