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

const USER_ID = 'e169fc8b-eb30-43d8-836a-c1906eb3f809'

const [roles, kyc, profile, verReq] = await Promise.all([
  supabase.from('user_roles').select('role_type,verification_status').eq('user_id', USER_ID),
  supabase.from('kyc_sessions').select('id,status,reviewed_at,reviewed_by,full_name,cnic_number').eq('user_id', USER_ID).order('created_at', { ascending: false }).limit(5),
  supabase.from('tour_operator_profiles').select('account_status,kyc_verified_name,kyc_verified_cnic,kyc_verified_at,current_kyc_session_id').eq('user_id', USER_ID).single(),
  supabase.from('partner_verification_requests').select('id,status,submitted_at,reviewed_at').eq('user_id', USER_ID).order('submitted_at', { ascending: false }).limit(3),
])

console.log('\n── user_roles ──')
console.log(JSON.stringify(roles.data, null, 2))
if (roles.error) console.error('ERROR:', roles.error.message)

console.log('\n── kyc_sessions (latest 5) ──')
console.log(JSON.stringify(kyc.data, null, 2))
if (kyc.error) console.error('ERROR:', kyc.error.message)

console.log('\n── tour_operator_profiles (KYC cols) ──')
console.log(JSON.stringify(profile.data, null, 2))
if (profile.error) console.error('ERROR:', profile.error.message)

console.log('\n── partner_verification_requests ──')
console.log(JSON.stringify(verReq.data, null, 2))
if (verReq.error) console.error('ERROR:', verReq.error.message)
