// @ts-nocheck
// Supabase Edge Function: stripe-create-payment-intent
// Creates a Stripe PaymentIntent for a pending booking hold.
// Supports: package_bookings and tour_bookings

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@15.12.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0?target=deno';

function corsHeaders(origin: string | null) {
  return {
    'Access-Control-Allow-Origin': origin ?? '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

serve(async (req) => {
  const origin = req.headers.get('origin');
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(origin) });
  }

  try {
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? Deno.env.get('EDGE_SUPABASE_URL');
    // Supabase disallows setting secrets that start with SUPABASE_.
    // Use a non-reserved name for the service role key.
    const supabaseServiceRoleKey =
      Deno.env.get('SERVICE_ROLE_KEY') ?? Deno.env.get('EDGE_SUPABASE_SERVICE_ROLE_KEY');

    if (!stripeSecretKey) {
      return new Response(JSON.stringify({ ok: false, error: 'Missing STRIPE_SECRET_KEY' }), {
        status: 500,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return new Response(JSON.stringify({ ok: false, error: 'Missing Supabase env' }), {
        status: 500,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    const authHeader = req.headers.get('Authorization');
    const jwt = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null;
    if (!jwt) {
      return new Response(JSON.stringify({ ok: false, error: 'Missing Authorization bearer token' }), {
        status: 401,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => null);
    const booking_id = body?.booking_id as string | undefined;
    const booking_type = (body?.booking_type as string | undefined) ?? 'package';

    if (!booking_id) {
      return new Response(JSON.stringify({ ok: false, error: 'booking_id is required' }), {
        status: 400,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    const normalizedType = String(booking_type).toLowerCase();
    const isTour = normalizedType === 'tour';
    const tableName = isTour ? 'tour_bookings' : 'package_bookings';
    const idempotencyKey = `${normalizedType}_booking_${booking_id}`;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false },
    });

    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(jwt);
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ ok: false, error: 'Invalid auth token' }), {
        status: 401,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    const userId = userData.user.id;

    const bookingSelect = isTour
      ? 'id, traveler_id, status, payment_status, expires_at, total_price, tour_id, schedule_id'
      : 'id, traveler_id, status, payment_status, expires_at, total_price';

    const { data: booking, error: bookingError } = await supabaseAdmin
      .from(tableName)
      .select(bookingSelect)
      .eq('id', booking_id)
      .single();

    if (bookingError || !booking) {
      return new Response(JSON.stringify({ ok: false, error: 'Booking not found' }), {
        status: 404,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    if (booking.traveler_id !== userId) {
      return new Response(JSON.stringify({ ok: false, error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    if (booking.status !== 'pending') {
      return new Response(JSON.stringify({ ok: false, error: 'Booking is not pending' }), {
        status: 400,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    if (!booking.expires_at || new Date(booking.expires_at).getTime() <= Date.now()) {
      return new Response(JSON.stringify({ ok: false, error: 'Booking hold expired' }), {
        status: 400,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    const totalPrice = Number(booking.total_price);
    if (!Number.isFinite(totalPrice) || totalPrice <= 0) {
      return new Response(JSON.stringify({ ok: false, error: 'Invalid booking total' }), {
        status: 400,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    let currency = 'usd';
    if (isTour) {
      const tourId = booking.tour_id;
      if (tourId) {
        const { data: tourRow } = await supabaseAdmin
          .from('tours')
          .select('currency')
          .eq('id', tourId)
          .maybeSingle();

        const found = String(tourRow?.currency || '').trim();
        if (found) currency = found.toLowerCase();
      }
    }

    // Stripe amount is in the smallest currency unit.
    const amountCents = Math.round(totalPrice * 100);

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-06-20',
      httpClient: Stripe.createFetchHttpClient(),
    });

    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: amountCents,
        currency,
        automatic_payment_methods: { enabled: true },
        metadata: {
          booking_id,
          booking_type: normalizedType,
          traveler_id: userId,
          ...(isTour
            ? {
                tour_id: booking.tour_id ?? '',
                schedule_id: booking.schedule_id ?? '',
              }
            : {}),
        },
      },
      {
        idempotencyKey,
      }
    );

    await supabaseAdmin
      .from(tableName)
      .update({
        stripe_payment_intent_id: paymentIntent.id,
        payment_status: 'processing',
      })
      .eq('id', booking_id);

    return new Response(
      JSON.stringify({ ok: true, payment_intent_id: paymentIntent.id, client_secret: paymentIntent.client_secret }),
      {
        status: 200,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' },
    });
  }
});
