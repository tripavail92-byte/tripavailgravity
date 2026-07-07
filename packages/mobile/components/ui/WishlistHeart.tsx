import { router } from 'expo-router'
import { Pressable } from 'react-native'

import { Heart } from '@/components/icons/lucide'
import { useWishlist } from '@/hooks/useWishlist'

/** Tappable save heart for a tour. Prompts sign-in for guests. */
export function WishlistHeart({ tourId, size = 18 }: { tourId: string; size?: number }) {
  const { isAuthed, isWishlisted, toggle } = useWishlist()
  const active = isWishlisted(tourId)
  return (
    <Pressable
      hitSlop={8}
      onPress={() => {
        if (!isAuthed) {
          router.push('/(auth)/login')
          return
        }
        toggle(tourId, 'tour')
      }}
      className="h-8 w-8 items-center justify-center rounded-full bg-white/95"
    >
      <Heart
        size={size}
        color={active ? '#e11d48' : '#475569'}
        fill={active ? '#e11d48' : 'transparent'}
      />
    </Pressable>
  )
}
