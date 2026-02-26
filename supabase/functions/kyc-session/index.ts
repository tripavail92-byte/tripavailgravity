/**
 * kyc-session — token-based session fetch for the mobile capture flow.
 *
 * We do NOT allow anon direct table reads via RLS.
 * Instead, this function validates `session_token` server-side using the service role key
 * and returns a minimal/safe payload.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
    let sessionToken = "";

    if (req.method === "GET") {
      const url = new URL(req.url);
      sessionToken = (url.searchParams.get("session_token") || "").trim();
    } else {
      const body = await req.json();
      sessionToken = (body.session_token || "").trim();
    }

    if (!sessionToken) {
      return new Response(JSON.stringify({ error: "session_token is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: session, error } = await admin
      .from("kyc_sessions")
      .select(
        "id, status, expires_at, id_front_path, id_back_path, failure_code, failure_reason",
      )
      .eq("session_token", sessionToken)
      .single();

    if (error || !session) {
      return new Response(JSON.stringify({ error: "Invalid or not found session" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (new Date(session.expires_at) < new Date() || session.status === "expired") {
      return new Response(JSON.stringify({ error: "Session expired" }), {
        status: 410,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        id: session.id,
        status: session.status,
        expires_at: session.expires_at,
        has_id_front: !!session.id_front_path,
        has_id_back: !!session.id_back_path,
        failure_code: session.failure_code,
        failure_reason: session.failure_reason,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err: any) {
    console.error("[kyc-session]", err?.message || err);
    return new Response(JSON.stringify({ error: err?.message || "Server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
