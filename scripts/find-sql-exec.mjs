import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zkhppxjeaizpyinfpecj.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpraHBweGplYWl6cHlpbmZwZWNqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTYzMDk0MiwiZXhwIjoyMDg1MjA2OTQyfQ.zt1KEbgD-NdBV0DoltpjF2iJF8p_uxsue2q2eOfP-fQ';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Try various known RPC functions that might run SQL
const candidates = ['run_sql', 'pg_execute', 'execute_sql', 'admin_sql', 'create_table'];

for (const fn of candidates) {
  const { error } = await supabase.rpc(fn, { sql: 'SELECT 1' });
  if (error) {
    console.log(`${fn}: not available (${error.message.split(' ').slice(0,5).join(' ')})`);
  } else {
    console.log(`${fn}: AVAILABLE!`);
  }
}

// Check if we can call edge functions
console.log('\nChecking edge functions...');
const { data: fnData, error: fnError } = await supabase.functions.invoke('health-check', { body: {} });
console.log('health-check:', fnError ? fnError.message : 'OK');
