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
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    out[key] = val
  }
  return out
}

function getArg(flag) {
  const idx = process.argv.indexOf(flag)
  if (idx === -1) return null
  return process.argv[idx + 1] || null
}

function hasFlag(flag) {
  return process.argv.includes(flag)
}

const envRoot = readEnvFile(path.join(root, '.env'))
const envSupabaseSecrets = readEnvFile(path.join(root, 'supabase-secrets.env'))

function envAny(key) {
  return process.env[key] || envRoot[key] || envSupabaseSecrets[key] || ''
}

const supabaseUrl =
  process.env.VITE_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.EDGE_SUPABASE_URL ||
  envRoot.VITE_SUPABASE_URL ||
  envRoot.NEXT_PUBLIC_SUPABASE_URL ||
  envSupabaseSecrets.EDGE_SUPABASE_URL

const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SERVICE_ROLE_KEY ||
  envRoot.SUPABASE_SERVICE_ROLE_KEY ||
  envSupabaseSecrets.SERVICE_ROLE_KEY

const superEmail =
  getArg('--super') ||
  envAny('RBAC_ADMIN_EMAIL') ||
  null

const supportEmail =
  getArg('--support') ||
  envAny('RBAC_SUPPORT_EMAIL') ||
  null

const normalEmail =
  getArg('--user') ||
  envAny('RBAC_USER_EMAIL') ||
  null

const superPassword = getArg('--super-password') || envAny('RBAC_ADMIN_PASSWORD') || null
const supportPassword = getArg('--support-password') || envAny('RBAC_SUPPORT_PASSWORD') || null
const normalPassword = getArg('--user-password') || envAny('RBAC_USER_PASSWORD') || null

const createMissing = hasFlag('--create-missing')
const ensurePasswords = hasFlag('--ensure-passwords')

const missing = []
if (!supabaseUrl) missing.push('SUPABASE URL (VITE_SUPABASE_URL / EDGE_SUPABASE_URL)')
if (!serviceKey) missing.push('SERVICE ROLE KEY (SUPABASE_SERVICE_ROLE_KEY / SERVICE_ROLE_KEY)')
if (!superEmail) missing.push('--super <email> (or RBAC_ADMIN_EMAIL)')
if (!supportEmail) missing.push('--support <email> (or RBAC_SUPPORT_EMAIL)')
if (!normalEmail) missing.push('--user <email> (or RBAC_USER_EMAIL)')

if (missing.length) {
  console.error('Missing required inputs:')
  for (const m of missing) console.error(' - ' + m)
  process.exit(2)
}

const supabaseService = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

async function findUserIdByEmail(email) {
  let page = 1
  const perPage = 1000
  for (;;) {
    const { data, error } = await supabaseService.auth.admin.listUsers({ page, perPage })
    if (error) throw error

    const users = data?.users || []
    const found = users.find((u) => (u.email || '').toLowerCase() === email.toLowerCase())
    if (found) return found.id

    if (users.length < perPage) break
    page += 1
  }
  return null
}

function generatePassword() {
  // 24 chars base64url ~= 18 bytes; strong enough for test accounts.
  return crypto.randomBytes(18).toString('base64url')
}

async function ensureAuthUser({ email, password, label }) {
  const existingId = await findUserIdByEmail(email)
  if (existingId) return { id: existingId, created: false, password: null, label }

  if (!createMissing) {
    return { id: null, created: false, password: null }
  }

  const effectivePassword = password || generatePassword()

  const { data, error } = await supabaseService.auth.admin.createUser({
    email,
    password: effectivePassword,
    email_confirm: true,
    user_metadata: {
      seeded_by: 'assign-admin-roles.mjs',
      seeded_label: label,
    },
  })

  if (error) {
    // If race/duplicate happens, try a refetch.
    const msg = String(error.message || '')
    if (msg.toLowerCase().includes('already') && msg.toLowerCase().includes('registered')) {
      const refetched = await findUserIdByEmail(email)
      return { id: refetched, created: false, password: null }
    }
    throw error
  }

  const userId = data?.user?.id || null
  return { id: userId, created: true, password: effectivePassword, label }
}

async function updatePassword(userId, password) {
  const { error } = await supabaseService.auth.admin.updateUserById(userId, {
    password,
    email_confirm: true,
  })
  if (error) throw error
}

async function upsertAdminUser(userId, email, role) {
  const { error } = await supabaseService
    .from('admin_users')
    .upsert({ id: userId, email, role }, { onConflict: 'id' })
  if (error) throw error
}

async function removeAdminUser(userId) {
  const { error } = await supabaseService.from('admin_users').delete().eq('id', userId)
  if (error) throw error
}

async function main() {
  console.log('Assigning admin roles (service role)')
  console.log('URL host:', new URL(supabaseUrl).host)

  if (createMissing) {
    console.log('[INFO] --create-missing enabled: missing Auth users will be created')
  }

  const superEnsured = await ensureAuthUser({ email: superEmail, password: superPassword, label: 'super_admin' })
  const supportEnsured = await ensureAuthUser({ email: supportEmail, password: supportPassword, label: 'support' })
  const normalEnsured = await ensureAuthUser({ email: normalEmail, password: normalPassword, label: 'normal_user' })

  const superId = superEnsured.id
  const supportId = supportEnsured.id
  const normalId = normalEnsured.id

  const notFound = []
  if (!superId) notFound.push(`super: ${superEmail}`)
  if (!supportId) notFound.push(`support: ${supportEmail}`)
  if (!normalId) notFound.push(`user: ${normalEmail}`)

  if (notFound.length) {
    console.error('These auth users were not found (create them first via signup/login or Supabase Auth dashboard):')
    for (const x of notFound) console.error(' - ' + x)

    if (!createMissing) {
      console.error('Tip: rerun with --create-missing and optionally pass passwords:')
      console.error(
        '  node scripts/assign-admin-roles.mjs --create-missing --super <email> --support <email> --user <email> --super-password <pw> --support-password <pw> --user-password <pw>'
      )
      console.error('Or set env vars: RBAC_ADMIN_PASSWORD / RBAC_SUPPORT_PASSWORD / RBAC_USER_PASSWORD')
    }
    process.exit(1)
  }

  // Optionally ensure we know passwords for RBAC test users.
  if (ensurePasswords) {
    console.log('[INFO] --ensure-passwords enabled: setting passwords for test accounts')

    const passwordUpdates = [
      { who: 'admin', email: superEmail, ensured: superEnsured, envKey: 'RBAC_ADMIN_PASSWORD', preferred: superPassword },
      { who: 'support', email: supportEmail, ensured: supportEnsured, envKey: 'RBAC_SUPPORT_PASSWORD', preferred: supportPassword },
      { who: 'user', email: normalEmail, ensured: normalEnsured, envKey: 'RBAC_USER_PASSWORD', preferred: normalPassword },
    ]

    const changed = []
    for (const item of passwordUpdates) {
      if (!item.ensured?.id) continue

      // If account was created in this run, keep the created password unless an explicit preferred password was provided.
      if (item.ensured.created && !item.preferred) continue

      // If it already existed and no preferred password provided, generate one (only when explicitly ensuring passwords).
      const newPassword = item.preferred || generatePassword()

      await updatePassword(item.ensured.id, newPassword)
      changed.push({ ...item, newPassword })
    }

    if (changed.length) {
      console.log('[INFO] Passwords set/updated. Save these now (test accounts):')
      for (const x of changed) {
        console.log(` - ${x.who}: ${x.email} -> ${x.envKey}=${x.newPassword}`)
      }
    }
  }

  // If we created accounts (or generated passwords), print the passwords once.
  // This is intended for test accounts only.
  const created = [
    { who: 'admin', email: superEmail, ensured: superEnsured, envKey: 'RBAC_ADMIN_PASSWORD' },
    { who: 'support', email: supportEmail, ensured: supportEnsured, envKey: 'RBAC_SUPPORT_PASSWORD' },
    { who: 'user', email: normalEmail, ensured: normalEnsured, envKey: 'RBAC_USER_PASSWORD' },
  ].filter((x) => x.ensured?.created)

  if (created.length) {
    console.log('[INFO] Created missing Auth users. Save these passwords now (test accounts):')
    for (const x of created) {
      console.log(` - ${x.who}: ${x.email} -> ${x.envKey}=${x.ensured.password}`)
    }
  }

  await upsertAdminUser(superId, superEmail, 'super_admin')
  console.log('[OK] super_admin:', superEmail)

  await upsertAdminUser(supportId, supportEmail, 'support')
  console.log('[OK] support:', supportEmail)

  // Ensure the normal user is NOT an admin
  await removeAdminUser(normalId)
  console.log('[OK] normal user (not admin):', normalEmail)

  console.log('Done')
}

main().catch((err) => {
  console.error(String(err?.stack || err))
  process.exit(1)
})
