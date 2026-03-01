import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

async function listAllTemplates(params: {
  accessToken: string
  wabaId: string
  maxPages: number
  pageLimit: number
}): Promise<{
  ok: boolean
  status: number
  pagesScanned: number
  error?: MetaWhatsAppError
  templates: Array<{
    id: string
    name: string
    language: string
    status?: string
    category?: string
    rejected_reason?: string
    components?: unknown
  }>
}> {
  const { accessToken, wabaId, maxPages, pageLimit } = params
  const templates: Array<{
    id: string
    name: string
    language: string
    status?: string
    category?: string
    rejected_reason?: string
    components?: unknown
  }> = []
  let after: string | undefined
  let pagesScanned = 0

  for (let page = 0; page < maxPages; page++) {
    const url = new URL(`https://graph.facebook.com/v21.0/${wabaId}/message_templates`)
    url.searchParams.set('fields', 'id,name,language,status,category,rejected_reason,components')
    url.searchParams.set('limit', String(pageLimit))
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
      return { ok: false, status: res.status, pagesScanned, error: err, templates: [] }
    }

    const data = Array.isArray(body?.data) ? body.data : []
    templates.push(...data)

    const nextAfter = body?.paging?.cursors?.after
    if (!nextAfter) break
    after = nextAfter
  }

  return { ok: true, status: 200, pagesScanned, templates }
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

    const url = new URL(req.url)
    const exactName = url.searchParams.get('name') || undefined
    const contains = url.searchParams.get('contains') || undefined

    const result = await listAllTemplates({ accessToken, wabaId, maxPages: 10, pageLimit: 250 })
    if (!result.ok) {
      return new Response(
        JSON.stringify({
          error: 'Failed to list templates',
          wabaIdUsed: wabaId,
          pagesScanned: result.pagesScanned,
          meta: result.error || null,
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    let templates = result.templates
    if (exactName) templates = templates.filter((t) => t.name === exactName)
    if (contains) templates = templates.filter((t) => (t.name || '').toLowerCase().includes(contains.toLowerCase()))

    return new Response(
      JSON.stringify({
        wabaIdUsed: wabaId,
        wabaIdEnv: envWabaId || null,
        wabaIdDerivedFromPhone: derivedWabaId || null,
        pagesScanned: result.pagesScanned,
        count: templates.length,
        templates,
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
