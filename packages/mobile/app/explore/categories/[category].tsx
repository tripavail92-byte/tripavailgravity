import { useQuery } from '@tanstack/react-query'
import { router, useLocalSearchParams } from 'expo-router'
import { FlatList, Text, View } from 'react-native'

import { AppHeader, Button, EmptyState, Screen, TourCard, type TourCardData } from '@/components/ui'
import {
  fetchToursByCategory,
  formatTourLocation,
  getCategoryCopy,
  getDurationLabel,
  normalizeCategoryParam,
  type DiscoveryTour,
} from '@/lib/tourDiscovery'

function toCardData(t: DiscoveryTour): TourCardData {
  return {
    id: t.id,
    slug: t.slug,
    title: t.title,
    price: t.price,
    currency: t.currency,
    images: t.images,
    rating: t.rating,
    locationLabel: formatTourLocation(t),
    durationLabel: getDurationLabel(t.duration_days),
    tourType: t.tour_type,
  }
}

export default function CategoryToursScreen() {
  const { category } = useLocalSearchParams<{ category?: string }>()
  const normalizedCategory = normalizeCategoryParam(category)
  const categoryCopy = normalizedCategory ? getCategoryCopy(normalizedCategory) : null

  const { data: tours = [], isLoading } = useQuery({
    queryKey: ['tours', 'category', normalizedCategory ?? 'unknown'],
    queryFn: () => fetchToursByCategory(normalizedCategory!),
    enabled: Boolean(normalizedCategory),
    staleTime: 5 * 60 * 1000,
  })

  if (!normalizedCategory || !categoryCopy) {
    return (
      <Screen>
        <AppHeader showBack title="Category" />
        <View className="flex-1">
          <EmptyState
            icon="alert-circle-outline"
            title="Category not found"
            description="That category is not available in the mobile discovery flow."
          >
            <Button label="Back to Explore" onPress={() => router.replace('/(tabs)')} />
          </EmptyState>
        </View>
      </Screen>
    )
  }

  return (
    <Screen>
      <AppHeader showBack title={categoryCopy.title} />
      <FlatList
        data={tours}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 0, paddingBottom: 28, gap: 14 }}
        columnWrapperStyle={{ gap: 14 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Text className="mb-3 text-sm leading-5 text-ink-muted">{categoryCopy.subtitle}</Text>
        }
        ListEmptyComponent={
          isLoading ? (
            <Text className="mt-12 text-center text-ink-soft">Loading tours…</Text>
          ) : (
            <EmptyState
              icon="map-outline"
              title="Nothing here yet"
              description="No live tours found in this category yet."
            />
          )
        }
        renderItem={({ item }) => <TourCard tour={toCardData(item)} layout="grid" />}
      />
    </Screen>
  )
}
