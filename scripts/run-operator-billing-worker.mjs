import fs from 'node:fs'
import path from 'node:path'

import { createClient } from '@supabase/supabase-js'

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {}

  const out = {}
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
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

function parseArgs(argv) {
  const args = { asOfDate: null, operatorUserId: null, dryRun: false, help: false }

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index]
    if (current === '--help' || current === '-h') args.help = true
    if (current === '--dry-run') args.dryRun = true
    if (current === '--as-of-date') args.asOfDate = argv[index + 1] ?? null
    if (current === '--operator-user-id') args.operatorUserId = argv[index + 1] ?? null
  }

  return args
}

function printHelp() {
  console.log('TripAvail operator billing worker')
  console.log('')
  console.log('Usage:')
  console.log('  node scripts/run-operator-billing-worker.mjs')
  console.log('  node scripts/run-operator-billing-worker.mjs --as-of-date 2026-03-31')
  console.log('  node scripts/run-operator-billing-worker.mjs --operator-user-id <uuid>')
  console.log('  node scripts/run-operator-billing-worker.mjs --dry-run')
  console.log('')
  console.log('Notes:')
  console.log('  Runs the due billing-cycle closure RPC using service-role credentials.')
  console.log('  --dry-run reports which operators are due without changing billing state.')
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  if (options.help) {
    printHelp()
    return
  }

  const env = loadEnv()
  const supabaseUrl =
    env.SUPABASE_URL || env.VITE_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || env.EDGE_SUPABASE_URL
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing Supabase credentials. Provide SUPABASE_URL (or VITE_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL / EDGE_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY (or SERVICE_ROLE_KEY).',
    )
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const asOfDate = options.asOfDate ?? new Date().toISOString().slice(0, 10)

  if (options.dryRun) {
    const query = supabase
      .from('operator_commercial_profiles')
      .select('operator_user_id, membership_status, next_billing_date, current_cycle_start, current_cycle_end')
      .lte('next_billing_date', asOfDate)
      .in('membership_status', ['active', 'grace_period', 'payment_due', 'overdue'])
      .order('next_billing_date', { ascending: true })

    if (options.operatorUserId) query.eq('operator_user_id', options.operatorUserId)

    const { data, error } = await query
    if (error) throw error

    console.log(
      JSON.stringify(
        {
          mode: 'billing-dry-run',
          asOfDate,
          dueOperators: data ?? [],
        },
        null,
        2,
      ),
    )
    return
  }

  const { data, error } = await supabase.rpc('run_due_operator_billing_cycles', {
    p_as_of_date: asOfDate,
    p_operator_user_id: options.operatorUserId,
  })

  if (error) throw error

  console.log(
    JSON.stringify(
      {
        mode: 'billing-close-due-cycles',
        asOfDate,
        processed: Array.isArray(data) ? data.length : 0,
        closedCycles: data ?? [],
      },
      null,
      2,
    ),
  )
}

main().catch((error) => {
  console.error('[operator-billing-worker] Failed:', error instanceof Error ? error.message : error)
  process.exitCode = 1
})