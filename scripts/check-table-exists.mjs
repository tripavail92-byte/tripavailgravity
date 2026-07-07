import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

const SUPABASE_URL = 'https://zkhppxjeaizpyinfpecj.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpraHBweGplYWl6cHlpbmZwZWNqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTYzMDk0MiwiZXhwIjoyMDg1MjA2OTQyfQ.zt1KEbgD-NdBV0DoltpjF2iJF8p_uxsue2q2eOfP-fQ';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Check if the table already exists
const { data: existing, error: checkError } = await supabase
  .from('user_payment_methods')
  .select('id')
  .limit(1);

if (!checkError) {
  console.log('✅ Table user_payment_methods already exists!');
  process.exit(0);
}

console.log('Table check error:', checkError.message);
console.log('Proceeding with migration...');

// Since exec_sql RPC likely doesn't exist, try creating via the supabase admin API
// The service_role can't run arbitrary DDL via PostgREST
// We need to find another way

// Check if there's an exec_sql function available
const { data: rpcData, error: rpcError } = await supabase.rpc('exec_sql', { sql: 'SELECT 1' });
console.log('exec_sql RPC available:', !rpcError, rpcError?.message);
