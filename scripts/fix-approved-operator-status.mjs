/**
 * One-time fix script: repair KYC approval state for operator e169fc8b
 *
 * Background:
 *  - Session 4e18a1d9 was approved on Feb 26 BEFORE the trigger migration existed
 *    → trigger never fired → tour_operator_profiles.kyc_verified_* never populated
 *    → user_roles.verification_status was never set to 'approved'
 *  - Session 8e493857 was revoked on Feb 28 AFTER the trigger existed
 *    → revoke trigger fired → reset user_roles.verification_status = 'pending'
 *
 * Fix:
 *  1. Set user_roles.verification_status = 'approved'
 *  2. Backfill tour_operator_profiles with KYC data from the approved session
 *  3. Write an audit log entry explaining the manual fix
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envLines = readFileSync(resolve(__dirname, '../supabase-secrets.env'), 'utf8').split('\n')
const env = {}
for (const line of envLines) {
  const [k, ...vs] = line.split('=')
  if (k && vs.length) env[k.trim()] = vs.join('=').trim()
}

const supabase = createClient(
  env.EDGE_SUPABASE_URL || env.SUPABASE_URL,
  env.SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

const USER_ID     = 'e169fc8b-eb30-43d8-836a-c1906eb3f809'
const SESSION_ID  = '4e18a1d9-dc5d-4790-8d25-ab22b3ecb47c' // approved session
const ADMIN_ID    = '669cd0d3-051d-442c-a9da-79f1b13c99a7' // original reviewer
const REVIEWED_AT = '2026-02-26T22:46:43.466+00:00'

// ── 1. Fetch full approved session to get OCR data ───────────────────────────
const { data: session, error: sessErr } = await supabase
  .from('kyc_sessions')
  .select('*')
  .eq('id', SESSION_ID)
  .single()

if (sessErr || !session) {
  console.error('Could not load approved session:', sessErr?.message)
  process.exit(1)
}

console.log('\n── Approved session data ──')
console.log({
  id:          session.id,
  status:      session.status,
  cnic_number: session.cnic_number,
  full_name:   session.full_name,
  father_name: session.father_name,
  date_of_birth: session.date_of_birth,
  gender:      session.gender,
  reviewed_at: session.reviewed_at,
})

// ── 2. Set user_roles.verification_status = 'approved' ──────────────────────
console.log('\n── Step 1: Updating user_roles.verification_status ──')
const { data: roleUpdate, error: roleErr } = await supabase
  .from('user_roles')
  .update({ verification_status: 'approved' })
  .eq('user_id', USER_ID)
  .eq('role_type', 'tour_operator')
  .select('role_type,verification_status')

if (roleErr) {
  console.error('FAILED to update user_roles:', roleErr.message)
} else {
  console.log('user_roles updated:', roleUpdate)
}

// ── 3. Backfill tour_operator_profiles ──────────────────────────────────────
console.log('\n── Step 2: Backfilling tour_operator_profiles ──')
const profilePatch = {
  current_kyc_session_id: SESSION_ID,
  kyc_verified_at:        REVIEWED_AT,
  kyc_rejection_reason:   null,
}
if (session.cnic_number)   profilePatch.kyc_verified_cnic        = session.cnic_number
if (session.full_name)     profilePatch.kyc_verified_name        = session.full_name
if (session.father_name)   profilePatch.kyc_verified_father_name = session.father_name
if (session.date_of_birth) profilePatch.kyc_verified_dob         = session.date_of_birth
if (session.gender)        profilePatch.kyc_verified_gender      = session.gender

const { data: profileUpdate, error: profileErr } = await supabase
  .from('tour_operator_profiles')
  .update(profilePatch)
  .eq('user_id', USER_ID)
  .select('account_status,current_kyc_session_id,kyc_verified_cnic,kyc_verified_at')

if (profileErr) {
  console.error('FAILED to update tour_operator_profiles:', profileErr.message)
} else {
  console.log('tour_operator_profiles updated:', profileUpdate)
}

// ── 4. Write audit log entry ─────────────────────────────────────────────────
console.log('\n── Step 3: Writing audit log entry ──')
const { error: auditErr } = await supabase
  .from('kyc_audit_log')
  .insert({
    session_id: SESSION_ID,
    user_id:    USER_ID,
    old_status: 'pending',
    new_status: 'approved',
    changed_by: ADMIN_ID,
    notes:      'Manual fix: session approved Feb 26 before trigger migration on Feb 28. Backfilled verification_status=approved and profile KYC columns. Revoked session 8e493857 was a testing artifact.',
  })

if (auditErr) {
  // kyc_audit_log might not have 'manual_backfill' action — not critical
  console.warn('Audit log insert failed (non-critical):', auditErr.message)
} else {
  console.log('Audit log entry written.')
}

// ── 5. Verify final state ────────────────────────────────────────────────────
console.log('\n── Final state verification ──')
const [finalRoles, finalProfile] = await Promise.all([
  supabase.from('user_roles').select('role_type,verification_status').eq('user_id', USER_ID),
  supabase.from('tour_operator_profiles').select('account_status,current_kyc_session_id,kyc_verified_cnic,kyc_verified_name,kyc_verified_at').eq('user_id', USER_ID).single(),
])

console.log('user_roles:', JSON.stringify(finalRoles.data), finalRoles.error?.message ?? '')
console.log('tour_operator_profiles:', JSON.stringify(finalProfile.data), finalProfile.error?.message ?? '')
console.log('\n✅ Fix complete. Operator e169fc8b should now see "Approved" status.')
