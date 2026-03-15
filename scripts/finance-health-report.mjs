import { createRemoteClient, loadRemoteDbEnv, resolveRemoteConnectionString } from './lib/remoteDb.mjs'

function toMoney(value) {
  const amount = Number(value ?? 0)
  return Number.isFinite(amount) ? amount : 0
}

function formatMoney(value) {
  return `PKR ${toMoney(value).toLocaleString()}`
}

function formatSignedMoney(value) {
  const amount = toMoney(value)
  const prefix = amount > 0 ? '+' : amount < 0 ? '-' : ''
  return `${prefix}PKR ${Math.abs(amount).toLocaleString()}`
}

const RECONCILIATION_TOLERANCE = 0.01

async function main() {
  const env = loadRemoteDbEnv()
  const connectionString = resolveRemoteConnectionString(env)
  if (!connectionString) {
    throw new Error(
      'Missing remote database connection string. Set DATABASE_URL or provide Project_ID plus Database_password in your env files.',
    )
  }

  const client = createRemoteClient(connectionString)
  await client.connect()

  try {
    await client.query('BEGIN')
    await client.query('SET TRANSACTION READ ONLY')

    const readonlyResult = await client.query('SHOW transaction_read_only')
    if (readonlyResult.rows[0]?.transaction_read_only !== 'on') {
      throw new Error('Finance health report must run in read-only mode.')
    }

    const result = await client.query('SELECT * FROM public.admin_finance_health_v')

    const row = result.rows[0]
    if (!row) {
      throw new Error('Finance health report returned no data.')
    }

    console.log('Finance health report')
    console.log('')
    console.log(`Total customer payments collected: ${formatMoney(row.total_customer_payments_collected)}`)
    console.log(`Total commission accrued by TripAvail: ${formatMoney(row.total_commission_earned)}`)
    console.log(`Total commission collected by TripAvail: ${formatMoney(row.total_commission_collected)}`)
    console.log(`Outstanding commission not yet collected: ${formatMoney(row.total_commission_remaining)}`)
    console.log(`Operator cash liability not ready for payout: ${formatMoney(row.total_operator_liability_not_ready)}`)
    console.log(`Total operator payouts scheduled: ${formatMoney(row.total_payouts_scheduled)}`)
    console.log(`Total payouts completed: ${formatMoney(row.total_payouts_completed)}`)
    console.log(`Total payouts on hold: ${formatMoney(row.total_payouts_on_hold)}`)
    console.log(`Total refunds issued: ${formatMoney(row.total_refunds)}`)
    console.log(`Outstanding recovery balances: ${formatMoney(row.outstanding_recovery_balances)}`)
    console.log('')
    console.log('Additional payout context')
    console.log(`Eligible unbatched payouts: ${formatMoney(row.total_payouts_eligible_unbatched)}`)
    console.log(`Recovery-pending payout exposure: ${formatMoney(row.total_payouts_recovery_pending)}`)
    console.log('')
    console.log('Reconciliation check')
    console.log(`Customer payments: ${formatMoney(row.total_customer_payments_collected)}`)
    console.log(`Operator cash liability not ready for payout: ${formatMoney(row.total_operator_liability_not_ready)}`)
    console.log(`Operator payouts completed + scheduled + held + eligible: ${formatMoney(toMoney(row.total_payouts_completed) + toMoney(row.total_payouts_scheduled) + toMoney(row.total_payouts_on_hold) + toMoney(row.total_payouts_eligible_unbatched))}`)
    console.log(`TripAvail commission collected: ${formatMoney(row.total_commission_collected)}`)
    console.log(`Refunds: ${formatMoney(row.total_refunds)}`)
    console.log(`Right-hand side total: ${formatMoney(row.reconciliation_rhs)}`)
    console.log(`Reconciliation delta: ${formatSignedMoney(row.reconciliation_delta)}`)

    if (Math.abs(toMoney(row.reconciliation_delta)) > RECONCILIATION_TOLERANCE) {
      throw new Error(
        `Finance reconciliation drift detected: ${formatSignedMoney(row.reconciliation_delta)} exceeds tolerance ${formatMoney(RECONCILIATION_TOLERANCE)}`,
      )
    }

    await client.query('ROLLBACK')
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
  console.error('[db:finance:health] Failed:', error instanceof Error ? error.message : error)
  process.exitCode = 1
})