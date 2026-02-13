
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"; // Standard Supabase Client

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    // Handle CORS preflight request
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { idCardUrl, selfieUrl, userId, role, taskType } = await req.json();

        // Validate API Key
        const apiKey = Deno.env.get('OPENAI_API_KEY');
        if (!apiKey) {
            throw new Error('OPENAI_API_KEY is not set in Edge Function secrets.');
        }

        // Initialize Supabase Client (Service Role for Logging)
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        let aiResult: any = { valid: false, reason: "Task type not recognized" };
        let eventType = 'unknown';

        if (taskType === 'validate_id') {
            eventType = 'document_validation';
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: [
                        {
                            role: "user",
                            content: [
                                { type: "text", text: "Analyze this image. Is it a valid government-issued ID (Passport, ID Card, or Driver's License)? Also check for quality: is it blurry, is there heavy glare, or is the document cut off? Return ONLY a JSON object with keys: 'valid' (boolean) and 'reason' (string, if invalid explaining why, if valid confirming document type)." },
                                { type: "image_url", image_url: { url: idCardUrl } }
                            ]
                        }
                    ],
                    max_tokens: 200,
                    response_format: { type: "json_object" }
                })
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error.message);
            aiResult = JSON.parse(data.choices[0].message.content);

        } else if (taskType === 'face_match') {
            eventType = 'biometric_match';
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: [
                        {
                            role: "user",
                            content: [
                                { type: "text", text: "Analyze these two images. Image 1 is a Government ID. Image 2 is a selfie of a person holding that ID. 1) Does the person in the selfie match the photo on the ID? 2) Is the person in the selfie CLEARLY holding the same ID card shown in Image 1? 3) Return a similarity score (0-100) and a detailed justification. Return ONLY a JSON object with keys: 'match' (boolean), 'score' (number), and 'reason' (string)." },
                                { type: "image_url", image_url: { url: idCardUrl } },
                                { type: "image_url", image_url: { url: selfieUrl } }
                            ]
                        }
                    ],
                    max_tokens: 300,
                    response_format: { type: "json_object" }
                })
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error.message);
            aiResult = JSON.parse(data.choices[0].message.content);
        }

        // Log to Supabase
        const { error: logError } = await supabase.from('verification_activity_logs').insert({
            user_id: userId,
            role: role,
            event_type: eventType,
            status: (aiResult.valid || aiResult.match) ? 'success' : 'failure',
            details: aiResult
        });

        if (logError) console.error('Logging Error:', logError);

        return new Response(JSON.stringify(aiResult), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});
