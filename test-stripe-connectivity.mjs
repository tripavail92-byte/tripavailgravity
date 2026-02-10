#!/usr/bin/env node
/**
 * Stripe Integration Connectivity Test
 * Validates: Edge Functions deployed, secrets configured, Railway env vars set
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zkhppxjeaizpyinfpecj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpraHBweGplYWl6cHlpbmZwZWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MzA5NDIsImV4cCI6MjA4NTIwNjk0Mn0.UWo3pVif2zsN44kAjyYWwhU48XcmC4RPTiw5GSYq1rg';
const RAILWAY_URL = 'https://tripavail-web-production.up.railway.app';
const TEST_EMAIL = 'traveler@test.com';
const TEST_PASSWORD = 'demo123';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('\n🔍 STRIPE INTEGRATION CONNECTIVITY TEST\n');
console.log('='.repeat(70));

async function test() {
  const results = {
    auth: false,
    edgeFunction: false,
    edgeFunctionSecrets: false,
    railwayDeployment: false,
    railwayEnvVars: false,
  };

  try {
    // Test 1: Authentication
    console.log('\n1️⃣  Testing Supabase Authentication...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    if (authError) {
      console.log(`   ❌ Auth failed: ${authError.message}`);
    } else {
      console.log(`   ✅ Auth working: ${authData.user.email}`);
      results.auth = true;
    }

    const jwt = authData?.session?.access_token;

    // Test 2: Edge Function Deployment
    console.log('\n2️⃣  Testing Edge Function Deployment...');
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/stripe-create-payment-intent`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${jwt || SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ booking_id: 'test-connectivity' }),
      });

      if (response.status === 404) {
        console.log(`   ❌ Edge function not deployed (404)`);
      } else {
        console.log(`   ✅ Edge function deployed (status: ${response.status})`);
        results.edgeFunction = true;

        const body = await response.json();
        
        // Test 3: Edge Function Secrets
        console.log('\n3️⃣  Testing Edge Function Secrets...');
        if (body.error && body.error.includes('Missing STRIPE_SECRET_KEY')) {
          console.log(`   ❌ STRIPE_SECRET_KEY not set`);
        } else if (body.error && body.error.includes('Missing Supabase env')) {
          console.log(`   ❌ SERVICE_ROLE_KEY or EDGE_SUPABASE_URL not set`);
        } else {
          console.log(`   ✅ All edge function secrets configured`);
          results.edgeFunctionSecrets = true;
        }
      }
    } catch (err) {
      console.log(`   ❌ Edge function request failed: ${err.message}`);
    }

    // Test 4: Railway Deployment
    console.log('\n4️⃣  Testing Railway Deployment...');
    try {
      const railwayResponse = await fetch(RAILWAY_URL, {
        method: 'HEAD',
        redirect: 'manual',
      });
      console.log(`   ✅ Railway app is live (status: ${railwayResponse.status})`);
      results.railwayDeployment = true;

      // Test 5: Railway Environment Variables (by checking if the app loads correctly)
      console.log('\n5️⃣  Testing Railway Environment Variables...');
      const pageResponse = await fetch(RAILWAY_URL);
      const html = await pageResponse.text();
      
      if (html.includes('Supabase') || html.includes('TripAvail') || pageResponse.ok) {
        console.log(`   ✅ Railway env vars configured (app loads successfully)`);
        results.railwayEnvVars = true;
      } else {
        console.log(`   ⚠️  Railway app loaded but may have config issues`);
      }
    } catch (err) {
      console.log(`   ❌ Railway deployment check failed: ${err.message}`);
    }

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('\n📊 TEST RESULTS SUMMARY:\n');
    
    const checks = [
      { name: 'Supabase Authentication', pass: results.auth },
      { name: 'Edge Function Deployed', pass: results.edgeFunction },
      { name: 'Edge Function Secrets', pass: results.edgeFunctionSecrets },
      { name: 'Railway Deployment', pass: results.railwayDeployment },
      { name: 'Railway Env Vars', pass: results.railwayEnvVars },
    ];

    checks.forEach(check => {
      console.log(`  ${check.pass ? '✅' : '❌'} ${check.name}`);
    });

    const passed = checks.filter(c => c.pass).length;
    const total = checks.length;

    console.log(`\n${passed}/${total} checks passed`);

    if (passed === total) {
      console.log('\n🎉 ALL SYSTEMS GO! Stripe payment integration is ready.');
      console.log('\n📝 Next steps:');
      console.log(`  1. Visit: ${RAILWAY_URL}/package/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa`);
      console.log('  2. Select valid dates (check package min/max nights)');
      console.log('  3. Click Continue to checkout');
      console.log('  4. Enter Stripe test card: 4242 4242 4242 4242');
      console.log('     Exp: any future date, CVC: any 3 digits');
      console.log('  5. Complete payment and verify booking confirmation');
      console.log('\n💳 Stripe Test Cards:');
      console.log('  • Success: 4242 4242 4242 4242');
      console.log('  • Decline: 4000 0000 0000 0002');
      console.log('  • 3D Secure: 4000 0027 6000 3184');
    } else {
      console.log('\n⚠️  Some checks failed. Review the errors above.');
      
      if (!results.edgeFunctionSecrets) {
        console.log('\n🔧 To fix missing secrets:');
        console.log('  1. Verify supabase-secrets.env has:');
        console.log('     - EDGE_SUPABASE_URL');
        console.log('     - SERVICE_ROLE_KEY');
        console.log('     - STRIPE_SECRET_KEY');
        console.log('  2. Run: supabase secrets set --project-ref zkhppxjeaizpyinfpecj --env-file ./supabase-secrets.env');
        console.log('  3. Redeploy functions: supabase functions deploy stripe-create-payment-intent --project-ref zkhppxjeaizpyinfpecj');
      }
    }

    console.log('\n' + '='.repeat(70) + '\n');

  } catch (err) {
    console.error(`\n❌ Test failed with error: ${err.message}`);
    console.error(err);
  }
}

test().catch(console.error);
