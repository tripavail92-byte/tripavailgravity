/**
 * kyc-signed-url — returns a short-lived signed URL for a private KYC image.
 *
 * Auth required (Bearer JWT). Allowed if requester is:
 * - the session owner, OR
 * - an admin (public.is_admin)
 *
 * Supports both:
 *   A) Field-based lookup  (field: "id_front" | "id_back") — uses kyc_sessions paths
 *   B) Document-based lookup (doc_type: "cnic_front" | ...) — uses kyc_documents table
 *
 * Auto-detects which bucket to sign from (new 'kyc' bucket or legacy 'tour-operator-assets').
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const KYC_BUCKET    = "kyc";
const LEGACY_BUCKET = "tour-operator-assets";

/** Try signing from KYC bucket first, fall back to legacy bucket */
async function signUrl(
  admin: ReturnType<typeof createClient>,
  path: string,
  expiresIn = 120,
): Promise<string | null> {
  // Try primary KYC bucket
  const { data, error } = await admin.storage.from(KYC_BUCKET).createSignedUrl(path, expiresIn);
  if (!error && data?.signedUrl) return data.signedUrl;

  // Fall back to legacy bucket (for old sessions)
  const { data: legData, error: legError } = await admin.storage.from(LEGACY_BUCKET).createSignedUrl(path, expiresIn);
  if (!legError && legData?.signedUrl) return legData.signedUrl;

  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  try {
    // Verify caller identity using the service-role admin client (no external JWT lib needed).
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace(/^bearer\s+/i, "").trim();
    if (!token) {
      return new Response(JSON.stringify({ error: "Missing auth token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: { user }, error: authErr } = await admin.auth.getUser(token);
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = user.id;

    const body         = await req.json();
    const sessionId    = (body.session_id    || "").trim();
    const sessionToken = (body.session_token || "").trim();
    const field        = (body.field         || "").trim();   // "id_front" | "id_back"
    const docType      = (body.doc_type      || "").trim();   // "cnic_front" | "cnic_back" | ...
    const operatorId   = (body.operator_id   || "").trim();   // for doc_type lookup

    // ── Validate admin / owner permission ─────────────────────────────────────
    const { data: isAdminData } = await admin.rpc("is_admin", { p_user_id: userId });
    const isAdmin = isAdminData === true;

    // ── Path A: doc_type lookup (from kyc_documents table) ───────────────────
    if (docType && operatorId) {
      if (!isAdmin && operatorId !== userId) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: doc, error: docErr } = await admin
        .from("kyc_documents")
        .select("file_path")
        .eq("operator_id", operatorId)
        .eq("document_type", docType)
        .eq("is_current", true)
        .single();

      if (docErr || !doc?.file_path) {
        return new Response(JSON.stringify({ error: "Document not found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const signedUrl = await signUrl(admin, doc.file_path);
      if (!signedUrl) {
        return new Response(JSON.stringify({ error: "Could not generate signed URL" }), {
          status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ signedUrl, expiresIn: 120 }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Path B: session-based lookup (field: id_front | id_back) ────────────
    if (!field || !["id_front", "id_back"].includes(field)) {
      return new Response(JSON.stringify({ error: "field must be id_front or id_back, or provide doc_type + operator_id" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!sessionId && !sessionToken) {
      return new Response(JSON.stringify({ error: "session_id or session_token is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const query = admin
      .from("kyc_sessions")
      .select("id, user_id, id_front_path, id_back_path")
      .limit(1);

    const { data: session, error: sessionErr } = sessionId
      ? await query.eq("id", sessionId).single()
      : await query.eq("session_token", sessionToken).single();

    if (sessionErr || !session) {
      return new Response(JSON.stringify({ error: "Session not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isOwner = session.user_id === userId;
    if (!isOwner && !isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const path = field === "id_front" ? session.id_front_path : session.id_back_path;
    if (!path) {
      return new Response(JSON.stringify({ error: "Image not uploaded" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const signedUrl = await signUrl(admin, path);
    if (!signedUrl) {
      return new Response(JSON.stringify({ error: "Failed to generate signed URL — check bucket policies" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ signedUrl, expiresIn: 120 }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error("[kyc-signed-url]", err?.message || err);
    return new Response(JSON.stringify({ error: err?.message || "Server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
