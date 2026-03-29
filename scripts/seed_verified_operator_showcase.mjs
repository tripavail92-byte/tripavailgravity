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
    id: 'showcase-camp-fire',
    url: 'https://picsum.photos/seed/tripavail-showcase-campfire/1200/900',
    title: 'Evening campfire briefing',
    category: 'operator',
  },
  {
    id: 'showcase-vehicle-convoy',
    url: 'https://picsum.photos/seed/tripavail-showcase-convoy/1200/900',
    title: 'Verified transport convoy',
    category: 'vehicle',
  },
  {
    id: 'showcase-family-stop',
    url: 'https://picsum.photos/seed/tripavail-showcase-family-stop/1200/900',
    title: 'Family tea stop on route',
    category: 'traveler',
  },
  {
    id: 'showcase-guide-briefing',
    url: 'https://picsum.photos/seed/tripavail-showcase-guide-briefing/1200/900',
    title: 'Guide safety and route briefing',
    category: 'guide',
  },
  {
    id: 'showcase-guest-lounge',
    url: 'https://picsum.photos/seed/tripavail-showcase-lounge/1200/900',
    title: 'Arrival lounge and welcome desk',
    category: 'operator',
  },
]

const fleetAssets = [
  {
    id: 'verified-prado-1',
    type: '4x4 vehicle',
    name: 'Toyota Prado Executive Unit',
    quantity: 3,
    capacity: 6,
    details: 'Primary guest transfer fleet with insured and documented drivers.',
  },
  {
    id: 'verified-coaster-1',
    type: 'mini bus',
    name: 'Toyota Coaster Group Shuttle',
    quantity: 1,
    capacity: 18,
    details: 'Used for group departures and city-to-basecamp transfer legs.',
  },
]

const guideProfiles = [
  {
    id: 'verified-guide-zara',
    name: 'Zara Khan',
    languages: ['English', 'Urdu'],
    specialties: ['Family departures', 'Women-led travel support'],
    certifications: ['First Aid', 'Mountain Guide Orientation', 'Child Safety Briefing'],
    yearsExperience: 8,
    bio: 'Field lead for premium family departures with a strong guest-briefing process.',
  },
  {
    id: 'verified-guide-saad',
    name: 'Saad Ahmed',
    languages: ['English', 'Urdu', 'Punjabi'],
    specialties: ['Highland logistics', 'Vehicle support coordination'],
    certifications: ['First Aid', 'Defensive Driving Coordination'],
    yearsExperience: 10,
    bio: 'Operations-focused guide handling route timing, convoy coordination, and emergency support.',
  },
]

const publicPolicies = {
  cancellation: 'Free cancellation up to 10 days before departure. A partial credit is offered for later cancellations caused by weather risk.',
  deposit: 'A 25% deposit is required at booking confirmation for transport and guide allocation.',
  pickup: 'Airport pickup, city hotel pickup, and pre-departure confirmation calls are included for verified departures.',
  child: 'Family itineraries support children aged 6+ with guardian attendance and guide pacing adjustments.',
  refund: 'Approved refunds are returned to the original payment method within 5 to 7 business days.',
  weather: 'Weather reroutes, convoy changes, and departure timing updates are sent through chat and phone escalation.',
  emergency: 'A 24/7 emergency contact remains active throughout live departures and transit windows.',
  supportHours: 'Guest support is covered daily from 7:00 AM to 11:00 PM PKT with on-trip escalation after hours.',
}

const verificationUrls = {
  businessRegistration: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  insurance: 'https://www.orimi.com/pdf-test.pdf',
  vehicleDocs: 'https://www.africau.edu/images/default/sample.pdf',
  guideLicense: 'https://www.clickdimensions.com/links/TestPDFfile.pdf',
}

const showcaseIdentity = {
  slug: 'northern-summit-expeditions',
  businessName: 'Northern Summit Expeditions',
  companyName: 'Northern Summit Expeditions',
  contactPerson: 'Ayesha Rahman',
  email: 'premium.operator.qa@tripavail.test',
  phoneNumber: '+923001234567',
  primaryCity: 'Islamabad, Pakistan',
  coverageRange: 'national',
  yearsExperience: '8-10 years',
  teamSize: 'Team of 12-18',
  description: 'Northern Summit Expeditions runs verified premium departures with documented fleet support, family-ready pacing, and guide-led route management across northern Pakistan.',
  categories: ['premium', 'family', 'expedition', 'mountain logistics'],
}

try {
  await client.query('BEGIN')

  const { rows } = await client.query(
    `
      SELECT p.user_id, p.slug, COALESCE(p.business_name, p.company_name) AS operator_name
      FROM public.tour_operator_profiles p
      WHERE p.is_public = true
        AND COALESCE(p.slug, '') <> 'est-perator'
        AND EXISTS (
          SELECT 1
          FROM public.tours t
          WHERE t.operator_id = p.user_id
            AND t.is_active = true
        )
      ORDER BY p.updated_at DESC NULLS LAST, p.created_at DESC NULLS LAST
      LIMIT 1
    `,
  )

  if (rows.length === 0) {
    throw new Error('No second public operator with active tours found to seed')
  }

  const operator = rows[0]

  const { rows: tours } = await client.query(
    `
      SELECT id, title
      FROM public.tours
      WHERE operator_id = $1
        AND is_active = true
      ORDER BY created_at DESC
      LIMIT 3
    `,
    [operator.user_id],
  )

  await client.query(
    `
      UPDATE public.tour_operator_profiles
      SET gallery_media = $2::jsonb,
          fleet_assets = $3::jsonb,
          guide_profiles = $4::jsonb,
          public_policies = $5::jsonb,
          slug = $6,
          business_name = $7,
          company_name = $8,
          contact_person = $9,
          email = $10,
          phone_number = $11,
          primary_city = $12,
          coverage_range = $13,
          years_experience = $14,
          team_size = $15,
          description = $16,
          categories = $17::text[],
          verification_urls = COALESCE(verification_urls, '{}'::jsonb) || $18::jsonb,
          verification_documents = COALESCE(verification_documents, '{}'::jsonb)
            || jsonb_build_object(
              'businessRegistrationVerified', true,
              'insuranceVerified', true,
              'vehicleDocsVerified', true,
              'guideLicenseVerified', true,
              'businessRegistrationVerifiedNotes', 'Verified from seeded storefront showcase document set.',
              'insuranceVerifiedNotes', 'Verified insurance coverage on file.',
              'vehicleDocsVerifiedNotes', 'Verified fleet operating documents on file.',
              'guideLicenseVerifiedNotes', 'Verified guide credentials and certifications on file.',
              'verificationLastReviewedAt', now(),
              'verificationLastReviewedBy', 'seed-script'
            ),
          updated_at = now()
      WHERE user_id = $1
    `,
    [
      operator.user_id,
      JSON.stringify(galleryMedia),
      JSON.stringify(fleetAssets),
      JSON.stringify(guideProfiles),
      JSON.stringify(publicPolicies),
      showcaseIdentity.slug,
      showcaseIdentity.businessName,
      showcaseIdentity.companyName,
      showcaseIdentity.contactPerson,
      showcaseIdentity.email,
      showcaseIdentity.phoneNumber,
      showcaseIdentity.primaryCity,
      showcaseIdentity.coverageRange,
      showcaseIdentity.yearsExperience,
      showcaseIdentity.teamSize,
      showcaseIdentity.description,
      showcaseIdentity.categories,
      JSON.stringify(verificationUrls),
    ],
  )

  await client.query('DELETE FROM public.operator_storefront_events WHERE operator_id = $1', [operator.user_id])
  await client.query('DELETE FROM public.operator_award_overrides WHERE operator_id = $1', [operator.user_id])

  await client.query(
    `
      INSERT INTO public.operator_verification_reviews (
        operator_id,
        verification_key,
        decision,
        notes,
        reviewed_by,
        reviewed_at
      )
      VALUES
        ($1, 'businessRegistrationVerified', 'verified', 'Seeded verified business registration review.', NULL, now() - interval '12 days'),
        ($1, 'insuranceVerified', 'verified', 'Seeded verified insurance review.', NULL, now() - interval '11 days'),
        ($1, 'vehicleDocsVerified', 'verified', 'Seeded verified vehicle document review.', NULL, now() - interval '10 days'),
        ($1, 'guideLicenseVerified', 'verified', 'Seeded verified guide credential review.', NULL, now() - interval '9 days')
    `,
    [operator.user_id],
  )

  await client.query(
    `
      INSERT INTO public.operator_award_overrides (
        operator_id,
        award_code,
        override_mode,
        award_name,
        expires_at,
        metadata,
        admin_note,
        is_active,
        created_by,
        updated_by
      )
      VALUES
        ($1, 'premium_partner', 'grant', 'Premium Partner', now() + interval '180 days', '{"source":"seed-script"}'::jsonb, 'Seeded verified showcase partner.', true, NULL, NULL),
        ($1, 'editor_pick', 'grant', 'Editor Pick', now() + interval '90 days', '{"source":"seed-script"}'::jsonb, 'Seeded editorial showcase for side-by-side comparison.', true, NULL, NULL)
      ON CONFLICT (operator_id, award_code)
      DO UPDATE SET
        override_mode = EXCLUDED.override_mode,
        award_name = EXCLUDED.award_name,
        expires_at = EXCLUDED.expires_at,
        metadata = EXCLUDED.metadata,
        admin_note = EXCLUDED.admin_note,
        is_active = true,
        updated_at = now()
    `,
    [operator.user_id],
  )

  await client.query('SELECT public.refresh_operator_public_metrics($1)', [operator.user_id])
  await client.query('SELECT public.refresh_operator_awards($1)', [operator.user_id])

  const eventRows = [
    ['profile_view', 'verified-session-1', null, { source: 'seed-script', campaign: 'comparison' }, "now() - interval '14 days'"],
    ['profile_view', 'verified-session-2', null, { source: 'seed-script', campaign: 'comparison' }, "now() - interval '10 days'"],
    ['profile_view', 'verified-session-3', null, { source: 'seed-script', campaign: 'comparison' }, "now() - interval '7 days'"],
    ['profile_view', 'verified-session-4', null, { source: 'seed-script', campaign: 'comparison' }, "now() - interval '5 days'"],
    ['profile_view', 'verified-session-5', null, { source: 'seed-script', campaign: 'comparison' }, "now() - interval '3 days'"],
    ['profile_view', 'verified-session-6', null, { source: 'seed-script', campaign: 'comparison' }, "now() - interval '1 day'"],
    ['profile_view', 'verified-session-7', null, { source: 'seed-script', campaign: 'comparison' }, 'now() - interval \'6 hours\''],
    ['cta_click', 'verified-session-2', null, { source: 'seed-script', cta: 'hero_view_tours' }, "now() - interval '10 days'"],
    ['cta_click', 'verified-session-5', null, { source: 'seed-script', cta: 'sticky_call_operator' }, "now() - interval '3 days'"],
    ['cta_click', 'verified-session-7', null, { source: 'seed-script', cta: 'mobile_browse_tours' }, 'now() - interval \'3 hours\''],
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
      [operator.user_id, eventType, showcaseIdentity.slug, tourId, sessionId, JSON.stringify(metadata)],
    )
  }

  for (const [index, tour] of tours.entries()) {
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
          ($1, 'tour_click', $2, $3, $4, $5::jsonb, now() - ($6::text || ' days')::interval),
          ($1, 'tour_click', $2, $3, $7, $5::jsonb, now() - ($8::text || ' hours')::interval)
      `,
      [
        operator.user_id,
        showcaseIdentity.slug,
        tour.id,
        `verified-tour-session-${index + 1}`,
        JSON.stringify({ title: tour.title, source: 'seed-script', rank: index + 1 }),
        `${6 - index}`,
        `verified-tour-session-late-${index + 1}`,
        `${12 - index * 2}`,
      ],
    )
  }

  const { rows: summary } = await client.query(
    `
      SELECT
        p.user_id,
        p.slug,
        COALESCE(p.business_name, p.company_name) AS operator_name,
        jsonb_array_length(COALESCE(p.gallery_media, '[]'::jsonb)) AS gallery_count,
        jsonb_array_length(COALESCE(p.fleet_assets, '[]'::jsonb)) AS fleet_count,
        jsonb_array_length(COALESCE(p.guide_profiles, '[]'::jsonb)) AS guide_count,
        p.verification_documents,
        (SELECT COUNT(*)::int FROM public.operator_awards oa WHERE oa.operator_id = p.user_id) AS award_count,
        (SELECT COUNT(*)::int FROM public.operator_award_overrides oao WHERE oao.operator_id = p.user_id AND oao.is_active = true) AS override_count,
        (SELECT COUNT(*)::int FROM public.operator_storefront_events ose WHERE ose.operator_id = p.user_id AND ose.event_type = 'profile_view') AS profile_view_count,
        (SELECT COUNT(*)::int FROM public.operator_storefront_events ose WHERE ose.operator_id = p.user_id AND ose.event_type = 'cta_click') AS cta_click_count,
        (SELECT COUNT(*)::int FROM public.operator_storefront_events ose WHERE ose.operator_id = p.user_id AND ose.event_type = 'tour_click') AS tour_click_count,
        (
          SELECT json_agg(json_build_object('award_code', oa.award_code, 'award_name', oa.award_name, 'award_source', oa.award_source) ORDER BY oa.awarded_at DESC)
          FROM public.operator_awards oa
          WHERE oa.operator_id = p.user_id
        ) AS awards
      FROM public.tour_operator_profiles p
      WHERE p.user_id = $1
    `,
    [operator.user_id],
  )

  await client.query('COMMIT')
  console.log(JSON.stringify(summary, null, 2))
} catch (error) {
  await client.query('ROLLBACK')
  throw error
} finally {
  await client.end()
}