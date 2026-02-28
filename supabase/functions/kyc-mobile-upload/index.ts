/**
 * kyc-mobile-upload — receives a KYC image from the mobile capture page,
 * validates the session token, stores the image in Supabase Storage using
 * the service role key, then patches the kyc_sessions row.
 *
 * Simplified flow: CNIC front/back only (no selfie, no face scanning).
 * Storage is PRIVATE; we store STORAGE PATHS in:
 *   - kyc_sessions.id_front_path / id_back_path
 *   - kyc_documents table (versioned per operator)
 *
 * Deterministic storage path:
 *   kyc/tour_operators/{user_id}/cnic/{front|back}_v{n}.{ext}
 *
 * After both images uploaded (status → processing):
 *   - Calls verify-identity edge fn (extract_ocr task)
 *   - Writes structured OCR fields back to kyc_sessions
 *   - Moves session to pending_admin_review
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
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
  'Access-Control-Max-Age': '86400',
};

// Primary KYC bucket (deterministic paths per operator)
const KYC_BUCKET = 'kyc';
// Legacy fallback bucket (old sessions still stored here)
const LEGACY_BUCKET = 'tour-operator-assets';

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Parse image bytes + extension from multipart or JSON/base64 body */
async function parseBody(req: Request): Promise<{ sessionToken: string; field: string; imageBytes: Uint8Array; ext: string }> {
  const contentType = req.headers.get('content-type') || '';
  if (contentType.includes('multipart/form-data')) {
    const form = await req.formData();
    const sessionToken = (form.get('session_token') as string)?.trim();
    const field        = (form.get('field') as string)?.trim();
    const file         = form.get('image') as File;
    if (!file) throw new Error('image file is required');
    const imageBytes = new Uint8Array(await file.arrayBuffer());
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    return { sessionToken, field, imageBytes, ext };
  } else {
    const body = await req.json();
    const sessionToken = body.session_token?.trim();
    const field        = body.field?.trim();
    const b64          = (body.image as string).replace(/^data:[^;]+;base64,/, '');
    const imageBytes   = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    return { sessionToken, field, imageBytes, ext: 'jpg' };
  }
}

/** Determine the next version number for a document type for a given operator */
async function nextVersion(
  admin: ReturnType<typeof createClient>,
  operatorId: string,
  docType: string,
): Promise<number> {
  const { data, error } = await admin
    .from('kyc_documents')
    .select('version')
    .eq('operator_id', operatorId)
    .eq('document_type', docType)
    .order('version', { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) return 1;
  return (data[0].version as number) + 1;
}

/** Build the deterministic storage path for a KYC document */
function buildStoragePath(
  operatorId: string,
  docType: 'cnic_front' | 'cnic_back',
  version: number,
  ext: string,
): string {
  // e.g. kyc/tour_operators/{uuid}/cnic/front_v2.jpg
  const dir  = docType === 'cnic_front' ? 'front' : 'back';
  return `kyc/tour_operators/${operatorId}/cnic/${dir}_v${version}.${ext}`;
}

/** Generate a short-lived signed URL for a private storage path */
async function signPath(
  admin: ReturnType<typeof createClient>,
  bucket: string,
  path: string,
): Promise<string | null> {
  const { data, error } = await admin.storage.from(bucket).createSignedUrl(path, 300);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

// ── Main handler ───────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceKey) {
    console.error('[kyc-mobile-upload] Missing required env vars', {
      hasSupabaseUrl: !!supabaseUrl, hasServiceKey: !!serviceKey,
    });
    return new Response(JSON.stringify({
      error: 'Server misconfigured: missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY',
    }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  try {
    const { sessionToken, field, imageBytes, ext } = await parseBody(req);

    const validFields = ['id_front', 'id_back'];
    if (!sessionToken || !field || !validFields.includes(field)) {
      return new Response(JSON.stringify({ error: 'Invalid session_token or field' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Load and validate session ─────────────────────────────────────────────
    const { data: session, error: sessErr } = await admin
      .from('kyc_sessions')
      .select('id, user_id, status, expires_at, id_front_path, id_back_path')
      .eq('session_token', sessionToken)
      .single();

    if (sessErr || !session) {
      return new Response(JSON.stringify({ error: 'Session not found' }), {
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

    const operatorId = session.user_id as string;
    const docType: 'cnic_front' | 'cnic_back' = field === 'id_front' ? 'cnic_front' : 'cnic_back';

    // ── Determine version (enterprise: never overwrite originals) ─────────────
    const version = await nextVersion(admin, operatorId, docType);

    // ── Deterministic storage path ───────────────────────────────────────────
    const storagePath = buildStoragePath(operatorId, docType, version, ext);

    // Mark previous docs for this type as not current
    await admin
      .from('kyc_documents')
      .update({ is_current: false })
      .eq('operator_id', operatorId)
      .eq('document_type', docType);

    // ── Upload to KYC bucket ──────────────────────────────────────────────────
    const mimeType = ext === 'pdf'
      ? 'application/pdf'
      : `image/${ext === 'jpg' ? 'jpeg' : ext}`;

    const { error: uploadErr } = await admin.storage
      .from(KYC_BUCKET)
      .upload(storagePath, imageBytes, { contentType: mimeType, upsert: false });

    if (uploadErr) throw new Error(`Storage upload failed: ${uploadErr.message}`);

    // ── Insert versioned record in kyc_documents ──────────────────────────────
    const { error: docInsertErr } = await admin
      .from('kyc_documents')
      .insert({
        operator_id:    operatorId,
        document_type:  docType,
        file_path:      storagePath,
        version,
        is_current:     true,
        status:         'pending',
        kyc_session_id: session.id,
      });

    if (docInsertErr) {
      console.warn('[kyc-mobile-upload] kyc_documents insert failed:', docInsertErr.message);
      // Non-fatal — continue with session update
    }

    // ── Patch the session row ─────────────────────────────────────────────────
    const pathField  = field === 'id_front' ? 'id_front_path' : 'id_back_path';
    const willHaveFront = (pathField === 'id_front_path') || !!session.id_front_path;
    const willHaveBack  = (pathField === 'id_back_path')  || !!session.id_back_path;
    const bothUploaded  = willHaveFront && willHaveBack;

    const sessionPatch: Record<string, unknown> = {
      [pathField]:   storagePath,
      status:        bothUploaded ? 'processing' : 'uploading',
      failure_code:  null,
      failure_reason: null,
    };

    const { error: updErr } = await admin
      .from('kyc_sessions')
      .update(sessionPatch)
      .eq('id', session.id);

    if (updErr) throw new Error(`Failed to update session: ${updErr.message}`);

    // ── Auto-OCR when both images are available ───────────────────────────────
    // Setting status = 'processing' is enough — the Python EasyOCR worker
    // polls for sessions in this state, runs OCR, extracts all fields, and
    // moves the session to 'pending_admin_review' when done.
    // We do NOT call verify-identity or any external AI API here.
    if (bothUploaded) {
      console.log('[kyc-mobile-upload] Both images uploaded — session queued for OCR worker', session.id);
    }

    return new Response(
      JSON.stringify({ path: storagePath, status: sessionPatch.status, version }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );

  } catch (err: any) {
    console.error('[kyc-mobile-upload]', err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
