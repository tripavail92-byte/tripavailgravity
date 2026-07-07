import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useAuth } from '@/hooks/useAuth'
import { fetchWishlistIds, toggleWishlist, type WishlistItemType } from '@/lib/wishlist'

/**
 * Shared wishlist state (one cached query for the whole app). Optimistic toggle
 * so the heart fills instantly. Auth-only — `isAuthed` is false for guests.
 */
export function useWishlist() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const key = ['wishlist', user?.id] as const

  const { data } = useQuery({
    queryKey: key,
    queryFn: () => fetchWishlistIds(user!.id),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  })

  const ids = data ?? new Set<string>()

  const mutation = useMutation({
    mutationFn: ({ itemId, itemType }: { itemId: string; itemType: WishlistItemType }) =>
      toggleWishlist(itemId, itemType, user!.id),
    onMutate: async ({ itemId }) => {
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<Set<string>>(key) ?? new Set<string>()
      const next = new Set(prev)
      if (next.has(itemId)) next.delete(itemId)
      else next.add(itemId)
      qc.setQueryData(key, next)
      return { prev }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: key })
      qc.invalidateQueries({ queryKey: ['wishlist', 'tours', user?.id] })
    },
  })

  return {
    isAuthed: !!user,
    isWishlisted: (id: string) => ids.has(id),
    toggle: (itemId: string, itemType: WishlistItemType = 'tour') =>
      mutation.mutate({ itemId, itemType }),
  }
}
