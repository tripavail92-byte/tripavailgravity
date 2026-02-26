/**
 * kyc-mobile-upload — receives a KYC image from the mobile capture page,
 * validates the session token, stores the image in Supabase Storage using
 * the service role key, then patches the kyc_sessions row.
 *
 * Simplified flow: CNIC front/back only (no selfie, no face scanning).
 * Storage is private; we store STORAGE PATHS (not public URLs).
 *
 * Body (multipart/form-data OR application/json with base64):
 *   session_token  string   — token from the QR code URL
 *   field          string   — "id_front" | "id_back"
 *   image          File | base64 string — the captured image
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BUCKET = 'tour-operator-assets';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl  = Deno.env.get('SUPABASE_URL')!;
  const serviceKey   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  try {
    const contentType = req.headers.get('content-type') || '';
    let sessionToken: string;
    let field: string;
    let imageBytes: Uint8Array;
    let ext = 'jpg';

    if (contentType.includes('multipart/form-data')) {
      // Multipart upload (preferred — avoids base64 overhead)
      const form = await req.formData();
      sessionToken = (form.get('session_token') as string)?.trim();
      field        = (form.get('field') as string)?.trim();
      const file   = form.get('image') as File;
      if (!file) throw new Error('image file is required');
      imageBytes   = new Uint8Array(await file.arrayBuffer());
      ext = file.name.split('.').pop() || 'jpg';
    } else {
      // JSON with base64 image
      const body = await req.json();
      sessionToken = body.session_token?.trim();
      field        = body.field?.trim();
      const b64    = (body.image as string).replace(/^data:[^;]+;base64,/, '');
      imageBytes   = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    }

    // Validate inputs
    const validFields = ['id_front', 'id_back'];
    if (!sessionToken || !field || !validFields.includes(field)) {
      return new Response(JSON.stringify({ error: 'Invalid session_token or field' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Load + validate session
    const { data: session, error: sessErr } = await admin
      .from('kyc_sessions')
      .select('id, user_id, status, expires_at, id_front_path, id_back_path')
      .eq('session_token', sessionToken)
      .single();

    if (sessErr || !session) {
      return new Response(JSON.stringify({ error: 'Invalid or not found session' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (new Date(session.expires_at) < new Date() || session.status === 'expired') {
      return new Response(JSON.stringify({ error: 'Session expired' }), {
        status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (['approved', 'rejected'].includes(session.status)) {
      return new Response(JSON.stringify({ error: 'Session already reviewed' }), {
        status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Upload to Storage
    const storagePath = `verification/kyc-sessions/${session.id}/${field}.${ext}`;
    const { error: uploadErr } = await admin.storage
      .from(BUCKET)
      .upload(storagePath, imageBytes, {
        contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
        upsert: true,
      });

    if (uploadErr) throw new Error(`Storage upload failed: ${uploadErr.message}`);

    // Patch the session row (store private path)
    const pathField = field === 'id_front' ? 'id_front_path' : 'id_back_path';
    const patch: Record<string, unknown> = {
      [pathField]: storagePath,
      status: 'uploading',
      failure_code: null,
      failure_reason: null,
    };

    // If this upload completes the set, move to processing for the OCR worker
    const willHaveFront = (pathField === 'id_front_path') || !!session.id_front_path;
    const willHaveBack = (pathField === 'id_back_path') || !!session.id_back_path;
    if (willHaveFront && willHaveBack) {
      patch.status = 'processing';
    }

    const { error: updErr } = await admin
      .from('kyc_sessions')
      .update(patch)
      .eq('session_token', sessionToken);

    if (updErr) throw new Error(`Failed to update session: ${updErr.message}`);

    return new Response(JSON.stringify({ path: storagePath, status: patch.status }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    console.error('[kyc-mobile-upload]', err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
