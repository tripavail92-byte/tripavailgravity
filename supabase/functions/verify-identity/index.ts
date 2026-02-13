
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
        // Initialize Supabase Client (Service Role for Logging)
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SERVICE_ROLE_KEY')!; // Using custom key
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Helper to fetch and convert to base64
        const imageUrlToBase64 = async (url: string) => {
            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error(`Failed to fetch image (${response.status}): ${url}`);
                const arrayBuffer = await response.arrayBuffer();
                
                // Chunked conversion to avoid stack overflow
                const bytes = new Uint8Array(arrayBuffer);
                let binary = '';
                const len = bytes.byteLength;
                const CHUNK_SIZE = 0x8000; // 32k
                
                for (let i = 0; i < len; i += CHUNK_SIZE) {
                    const chunk = bytes.subarray(i, Math.min(i + CHUNK_SIZE, len));
                    binary += String.fromCharCode.apply(null, chunk as any);
                }
                
                const base64 = btoa(binary);
                const mimeType = response.headers.get('content-type') || 'image/jpeg';
                return `data:${mimeType};base64,${base64}`;
            } catch (error: any) {
                console.error('Image Fetch Error:', error);
                throw new Error(`Could not fetch image for AI analysis: ${error.message || error}`);
            }
        };

        let aiResult: any = { valid: false, reason: "Task type not recognized" };
        let eventType = 'unknown';

        if (taskType === 'validate_id') {
            eventType = 'document_validation';
            // Convert to Base64 to avoid OpenAI timeout/access issues
            const idBase64 = await imageUrlToBase64(idCardUrl);

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
                                { type: "image_url", image_url: { url: idBase64 } }
                            ]
                        }
                    ],
                    max_tokens: 200,
                    response_format: { type: "json_object" }
                })
            });
            // ... (rest is same)
            
            const data = await response.json();
            if (data.error) throw new Error(data.error.message);
            aiResult = JSON.parse(data.choices[0].message.content);

        } else if (taskType === 'face_match') {
            eventType = 'biometric_match';
            // Convert to Base64
            const idBase64 = await imageUrlToBase64(idCardUrl);
            const selfieBase64 = await imageUrlToBase64(selfieUrl);

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
                                { type: "image_url", image_url: { url: idBase64 } },
                                { type: "image_url", image_url: { url: selfieBase64 } }
                            ]
                        }
                    ],
                    max_tokens: 300,
                    response_format: { type: "json_object" }
                })
            });
            // ... (rest is same)

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
