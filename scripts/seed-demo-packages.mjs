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

const DEMO_HOTEL_OWNERS = [
  'luxury-stays@tripavail.demo',
  'paradise-hotels@tripavail.demo',
  'coastal-retreats@tripavail.demo',
]

async function mustGetUsersByEmail(emails) {
  const { data, error } = await supabase.from('users').select('id,email').in('email', emails)
  if (error) throw error
  const map = new Map((data || []).map((u) => [u.email, u.id]))
  const missing = emails.filter((e) => !map.has(e))
  if (missing.length) {
    console.error('Missing demo users in public.users:', missing)
    console.error('Run: node scripts/create-auth-users.mjs')
    process.exit(1)
  }
  return map
}

async function getOrCreateHotel(hotel) {
  const { data: existing, error: findError } = await supabase
    .from('hotels')
    .select('id')
    .eq('owner_id', hotel.owner_id)
    .eq('name', hotel.name)
    .limit(1)
    .maybeSingle()

  if (findError) throw findError

  if (existing?.id) {
    const { error: updateError } = await supabase.from('hotels').update(hotel).eq('id', existing.id)
    if (updateError) throw updateError
    return existing.id
  }

  const { data: created, error: insertError } = await supabase
    .from('hotels')
    .insert(hotel)
    .select('id')
    .single()

  if (insertError) throw insertError
  return created.id
}

async function getOrCreatePackage(pkg) {
  const { data: existing, error: findError } = await supabase
    .from('packages')
    .select('id')
    .eq('slug', pkg.slug)
    .limit(1)
    .maybeSingle()

  if (findError) throw findError

  if (existing?.id) {
    const { error: updateError } = await supabase.from('packages').update(pkg).eq('id', existing.id)
    if (updateError) throw updateError
    return existing.id
  }

  const { data: created, error: insertError } = await supabase
    .from('packages')
    .insert(pkg)
    .select('id')
    .single()

  if (insertError) throw insertError
  return created.id
}

async function run() {
  console.log('Seeding demo hotels + packages (no secrets printed)')
  console.log('Supabase host:', new URL(supabaseUrl).host)

  const userIds = await mustGetUsersByEmail(DEMO_HOTEL_OWNERS)

  const luxuryOwner = userIds.get('luxury-stays@tripavail.demo')
  const paradiseOwner = userIds.get('paradise-hotels@tripavail.demo')
  const coastalOwner = userIds.get('coastal-retreats@tripavail.demo')

  const hotels = [
    {
      owner_id: luxuryOwner,
      name: 'Aurora Grand Hotel',
      city: 'Paris',
      country: 'France',
      base_price_per_night: 349,
      rating: 4.9,
      review_count: 842,
      main_image_url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&auto=format&fit=crop',
      image_urls: [
        'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1551887373-6fcd0a3a1e94?w=1200&auto=format&fit=crop',
      ],
      is_published: true,
    },
    {
      owner_id: paradiseOwner,
      name: 'Palm Cove Resort',
      city: 'Maldives',
      country: 'Maldives',
      base_price_per_night: 289,
      rating: 4.7,
      review_count: 512,
      main_image_url: 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=1200&auto=format&fit=crop',
      image_urls: [
        'https://images.unsplash.com/photo-1501117716987-c8e1ecb210c7?w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=1200&auto=format&fit=crop',
      ],
      is_published: true,
    },
    {
      owner_id: coastalOwner,
      name: 'Coastal Breeze Villas',
      city: 'Santorini',
      country: 'Greece',
      base_price_per_night: 219,
      rating: 4.6,
      review_count: 366,
      main_image_url: 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=1200&auto=format&fit=crop',
      image_urls: [
        'https://images.unsplash.com/photo-1505691723518-36a5ac3b1d44?w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200&auto=format&fit=crop',
      ],
      is_published: true,
    },
  ]

  const hotelIds = {}
  for (const hotel of hotels) {
    const id = await getOrCreateHotel(hotel)
    hotelIds[hotel.name] = id
  }

  const packages = [
    {
      owner_id: luxuryOwner,
      hotel_id: hotelIds['Aurora Grand Hotel'],
      name: 'Romance in Paris',
      slug: 'romance-in-paris-package',
      package_type: 'romantic',
      minimum_nights: 2,
      maximum_nights: 5,
      max_guests: 2,
      base_price_per_night: 399,
      cover_image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200&auto=format&fit=crop',
      media_urls: [
        'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200&auto=format&fit=crop',
      ],
      description:
        'A premium city escape designed for couples: curated dining, elegant stays, and effortless planning.',
      highlights: ['Boutique luxury stay', 'Couples spa upgrade', 'City experiences included'],
      inclusions: ['Breakfast for two', 'Late checkout', 'Airport transfer'],
      exclusions: ['Flights', 'Personal expenses'],
      discount_offers: [
        { name: 'Spa upgrade', original_price: 180, discount_percent: 35 },
        { name: 'Dinner experience', original_price: 220, discount_percent: 20 },
      ],
      is_published: true,
      status: 'live',
    },
    {
      owner_id: luxuryOwner,
      hotel_id: hotelIds['Aurora Grand Hotel'],
      name: 'Weekend Luxe Reset',
      slug: 'weekend-luxe-reset-package',
      package_type: 'weekend',
      minimum_nights: 2,
      maximum_nights: 3,
      max_guests: 2,
      base_price_per_night: 329,
      cover_image: 'https://images.unsplash.com/photo-1551887373-6fcd0a3a1e94?w=1200&auto=format&fit=crop',
      media_urls: [
        'https://images.unsplash.com/photo-1551887373-6fcd0a3a1e94?w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=1200&auto=format&fit=crop',
      ],
      description: 'A short, high-impact weekend getaway with premium perks and seamless checkout.',
      highlights: ['Two-night stay', 'Priority check-in', 'Curated add-ons'],
      inclusions: ['Daily breakfast', 'Welcome drinks'],
      exclusions: ['Flights'],
      discount_offers: [{ name: 'City pass', original_price: 120, discount_percent: 25 }],
      is_published: true,
      status: 'live',
    },
    {
      owner_id: paradiseOwner,
      hotel_id: hotelIds['Palm Cove Resort'],
      name: 'Family Island Escape',
      slug: 'family-island-escape-package',
      package_type: 'family',
      minimum_nights: 3,
      maximum_nights: 7,
      max_guests: 4,
      base_price_per_night: 279,
      cover_image: 'https://images.unsplash.com/photo-1501117716987-c8e1ecb210c7?w=1200&auto=format&fit=crop',
      media_urls: [
        'https://images.unsplash.com/photo-1501117716987-c8e1ecb210c7?w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=1200&auto=format&fit=crop',
      ],
      description: 'Family-friendly stays with flexible room options, easy logistics, and beach-ready inclusions.',
      highlights: ['Kid-friendly amenities', 'Flexible rooms', 'Beachfront access'],
      inclusions: ['Breakfast', 'Family airport transfer'],
      exclusions: ['Flights', 'Insurance'],
      discount_offers: [{ name: 'Snorkeling day', original_price: 160, discount_percent: 30 }],
      is_published: true,
      status: 'live',
    },
    {
      owner_id: paradiseOwner,
      hotel_id: hotelIds['Palm Cove Resort'],
      name: 'Couples Sunset Retreat',
      slug: 'couples-sunset-retreat-package',
      package_type: 'romantic',
      minimum_nights: 3,
      maximum_nights: 6,
      max_guests: 2,
      base_price_per_night: 319,
      cover_image: 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=1200&auto=format&fit=crop',
      media_urls: [
        'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1501117716987-c8e1ecb210c7?w=1200&auto=format&fit=crop',
      ],
      description: 'Romantic overwater vibes with curated inclusions and a transparent, discounted total.',
      highlights: ['Sunset cruise', 'Private dining', 'Oceanfront stay'],
      inclusions: ['Breakfast', 'Late checkout'],
      exclusions: ['Flights'],
      discount_offers: [
        { name: 'Sunset cruise', original_price: 200, discount_percent: 25 },
        { name: 'Private dinner', original_price: 180, discount_percent: 20 },
      ],
      is_published: true,
      status: 'live',
    },
    {
      owner_id: coastalOwner,
      hotel_id: hotelIds['Coastal Breeze Villas'],
      name: 'Santorini Weekend Getaway',
      slug: 'santorini-weekend-getaway-package',
      package_type: 'weekend',
      minimum_nights: 2,
      maximum_nights: 4,
      max_guests: 2,
      base_price_per_night: 239,
      cover_image: 'https://images.unsplash.com/photo-1505691723518-36a5ac3b1d44?w=1200&auto=format&fit=crop',
      media_urls: [
        'https://images.unsplash.com/photo-1505691723518-36a5ac3b1d44?w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200&auto=format&fit=crop',
      ],
      description: 'A quick reset with postcard views, transparent pricing, and instant booking.',
      highlights: ['Two-night stay', 'Clifftop views', 'Curated add-ons'],
      inclusions: ['Breakfast'],
      exclusions: ['Flights'],
      discount_offers: [{ name: 'Sunset photo session', original_price: 140, discount_percent: 15 }],
      is_published: true,
      status: 'live',
    },
    {
      owner_id: coastalOwner,
      hotel_id: hotelIds['Coastal Breeze Villas'],
      name: 'Family Sea & Sun',
      slug: 'family-sea-and-sun-package',
      package_type: 'family',
      minimum_nights: 3,
      maximum_nights: 6,
      max_guests: 4,
      base_price_per_night: 209,
      cover_image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200&auto=format&fit=crop',
      media_urls: [
        'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1505691723518-36a5ac3b1d44?w=1200&auto=format&fit=crop',
      ],
      description: 'Family-ready villas with flexible nights, value add-ons, and simple checkout.',
      highlights: ['Family suites', 'Pool access', 'Local experiences'],
      inclusions: ['Breakfast'],
      exclusions: ['Flights'],
      discount_offers: [{ name: 'Boat day', original_price: 210, discount_percent: 20 }],
      is_published: true,
      status: 'live',
    },
    {
      owner_id: coastalOwner,
      hotel_id: hotelIds['Coastal Breeze Villas'],
      name: 'Coastal New Arrival',
      slug: 'coastal-new-arrival-package',
      package_type: 'weekend',
      minimum_nights: 1,
      maximum_nights: 3,
      max_guests: 2,
      base_price_per_night: 189,
      cover_image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200&auto=format&fit=crop',
      media_urls: ['https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200&auto=format&fit=crop'],
      description: 'Freshly added listing with a simple, transparent price and instant booking.',
      highlights: ['New listing', 'Great value', 'Flexible nights'],
      inclusions: ['Welcome drink'],
      exclusions: ['Flights'],
      is_published: true,
      status: 'live',
    },
  ]

  let createdCount = 0
  for (const pkg of packages) {
    await getOrCreatePackage(pkg)
    createdCount += 1
  }

  console.log('✅ Seed complete')
  console.log(`Hotels upserted: ${hotels.length}`)
  console.log(`Packages upserted: ${createdCount}`)
}

run().catch((err) => {
  console.error('Seed failed:', err?.message || err)
  process.exit(1)
})
