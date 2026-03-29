import fs from 'node:fs'
import path from 'node:path'

import { createClient } from '@supabase/supabase-js'

import {
  createRemoteClient,
  loadRemoteDbEnv,
  resolveRemoteConnectionString,
} from './lib/remoteDb.mjs'

const TOOL_NAME = 'provision-storefront-browser-qa.mjs'

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

const OPERATOR_EMAIL = 'premium.operator.qa@tripavail.test'
const OPERATOR_PASSWORD = 'Premium-Operator-QA_2026!'
const OPERATOR_FULL_NAME = 'Northern Summit Expeditions'
const OPERATOR_SLUG = 'northern-summit-expeditions'

const ADMIN_EMAIL = 'admin.browser.qa@tripavail.test'
const ADMIN_PASSWORD = 'Admin-Browser-QA_2026!'

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

async function ensureAdminQaUser() {
  const users = await listAllUsers()
  const existing = users.find((user) => (user.email || '').toLowerCase() === ADMIN_EMAIL.toLowerCase())

  let userId = existing?.id ?? null
  if (userId) {
    const { error } = await admin.auth.admin.updateUserById(userId, {
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: {
        ...(existing.user_metadata || {}),
        full_name: 'Browser QA Admin',
        seeded_by: TOOL_NAME,
      },
    })
    if (error) throw error
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: {
        full_name: 'Browser QA Admin',
        seeded_by: TOOL_NAME,
      },
    })
    if (error) throw error
    userId = data.user?.id ?? null
  }

  if (!userId) throw new Error('Missing admin auth user id')

  return userId
}

async function main() {
  const client = createRemoteClient(remoteConnectionString)
  await client.connect()

  try {
    await client.query('BEGIN')

    const { rows } = await client.query(
      `
        SELECT user_id
        FROM public.tour_operator_profiles
        WHERE slug IN ('operator-3', $1)
        ORDER BY CASE WHEN slug = $1 THEN 0 ELSE 1 END, updated_at DESC NULLS LAST
        LIMIT 1
      `,
      [OPERATOR_SLUG],
    )

    if (rows.length === 0) {
      throw new Error('No premium showcase operator row found to provision')
    }

    const operatorUserId = rows[0].user_id

    const { error: authUpdateError } = await admin.auth.admin.updateUserById(operatorUserId, {
      email: OPERATOR_EMAIL,
      password: OPERATOR_PASSWORD,
      email_confirm: true,
      user_metadata: {
        full_name: OPERATOR_FULL_NAME,
        seeded_by: TOOL_NAME,
      },
    })
    if (authUpdateError) throw authUpdateError

    const rowTimestamp = new Date().toISOString()

    await client.query(
      `
        INSERT INTO public.profiles (
          id,
          email,
          first_name,
          last_name,
          account_status,
          created_at,
          updated_at,
          email_verified,
          phone,
          phone_verified,
          partner_type
        )
        VALUES ($1, $2, 'Northern Summit', 'Expeditions', 'active', $3, $3, true, '+923001234567', true, 'tour_operator')
        ON CONFLICT (id) DO UPDATE
        SET
          email = EXCLUDED.email,
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          account_status = EXCLUDED.account_status,
          updated_at = EXCLUDED.updated_at,
          email_verified = EXCLUDED.email_verified,
          phone = EXCLUDED.phone,
          phone_verified = EXCLUDED.phone_verified,
          partner_type = EXCLUDED.partner_type
      `,
      [operatorUserId, OPERATOR_EMAIL, rowTimestamp],
    )

    await client.query(
      `
        UPDATE public.tour_operator_profiles
        SET slug = $2,
            business_name = $3,
            company_name = $3,
            contact_person = 'Ayesha Rahman',
            email = $4,
            phone_number = '+923001234567',
            primary_city = 'Islamabad, Pakistan',
            coverage_range = 'national',
            years_experience = '8-10 years',
            team_size = 'Team of 12-18',
            description = 'Northern Summit Expeditions runs verified premium departures with documented fleet support, family-ready pacing, and guide-led route management across northern Pakistan.',
            categories = ARRAY['premium', 'family', 'expedition', 'mountain logistics'],
            is_public = true,
            setup_completed = true,
            updated_at = now()
        WHERE user_id = $1
      `,
      [operatorUserId, OPERATOR_SLUG, OPERATOR_FULL_NAME, OPERATOR_EMAIL],
    )

    await client.query(
      `
        UPDATE public.tour_operator_settings
        SET business_name = $2,
            business_email = $3,
            business_phone = '+923001234567',
            currency = 'PKR',
            payment_verified = true,
            updated_at = now()
        WHERE operator_id = $1
      `,
      [operatorUserId, OPERATOR_FULL_NAME, OPERATOR_EMAIL],
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

    await client.query('COMMIT')

    const adminUserId = await ensureAdminQaUser()

    await client.query(
      `
        INSERT INTO public.users (id, email)
        VALUES ($1, $2)
        ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email
      `,
      [adminUserId, ADMIN_EMAIL],
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
      [adminUserId],
    )

    await client.query(
      `
        INSERT INTO public.traveller_profiles (user_id)
        VALUES ($1)
        ON CONFLICT (user_id) DO NOTHING
      `,
      [adminUserId],
    )

    await client.query(
      `
        INSERT INTO public.admin_users (id, email, role)
        VALUES ($1, $2, 'super_admin')
        ON CONFLICT (id) DO UPDATE
        SET email = EXCLUDED.email, role = EXCLUDED.role
      `,
      [adminUserId, ADMIN_EMAIL],
    )

    console.log(
      JSON.stringify(
        {
          operator: {
            userId: operatorUserId,
            email: OPERATOR_EMAIL,
            password: OPERATOR_PASSWORD,
            slug: OPERATOR_SLUG,
            name: OPERATOR_FULL_NAME,
          },
          admin: {
            userId: adminUserId,
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD,
          },
        },
        null,
        2,
      ),
    )
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    await client.end()
  }
}

await main()