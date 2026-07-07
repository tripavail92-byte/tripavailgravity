import { Search, Star } from '@/components/icons/lucide'
import { useQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { FlatList, Image, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native'

import { Badge, Button, Card, EmptyState, Screen, TourCardSkeleton } from '@/components/ui'
import {
  FALLBACK_TOUR_IMAGE,
  formatTourLocation,
  getDurationLabel,
  searchTours,
  type DurationBand,
  type TourCategory,
} from '@/lib/tourDiscovery'

const TOUR_TYPE_OPTIONS: Array<{ label: string; value: TourCategory | null }> = [
  { label: 'All types', value: null },
  { label: 'Adventure', value: 'adventure' },
  { label: 'Nature', value: 'nature' },
  { label: 'Cultural', value: 'cultural' },
]

const DURATION_OPTIONS: Array<{ label: string; value: DurationBand | null }> = [
  { label: 'Any length', value: null },
  { label: '1-3 days', value: 'short' },
  { label: '4-7 days', value: 'medium' },
  { label: '8+ days', value: 'long' },
]

function parseNumberInput(value: string) {
  if (!value.trim()) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

export default function SearchScreen() {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [tourType, setTourType] = useState<TourCategory | null>(null)
  const [durationBand, setDurationBand] = useState<DurationBand | null>(null)
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedQuery(query.trim())
    }, 300)

    return () => clearTimeout(handle)
  }, [query])

  const parsedMinPrice = parseNumberInput(minPrice)
  const parsedMaxPrice = parseNumberInput(maxPrice)
  const hasFilters = Boolean(tourType || durationBand || minPrice.trim() || maxPrice.trim())

  const { data: tours = [], isLoading } = useQuery({
    queryKey: [
      'tours',
      'search',
      debouncedQuery,
      tourType ?? 'all',
      durationBand ?? 'any',
      parsedMinPrice ?? 'none',
      parsedMaxPrice ?? 'none',
    ],
    queryFn: () =>
      searchTours({
        query: debouncedQuery,
        tourType,
        durationBand,
        minPrice: parsedMinPrice,
        maxPrice: parsedMaxPrice,
      }),
    staleTime: 60 * 1000,
  })

  const clearFilters = () => {
    setTourType(null)
    setDurationBand(null)
    setMinPrice('')
    setMaxPrice('')
  }

  const activeFilterChips = [
    tourType ? `Type: ${tourType}` : null,
    durationBand === 'short'
      ? '1-3 days'
      : durationBand === 'medium'
        ? '4-7 days'
        : durationBand === 'long'
          ? '8+ days'
          : null,
    parsedMinPrice != null ? `Min ${parsedMinPrice.toLocaleString()}` : null,
    parsedMaxPrice != null ? `Max ${parsedMaxPrice.toLocaleString()}` : null,
  ].filter(Boolean) as string[]

  return (
    <Screen>
      <FlatList
        data={tours}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 110 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <Text className="text-2xl font-black text-ink">Search Tours</Text>
            <Text className="mb-4 mt-1 text-sm text-ink-muted">
              Browse live tours with native search and traveler-friendly filters.
            </Text>

            <View className="flex-row items-center gap-3">
              <View className="flex-1 flex-row items-center rounded-2xl border border-line bg-surface px-4">
                <Search size={18} color="#94a3b8" />
                <TextInput
                  placeholder="Search destinations, tours, styles..."
                  placeholderTextColor="#94a3b8"
                  value={query}
                  onChangeText={setQuery}
                  className="ml-2 flex-1 py-3.5 text-base text-ink"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="search"
                />
              </View>

              <Pressable
                className={`rounded-2xl border px-4 py-3.5 ${
                  hasFilters ? 'border-primary-700 bg-primary-700' : 'border-line bg-surface'
                }`}
                onPress={() => setFiltersOpen(true)}
              >
                <Text className={`font-semibold ${hasFilters ? 'text-white' : 'text-ink'}`}>
                  Filters
                </Text>
              </Pressable>
            </View>

            {activeFilterChips.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3">
                {activeFilterChips.map((chip) => (
                  <View key={chip} className="mr-2">
                    <Badge label={chip} tone="primary" />
                  </View>
                ))}
                <Pressable className="rounded-full bg-surface-sunken px-3 py-1" onPress={clearFilters}>
                  <Text className="text-xs font-semibold text-ink-muted">Clear</Text>
                </Pressable>
              </ScrollView>
            ) : null}

            <Text className="mb-1 mt-3 text-xs text-ink-soft">
              {isLoading ? 'Updating results...' : `${tours.length} tours found`}
            </Text>
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <View className="mt-2 gap-4">
              <TourCardSkeleton />
              <TourCardSkeleton />
            </View>
          ) : (
            <EmptyState
              icon="search-outline"
              title="No tours match that search"
              description="Try another keyword or clear one of the active filters."
            />
          )
        }
        renderItem={({ item }) => {
          const location = formatTourLocation(item)
          return (
            <Pressable
              className="mt-4"
              onPress={() => router.push(`/tours/${item.slug ?? item.id}`)}
            >
              <Card className="overflow-hidden">
                <Image
                  source={{ uri: item.images[0] ?? FALLBACK_TOUR_IMAGE }}
                  style={{ height: 176 }}
                  className="w-full"
                  resizeMode="cover"
                />
                <View className="p-4">
                  <View className="flex-row items-start justify-between gap-3">
                    <View className="flex-1">
                      <Text className="text-base font-bold text-ink" numberOfLines={2}>
                        {item.title}
                      </Text>
                      {location ? (
                        <Text className="mt-1 text-xs text-ink-muted" numberOfLines={1}>
                          {location}
                        </Text>
                      ) : null}
                    </View>
                    <View className="items-end">
                      <Text className="text-base font-black text-primary-700">
                        {item.currency} {Number(item.price).toLocaleString()}
                      </Text>
                      <Text className="text-xs text-ink-soft">per person</Text>
                    </View>
                  </View>

                  <View className="mt-3 flex-row items-center gap-2">
                    <Badge label={item.tour_type ?? 'Tour'} tone="primary" />
                    <Badge label={getDurationLabel(item.duration_days)} tone="neutral" />
                    {item.rating && item.rating > 0 ? (
                      <View className="flex-row items-center">
                        <Star size={12} color="#f59e0b" fill="#f59e0b" />
                        <Text className="ml-1 text-xs font-semibold text-ink">
                          {item.rating.toFixed(1)}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  {item.short_description ? (
                    <Text className="mt-3 text-sm leading-5 text-ink-muted" numberOfLines={2}>
                      {item.short_description}
                    </Text>
                  ) : null}
                </View>
              </Card>
            </Pressable>
          )
        }}
      />

      <Modal
        visible={filtersOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setFiltersOpen(false)}
      >
        <Pressable className="flex-1 justify-end bg-black/30" onPress={() => setFiltersOpen(false)}>
          <Pressable className="rounded-t-3xl bg-surface px-5 pb-8 pt-5" onPress={() => undefined}>
            <View className="mb-5 flex-row items-center justify-between">
              <Text className="text-lg font-bold text-ink">Filter results</Text>
              <Pressable onPress={() => setFiltersOpen(false)}>
                <Text className="font-semibold text-primary-700">Done</Text>
              </Pressable>
            </View>

            <Text className="mb-2 font-semibold text-ink">Tour type</Text>
            <View className="mb-5 flex-row flex-wrap">
              {TOUR_TYPE_OPTIONS.map((option) => {
                const active = tourType === option.value
                return (
                  <Pressable
                    key={option.label}
                    className={`mb-2 mr-2 rounded-full border px-4 py-2 ${
                      active ? 'border-primary-700 bg-primary-700' : 'border-line bg-surface'
                    }`}
                    onPress={() => setTourType(option.value)}
                  >
                    <Text className={`font-semibold ${active ? 'text-white' : 'text-ink'}`}>
                      {option.label}
                    </Text>
                  </Pressable>
                )
              })}
            </View>

            <Text className="mb-2 font-semibold text-ink">Duration</Text>
            <View className="mb-5 flex-row flex-wrap">
              {DURATION_OPTIONS.map((option) => {
                const active = durationBand === option.value
                return (
                  <Pressable
                    key={option.label}
                    className={`mb-2 mr-2 rounded-full border px-4 py-2 ${
                      active ? 'border-primary-700 bg-primary-700' : 'border-line bg-surface'
                    }`}
                    onPress={() => setDurationBand(option.value)}
                  >
                    <Text className={`font-semibold ${active ? 'text-white' : 'text-ink'}`}>
                      {option.label}
                    </Text>
                  </Pressable>
                )
              })}
            </View>

            <Text className="mb-2 font-semibold text-ink">Price range</Text>
            <View className="flex-row gap-3">
              <View className="flex-1 rounded-2xl border border-line bg-surface-sunken px-4">
                <TextInput
                  placeholder="Min"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  value={minPrice}
                  onChangeText={setMinPrice}
                  className="py-3.5 text-ink"
                />
              </View>
              <View className="flex-1 rounded-2xl border border-line bg-surface-sunken px-4">
                <TextInput
                  placeholder="Max"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  value={maxPrice}
                  onChangeText={setMaxPrice}
                  className="py-3.5 text-ink"
                />
              </View>
            </View>

            <View className="mt-6">
              <Button label="Reset filters" variant="secondary" onPress={clearFilters} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  )
}
