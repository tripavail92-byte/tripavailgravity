import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { phone } = await req.json()

    // Validate phone number
    if (!phone || typeof phone !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Phone number is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()

    // Create Supabase client with service role key (for server-side operations)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Store OTP in database with 10-minute expiration
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()
    
    const { error: insertError } = await supabase
      .from('phone_otps')
      .insert({
        phone,
        otp,
        expires_at: expiresAt,
      })

    if (insertError) {
      throw new Error(`Failed to store OTP: ${insertError.message}`)
    }

    // Option 1: Send via Twilio (if credentials available)
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN')
    const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER')

    if (twilioAccountSid && twilioAuthToken && twilioPhoneNumber) {
      // Send SMS via Twilio
      const auth = btoa(`${twilioAccountSid}:${twilioAuthToken}`)
      
      const twilioResponse = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            From: twilioPhoneNumber,
            To: phone,
            Body: `Your TripAvail verification code is: ${otp}. Valid for 10 minutes.`,
          }).toString(),
        }
      )

      if (!twilioResponse.ok) {
        throw new Error(`Twilio SMS failed: ${twilioResponse.statusText}`)
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'OTP sent via SMS',
          otp: process.env.NODE_ENV === 'development' ? otp : undefined // Only show in dev
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    } else {
      // Fallback: Development mode - return OTP in response (log to console)
      console.log(`[DEV MODE] OTP for ${phone}: ${otp}`)
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'OTP generated (development mode - check logs)',
          otp, // In dev, return the OTP for testing
          expiresAt,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }
  } catch (error) {
    console.error('Error in send-phone-otp:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to send OTP' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
