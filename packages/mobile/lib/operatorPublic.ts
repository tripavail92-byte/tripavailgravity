import { supabase } from '@/lib/supabase'
import { fetchToursByOperator, type DiscoveryTour } from '@/lib/tourDiscovery'

export interface MobileOperatorProfile {
  user_id: string
  slug: string | null
  company_name: string | null
  business_name: string | null
  company_logo_url: string | null
  description: string | null
  primary_city: string | null
  coverage_range: string | null
  categories: string[] | null
  years_experience: string | null
  team_size: string | null
  phone_number: string | null
  email: string | null
  is_public: boolean
  setup_completed: boolean
}

export interface MobileOperatorMetrics {
  avg_rating: number | null
  total_reviews: number
  total_completed_bookings: number
  total_travelers_served: number
  cancellation_rate: number | null
  verified_badge_count: number
}

export interface MobileOperatorStorefront {
  profile: MobileOperatorProfile
  metrics: MobileOperatorMetrics | null
  qualityScore: number | null
  tours: DiscoveryTour[]
}

// The quality score is decorative. Treat any "can't compute it here" condition as
// "score unavailable" (return null) rather than letting it reject the whole storefront.
// This includes: function missing from the schema cache, and — critically — the
// admin-only quality-score RPC rejecting non-admin visitors (P0001 "admin privileges
// required") or PostgREST permission errors (42501).
function isQualityScoreUnavailable(error: unknown) {
  const message = String((error as { message?: string } | null)?.message ?? error ?? '').toLowerCase()
  const code = String((error as { code?: string } | null)?.code ?? '')
  return (
    message.includes('schema cache') ||
    message.includes('could not find the function') ||
    message.includes('admin privileges required') ||
    message.includes('permission denied') ||
    code === 'P0001' ||
    code === '42501'
  )
}

export async function fetchOperatorProfileBySlug(slug: string): Promise<MobileOperatorProfile | null> {
  const { data, error } = await supabase
    .from('tour_operator_profiles')
    .select(
      'user_id, slug, company_name, business_name, company_logo_url, description, primary_city, coverage_range, categories, years_experience, team_size, phone_number, email, is_public, setup_completed',
    )
    .eq('slug', slug)
    .eq('is_public', true)
    .maybeSingle()

  if (error) throw error
  return (data ?? null) as MobileOperatorProfile | null
}

export async function fetchOperatorProfileById(operatorId: string): Promise<MobileOperatorProfile | null> {
  const { data, error } = await supabase
    .from('tour_operator_profiles')
    .select(
      'user_id, slug, company_name, business_name, company_logo_url, description, primary_city, coverage_range, categories, years_experience, team_size, phone_number, email, is_public, setup_completed',
    )
    .eq('user_id', operatorId)
    .eq('is_public', true)
    .maybeSingle()

  if (error) throw error
  return (data ?? null) as MobileOperatorProfile | null
}

async function fetchOperatorMetrics(operatorId: string): Promise<MobileOperatorMetrics | null> {
  const { data, error } = await supabase
    .from('operator_public_metrics')
    .select(
      'avg_rating, total_reviews, total_completed_bookings, total_travelers_served, cancellation_rate, verified_badge_count',
    )
    .eq('operator_id', operatorId)
    .maybeSingle()

  if (error) throw error
  return (data ?? null) as MobileOperatorMetrics | null
}

async function fetchOperatorQualityScore(operatorId: string): Promise<number | null> {
  const { data, error } = await (supabase as any).rpc('admin_get_operator_quality_score', {
    p_operator_id: operatorId,
    p_days: 90,
  })

  if (error) {
    if (isQualityScoreUnavailable(error)) return null
    throw error
  }

  const row = Array.isArray(data) ? data[0] : data
  return row?.total_score == null ? null : Number(row.total_score)
}

export async function fetchOperatorStorefront(slug: string): Promise<MobileOperatorStorefront | null> {
  const profile = await fetchOperatorProfileBySlug(slug)
  if (!profile) return null

  const [metrics, qualityScore, tours] = await Promise.all([
    fetchOperatorMetrics(profile.user_id),
    fetchOperatorQualityScore(profile.user_id),
    fetchToursByOperator(profile.user_id),
  ])

  return {
    profile,
    metrics,
    qualityScore,
    tours,
  }
}