import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

function loadDotEnv(filePath) {
  if (!fs.existsSync(filePath)) return
  const content = fs.readFileSync(filePath, 'utf8')
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const eqIdx = line.indexOf('=')
    if (eqIdx === -1) continue
    const key = line.slice(0, eqIdx).trim()
    let value = line.slice(eqIdx + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = value
  }
}

loadDotEnv(path.resolve(process.cwd(), '.env'))

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !anonKey || !serviceRoleKey) {
  console.error('Missing env vars. Required: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const client = createClient(supabaseUrl, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

async function main() {
  const runId = crypto.randomUUID().slice(0, 8)
  const email = `smoke.${runId}@example.com`
  const password = `Smoke!${crypto.randomUUID()}`

  let userId
  let objectPath

  console.log('🔎 Smoke test: user-avatars bucket + policies')
  console.log('Creating temporary user:', email)

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (createErr) throw createErr
  userId = created.user?.id
  if (!userId) throw new Error('Failed to create user (missing id)')

  console.log('Signing in...')
  const { data: signedIn, error: signInErr } = await client.auth.signInWithPassword({
    email,
    password,
  })
  if (signInErr) throw signInErr
  if (!signedIn.session) throw new Error('No session returned from sign-in')

  const now = Date.now()
  objectPath = `${userId}/smoke-${now}.txt`
  const body = new Blob([`ok:${runId}:${now}`], { type: 'text/plain' })

  console.log('Uploading test object to user-avatars:', objectPath)
  const { error: uploadErr } = await client.storage
    .from('user-avatars')
    .upload(objectPath, body, { upsert: true, contentType: 'text/plain' })

  if (uploadErr) throw uploadErr

  const { data: publicUrlData } = client.storage
    .from('user-avatars')
    .getPublicUrl(objectPath)

  const publicUrl = publicUrlData?.publicUrl
  if (!publicUrl) throw new Error('No publicUrl returned')

  console.log('Fetching public URL...')
  const res = await fetch(publicUrl)
  const text = await res.text()

  if (!res.ok) {
    throw new Error(`Public fetch failed: ${res.status} ${res.statusText} body=${text.slice(0, 200)}`)
  }

  if (!text.startsWith(`ok:${runId}:`)) {
    throw new Error(`Public fetch returned unexpected body: ${text.slice(0, 200)}`)
  }

  console.log('✅ Upload succeeded (authenticated)')
  console.log('✅ Public read succeeded')
  console.log('Public URL:', publicUrl)

  console.log('Cleaning up uploaded object...')
  const { error: removeErr } = await client.storage
    .from('user-avatars')
    .remove([objectPath])
  if (removeErr) {
    console.warn('⚠️  Failed to delete test object:', removeErr.message || removeErr)
  }

  console.log('Cleaning up user...')
  const { error: deleteUserErr } = await admin.auth.admin.deleteUser(userId)
  if (deleteUserErr) {
    console.warn('⚠️  Failed to delete test user:', deleteUserErr.message || deleteUserErr)
  }
}

main().catch((err) => {
  console.error('❌ Smoke test failed:', err?.message || err)
  process.exit(1)
})
