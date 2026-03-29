import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

import { createClient } from '@supabase/supabase-js'

const OPERATOR_EMAIL = 'premium.operator.qa@tripavail.test'
const OPERATOR_PASSWORD = 'Premium-Operator-QA_2026!'
const ADMIN_EMAIL = 'admin.browser.qa@tripavail.test'
const ADMIN_PASSWORD = 'Admin-Browser-QA_2026!'
const TRAVELER_EMAIL = 'phase6-traveler-qa@tripavail.test'
const TRAVELER_PASSWORD = 'Phase6-Traveler-QA_2026!'
const OPERATOR_SLUG = 'northern-summit-expeditions'
const QA_AWARD_CODE = 'qa_smoke_check'
const PUBLIC_OPERATOR_LIMIT = 8

const summary = {
  slug: OPERATOR_SLUG,
  checks: [],
}

function emitAttributionSplitMarker(details) {
  const attributedBookingDelta = Number(details?.attributedBookingDelta || 0)
  const directBookingDelta = Number(details?.directBookingDelta || 0)
  console.log(
    `STORE_FRONT_ATTRIBUTION_SPLIT=PASS attributed_booking_delta=${attributedBookingDelta} direct_booking_delta=${directBookingDelta}`,
  )
}

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
const anonKey = envAny('VITE_SUPABASE_ANON_KEY') || envAny('NEXT_PUBLIC_SUPABASE_ANON_KEY') || envAny('SUPABASE_ANON_KEY')

if (!supabaseUrl || !anonKey) {
  throw new Error('Missing Supabase URL or anon key')
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function recordCheck(name, passed, details = null) {
  summary.checks.push({ name, passed, details })
}

function createSessionId(prefix) {
  return `${prefix}-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`
}

function createPublicClient() {
  return createClient(supabaseUrl, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

async function signIn(email, password) {
  const client = createPublicClient()
  const { data, error } = await client.auth.signInWithPassword({ email, password })
  if (error) throw error
  assert(data.user, `Missing authenticated user for ${email}`)
  return { client, user: data.user }
}

async function signInTraveler() {
  try {
    return await signIn(TRAVELER_EMAIL, TRAVELER_PASSWORD)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(
      `Traveler QA sign-in failed for ${TRAVELER_EMAIL}. Provision it with npm run qa:provision:phase6-operator. Underlying error: ${message}`,
    )
  }
}

async function fetchSingle(client, table, queryBuilder) {
  const { data, error } = await queryBuilder(client.from(table))
  if (error) throw error
  return data
}

async function callRpcSingle(client, name, params) {
  const { data, error } = await client.rpc(name, params)
  if (error) throw error
  return Array.isArray(data) ? (data[0] ?? null) : data
}

function policyCount(policyMap) {
  if (!policyMap || typeof policyMap !== 'object') return 0
  return Object.values(policyMap).filter((value) => String(value || '').trim().length > 0).length
}

async function main() {
  const publicClient = createPublicClient()

  const publicProfiles = await fetchSingle(publicClient, 'tour_operator_profiles', (query) =>
    query
      .select('user_id, slug, business_name, company_name, is_public, setup_completed, gallery_media, fleet_assets, guide_profiles, public_policies, description, primary_city, updated_at')
      .eq('is_public', true)
      .order('updated_at', { ascending: false })
      .limit(PUBLIC_OPERATOR_LIMIT),
  )

  assert(Array.isArray(publicProfiles) && publicProfiles.length >= 1, 'No public storefront profiles found')

  const publicProfile = publicProfiles.find((profile) => profile.slug === OPERATOR_SLUG)

  assert(publicProfile?.user_id, 'Public storefront profile not found for northern-summit-expeditions')

  const operatorIds = publicProfiles.map((profile) => profile.user_id)
  const activeTours = await fetchSingle(publicClient, 'tours', (query) =>
    query
      .select('id, operator_id, title, is_active')
      .in('operator_id', operatorIds)
      .eq('is_active', true)
      .order('created_at', { ascending: false }),
  )

  const toursByOperator = new Map()
  for (const tour of activeTours || []) {
    const current = toursByOperator.get(tour.operator_id) || []
    current.push(tour)
    toursByOperator.set(tour.operator_id, current)
  }

  const storefrontOperators = publicProfiles.filter((profile) => (toursByOperator.get(profile.user_id) || []).length > 0)
  const secondaryProfile = storefrontOperators.find((profile) => profile.user_id !== publicProfile.user_id)

  assert(secondaryProfile?.user_id, 'Expected at least one additional public operator with active tours for expanded smoke coverage')
  assert((toursByOperator.get(publicProfile.user_id) || []).length >= 1, 'Primary storefront operator has no active tours')
  assert((toursByOperator.get(secondaryProfile.user_id) || []).length >= 1, 'Secondary storefront operator has no active tours')

  assert(publicProfile.setup_completed === true, 'Premium storefront profile is not marked setup-complete')
  assert(Array.isArray(publicProfile.gallery_media) && publicProfile.gallery_media.length >= 4, 'Premium storefront is missing expected gallery media')
  assert(Array.isArray(publicProfile.fleet_assets) && publicProfile.fleet_assets.length >= 1, 'Premium storefront is missing fleet assets')
  assert(Array.isArray(publicProfile.guide_profiles) && publicProfile.guide_profiles.length >= 1, 'Premium storefront is missing guide profiles')
  assert(policyCount(publicProfile.public_policies) >= 4, 'Premium storefront is missing expected public policy coverage')
  recordCheck('public_storefront_profile', true, {
    operatorId: publicProfile.user_id,
    galleryItems: publicProfile.gallery_media.length,
    fleetAssets: publicProfile.fleet_assets.length,
    guideProfiles: publicProfile.guide_profiles.length,
    policyFields: policyCount(publicProfile.public_policies),
  })

  recordCheck('public_storefront_catalog', true, {
    publicStorefrontCount: storefrontOperators.length,
    secondaryOperatorSlug: secondaryProfile.slug,
    primaryTourCount: (toursByOperator.get(publicProfile.user_id) || []).length,
    secondaryTourCount: (toursByOperator.get(secondaryProfile.user_id) || []).length,
  })

  const publicAwards = await fetchSingle(publicClient, 'operator_awards', (query) =>
    query
      .select('award_code, award_name, award_source, expires_at')
      .eq('operator_id', publicProfile.user_id)
      .order('awarded_at', { ascending: false }),
  )

  assert(Array.isArray(publicAwards) && publicAwards.length >= 8, 'Public storefront awards are unexpectedly sparse')
  recordCheck('public_awards', true, { count: publicAwards.length })

  const secondaryAwards = await fetchSingle(publicClient, 'operator_awards', (query) =>
    query
      .select('award_code, award_name, award_source, expires_at')
      .eq('operator_id', secondaryProfile.user_id)
      .order('awarded_at', { ascending: false }),
  )

  assert(Array.isArray(secondaryAwards), 'Secondary storefront awards query failed')
  recordCheck('secondary_storefront_profile', true, {
    operatorId: secondaryProfile.user_id,
    slug: secondaryProfile.slug,
    tourCount: (toursByOperator.get(secondaryProfile.user_id) || []).length,
    awardCount: secondaryAwards.length,
    policyFields: policyCount(secondaryProfile.public_policies),
  })

  const { client: operatorClient, user: operatorUser } = await signIn(OPERATOR_EMAIL, OPERATOR_PASSWORD)
  assert(operatorUser.id === publicProfile.user_id, 'Operator QA account does not match the premium storefront profile')
  recordCheck('operator_auth', true, { operatorUserId: operatorUser.id })

  const analyticsBefore = await callRpcSingle(operatorClient, 'get_operator_storefront_analytics', {
    p_operator_id: operatorUser.id,
    p_days: 30,
  })

  const analytics = analyticsBefore
  assert(analytics, 'Operator analytics RPC returned no row')
  assert(Number(analytics.profile_views) >= 1, 'Operator analytics returned no profile views')
  assert(Number(analytics.unique_visitors) >= 1, 'Operator analytics returned no unique visitors')
  assert(Number(analytics.engaged_visitors) >= 0, 'Operator analytics returned invalid engaged visitor count')
  assert(Number(analytics.engaged_visitors) <= Number(analytics.unique_visitors), 'Engaged visitors exceed unique visitors')
  assert(Number(analytics.engagement_rate) >= 0 && Number(analytics.engagement_rate) <= 100, 'Engagement rate is outside the 0-100 range')
  recordCheck('operator_analytics', true, {
    profile_views: Number(analytics.profile_views),
    unique_visitors: Number(analytics.unique_visitors),
    engaged_visitors: Number(analytics.engaged_visitors),
    cta_clicks: Number(analytics.cta_clicks),
    tour_clicks: Number(analytics.tour_clicks),
    engagement_rate: Number(analytics.engagement_rate),
  })

  const operatorEvents = await fetchSingle(operatorClient, 'operator_storefront_events', (query) =>
    query
      .select('id, event_type, created_at')
      .eq('operator_id', operatorUser.id)
      .order('created_at', { ascending: false })
      .limit(10),
  )

  assert(Array.isArray(operatorEvents) && operatorEvents.length >= 3, 'Operator storefront events are missing or inaccessible')
  recordCheck('operator_events', true, { count: operatorEvents.length })

  const primaryTours = toursByOperator.get(publicProfile.user_id) || []
  const firstPrimaryTour = primaryTours[0]
  const secondPrimaryTour = primaryTours[1] || primaryTours[0]
  assert(firstPrimaryTour?.id, 'Primary storefront operator is missing an active tour for smoke events')

  const anonymousSession = createSessionId('anon-storefront')
  await publicClient.rpc('record_operator_storefront_event', {
    p_operator_id: publicProfile.user_id,
    p_event_type: 'profile_view',
    p_slug: publicProfile.slug,
    p_session_id: anonymousSession,
    p_metadata: { source: 'qa_storefront_flows', actor: 'anonymous' },
  })
  await publicClient.rpc('record_operator_storefront_event', {
    p_operator_id: publicProfile.user_id,
    p_event_type: 'cta_click',
    p_slug: publicProfile.slug,
    p_session_id: anonymousSession,
    p_metadata: { source: 'qa_storefront_flows', actor: 'anonymous', cta: 'hero_view_tours' },
  })
  await publicClient.rpc('record_operator_storefront_event', {
    p_operator_id: publicProfile.user_id,
    p_event_type: 'tour_click',
    p_slug: publicProfile.slug,
    p_tour_id: firstPrimaryTour.id,
    p_session_id: anonymousSession,
    p_metadata: { source: 'qa_storefront_flows', actor: 'anonymous', tourTitle: firstPrimaryTour.title },
  })

  const { client: travelerClient, user: travelerUser } = await signInTraveler()
  recordCheck('traveler_auth', true, { travelerUserId: travelerUser.id, travelerEmail: TRAVELER_EMAIL })

  const travelerAttributedSession = createSessionId('traveler-attributed')
  const travelerDirectBookingSession = createSessionId('traveler-direct-booking')

  await travelerClient.rpc('record_operator_storefront_event', {
    p_operator_id: publicProfile.user_id,
    p_event_type: 'profile_view',
    p_slug: publicProfile.slug,
    p_session_id: travelerAttributedSession,
    p_metadata: { source: 'qa_storefront_flows', actor: 'traveler', path: 'public_storefront' },
  })
  await travelerClient.rpc('record_operator_storefront_event', {
    p_operator_id: publicProfile.user_id,
    p_event_type: 'tour_click',
    p_slug: publicProfile.slug,
    p_tour_id: secondPrimaryTour.id,
    p_session_id: travelerAttributedSession,
    p_metadata: { source: 'qa_storefront_flows', actor: 'traveler', tourTitle: secondPrimaryTour.title },
  })
  await travelerClient.rpc('record_operator_storefront_event', {
    p_operator_id: publicProfile.user_id,
    p_event_type: 'booking_start',
    p_slug: publicProfile.slug,
    p_tour_id: secondPrimaryTour.id,
    p_session_id: travelerAttributedSession,
    p_metadata: { source: 'qa_storefront_flows', actor: 'traveler', permutation: 'attributed_booking_start' },
  })
  await travelerClient.rpc('record_operator_storefront_event', {
    p_operator_id: publicProfile.user_id,
    p_event_type: 'booking_start',
    p_slug: publicProfile.slug,
    p_tour_id: firstPrimaryTour.id,
    p_session_id: travelerDirectBookingSession,
    p_metadata: { source: 'qa_storefront_flows', actor: 'traveler', permutation: 'direct_booking_without_profile_view' },
  })

  const analyticsAfter = await callRpcSingle(operatorClient, 'get_operator_storefront_analytics', {
    p_operator_id: operatorUser.id,
    p_days: 30,
  })

  const permutationEvents = await fetchSingle(operatorClient, 'operator_storefront_events', (query) =>
    query
      .select('session_id, event_type, tour_id, created_at, metadata')
      .eq('operator_id', operatorUser.id)
      .in('session_id', [travelerAttributedSession, travelerDirectBookingSession])
      .order('created_at', { ascending: true }),
  )

  const attributedSessionEvents = (permutationEvents || []).filter(
    (event) => event.session_id === travelerAttributedSession,
  )
  const directSessionEvents = (permutationEvents || []).filter(
    (event) => event.session_id === travelerDirectBookingSession,
  )

  assert(attributedSessionEvents.some((event) => event.event_type === 'profile_view'), 'Attributed traveler session should include a profile view')
  assert(attributedSessionEvents.some((event) => event.event_type === 'booking_start'), 'Attributed traveler session should include a booking start')
  assert(directSessionEvents.some((event) => event.event_type === 'booking_start'), 'Direct traveler session should include a booking start')
  assert(!directSessionEvents.some((event) => event.event_type === 'profile_view'), 'Direct traveler session should not include a profile view')

  const analyticsDelta = {
    profile_views: Number(analyticsAfter.profile_views) - Number(analyticsBefore.profile_views),
    unique_visitors: Number(analyticsAfter.unique_visitors) - Number(analyticsBefore.unique_visitors),
    engaged_visitors: Number(analyticsAfter.engaged_visitors) - Number(analyticsBefore.engaged_visitors),
    cta_clicks: Number(analyticsAfter.cta_clicks) - Number(analyticsBefore.cta_clicks),
    tour_clicks: Number(analyticsAfter.tour_clicks) - Number(analyticsBefore.tour_clicks),
    booking_starts: Number(analyticsAfter.booking_starts) - Number(analyticsBefore.booking_starts),
    attributed_booking_starts: Number(analyticsAfter.attributed_booking_starts) - Number(analyticsBefore.attributed_booking_starts),
  }

  assert(analyticsDelta.profile_views >= 2, 'Storefront smoke should add at least two profile views across anonymous and traveler permutations')
  assert(analyticsDelta.cta_clicks >= 1, 'Storefront smoke should add at least one CTA click')
  assert(analyticsDelta.tour_clicks >= 2, 'Storefront smoke should add at least two tour clicks across permutations')
  assert(analyticsDelta.booking_starts >= 2, 'Storefront smoke should add at least two booking starts across traveler permutations')
  assert(analyticsDelta.attributed_booking_starts >= 1, 'Storefront smoke should add at least one attributed booking start')
  assert(analyticsDelta.booking_starts - analyticsDelta.attributed_booking_starts >= 1, 'Storefront smoke should preserve at least one direct booking start outside attributed counts')
  assert(Number(analyticsAfter.attributed_booking_starts) <= Number(analyticsAfter.booking_starts), 'Attributed booking starts exceed total booking starts')
  assert(Number(analyticsAfter.engagement_rate) >= 0 && Number(analyticsAfter.engagement_rate) <= 100, 'Engagement rate is outside the 0-100 range after traveler permutations')
  assert(Number(analyticsAfter.attributed_conversion_rate) >= 0 && Number(analyticsAfter.attributed_conversion_rate) <= 100, 'Attributed conversion rate is outside the 0-100 range after traveler permutations')
  recordCheck('storefront_booking_attribution_split', true, {
    travelerAttributedSession,
    travelerDirectBookingSession,
    attributedSessionEvents: attributedSessionEvents.map((event) => event.event_type),
    directSessionEvents: directSessionEvents.map((event) => event.event_type),
    attributedBookingDelta: analyticsDelta.attributed_booking_starts,
    directBookingDelta: analyticsDelta.booking_starts - analyticsDelta.attributed_booking_starts,
  })
  emitAttributionSplitMarker({
    attributedBookingDelta: analyticsDelta.attributed_booking_starts,
    directBookingDelta: analyticsDelta.booking_starts - analyticsDelta.attributed_booking_starts,
  })
  recordCheck('traveler_storefront_permutations', true, {
    anonymousSession,
    travelerAttributedSession,
    travelerDirectBookingSession,
    analyticsDelta,
  })

  const { client: adminClient } = await signIn(ADMIN_EMAIL, ADMIN_PASSWORD)
  const qaExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

  try {
    const { error: setOverrideError } = await adminClient.rpc('admin_set_operator_award_override', {
      p_operator_id: operatorUser.id,
      p_award_code: QA_AWARD_CODE,
      p_override_mode: 'grant',
      p_award_name: 'QA Smoke Check',
      p_expires_at: qaExpiry,
      p_metadata: { source: 'qa_storefront_flows', scope: 'automation' },
      p_admin_note: 'Automated storefront QA validation.',
      p_is_active: true,
    })
    if (setOverrideError) throw setOverrideError

    const overrideRows = await fetchSingle(adminClient, 'operator_award_overrides', (query) =>
      query
        .select('award_code, override_mode, is_active, admin_note')
        .eq('operator_id', operatorUser.id)
        .eq('award_code', QA_AWARD_CODE),
    )

    assert(Array.isArray(overrideRows) && overrideRows.length === 1, 'Admin override was not created')
    assert(overrideRows[0].override_mode === 'grant', 'Admin override mode mismatch')
    assert(overrideRows[0].is_active === true, 'Admin override did not remain active after save')

    const { error: clearOverrideError } = await adminClient.rpc('admin_clear_operator_award_override', {
      p_operator_id: operatorUser.id,
      p_award_code: QA_AWARD_CODE,
    })
    if (clearOverrideError) throw clearOverrideError

    const clearedRows = await fetchSingle(adminClient, 'operator_award_overrides', (query) =>
      query
        .select('award_code, is_active')
        .eq('operator_id', operatorUser.id)
        .eq('award_code', QA_AWARD_CODE),
    )

    assert(Array.isArray(clearedRows) && clearedRows.length === 1, 'Cleared admin override row not found')
    assert(clearedRows[0].is_active === false, 'Admin override did not clear correctly')
    recordCheck('admin_override_flow', true, { awardCode: QA_AWARD_CODE })

    const secondaryAnalytics = await callRpcSingle(adminClient, 'get_operator_storefront_analytics', {
      p_operator_id: secondaryProfile.user_id,
      p_days: 30,
    })

    assert(secondaryAnalytics, 'Secondary storefront analytics RPC returned no row for admin review')
    assert(Number(secondaryAnalytics.engagement_rate) >= 0 && Number(secondaryAnalytics.engagement_rate) <= 100, 'Secondary operator engagement rate is outside the 0-100 range')
    assert(Number(secondaryAnalytics.attributed_conversion_rate) >= 0 && Number(secondaryAnalytics.attributed_conversion_rate) <= 100, 'Secondary operator attribution rate is outside the 0-100 range')
    recordCheck('multi_operator_admin_analytics', true, {
      secondaryOperatorId: secondaryProfile.user_id,
      secondarySlug: secondaryProfile.slug,
      profile_views: Number(secondaryAnalytics.profile_views),
      unique_visitors: Number(secondaryAnalytics.unique_visitors),
      engagement_rate: Number(secondaryAnalytics.engagement_rate),
    })
  } finally {
    await adminClient.rpc('admin_clear_operator_award_override', {
      p_operator_id: operatorUser.id,
      p_award_code: QA_AWARD_CODE,
    })
    await travelerClient.auth.signOut()
    await operatorClient.auth.signOut()
    await adminClient.auth.signOut()
  }

  summary.ok = true
  summary.operatorName = publicProfile.business_name || publicProfile.company_name
  summary.publicAwards = publicAwards.length
  summary.analytics = {
    before: {
      profile_views: Number(analyticsBefore.profile_views),
      unique_visitors: Number(analyticsBefore.unique_visitors),
      engaged_visitors: Number(analyticsBefore.engaged_visitors),
      cta_clicks: Number(analyticsBefore.cta_clicks),
      tour_clicks: Number(analyticsBefore.tour_clicks),
      booking_starts: Number(analyticsBefore.booking_starts),
      attributed_booking_starts: Number(analyticsBefore.attributed_booking_starts),
      engagement_rate: Number(analyticsBefore.engagement_rate),
      attributed_conversion_rate: Number(analyticsBefore.attributed_conversion_rate),
    },
    after: {
      profile_views: Number(analyticsAfter.profile_views),
      unique_visitors: Number(analyticsAfter.unique_visitors),
      engaged_visitors: Number(analyticsAfter.engaged_visitors),
      cta_clicks: Number(analyticsAfter.cta_clicks),
      tour_clicks: Number(analyticsAfter.tour_clicks),
      booking_starts: Number(analyticsAfter.booking_starts),
      attributed_booking_starts: Number(analyticsAfter.attributed_booking_starts),
      engagement_rate: Number(analyticsAfter.engagement_rate),
      attributed_conversion_rate: Number(analyticsAfter.attributed_conversion_rate),
    },
    delta: analyticsDelta,
  }
  summary.checkedEvents = operatorEvents.length
  summary.adminOverrideFlow = 'passed'
  summary.secondaryStorefront = {
    operatorId: secondaryProfile.user_id,
    slug: secondaryProfile.slug,
    tours: (toursByOperator.get(secondaryProfile.user_id) || []).map((tour) => ({ id: tour.id, title: tour.title })),
  }

  console.log('STORE_FRONT_QA_STATUS=PASS')
  console.log(JSON.stringify(summary, null, 2))
}

main().catch((error) => {
  summary.ok = false
  summary.error = error instanceof Error ? error.message : String(error)
  console.error('STORE_FRONT_QA_STATUS=FAIL')
  console.error(JSON.stringify(summary, null, 2))
  process.exit(1)
})