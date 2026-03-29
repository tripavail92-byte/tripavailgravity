import { createRemoteClient, loadRemoteDbEnv, resolveRemoteConnectionString } from './lib/remoteDb.mjs'

const env = loadRemoteDbEnv()
const connectionString = resolveRemoteConnectionString(env)

if (!connectionString) {
  throw new Error('Missing remote DB connection')
}

const client = createRemoteClient(connectionString)
await client.connect()

try {
  const { rows } = await client.query(`
    SELECT
      p.user_id,
      p.slug,
      COALESCE(p.business_name, p.company_name) AS operator_name,
      p.is_public,
      p.gallery_media,
      p.fleet_assets,
      p.guide_profiles,
      p.public_policies,
      p.verification_documents,
      m.total_reviews,
      m.verified_badge_count,
      m.last_calculated_at,
      (
        SELECT COUNT(*)::int
        FROM public.operator_awards oa
        WHERE oa.operator_id = p.user_id
      ) AS award_count
    FROM public.tour_operator_profiles p
    LEFT JOIN public.operator_public_metrics m ON m.operator_id = p.user_id
    WHERE p.is_public = true
    ORDER BY p.updated_at DESC NULLS LAST
    LIMIT 1
  `)

  console.log(JSON.stringify(rows, null, 2))
} finally {
  await client.end()
}
