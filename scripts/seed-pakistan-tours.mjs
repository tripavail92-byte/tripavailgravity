import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

const root = process.cwd()

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {}
  const out = {}
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx === -1) continue
    const key = trimmed.slice(0, idx).trim()
    let val = trimmed.slice(idx + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    out[key] = val
  }
  return out
}

const envRoot = readEnvFile(path.join(root, '.env'))
const envWeb = readEnvFile(path.join(root, 'packages/web/.env'))
const envSupabaseSecrets = readEnvFile(path.join(root, 'supabase-secrets.env'))

const supabaseUrl =
  envRoot.VITE_SUPABASE_URL ||
  envRoot.NEXT_PUBLIC_SUPABASE_URL ||
  envWeb.VITE_SUPABASE_URL ||
  envWeb.NEXT_PUBLIC_SUPABASE_URL ||
  envSupabaseSecrets.EDGE_SUPABASE_URL ||
  envSupabaseSecrets.SUPABASE_URL

const serviceKey =
  envRoot.SUPABASE_SERVICE_ROLE_KEY ||
  envRoot.SUPABASE_SERVICE_KEY ||
  envWeb.SUPABASE_SERVICE_ROLE_KEY ||
  envSupabaseSecrets.SERVICE_ROLE_KEY ||
  envSupabaseSecrets.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase URL or service role key in .env / packages/web/.env / supabase-secrets.env')
  process.exit(2)
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const FALLBACK_OPERATOR_EMAIL = 'cultural-tours@tripavail.demo'

async function resolveOperatorUserId() {
  // Use a known demo user in public.users as operator_id.
  // Note: This project restricts access to user_roles, so we avoid touching it.
  const { data: userRow, error: userError } = await supabase
    .from('users')
    .select('id,email')
    .eq('email', FALLBACK_OPERATOR_EMAIL)
    .maybeSingle()

  if (userError) throw userError
  if (userRow?.id) return userRow.id

  console.error('No fallback operator user found in public.users')
  console.error('Run: node scripts/create-auth-users.mjs')
  process.exit(1)
}

async function upsertTourBySlug(tour) {
  const { data: existing, error: findError } = await supabase
    .from('tours')
    .select('id,slug')
    .eq('slug', tour.slug)
    .limit(1)
    .maybeSingle()

  if (findError) throw findError

  if (existing?.id) {
    const { error: updateError } = await supabase.from('tours').update(tour).eq('id', existing.id)
    if (updateError) throw updateError
    return { id: existing.id, updated: true }
  }

  const { data: created, error: insertError } = await supabase
    .from('tours')
    .insert(tour)
    .select('id')
    .single()

  if (insertError) throw insertError
  return { id: created.id, updated: false }
}

async function run() {
  console.log('Seeding Pakistan Northern tours (no secrets printed)')
  console.log('Supabase host:', new URL(supabaseUrl).host)

  const operatorUserId = await resolveOperatorUserId()

  const tours = [
    {
      operator_id: operatorUserId,
      title: 'Hunza Valley Scenic Escape',
      slug: 'hunza-valley-scenic-escape',
      tour_type: 'nature',
      location: { city: 'Hunza', country: 'Pakistan', address: 'Hunza Valley, Gilgit-Baltistan' },
      duration: '4 days',
      price: 249,
      currency: 'USD',
      short_description: 'Snow-capped peaks, forts, and sunrise viewpoints in Hunza.',
      description:
        'Explore Hunza’s iconic viewpoints, historic forts, and serene valleys with a local guide. Perfect for photography and easy hikes.',
      images: [
        'https://images.unsplash.com/photo-1528127269322-539801943592?w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&auto=format&fit=crop',
      ],
      highlights: ['Karimabad & Baltit Fort', 'Eagle’s Nest sunrise', 'Attabad Lake views'],
      inclusions: ['Local guide', 'Transport during tour', 'Bottled water'],
      exclusions: ['Flights', 'Personal expenses'],
      requirements: ['Comfortable shoes', 'Warm layers'],
      min_participants: 2,
      max_participants: 12,
      difficulty_level: 'easy',
      languages: ['English', 'Urdu'],
      group_discounts: true,
      deposit_required: true,
      deposit_percentage: 20,
      cancellation_policy: 'moderate',
      rating: 4.9,
      review_count: 186,
      is_active: true,
      is_verified: true,
      is_featured: true,
      is_published: true,
      status: 'live',
    },
    {
      operator_id: operatorUserId,
      title: 'Skardu Lakes & Desert Adventure',
      slug: 'skardu-lakes-desert-adventure',
      tour_type: 'adventure',
      location: { city: 'Skardu', country: 'Pakistan', address: 'Skardu, Gilgit-Baltistan' },
      duration: '5 days',
      price: 289,
      currency: 'USD',
      short_description: 'Cold deserts, turquoise lakes, and mountain panoramas.',
      description:
        'A classic Skardu circuit featuring lakes, forts, and sweeping landscapes—built for first-time northern travelers.',
      images: [
        'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1200&auto=format&fit=crop',
      ],
      highlights: ['Upper Kachura Lake', 'Shigar Fort stop', 'Skardu cold desert'],
      inclusions: ['Local guide', 'Transport during tour'],
      exclusions: ['Flights', 'Meals'],
      requirements: ['Light hiking ability'],
      min_participants: 2,
      max_participants: 10,
      difficulty_level: 'moderate',
      languages: ['English', 'Urdu'],
      group_discounts: true,
      deposit_required: true,
      deposit_percentage: 20,
      cancellation_policy: 'moderate',
      rating: 4.8,
      review_count: 142,
      is_active: true,
      is_verified: true,
      is_featured: true,
      is_published: true,
      status: 'live',
    },
    {
      operator_id: operatorUserId,
      title: 'Fairy Meadows Basecamp Experience',
      slug: 'fairy-meadows-basecamp-experience',
      tour_type: 'adventure',
      location: { city: 'Chilas', country: 'Pakistan', address: 'Fairy Meadows, Gilgit-Baltistan' },
      duration: '3 days',
      price: 229,
      currency: 'USD',
      short_description: 'The most iconic meadow views of Nanga Parbat.',
      description:
        'A high-impact itinerary to Fairy Meadows with guided support, scenic viewpoints, and optional short hikes.',
      images: [
        'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1200&auto=format&fit=crop',
      ],
      highlights: ['Fairy Meadows viewpoints', 'Bonfire night', 'Optional mini-hike'],
      inclusions: ['Guide', 'Transport during tour'],
      exclusions: ['Meals', 'Personal expenses'],
      requirements: ['Warm layers', 'Good fitness'],
      min_participants: 2,
      max_participants: 8,
      difficulty_level: 'moderate',
      languages: ['English', 'Urdu'],
      group_discounts: false,
      deposit_required: true,
      deposit_percentage: 25,
      cancellation_policy: 'strict',
      rating: 4.9,
      review_count: 97,
      is_active: true,
      is_verified: true,
      is_featured: true,
      is_published: true,
      status: 'live',
    },
    {
      operator_id: operatorUserId,
      title: 'Naran Kaghan Waterfalls & Meadows',
      slug: 'naran-kaghan-waterfalls-meadows',
      tour_type: 'nature',
      location: { city: 'Naran', country: 'Pakistan', address: 'Kaghan Valley, Khyber Pakhtunkhwa' },
      duration: '3 days',
      price: 199,
      currency: 'USD',
      short_description: 'A lush valley getaway with waterfalls and lake views.',
      description:
        'A comfortable northern escape built around scenic stops, meadows, and relaxed exploration—ideal for families and couples.',
      images: [
        'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&auto=format&fit=crop',
      ],
      highlights: ['Saif-ul-Malook viewpoint', 'Waterfall stops', 'Meadow walk'],
      inclusions: ['Local guide', 'Transport during tour'],
      exclusions: ['Flights'],
      requirements: ['Comfortable shoes'],
      min_participants: 2,
      max_participants: 14,
      difficulty_level: 'easy',
      languages: ['English', 'Urdu'],
      group_discounts: true,
      deposit_required: false,
      deposit_percentage: 0,
      cancellation_policy: 'flexible',
      rating: 4.7,
      review_count: 211,
      is_active: true,
      is_verified: true,
      is_featured: false,
      is_published: true,
      status: 'live',
    },
    {
      operator_id: operatorUserId,
      title: 'Swat & Kalam Cultural Highlands',
      slug: 'swat-kalam-cultural-highlands',
      tour_type: 'cultural',
      location: { city: 'Kalam', country: 'Pakistan', address: 'Swat Valley, Khyber Pakhtunkhwa' },
      duration: '4 days',
      price: 219,
      currency: 'USD',
      short_description: 'Green valleys, rivers, and warm local culture in Swat.',
      description:
        'Discover Swat’s scenic stretches with cultural stops, riverside views, and easy nature walks—balanced and traveler-friendly.',
      images: [
        'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&auto=format&fit=crop',
      ],
      highlights: ['Kalam valley views', 'Riverside stops', 'Local food spots'],
      inclusions: ['Local guide', 'Transport during tour'],
      exclusions: ['Flights'],
      requirements: ['Comfortable shoes'],
      min_participants: 2,
      max_participants: 14,
      difficulty_level: 'easy',
      languages: ['English', 'Urdu'],
      group_discounts: true,
      deposit_required: false,
      deposit_percentage: 0,
      cancellation_policy: 'flexible',
      rating: 4.8,
      review_count: 164,
      is_active: true,
      is_verified: true,
      is_featured: false,
      is_published: true,
      status: 'live',
    },
  ]

  let upserted = 0
  let created = 0

  for (const tour of tours) {
    const result = await upsertTourBySlug(tour)
    upserted += 1
    if (!result.updated) created += 1
  }

  console.log('✅ Seed complete')
  console.log(`Tours upserted: ${upserted} (created: ${created})`)
}

run().catch((err) => {
  console.error('Seed failed:', err?.message || err)
  process.exit(1)
})
