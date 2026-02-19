// send-notification-email — Supabase Edge Function
// Triggered by a Database Webhook on notifications INSERT.
//
// Webhook payload shape (what Supabase sends):
//   { type: "INSERT", table: "notifications", record: { ...notification row } }
//
// Flow:
//   1. Parse and validate the notification row
//   2. Skip if already emailed (idempotency on webhook retries)
//   3. Fetch the user's email via service role client
//   4. Pick HTML template for the notification type
//   5. Send via Resend
//   6. Update notifications.email_sent = TRUE (audit trail)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendEmail } from '../_shared/resend.ts'
import {
  renderAccountSuspended,
  renderAccountReinstated,
  renderVerificationApproved,
  renderVerificationRejected,
  renderVerificationInfoRequested,
  renderAccountStatusChanged,
} from './templates.ts'

// ─── Types ─────────────────────────────────────────────────────────────────

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  record: NotificationRow
  old_record?: NotificationRow
}

interface NotificationRow {
  id: string
  user_id: string
  type: string
  title: string
  body: string | null
  read: boolean
  email_sent: boolean
  created_at: string
}

// ─── CORS ──────────────────────────────────────────────────────────────────

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ─── Handler ───────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // ── 1. Validate env ─────────────────────────────────────────────────
    const supabaseUrl      = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const resendApiKey     = Deno.env.get('RESEND_API_KEY')
    const emailFrom        = Deno.env.get('EMAIL_FROM') ?? 'TripAvail <no-reply@tripavail.com>'

    if (!supabaseUrl || !serviceRoleKey || !resendApiKey) {
      throw new Error('Missing required environment variables')
    }

    // ── 2. Parse webhook body ────────────────────────────────────────────
    const payload: WebhookPayload = await req.json()

    if (payload.type !== 'INSERT' || payload.table !== 'notifications') {
      return ok('Ignored: not a notifications INSERT')
    }

    const notification = payload.record

    // ── 3. Idempotency guard ─────────────────────────────────────────────
    if (notification.email_sent) {
      console.log(`[send-notification-email] Already sent for notification ${notification.id}, skipping.`)
      return ok('Already sent')
    }

    // ── 4. Fetch user email (service role bypasses RLS) ──────────────────
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    })

    const { data: userData, error: userError } = await admin.auth.admin.getUserById(notification.user_id)
    if (userError || !userData?.user?.email) {
      throw new Error(`Cannot fetch email for user ${notification.user_id}: ${userError?.message ?? 'no email'}`)
    }

    const toEmail = userData.user.email

    // ── 5. Build email from template ─────────────────────────────────────
    const template = selectTemplate(notification)
    if (!template) {
      console.log(`[send-notification-email] No template for type="${notification.type}", skipping email.`)
      return ok('No template for type')
    }

    // ── 6. Send via Resend ───────────────────────────────────────────────
    const resendResponse = await sendEmail(resendApiKey, {
      from:    emailFrom,
      to:      toEmail,
      subject: template.subject,
      html:    template.html,
    })

    console.log(`[send-notification-email] Sent ${notification.type} to ${toEmail} — Resend ID: ${resendResponse.id}`)

    // ── 7. Mark email_sent = TRUE ────────────────────────────────────────
    await admin
      .from('notifications')
      .update({
        email_sent:    true,
        email_sent_at: new Date().toISOString(),
        email_error:   null,
      })
      .eq('id', notification.id)

    return ok(`Sent to ${toEmail}`)

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[send-notification-email] Error:', message)

    // Best-effort: record the error on the notification row
    try {
      const supabaseUrl    = Deno.env.get('SUPABASE_URL')
      const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
      const payload: WebhookPayload = await req.clone().json().catch(() => ({ record: null }))
      if (supabaseUrl && serviceRoleKey && payload?.record?.id) {
        const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })
        await admin.from('notifications').update({ email_error: message }).eq('id', payload.record.id)
      }
    } catch (_) { /* best-effort, ignore */ }

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

// ─── Template dispatcher ────────────────────────────────────────────────────

interface EmailTemplate { subject: string; html: string }

function selectTemplate(n: NotificationRow): EmailTemplate | null {
  const body = n.body ?? ''
  switch (n.type) {
    case 'account_suspended':           return renderAccountSuspended(n.title, body)
    case 'account_reinstated':          return renderAccountReinstated(n.title, body)
    case 'verification_approved':       return renderVerificationApproved(n.title, body)
    case 'verification_rejected':       return renderVerificationRejected(n.title, body)
    case 'verification_info_requested': return renderVerificationInfoRequested(n.title, body)
    case 'account_status_changed':      return renderAccountStatusChanged(n.title, body)
    default:
      return null // unknown type — no email, safe default
  }
}

// ─── Response helper ────────────────────────────────────────────────────────

function ok(message: string): Response {
  return new Response(JSON.stringify({ message }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
