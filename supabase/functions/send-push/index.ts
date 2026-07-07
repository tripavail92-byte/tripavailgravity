// send-push — Supabase Edge Function
// Triggered by a Database Webhook on notifications INSERT (same event that
// feeds send-notification-email — add a second webhook pointing here).
//
// Flow:
//   1. Parse the inserted notifications row
//   2. Look up the user's Expo push token from auth user_metadata
//      (`expo_push_token`, written by the mobile app on sign-in — no schema change)
//   3. Relay through the Expo push service (https://exp.host/--/api/v2/push/send)
//
// No delivery-audit column is written (the table has none for push); Expo's
// receipt API can be added later if delivery tracking is needed.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  record: NotificationRow
}

interface NotificationRow {
  id: string
  user_id: string
  type: string
  title: string
  body: string | null
  metadata: Record<string, unknown> | null
  read: boolean
  created_at: string
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (status: number, data: Record<string, unknown>) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload = (await req.json()) as WebhookPayload
    if (payload.type !== 'INSERT' || payload.table !== 'notifications' || !payload.record) {
      return json(200, { skipped: true, reason: 'not a notifications insert' })
    }
    const row = payload.record

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: userRes, error: userErr } = await supabase.auth.admin.getUserById(row.user_id)
    if (userErr || !userRes?.user) {
      return json(200, { skipped: true, reason: 'user not found' })
    }

    const token = userRes.user.user_metadata?.expo_push_token as string | undefined
    if (!token || !token.startsWith('ExponentPushToken')) {
      return json(200, { skipped: true, reason: 'no push token registered' })
    }

    const message = {
      to: token,
      sound: 'default',
      title: row.title || 'TripAvail',
      body: row.body ?? '',
      data: { notification_id: row.id, type: row.type, ...(row.metadata ?? {}) },
      channelId: 'default',
    }

    const expoRes = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    })
    const expoBody = await expoRes.json().catch(() => ({}))

    return json(200, { sent: expoRes.ok, expo: expoBody })
  } catch (err) {
    console.error('send-push error:', err)
    return json(500, { error: err instanceof Error ? err.message : 'unknown error' })
  }
})
