/**
 * kyc-block-cnic — admin-only helper to block a CNIC via hashed registry.
 *
 * Body:
 *   { cnic_number: string, reason?: string }
 *
 * Computes:
 *   normalized_cnic = #####-#######-#
 *   cnic_hash = sha256(KYC_CNIC_HASH_PEPPER + normalized_cnic)
 *
 * Upserts into public.blocked_cnic_registry.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { verifySupabaseJwtFromRequest } from "../_shared/supabase_jwt.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function normalizeCnic(input: string): string | null {
  const digits = (input || "").replace(/\D/g, "");
  if (digits.length !== 13) return null;
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12, 13)}`;
}

async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const pepper = Deno.env.get("KYC_CNIC_HASH_PEPPER") ?? "";

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  try {
    const { userId } = await verifySupabaseJwtFromRequest(req, supabaseUrl);

    const { data: isAdminData, error: isAdminErr } = await admin.rpc("is_admin", {
      p_user_id: userId,
    });

    if (isAdminErr) {
      console.error("[kyc-block-cnic] is_admin RPC failed", isAdminErr);
      return new Response(JSON.stringify({ error: "Unable to verify admin" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (isAdminData !== true) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const raw = (body?.cnic_number || "").trim();
    const reason = (body?.reason || "Blocked by admin").toString();

    const normalized = normalizeCnic(raw);
    if (!normalized) {
      return new Response(JSON.stringify({ error: "Invalid CNIC" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cnicHash = await sha256Hex(`${pepper}${normalized}`);

    const { error: upsertErr } = await admin
      .from("blocked_cnic_registry")
      .upsert(
        {
          cnic_hash: cnicHash,
          reason,
          blocked_by_admin_id: userId,
        },
        { onConflict: "cnic_hash" },
      );

    if (upsertErr) {
      console.error("[kyc-block-cnic] upsert failed", upsertErr);
      return new Response(JSON.stringify({ error: upsertErr.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, cnic_hash: cnicHash }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[kyc-block-cnic]", err?.message || err);
    return new Response(JSON.stringify({ error: err?.message || "Server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
