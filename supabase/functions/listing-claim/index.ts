// ── listing-claim ────────────────────────────────────────────────────────────
// Self-serve claim of an UNCLAIMED operator listing (an operator TripAvail listed from their own
// public website). Ownership is proven by WhatsApp: the code goes to the number ON THE LISTING —
// the number the operator publishes — never to a number the visitor types.
//
//   POST { action: 'info',   slug }                          → name, masked number, trips, enquiries
//   POST { action: 'start',  slug }                          → sends a 6-digit code on WhatsApp
//   POST { action: 'verify', slug, code, email, password, fullName? }
//        → the listing's account becomes the claimant's: their email + password, operator role,
//          listing_status 'member', notifications on. They then sign in normally.
//
// Limits: 3 codes per listing per hour (6 per day); a code lives 10 minutes and allows 5 tries.
// Codes are stored as SHA-256 hashes in public.listing_claims (service role only).
// Secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID,
//          optional WHATSAPP_OTP_TEMPLATE_NAME / WHATSAPP_OTP_TEMPLATE_LANG (same template as phone OTP).
// ─────────────────────────────────────────────────────────────────────────────

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
const TEMPLATE = Deno.env.get('WHATSAPP_OTP_TEMPLATE_NAME') ?? 'tripavail_otp'
const TEMPLATE_LANG = Deno.env.get('WHATSAPP_OTP_TEMPLATE_LANG') ?? 'en_US'
const CODE_TTL_MS = 10 * 60 * 1000
const MAX_TRIES = 5

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

const fail = (code: string, message: string, status = 400) => json({ ok: false, code, message }, status)

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

function mask(phone: string): string {
  const d = phone.replace(/[^0-9+]/g, '')
  return d.length > 6 ? `${d.slice(0, 4)} ••• ${d.slice(-4)}` : '•••'
}

function toWhatsAppNumber(phone: string): string {
  const raw = phone.replace(/[^0-9]/g, '')
  for (const len of [3, 2, 1]) {
    const subscriber = raw.slice(len)
    if (subscriber.startsWith('0') && raw.length > 12) return raw.slice(0, len) + subscriber.slice(1)
  }
  return raw
}

async function sendCode(to: string, code: string) {
  const accessToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN')
  const phoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')
  if (!accessToken || !phoneNumberId) return { ok: false, detail: 'whatsapp not configured' }
  // Same template as the phone-OTP flow ('mian' has 4 body variables; others take just the code).
  const parameters =
    TEMPLATE === 'mian'
      ? ['there', 'just now', 'Listing claim', code].map((text) => ({ type: 'text', text }))
      : [{ type: 'text', text: code }]
  const res = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: toWhatsAppNumber(to),
      type: 'template',
      template: { name: TEMPLATE, language: { code: TEMPLATE_LANG }, components: [{ type: 'body', parameters }] },
    }),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) console.error('[listing-claim] WhatsApp send failed', res.status, JSON.stringify(body))
  return { ok: res.ok, detail: res.ok ? 'sent' : `whatsapp ${res.status}` }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return fail('method', 'POST only', 405)

  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return fail('bad_request', 'Send JSON.')
  }
  const action = String(body.action ?? '')
  const slug = String(body.slug ?? '').trim().toLowerCase()
  if (!slug || !/^[a-z0-9-]{1,80}$/.test(slug)) return fail('bad_request', 'Unknown listing.')

  const { data: profile } = await db
    .from('tour_operator_profiles')
    .select('user_id, business_name, slug, listing_status, public_whatsapp')
    .eq('slug', slug)
    .maybeSingle()
  if (!profile) return fail('not_found', 'We could not find that listing.', 404)
  const claimable = profile.listing_status === 'unclaimed' && Boolean(profile.public_whatsapp)

  // ── info ────────────────────────────────────────────────────────────────
  if (action === 'info') {
    const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
    const count = async (type: string) =>
      (
        await db
          .from('operator_storefront_events')
          .select('id', { count: 'exact', head: true })
          .eq('operator_id', profile.user_id)
          .eq('event_type', type)
          .gte('created_at', since)
      ).count ?? 0
    const { count: trips } = await db
      .from('tours')
      .select('id', { count: 'exact', head: true })
      .eq('operator_id', profile.user_id)
      .eq('is_published', true)
    return json({
      ok: true,
      name: profile.business_name,
      slug: profile.slug,
      claimable,
      claimed: profile.listing_status !== 'unclaimed',
      whatsapp: profile.public_whatsapp ? mask(profile.public_whatsapp) : null,
      trips: trips ?? 0,
      last30Days: {
        whatsappEnquiries: await count('whatsapp_click'),
        profileViews: await count('profile_view'),
        tripClicks: await count('tour_click'),
      },
    })
  }

  if (!claimable) {
    return fail(
      profile.listing_status === 'unclaimed' ? 'no_whatsapp' : 'already_claimed',
      profile.listing_status === 'unclaimed'
        ? 'This listing has no WhatsApp number to verify with. Email us to claim it.'
        : 'This listing has already been claimed.',
      409,
    )
  }

  // ── start: send a code to the listing's own WhatsApp ────────────────────
  if (action === 'start') {
    const hourAgo = new Date(Date.now() - 3600 * 1000).toISOString()
    const dayAgo = new Date(Date.now() - 24 * 3600 * 1000).toISOString()
    const { data: recent } = await db
      .from('listing_claims')
      .select('created_at')
      .eq('operator_user_id', profile.user_id)
      .gte('created_at', dayAgo)
    const lastHour = (recent ?? []).filter((r) => r.created_at >= hourAgo).length
    if (lastHour >= 3 || (recent ?? []).length >= 6) {
      return fail('rate_limited', 'Too many codes for this listing. Try again in an hour.', 429)
    }
    const code = String(crypto.getRandomValues(new Uint32Array(1))[0] % 900000 + 100000)
    const id = crypto.randomUUID()
    const { error } = await db.from('listing_claims').insert({
      id,
      operator_user_id: profile.user_id,
      code_hash: await sha256(`${id}:${code}`),
      sent_to: profile.public_whatsapp,
      expires_at: new Date(Date.now() + CODE_TTL_MS).toISOString(),
    })
    if (error) return fail('server', 'Could not start the claim. Try again.', 500)
    const sent = await sendCode(profile.public_whatsapp!, code)
    if (!sent.ok) {
      await db.from('listing_claims').delete().eq('id', id)
      return fail('send_failed', 'We could not send the WhatsApp code right now. Email us to claim instead.', 502)
    }
    return json({ ok: true, sentTo: mask(profile.public_whatsapp!) })
  }

  // ── verify: check the code, hand over the account ──────────────────────
  if (action === 'verify') {
    const code = String(body.code ?? '').replace(/\D/g, '')
    const email = String(body.email ?? '').trim().toLowerCase()
    const password = String(body.password ?? '')
    const fullName = String(body.fullName ?? '').trim().slice(0, 120)
    if (code.length !== 6) return fail('bad_code', 'Enter the 6-digit code from WhatsApp.')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.endsWith('@unclaimed.tripavail.com')) {
      return fail('bad_email', 'Enter a valid email address for your account.')
    }
    if (password.length < 8) return fail('bad_password', 'Use a password of at least 8 characters.')

    const { data: claim } = await db
      .from('listing_claims')
      .select('id, code_hash, expires_at, attempts, verified_at')
      .eq('operator_user_id', profile.user_id)
      .is('verified_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (!claim || Date.parse(claim.expires_at) < Date.now()) {
      return fail('expired', 'That code has expired. Send a new one.', 410)
    }
    if (claim.attempts >= MAX_TRIES) return fail('locked', 'Too many wrong tries. Send a new code.', 429)
    if ((await sha256(`${claim.id}:${code}`)) !== claim.code_hash) {
      await db.from('listing_claims').update({ attempts: claim.attempts + 1 }).eq('id', claim.id)
      return fail('wrong_code', `That code isn't right. ${MAX_TRIES - claim.attempts - 1} tries left.`)
    }

    // The email must not belong to another TripAvail account.
    const { data: taken } = await db.from('users').select('id').eq('email', email).maybeSingle()
    if (taken && taken.id !== profile.user_id) {
      return fail(
        'email_in_use',
        'That email already has a TripAvail account. Use a different email for your business account.',
        409,
      )
    }

    const now = new Date().toISOString()
    const { error: authErr } = await db.auth.admin.updateUserById(profile.user_id, {
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName || profile.business_name },
      app_metadata: { unclaimed_listing: false, claimed_at: now },
    })
    if (authErr) {
      console.error('[listing-claim] auth update failed', authErr.message)
      return fail('server', 'Could not set up your account. Try again or email us.', 500)
    }
    await db.from('users').update({ email, ...(fullName ? { full_name: fullName } : {}) }).eq('id', profile.user_id)
    await db
      .from('tour_operator_profiles')
      .update({ listing_status: 'member', claimed_at: now, email })
      .eq('user_id', profile.user_id)
    // Operator role becomes the active one; the traveller role created at sign-up stays inactive.
    await db.from('user_roles').update({ is_active: false }).eq('user_id', profile.user_id)
    await db.from('user_roles').upsert(
      { user_id: profile.user_id, role_type: 'tour_operator', is_active: true, verification_status: 'incomplete' },
      { onConflict: 'user_id,role_type' },
    )
    await db
      .from('account_settings')
      .upsert(
        { user_id: profile.user_id, email_notifications_enabled: true, booking_reminders: true },
        { onConflict: 'user_id' },
      )
    await db.from('listing_claims').update({ verified_at: now, claimed_email: email }).eq('id', claim.id)
    return json({ ok: true, claimed: true, email, name: profile.business_name })
  }

  return fail('bad_request', 'Unknown action.')
})
