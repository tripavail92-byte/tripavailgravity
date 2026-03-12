import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type RoleKey = 'traveller' | 'hotel_manager' | 'tour_operator'

const ROLE_BUTTONS: Array<{ id: string; title: string; role: RoleKey }> = [
  { id: 'role_traveller', title: 'Traveller', role: 'traveller' },
  { id: 'role_hotel_manager', title: 'Hotel Manager', role: 'hotel_manager' },
  { id: 'role_tour_operator', title: 'Tour Operator', role: 'tour_operator' },
]

const ROLE_LABEL: Record<RoleKey, string> = {
  traveller: 'Traveller',
  hotel_manager: 'Hotel Manager',
  tour_operator: 'Tour Operator',
}

const SYSTEM_PROMPT = `
You are the official WhatsApp assistant for TripAvail.

Mission:
Help people quickly based on their role and journey phase. Be accurate, practical, and concise.

TripAvail roles:
- Traveller
- Hotel Manager (partner)
- Tour Operator (partner)

Critical product rule:
- Every user starts as Traveller.
- A user can choose ONLY ONE partner role: Hotel Manager OR Tour Operator.
- That partner choice is permanent.
- They can switch between Traveller view and their chosen partner view.

Known product reality (do not misstate):
- Traveller booking checkout/confirmation flow may be incomplete in parts.
- Hotel Manager and Tour Operator onboarding flows are implemented.
- Verification can gate publishing and payouts for partners.

Phase-aware guidance:
1) Discovery phase (new users): explain what TripAvail does, role choices, and where to start.
2) Setup phase (partners): provide next-step onboarding guidance.
3) Verification phase: explain statuses (incomplete, pending, under_review, approved, rejected, expired) and what to do next.
4) Publish/manage phase: explain package/tour creation, calendar, bookings, and settings.
5) Issue phase: troubleshoot with short steps and request the minimum missing detail.

Role playbooks:
- Traveller: discovery, search, package/hotel details, trips, wishlist, settings, support.
- Hotel Manager: dashboard, 10-step hotel listing flow, 10-step package flow, calendar, verification.
- Tour Operator: dashboard, tours, 7-step tour creation flow, calendar, bookings, verification.

Response policy:
- Keep replies under 420 characters.
- Start with a direct answer.
- Give 1-3 actionable next steps.
- Ask one short clarifying question when needed.
- If uncertain, say: "I can connect you with TripAvail support for exact account-level help."
- Never claim you completed backend actions.
- Never invent prices, availability, or policy details.

Style:
Professional, warm, confident, non-salesy.

If asked "What is TripAvail?" use this base answer and adapt briefly:
"TripAvail is a travel platform where travellers discover curated hotel stays and tour packages, while hotel managers and tour operators manage listings, availability, and bookings."
`

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const url = new URL(req.url)

  // -- GET Method: Webhook Verification --
  if (req.method === 'GET') {
    const mode = url.searchParams.get('hub.mode')
    const token = url.searchParams.get('hub.verify_token')
    const challenge = url.searchParams.get('hub.challenge')
    const verifyToken = Deno.env.get('WHATSAPP_VERIFY_TOKEN')

    if (mode === 'subscribe' && token === verifyToken) {
      console.log('Webhook verified successfully!')
      return new Response(challenge, { status: 200 })
    } else {
      console.error('Webhook verification failed. Token mismatch.')
      return new Response('Forbidden', { status: 403 })
    }
  }

  // -- POST Method: Receive Webhook Events --
  if (req.method === 'POST') {
    try {
      const payload = await req.json()
      console.log('Received WhatsApp Webhook:', JSON.stringify(payload, null, 2))

      const supabaseUrl = Deno.env.get('SUPABASE_URL')
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
      const supabase = supabaseUrl && supabaseServiceKey
        ? createClient(supabaseUrl, supabaseServiceKey)
        : null

      const entry = payload.entry?.[0]
      const changes = entry?.changes?.[0]
      const value = changes?.value
      const messages = value?.messages

      // 1. Log to Supabase
      if (supabase) {
        const firstMessage = messages?.[0]
        const messageBody =
          firstMessage?.text?.body
          ?? firstMessage?.interactive?.button_reply?.title
          ?? null

        const meta_info = {
          business_id: entry?.id,
          sender: firstMessage?.from,
          message_body: messageBody,
          display_phone_number: value?.metadata?.display_phone_number,
        }

        await supabase.from('whatsapp_logs').insert({ payload, meta_info })
      }
      
      // 2. Process Messages with OpenAI
      if (messages?.length > 0) {
        const message = messages[0]
        const from = message.from
        const phoneId = value?.metadata?.phone_number_id

        if (!from || !phoneId) {
          console.warn('Missing sender or phone number id in webhook payload.')
        } else {
          // Role selected via button tap
          const roleFromButton = roleFromButtonReplyId(message?.interactive?.button_reply?.id)
          if (roleFromButton) {
            if (supabase) await upsertUserRole(supabase, from, roleFromButton)
            await sendWhatsAppMessage(phoneId, from, roleWelcomeMessage(roleFromButton))
          } else if (message.type === 'text') {
            const userText = (message.text?.body || '').trim()
            const wantsRoleSwitch = /(^|\b)(switch role|change role|start over|restart)(\b|$)/i.test(userText)

            if (wantsRoleSwitch) {
              await sendRoleSelectionButtons(phoneId, from)
            } else {
              const selectedRole = supabase ? await getUserRole(supabase, from) : null

              // First touch: ask role before AI answers so guidance is role-specific.
              if (!selectedRole) {
                await sendRoleSelectionButtons(phoneId, from)
              } else {
                const aiResponse = await callOpenAI(userText, selectedRole)
                if (aiResponse) await sendWhatsAppMessage(phoneId, from, aiResponse)
              }
            }
          } else {
            // Non-text/non-button input: nudge back to role flow.
            const selectedRole = supabase ? await getUserRole(supabase, from) : null
            if (!selectedRole) await sendRoleSelectionButtons(phoneId, from)
            else await sendWhatsAppMessage(phoneId, from, 'Please send a text message and I will help right away.')
          }
        }
      }

      return new Response(JSON.stringify({ status: 'received' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    } catch (error) {
      console.error('Error processing webhook:', error)
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
  }

  return new Response('Method Not Allowed', { status: 405 })
})

function roleFromButtonReplyId(id?: string): RoleKey | null {
  if (!id) return null
  const button = ROLE_BUTTONS.find((b) => b.id === id)
  return button?.role ?? null
}

async function getUserRole(supabase: ReturnType<typeof createClient>, waPhone: string): Promise<RoleKey | null> {
  try {
    const { data, error } = await supabase
      .from('whatsapp_user_state')
      .select('selected_role')
      .eq('wa_phone', waPhone)
      .maybeSingle()

    if (error) {
      console.warn('Failed to load whatsapp_user_state:', error.message)
      return null
    }

    const role = data?.selected_role
    if (role === 'traveller' || role === 'hotel_manager' || role === 'tour_operator') return role
    return null
  } catch (err) {
    console.warn('Error reading whatsapp_user_state:', err)
    return null
  }
}

async function upsertUserRole(supabase: ReturnType<typeof createClient>, waPhone: string, role: RoleKey): Promise<void> {
  try {
    const { error } = await supabase
      .from('whatsapp_user_state')
      .upsert(
        {
          wa_phone: waPhone,
          selected_role: role,
          selected_role_label: ROLE_LABEL[role],
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'wa_phone' },
      )

    if (error) console.warn('Failed to upsert whatsapp_user_state:', error.message)
  } catch (err) {
    console.warn('Error upserting whatsapp_user_state:', err)
  }
}

function roleWelcomeMessage(role: RoleKey): string {
  switch (role) {
    case 'traveller':
      return 'Great, I will guide you as a Traveller. I can help with destinations, package options, and booking guidance. What destination are you planning for?'
    case 'hotel_manager':
      return 'Great, I will guide you as a Hotel Manager. I can help with hotel onboarding, package setup, calendar, and verification. Which step do you need right now?'
    case 'tour_operator':
      return 'Great, I will guide you as a Tour Operator. I can help with 7-step tour creation, pricing, itinerary, calendar, and verification. What do you want to set up first?'
  }
}

async function callOpenAI(text: string, role: RoleKey): Promise<string | null> {
    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) {
        console.error("Missing OPENAI_API_KEY. Cannot generate response.");
        return null;
    }

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: SYSTEM_PROMPT },
                    { role: "system", content: `User role is fixed for this chat: ${ROLE_LABEL[role]}. Tailor guidance strictly to this role.` },
                    { role: "user", content: text }
                ],
              temperature: 0.4,
              max_tokens: 180,
            }),
        });

        const data = await response.json();
        
        if (!response.ok) {
            console.error('OpenAI API Error:', data);
            return null;
        }

        return data.choices[0]?.message?.content || null;

    } catch (err) {
        console.error('Failed to call OpenAI:', err);
        return null; // Return null so we don't crash or send garbage
    }
}

async function sendRoleSelectionButtons(phoneId: string, to: string) {
  const accessToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN')
  if (!accessToken) {
    console.error('Missing WHATSAPP_ACCESS_TOKEN. Cannot send role buttons.')
    return
  }

  try {
    const response = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'interactive',
        interactive: {
          type: 'button',
          body: {
            text: 'Welcome to TripAvail. Choose your profile so I can guide you better.',
          },
          action: {
            buttons: ROLE_BUTTONS.map((b) => ({
              type: 'reply',
              reply: {
                id: b.id,
                title: b.title,
              },
            })),
          },
        },
      }),
    })

    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      console.error('WhatsApp API Error (role buttons):', data)
    } else {
      console.log('Role buttons sent successfully:', data)
    }
  } catch (err) {
    console.error('Failed to send role buttons:', err)
  }
}

async function sendWhatsAppMessage(phoneId: string, to: string, text: string) {
    const accessToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN');
    if (!accessToken) {
        console.error("Missing WHATSAPP_ACCESS_TOKEN. Cannot send message.");
        return;
    }

    try {
        const response = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messaging_product: "whatsapp",
                to: to,
                text: { body: text }
            }),
        });

        const data = await response.json();
        if (!response.ok) {
             console.error('WhatsApp API Error:', data);
        } else {
            console.log('Message sent successfully:', data);
        }
    } catch (err) {
        console.error('Failed to send WhatsApp message:', err);
    }
}
