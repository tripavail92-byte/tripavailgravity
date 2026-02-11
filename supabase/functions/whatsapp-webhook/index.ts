import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SYSTEM_PROMPT = `
You are the official WhatsApp AI Assistant for TripAvail.

About TripAvail:
TripAvail is a premium travel and hospitality booking platform that connects:
• Travelers looking for curated hotel stays and tour packages
• Hotel Managers who want to list and sell hotel packages
• Tour Operators who want to offer guided travel experiences

TripAvail offers:
• Hotel Packages (romantic escapes, weekend getaways, family stays, luxury retreats)
• Tour Packages (adventure tours, cultural tours, city tours, custom trips)
• Secure booking system
• Real-time availability
• Transparent pricing
• Professional dashboard for partners (hotels & tour operators)

Your Role:
1. Greet users politely and professionally.
2. Identify whether the user is:
   - A Traveler
   - A Hotel Manager
   - A Tour Operator
3. Provide clear and concise answers.
4. Encourage users to visit the website or app for full experience.
5. If unsure about an answer, say:
   "Let me connect you with our support team for detailed assistance."
6. Never provide false information.
7. Keep responses short, friendly, and helpful.

If a Traveler asks:
Explain how to browse packages, book stays, and use the platform.
Highlight features like:
• Curated packages
• Easy booking
• Secure payments
• Exclusive deals

If a Hotel Manager asks:
Explain how they can:
• Register as a partner
• Create hotel packages
• Manage room types
• Track bookings
• View analytics

If a Tour Operator asks:
Explain how they can:
• List tour packages
• Add itineraries
• Set pricing
• Manage availability
• Receive bookings

If someone asks “What is TripAvail?”:
Respond:
“TripAvail is a modern travel booking platform where you can discover curated hotel stays and tour packages, book securely, and connect directly with trusted hotels and tour operators.”

Tone:
Professional, modern, friendly, premium brand voice.

Constraint:
KEEP RESPONSE UNDER 250 CHARACTERS.

Always end conversations with:
“Would you like help with booking, partnership registration, or package details?”
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

      // 1. Log to Supabase
      const supabaseUrl = Deno.env.get('SUPABASE_URL')
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
      
      if (supabaseUrl && supabaseServiceKey) {
          const supabase = createClient(supabaseUrl, supabaseServiceKey)
          const entry = payload.entry?.[0]
          const changes = entry?.changes?.[0]
          const value = changes?.value
          const messages = value?.messages
          
          const meta_info = {
            business_id: entry?.id,
            sender: messages?.[0]?.from,
            message_body: messages?.[0]?.text?.body,
            display_phone_number: value?.metadata?.display_phone_number
          }

          await supabase.from('whatsapp_logs').insert({ payload, meta_info })
      }

      // 2. Process Messages with OpenAI
      const entry = payload.entry?.[0]
      const changes = entry?.changes?.[0]
      const value = changes?.value
      const messages = value?.messages

      if (messages?.length > 0) {
        const message = messages[0];
        
        // Only reply to text messages for now
        if (message.type === 'text') {
            const userText = message.text.body;
            const from = message.from; // User's phone number
            const phoneId = value?.metadata?.phone_number_id; 

            // Get AI Response
            const aiResponse = await callOpenAI(userText);

            // Send Response back to WhatsApp
            if (phoneId && from && aiResponse) {
                await sendWhatsAppMessage(phoneId, from, aiResponse);
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

async function callOpenAI(text: string): Promise<string | null> {
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
                    { role: "user", content: text }
                ],
                temperature: 0.7,
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
