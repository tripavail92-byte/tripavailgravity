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
  const email = process.env.KYC_DEBUG_EMAIL || process.env.DEBUG_EMAIL || 'cultural-tours@tripavail.demo'
  const env = loadEnvFiles(['.env', '.env.local', 'supabase-secrets.env'])

  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    env.SUPABASE_URL ||
    env.VITE_SUPABASE_URL

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SERVICE_ROLE_KEY ||
    env.SUPABASE_SERVICE_ROLE_KEY ||
    env.SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing SUPABASE_URL/VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env files')
  }

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

  const userId = user.id

  const [tour, hotel] = await Promise.all([
    admin
      .from('tour_operator_profiles')
      .select('user_id, company_name, verification_documents, verification_urls, updated_at')
      .eq('user_id', userId)
      .maybeSingle(),
    admin
      .from('hotel_manager_profiles')
      .select('user_id, business_name, verification_documents, verification_urls, updated_at')
      .eq('user_id', userId)
      .maybeSingle(),
  ])

  if (tour.error) console.warn('tour_operator_profiles error:', tour.error.message)
  if (hotel.error) console.warn('hotel_manager_profiles error:', hotel.error.message)

  console.log(
    JSON.stringify(
      {
        email,
        user_id: userId,
        tour_operator_profile: tour.data ?? null,
        hotel_manager_profile: hotel.data ?? null,
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
