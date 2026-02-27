import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'

function loadEnvFile(filePath) {
  const env = {}
  if (!fs.existsSync(filePath)) return env
  const text = fs.readFileSync(filePath, 'utf8')
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx === -1) continue
    const key = trimmed.slice(0, idx).trim()
    let value = trimmed.slice(idx + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    env[key] = value
  }
  return env
}

function loadEnvFiles(paths) {
  return paths.reduce((acc, p) => Object.assign(acc, loadEnvFile(p)), {})
}

async function main() {
  const env = loadEnvFiles(['.env', '.env.local', 'supabase-secrets.env'])

  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    process.env.EDGE_SUPABASE_URL ||
    env.SUPABASE_URL ||
    env.VITE_SUPABASE_URL ||
    env.EDGE_SUPABASE_URL

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SERVICE_ROLE_KEY ||
    env.SUPABASE_SERVICE_ROLE_KEY ||
    env.SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing Supabase credentials. Provide VITE_SUPABASE_URL (or SUPABASE_URL/EDGE_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY (or SERVICE_ROLE_KEY) in .env or supabase-secrets.env',
    )
  }

  const sqlPath = 'supabase/migrations/20260227000001_grant_service_role_partner_profiles.sql'
  const sql = fs.readFileSync(sqlPath, 'utf8')

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { error } = await supabase.rpc('exec_sql', { sql_string: sql })

  if (!error) {
    console.log('✅ Applied GRANT migration successfully via exec_sql RPC')
    return
  }

  console.error('❌ Failed to apply migration via exec_sql RPC:', error.message)
  console.error('\nRun this SQL in Supabase Dashboard → SQL Editor:')
  console.log('\n' + sql.trim() + '\n')
  process.exitCode = 1
}

main().catch((err) => {
  process.exitCode = 1
  console.error(err?.message ?? err)
})
