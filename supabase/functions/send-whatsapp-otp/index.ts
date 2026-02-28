// ── send-whatsapp-otp ─────────────────────────────────────────────────────────
// Generates a 6-digit OTP, stores it in phone_otps (10-min TTL), and delivers
// it to the user via WhatsApp Business API message.
//
// Required Supabase secrets:
//   WHATSAPP_ACCESS_TOKEN      — Meta permanent system user token
//   WHATSAPP_PHONE_NUMBER_ID   — Business phone number ID (from Meta dashboard)
//
// POST body: { phone: "+923001234567" }
// Response:  { success: true, message: "OTP sent via WhatsApp" }
//            or in dev (if secrets missing): { success: true, otp: "123456", dev: true }
// ─────────────────────────────────────────────────────────────────────────────

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Normalise to E.164 without leading '+' for WhatsApp API (e.g. 923001234567).
// Server-side defence: strip any trunk prefix 0 that crept in after the country-code digits.
// E.g. +9203135678933 → 9203135678933 → detect trunk 0 → 923135678933
function toWhatsAppNumber(phone: string): string {
  const raw = phone.replace(/[^0-9]/g, '') // strip all non-digits (including leading '+')
  // Known country codes that are 1-3 digits; try longest-match first to strip a trunk 0.
  // Pattern: if digits after CC start with 0 and total length > 12, strip that 0.
  // E.164 max is 15 digits; domestic Pakistani numbers are 11 digits (0XXXXXXXXXX).
  // Trunk-prefix 0 causes an extra digit → just detect & remove it safely.
  const COUNTRY_CODE_LENGTHS = [3, 2, 1] // try 3-digit CC first (e.g. +971), then 2 (+92), then 1 (+1)
  for (const len of COUNTRY_CODE_LENGTHS) {
    const subscriber = raw.slice(len)
    if (subscriber.startsWith('0') && raw.length > 12) {
      // Very likely trunk 0 — strip it
      return raw.slice(0, len) + subscriber.slice(1)
    }
  }
  return raw
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { phone } = await req.json()

    if (!phone || typeof phone !== 'string') {
      return new Response(
        JSON.stringify({ error: 'phone is required (E.164 format, e.g. +923001234567)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // ── Generate OTP ──────────────────────────────────────────────────────────
    const otp = Math.floor(100000 + Math.random() * 900000).toString()

    // ── Store in phone_otps (10 min TTL) ─────────────────────────────────────
    const supabaseUrl     = Deno.env.get('SUPABASE_URL')!
    const supabaseService = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase        = createClient(supabaseUrl, supabaseService)

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()
    const { error: insertErr } = await supabase
      .from('phone_otps')
      .insert({ phone, otp, expires_at: expiresAt })

    if (insertErr) throw new Error(`Failed to store OTP: ${insertErr.message}`)

    // ── Send via WhatsApp Business API ────────────────────────────────────────
    const accessToken   = Deno.env.get('WHATSAPP_ACCESS_TOKEN')
    const phoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')

    if (!accessToken || !phoneNumberId) {
      // Dev fallback: return OTP in response so engineers can test without WA
      console.warn('[send-whatsapp-otp] Missing WHATSAPP secrets — DEV MODE, returning OTP')
      return new Response(
        JSON.stringify({
          success: true,
          dev: true,
          otp,
          message: 'Dev mode: OTP returned in response (add WHATSAPP_ACCESS_TOKEN + WHATSAPP_PHONE_NUMBER_ID to enable live delivery)',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const waNumber = toWhatsAppNumber(phone)
    const messageBody = `Your TripAvail verification code is: *${otp}*\n\nThis code is valid for 10 minutes. Do not share it with anyone.`

    const waRes = await fetch(
      `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: waNumber,
          type: 'text',
          text: { body: messageBody },
        }),
      },
    )

    const waBody = await waRes.json().catch(() => ({}))
    console.log('[send-whatsapp-otp] WA API status:', waRes.status, JSON.stringify(waBody))

    if (!waRes.ok) {
      console.error('[send-whatsapp-otp] WhatsApp API error:', waBody)
      // Surface the Meta error code + message so the frontend can show it
      const metaErr = waBody?.error
      throw new Error(
        `WhatsApp API error ${waRes.status}: ${metaErr?.message || 'unknown'} (code ${metaErr?.code ?? '?'}, fbtrace_id: ${metaErr?.fbtrace_id ?? '?'})`
      )
    }

    // Surface WA message ID + status for diagnostics
    const waMessageId     = waBody?.messages?.[0]?.id ?? null
    const waMessageStatus = waBody?.messages?.[0]?.message_status ?? null
    console.log('[send-whatsapp-otp] delivered to waNumber:', waNumber, '| msg_id:', waMessageId, '| status:', waMessageStatus)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'OTP sent via WhatsApp',
        // Diagnostic fields — visible in dev tools Network tab
        _wa: { message_id: waMessageId, message_status: waMessageStatus, to: waNumber },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err: any) {
    console.error('[send-whatsapp-otp]', err)
    return new Response(
      JSON.stringify({ error: err.message || 'Failed to send OTP' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
