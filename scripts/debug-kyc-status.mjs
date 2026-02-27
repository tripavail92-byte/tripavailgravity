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

function loadEnvFiles(filePaths) {
  return filePaths.reduce((acc, p) => Object.assign(acc, loadEnvFile(p)), {})
}

async function main() {
  const email = process.env.KYC_DEBUG_EMAIL || 'cultural-tours@tripavail.demo'
  const mode = (process.env.KYC_DEBUG_MODE || '').toLowerCase()
  const requeueSessionId = process.env.KYC_REQUEUE_SESSION_ID || null

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
      'Missing Supabase credentials. Provide SUPABASE_URL (or VITE_SUPABASE_URL / EDGE_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY (or SERVICE_ROLE_KEY) via env vars or .env/supabase-secrets.env',
    )
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  if (requeueSessionId) {
    const { data, error } = await admin
      .from('kyc_sessions')
      .update({ status: 'processing', failure_code: null, failure_reason: null })
      .eq('id', requeueSessionId)
      .select('id, status')
      .single()

    if (error) throw new Error(`Failed to requeue session: ${error.message}`)
    console.log(JSON.stringify({ requeued: data }, null, 2))
    return
  }

  if (mode === 'processing') {
    const { data, error } = await admin
      .from('kyc_sessions')
      .select('id, user_id, role, status, created_at, failure_code')
      .eq('status', 'processing')
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) throw new Error(`Failed to query processing sessions: ${error.message}`)
    console.log(JSON.stringify({ processing: data ?? [] }, null, 2))
    return
  }

  const { data: users, error: usersErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 2000 })
  if (usersErr) throw new Error(`listUsers failed: ${usersErr.message}`)

  const user = users?.users?.find((u) => (u.email || '').toLowerCase() === email.toLowerCase())
  if (!user) {
    process.exitCode = 2
    console.error('No user found for:', email)
    return
  }

  const { data: sessions, error: sessErr } = await admin
    .from('kyc_sessions')
    .select('id, role, status, expires_at, created_at, id_front_path, id_back_path, failure_code, failure_reason, cnic_number, expiry_date')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  if (sessErr) throw new Error(`kyc_sessions query failed: ${sessErr.message}`)

  console.log(
    JSON.stringify(
      {
        email,
        user_id: user.id,
        sessions: (sessions || []).map((s) => ({
          id: s.id,
          role: s.role,
          status: s.status,
          created_at: s.created_at,
          expires_at: s.expires_at,
          has_id_front: !!s.id_front_path,
          has_id_back: !!s.id_back_path,
          failure_code: s.failure_code,
          failure_reason: s.failure_reason,
          cnic_number_present: !!s.cnic_number,
          expiry_date: s.expiry_date,
        })),
      },
      null,
      2,
    ),
  )
}

main().catch((err) => {
  process.exitCode = 1
  console.error(err?.message ?? err)
})
