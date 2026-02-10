// Supabase Edge Function: stripe-verify-payment-intent
// Verifies a Stripe PaymentIntent succeeded and matches booking metadata/amount.

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

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
    const payment_intent_id = body?.payment_intent_id as string | undefined;

    if (!booking_id || !payment_intent_id) {
      return new Response(JSON.stringify({ ok: false, error: 'booking_id and payment_intent_id are required' }), {
        status: 400,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

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

    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('package_bookings')
      .select('id, traveler_id, stripe_payment_intent_id, total_price')
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

    if (booking.stripe_payment_intent_id && booking.stripe_payment_intent_id !== payment_intent_id) {
      return new Response(JSON.stringify({ ok: false, error: 'Payment intent mismatch' }), {
        status: 400,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    const totalPrice = Number(booking.total_price);
    const expectedAmount = Math.round(totalPrice * 100);

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-06-20',
      httpClient: Stripe.createFetchHttpClient(),
    });

    const pi = await stripe.paymentIntents.retrieve(payment_intent_id);

    if (pi.status !== 'succeeded') {
      return new Response(JSON.stringify({ ok: false, error: `Payment not succeeded (status: ${pi.status})` }), {
        status: 400,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    if (pi.amount !== expectedAmount) {
      return new Response(JSON.stringify({ ok: false, error: 'Payment amount mismatch' }), {
        status: 400,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    if (pi.metadata?.booking_id && pi.metadata.booking_id !== booking_id) {
      return new Response(JSON.stringify({ ok: false, error: 'Payment metadata mismatch' }), {
        status: 400,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' },
    });
  }
});
