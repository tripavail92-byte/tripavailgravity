
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

        // ── Secrets ──────────────────────────────────────────────────────────
        const openaiKey      = Deno.env.get('OPENAI_API_KEY');
        const azureFaceKey   = Deno.env.get('AZURE_FACE_KEY');
        const azureEndpoint  = Deno.env.get('AZURE_FACE_ENDPOINT'); // e.g. https://tripavail-face.cognitiveservices.azure.com/
        const supabaseUrl    = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey    = Deno.env.get('SERVICE_ROLE_KEY')!;

        const supabase = createClient(supabaseUrl, supabaseKey);

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

        /**
         * Azure Face API — detect face in an image, return faceId.
         * Uses URL-based detection (no need to upload binary).
         */
        const azureDetectFace = async (imageUrl: string): Promise<string | null> => {
            if (!azureFaceKey || !azureEndpoint) throw new Error('Azure Face API credentials not set');
            const detectUrl = `${azureEndpoint}face/v1.0/detect?detectionModel=detection_03&returnFaceId=true&recognitionModel=recognition_04`;
            const res = await fetch(detectUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Ocp-Apim-Subscription-Key': azureFaceKey,
                },
                body: JSON.stringify({ url: imageUrl }),
            });
            const faces = await res.json();
            if (!res.ok) throw new Error(`Azure Detect Error: ${JSON.stringify(faces)}`);
            if (!Array.isArray(faces) || faces.length === 0) return null;
            return faces[0].faceId as string;
        };

        /**
         * Azure Face API — verify two faceIds match.
         * Returns { isIdentical, confidence } where confidence is 0–1.
         */
        const azureVerifyFaces = async (faceId1: string, faceId2: string) => {
            if (!azureFaceKey || !azureEndpoint) throw new Error('Azure Face API credentials not set');
            const verifyUrl = `${azureEndpoint}face/v1.0/verify`;
            const res = await fetch(verifyUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Ocp-Apim-Subscription-Key': azureFaceKey,
                },
                body: JSON.stringify({ faceId1, faceId2 }),
            });
            const result = await res.json();
            if (!res.ok) throw new Error(`Azure Verify Error: ${JSON.stringify(result)}`);
            return result as { isIdentical: boolean; confidence: number };
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

        // ── 4. Face Match — Azure Face API (real biometrics) ─────────────────
        } else if (taskType === 'face_match') {
            eventType = 'biometric_match';

            // Step 1: Detect face on ID card photo
            const idFaceId = await azureDetectFace(idCardUrl);
            if (!idFaceId) {
                aiResult = { match: false, score: 0, reason: 'No face detected on the ID card. Ensure the front side with your photo is uploaded.' };
            } else {
                // Step 2: Detect face in selfie
                const selfieFaceId = await azureDetectFace(selfieUrl);
                if (!selfieFaceId) {
                    aiResult = { match: false, score: 0, reason: 'No face detected in the selfie. Ensure your face is clearly visible and well-lit.' };
                } else {
                    // Step 3: Compare biometric embeddings
                    const verification = await azureVerifyFaces(idFaceId, selfieFaceId);
                    const score = Math.round(verification.confidence * 100);
                    // Azure threshold: >= 0.5 = same person (recognition_04 model)
                    // We use 60% as minimum for safety margin
                    const MATCH_THRESHOLD = 60;
                    aiResult = {
                        match: score >= MATCH_THRESHOLD,
                        score,
                        reason: score >= MATCH_THRESHOLD
                            ? `Azure Face AI confirmed identity match with ${score}% biometric confidence.`
                            : `Biometric match failed (${score}% confidence, minimum ${MATCH_THRESHOLD}% required). Please retake your selfie in good lighting, holding your ID next to your face.`,
                        isIdentical: verification.isIdentical,
                    };
                }
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
