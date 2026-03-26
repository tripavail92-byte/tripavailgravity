// @ts-nocheck
// Supabase Edge Function: stripe-webhook
// Handles Stripe webhook ingestion for payment, refund, and dispute events.

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@15.12.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0?target=deno';

function corsHeaders(origin: string | null) {
  return {
    'Access-Control-Allow-Origin': origin ?? '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

function jsonResponse(origin: string | null, status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
  });
}

function roundCurrency(value: number | null | undefined): number {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount)) return 0;
  return Math.round(amount * 100) / 100;
}

function toIsoOrNull(value: number | string | null | undefined): string | null {
  if (!value) return null;
  if (typeof value === 'number') return new Date(value * 1000).toISOString();

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

function mergeJson(base: Record<string, unknown> | null | undefined, extra: Record<string, unknown>) {
  return { ...(base ?? {}), ...extra };
}

async function findBookingByPaymentIntent(
  supabaseAdmin: ReturnType<typeof createClient>,
  paymentIntentId: string,
  hintedBookingType?: string | null,
  hintedBookingId?: string | null,
) {
  const normalizedType = hintedBookingType === 'tour' || hintedBookingType === 'package'
    ? hintedBookingType
    : null;

  if (normalizedType && hintedBookingId) {
    const tableName = normalizedType === 'tour' ? 'tour_bookings' : 'package_bookings';
    const { data } = await supabaseAdmin
      .from(tableName)
      .select('*')
      .eq('id', hintedBookingId)
      .maybeSingle();

    if (data) {
      return { bookingType: normalizedType, booking: data, tableName };
    }
  }

  for (const candidate of [
    { bookingType: 'tour', tableName: 'tour_bookings' },
    { bookingType: 'package', tableName: 'package_bookings' },
  ] as const) {
    const { data } = await supabaseAdmin
      .from(candidate.tableName)
      .select('*')
      .eq('stripe_payment_intent_id', paymentIntentId)
      .maybeSingle();

    if (data) {
      return { bookingType: candidate.bookingType, booking: data, tableName: candidate.tableName };
    }
  }

  return null;
}

async function refreshTourCommercialState(supabaseAdmin: ReturnType<typeof createClient>, bookingId: string) {
  const { data: snapshot } = await supabaseAdmin
    .from('operator_booking_finance_snapshots')
    .select('operator_user_id')
    .eq('booking_id', bookingId)
    .maybeSingle();

  const operatorUserId = snapshot?.operator_user_id;
  if (!operatorUserId) return;

  await supabaseAdmin.rpc('sync_operator_payout_eligibility', {
    p_operator_user_id: operatorUserId,
  });
}

async function upsertAutoDisputeCase(
  supabaseAdmin: ReturnType<typeof createClient>,
  bookingId: string,
  dispute: Stripe.Dispute,
) {
  const { data: payoutItem } = await supabaseAdmin
    .from('operator_payout_items')
    .select('id, operator_user_id')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!payoutItem?.id || !payoutItem?.operator_user_id) return;

  const disputeId = String(dispute.id || '').trim();
  if (!disputeId) return;

  const { data: existing } = await supabaseAdmin
    .from('operator_payout_dispute_cases')
    .select('id')
    .eq('payout_item_id', payoutItem.id)
    .contains('reconciliation_report', { stripe_dispute_id: disputeId })
    .maybeSingle();

  if (existing?.id) return;

  const disputeAmount = roundCurrency((dispute.amount ?? 0) / 100);
  const reasonSummary = [
    `Stripe dispute ${disputeId}`,
    dispute.reason ? `reason: ${dispute.reason}` : null,
    disputeAmount > 0 ? `amount: ${disputeAmount.toFixed(2)}` : null,
  ]
    .filter(Boolean)
    .join(' · ')
    .slice(0, 500);

  await supabaseAdmin.from('operator_payout_dispute_cases').insert({
    operator_user_id: payoutItem.operator_user_id,
    payout_item_id: payoutItem.id,
    booking_id: bookingId,
    dispute_category: 'refund_mismatch',
    requested_action: 'manual_reconciliation',
    status: 'submitted',
    reason_summary: reasonSummary,
    evidence_notes: 'Created automatically from Stripe dispute webhook ingestion.',
    reconciliation_report: {
      source: 'stripe_webhook',
      stripe_dispute_id: disputeId,
      stripe_dispute_status: dispute.status ?? null,
      stripe_charge_id: typeof dispute.charge === 'string' ? dispute.charge : dispute.charge?.id ?? null,
      dispute_amount: disputeAmount,
      dispute_reason: dispute.reason ?? null,
      due_by: toIsoOrNull(dispute.evidence_details?.due_by ?? null),
      livemode: Boolean(dispute.livemode),
    },
  });
}

serve(async (req) => {
  const origin = req.headers.get('origin');
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(origin) });
  }

  if (req.method !== 'POST') {
    return jsonResponse(origin, 405, { ok: false, error: 'Method not allowed' });
  }

  try {
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? Deno.env.get('EDGE_SUPABASE_URL');
    const supabaseServiceRoleKey =
      Deno.env.get('SERVICE_ROLE_KEY') ?? Deno.env.get('EDGE_SUPABASE_SERVICE_ROLE_KEY');

    if (!stripeSecretKey || !stripeWebhookSecret) {
      return jsonResponse(origin, 500, { ok: false, error: 'Missing Stripe webhook env' });
    }
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return jsonResponse(origin, 500, { ok: false, error: 'Missing Supabase env' });
    }

    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      return jsonResponse(origin, 400, { ok: false, error: 'Missing stripe-signature header' });
    }

    const rawBody = await req.text();
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-06-20',
      httpClient: Stripe.createFetchHttpClient(),
    });
    const cryptoProvider = Stripe.createSubtleCryptoProvider();

    const event = await stripe.webhooks.constructEventAsync(
      rawBody,
      signature,
      stripeWebhookSecret,
      undefined,
      cryptoProvider,
    );

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false },
    });

    const baseObject = event.data.object as any;
    const objectMetadata = baseObject?.metadata ?? {};

    let paymentIntentId: string | null =
      typeof baseObject?.id === 'string' && String(baseObject.object || '').startsWith('payment_intent')
        ? baseObject.id
        : typeof baseObject?.payment_intent === 'string'
          ? baseObject.payment_intent
          : typeof baseObject?.payment_intent?.id === 'string'
            ? baseObject.payment_intent.id
            : null;

    if (!paymentIntentId && typeof objectMetadata.payment_intent_id === 'string') {
      paymentIntentId = objectMetadata.payment_intent_id;
    }

    let hintedBookingType = typeof objectMetadata.booking_type === 'string'
      ? objectMetadata.booking_type.toLowerCase()
      : null;
    let hintedBookingId = typeof objectMetadata.booking_id === 'string' ? objectMetadata.booking_id : null;

    if ((!hintedBookingType || !hintedBookingId) && paymentIntentId) {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      const paymentIntentBookingType = String(paymentIntent.metadata?.booking_type || '').toLowerCase();
      hintedBookingType = hintedBookingType ?? (paymentIntentBookingType || null);
      hintedBookingId = hintedBookingId ?? paymentIntent.metadata?.booking_id ?? null;
    }

    if (!paymentIntentId || !hintedBookingType || !hintedBookingId) {
      return jsonResponse(origin, 200, {
        ok: true,
        skipped: true,
        reason: 'Event did not resolve to a TripAvail booking',
        event_type: event.type,
      });
    }

    const bookingContext = await findBookingByPaymentIntent(
      supabaseAdmin,
      paymentIntentId,
      hintedBookingType,
      hintedBookingId,
    );

    if (!bookingContext) {
      return jsonResponse(origin, 200, {
        ok: true,
        skipped: true,
        reason: 'Booking not found for payment intent',
        event_type: event.type,
      });
    }

    const { bookingType, booking, tableName } = bookingContext;

    const { data: existingWebhook } = await supabaseAdmin
      .from('payment_webhooks')
      .select('id, processed')
      .eq('stripe_event_id', event.id)
      .maybeSingle();

    let webhookId = existingWebhook?.id as string | undefined;
    if (!webhookId) {
      const { data: insertedWebhook, error: webhookInsertError } = await supabaseAdmin
        .from('payment_webhooks')
        .insert({
          stripe_event_id: event.id,
          event_type: event.type,
          booking_type: bookingType,
          booking_id: booking.id,
          event_data: event,
          processed: false,
        })
        .select('id')
        .single();

      if (webhookInsertError) {
        throw webhookInsertError;
      }

      webhookId = insertedWebhook.id;
    } else if (existingWebhook.processed) {
      return jsonResponse(origin, 200, { ok: true, duplicate: true, event_type: event.type });
    }

    const bookingMetadata = mergeJson(booking.metadata, {
      last_stripe_webhook_type: event.type,
      last_stripe_webhook_at: new Date().toISOString(),
    });
    const paymentMetadata = mergeJson(booking.payment_metadata, {
      last_stripe_event_id: event.id,
      last_stripe_event_type: event.type,
      last_stripe_event_created_at: toIsoOrNull(event.created) ?? new Date().toISOString(),
    });

    const updatePayload: Record<string, unknown> = {
      metadata: bookingMetadata,
      payment_metadata: paymentMetadata,
      stripe_payment_intent_id: paymentIntentId,
    };

    if (event.type === 'payment_intent.succeeded') {
      const remainingAmount = Number(booking.remaining_amount ?? 0);
      updatePayload.payment_status = bookingType === 'tour' && remainingAmount > 0 ? 'balance_pending' : 'paid';
      updatePayload.status = booking.status === 'pending' ? 'confirmed' : booking.status;
      updatePayload.payment_method = 'stripe_card';
      updatePayload.paid_at = booking.paid_at ?? new Date().toISOString();
    } else if (event.type === 'payment_intent.payment_failed') {
      updatePayload.payment_status = 'failed';
    } else if (event.type === 'charge.refunded') {
      const charge = baseObject as Stripe.Charge;
      const chargeAmount = roundCurrency((charge.amount ?? 0) / 100);
      const refundedAmount = roundCurrency((charge.amount_refunded ?? 0) / 100);
      const isPartialRefund = refundedAmount > 0 && refundedAmount < chargeAmount;
      const refundStatus = isPartialRefund && bookingType === 'tour' ? 'partially_refunded' : 'refunded';

      updatePayload.payment_status = refundStatus;
      updatePayload.metadata = mergeJson(bookingMetadata, {
        refund_amount: refundedAmount,
        refund_reason: charge.refunds?.data?.[0]?.reason ?? charge.failure_message ?? 'stripe_refund',
        refund_timestamp: new Date().toISOString(),
      });
      updatePayload.payment_metadata = mergeJson(paymentMetadata, {
        stripe_charge_id: charge.id,
        stripe_refund_status: refundedAmount >= chargeAmount ? 'refunded' : 'partially_refunded',
        stripe_refund_amount: refundedAmount,
      });
      if (booking.status === 'pending') {
        updatePayload.status = 'cancelled';
      }
    } else if (
      event.type === 'charge.dispute.created'
      || event.type === 'charge.dispute.updated'
      || event.type === 'charge.dispute.closed'
      || event.type === 'charge.dispute.funds_withdrawn'
      || event.type === 'charge.dispute.funds_reinstated'
    ) {
      const dispute = baseObject as Stripe.Dispute;
      const disputeStatus = String(dispute.status || '').toLowerCase();
      const disputeOpen = !['won', 'lost', 'warning_closed'].includes(disputeStatus);
      updatePayload.payment_metadata = mergeJson(paymentMetadata, {
        stripe_dispute_id: dispute.id,
        stripe_dispute_status: disputeStatus || null,
        stripe_dispute_open: disputeOpen,
        stripe_dispute_amount: roundCurrency((dispute.amount ?? 0) / 100),
        stripe_dispute_reason: dispute.reason ?? null,
        stripe_dispute_due_by: toIsoOrNull(dispute.evidence_details?.due_by ?? null),
        stripe_dispute_updated_at: new Date().toISOString(),
      });

      if (disputeOpen) {
        updatePayload.metadata = mergeJson(bookingMetadata, {
          dispute_opened_at: new Date().toISOString(),
          dispute_reason: dispute.reason ?? null,
        });
      }

      if (bookingType === 'tour' && disputeOpen) {
        await upsertAutoDisputeCase(supabaseAdmin, booking.id, dispute);
      }
    }

    const { error: updateError } = await supabaseAdmin
      .from(tableName)
      .update(updatePayload)
      .eq('id', booking.id);

    if (updateError) {
      throw updateError;
    }

    if (bookingType === 'tour') {
      await refreshTourCommercialState(supabaseAdmin, booking.id);
    }

    if (webhookId) {
      await supabaseAdmin
        .from('payment_webhooks')
        .update({
          processed: true,
          processed_at: new Date().toISOString(),
          error_message: null,
        })
        .eq('id', webhookId);
    }

    return jsonResponse(origin, 200, {
      ok: true,
      event_type: event.type,
      booking_id: booking.id,
      booking_type: bookingType,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return jsonResponse(origin, 400, { ok: false, error: message });
  }
});