import { supabase } from '@/lib/supabase'
import {
  EXCLUDED_FEATURE_OPTIONS,
  INCLUDED_FEATURE_OPTIONS,
  buildStructuredFeaturesFromLabels,
  type TourFeatureItem,
} from '@/lib/tourFeatureCatalog'

/**
 * Tour authoring service — faithful port of the web
 * `features/tour-operator/services/tourService.ts`. Writes the EXACT `tours`
 * columns (canonical + legacy spellings), regenerates `tour_schedules` via the
 * `sync_tour_schedules_from_json` RPC after every write, and manages media via
 * `tour_media` + storage bucket `tour-images` (keeping `tours.images` in sync).
 */

export type NormalizedTourScheduleRow = {
  start_time: string
  end_time: string
  capacity: number
  status: 'scheduled' | 'cancelled' | 'completed'
}

export interface TourMediaItem {
  id: string
  tour_id: string
  url: string
  storage_path: string
  sort_order: number
  is_main: boolean
  created_at: string
}

export interface PickupRow {
  id?: string
  tour_id?: string
  title: string
  formatted_address: string
  city: string | null
  country: string | null
  latitude: number
  longitude: number
  google_place_id: string | null
  pickup_time: string | null
  notes: string | null
  is_primary: boolean
}

const nowISO = () => new Date().toISOString()

/** One stable dedup id per wizard mount; embedded in draft_data._clientDraftId. */
export function createDraftClientId(): string {
  const rnd = Math.random().toString(36).slice(2)
  try {
    const c = (globalThis as any).crypto
    if (c?.randomUUID) return c.randomUUID()
  } catch {
    // ignore
  }
  return `draft-${Date.now().toString(36)}-${rnd}`
}

/** Drop UI-only keys (e.g. _pickup, _media, _clientDraftId) so they never reach a tours column. */
function stripPrivate(obj: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {}
  for (const k of Object.keys(obj || {})) if (!k.startsWith('_')) out[k] = obj[k]
  return out
}

function buildFallbackSlug(title?: string): string {
  const base =
    String(title || 'tour')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .trim()
      .replace(/\s+/g, '-') || 'tour'
  const rand = Math.random().toString(36).substring(2, 6)
  return `${base}-${Date.now().toString(36)}-${rand}`
}

/** Applied on EVERY tour write — writes both canonical + legacy column spellings. */
function normalizeTourWrite(input: Record<string, any>) {
  const normalizedPrice = Number.isFinite(Number(input.price)) ? Number(input.price) : 0
  const cancellation = input.cancellation_policy || 'moderate'
  const inclusions = Array.isArray(input.inclusions) ? input.inclusions : []
  const exclusions = Array.isArray(input.exclusions) ? input.exclusions : []
  const includedFeatures: TourFeatureItem[] =
    input.included_features?.length > 0
      ? input.included_features
      : buildStructuredFeaturesFromLabels(inclusions, INCLUDED_FEATURE_OPTIONS)
  const excludedFeatures: TourFeatureItem[] =
    input.excluded_features?.length > 0
      ? input.excluded_features
      : buildStructuredFeaturesFromLabels(exclusions, EXCLUDED_FEATURE_OPTIONS)

  return {
    price: normalizedPrice,
    base_price: normalizedPrice,
    deposit_required: true,
    require_deposit: true,
    deposit_percentage: Math.max(20, Number(input.deposit_percentage || 0)),
    cancellation_policy: cancellation,
    cancellation_policy_type: cancellation,
    inclusions,
    included: inclusions,
    exclusions,
    excluded: exclusions,
    included_features: includedFeatures,
    excluded_features: excludedFeatures,
  }
}

function toISO(value: any): string | null {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

function normalizeTourSchedules(schedules: any[], fallbackCapacity = 10, durationDays = 1): NormalizedTourScheduleRow[] {
  const out: NormalizedTourScheduleRow[] = []
  for (const item of schedules ?? []) {
    let start = toISO(item?.start_time)
    if (!start && item?.date) {
      const time = item?.time || '09:00'
      start = toISO(`${item.date}T${time}:00`)
    }
    if (!start) continue
    let end = toISO(item?.end_time)
    if (!end) {
      const s = new Date(start)
      s.setDate(s.getDate() + Math.max(0, (durationDays || 1) - 1))
      end = s.toISOString()
    }
    const capNum = parseInt(String(item?.capacity), 10)
    const capacity = Number.isFinite(capNum) && capNum > 0 ? Math.max(1, Math.round(capNum)) : Math.max(1, fallbackCapacity)
    const status: NormalizedTourScheduleRow['status'] = ['scheduled', 'cancelled', 'completed'].includes(item?.status)
      ? item.status
      : 'scheduled'
    out.push({ start_time: start, end_time: end, capacity, status })
  }
  return out
}

async function syncTourSchedulesFromJson(tourId: string, schedules: any[], fallbackCapacity = 10, durationDays = 1): Promise<void> {
  const normalized = normalizeTourSchedules(schedules ?? [], fallbackCapacity, durationDays)
  const { error } = await supabase.rpc('sync_tour_schedules_from_json', {
    p_tour_id: tourId,
    p_schedules: normalized,
    p_default_capacity: Math.max(1, fallbackCapacity),
  })
  if (error) throw error
}

/** 10 boolean checks × 10% each. */
export function calculateCompletionPercentage(data: Record<string, any>): number {
  const checks = [
    !!data.title?.trim?.(),
    !!data.tour_type,
    !!data.location?.city,
    !!data.duration,
    Array.isArray(data.images) && data.images.length > 0,
    !!data.description?.trim?.(),
    Array.isArray(data.itinerary) && data.itinerary.length > 0,
    Number(data.price) > 0,
    !!data.cancellation_policy,
    Array.isArray(data.schedules) && data.schedules.length > 0,
  ]
  return Math.round((checks.filter(Boolean).length / checks.length) * 100)
}

function buildTourPayload(data: Record<string, any>, operatorId: string, completionPct?: number, workflowSnapshot?: any) {
  const { draft_data: existingDraftData, ...restData } = data
  const normalizedDraftData = {
    ...(existingDraftData || {}),
    ...restData,
    _workflow: workflowSnapshot ?? existingDraftData?._workflow ?? null,
  }
  const location = data.location || {}
  const destinationCities =
    Array.isArray(data.destination_cities) && data.destination_cities.length
      ? data.destination_cities.filter(Boolean)
      : location.city
        ? [location.city]
        : []

  const payload: Record<string, any> = {
    operator_id: operatorId,
    title: data.title || 'Untitled Tour',
    slug: data.slug || null,
    tour_type: data.tour_type || 'Adventure',
    custom_category_label: data.custom_category_label ?? null,
    location,
    destination_cities: destinationCities,
    duration: data.duration || '1 day',
    duration_days: data.duration_days ?? null,
    short_description: data.short_description ?? null,
    description: data.description ?? null,
    ...normalizeTourWrite(data),
    currency: data.currency || 'PKR',
    is_published: false,
    images: data.images || [],
    highlights: data.highlights || [],
    requirements: data.requirements || [],
    languages: data.languages || ['en'],
    min_participants: data.min_participants || 1,
    max_participants: data.max_participants || 10,
    min_age: data.min_age || 5,
    max_age: data.max_age || 80,
    difficulty_level: data.difficulty_level || 'moderate',
    group_discounts: data.group_discounts ?? false,
    seasonal_pricing: data.seasonal_pricing ?? false,
    peak_season_multiplier: data.peak_season_multiplier || 1.2,
    off_season_multiplier: data.off_season_multiplier || 0.8,
    pricing_tiers: data.pricing_tiers || [],
    itinerary: data.itinerary || [],
    schedules: data.schedules || [],
    draft_data: normalizedDraftData,
    workflow_status: 'in_progress',
    last_edited_at: nowISO(),
    completion_percentage: completionPct ?? 0,
    updated_at: nowISO(),
  }
  const clientDraftId: string | null = normalizedDraftData._clientDraftId ?? null
  return { payload, clientDraftId }
}

/** PRIMARY draft path (web saveWorkflowDraft) — insert with _clientDraftId dedup, or update. */
export async function saveTourDraft(
  data: Record<string, any>,
  operatorId: string,
  tourId?: string | null,
  completionPct?: number,
  workflowSnapshot?: any,
): Promise<{ success: true; tourId: string }> {
  const effectiveTourId = tourId || data.id || null
  const { payload, clientDraftId } = buildTourPayload(data, operatorId, completionPct, workflowSnapshot)
  const capacity = payload.max_participants || 10
  const durationDays = payload.duration_days || 1

  // Branch A — update an existing tour row.
  if (effectiveTourId) {
    const { error } = await supabase
      .from('tours')
      .update(payload)
      .eq('id', effectiveTourId)
      .eq('operator_id', operatorId)
      .select('id')
      .single()
    if (error) throw error
    await syncTourSchedulesFromJson(effectiveTourId, payload.schedules, capacity, durationDays)
    return { success: true, tourId: effectiveTourId }
  }

  // Branch B — insert with dedup.
  const findDraft = async () => {
    const { data: found } = await supabase
      .from('tours')
      .select('id')
      .eq('operator_id', operatorId)
      .contains('draft_data', { _clientDraftId: clientDraftId })
      .in('workflow_status', ['draft', 'in_progress', 'rejected'])
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    return (found as { id?: string } | null)?.id ?? null
  }

  if (clientDraftId) {
    const existingId = await findDraft()
    if (existingId) {
      const { error } = await supabase.from('tours').update(payload).eq('id', existingId).eq('operator_id', operatorId).select('id').single()
      if (error) throw error
      await syncTourSchedulesFromJson(existingId, payload.schedules, capacity, durationDays)
      return { success: true, tourId: existingId }
    }
  }

  const insertPayload = { ...payload, workflow_status: 'draft', slug: payload.slug || buildFallbackSlug(payload.title) }
  const { data: inserted, error: insertError } = await supabase.from('tours').insert(insertPayload).select('id').single()
  if (insertError) {
    const code = (insertError as any).code
    const msg = String((insertError as any).message || '')
    if (code === '23505' && msg.includes('tours_slug_key')) {
      if (clientDraftId) {
        const winnerId = await findDraft()
        if (winnerId) {
          await supabase.from('tours').update(payload).eq('id', winnerId).eq('operator_id', operatorId)
          await syncTourSchedulesFromJson(winnerId, payload.schedules, capacity, durationDays)
          return { success: true, tourId: winnerId }
        }
      }
      const retry = { ...insertPayload, slug: buildFallbackSlug(payload.title) }
      const { data: inserted2, error: e2 } = await supabase.from('tours').insert(retry).select('id').single()
      if (e2) throw e2
      const id2 = (inserted2 as { id: string }).id
      await syncTourSchedulesFromJson(id2, payload.schedules, capacity, durationDays)
      return { success: true, tourId: id2 }
    }
    throw insertError
  }
  const id = (inserted as { id: string }).id
  await syncTourSchedulesFromJson(id, payload.schedules, capacity, durationDays)
  return { success: true, tourId: id }
}

async function createTour(tourData: Record<string, any>): Promise<Record<string, any>> {
  const payload: Record<string, any> = { ...stripPrivate(tourData), ...normalizeTourWrite(tourData) }
  let created: Record<string, any>
  const { data, error } = await supabase.from('tours').insert(payload).select().single()
  if (error) {
    if ((error as any).code === '23505' && String((error as any).message || '').includes('tours_slug_key')) {
      const retry = { ...payload, slug: buildFallbackSlug(payload.title) }
      const { data: d2, error: e2 } = await supabase.from('tours').insert(retry).select().single()
      if (e2) throw e2
      created = d2 as Record<string, any>
    } else {
      throw error
    }
  } else {
    created = data as Record<string, any>
  }
  await syncTourSchedulesFromJson(created.id, payload.schedules, payload.max_participants || 10, payload.duration_days || 1)
  return created
}

async function updateTour(id: string, updates: Record<string, any>): Promise<Record<string, any>> {
  const payload: Record<string, any> = { ...stripPrivate(updates), ...normalizeTourWrite(updates), updated_at: nowISO(), last_edited_at: nowISO() }
  const { data, error } = await supabase.from('tours').update(payload).eq('id', id).select().single()
  if (error) throw error
  await syncTourSchedulesFromJson(id, payload.schedules, payload.max_participants || 10, payload.duration_days || 1)
  return data as Record<string, any>
}

/** Publish: self-approve + flip visibility flags. Goes through create/update. */
export async function publishTour(
  tourData: Record<string, any>,
  operatorId: string,
  existingTourId?: string | null,
): Promise<Record<string, any>> {
  const dataToSave: Record<string, any> = {
    ...tourData,
    operator_id: operatorId,
    deposit_required: true,
    is_active: true,
    is_published: true,
    is_verified: false,
    is_featured: false,
    workflow_status: 'approved',
    approved_at: nowISO(),
  }
  delete dataToSave.id
  delete dataToSave.difficulty
  return existingTourId ? updateTour(existingTourId, dataToSave) : createTour(dataToSave)
}

export async function submitTourForReview(tourId: string, operatorId: string): Promise<{ success: true }> {
  const { error } = await supabase
    .from('tours')
    .update({ workflow_status: 'submitted', submitted_at: nowISO(), updated_at: nowISO() })
    .eq('id', tourId)
    .eq('operator_id', operatorId)
  if (error) throw error
  return { success: true }
}

// ── Media ──────────────────────────────────────────────────────────────────

export async function listTourMedia(tourId: string): Promise<TourMediaItem[]> {
  const { data, error } = await supabase
    .from('tour_media')
    .select('*')
    .eq('tour_id', tourId)
    .order('is_main', { ascending: false })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as TourMediaItem[]
}

export async function syncTourImagesFromMedia(tourId: string, operatorId: string): Promise<string[]> {
  const media = await listTourMedia(tourId)
  const orderedUrls = media.map((m) => m.url)
  const { error } = await supabase
    .from('tours')
    .update({ images: orderedUrls, updated_at: nowISO(), last_edited_at: nowISO() })
    .eq('id', tourId)
    .eq('operator_id', operatorId)
  if (error) throw error
  return orderedUrls
}

export async function setTourMediaMain(tourId: string, mediaId: string, operatorId: string): Promise<{ success: true }> {
  const { error } = await supabase.rpc('set_tour_media_main', { p_tour_id: tourId, p_media_id: mediaId })
  if (error) throw error
  await syncTourImagesFromMedia(tourId, operatorId)
  return { success: true }
}

export async function removeTourMedia(tourId: string, mediaId: string, operatorId: string): Promise<{ success: true }> {
  const { data: row } = await supabase.from('tour_media').select('id, storage_path, is_main').eq('id', mediaId).single()
  const meta = row as { storage_path?: string; is_main?: boolean } | null
  await supabase.from('tour_media').delete().eq('id', mediaId)
  if (meta?.storage_path) await supabase.storage.from('tour-images').remove([meta.storage_path])
  if (meta?.is_main) {
    const remaining = await listTourMedia(tourId)
    if (remaining.length) {
      await setTourMediaMain(tourId, remaining[0].id, operatorId)
      return { success: true }
    }
  }
  await syncTourImagesFromMedia(tourId, operatorId)
  return { success: true }
}

export interface UploadTourImageParams {
  tourId: string
  operatorId: string
  localUri: string
  fileName?: string
  mimeType?: string
  sortOrder: number
  makeMain: boolean
  timeoutMs?: number
}

export async function uploadTourImage(params: UploadTourImageParams): Promise<TourMediaItem> {
  const { tourId, operatorId, localUri, fileName, mimeType, sortOrder, makeMain, timeoutMs = 15000 } = params

  let fileExt = 'jpg'
  if (fileName && fileName.includes('.')) fileExt = fileName.split('.').pop()!.toLowerCase()
  else if (mimeType?.includes('/')) fileExt = mimeType.split('/')[1]
  const storageName = `${Math.random().toString(36).substring(2)}.${fileExt}`
  // First path segment MUST be the operator auth uid (storage RLS).
  const filePath = `${operatorId}/${tourId}/${storageName}`
  const contentType = mimeType ?? `image/${fileExt}`

  // RN: read the local file into an ArrayBuffer (Supabase's official Expo pattern).
  const arraybuffer = await fetch(localUri).then((r) => r.arrayBuffer())

  const uploadPromise = supabase.storage
    .from('tour-images')
    .upload(filePath, arraybuffer, { contentType, cacheControl: '3600', upsert: false })
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Upload timeout: no progress detected')), timeoutMs),
  )
  const uploadResult = (await Promise.race([uploadPromise, timeout])) as { error: any }
  if (uploadResult.error) throw uploadResult.error

  const publicUrl = supabase.storage.from('tour-images').getPublicUrl(filePath).data.publicUrl

  const { data: inserted, error: insertError } = await supabase
    .from('tour_media')
    .insert({ tour_id: tourId, url: publicUrl, storage_path: filePath, sort_order: sortOrder, is_main: false })
    .select('*')
    .single()
  if (insertError) {
    await supabase.storage.from('tour-images').remove([filePath])
    throw insertError
  }

  const media = inserted as TourMediaItem
  if (makeMain) {
    await supabase.rpc('set_tour_media_main', { p_tour_id: tourId, p_media_id: media.id })
  }
  await syncTourImagesFromMedia(tourId, operatorId)
  return media
}

// ── Pickups (delete-then-replace) ────────────────────────────────────────────

export async function saveTourPickups(tourId: string, pickups: PickupRow[]): Promise<PickupRow[]> {
  await supabase.from('tour_pickup_locations').delete().eq('tour_id', tourId)
  if (pickups.length) {
    const rows = pickups.map((p) => ({
      tour_id: tourId,
      title: p.title,
      formatted_address: p.formatted_address,
      city: p.city,
      country: p.country,
      latitude: p.latitude,
      longitude: p.longitude,
      google_place_id: p.google_place_id,
      pickup_time: p.pickup_time,
      notes: p.notes,
      is_primary: p.is_primary,
    }))
    const { error } = await supabase.from('tour_pickup_locations').insert(rows)
    if (error) throw error
  }
  const { data } = await supabase
    .from('tour_pickup_locations')
    .select('*')
    .eq('tour_id', tourId)
    .order('is_primary', { ascending: false })
    .order('pickup_time', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true })
  return (data ?? []) as PickupRow[]
}
