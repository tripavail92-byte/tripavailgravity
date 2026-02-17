import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
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

const serviceKey =
  envRoot.SUPABASE_SERVICE_ROLE_KEY || envSupabaseSecrets.SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceKey) {
  console.error('Missing SUPABASE_URL or SERVICE_ROLE_KEY in env files')
  process.exit(2)
}

const args = process.argv.slice(2)
const getArg = (name) => {
  const idx = args.indexOf(name)
  if (idx === -1) return null
  return args[idx + 1] || null
}

const emailFromArg = getArg('--email')
const passwordFromArg = getArg('--password')

const email =
  emailFromArg ||
  envRoot.ADMIN_SEED_EMAIL ||
  'superadmin@tripavail.local'

const password =
  passwordFromArg ||
  envRoot.ADMIN_SEED_PASSWORD ||
  crypto.randomBytes(18).toString('base64url')

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

console.log('Seeding super admin (no secrets printed)')
console.log('Supabase host:', new URL(supabaseUrl).host)

// 1) Create auth user
const { data: created, error: createError } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
})

if (createError) {
  console.error('Failed to create auth user:', createError.message)
  process.exit(1)
}

const userId = created.user?.id
if (!userId) {
  console.error('Auth user created but missing id')
  process.exit(1)
}

// 2) Insert into admin_users
const { error: insertError } = await supabase
  .from('admin_users')
  .upsert(
    {
      id: userId,
      email,
      role: 'super_admin',
    },
    { onConflict: 'id' }
  )

if (insertError) {
  console.error('Failed to insert admin_users:', insertError.message)
  process.exit(1)
}

console.log('✅ Super admin seeded')
console.log('Email:', email)
console.log('User ID:', userId)
console.log('Password (save this now):', password)
