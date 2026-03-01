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

function toWhatsAppNumber(phone: string): string {
  // WhatsApp Cloud API expects digits only (countrycode + national number)
  return String(phone).replace(/[^0-9]/g, '')
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

    if (!accessToken || !phoneNumberId) {
      return new Response(
        JSON.stringify({ error: 'Missing WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID secret' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const body = await req.json().catch(() => ({}))
    const toRaw = body?.to
    const lang = (body?.lang || 'en_US') as string
    const templateName = (body?.templateName || 'hello_world') as string

    if (!toRaw || typeof toRaw !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing required field: to (E.164 or digits)' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const to = toWhatsAppNumber(toRaw)

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
          language: { code: lang },
        },
      }),
    })

    const json = await res.json().catch(() => ({}))

    if (!res.ok) {
      const err = json?.error as MetaWhatsAppError | undefined
      return new Response(
        JSON.stringify({
          ok: false,
          status: res.status,
          to,
          template: { name: templateName, lang },
          meta: err || null,
          response: json,
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    return new Response(
      JSON.stringify({
        ok: true,
        status: res.status,
        to,
        template: { name: templateName, lang },
        response: json,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
