export type City = {
  id: string
  name: string
  latitude: number
  longitude: number
  aliases?: string[]
}

const CITIES: City[] = [
  {
    id: 'maldives',
    name: 'Maldives',
    latitude: 3.2028,
    longitude: 73.2207,
    aliases: ['male', 'malé'],
  },
  {
    id: 'bali_id',
    name: 'Bali, Indonesia',
    latitude: -8.4095,
    longitude: 115.1889,
    aliases: ['bali'],
  },
  {
    id: 'santorini_gr',
    name: 'Santorini, Greece',
    latitude: 36.3932,
    longitude: 25.4615,
    aliases: ['santorini'],
  },
  {
    id: 'kyoto_jp',
    name: 'Kyoto, Japan',
    latitude: 35.0116,
    longitude: 135.7681,
    aliases: ['kyoto'],
  },
  {
    id: 'paris_fr',
    name: 'Paris, France',
    latitude: 48.8566,
    longitude: 2.3522,
    aliases: ['paris'],
  },
  {
    id: 'new_york_us',
    name: 'New York, USA',
    latitude: 40.7128,
    longitude: -74.006,
    aliases: ['new york', 'nyc'],
  },
  {
    id: 'tokyo_jp',
    name: 'Tokyo, Japan',
    latitude: 35.6762,
    longitude: 139.6503,
    aliases: ['tokyo'],
  },
  {
    id: 'dubai_ae',
    name: 'Dubai, UAE',
    latitude: 25.2048,
    longitude: 55.2708,
    aliases: ['dubai'],
  },
]

export const CITY_DATASET: City[] = CITIES

const byId = new Map(CITIES.map((c) => [c.id, c]))
export function getCityById(cityId: string | null | undefined): City | null {
  if (!cityId) return null
  return byId.get(cityId) ?? null
}

function normalizeQuery(input: string): string {
  return input
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[()]/g, '')
    .trim()
}

function stripCategoryWords(input: string): string {
  return input
    .replace(/\bhotels?\b/g, '')
    .replace(/\btours?\b/g, '')
    .replace(/\bexperiences?\b/g, '')
    .replace(/\bresorts?\b/g, '')
    .replace(/\bpackages?\b/g, '')
    .replace(/\bcity\s*break\b/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function findCityByName(input: string | null | undefined): City | null {
  if (!input) return null

  const normalized = stripCategoryWords(normalizeQuery(input))
  if (!normalized) return null

  // Prefer exact match by full display name
  for (const city of CITIES) {
    if (normalizeQuery(city.name) === normalized) return city
  }

  // If input has a comma ("Paris, France"), also check the first segment ("Paris")
  const firstSegment = normalized.split(',')[0]?.trim()

  const candidates = [normalized, firstSegment].filter(Boolean) as string[]

  for (const q of candidates) {
    for (const city of CITIES) {
      const nameNorm = normalizeQuery(city.name)
      if (nameNorm.includes(q) || q.includes(nameNorm)) return city

      for (const alias of city.aliases ?? []) {
        const aliasNorm = normalizeQuery(alias)
        if (aliasNorm === q || q.includes(aliasNorm) || aliasNorm.includes(q)) return city
      }
    }
  }

  return null
}
