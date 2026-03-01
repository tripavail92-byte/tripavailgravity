// ── send-whatsapp-otp ─────────────────────────────────────────────────────────
// Generates a 6-digit OTP, stores it in phone_otps (10-min TTL), and delivers
// it via a WhatsApp *AUTHENTICATION template*.
//
// Why templates: business-initiated free-form text is often silently dropped
// outside a prior 24h user-initiated window; AUTH templates are designed for OTP.
//
// Required Supabase secrets:
//   WHATSAPP_ACCESS_TOKEN      — Meta system user token (whatsapp_business_messaging scope)
//   WHATSAPP_PHONE_NUMBER_ID   — Business phone number ID (from Meta dashboard)
//
// Template required (create once in WhatsApp Manager → Message templates):
//   name: tripavail_otp  |  category: AUTHENTICATION  |  lang: en_US
//   (one variable: {{1}} = OTP)
//
// Optional Supabase secrets (override defaults):
//   WHATSAPP_OTP_TEMPLATE_NAME — defaults to "tripavail_otp"
//   WHATSAPP_OTP_TEMPLATE_LANG — defaults to "en_US"
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

const OTP_TEMPLATE_NAME = Deno.env.get('WHATSAPP_OTP_TEMPLATE_NAME') ?? 'tripavail_otp'
const OTP_TEMPLATE_LANG = Deno.env.get('WHATSAPP_OTP_TEMPLATE_LANG') ?? 'en_US'

const WHATSAPP_BUSINESS_ACCOUNT_ID = Deno.env.get('WHATSAPP_BUSINESS_ACCOUNT_ID')

type MetaWhatsAppError = {
  message?: string
  type?: string
  code?: number
  error_subcode?: number
  fbtrace_id?: string
}

async function getWabaIdForPhoneNumber(params: {
  accessToken: string
  phoneNumberId: string
}): Promise<{ ok: boolean; status: number; wabaId?: string; error?: MetaWhatsAppError }> {
  const { accessToken, phoneNumberId } = params
  const res = await fetch(
    `https://graph.facebook.com/v21.0/${phoneNumberId}?fields=whatsapp_business_account{id}`, 
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  )
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = body?.error as MetaWhatsAppError | undefined
    console.warn('[send-whatsapp-otp] Failed to read phone_number WABA:', res.status, JSON.stringify(body))
    return { ok: false, status: res.status, error: err }
  }
  const wabaId = body?.whatsapp_business_account?.id
  return { ok: true, status: res.status, wabaId }
}

async function listTemplatesForName(params: {
  accessToken: string
  wabaId: string
  templateName: string
}): Promise<{
  ok: boolean
  status: number
  error?: MetaWhatsAppError
  pagesScanned: number
  templates: Array<{ id: string; name: string; language: string; status?: string; category?: string }>
}> {
  const { accessToken, wabaId, templateName } = params
  const matches: Array<{ id: string; name: string; language: string; status?: string; category?: string }> = []
  let after: string | undefined
  let pagesScanned = 0

  // Paginate to avoid false negatives when many templates exist.
  // Cap to keep execution time bounded.
  for (let page = 0; page < 8; page++) {
    const url = new URL(`https://graph.facebook.com/v21.0/${wabaId}/message_templates`)
    url.searchParams.set('fields', 'id,name,language,status,category')
    url.searchParams.set('limit', '250')
    if (after) url.searchParams.set('after', after)

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
    const body = await res.json().catch(() => ({}))
    pagesScanned++

    if (!res.ok) {
      const err = body?.error as MetaWhatsAppError | undefined
      console.warn('[send-whatsapp-otp] Failed to list templates:', res.status, JSON.stringify(body))
      return { ok: false, status: res.status, error: err, pagesScanned, templates: [] }
    }

    const data = Array.isArray(body?.data) ? body.data : []
    for (const t of data) {
      if (t?.name === templateName) matches.push(t)
    }

    const nextAfter = body?.paging?.cursors?.after
    if (!nextAfter) break
    after = nextAfter
  }

  return { ok: true, status: 200, pagesScanned, templates: matches }
}

async function sendOtpTemplate(params: {
  accessToken: string
  phoneNumberId: string
  to: string
  otp: string
  templateName: string
  templateLang: string
}): Promise<{ ok: boolean; status: number; body: any }>{
  const { accessToken, phoneNumberId, to, otp, templateName, templateLang } = params
  const res = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: templateName,
        language: { code: templateLang },
        components: [
          {
            type: 'body',
            parameters: [{ type: 'text', text: otp }],
          },
        ],
      },
    }),
  })
  const body = await res.json().catch(() => ({}))
  return { ok: res.ok, status: res.status, body }
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

serve(async (req: Request) => {
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

    // ── Send via AUTHENTICATION template (OTP) ──────────────────────────────
    // Note: Template must exist + be APPROVED in the WABA.
    let attemptLang = OTP_TEMPLATE_LANG
    let send = await sendOtpTemplate({
      accessToken,
      phoneNumberId,
      to: waNumber,
      otp,
      templateName: OTP_TEMPLATE_NAME,
      templateLang: attemptLang,
    })

    console.log('[send-whatsapp-otp] WA API status:', send.status, JSON.stringify(send.body))

    if (!send.ok) {
      const metaErr = send.body?.error as MetaWhatsAppError | undefined
      console.error('[send-whatsapp-otp] WhatsApp API error:', send.body)

      // If template translation not found, try to auto-resolve correct language.
      if (metaErr?.code === 132001) {
        const derived = await getWabaIdForPhoneNumber({ accessToken, phoneNumberId })
        const wabaIdForLookup = derived.ok && derived.wabaId ? derived.wabaId : WHATSAPP_BUSINESS_ACCOUNT_ID
        if (!wabaIdForLookup) {
          throw new Error(
            `WhatsApp template lookup unavailable: missing WHATSAPP_BUSINESS_ACCOUNT_ID and could not derive WABA from PHONE_NUMBER_ID. ` +
              `Graph status=${derived.status}, code=${derived.error?.code ?? '?'}, message=${derived.error?.message ?? 'unknown'}.`
          )
        }
        const wabaHint =
          derived.ok && derived.wabaId && derived.wabaId !== WHATSAPP_BUSINESS_ACCOUNT_ID
            ? ` (env=${WHATSAPP_BUSINESS_ACCOUNT_ID}, derived_from_phone=${derived.wabaId})`
            : ''

        const lookup = await listTemplatesForName({
          accessToken,
          wabaId: wabaIdForLookup,
          templateName: OTP_TEMPLATE_NAME,
        })

        const matches = lookup.templates

        const approved = matches.filter((t) => (t.status ?? '').toUpperCase() === 'APPROVED')
        const approvedLangs = Array.from(new Set(approved.map((t) => t.language).filter(Boolean)))

        if (approvedLangs.length === 1 && approvedLangs[0] !== attemptLang) {
          attemptLang = approvedLangs[0]
          console.log('[send-whatsapp-otp] Retrying with approved template lang:', attemptLang)
          send = await sendOtpTemplate({
            accessToken,
            phoneNumberId,
            to: waNumber,
            otp,
            templateName: OTP_TEMPLATE_NAME,
            templateLang: attemptLang,
          })
        } else {
          const foundLangs = Array.from(new Set(matches.map((t) => t.language).filter(Boolean)))
          throw new Error(
            `WhatsApp template not found for lang=${OTP_TEMPLATE_LANG}. ` +
              `Template name=${OTP_TEMPLATE_NAME}. ` +
              `WABA_ID used=${wabaIdForLookup}${wabaHint}. ` +
              (lookup.ok
                ? `Found languages in this WABA: ${foundLangs.length ? foundLangs.join(', ') : '(none)'}; pages_scanned=${lookup.pagesScanned}; `
                : `Template lookup failed (status=${lookup.status}, code=${lookup.error?.code ?? '?'}, message=${lookup.error?.message ?? 'unknown'}). `) +
              `Approved languages: ${approvedLangs.length ? approvedLangs.join(', ') : '(none)'}. ` +
              `Set WHATSAPP_OTP_TEMPLATE_LANG to one of the approved languages.`
          )
        }
      }

      if (!send.ok) {
        // Surface the Meta error code + message so the frontend can show it
        throw new Error(
          `WhatsApp API error ${send.status}: ${metaErr?.message || 'unknown'} (code ${metaErr?.code ?? '?'}, fbtrace_id: ${metaErr?.fbtrace_id ?? '?'})`
        )
      }
    }

    const waBody = send.body

    // Surface WA message ID + status for diagnostics
    const waMessageId     = waBody?.messages?.[0]?.id ?? null
    const waMessageStatus = waBody?.messages?.[0]?.message_status ?? null
    console.log('[send-whatsapp-otp] delivered to waNumber:', waNumber, '| msg_id:', waMessageId, '| status:', waMessageStatus)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'OTP sent via WhatsApp',
        // Diagnostic fields — visible in dev tools Network tab
        _wa: {
          message_id: waMessageId,
          message_status: waMessageStatus,
          to: waNumber,
          template: { name: OTP_TEMPLATE_NAME, lang: attemptLang },
        },
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
