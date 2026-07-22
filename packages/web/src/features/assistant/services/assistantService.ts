import { supabase } from '@/lib/supabase'
import type { SearchListing } from '@/queries/searchQueries'

/**
 * Client for the travel-assistant edge function.
 *
 * The endpoint returns TWO things and both matter: `reply` (prose) and `listings` (the actual rows
 * the model searched). The UI renders the listings as real cards with real prices and working
 * links — the prose sits alongside them, it does not stand in for them. That separation is what
 * keeps the feature honest: even if the model's wording drifts, the traveller is looking at genuine
 * inventory they can click through and book.
 */

export interface AssistantMessage {
  role: 'user' | 'assistant'
  content: string
  /** Populated on assistant turns that searched. Rendered as cards, not described in prose. */
  listings?: SearchListing[]
}

export class AssistantError extends Error {
  constructor(
    message: string,
    /** True when the caller hit the hourly quota, so the UI can say something useful. */
    readonly rateLimited = false,
  ) {
    super(message)
    this.name = 'AssistantError'
  }
}

/** Mirrors mapRow in searchQueries.ts — the edge function returns raw RPC rows unchanged. */
function mapListing(r: Record<string, unknown>): SearchListing {
  const num = (v: unknown) => (v != null ? Number(v) : null)
  return {
    listingId: String(r.listing_id ?? ''),
    listingType: (r.listing_type === 'package'
      ? 'package'
      : 'tour') as SearchListing['listingType'],
    slug: (r.slug as string) ?? null,
    title: (r.title as string) ?? 'Untitled',
    subtitle: (r.subtitle as string) ?? null,
    locationLabel: (r.location_label as string) ?? null,
    country: (r.country as string) ?? null,
    price: num(r.price),
    currency: (r.currency as string) || 'PKR',
    // Ratings are deliberately dropped, here as well as server-side. Every listing's rating and
    // review_count are 0 because nothing writes them, so a card showing "0" would read as a bad
    // score rather than as "no reviews yet".
    rating: null,
    reviewCount: null,
    images: Array.isArray(r.images)
      ? ((r.images as unknown[]).filter((x) => typeof x === 'string') as string[])
      : [],
    durationDays: num(r.duration_days),
    badge: (r.badge as string) ?? null,
    isFeatured: Boolean(r.is_featured),
    distanceKm: num(r.distance_km),
    relevance: Number(r.relevance) || 0,
  }
}

export async function askAssistant(history: AssistantMessage[]): Promise<AssistantMessage> {
  const { data, error } = await supabase.functions.invoke('travel-assistant', {
    body: {
      // Only role and content cross the wire; listings are client-side render state.
      messages: history.map((m) => ({ role: m.role, content: m.content })),
    },
  })

  if (error) {
    // functions.invoke surfaces non-2xx as an error whose context holds the response.
    const status = (error as { context?: { status?: number } }).context?.status
    if (status === 429) {
      throw new AssistantError(
        "You've reached the hourly limit for the assistant. Please try again shortly.",
        true,
      )
    }
    throw new AssistantError('The assistant could not answer just now. Please try again.')
  }

  const reply = typeof data?.reply === 'string' ? data.reply.trim() : ''
  if (!reply) throw new AssistantError('The assistant could not answer just now. Please try again.')

  const rows = Array.isArray(data?.listings) ? data.listings : []

  return {
    role: 'assistant',
    content: reply,
    listings: rows.map(mapListing).filter((l: SearchListing) => l.listingId),
  }
}
