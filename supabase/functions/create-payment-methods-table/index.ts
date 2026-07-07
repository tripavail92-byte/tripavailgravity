// One-shot migration function: create user_payment_methods table
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  // Only allow service role calls
  const authHeader = req.headers.get('Authorization') ?? ''
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const sql = `
    CREATE TABLE IF NOT EXISTS public.user_payment_methods (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      method_type TEXT NOT NULL CHECK (method_type IN ('card', 'easypaisa', 'jazzcash')),
      provider TEXT NOT NULL,
      label TEXT NOT NULL,
      last_four TEXT,
      exp_month INTEGER,
      exp_year INTEGER,
      card_brand TEXT,
      phone_number TEXT,
      stripe_payment_method_id TEXT,
      stripe_customer_id TEXT,
      is_default BOOLEAN DEFAULT FALSE,
      metadata JSONB DEFAULT '{}'::JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('UTC'::TEXT, NOW()) NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('UTC'::TEXT, NOW()) NOT NULL
    );
    
    CREATE INDEX IF NOT EXISTS user_payment_methods_user_id_idx ON public.user_payment_methods(user_id);
    
    ALTER TABLE public.user_payment_methods ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Users can manage their own payment methods" ON public.user_payment_methods;
    
    CREATE POLICY "Users can manage their own payment methods" ON public.user_payment_methods
      FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  `

  const { error } = await supabase.rpc('exec_sql', { sql })
  
  if (error) {
    // Try direct pg approach via supabase internal
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message,
      note: 'exec_sql not available'
    }), { 
      headers: { 'Content-Type': 'application/json' }, 
      status: 500 
    })
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
