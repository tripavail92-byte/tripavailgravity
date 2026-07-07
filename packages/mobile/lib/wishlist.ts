import { supabase } from '@/lib/supabase'

export type WishlistItemType = 'tour' | 'package'

/** Set of wishlisted item ids for a user (auth-only on mobile — no guest localStorage). */
export async function fetchWishlistIds(userId: string): Promise<Set<string>> {
  const { data, error } = await supabase.from('wishlist').select('item_id').eq('user_id', userId)
  if (error) throw error
  return new Set((data ?? []).map((r: any) => r.item_id as string))
}

/** Toggle an item; returns true if now wishlisted, false if removed. */
export async function toggleWishlist(
  itemId: string,
  itemType: WishlistItemType,
  userId: string,
): Promise<boolean> {
  const { data: existing } = await supabase
    .from('wishlist')
    .select('id')
    .eq('user_id', userId)
    .eq('item_id', itemId)
    .eq('item_type', itemType)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase.from('wishlist').delete().eq('id', (existing as any).id)
    if (error) throw error
    return false
  }
  const { error } = await supabase
    .from('wishlist')
    .insert({ user_id: userId, item_id: itemId, item_type: itemType })
  if (error) throw error
  return true
}

/** Full tour rows for the user's wishlisted tours (for the Wishlist screen). */
export async function fetchWishlistTours(userId: string) {
  const { data: w } = await supabase
    .from('wishlist')
    .select('item_id')
    .eq('user_id', userId)
    .eq('item_type', 'tour')
  const ids = (w ?? []).map((r: any) => r.item_id as string)
  if (!ids.length) return [] as any[]
  const { data, error } = await supabase
    .from('tours')
    .select('id,slug,title,price,currency,images,location,rating,destination_cities,tour_type,duration_days')
    .in('id', ids)
    .eq('is_active', true)
    .eq('is_published', true)
    .eq('status', 'live')
  if (error) throw error
  return data ?? []
}
