import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

function loadDotenv(dotenvPath) {
  const env = {};
  if (!fs.existsSync(dotenvPath)) return env;

  const raw = fs.readFileSync(dotenvPath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

function requireEnv(env, key) {
  const value = env[key] ?? process.env[key];
  if (!value) throw new Error(`Missing env var: ${key}`);
  return value;
}

function optionalEnv(env, ...keys) {
  for (const key of keys) {
    const value = env[key] ?? process.env[key];
    if (value) return value;
  }
  return null;
}

function randomEmail() {
  const suffix = crypto.randomBytes(8).toString('hex');
  return `smoke.${suffix}@tripavail.local`;
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function mask(value) {
  if (!value || typeof value !== 'string') return null;
  if (value.length <= 16) return `${value.slice(0, 4)}…`;
  return `${value.slice(0, 8)}…${value.slice(-4)}`;
}

async function main() {
  const repoRoot = path.resolve(process.cwd());
  const dotenvPath = path.join(repoRoot, '.env');
  const dotenv = loadDotenv(dotenvPath);

  const supabaseUrl = requireEnv(dotenv, 'VITE_SUPABASE_URL');
  const anonKey = requireEnv(dotenv, 'VITE_SUPABASE_ANON_KEY');
  const serviceRoleKey = requireEnv(dotenv, 'SUPABASE_SERVICE_ROLE_KEY');
  const stripeSecretKey = optionalEnv(dotenv, 'STRIPE_SECRET_KEY', 'secret_key', 'STRIPE_SECRET') ?? null;

  const email = randomEmail();
  const password = `T3st!${crypto.randomBytes(8).toString('hex')}`;

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const anon = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  async function callFunction(functionName, body, accessTokenOrNull) {
    const url = `${supabaseUrl}/functions/v1/${functionName}`;
    const headers = {
      apikey: anonKey,
      'content-type': 'application/json',
    };
    if (accessTokenOrNull) headers.authorization = `Bearer ${accessTokenOrNull}`;

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body ?? {}),
    });

    const text = await res.text();
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = { _raw: text };
    }

    return { status: res.status, ok: res.ok, body: json };
  }

  async function confirmPaymentIntent(stripe, paymentIntentId) {
    // Confirm using Stripe's built-in test payment method (equivalent to 4242... in test mode).
    // This avoids handling raw card details in scripts.
    return await stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method: 'pm_card_visa',
      return_url: 'https://tripavail.com/payments/return',
    });
  }

  const createdIds = {
    userId: null,
    tourScheduleId: null,
    tourBookingId: null,
    packageBookingId: null,
  };

  // Create a real user and mark email confirmed so password auth works reliably.
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createError) throw new Error(`admin.createUser failed: ${createError.message}`);
  if (!created?.user?.id) throw new Error('admin.createUser returned no user');
  createdIds.userId = created.user.id;

  const { data: signIn, error: signInError } = await anon.auth.signInWithPassword({ email, password });
  if (signInError) throw new Error(`signInWithPassword failed: ${signInError.message}`);
  const accessToken = signIn?.session?.access_token;
  if (!accessToken) throw new Error('No access token from sign-in');

  // Pick an existing published tour (or any tour) and a schedule; create a schedule if none exists.
  const { data: tourRow, error: tourErr } = await admin
    .from('tours')
    .select('id, currency')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (tourErr || !tourRow?.id) throw new Error(`No tours found to test with: ${tourErr?.message ?? 'missing tour'}`);

  const tourId = tourRow.id;

  let scheduleId = null;
  const { data: scheduleRow } = await admin
    .from('tour_schedules')
    .select('id, start_time, end_time, capacity')
    .eq('tour_id', tourId)
    .order('start_time', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (scheduleRow?.id) {
    scheduleId = scheduleRow.id;
  } else {
    const now = new Date();
    const start = addMinutes(now, 60);
    const end = addMinutes(now, 180);
    const { data: insertedSchedule, error: insScheduleErr } = await admin
      .from('tour_schedules')
      .insert({
        tour_id: tourId,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        capacity: 10,
        status: 'scheduled',
      })
      .select('id')
      .single();
    if (insScheduleErr || !insertedSchedule?.id) {
      throw new Error(`Failed to create tour schedule: ${insScheduleErr?.message ?? 'unknown error'}`);
    }
    scheduleId = insertedSchedule.id;
    createdIds.tourScheduleId = scheduleId;
  }

  // Pick an existing package.
  const { data: packageRow, error: pkgErr } = await admin
    .from('packages')
    .select('id')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (pkgErr || !packageRow?.id) throw new Error(`No packages found to test with: ${pkgErr?.message ?? 'missing package'}`);

  const packageId = packageRow.id;

  // Create real pending booking holds.
  const expiresAt = addMinutes(new Date(), 10).toISOString();

  const { data: tourBooking, error: tourBookingErr } = await admin
    .from('tour_bookings')
    .insert({
      tour_id: tourId,
      schedule_id: scheduleId,
      traveler_id: createdIds.userId,
      status: 'pending',
      total_price: 1,
      pax_count: 1,
      expires_at: expiresAt,
      payment_status: 'unpaid',
    })
    .select('id')
    .single();
  if (tourBookingErr || !tourBooking?.id) throw new Error(`Failed to create tour booking hold: ${tourBookingErr?.message ?? 'unknown error'}`);
  createdIds.tourBookingId = tourBooking.id;

  const { data: packageBooking, error: packageBookingErr } = await admin
    .from('package_bookings')
    .insert({
      package_id: packageId,
      traveler_id: createdIds.userId,
      status: 'pending',
      total_price: 1,
      guest_count: 1,
      expires_at: expiresAt,
      payment_status: 'unpaid',
    })
    .select('id')
    .single();
  if (packageBookingErr || !packageBooking?.id) {
    throw new Error(`Failed to create package booking hold: ${packageBookingErr?.message ?? 'unknown error'}`);
  }
  createdIds.packageBookingId = packageBooking.id;

  // 1) Call WITHOUT auth: should be 401
  const noAuthRes = await callFunction(
    'stripe-create-payment-intent',
    { booking_id: '00000000-0000-0000-0000-000000000000', booking_type: 'tour' },
    null,
  );

  // 2) Call WITH auth + dummy booking: should NOT be 401 Invalid JWT.
  const withAuthDummyTour = await callFunction(
    'stripe-create-payment-intent',
    { booking_id: '00000000-0000-0000-0000-000000000000', booking_type: 'tour' },
    accessToken,
  );

  const withAuthDummyPackage = await callFunction(
    'stripe-create-payment-intent',
    { booking_id: '00000000-0000-0000-0000-000000000000', booking_type: 'package' },
    accessToken,
  );

  // 3) Call WITH auth + real booking holds: should be 200 and return a client_secret.
  const createPiTour = await callFunction(
    'stripe-create-payment-intent',
    { booking_id: createdIds.tourBookingId, booking_type: 'tour' },
    accessToken,
  );

  const createPiPackage = await callFunction(
    'stripe-create-payment-intent',
    { booking_id: createdIds.packageBookingId, booking_type: 'package' },
    accessToken,
  );

  const tourClientSecret = createPiTour?.body?.client_secret;
  const pkgClientSecret = createPiPackage?.body?.client_secret;

  const tourPaymentIntentId = createPiTour?.body?.payment_intent_id ?? null;
  const pkgPaymentIntentId = createPiPackage?.body?.payment_intent_id ?? null;

  const createPiAssertions = {
    tour_ok: createPiTour.status === 200 && Boolean(tourClientSecret),
    package_ok: createPiPackage.status === 200 && Boolean(pkgClientSecret),
  };

  // 4) Confirm the PaymentIntents using Stripe test card, then call stripe-verify-payment-intent.
  let stripe = null;
  let confirmTour = null;
  let confirmPackage = null;
  let verifyTour = null;
  let verifyPackage = null;

  if (!stripeSecretKey) {
    throw new Error(
      'Missing Stripe secret key for confirmation step. Set STRIPE_SECRET_KEY=sk_test_... (preferred) in .env (or your shell env) and rerun.'
    );
  }

  if (String(stripeSecretKey).startsWith('sb_')) {
    throw new Error(
      'Invalid Stripe secret key format detected (starts with "sb_"). For this smoke test, set STRIPE_SECRET_KEY to a real Stripe key (sk_test_... in test mode) and rerun.'
    );
  }

  stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2024-06-20',
    // typescript: ignore because we are in plain JS; Stripe expects a runtime string.
  });

  if (tourPaymentIntentId) {
    confirmTour = await confirmPaymentIntent(stripe, tourPaymentIntentId);
    verifyTour = await callFunction(
      'stripe-verify-payment-intent',
      {
        booking_id: createdIds.tourBookingId,
        payment_intent_id: tourPaymentIntentId,
        booking_type: 'tour',
      },
      accessToken,
    );
  }

  if (pkgPaymentIntentId) {
    confirmPackage = await confirmPaymentIntent(stripe, pkgPaymentIntentId);
    verifyPackage = await callFunction(
      'stripe-verify-payment-intent',
      {
        booking_id: createdIds.packageBookingId,
        payment_intent_id: pkgPaymentIntentId,
        booking_type: 'package',
      },
      accessToken,
    );
  }

  const fullFlowAssertions = {
    tour_confirmed: confirmTour?.status === 'succeeded',
    package_confirmed: confirmPackage?.status === 'succeeded',
    tour_verified: verifyTour?.status === 200 && verifyTour?.body?.ok === true,
    package_verified: verifyPackage?.status === 200 && verifyPackage?.body?.ok === true,
  };

  // Print only high-level results (no secrets)
  const summary = {
    supabaseUrl,
    created: {
      userId: createdIds.userId,
      tourId,
      scheduleId,
      tourBookingId: createdIds.tourBookingId,
      packageId,
      packageBookingId: createdIds.packageBookingId,
    },
    results: {
      createPI_noAuth: noAuthRes,
      createPI_withAuth_dummy_tour: withAuthDummyTour,
      createPI_withAuth_dummy_package: withAuthDummyPackage,
      createPI_withAuth_real_tour: {
        status: createPiTour.status,
        ok: createPiTour.ok,
        body: {
          ok: createPiTour.body?.ok ?? null,
          payment_intent_id: mask(createPiTour.body?.payment_intent_id) ?? null,
          client_secret: mask(createPiTour.body?.client_secret) ?? null,
          error: createPiTour.body?.error ?? null,
        },
      },
      createPI_withAuth_real_package: {
        status: createPiPackage.status,
        ok: createPiPackage.ok,
        body: {
          ok: createPiPackage.body?.ok ?? null,
          payment_intent_id: mask(createPiPackage.body?.payment_intent_id) ?? null,
          client_secret: mask(createPiPackage.body?.client_secret) ?? null,
          error: createPiPackage.body?.error ?? null,
        },
      },
      confirm_and_verify: {
        tour: {
          payment_intent_id: mask(tourPaymentIntentId),
          confirmed_status: confirmTour?.status ?? null,
          verify: verifyTour,
        },
        package: {
          payment_intent_id: mask(pkgPaymentIntentId),
          confirmed_status: confirmPackage?.status ?? null,
          verify: verifyPackage,
        },
        assertions: fullFlowAssertions,
      },
      assertions: createPiAssertions,
    },
  };

  console.log(JSON.stringify(summary, null, 2));

  // Best-effort cleanup (does not throw)
  try {
    if (createdIds.tourBookingId) await admin.from('tour_bookings').delete().eq('id', createdIds.tourBookingId);
    if (createdIds.packageBookingId) await admin.from('package_bookings').delete().eq('id', createdIds.packageBookingId);
    if (createdIds.tourScheduleId) await admin.from('tour_schedules').delete().eq('id', createdIds.tourScheduleId);
  } catch {
    // ignore
  }
  try {
    if (createdIds.userId) await admin.auth.admin.deleteUser(createdIds.userId);
  } catch {
    // ignore
  }
}

main().catch((e) => {
  console.error(e?.stack || String(e));
  process.exit(1);
});
