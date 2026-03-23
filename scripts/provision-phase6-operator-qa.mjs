import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

import {
  createRemoteClient,
  loadRemoteDbEnv,
  resolveRemoteConnectionString,
} from './lib/remoteDb.mjs'

const TOOL_NAME = 'provision-phase6-operator-qa.mjs'

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {}
  const out = {}
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx === -1) continue
    const key = trimmed.slice(0, idx).trim()
    let value = trimmed.slice(idx + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    out[key] = value
  }
  return out
}

const root = process.cwd()
const envRoot = readEnvFile(path.join(root, '.env'))
const envWeb = readEnvFile(path.join(root, 'packages/web/.env'))
const envSecrets = readEnvFile(path.join(root, 'supabase-secrets.env'))

function envAny(key) {
  return process.env[key] || envRoot[key] || envWeb[key] || envSecrets[key] || ''
}

const supabaseUrl = envAny('VITE_SUPABASE_URL') || envAny('NEXT_PUBLIC_SUPABASE_URL') || envAny('EDGE_SUPABASE_URL')
const serviceRoleKey = envAny('SUPABASE_SERVICE_ROLE_KEY') || envAny('SERVICE_ROLE_KEY')

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing Supabase URL or service role key')
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const remoteDbEnv = loadRemoteDbEnv()
const remoteConnectionString = resolveRemoteConnectionString(remoteDbEnv)

if (!remoteConnectionString) {
  throw new Error('Missing remote database connection string')
}

const OPERATOR_EMAIL = 'phase6-operator-qa@tripavail.test'
const OPERATOR_PASSWORD = 'Phase6-Operator-QA_2026!'
const OPERATOR_NAME = 'Phase 6 Operator QA'
const TRAVELER_QA_EMAIL = 'phase6-traveler-qa@tripavail.test'
const TRAVELER_QA_PASSWORD = 'Phase6-Traveler-QA_2026!'
const TRAVELER_QA_NAME = 'Phase 6 Traveler QA'

const SOURCE_TOUR_ID = 'fbb1ce22-0105-48c8-9f2b-79b0ac3929b2'
const SOURCE_SCHEDULE_ID = 'fc9c91d9-9039-4ed9-bcb9-68cae1d5917f'
const SOURCE_DEPOSIT_BOOKING_ID = 'a1b2c3d4-1111-4222-8333-abcdef123401'
const SOURCE_REFUND_BOOKING_ID = 'a1b2c3d4-1111-4222-8333-abcdef123402'

const QA_TOUR_ID = '6d6a5bb3-9db1-4f0d-9d6e-30f6d9874001'
const QA_SCHEDULE_ID = '6d6a5bb3-9db1-4f0d-9d6e-30f6d9874002'
const QA_DEPOSIT_BOOKING_ID = '6d6a5bb3-9db1-4f0d-9d6e-30f6d9874003'
const QA_REFUND_BOOKING_ID = '6d6a5bb3-9db1-4f0d-9d6e-30f6d9874004'

async function listAllUsers() {
  const users = []
  let page = 1
  const perPage = 1000

  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
    if (error) throw error
    const batch = data?.users || []
    users.push(...batch)
    if (batch.length < perPage) break
    page += 1
  }

  return users
}

async function ensureAuthUser(email, password, fullName) {
  const users = await listAllUsers()
  const existing = users.find((user) => (user.email || '').toLowerCase() === email.toLowerCase())

  if (existing) {
    const { error } = await admin.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      user_metadata: {
        ...(existing.user_metadata || {}),
        full_name: fullName,
        seeded_by: TOOL_NAME,
      },
    })
    if (error) throw error
    return existing.id
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      seeded_by: TOOL_NAME,
    },
  })

  if (error) throw error
  if (!data.user?.id) throw new Error(`Missing auth user id for ${email}`)
  return data.user.id
}

async function waitForPublicUser(userId, email, fullName) {
  for (let attempt = 0; attempt < 15; attempt += 1) {
    const { data, error } = await admin.from('users').select('id').eq('id', userId).maybeSingle()
    if (error) throw error
    if (data?.id) return
    await new Promise((resolve) => setTimeout(resolve, 400))
  }

  const { error } = await admin.from('users').upsert({
    id: userId,
    email,
    full_name: fullName,
  })
  if (error) throw error
}

async function getSingle(table, id) {
  const { data, error } = await admin.from(table).select('*').eq('id', id).single()
  if (error) throw error
  return data
}

async function upsertJsonRecord(client, tableType, tableName, payload, conflictTarget, updateAssignments) {
  await client.query(
    `
      INSERT INTO ${tableName}
      SELECT *
      FROM json_populate_record(NULL::${tableType}, $1::json)
      ON CONFLICT (${conflictTarget}) DO UPDATE
      SET ${updateAssignments}
    `,
    [JSON.stringify(payload)],
  )
}

async function ensureTravelerProfile(client, travelerUserId, rowTimestamp) {
  await upsertJsonRecord(
    client,
    'public.profiles',
    'public.profiles',
    {
      id: travelerUserId,
      email: TRAVELER_QA_EMAIL,
      first_name: 'Phase 6',
      last_name: 'Traveler QA',
      account_status: 'active',
      created_at: rowTimestamp,
      updated_at: rowTimestamp,
      email_verified: true,
    },
    'id',
      "email = EXCLUDED.email, first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, account_status = EXCLUDED.account_status, updated_at = EXCLUDED.updated_at, email_verified = EXCLUDED.email_verified",
  )

  await client.query(
    `
      INSERT INTO public.user_roles (user_id, role_type, is_active, verification_status, profile_completion)
      VALUES ($1, 'traveller', true, 'approved', 100)
      ON CONFLICT (user_id, role_type) DO UPDATE
      SET
        is_active = EXCLUDED.is_active,
        verification_status = EXCLUDED.verification_status,
        profile_completion = EXCLUDED.profile_completion
    `,
    [travelerUserId],
  )

  await upsertJsonRecord(
    client,
    'public.account_settings',
    'public.account_settings',
    {
      user_id: travelerUserId,
      allow_messages_from_anyone: false,
      profile_visibility: 'private',
      marketing_emails: false,
      booking_reminders: true,
      email_notifications_enabled: true,
      push_notifications_enabled: true,
      created_at: rowTimestamp,
      updated_at: rowTimestamp,
    },
    'user_id',
    "allow_messages_from_anyone = EXCLUDED.allow_messages_from_anyone, profile_visibility = EXCLUDED.profile_visibility, marketing_emails = EXCLUDED.marketing_emails, booking_reminders = EXCLUDED.booking_reminders, email_notifications_enabled = EXCLUDED.email_notifications_enabled, push_notifications_enabled = EXCLUDED.push_notifications_enabled, updated_at = EXCLUDED.updated_at",
  )
}

async function main() {
  const client = createRemoteClient(remoteConnectionString)
  await client.connect()

  try {
    const rowTimestamp = new Date().toISOString()
    const operatorUserId = await ensureAuthUser(OPERATOR_EMAIL, OPERATOR_PASSWORD, OPERATOR_NAME)
    await waitForPublicUser(operatorUserId, OPERATOR_EMAIL, OPERATOR_NAME)
    const travelerUserId = await ensureAuthUser(
      TRAVELER_QA_EMAIL,
      TRAVELER_QA_PASSWORD,
      TRAVELER_QA_NAME,
    )
    await waitForPublicUser(travelerUserId, TRAVELER_QA_EMAIL, TRAVELER_QA_NAME)
    await ensureTravelerProfile(client, travelerUserId, rowTimestamp)

    await upsertJsonRecord(
      client,
      'public.profiles',
      'public.profiles',
      {
        id: operatorUserId,
        email: OPERATOR_EMAIL,
        first_name: 'Phase 6',
        last_name: 'Operator QA',
        account_status: 'active',
        created_at: rowTimestamp,
        updated_at: rowTimestamp,
        email_verified: true,
        phone: '+923001112233',
        phone_verified: true,
        partner_type: 'tour_operator',
      },
      'id',
      "email = EXCLUDED.email, first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, email_verified = EXCLUDED.email_verified, phone = EXCLUDED.phone, phone_verified = EXCLUDED.phone_verified, partner_type = EXCLUDED.partner_type",
    )

    await upsertJsonRecord(
      client,
      'public.tour_operator_profiles',
      'public.tour_operator_profiles',
      {
        user_id: operatorUserId,
        account_status: 'active',
        company_name: 'Phase 6 Operator QA Co.',
        contact_person: 'Phase 6 Operator QA',
        email: OPERATOR_EMAIL,
        phone_number: '+923001112233',
        primary_city: 'Islamabad',
        categories: ['adventure', 'day-trips'],
        setup_completed: true,
        verification_documents: { seeded: true, qa: true },
      },
      'user_id',
      "account_status = EXCLUDED.account_status, company_name = EXCLUDED.company_name, contact_person = EXCLUDED.contact_person, email = EXCLUDED.email, phone_number = EXCLUDED.phone_number, primary_city = EXCLUDED.primary_city, categories = EXCLUDED.categories, setup_completed = EXCLUDED.setup_completed, verification_documents = EXCLUDED.verification_documents",
    )

    await client.query('UPDATE public.user_roles SET is_active = false WHERE user_id = $1', [operatorUserId])

    await client.query(
      `
        INSERT INTO public.user_roles (user_id, role_type, is_active, verification_status, profile_completion)
        VALUES
          ($1, 'traveller', false, 'approved', 100),
          ($1, 'tour_operator', true, 'approved', 100)
        ON CONFLICT (user_id, role_type) DO UPDATE
        SET
          is_active = EXCLUDED.is_active,
          verification_status = EXCLUDED.verification_status,
          profile_completion = EXCLUDED.profile_completion
      `,
      [operatorUserId],
    )

    await upsertJsonRecord(
      client,
      'public.tour_operator_settings',
      'public.tour_operator_settings',
      {
        operator_id: operatorUserId,
        business_name: 'Phase 6 Operator QA Co.',
        business_email: OPERATOR_EMAIL,
        business_phone: '+923001112233',
        created_at: rowTimestamp,
        updated_at: rowTimestamp,
        pause_bookings: false,
        booking_notifications: true,
        payment_notifications: true,
        messaging_notifications: true,
        review_notifications: true,
        tour_reminders: true,
        track_analytics: true,
        track_bookings: true,
        currency: 'PKR',
        payment_verified: true,
      },
      'operator_id',
      "business_name = EXCLUDED.business_name, business_email = EXCLUDED.business_email, business_phone = EXCLUDED.business_phone, pause_bookings = EXCLUDED.pause_bookings, booking_notifications = EXCLUDED.booking_notifications, payment_notifications = EXCLUDED.payment_notifications, messaging_notifications = EXCLUDED.messaging_notifications, review_notifications = EXCLUDED.review_notifications, tour_reminders = EXCLUDED.tour_reminders, track_analytics = EXCLUDED.track_analytics, track_bookings = EXCLUDED.track_bookings, currency = EXCLUDED.currency, payment_verified = EXCLUDED.payment_verified",
    )

    const sourceTour = await getSingle('tours', SOURCE_TOUR_ID)
    const sourceSchedule = await getSingle('tour_schedules', SOURCE_SCHEDULE_ID)
    const sourceDepositBooking = await getSingle('tour_bookings', SOURCE_DEPOSIT_BOOKING_ID)
    const sourceRefundBooking = await getSingle('tour_bookings', SOURCE_REFUND_BOOKING_ID)

    const futureStart = new Date()
    futureStart.setUTCDate(futureStart.getUTCDate() + 14)
    futureStart.setUTCHours(7, 0, 0, 0)
    const futureEnd = new Date(futureStart)
    futureEnd.setUTCHours(19, 0, 0, 0)
    const nowIso = new Date().toISOString()

    const tourClone = {
      ...sourceTour,
      id: QA_TOUR_ID,
      operator_id: operatorUserId,
      title: 'Phase 6 QA Promo Deposit + Refund Tour',
      slug: 'phase6-qa-promo-deposit-refund-tour',
      is_published: true,
      is_active: true,
      is_verified: true,
      created_at: nowIso,
      updated_at: nowIso,
    }

    const scheduleClone = {
      ...sourceSchedule,
      id: QA_SCHEDULE_ID,
      tour_id: QA_TOUR_ID,
      start_time: futureStart.toISOString(),
      end_time: futureEnd.toISOString(),
      booked_count: 1,
      status: 'scheduled',
      created_at: nowIso,
    }

    const depositMetadata = {
      ...(sourceDepositBooking.metadata || {}),
      seeded_by: TOOL_NAME,
      qa_operator_email: OPERATOR_EMAIL,
    }

    const refundMetadata = {
      ...(sourceRefundBooking.metadata || {}),
      refund_amount: 765,
      refund_reason: 'Phase 6 operator QA refunded promo deposit booking',
      operator_last_action_reason: 'Phase 6 operator QA refunded promo deposit booking',
      seeded_by: TOOL_NAME,
      qa_operator_email: OPERATOR_EMAIL,
    }

    const depositClone = {
      ...sourceDepositBooking,
      id: QA_DEPOSIT_BOOKING_ID,
      tour_id: QA_TOUR_ID,
      schedule_id: QA_SCHEDULE_ID,
      traveler_id: travelerUserId,
      booking_date: nowIso,
      stripe_payment_intent_id: 'pi_phase6_operator_qa_deposit_booking_001',
      promo_campaign_id: null,
      metadata: depositMetadata,
    }

    const refundClone = {
      ...sourceRefundBooking,
      id: QA_REFUND_BOOKING_ID,
      tour_id: QA_TOUR_ID,
      schedule_id: QA_SCHEDULE_ID,
      traveler_id: travelerUserId,
      booking_date: nowIso,
      stripe_payment_intent_id: 'pi_phase6_operator_qa_refund_booking_001',
      promo_campaign_id: null,
      metadata: refundMetadata,
    }

    await upsertJsonRecord(
      client,
      'public.tours',
      'public.tours',
      tourClone,
      'id',
      "operator_id = EXCLUDED.operator_id, title = EXCLUDED.title, slug = EXCLUDED.slug, is_published = EXCLUDED.is_published, is_active = EXCLUDED.is_active, is_verified = EXCLUDED.is_verified, updated_at = EXCLUDED.updated_at",
    )

    await upsertJsonRecord(
      client,
      'public.tour_schedules',
      'public.tour_schedules',
      scheduleClone,
      'id',
      "tour_id = EXCLUDED.tour_id, start_time = EXCLUDED.start_time, end_time = EXCLUDED.end_time, booked_count = EXCLUDED.booked_count, status = EXCLUDED.status",
    )

    await upsertJsonRecord(
      client,
      'public.tour_bookings',
      'public.tour_bookings',
      depositClone,
      'id',
      "tour_id = EXCLUDED.tour_id, schedule_id = EXCLUDED.schedule_id, traveler_id = EXCLUDED.traveler_id, booking_date = EXCLUDED.booking_date, stripe_payment_intent_id = EXCLUDED.stripe_payment_intent_id, promo_campaign_id = EXCLUDED.promo_campaign_id, metadata = EXCLUDED.metadata",
    )

    await upsertJsonRecord(
      client,
      'public.tour_bookings',
      'public.tour_bookings',
      refundClone,
      'id',
      "tour_id = EXCLUDED.tour_id, schedule_id = EXCLUDED.schedule_id, traveler_id = EXCLUDED.traveler_id, booking_date = EXCLUDED.booking_date, stripe_payment_intent_id = EXCLUDED.stripe_payment_intent_id, promo_campaign_id = EXCLUDED.promo_campaign_id, metadata = EXCLUDED.metadata",
    )

    await client.query('UPDATE public.tour_schedules SET booked_count = 1 WHERE id = $1', [QA_SCHEDULE_ID])

    console.log(JSON.stringify({
      operatorEmail: OPERATOR_EMAIL,
      operatorPassword: OPERATOR_PASSWORD,
      operatorUserId,
      travelerEmail: TRAVELER_QA_EMAIL,
      travelerPassword: TRAVELER_QA_PASSWORD,
      travelerUserId,
      tourId: QA_TOUR_ID,
      scheduleId: QA_SCHEDULE_ID,
      depositBookingId: QA_DEPOSIT_BOOKING_ID,
      refundBookingId: QA_REFUND_BOOKING_ID,
    }, null, 2))
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})