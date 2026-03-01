/**
 * End-to-end KYC flow test
 * 1. Create a KYC session directly in the DB
 * 2. Upload both CNIC images via the kyc-mobile-upload edge function
 * 3. Poll until the Python worker processes it (processing → pending_admin_review)
 * 4. Print all extracted fields
 */

import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

// ── Load env ──────────────────────────────────────────────────────────────────
const envRaw = fs.readFileSync('supabase-secrets.env', 'utf8')
const env = {}
for (const line of envRaw.split(/\r?\n/)) {
  const eq = line.indexOf('=')
  if (eq === -1 || line.startsWith('#')) continue
  env[line.slice(0, eq).trim()] = line.slice(eq + 1).trim()
}

const SUPABASE_URL      = env.EDGE_SUPABASE_URL
const SERVICE_ROLE_KEY  = env.SERVICE_ROLE_KEY
const FUNCTION_URL      = `${SUPABASE_URL}/functions/v1/kyc-mobile-upload`

// Test operator user — use existing demo account
// We'll create a fresh kyc session for this user
const TEST_USER_EMAIL = 'extreme-sports@tripavail.demo'

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing env vars'); process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
})

// ── Helpers ───────────────────────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

function fmt(obj) { return JSON.stringify(obj, null, 2) }

// ── Step 1: Look up the test user ─────────────────────────────────────────────
async function findUser(email) {
  console.log(`\n[1] Looking up user: ${email}`)
  const { data, error } = await supabase.auth.admin.listUsers()
  if (error) throw new Error(`listUsers: ${error.message}`)
  const user = data.users.find(u => u.email === email)
  if (!user) throw new Error(`User ${email} not found`)
  console.log(`    ✓ Found: ${user.id}`)
  return user
}

// ── Step 2: Create a fresh KYC session ───────────────────────────────────────
async function createSession(userId) {
  console.log(`\n[2] Creating KYC session for user ${userId}`)
  
  // Generate a unique session token
  const token = `test_${Date.now()}_${Math.random().toString(36).slice(2)}`
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 min

  const { data, error } = await supabase
    .from('kyc_sessions')
    .insert({
      user_id:       userId,
      role:          'tour_operator',
      session_token: token,
      status:        'pending',
      expires_at:    expiresAt,
    })
    .select()
    .single()

  if (error) throw new Error(`createSession: ${error.message}`)
  console.log(`    ✓ Session ID: ${data.id}`)
  console.log(`    ✓ Token:      ${token}`)
  return data
}

// ── Step 3: Upload an image via the edge function ─────────────────────────────
async function uploadImage(sessionToken, field, imagePath) {
  console.log(`\n[3] Uploading ${field} from ${path.basename(imagePath)}`)
  
  const imageBytes = fs.readFileSync(imagePath)
  const b64 = imageBytes.toString('base64')

  const resp = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'apikey': SERVICE_ROLE_KEY,
    },
    body: JSON.stringify({
      session_token: sessionToken,
      field,
      image: `data:image/png;base64,${b64}`,
    }),
  })

  const body = await resp.json()
  if (!resp.ok) throw new Error(`upload ${field} failed (${resp.status}): ${JSON.stringify(body)}`)
  console.log(`    ✓ Uploaded → path: ${body.path}, status: ${body.status}, version: ${body.version}`)
  return body
}

// ── Step 4: Poll until worker finishes ───────────────────────────────────────
async function pollSession(sessionId, timeoutMs = 120_000) {
  console.log(`\n[4] Polling session ${sessionId} (timeout: ${timeoutMs/1000}s)...`)
  const start = Date.now()
  
  while (Date.now() - start < timeoutMs) {
    const { data, error } = await supabase
      .from('kyc_sessions')
      .select('status, failure_code, failure_reason, cnic_number, full_name, father_name, gender, address, date_of_birth, expiry_date, ocr_result')
      .eq('id', sessionId)
      .single()

    if (error) throw new Error(`poll: ${error.message}`)
    
    const elapsed = ((Date.now() - start) / 1000).toFixed(1)
    process.stdout.write(`\r    Status: ${data.status.padEnd(25)} (${elapsed}s elapsed)`)

    if (data.status === 'pending_admin_review') {
      console.log('\n    ✓ Worker completed OCR!')
      return { success: true, data }
    }
    if (data.status === 'failed') {
      console.log('\n    ✗ Worker marked session as failed')
      return { success: false, data }
    }
    if (!['processing', 'uploading'].includes(data.status)) {
      console.log(`\n    ? Unexpected status: ${data.status}`)
      return { success: false, data }
    }

    await sleep(2000)
  }

  return { success: false, data: null, timeout: true }
}

// ── Step 5: Print results ─────────────────────────────────────────────────────
function printResults(result) {
  console.log('\n' + '═'.repeat(60))
  console.log('  OCR EXTRACTION RESULTS')
  console.log('═'.repeat(60))

  if (!result.success) {
    if (result.timeout) {
      console.log('  ✗ TIMEOUT — worker did not process within 2 minutes')
      console.log('    Check Railway logs: railway logs --tail 50')
    } else {
      console.log(`  ✗ FAILED`)
      console.log(`    failure_code:   ${result.data?.failure_code}`)
      console.log(`    failure_reason: ${result.data?.failure_reason}`)
      if (result.data?.ocr_result?.front_components) {
        console.log('\n  Raw OCR components (front):')
        for (const c of (result.data.ocr_result.front_components || [])) {
          console.log(`    [${c}]`)
        }
      }
    }
  } else {
    const d = result.data
    const fields = [
      ['CNIC Number',   d.cnic_number],
      ['Full Name',     d.full_name],
      ['Father Name',   d.father_name],
      ['Gender',        d.gender],
      ['Date of Birth', d.date_of_birth],
      ['Expiry Date',   d.expiry_date],
      ['Address',       d.address],
    ]
    for (const [label, value] of fields) {
      const icon = value ? '✓' : '○'
      console.log(`  ${icon} ${label.padEnd(15)}: ${value ?? '(not extracted)'}`)
    }

    if (result.data.ocr_result) {
      const ocr = result.data.ocr_result
      const allComponents = [...(ocr.front_components || []), ...(ocr.back_components || [])]
      console.log(`\n  Raw OCR segments (${allComponents.length} total):`)
      for (const c of allComponents.slice(0, 40)) {
        console.log(`    [${c}]`)
      }
    }
  }
  console.log('═'.repeat(60))
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('═'.repeat(60))
  console.log('  KYC END-TO-END FLOW TEST')
  console.log(`  Supabase: ${SUPABASE_URL}`)
  console.log(`  Function: ${FUNCTION_URL}`)
  console.log('═'.repeat(60))

  const frontImage = 'docs/Screenshot 2026-02-28 193749.png'
  const backImage  = 'docs/Screenshot 2026-02-28 193823.png'

  // Verify images exist
  if (!fs.existsSync(frontImage)) throw new Error(`Front image not found: ${frontImage}`)
  if (!fs.existsSync(backImage))  throw new Error(`Back image not found:  ${backImage}`)
  console.log(`\n  Front image: ${frontImage} (${(fs.statSync(frontImage).size/1024).toFixed(0)} KB)`)
  console.log(`  Back image:  ${backImage} (${(fs.statSync(backImage).size/1024).toFixed(0)} KB)`)

  try {
    // 1. Find user
    const user = await findUser(TEST_USER_EMAIL)

    // 2. Create session
    const session = await createSession(user.id)

    // 3. Upload front
    await uploadImage(session.session_token, 'id_front', frontImage)
    
    // 4. Upload back (this triggers status → processing)
    await uploadImage(session.session_token, 'id_back', backImage)

    // 5. Poll for result
    const result = await pollSession(session.id, 120_000)

    // 6. Print results
    printResults(result)

    // 7. Cleanup: mark session as failed/expired so it doesn't show in admin queue
    if (result.success || result.data) {
      await supabase
        .from('kyc_sessions')
        .update({ status: 'failed', failure_code: 'test_run', failure_reason: 'Automated test — not a real submission' })
        .eq('id', session.id)
      console.log('\n  [cleanup] Session marked as test/failed (removed from admin queue)')
    }

  } catch (err) {
    console.error('\n  ✗ TEST ERROR:', err.message)
    process.exit(1)
  }
}

main()
