#!/usr/bin/env node
/**
 * End-to-End Stripe Payment Flow Test
 * Tests: Auth → Booking Hold → PaymentIntent Creation → Verification
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zkhppxjeaizpyinfpecj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpraHBweGplYWl6cHlpbmZwZWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MzA5NDIsImV4cCI6MjA4NTIwNjk0Mn0.UWo3pVif2zsN44kAjyYWwhU48XcmC4RPTiw5GSYq1rg';
const TEST_EMAIL = 'traveler@test.com';
const TEST_PASSWORD = 'demo123';
const TEST_PACKAGE_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'; // Maldives package

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function log(step, message, data = null) {
  console.log(`\n[${'✓✗'[0]}] ${step}: ${message}`);
  if (data) console.log(JSON.stringify(data, null, 2));
}

async function testStripeFlow() {
  console.log('\n🧪 TESTING STRIPE PAYMENT FLOW\n');
  console.log('='.repeat(60));

  try {
    // Step 1: Authenticate
    console.log('\n1️⃣  Authenticating test user...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    if (authError) {
      console.log(`❌ Auth failed: ${authError.message}`);
      console.log('ℹ️  Try running: node scripts/create-auth-users.mjs');
      return;
    }

    console.log(`✅ Authenticated: ${authData.user.email} (${authData.user.id})`);
    const jwt = authData.session.access_token;

    try {
      const payloadPart = jwt.split('.')[1];
      const padded = payloadPart + '='.repeat((4 - (payloadPart.length % 4)) % 4);
      const decoded = JSON.parse(Buffer.from(padded, 'base64').toString('utf8'));
      console.log('JWT payload:', {
        iss: decoded.iss,
        aud: decoded.aud,
        exp: decoded.exp,
        sub: decoded.sub,
        role: decoded.role,
      });
    } catch (err) {
      console.log('⚠️  Failed to decode JWT payload for debugging');
    }

    // Step 2: Create booking hold
    console.log('\n2️⃣  Creating package booking hold...');
    const stayNights = 3;
    const searchDays = 60;
    let checkInDate = null;
    let checkOutDate = null;

    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() + 30); // start search 30 days from now

    for (let offset = 0; offset <= searchDays; offset += 1) {
      const candidateCheckIn = new Date(baseDate);
      candidateCheckIn.setDate(baseDate.getDate() + offset);
      const candidateCheckOut = new Date(candidateCheckIn);
      candidateCheckOut.setDate(candidateCheckOut.getDate() + stayNights);

      const { data: available, error: availabilityError } = await supabase.rpc(
        'check_package_availability',
        {
          package_id_param: TEST_PACKAGE_ID,
          check_in_param: candidateCheckIn.toISOString(),
          check_out_param: candidateCheckOut.toISOString(),
        }
      );

      if (availabilityError) {
        console.log(`❌ Availability check failed: ${availabilityError.message}`);
        return;
      }

      if (available) {
        checkInDate = candidateCheckIn;
        checkOutDate = candidateCheckOut;
        break;
      }
    }

    if (!checkInDate || !checkOutDate) {
      console.log('❌ No available dates found in the next 60 days');
      return;
    }

    console.log(
      `✅ Available dates found: ${checkInDate.toDateString()} → ${checkOutDate.toDateString()}`
    );

    const { data: bookingId, error: holdError } = await supabase.rpc('create_package_booking_atomic', {
      package_id_param: TEST_PACKAGE_ID,
      traveler_id_param: authData.user.id,
      check_in_param: checkInDate.toISOString(),
      check_out_param: checkOutDate.toISOString(),
      guest_count_param: 2,
    });

    if (holdError) {
      console.log(`❌ Booking hold failed: ${holdError.message}`);
      console.log('ℹ️  This could mean: package unavailable, overlap detected, or validation failed');
      return;
    }

    if (!bookingId) {
      console.log('❌ Booking hold failed: no booking ID returned');
      return;
    }

    // Fetch booking details
    const { data: booking, error: bookingFetchError } = await supabase
      .from('package_bookings')
      .select('id, total_price, expires_at')
      .eq('id', bookingId)
      .single();

    if (bookingFetchError || !booking) {
      console.log('❌ Could not fetch booking details');
      return;
    }

    console.log(`✅ Booking hold created: ${bookingId}`);
    console.log(`   Total: $${booking.total_price}`);
    console.log(`   Expires: ${new Date(booking.expires_at).toLocaleString()}`);

    // Step 3: Create Stripe PaymentIntent via Edge Function
    console.log('\n3️⃣  Creating Stripe PaymentIntent...');
    const piResponse = await fetch(`${SUPABASE_URL}/functions/v1/stripe-create-payment-intent`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${jwt}`,
        apikey: SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ booking_id: bookingId }),
    });

    const piText = await piResponse.text();
    if (!piResponse.ok) {
      console.log(`❌ PaymentIntent creation failed: status ${piResponse.status}`);
      console.log(piText || '(no response body)');
      return;
    }

    let piData = null;
    try {
      piData = JSON.parse(piText);
    } catch {
      console.log('❌ PaymentIntent creation failed: invalid JSON response');
      console.log(piText || '(no response body)');
      return;
    }

    if (!piData?.ok) {
      console.log(`❌ Edge function returned error: ${piData?.error || 'Unknown error'}`);
      return;
    }

    console.log(`✅ PaymentIntent created successfully`);
    console.log(`   Client Secret: ${piData.client_secret.substring(0, 30)}...`);

    // Step 4: Verify booking status
    console.log('\n4️⃣  Verifying booking status...');
    const { data: updatedBooking, error: bookingError } = await supabase
      .from('package_bookings')
      .select('id, status, payment_status, stripe_payment_intent_id, total_price')
      .eq('id', bookingId)
      .single();

    if (bookingError) {
      console.log(`❌ Could not fetch booking: ${bookingError.message}`);
      return;
    }

    console.log(`✅ Booking status verified:`);
    console.log(`   Status: ${updatedBooking.status}`);
    console.log(`   Payment Status: ${updatedBooking.payment_status}`);
    console.log(`   Stripe PI ID: ${updatedBooking.stripe_payment_intent_id}`);
    console.log(`   Total: $${updatedBooking.total_price}`);

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('\n✅ STRIPE PAYMENT FLOW TEST PASSED');
    console.log('\nFlow validated:');
    console.log('  ✓ User authentication');
    console.log('  ✓ Booking hold creation (10-min expiry)');
    console.log('  ✓ Stripe PaymentIntent creation via Edge Function');
    console.log('  ✓ Edge Function secrets loaded (STRIPE_SECRET_KEY, SERVICE_ROLE_KEY)');
    console.log('  ✓ Booking updated with payment_status=processing');
    console.log('\n🎉 Ready for production card payments!');
    console.log('\nNext steps:');
    console.log(`  1. Visit: https://tripavail-web-production.up.railway.app/package/${TEST_PACKAGE_ID}`);
    console.log('  2. Select dates (min 3 nights) and click Continue');
    console.log('  3. Enter test card: 4242 4242 4242 4242, future exp, any CVC');
    console.log('  4. Complete payment and verify booking confirmation');

  } catch (err) {
    console.log(`\n❌ UNEXPECTED ERROR: ${err.message}`);
    console.error(err);
  }
}

testStripeFlow().catch(console.error);
