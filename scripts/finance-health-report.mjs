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

    const result = await client.query(`
      WITH payout_status_totals AS (
        SELECT
          ROUND(COALESCE(SUM(operator_payable_amount) FILTER (WHERE payout_status = 'scheduled'::public.payout_status_enum), 0), 2) AS total_payouts_scheduled,
          ROUND(COALESCE(SUM(operator_payable_amount) FILTER (WHERE payout_status = 'paid'::public.payout_status_enum), 0), 2) AS total_payouts_completed,
          ROUND(COALESCE(SUM(operator_payable_amount) FILTER (WHERE payout_status = 'on_hold'::public.payout_status_enum), 0), 2) AS total_payouts_on_hold,
          ROUND(COALESCE(SUM(operator_payable_amount) FILTER (WHERE payout_status = 'eligible'::public.payout_status_enum), 0), 2) AS total_payouts_eligible_unbatched,
          ROUND(COALESCE(SUM(operator_payable_amount) FILTER (WHERE payout_status = 'recovery_pending'::public.payout_status_enum), 0), 2) AS total_payouts_recovery_pending,
          ROUND(COALESCE(SUM(recovery_amount), 0), 2) AS outstanding_recovery_balances
        FROM public.operator_payout_items
      ),
      finance_summary AS (
        SELECT *
        FROM public.admin_finance_summary_v
      )
      SELECT
        finance_summary.total_customer_payments_collected,
        finance_summary.total_commission_earned,
        payout_status_totals.total_payouts_scheduled,
        payout_status_totals.total_payouts_completed,
        payout_status_totals.total_payouts_on_hold,
        payout_status_totals.total_payouts_eligible_unbatched,
        payout_status_totals.total_payouts_recovery_pending,
        finance_summary.total_refunds,
        payout_status_totals.outstanding_recovery_balances,
        ROUND(
          payout_status_totals.total_payouts_completed +
          payout_status_totals.total_payouts_scheduled +
          finance_summary.total_commission_earned +
          finance_summary.total_refunds +
          payout_status_totals.total_payouts_on_hold,
          2
        ) AS reconciliation_rhs,
        ROUND(
          finance_summary.total_customer_payments_collected - (
            payout_status_totals.total_payouts_completed +
            payout_status_totals.total_payouts_scheduled +
            finance_summary.total_commission_earned +
            finance_summary.total_refunds +
            payout_status_totals.total_payouts_on_hold
          ),
          2
        ) AS reconciliation_delta
      FROM finance_summary
      CROSS JOIN payout_status_totals
    `)

    const row = result.rows[0]
    if (!row) {
      throw new Error('Finance health report returned no data.')
    }

    console.log('Finance health report')
    console.log('')
    console.log(`Total customer payments collected: ${formatMoney(row.total_customer_payments_collected)}`)
    console.log(`Total commission earned by TripAvail: ${formatMoney(row.total_commission_earned)}`)
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
    console.log(`Operator payouts completed + scheduled + held: ${formatMoney(toMoney(row.total_payouts_completed) + toMoney(row.total_payouts_scheduled) + toMoney(row.total_payouts_on_hold))}`)
    console.log(`TripAvail commission: ${formatMoney(row.total_commission_earned)}`)
    console.log(`Refunds: ${formatMoney(row.total_refunds)}`)
    console.log(`Right-hand side total: ${formatMoney(row.reconciliation_rhs)}`)
    console.log(`Reconciliation delta: ${formatSignedMoney(row.reconciliation_delta)}`)

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