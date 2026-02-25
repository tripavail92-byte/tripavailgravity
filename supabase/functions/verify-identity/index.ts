
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { idCardUrl, selfieUrl, userId, role, taskType } = await req.json();

        // ── Basic field validation ─────────────────────────────────────────────
        if (!taskType) {
            return new Response(JSON.stringify({ error: 'taskType is required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        if (['validate_id', 'validate_id_back', 'extract_ocr'].includes(taskType) && !idCardUrl) {
            return new Response(JSON.stringify({ error: 'idCardUrl is required for ' + taskType }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        if (taskType === 'face_match' && (!idCardUrl || !selfieUrl)) {
            return new Response(JSON.stringify({ match: false, score: 0, reason: 'idCardUrl and selfieUrl are both required for face_match' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // ── Secrets ──────────────────────────────────────────────────────────
        const openaiKey      = Deno.env.get('OPENAI_API_KEY');
        const faceApiUrl     = Deno.env.get('FACE_API_URL');    // Railway DeepFace service
        const faceApiSecret  = Deno.env.get('FACE_API_SECRET'); // shared Bearer token
        const supabaseUrl    = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey    = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

        const supabase = createClient(supabaseUrl, supabaseKey);

        // ── Rate Limiter: max 10 attempts per userId per 24 h ─────────────────
        if (userId) {
            const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            const { count, error: countErr } = await supabase
                .from('verification_activity_logs')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId)
                .gte('created_at', since);
            if (!countErr && (count ?? 0) >= 10) {
                return new Response(
                    JSON.stringify({ error: 'Too many verification attempts. Please try again after 24 hours.' }),
                    { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }
        }

        // ── Helpers ───────────────────────────────────────────────────────────
        /** Convert a public URL to base64 data URI (for OpenAI) */
        const imageUrlToBase64 = async (url: string): Promise<string> => {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Failed to fetch image (${response.status}): ${url}`);
            const arrayBuffer = await response.arrayBuffer();
            const bytes = new Uint8Array(arrayBuffer);
            let binary = '';
            for (let i = 0; i < bytes.byteLength; i += 0x8000) {
                binary += String.fromCharCode(...bytes.subarray(i, Math.min(i + 0x8000, bytes.byteLength)));
            }
            const mimeType = response.headers.get('content-type') || 'image/jpeg';
            return `data:${mimeType};base64,${btoa(binary)}`;
        };

        /** Call GPT-4o-mini vision with a single image */
        const gptVision = async (prompt: string, imageBase64: string, extraImages: string[] = []) => {
            if (!openaiKey) throw new Error('OPENAI_API_KEY not set');
            const content: any[] = [
                { type: "text", text: prompt },
                { type: "image_url", image_url: { url: imageBase64 } },
                ...extraImages.map(img => ({ type: "image_url", image_url: { url: img } }))
            ];
            const res = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openaiKey}` },
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: [{ role: "user", content }],
                    max_tokens: 400,
                    response_format: { type: "json_object" }
                })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error.message);
            return JSON.parse(data.choices[0].message.content);
        };

        // ── Task Handlers ─────────────────────────────────────────────────────
        let aiResult: any = { valid: false, reason: "Task type not recognized" };
        let eventType = 'unknown';

        // ── 1. Validate ID Front (GPT) ────────────────────────────────────────
        if (taskType === 'validate_id') {
            eventType = 'document_validation';
            const idBase64 = await imageUrlToBase64(idCardUrl);
            aiResult = await gptVision(
                `Analyze this image strictly. Is it a clear, un-cropped, unexpired government-issued ID (CNIC, Passport, or Driver's License)?
                 Check: (1) Is it blurry? (2) Is there glare covering text? (3) Are any edges cut off? (4) Does it look like a screenshot or photocopy?
                 Return ONLY JSON: { "valid": boolean, "reason": string, "docType": string }`,
                idBase64
            );

        // ── 2. Validate ID Back (GPT) ─────────────────────────────────────────
        } else if (taskType === 'validate_id_back') {
            eventType = 'document_validation_back';
            const idBase64 = await imageUrlToBase64(idCardUrl);
            aiResult = await gptVision(
                `Analyze this image. Is it the BACK side of a government-issued ID card (CNIC back, passport data page back, or driver's license back)?
                 Check quality: (1) Is it blurry? (2) Is there heavy glare? (3) Are edges cut off?
                 Return ONLY JSON: { "valid": boolean, "reason": string }`,
                idBase64
            );

        // ── 3. OCR — Extract structured data from ID Front (GPT) ─────────────
        } else if (taskType === 'extract_ocr') {
            eventType = 'ocr_extraction';
            const idBase64 = await imageUrlToBase64(idCardUrl);
            aiResult = await gptVision(
                `Extract all readable text from this government ID card. Return ONLY JSON with these fields (use null if not found):
                 {
                   "fullName": string | null,
                   "fatherName": string | null,
                   "dateOfBirth": string | null,
                   "idNumber": string | null,
                   "expiryDate": string | null,
                   "gender": string | null,
                   "address": string | null,
                   "docType": string | null
                 }
                 For idNumber: if CNIC, format as XXXXX-XXXXXXX-X.`,
                idBase64
            );

            // CNIC format validation
            if (aiResult.idNumber) {
                const cnicPattern = /^\d{5}-\d{7}-\d{1}$/;
                aiResult.cnicValid = cnicPattern.test(aiResult.idNumber);
                // Check expiry
                if (aiResult.expiryDate) {
                    try {
                        const parts = aiResult.expiryDate.split(/[-\/]/);
                        const expiry = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
                        aiResult.expired = expiry < new Date();
                    } catch { aiResult.expired = null; }
                }
            }

        // ── 4. Face Match — Railway DeepFace (FaceNet-512) → GPT-4o-mini fallback ──
        } else if (taskType === 'face_match') {
            eventType = 'biometric_match';

            // ── Tier 1: Railway DeepFace (FaceNet-512) ───────────────────────
            if (faceApiUrl && faceApiSecret) {
                try {
                    const faceRes = await fetch(`${faceApiUrl.replace(/\/$/, '')}/verify`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${faceApiSecret}`,
                        },
                        body: JSON.stringify({ id_url: idCardUrl, selfie_url: selfieUrl }),
                        signal: AbortSignal.timeout(25_000), // 25 s timeout
                    });
                    if (faceRes.ok) {
                        const r = await faceRes.json();
                        aiResult = {
                            match:  r.match,
                            score:  r.score,
                            method: r.method || 'deepface',
                            reason: r.reason,
                            distance: r.distance,
                        };
                    } else {
                        const err = await faceRes.text();
                        console.warn(`[face-api] HTTP ${faceRes.status}: ${err.slice(0, 200)}`);
                    }
                } catch (railwayErr: any) {
                    console.warn('[face-api] Railway unreachable, falling back to GPT:', railwayErr.message);
                }
            }

            // ── Tier 2: GPT-4o-mini visual comparison (fallback if Railway fails) ─
            if (!aiResult.method) {
                const [idBase64, selfieBase64] = await Promise.all([
                    imageUrlToBase64(idCardUrl),
                    imageUrlToBase64(selfieUrl),
                ]);
                const gptResult = await gptVision(
                    `Compare the person's face in Image 1 (government ID card) with Image 2 (selfie).
                     Are they the same person? Consider jaw shape, eye spacing, nose, overall facial structure.
                     Ignore lighting, age differences (within 10 years), glasses, or head angle.
                     Return ONLY JSON: { "match": boolean, "confidence": number (0-100), "reason": string }`,
                    idBase64, [selfieBase64]
                );
                const score = Math.round(gptResult.confidence ?? 0);
                const MATCH_THRESHOLD = 70;
                aiResult = {
                    match:  score >= MATCH_THRESHOLD && gptResult.match === true,
                    score,
                    method: 'gpt_vision',
                    reason: (score >= MATCH_THRESHOLD && gptResult.match)
                        ? `GPT-4o visual analysis confirmed identity match (${score}% confidence).`
                        : gptResult.reason || `Face match failed (${score}%). Please retake your selfie.`,
                };
            }
        }

        // ── Log to Supabase ───────────────────────────────────────────────────
        const ip = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || null;
        const { error: logError } = await supabase.from('verification_activity_logs').insert({
            user_id: userId,
            role: role,
            event_type: eventType,
            status: (aiResult.valid || aiResult.match) ? 'success' : 'failure',
            details: { ...aiResult, _ip: ip },
        });
        if (logError) console.error('Logging Error:', logError);

        return new Response(JSON.stringify(aiResult), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error: any) {
        console.error('verify-identity error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});
