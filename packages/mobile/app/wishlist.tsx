import { useQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
import { FlatList, Text, View } from 'react-native'

import { AppHeader, Button, EmptyState, Screen, TourCard, TourCardSkeleton, type TourCardData } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { fetchWishlistTours } from '@/lib/wishlist'
import { getDurationLabel } from '@/lib/tourDiscovery'

function toCard(t: any): TourCardData {
  const loc = t.location ?? {}
  const cities: string[] = Array.isArray(t.destination_cities) ? t.destination_cities : []
  const locationLabel = cities.length
    ? cities.join(' · ')
    : [loc.city, loc.country].filter(Boolean).join(', ')
  return {
    id: t.id,
    slug: t.slug,
    title: t.title,
    price: t.price,
    currency: t.currency,
    images: Array.isArray(t.images) ? t.images : [],
    rating: t.rating,
    locationLabel: locationLabel || null,
    durationLabel: getDurationLabel(t.duration_days),
    tourType: t.tour_type,
  }
}

export default function WishlistScreen() {
  const { user } = useAuth()
  const { data: tours = [], isLoading } = useQuery({
    queryKey: ['wishlist', 'tours', user?.id],
    queryFn: () => fetchWishlistTours(user!.id),
    enabled: !!user,
    staleTime: 60 * 1000,
  })

  if (!user) {
    return (
      <Screen>
        <AppHeader showBack title="Wishlist" />
        <EmptyState
          icon="heart-outline"
          title="Save your favourites"
          description="Sign in to save tours and find them here anytime."
        >
          <Button label="Sign In" onPress={() => router.push('/(auth)/login')} />
        </EmptyState>
      </Screen>
    )
  }

  return (
    <Screen>
      <AppHeader showBack title="Wishlist" subtitle={tours.length ? `${tours.length} saved` : undefined} />
      <FlatList
        data={tours}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 24, gap: 14 }}
        columnWrapperStyle={{ gap: 14 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          isLoading ? (
            <View className="flex-row gap-3.5">
              <TourCardSkeleton layout="grid" />
              <TourCardSkeleton layout="grid" />
            </View>
          ) : (
            <EmptyState
              icon="heart-outline"
              title="No saved tours yet"
              description="Tap the heart on any tour to save it here."
            >
              <Button label="Explore tours" onPress={() => router.push('/(tabs)/tours')} />
            </EmptyState>
          )
        }
        renderItem={({ item }) => <TourCard tour={toCard(item)} layout="grid" />}
      />
    </Screen>
  )
}
