import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zkhppxjeaizpyinfpecj.supabase.co'
const supabaseServiceKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpraHBweGplYWl6cHlpbmZwZWNqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTYzMDk0MiwiZXhwIjoyMDg1MjA2OTQyfQ.zt1KEbgD-NdBV0DoltpjF2iJF8p_uxsue2q2eOfP-fQ'
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
  console.log('🔄 Checking setup_current_step column on tour_operator_profiles...')

  // Check if column already exists via information_schema
  const { data: colExists } = await supabase
    .from('information_schema.columns')
    .select('column_name')
    .eq('table_schema', 'public')
    .eq('table_name', 'tour_operator_profiles')
    .eq('column_name', 'setup_current_step')
    .maybeSingle()

  if (colExists) {
    console.log('✅ Column setup_current_step already exists.')
    return
  }

  console.log('ℹ️  Column missing. Attempting to add via exec_sql RPC...')
  const { error: rpcError } = await supabase.rpc('exec_sql', {
    sql_string:
      'ALTER TABLE public.tour_operator_profiles ADD COLUMN IF NOT EXISTS setup_current_step INTEGER DEFAULT 0;',
  })

  if (!rpcError) {
    console.log('✅ setup_current_step column added successfully via exec_sql RPC')
    return
  }

  console.error('❌ Column does not exist and cannot be added automatically.')
  console.error('\n👉  Run this SQL in the Supabase dashboard SQL editor:\n')
  console.log(
    'ALTER TABLE public.tour_operator_profiles\n  ADD COLUMN IF NOT EXISTS setup_current_step INTEGER DEFAULT 0;\n',
  )
  process.exit(1)
}

runMigration()
