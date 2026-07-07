import { router } from 'expo-router'
import { Star } from '@/components/icons/lucide'
import { Image, Pressable, Text, View } from 'react-native'

import { Badge } from './Badge'
import { Card } from './Card'
import { WishlistHeart } from './WishlistHeart'

export interface TourCardData {
  id: string
  slug?: string | null
  title: string
  price: number
  currency: string
  images: string[]
  rating?: number | null
  /** Precomputed location string, e.g. "Hunza, Pakistan". */
  locationLabel?: string | null
  /** Precomputed duration label, e.g. "5 days" (list layout only). */
  durationLabel?: string | null
  /** Tour type, shown as a badge in list layout. */
  tourType?: string | null
  /** Short description, shown in list layout. */
  shortDescription?: string | null
}

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=600&q=80'

function RatingPill({ rating }: { rating: number }) {
  return (
    <View className="absolute right-2 top-2 flex-row items-center rounded-full bg-white/95 px-2 py-0.5">
      <Star size={11} color="#f59e0b" fill="#f59e0b" />
      <Text className="ml-1 text-xs font-bold text-ink">{rating.toFixed(1)}</Text>
    </View>
  )
}

/**
 * Unified tour card used across grid screens (Tours/Category/Collection) and
 * list screens (Search/Operator). Callers precompute locationLabel/durationLabel.
 */
export function TourCard({
  tour,
  layout = 'list',
}: {
  tour: TourCardData
  layout?: 'grid' | 'list'
}) {
  const go = () => router.push(`/tours/${tour.slug ?? tour.id}`)
  const image = tour.images?.[0] ?? FALLBACK_IMAGE
  const rating = tour.rating ?? 0

  if (layout === 'grid') {
    return (
      <Pressable
        className="flex-1"
        onPress={go}
        style={({ pressed }) => (pressed ? { transform: [{ scale: 0.97 }] } : undefined)}
      >
        <Card className="flex-1 overflow-hidden">
          <View>
            <Image source={{ uri: image }} style={{ height: 128 }} className="w-full" resizeMode="cover" />
            {rating > 0 ? <RatingPill rating={rating} /> : null}
            <View className="absolute left-2 top-2">
              <WishlistHeart tourId={tour.id} size={16} />
            </View>
          </View>
          <View className="p-3">
            <Text className="text-sm font-semibold text-ink" numberOfLines={2}>
              {tour.title}
            </Text>
            {tour.locationLabel ? (
              <Text className="mt-0.5 text-xs text-ink-soft" numberOfLines={1}>
                {tour.locationLabel}
              </Text>
            ) : null}
            <Text className="mt-1.5 text-sm font-bold text-primary-700">
              {tour.currency} {Number(tour.price).toLocaleString()}
            </Text>
          </View>
        </Card>
      </Pressable>
    )
  }

  return (
    <Pressable
      onPress={go}
      style={({ pressed }) => (pressed ? { transform: [{ scale: 0.98 }] } : undefined)}
    >
      <Card className="overflow-hidden">
        <View>
          <Image source={{ uri: image }} style={{ height: 176 }} className="w-full" resizeMode="cover" />
          <View className="absolute right-2 top-2">
            <WishlistHeart tourId={tour.id} size={18} />
          </View>
        </View>
        <View className="p-4">
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1">
              <Text className="text-base font-bold text-ink" numberOfLines={2}>
                {tour.title}
              </Text>
              {tour.locationLabel ? (
                <Text className="mt-1 text-xs text-ink-muted" numberOfLines={1}>
                  {tour.locationLabel}
                </Text>
              ) : null}
            </View>
            <View className="items-end">
              <Text className="text-base font-black text-primary-700">
                {tour.currency} {Number(tour.price).toLocaleString()}
              </Text>
              <Text className="text-xs text-ink-soft">per person</Text>
            </View>
          </View>

          <View className="mt-3 flex-row items-center gap-2">
            {tour.tourType ? <Badge label={tour.tourType} tone="primary" /> : null}
            {tour.durationLabel ? <Badge label={tour.durationLabel} tone="neutral" /> : null}
            {rating > 0 ? (
              <View className="flex-row items-center">
                <Star size={12} color="#f59e0b" fill="#f59e0b" />
                <Text className="ml-1 text-xs font-semibold text-ink">{rating.toFixed(1)}</Text>
              </View>
            ) : null}
          </View>

          {tour.shortDescription ? (
            <Text className="mt-3 text-sm leading-5 text-ink-muted" numberOfLines={2}>
              {tour.shortDescription}
            </Text>
          ) : null}
        </View>
      </Card>
    </Pressable>
  )
}
