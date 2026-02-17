import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

const root = process.cwd()

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {}
  const out = {}
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx === -1) continue
    const key = trimmed.slice(0, idx).trim()
    let val = trimmed.slice(idx + 1).trim()
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1)
    }
    out[key] = val
  }
  return out
}

const envRoot = readEnvFile(path.join(root, '.env'))
const envSupabaseSecrets = readEnvFile(path.join(root, 'supabase-secrets.env'))

const supabaseUrl =
  envRoot.VITE_SUPABASE_URL ||
  envRoot.NEXT_PUBLIC_SUPABASE_URL ||
  envSupabaseSecrets.EDGE_SUPABASE_URL

const anonKey = envRoot.VITE_SUPABASE_ANON_KEY || envRoot.NEXT_PUBLIC_SUPABASE_ANON_KEY

const serviceKey =
  envRoot.SUPABASE_SERVICE_ROLE_KEY || envSupabaseSecrets.SERVICE_ROLE_KEY

const missing = []
if (!supabaseUrl)
  missing.push('SUPABASE_URL (VITE_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL / EDGE_SUPABASE_URL)')
if (!anonKey) missing.push('ANON KEY (VITE_SUPABASE_ANON_KEY / NEXT_PUBLIC_SUPABASE_ANON_KEY)')
if (!serviceKey) missing.push('SERVICE ROLE KEY (SUPABASE_SERVICE_ROLE_KEY / SERVICE_ROLE_KEY)')

if (missing.length) {
  console.error('Missing required env vars:')
  for (const m of missing) console.error(' - ' + m)
  process.exit(2)
}

const supabaseAnon = createClient(supabaseUrl, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const supabaseService = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

async function checkSelect(client, label, table, columns) {
  const { data, error } = await client.from(table).select(columns).limit(1)
  if (error) return { ok: false, label, error: error.message }
  return { ok: true, label, rows: data?.length ?? 0 }
}

async function checkRpc(client, label, fnName, args) {
  const { data, error } = await client.rpc(fnName, args)
  if (error) return { ok: false, label, error: error.message }
  return { ok: true, label, data }
}

function print(result) {
  if (result.ok) {
    const suffix = typeof result.rows === 'number' ? ` (rows: ${result.rows})` : ''
    console.log(`[OK] ${result.label}${suffix}`)
  } else {
    console.log(`[FAIL] ${result.label}: ${result.error}`)
  }
}

function randomUuid() {
  return crypto.randomUUID()
}

console.log('Supabase connectivity check (secrets hidden)')
console.log('URL host:', new URL(supabaseUrl).host)

// Basic connectivity / schema existence checks
print(await checkSelect(supabaseAnon, 'anon SELECT packages (published/rls dependent)', 'packages', 'id'))
print(
  await checkSelect(
    supabaseService,
    'service SELECT packages moderation columns',
    'packages',
    'id,status,deleted_at,moderation_reason,moderated_at'
  )
)
print(
  await checkSelect(
    supabaseService,
    'service SELECT tours moderation columns',
    'tours',
    'id,status,deleted_at,moderation_reason,moderated_at'
  )
)
print(
  await checkSelect(
    supabaseService,
    'service SELECT profiles account_status columns',
    'profiles',
    'id,account_status,status_reason,status_updated_at'
  )
)

print(
  await checkSelect(
    supabaseService,
    'service SELECT admin_action_logs (latest row)',
    'admin_action_logs',
    'id,entity_type,action_type,created_at'
  )
)

print(
  await checkSelect(
    supabaseService,
    'service SELECT reports (latest row)',
    'reports',
    'id,status,target_entity_type,created_at'
  )
)

// Admin tables may be locked by RLS; service role should still be able to read admin_users
print(await checkSelect(supabaseService, 'service SELECT admin_users', 'admin_users', 'id,role,created_at'))

// RPC existence checks
print(await checkRpc(supabaseService, 'rpc is_admin exists', 'is_admin', { p_user_id: randomUuid() }))
print(
  await checkRpc(supabaseService, 'rpc get_admin_role exists', 'get_admin_role', {
    p_user_id: randomUuid(),
  })
)

const r = await checkRpc(supabaseService, 'rpc admin_log_action exists', 'admin_log_action', {
  p_entity_type: 'package',
  p_entity_id: randomUuid(),
  p_action_type: 'hide',
  p_reason: 'connectivity check',
  p_previous_state: { test: true },
  p_new_state: { test: true },
})

if (!r.ok && /Admin privileges required/i.test(r.error)) {
  console.log('[OK] rpc admin_log_action exists (blocked without admin auth)')
} else {
  print(r)
}
