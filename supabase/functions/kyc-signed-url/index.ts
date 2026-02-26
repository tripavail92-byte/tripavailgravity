/**
 * kyc-signed-url — returns a short-lived signed URL for a private KYC image.
 *
 * Auth required (Bearer JWT). Allowed if requester is:
 * - the session owner, OR
 * - an admin (public.is_admin)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { verifySupabaseJwtFromRequest } from "../_shared/supabase_jwt.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BUCKET = "tour-operator-assets";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  try {
    const { userId } = await verifySupabaseJwtFromRequest(req, supabaseUrl);

    const body = await req.json();
    const sessionId = (body.session_id || "").trim();
    const sessionToken = (body.session_token || "").trim();
    const field = (body.field || "").trim();

    if (!field || !["id_front", "id_back"].includes(field)) {
      return new Response(JSON.stringify({ error: "field must be id_front or id_back" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!sessionId && !sessionToken) {
      return new Response(JSON.stringify({ error: "session_id or session_token is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: isAdminData, error: isAdminErr } = await admin.rpc("is_admin", {
      p_user_id: userId,
    });

    if (isAdminErr) {
      console.error("[kyc-signed-url] is_admin RPC failed", isAdminErr);
    }

    const isOwner = session.user_id === userId;
    const isAdmin = isAdminData === true;

    if (!isOwner && !isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const path = field === "id_front" ? session.id_front_path : session.id_back_path;
    if (!path) {
      return new Response(JSON.stringify({ error: "Image not uploaded" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data, error } = await admin.storage.from(BUCKET).createSignedUrl(path, 60);
    if (error) throw new Error(`Failed to sign URL: ${error.message}`);

    return new Response(JSON.stringify({ signedUrl: data.signedUrl, expiresIn: 60 }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[kyc-signed-url]", err?.message || err);
    return new Response(JSON.stringify({ error: err?.message || "Server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
