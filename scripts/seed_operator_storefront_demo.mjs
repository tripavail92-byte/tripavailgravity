import { createRemoteClient, loadRemoteDbEnv, resolveRemoteConnectionString } from './lib/remoteDb.mjs'

const env = loadRemoteDbEnv()
const connectionString = resolveRemoteConnectionString(env)

if (!connectionString) {
  throw new Error('Missing remote DB connection')
}

const client = createRemoteClient(connectionString)
await client.connect()

const galleryMedia = [
  {
    id: 'gallery-camp-base',
    url: 'https://picsum.photos/seed/tripavail-camp-base/1200/900',
    title: 'Mountain base camp setup',
    category: 'operator',
  },
  {
    id: 'gallery-fleet-4x4',
    url: 'https://picsum.photos/seed/tripavail-fleet-4x4/1200/900',
    title: '4x4 support vehicle',
    category: 'vehicle',
  },
  {
    id: 'gallery-travelers-ridge',
    url: 'https://picsum.photos/seed/tripavail-travelers-ridge/1200/900',
    title: 'Travelers on ridge viewpoint',
    category: 'traveler',
  },
  {
    id: 'gallery-meal-stop',
    url: 'https://picsum.photos/seed/tripavail-meal-stop/1200/900',
    title: 'Field meal and tea stop',
    category: 'food',
  },
]

const fleetAssets = [
  {
    id: 'fleet-prado-1',
    type: '4x4 vehicle',
    name: 'Toyota Prado Support Unit',
    quantity: 2,
    capacity: 6,
    details: 'Air-conditioned 4x4 support vehicle used for airport pickups and mountain transfers.',
  },
]

const guideProfiles = [
  {
    id: 'guide-hassan-1',
    name: 'Hassan Raza',
    languages: ['English', 'Urdu'],
    specialties: ['Trekking logistics', 'Family support trips'],
    certifications: ['First Aid', 'Mountain Guide Orientation'],
    yearsExperience: 7,
    bio: 'Lead field guide focused on safe pacing, logistics coordination, and route communication.',
  },
]

const publicPolicies = {
  cancellation: 'Free cancellation up to 7 days before departure. Within 7 days, deposits are non-refundable unless weather blocks access.',
  deposit: 'A 30% deposit is required to lock in departures and transport allocations.',
  pickup: 'Airport pickup and city hotel pickup are available with prior confirmation 24 hours before arrival.',
  child: 'Family departures are available for children aged 8+ with a guardian on the same booking.',
  refund: 'Approved refunds are processed to the original payment channel within 7 to 10 business days.',
  weather: 'Weather rerouting is communicated through TripAvail chat and phone updates as soon as local conditions change.',
  emergency: 'An emergency operations contact is available during all live departures.',
  supportHours: 'Daily support coverage: 8:00 AM to 10:00 PM PKT.',
}

const verificationUrls = {
  businessRegistration: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  insurance: 'https://www.orimi.com/pdf-test.pdf',
  vehicleDocs: 'https://www.africau.edu/images/default/sample.pdf',
  guideLicense: 'https://www.clickdimensions.com/links/TestPDFfile.pdf',
}

try {
  await client.query('BEGIN')

  const { rows } = await client.query(`
    SELECT user_id, slug, COALESCE(business_name, company_name) AS operator_name
    FROM public.tour_operator_profiles
    WHERE is_public = true
    ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST
    LIMIT 1
  `)

  if (rows.length === 0) {
    throw new Error('No public operator found to seed')
  }

  const operator = rows[0]

  const { rows: tours } = await client.query(
    `
      SELECT id, title
      FROM public.tours
      WHERE operator_id = $1
        AND is_active = true
      ORDER BY created_at DESC
      LIMIT 1
    `,
    [operator.user_id],
  )

  const featuredTour = tours[0] ?? null

  await client.query(
    `
      UPDATE public.tour_operator_profiles
      SET gallery_media = $2::jsonb,
          fleet_assets = $3::jsonb,
          guide_profiles = $4::jsonb,
          public_policies = $5::jsonb,
          verification_urls = COALESCE(verification_urls, '{}'::jsonb) || $6::jsonb,
          updated_at = now()
      WHERE user_id = $1
    `,
    [
      operator.user_id,
      JSON.stringify(galleryMedia),
      JSON.stringify(fleetAssets),
      JSON.stringify(guideProfiles),
      JSON.stringify(publicPolicies),
      JSON.stringify(verificationUrls),
    ],
  )

  await client.query('SELECT public.refresh_operator_public_metrics($1)', [operator.user_id])
  await client.query('SELECT public.refresh_operator_awards($1)', [operator.user_id])

  await client.query('DELETE FROM public.operator_storefront_events WHERE operator_id = $1', [operator.user_id])

  const eventRows = [
    ['profile_view', 'seed-session-1', null, { source: 'seed-script' }, "now() - interval '6 days'"],
    ['profile_view', 'seed-session-2', null, { source: 'seed-script' }, "now() - interval '4 days'"],
    ['profile_view', 'seed-session-3', null, { source: 'seed-script' }, "now() - interval '3 days'"],
    ['profile_view', 'seed-session-4', null, { source: 'seed-script' }, "now() - interval '2 days'"],
    ['profile_view', 'seed-session-5', null, { source: 'seed-script' }, "now() - interval '1 day'"],
    ['profile_view', 'seed-session-6', null, { source: 'seed-script' }, 'now() - interval \'8 hours\''],
    ['cta_click', 'seed-session-2', null, { cta: 'hero_view_tours', source: 'seed-script' }, "now() - interval '4 days'"],
    ['cta_click', 'seed-session-4', null, { cta: 'sticky_call_operator', source: 'seed-script' }, "now() - interval '2 days'"],
    ['cta_click', 'seed-session-6', null, { cta: 'mobile_browse_tours', source: 'seed-script' }, 'now() - interval \'4 hours\''],
  ]

  for (const [eventType, sessionId, tourId, metadata, createdAtSql] of eventRows) {
    await client.query(
      `
        INSERT INTO public.operator_storefront_events (
          operator_id,
          event_type,
          slug,
          tour_id,
          session_id,
          metadata,
          created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6::jsonb, ${createdAtSql})
      `,
      [operator.user_id, eventType, operator.slug, tourId, sessionId, JSON.stringify(metadata)],
    )
  }

  if (featuredTour) {
    await client.query(
      `
        INSERT INTO public.operator_storefront_events (
          operator_id,
          event_type,
          slug,
          tour_id,
          session_id,
          metadata,
          created_at
        )
        VALUES
          ($1, 'tour_click', $2, $3, 'seed-session-2', $4::jsonb, now() - interval '4 days'),
          ($1, 'tour_click', $2, $3, 'seed-session-5', $4::jsonb, now() - interval '20 hours'),
          ($1, 'tour_click', $2, $3, 'seed-session-6', $4::jsonb, now() - interval '2 hours')
      `,
      [operator.user_id, operator.slug, featuredTour.id, JSON.stringify({ title: featuredTour.title, source: 'seed-script' })],
    )
  }

  const { rows: seeded } = await client.query(
    `
      SELECT
        p.user_id,
        p.slug,
        COALESCE(p.business_name, p.company_name) AS operator_name,
        jsonb_array_length(COALESCE(p.gallery_media, '[]'::jsonb)) AS gallery_count,
        jsonb_array_length(COALESCE(p.fleet_assets, '[]'::jsonb)) AS fleet_count,
        jsonb_array_length(COALESCE(p.guide_profiles, '[]'::jsonb)) AS guide_count,
        (SELECT COUNT(*)::int FROM public.operator_awards oa WHERE oa.operator_id = p.user_id) AS award_count,
        (SELECT COUNT(*)::int FROM public.operator_storefront_events ose WHERE ose.operator_id = p.user_id AND ose.event_type = 'profile_view') AS profile_view_count,
        (SELECT COUNT(*)::int FROM public.operator_storefront_events ose WHERE ose.operator_id = p.user_id AND ose.event_type = 'cta_click') AS cta_click_count,
        (SELECT COUNT(*)::int FROM public.operator_storefront_events ose WHERE ose.operator_id = p.user_id AND ose.event_type = 'tour_click') AS tour_click_count,
        p.verification_urls
      FROM public.tour_operator_profiles p
      WHERE p.user_id = $1
    `,
    [operator.user_id],
  )

  await client.query('COMMIT')
  console.log(JSON.stringify(seeded, null, 2))
} catch (error) {
  await client.query('ROLLBACK')
  throw error
} finally {
  await client.end()
}
