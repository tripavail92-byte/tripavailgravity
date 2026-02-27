/**
 * One-time cleanup: delete expired kyc_sessions that have no useful data.
 *
 * Removes sessions where:
 *   - expires_at is in the past (session is dead)
 *   - status is still 'uploading' or 'pending'  (never completed)
 *   - cnic_number IS NULL  (no OCR data extracted — no loss deleting them)
 *
 * Sessions with status pending_admin_review / approved / rejected / failed
 * are NEVER touched, even if expired.
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Load env from supabase-secrets.env
const envPath = resolve(__dirname, '../supabase-secrets.env')
const envLines = readFileSync(envPath, 'utf8').split('\n')
const env = {}
for (const line of envLines) {
  const [k, ...vs] = line.split('=')
  if (k && vs.length) env[k.trim()] = vs.join('=').trim()
}

const SUPABASE_URL = env.EDGE_SUPABASE_URL || env.SUPABASE_URL || process.env.SUPABASE_URL
const SERVICE_KEY  = env.SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in supabase-secrets.env')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
})

const now = new Date().toISOString()

// ── 1. Preview what will be deleted ─────────────────────────────────────────
const { data: preview, error: previewErr } = await supabase
  .from('kyc_sessions')
  .select('id,user_id,status,created_at,expires_at,cnic_number')
  .in('status', ['uploading', 'pending'])
  .lt('expires_at', now)
  .is('cnic_number', null)
  .order('created_at', { ascending: false })

if (previewErr) {
  console.error('Preview query failed:', previewErr.message)
  process.exit(1)
}

if (!preview || preview.length === 0) {
  console.log('✅ No stale sessions to clean up.')
  process.exit(0)
}

console.log(`\nFound ${preview.length} stale session(s) to delete:\n`)
for (const s of preview) {
  console.log(`  - ${s.id} | user: ${s.user_id} | status: ${s.status} | created: ${s.created_at} | expired: ${s.expires_at}`)
}

// ── 2. Delete them ────────────────────────────────────────────────────────────
const ids = preview.map((s) => s.id)
const { error: deleteErr, count } = await supabase
  .from('kyc_sessions')
  .delete({ count: 'exact' })
  .in('id', ids)

if (deleteErr) {
  console.error('\nDelete failed:', deleteErr.message)
  process.exit(1)
}

console.log(`\n✅ Deleted ${count ?? preview.length} stale kyc_session(s).`)
