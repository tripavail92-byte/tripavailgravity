/**
 * operator-doc-upload — receives a partner "trust document" (business registration,
 * insurance, vehicle docs, guide license, hotel title deed, …) from a LOGGED-IN
 * operator/hotel-manager and stores it in the PRIVATE `kyc` bucket, then records a
 * versioned row in kyc_documents. Reads are served by the existing kyc-signed-url
 * function (doc_type + operator_id path), owner-or-admin, short-lived signed URLs.
 *
 * Replaces the old flow where these docs were uploaded to the PUBLIC
 * tour-operator-assets bucket and their permanent public URLs were stored in
 * tour_operator_profiles.verification_urls (world-readable — the WS3 leak).
 *
 * SECURITY
 *   - Bearer JWT required. operator_id is taken from the VERIFIED token, never
 *     from the request body — so a caller cannot write documents under another
 *     operator's id.
 *   - document_type is validated against a trust-document allowlist (identity
 *     types like cnic_* are NOT accepted here; those go through the KYC flow).
 *   - Storage path keeps segment [3] = operator uid, matching the kyc bucket's
 *     owner RLS (kyc_owner_insert / kyc_owner_select).
 *
 * Body (multipart/form-data):
 *   subject_role   "tour_operator" | "hotel_manager"   (folder label only)
 *   document_type  one of TRUST_DOC_TYPES
 *   image          File — the document (image or PDF)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Max-Age": "86400",
};

const KYC_BUCKET = "kyc";

// Trust documents only. Identity docs (cnic_front/back, selfie) intentionally excluded —
// those are produced by the KYC capture flow, not this generic uploader.
const TRUST_DOC_TYPES = new Set([
  // operator settings-page trust docs
  "business_registration",
  "insurance",
  "vehicle_docs",
  "guide_license",
  // operator setup-wizard business docs (requiredBusinessDocs — PK + generic sets)
  "secp_certificate",
  "tourism_license",
  "tax_certificate",
  "tax_registration",
  "tour_license",
  // hotel setup-wizard property docs
  "title_deed",
  "utility_bill",
  "property_photo",
  "ownership_proof",
  "other",
]);

const ALLOWED_EXT = new Set(["jpg", "jpeg", "png", "webp", "pdf"]);
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB, matches the kyc bucket file_size_limit

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/** Next version number for (operator, document_type). */
async function nextVersion(
  admin: ReturnType<typeof createClient>,
  operatorId: string,
  docType: string,
): Promise<number> {
  const { data, error } = await admin
    .from("kyc_documents")
    .select("version")
    .eq("operator_id", operatorId)
    .eq("document_type", docType)
    .order("version", { ascending: false })
    .limit(1);
  if (error || !data || data.length === 0) return 1;
  return (data[0].version as number) + 1;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    console.error("[operator-doc-upload] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    return json(500, { error: "Server misconfigured" });
  }

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  try {
    // ── Authenticate: operator_id comes ONLY from the verified JWT ──────────────
    const token = (req.headers.get("authorization") || "").replace(/^bearer\s+/i, "").trim();
    if (!token) return json(401, { error: "Missing auth token" });

    const { data: { user }, error: authErr } = await admin.auth.getUser(token);
    if (authErr || !user) return json(401, { error: "Invalid or expired token" });
    const operatorId = user.id;

    // ── Parse + validate the multipart body ─────────────────────────────────────
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return json(400, { error: "Expected multipart/form-data" });
    }
    const form = await req.formData();
    const subjectRole = ((form.get("subject_role") as string) || "").trim();
    const documentType = ((form.get("document_type") as string) || "").trim();
    const file = form.get("image") as File | null;

    if (!TRUST_DOC_TYPES.has(documentType)) {
      return json(400, { error: `Unsupported document_type: ${documentType}` });
    }
    if (subjectRole !== "tour_operator" && subjectRole !== "hotel_manager") {
      return json(400, { error: "subject_role must be tour_operator or hotel_manager" });
    }
    if (!file) return json(400, { error: "image file is required" });

    // ── Authorize: the caller must actually be a partner of the claimed role ────
    // (getUser only proves *some* authenticated user; without this any signed-in
    //  traveller could dump files into the private KYC bucket and spam the review queue.)
    const profileTable = subjectRole === "hotel_manager" ? "hotel_manager_profiles" : "tour_operator_profiles";
    const { data: profileRow, error: profileErr } = await admin
      .from(profileTable)
      .select("user_id")
      .eq("user_id", operatorId)
      .maybeSingle();
    if (profileErr) throw new Error(`Profile lookup failed: ${profileErr.message}`);
    if (!profileRow) return json(403, { error: `Not a registered ${subjectRole}` });

    const bytes = new Uint8Array(await file.arrayBuffer());
    if (bytes.byteLength === 0) return json(400, { error: "Empty file" });
    if (bytes.byteLength > MAX_BYTES) return json(413, { error: "File exceeds 10 MB" });

    const ext = (file.name.split(".").pop() || "").toLowerCase();
    if (!ALLOWED_EXT.has(ext)) {
      return json(400, { error: `Unsupported file type: .${ext}` });
    }

    // ── Deterministic, owner-scoped storage path (segment [3] = operator uid) ────
    const roleFolder = subjectRole === "hotel_manager" ? "hotel_managers" : "tour_operators";
    const version = await nextVersion(admin, operatorId, documentType);
    const storagePath = `kyc/${roleFolder}/${operatorId}/${documentType}/v${version}.${ext}`;

    // Upload to the private bucket FIRST, so kyc_documents never points at a
    // missing object.
    const mimeType = ext === "pdf" ? "application/pdf" : `image/${ext === "jpg" ? "jpeg" : ext}`;
    const { error: uploadErr } = await admin.storage
      .from(KYC_BUCKET)
      .upload(storagePath, bytes, { contentType: mimeType, upsert: false });
    if (uploadErr) throw new Error(`Storage upload failed: ${uploadErr.message}`);

    // Atomic supersede + insert (single transaction). If this fails — including a
    // concurrent-upload race caught by the partial-unique index — the previous
    // current row is left intact, so a doc type never ends up with zero current rows.
    const { error: rpcErr } = await admin.rpc("kyc_document_supersede", {
      p_operator: operatorId,
      p_type: documentType,
      p_path: storagePath,
      p_version: version,
    });
    if (rpcErr) {
      // Roll back the orphaned object so storage and the table stay consistent.
      await admin.storage.from(KYC_BUCKET).remove([storagePath]);
      throw new Error(`kyc_documents supersede failed: ${rpcErr.message}`);
    }

    return json(200, { document_type: documentType, version, uploaded: true });
  } catch (err: any) {
    console.error("[operator-doc-upload]", err?.message || err);
    return json(500, { error: err?.message || "Server error" });
  }
});
