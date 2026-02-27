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

function requireEnv(env, key) {
  const value = process.env[key] || env[key]
  if (!value) throw new Error(`Missing env var: ${key}`)
  return value
}

function mask(value) {
  if (!value || typeof value !== 'string') return null
  if (value.length <= 16) return `${value.slice(0, 4)}…`
  return `${value.slice(0, 8)}…${value.slice(-4)}`
}

async function fetchJson(url, { headers = {}, method = 'GET', body = undefined } = {}) {
  const res = await fetch(url, { method, headers, body })
  const text = await res.text()
  let json = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = { _raw: text }
  }
  return { ok: res.ok, status: res.status, json, text }
}

async function main() {
  const env = loadEnvFiles(['.env', '.env.local', 'supabase-secrets.env'])

  const email = (process.env.KYC_DEBUG_EMAIL || process.env.DEBUG_EMAIL || 'cultural-tours@tripavail.demo').trim()

  const supabaseUrl = requireEnv(env, 'VITE_SUPABASE_URL')
  const anonKey = requireEnv(env, 'VITE_SUPABASE_ANON_KEY')
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY (needed to find latest session_token)')

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: users, error: usersErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 2000 })
  if (usersErr) throw new Error(`listUsers failed: ${usersErr.message}`)

  const user = users?.users?.find((u) => (u.email || '').toLowerCase() === email.toLowerCase())
  if (!user) {
    process.exitCode = 2
    console.error('No user found for:', email)
    return
  }

  const { data: session, error: sessionErr } = await admin
    .from('kyc_sessions')
    .select('id, user_id, role, status, session_token, expires_at, id_front_path, id_back_path, failure_code, failure_reason, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (sessionErr) throw new Error(`kyc_sessions query failed: ${sessionErr.message}`)
  if (!session) {
    console.log(JSON.stringify({ email, user_id: user.id, latest_session: null }, null, 2))
    return
  }

  const token = session.session_token
  const tokenUrl = `${supabaseUrl.replace(/\/$/, '')}/functions/v1/kyc-session?session_token=${encodeURIComponent(token)}`

  console.log('--- Latest KYC session (DB via service role) ---')
  console.log(
    JSON.stringify(
      {
        email,
        user_id: user.id,
        latest_session: {
          id: session.id,
          role: session.role,
          status: session.status,
          created_at: session.created_at,
          expires_at: session.expires_at,
          has_id_front: !!session.id_front_path,
          has_id_back: !!session.id_back_path,
          failure_code: session.failure_code,
          failure_reason: session.failure_reason,
          session_token_masked: mask(token),
        },
      },
      null,
      2,
    ),
  )

  console.log('\n--- kyc-session endpoint probe (anon) ---')
  console.log('URL:', tokenUrl)
  const probed = await fetchJson(tokenUrl, {
    method: 'GET',
    headers: {
      apikey: anonKey,
      authorization: `Bearer ${anonKey}`,
    },
  })
  console.log('HTTP:', probed.status)
  console.log('Body:', probed.json)

  if (!probed.ok) process.exitCode = 1
}

main().catch((err) => {
  process.exitCode = 1
  console.error(err?.message ?? err)
})
