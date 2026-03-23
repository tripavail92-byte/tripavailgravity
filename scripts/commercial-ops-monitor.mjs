import fs from 'node:fs'
import path from 'node:path'

import { createRemoteClient, loadRemoteDbEnv, resolveRemoteConnectionString } from './lib/remoteDb.mjs'

function toNumber(value) {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

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

function loadMonitorConfig() {
  const root = process.cwd()
  const env = {
    ...readEnvFile(path.join(root, '.env')),
    ...readEnvFile(path.join(root, '.env.local')),
    ...readEnvFile(path.join(root, 'supabase-secrets.env')),
    ...process.env,
  }

  return {
    reconciliationTolerance: toNumber(env.COMMERCIAL_RECONCILIATION_TOLERANCE ?? 0.01),
    eligibleBacklogWarn: toNumber(env.COMMERCIAL_ELIGIBLE_BACKLOG_WARN_PKR ?? 500000),
    onHoldWarn: toNumber(env.COMMERCIAL_ON_HOLD_WARN_PKR ?? 250000),
    recoveryWarn: toNumber(env.COMMERCIAL_RECOVERY_WARN_PKR ?? 250000),
    agedSettlementWarnDays: toNumber(env.COMMERCIAL_STUCK_SETTLEMENT_WARN_DAYS ?? 7),
  }
}

async function main() {
  const env = loadRemoteDbEnv()
  const connectionString = resolveRemoteConnectionString(env)
  if (!connectionString) {
    throw new Error(
      'Missing remote database connection string. Set DATABASE_URL or provide Project_ID plus Database_password in your env files.',
    )
  }

  const config = loadMonitorConfig()
  const client = createRemoteClient(connectionString)
  await client.connect()

  try {
    await client.query('BEGIN')
    await client.query('SET TRANSACTION READ ONLY')

    const [healthResult, agedSettlementResult] = await Promise.all([
      client.query('SELECT * FROM public.admin_finance_health_v'),
      client.query(`
        SELECT COUNT(*)::INTEGER AS stuck_count
        FROM public.operator_booking_finance_snapshots AS snapshot
        WHERE snapshot.settlement_state = 'completed_pending_payout'::public.settlement_state_enum
          AND COALESCE(snapshot.payout_available_at, snapshot.updated_at, snapshot.created_at) <= (
            TIMEZONE('UTC', NOW()) - ($1::INTEGER * INTERVAL '1 day')
          )
      `, [config.agedSettlementWarnDays]),
    ])

    const row = healthResult.rows[0]
    if (!row) {
      throw new Error('Commercial ops monitor returned no finance-health row.')
    }

    const checks = [
      {
        label: 'Reconciliation delta',
        value: toNumber(row.reconciliation_delta),
        threshold: config.reconciliationTolerance,
        ok: Math.abs(toNumber(row.reconciliation_delta)) <= config.reconciliationTolerance,
      },
      {
        label: 'Eligible payout backlog',
        value: toNumber(row.total_payouts_eligible_unbatched),
        threshold: config.eligibleBacklogWarn,
        ok: toNumber(row.total_payouts_eligible_unbatched) <= config.eligibleBacklogWarn,
      },
      {
        label: 'On-hold payout exposure',
        value: toNumber(row.total_payouts_on_hold),
        threshold: config.onHoldWarn,
        ok: toNumber(row.total_payouts_on_hold) <= config.onHoldWarn,
      },
      {
        label: 'Outstanding recovery balances',
        value: toNumber(row.outstanding_recovery_balances),
        threshold: config.recoveryWarn,
        ok: toNumber(row.outstanding_recovery_balances) <= config.recoveryWarn,
      },
      {
        label: 'Aged settlement backlog',
        value: toNumber(agedSettlementResult.rows[0]?.stuck_count),
        threshold: 0,
        ok: toNumber(agedSettlementResult.rows[0]?.stuck_count) === 0,
      },
    ]

    console.log('TripAvail commercial ops monitor')
    console.log('')
    for (const check of checks) {
      console.log(
        `${check.ok ? '[OK]' : '[WARN]'} ${check.label}: ${check.value} (threshold ${check.threshold})`,
      )
    }

    await client.query('ROLLBACK')

    const failing = checks.filter((check) => !check.ok)
    if (failing.length > 0) {
      throw new Error(
        `Commercial ops thresholds exceeded: ${failing.map((check) => check.label).join(', ')}`,
      )
    }
  } catch (error) {
    try {
      await client.query('ROLLBACK')
    } catch {
      // Ignore rollback failures and surface the original error.
    }
    throw error
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error('[commercial:ops:monitor] Failed:', error instanceof Error ? error.message : error)
  process.exitCode = 1
})