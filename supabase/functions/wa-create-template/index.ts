import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-wa-diag-key',
}

type MetaWhatsAppError = {
  message?: string
  type?: string
  code?: number
  error_subcode?: number
  fbtrace_id?: string
}

function isAuthorized(req: Request): boolean {
  const diagKey = Deno.env.get('WA_DIAG_KEY')
  if (diagKey) {
    return (req.headers.get('x-wa-diag-key') || '') === diagKey
  }

  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!serviceKey) return false

  const auth = req.headers.get('authorization') || ''
  const token = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7) : auth
  return token === serviceKey
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
    return { ok: false, status: res.status, error: err }
  }
  const wabaId = body?.whatsapp_business_account?.id
  return { ok: true, status: res.status, wabaId }
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    if (!isAuthorized(req)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const accessToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN')
    const phoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')
    const envWabaId = Deno.env.get('WHATSAPP_BUSINESS_ACCOUNT_ID')

    if (!accessToken) {
      return new Response(JSON.stringify({ error: 'Missing WHATSAPP_ACCESS_TOKEN secret' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let derivedWabaId: string | undefined
    if (phoneNumberId) {
      const derived = await getWabaIdForPhoneNumber({ accessToken, phoneNumberId })
      if (derived.ok) derivedWabaId = derived.wabaId
    }

    const wabaId = derivedWabaId || envWabaId
    if (!wabaId) {
      return new Response(
        JSON.stringify({
          error: 'Missing WHATSAPP_BUSINESS_ACCOUNT_ID and could not derive from WHATSAPP_PHONE_NUMBER_ID',
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const payload = await req.json().catch(() => ({}))

    const name = (payload?.name || 'tripavail_otp') as string
    const language = (payload?.language || 'en_US') as string
    const category = (payload?.category || 'UTILITY') as string
    const bodyText = (payload?.bodyText || 'Your TripAvail verification code is {{1}}.') as string

    const normalizedCategory = String(category).toUpperCase()
    const codeExpirationMinutes = Number(payload?.codeExpirationMinutes ?? 10)
    const addSecurityRecommendation = Boolean(payload?.addSecurityRecommendation ?? true)

    const templateBody =
      normalizedCategory === 'AUTHENTICATION'
        ? {
            name,
            language,
            category: 'AUTHENTICATION',
            components: [
              {
                type: 'BODY',
                add_security_recommendation: addSecurityRecommendation,
              },
              {
                type: 'FOOTER',
                code_expiration_minutes: codeExpirationMinutes,
              },
              {
                type: 'BUTTONS',
                buttons: [
                  {
                    type: 'OTP',
                    otp_type: 'COPY_CODE',
                    text: 'Copy code',
                  },
                ],
              },
            ],
          }
        : {
            name,
            language,
            category,
            components: [{ type: 'BODY', text: bodyText }],
          }

    const res = await fetch(`https://graph.facebook.com/v21.0/${wabaId}/message_templates`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(templateBody),
    })

    const json = await res.json().catch(() => ({}))

    return new Response(
      JSON.stringify({
        ok: res.ok,
        status: res.status,
        wabaIdUsed: wabaId,
        template: { name, language, category },
        response: json,
      }),
      { status: res.ok ? 200 : 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
