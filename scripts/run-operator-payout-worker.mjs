import fs from 'node:fs'
import path from 'node:path'

import { createClient } from '@supabase/supabase-js'

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {}

  const out = {}
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const separatorIndex = trimmed.indexOf('=')
    if (separatorIndex === -1) continue

    const key = trimmed.slice(0, separatorIndex).trim()
    let value = trimmed.slice(separatorIndex + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    out[key] = value
  }

  return out
}

function loadEnv() {
  const root = process.cwd()
  return {
    ...readEnvFile(path.join(root, '.env')),
    ...readEnvFile(path.join(root, '.env.local')),
    ...readEnvFile(path.join(root, 'supabase-secrets.env')),
    ...process.env,
  }
}

function printHelp() {
  console.log('TripAvail operator payout worker')
  console.log('')
  console.log('Usage:')
  console.log('  node scripts/run-operator-payout-worker.mjs')
  console.log('  node scripts/run-operator-payout-worker.mjs --auto-settle')
  console.log('  node scripts/run-operator-payout-worker.mjs --finalize-batch <batch-id>')
  console.log('')
  console.log('Modes:')
  console.log('  default          Refresh eligibility and create one scheduled payout batch if rows are ready')
  console.log('  --auto-settle    Refresh eligibility, create a batch, then immediately mark it paid')
  console.log('  --finalize-batch Mark an existing batch as paid without creating a new one')
}

async function main() {
  const args = process.argv.slice(2)
  if (args.includes('--help') || args.includes('-h')) {
    printHelp()
    return
  }

  const finalizeIndex = args.indexOf('--finalize-batch')
  const finalizeBatchId = finalizeIndex >= 0 ? args[finalizeIndex + 1] : null
  const autoSettle = args.includes('--auto-settle')

  if (finalizeIndex >= 0 && !finalizeBatchId) {
    throw new Error('Missing batch id after --finalize-batch')
  }

  const env = loadEnv()
  const supabaseUrl =
    env.SUPABASE_URL ||
    env.VITE_SUPABASE_URL ||
    env.NEXT_PUBLIC_SUPABASE_URL ||
    env.EDGE_SUPABASE_URL
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing Supabase credentials. Provide SUPABASE_URL (or VITE_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL / EDGE_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY (or SERVICE_ROLE_KEY).',
    )
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  if (finalizeBatchId) {
    const { data, error } = await supabase.rpc('mark_operator_payout_batch_paid', {
      p_batch_id: finalizeBatchId,
    })

    if (error) throw error

    const result = Array.isArray(data) ? data[0] : data
    console.log(JSON.stringify({ mode: 'finalize-batch', result }, null, 2))
    return
  }

  const { data: batchRows, error: batchError } = await supabase.rpc('create_operator_payout_batch')
  if (batchError) throw batchError

  const batch = Array.isArray(batchRows) ? batchRows[0] : batchRows
  if (!batch) {
    console.log(JSON.stringify({ mode: autoSettle ? 'auto-settle' : 'schedule', created: false }, null, 2))
    return
  }

  const response = {
    mode: autoSettle ? 'auto-settle' : 'schedule',
    created: true,
    scheduledBatch: batch,
  }

  if (!autoSettle) {
    console.log(JSON.stringify(response, null, 2))
    return
  }

  const { data: paidRows, error: paidError } = await supabase.rpc('mark_operator_payout_batch_paid', {
    p_batch_id: batch.batch_id,
  })
  if (paidError) throw paidError

  const paidBatch = Array.isArray(paidRows) ? paidRows[0] : paidRows
  console.log(
    JSON.stringify(
      {
        ...response,
        paidBatch,
      },
      null,
      2,
    ),
  )
}

main().catch((error) => {
  console.error('[operator-payout-worker] Failed:', error instanceof Error ? error.message : error)
  process.exitCode = 1
})