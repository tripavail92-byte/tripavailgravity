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

const envRoot = readEnvFile(path.join(root, '.env'))
const envSupabaseSecrets = readEnvFile(path.join(root, 'supabase-secrets.env'))

const supabaseUrl =
  process.env.VITE_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.EDGE_SUPABASE_URL ||
  envRoot.VITE_SUPABASE_URL ||
  envRoot.NEXT_PUBLIC_SUPABASE_URL ||
  envSupabaseSecrets.EDGE_SUPABASE_URL

const anonKey =
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  envRoot.VITE_SUPABASE_ANON_KEY ||
  envRoot.NEXT_PUBLIC_SUPABASE_ANON_KEY

function env(key) {
  return process.env[key] || envRoot[key] || envSupabaseSecrets[key] || ''
}

const creds = {
  user: {
    email: env('RBAC_USER_EMAIL'),
    password: env('RBAC_USER_PASSWORD'),
  },
  support: {
    email: env('RBAC_SUPPORT_EMAIL'),
    password: env('RBAC_SUPPORT_PASSWORD'),
  },
  admin: {
    email: env('RBAC_ADMIN_EMAIL'),
    password: env('RBAC_ADMIN_PASSWORD'),
  },
}

const missing = []
if (!supabaseUrl) missing.push('SUPABASE URL (VITE_SUPABASE_URL / EDGE_SUPABASE_URL)')
if (!anonKey) missing.push('SUPABASE ANON KEY (VITE_SUPABASE_ANON_KEY)')
if (!creds.user.email || !creds.user.password) missing.push('RBAC_USER_EMAIL / RBAC_USER_PASSWORD')
if (!creds.support.email || !creds.support.password) missing.push('RBAC_SUPPORT_EMAIL / RBAC_SUPPORT_PASSWORD')
if (!creds.admin.email || !creds.admin.password) missing.push('RBAC_ADMIN_EMAIL / RBAC_ADMIN_PASSWORD')

if (missing.length) {
  console.error('Missing required env vars:')
  for (const m of missing) console.error(' - ' + m)
  process.exit(2)
}

function makeClient() {
  return createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

async function signIn(client, email, password) {
  const { data, error } = await client.auth.signInWithPassword({ email, password })
  if (error) throw error
  if (!data?.user) throw new Error('No user returned from signIn')
  return data.user
}

async function expectRpcError({ label, call, mustInclude }) {
  const { error } = await call()
  if (!error) {
    throw new Error(`[FAIL] ${label}: expected error, got success`)
  }

  const msg = String(error.message || '')
  if (!mustInclude.some((needle) => msg.toLowerCase().includes(needle.toLowerCase()))) {
    throw new Error(`[FAIL] ${label}: unexpected error: ${msg}`)
  }

  console.log(`[OK] ${label}: denied (${msg})`)
}

async function expectRpcSuccess({ label, call }) {
  const { error } = await call()
  if (error) {
    throw new Error(`[FAIL] ${label}: expected success, got error: ${error.message}`)
  }
  console.log(`[OK] ${label}: success`)
}

function uuid() {
  return crypto.randomUUID()
}

async function main() {
  console.log('RBAC test script')
  console.log('URL host:', new URL(supabaseUrl).host)

  // 1) Normal user should be denied for admin RPCs
  const cUser = makeClient()
  const user = await signIn(cUser, creds.user.email, creds.user.password)
  console.log('[INFO] Signed in as normal user:', user.id)

  await expectRpcError({
    label: 'normal user: admin_moderate_package denied',
    call: () => cUser.rpc('admin_moderate_package', { p_package_id: uuid(), p_status: 'hidden', p_reason: 'rbac test reason 12345' }),
    mustInclude: ['admin privileges required'],
  })

  await expectRpcError({
    label: 'normal user: admin_set_traveler_status denied',
    call: () => cUser.rpc('admin_set_traveler_status', { p_user_id: uuid(), p_status: 'suspended', p_reason: 'rbac test reason 12345' }),
    mustInclude: ['admin privileges required'],
  })

  // Create a report (used for support/admin positive tests)
  const reportPayload = {
    reporter_id: user.id,
    target_entity_type: 'package',
    target_entity_id: uuid(),
    report_reason: 'rbac test report',
    details: 'created by scripts/test-rbac.mjs',
  }

  const { data: reportRow, error: reportInsertError } = await cUser
    .from('reports')
    .insert(reportPayload)
    .select('id')
    .single()

  if (reportInsertError) throw reportInsertError
  const reportId = reportRow.id
  console.log('[INFO] Created report:', reportId)

  await expectRpcError({
    label: 'normal user: admin_set_report_status denied',
    call: () => cUser.rpc('admin_set_report_status', { p_report_id: reportId, p_status: 'resolved', p_reason: 'rbac test reason 12345' }),
    mustInclude: ['admin privileges required'],
  })

  // 2) Support: suspend listing/user denied; close report allowed (resolved/dismissed only)
  const cSupport = makeClient()
  const support = await signIn(cSupport, creds.support.email, creds.support.password)
  console.log('[INFO] Signed in as support admin:', support.id)

  await expectRpcError({
    label: 'support: admin_moderate_package denied',
    call: () => cSupport.rpc('admin_moderate_package', { p_package_id: uuid(), p_status: 'suspended', p_reason: 'rbac test reason 12345' }),
    mustInclude: ['insufficient privileges'],
  })

  await expectRpcError({
    label: 'support: admin_set_traveler_status denied',
    call: () => cSupport.rpc('admin_set_traveler_status', { p_user_id: uuid(), p_status: 'suspended', p_reason: 'rbac test reason 12345' }),
    mustInclude: ['insufficient privileges'],
  })

  await expectRpcError({
    label: 'support: admin_set_report_status in_review denied',
    call: () => cSupport.rpc('admin_set_report_status', { p_report_id: reportId, p_status: 'in_review', p_reason: 'rbac test reason 12345' }),
    mustInclude: ['insufficient privileges'],
  })

  await expectRpcSuccess({
    label: 'support: admin_set_report_status resolved allowed',
    call: () => cSupport.rpc('admin_set_report_status', { p_report_id: reportId, p_status: 'resolved', p_reason: 'rbac test reason 12345' }),
  })

  // 3) Admin: should be able to move report to in_review
  const cAdmin = makeClient()
  const admin = await signIn(cAdmin, creds.admin.email, creds.admin.password)
  console.log('[INFO] Signed in as admin:', admin.id)

  await expectRpcSuccess({
    label: 'admin: admin_set_report_status in_review allowed',
    call: () => cAdmin.rpc('admin_set_report_status', { p_report_id: reportId, p_status: 'in_review', p_reason: 'rbac test reason 12345' }),
  })

  // Optional: try a reversible package moderation if a package id is provided/found.
  const packageIdFromEnv = env('RBAC_TEST_PACKAGE_ID')
  let packageId = packageIdFromEnv

  if (!packageId) {
    const { data } = await cAdmin.from('packages').select('id').limit(1)
    packageId = Array.isArray(data) ? data[0]?.id : undefined
  }

  if (packageId) {
    await expectRpcSuccess({
      label: 'admin: admin_moderate_package hide allowed',
      call: () => cAdmin.rpc('admin_moderate_package', { p_package_id: packageId, p_status: 'hidden', p_reason: 'rbac test reason 12345' }),
    })

    await expectRpcSuccess({
      label: 'admin: admin_moderate_package unhide allowed',
      call: () => cAdmin.rpc('admin_moderate_package', { p_package_id: packageId, p_status: 'live', p_reason: 'rbac test reason 12345' }),
    })
  } else {
    console.log('[WARN] Skipping package moderation test (no package id found)')
  }

  console.log('RBAC tests complete')
}

main().catch((err) => {
  console.error(String(err?.stack || err))
  process.exit(1)
})
