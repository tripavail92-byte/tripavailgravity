import { supabase } from '@/lib/supabase'

/**
 * Operator storefront (public business profile) — port of web
 * tourOperatorService.get/updatePublicProfileEditorData against
 * tour_operator_profiles. Writes BOTH company_name and business_name (web
 * parity). Gallery on web is manual URLs; mobile upgrades that with real
 * image uploads to the tour-images bucket (path must start with the uid).
 */

export interface FleetAsset {
  id: string
  type: string
  name: string
  quantity: number
  capacity: number | null
  details: string
}

export interface GuideProfile {
  id: string
  name: string
  languages: string[]
  specialties: string[]
  certifications: string[]
  yearsExperience: number | null
  bio: string
}

export interface GalleryItem {
  id: string
  url: string
  title: string
  category: 'operator' | 'vehicle' | 'traveler' | 'accommodation' | 'food'
}

export interface PublicPolicies {
  cancellation: string
  deposit: string
  pickup: string
  child: string
  refund: string
  weather: string
  emergency: string
  supportHours: string
}

export interface StorefrontData {
  businessName: string
  description: string
  primaryCity: string
  coverageRange: string
  yearsExperience: string
  teamSize: string
  registrationNumber: string
  phoneNumber: string
  email: string
  slug: string | null
  fleetAssets: FleetAsset[]
  guideProfiles: GuideProfile[]
  galleryMedia: GalleryItem[]
  publicPolicies: PublicPolicies
  verificationUrls: Record<string, string>
}

export const EMPTY_POLICIES: PublicPolicies = {
  cancellation: '',
  deposit: '',
  pickup: '',
  child: '',
  refund: '',
  weather: '',
  emergency: '',
  supportHours: '',
}

export function newId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function asArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : []
}

export async function fetchStorefront(userId: string): Promise<StorefrontData> {
  const { data, error } = await supabase
    .from('tour_operator_profiles')
    .select(
      'company_name, description, primary_city, coverage_range, years_experience, team_size, registration_number, phone_number, email, slug, fleet_assets, guide_profiles, gallery_media, public_policies, verification_urls',
    )
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error

  const p = (data ?? {}) as Record<string, any>
  return {
    businessName: p.company_name || '',
    description: p.description || '',
    primaryCity: p.primary_city || '',
    coverageRange: p.coverage_range || '',
    yearsExperience: p.years_experience != null ? String(p.years_experience) : '',
    teamSize: p.team_size != null ? String(p.team_size) : '',
    registrationNumber: p.registration_number || '',
    phoneNumber: p.phone_number || '',
    email: p.email || '',
    slug: p.slug ?? null,
    fleetAssets: asArray<FleetAsset>(p.fleet_assets),
    guideProfiles: asArray<GuideProfile>(p.guide_profiles),
    galleryMedia: asArray<GalleryItem>(p.gallery_media),
    publicPolicies: { ...EMPTY_POLICIES, ...((p.public_policies as PublicPolicies) ?? {}) },
    verificationUrls: (p.verification_urls as Record<string, string>) ?? {},
  }
}

export async function saveStorefront(userId: string, d: StorefrontData): Promise<void> {
  const payload = {
    user_id: userId,
    company_name: d.businessName.trim() || null,
    business_name: d.businessName.trim() || null,
    description: d.description.trim() || null,
    primary_city: d.primaryCity.trim() || null,
    coverage_range: d.coverageRange.trim() || null,
    years_experience: d.yearsExperience.trim() || null,
    team_size: d.teamSize.trim() || null,
    registration_number: d.registrationNumber.trim() || null,
    phone_number: d.phoneNumber.trim() || null,
    email: d.email.trim() || null,
    fleet_assets: d.fleetAssets,
    guide_profiles: d.guideProfiles,
    gallery_media: d.galleryMedia,
    public_policies: d.publicPolicies,
    verification_urls: d.verificationUrls,
    updated_at: new Date().toISOString(),
  }
  const { error } = await supabase.from('tour_operator_profiles').upsert(payload)
  if (error) throw error
}

export async function uploadGalleryImage(userId: string, localUri: string): Promise<string> {
  let ext = 'jpg'
  const m = localUri.match(/\.(\w+)(?:\?|$)/)
  if (m) ext = m[1].toLowerCase()
  const path = `${userId}/storefront/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`
  const arraybuffer = await fetch(localUri).then((r) => r.arrayBuffer())
  const { error } = await supabase.storage
    .from('tour-images')
    .upload(path, arraybuffer, { contentType: `image/${ext}`, cacheControl: '3600', upsert: false })
  if (error) throw error
  return supabase.storage.from('tour-images').getPublicUrl(path).data.publicUrl
}

/** Same 7 sections the web completeness meter counts. */
export function storefrontCompleteness(d: StorefrontData): {
  done: number
  total: number
  percent: number
  missing: string[]
} {
  const sections: Array<{ label: string; done: boolean }> = [
    { label: 'Business name', done: Boolean(d.businessName.trim()) },
    { label: 'Public description', done: Boolean(d.description.trim()) },
    { label: 'Fleet assets', done: d.fleetAssets.length > 0 },
    { label: 'Guide team', done: d.guideProfiles.length > 0 },
    { label: 'Gallery media', done: d.galleryMedia.length > 0 },
    {
      label: 'Verification document',
      done: Object.values(d.verificationUrls).some((v) => Boolean(v?.trim?.())),
    },
    {
      label: 'Public policies',
      done: Object.values(d.publicPolicies).some((v) => Boolean(v?.trim?.())),
    },
  ]
  const done = sections.filter((s) => s.done).length
  return {
    done,
    total: sections.length,
    percent: Math.round((done / sections.length) * 100),
    missing: sections.filter((s) => !s.done).map((s) => s.label),
  }
}
