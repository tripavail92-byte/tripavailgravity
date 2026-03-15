import { createRemoteClient, loadRemoteDbEnv, resolveRemoteConnectionString } from './lib/remoteDb.mjs'

function printMoney(value) {
  const amount = Number(value ?? 0)
  return `PKR ${amount.toLocaleString()}`
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
    await client.query("SELECT set_config('request.jwt.claim.role', 'service_role', true)")

    await client.query(`
      CREATE TEMP TABLE _payout_cycle_ids (key TEXT PRIMARY KEY, val UUID NOT NULL DEFAULT gen_random_uuid())
    `)
    await client.query(`
      INSERT INTO _payout_cycle_ids(key)
      VALUES ('operator'), ('traveler'), ('tour'), ('schedule'), ('booking')
    `)
    await client.query(`
      INSERT INTO auth.users(id, email, email_confirmed_at, created_at, updated_at)
      SELECT val, key || '_' || val || '@test.invalid', NOW(), NOW(), NOW()
      FROM _payout_cycle_ids
      WHERE key IN ('operator', 'traveler')
    `)
    await client.query(`
      INSERT INTO public.users(id, email, full_name)
      SELECT val, key || '_' || val || '@test.invalid', initcap(key)
      FROM _payout_cycle_ids
      WHERE key IN ('operator', 'traveler')
      ON CONFLICT (id) DO NOTHING
    `)
    await client.query(`
      INSERT INTO public.user_roles(user_id, role_type, is_active, verification_status)
      VALUES ((SELECT val FROM _payout_cycle_ids WHERE key = 'traveler'), 'traveller', TRUE, 'approved')
      ON CONFLICT (user_id, role_type) DO NOTHING
    `)
    await client.query(`
      INSERT INTO public.tour_operator_profiles(user_id, company_name)
      VALUES ((SELECT val FROM _payout_cycle_ids WHERE key = 'operator'), 'Payout Cycle Operator')
      ON CONFLICT (user_id) DO NOTHING
    `)
    await client.query(`
      INSERT INTO public.user_roles(user_id, role_type, is_active, verification_status)
      VALUES ((SELECT val FROM _payout_cycle_ids WHERE key = 'operator'), 'tour_operator', TRUE, 'approved')
      ON CONFLICT (user_id, role_type) DO NOTHING
    `)
    await client.query(`
      SELECT public.provision_operator_commercial_profile((SELECT val FROM _payout_cycle_ids WHERE key = 'operator'))
    `)
    await client.query(`
      UPDATE public.operator_commercial_profiles
      SET
        operational_status = 'active'::public.operator_operational_status_enum,
        kyc_status = 'approved'::public.commercial_kyc_status_enum,
        membership_tier_code = 'gold'::public.membership_tier_code_enum,
        membership_status = 'active'::public.membership_status_enum,
        commission_rate = 20,
        monthly_membership_fee = 30000,
        payout_hold = FALSE,
        feature_overrides = '{}'::JSONB,
        updated_at = TIMEZONE('UTC', NOW())
      WHERE operator_user_id = (SELECT val FROM _payout_cycle_ids WHERE key = 'operator')
    `)
    await client.query(`
      INSERT INTO public.tours (
        id, operator_id, title, tour_type, location, duration, price, currency, description, is_active, is_verified
      )
      VALUES (
        (SELECT val FROM _payout_cycle_ids WHERE key = 'tour'),
        (SELECT val FROM _payout_cycle_ids WHERE key = 'operator'),
        'Remote Payout Cycle Tour',
        'guided',
        '{"city":"Lahore"}'::JSONB,
        '2 days',
        10000,
        'PKR',
        'Remote payout cycle verification',
        TRUE,
        TRUE
      )
    `)
    await client.query(`
      INSERT INTO public.tour_schedules (id, tour_id, start_time, end_time, capacity, booked_count, status)
      VALUES (
        (SELECT val FROM _payout_cycle_ids WHERE key = 'schedule'),
        (SELECT val FROM _payout_cycle_ids WHERE key = 'tour'),
        TIMEZONE('UTC', NOW()) - INTERVAL '5 days',
        TIMEZONE('UTC', NOW()) - INTERVAL '4 days',
        10,
        1,
        'completed'
      )
    `)
    await client.query(`
      INSERT INTO public.tour_bookings (
        id, tour_id, schedule_id, traveler_id, status, total_price, pax_count, booking_date, metadata,
        payment_status, stripe_payment_intent_id, payment_collection_mode, deposit_required, deposit_percentage,
        upfront_amount, remaining_amount, amount_paid_online, amount_due_to_operator, payment_policy_text
      )
      VALUES (
        (SELECT val FROM _payout_cycle_ids WHERE key = 'booking'),
        (SELECT val FROM _payout_cycle_ids WHERE key = 'tour'),
        (SELECT val FROM _payout_cycle_ids WHERE key = 'schedule'),
        (SELECT val FROM _payout_cycle_ids WHERE key = 'traveler'),
        'completed',
        10000,
        1,
        TIMEZONE('UTC', NOW()) - INTERVAL '6 days',
        '{}'::JSONB,
        'paid',
        'pi_remote_payout_cycle',
        'full_online',
        FALSE,
        0,
        10000,
        0,
        10000,
        8000,
        'Full amount charged online.'
      )
    `)

    const identifiersResult = await client.query(`
      SELECT
        (SELECT val FROM _payout_cycle_ids WHERE key = 'operator') AS operator_id,
        (SELECT val FROM _payout_cycle_ids WHERE key = 'booking') AS booking_id
    `)
    const identifiers = identifiersResult.rows[0]

    await client.query(
      `
        UPDATE public.operator_booking_finance_snapshots
        SET
          operator_user_id = $1,
          booking_total = 10000,
          payment_collected = 10000,
          refund_amount = 0,
          commission_rate = 20,
          commission_amount = 2000,
          operator_receivable_estimate = 8000,
          settlement_state = 'eligible_for_payout'::public.settlement_state_enum,
          payout_status = 'eligible'::public.payout_status_enum,
          payout_available_at = TIMEZONE('UTC', NOW()) - INTERVAL '1 day',
          notes = '{}'::JSONB,
          updated_at = TIMEZONE('UTC', NOW())
        WHERE booking_id = $2
      `,
      [identifiers.operator_id, identifiers.booking_id],
    )

    await client.query(
      `
        UPDATE public.operator_commission_ledger
        SET
          operator_user_id = $1,
          membership_tier_code = 'gold'::public.membership_tier_code_enum,
          booking_total = 10000,
          commission_rate = 20,
          commission_amount = 2000,
          operator_receivable_estimate = 8000,
          settlement_state = 'eligible_for_payout'::public.settlement_state_enum,
          payout_status = 'eligible'::public.payout_status_enum,
          available_for_payout_at = TIMEZONE('UTC', NOW()) - INTERVAL '1 day',
          updated_at = TIMEZONE('UTC', NOW())
        WHERE booking_id = $2
      `,
      [identifiers.operator_id, identifiers.booking_id],
    )

    await client.query(
      `
        UPDATE public.operator_payout_items
        SET
          operator_user_id = $1,
          gross_amount = 10000,
          commission_amount = 2000,
          refund_amount = 0,
          operator_payable_amount = 8000,
          payout_status = 'eligible'::public.payout_status_enum,
          payout_due_at = TIMEZONE('UTC', NOW()) - INTERVAL '1 day',
          recovery_amount = 0,
          updated_at = TIMEZONE('UTC', NOW())
        WHERE booking_id = $2
      `,
      [identifiers.operator_id, identifiers.booking_id],
    )

    const batchResult = await client.query(
      'SELECT * FROM public.create_operator_payout_batch(TIMEZONE(\'UTC\', NOW()))',
    )
    const batch = batchResult.rows[0]
    if (!batch) {
      throw new Error('No payout batch was created during payout cycle test.')
    }

    const paidResult = await client.query(
      'SELECT * FROM public.mark_operator_payout_batch_paid($1, TIMEZONE(\'UTC\', NOW()))',
      [batch.batch_id],
    )
    const paidBatch = paidResult.rows[0]

    const summaryResult = await client.query(
      `
        SELECT
          payout_item.operator_payable_amount AS expected_payout,
          payout_batch.total_operator_payable AS batch_payable_total,
          payout_item.paid_at AS payout_paid_at,
          payout_item.payout_status,
          ledger.booking_total AS ledger_booking_total,
          ledger.commission_amount AS ledger_commission_amount,
          ledger.operator_receivable_estimate AS ledger_operator_receivable,
          snapshot.payment_collected AS snapshot_payment_collected,
          snapshot.commission_amount AS snapshot_commission_amount,
          snapshot.operator_receivable_estimate AS snapshot_operator_receivable
        FROM public.operator_payout_items AS payout_item
        INNER JOIN public.operator_payout_batches AS payout_batch
          ON payout_batch.id = payout_item.payout_batch_id
        INNER JOIN public.operator_commission_ledger AS ledger
          ON ledger.booking_id = payout_item.booking_id
        INNER JOIN public.operator_booking_finance_snapshots AS snapshot
          ON snapshot.booking_id = payout_item.booking_id
        WHERE payout_item.booking_id = $1
      `,
      [identifiers.booking_id],
    )
    const summary = summaryResult.rows[0]

    console.log('Payout cycle integration summary')
    console.log('')
    console.log(`Booking: ${identifiers.booking_id}`)
    console.log(`Batch: ${batch.batch_reference}`)
    console.log(`Expected payout: ${printMoney(summary.expected_payout)}`)
    console.log(`Actual payout: ${printMoney(paidBatch.total_operator_payable)}`)
    console.log(`Ledger totals: booking=${printMoney(summary.ledger_booking_total)}, commission=${printMoney(summary.ledger_commission_amount)}, operator_receivable=${printMoney(summary.ledger_operator_receivable)}`)
    console.log(`Snapshot totals: collected=${printMoney(summary.snapshot_payment_collected)}, commission=${printMoney(summary.snapshot_commission_amount)}, operator_receivable=${printMoney(summary.snapshot_operator_receivable)}`)
    console.log(`Payout status: ${summary.payout_status}`)
    console.log(`Paid at: ${summary.payout_paid_at}`)

    if (Number(summary.expected_payout) !== Number(paidBatch.total_operator_payable)) {
      throw new Error('Expected payout does not match actual payout total.')
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
  console.error('[db:test:payout-cycle] Failed:', error instanceof Error ? error.message : error)
  process.exitCode = 1
})