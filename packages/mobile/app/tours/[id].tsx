import { useQuery } from '@tanstack/react-query'
import { LinearGradient } from 'expo-linear-gradient'
import { router, Stack, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import {
  Image,
  Linking,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { tourFeatureIcon } from '@/components/icons'
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Navigation,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
} from '@/components/icons/lucide'
import { Avatar, Badge, Button, Card, Skeleton, WishlistHeart } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { useRoleTheme, useThemeColors } from '@/theme'
import { fetchOperatorProfileById } from '@/lib/operatorPublic'
import { fetchTourReviews, type TourReview } from '@/lib/reviews'
import { supabase } from '@/lib/supabase'

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1488085061387-422e29b40080?auto=format&fit=crop&w=800&q=80'

interface Feature {
  label: string
  icon_key?: string | null
}

interface PickupPoint {
  id: string
  title: string | null
  formatted_address: string | null
  city: string | null
  pickup_time: string | null
  latitude: number | null
  longitude: number | null
  is_primary: boolean | null
  notes: string | null
}

// Human copy for the cancellation policy enum — mirrors the web cancellationMeta map.
const CANCELLATION_META: Record<string, { title: string; body: string }> = {
  flexible: {
    title: 'Flexible',
    body: 'Free cancellation up to 24 hours before departure for a full refund.',
  },
  moderate: {
    title: 'Moderate',
    body: 'Free cancellation up to 5 days before departure. 50% refund after that.',
  },
  strict: {
    title: 'Strict',
    body: 'Cancel at least 7 days before departure for a 50% refund. No refund after.',
  },
  'non-refundable': {
    title: 'Non-refundable',
    body: 'This booking cannot be cancelled or refunded once confirmed.',
  },
}

async function fetchTour(id: string) {
  const queryColumn = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
    ? 'id'
    : 'slug'
  const { data, error } = await supabase.from('tours').select('*').eq(queryColumn, id).single()
  if (error) throw error
  return data
}

async function fetchTourPickups(tourId: string): Promise<PickupPoint[]> {
  const { data, error } = await supabase
    .from('tour_pickup_locations')
    .select('id,title,formatted_address,city,pickup_time,latitude,longitude,is_primary,notes')
    .eq('tour_id', tourId)
    .order('is_primary', { ascending: false })
  if (error) return []
  return (data ?? []) as PickupPoint[]
}

function SectionTitle({ children }: { children: string }) {
  return <Text className="mb-3 mt-7 text-lg font-bold text-ink">{children}</Text>
}

function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <View className="flex-row">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          color="#f59e0b"
          fill={i <= Math.round(rating) ? '#f59e0b' : 'transparent'}
        />
      ))}
    </View>
  )
}

function FeatureRow({ feature, muted }: { feature: Feature; muted?: boolean }) {
  const theme = useRoleTheme()
  const Icon = tourFeatureIcon(feature.icon_key)
  return (
    <View className="mb-2.5 flex-row items-center">
      <View
        className={`h-8 w-8 items-center justify-center rounded-full ${
          muted ? 'bg-surface-sunken' : 'bg-primary-50'
        }`}
      >
        <Icon size={16} color={muted ? '#94a3b8' : theme.primary} />
      </View>
      <Text className={`ml-3 flex-1 text-sm ${muted ? 'text-ink-soft' : 'text-ink'}`}>
        {feature.label}
      </Text>
    </View>
  )
}

function ItineraryDay({ day }: { day: any }) {
  const activities = Array.isArray(day?.activities) ? day.activities : null
  return (
    <View className="mb-3">
      <Card className="p-4">
        <View className="flex-row items-center">
          <View className="h-7 items-center justify-center rounded-full bg-primary-700 px-2.5">
            <Text className="text-xs font-bold text-white">Day {day?.day ?? '?'}</Text>
          </View>
          {day?.title ? (
            <Text className="ml-2 flex-1 text-sm font-bold text-ink" numberOfLines={2}>
              {day.title}
            </Text>
          ) : null}
        </View>
        {activities ? (
          <View className="mt-3">
            {activities.map((a: any, i: number) => (
              <View key={a?.id ?? i} className="mb-2 flex-row">
                {a?.time ? (
                  <Text className="w-12 text-xs font-semibold text-primary-700">{a.time}</Text>
                ) : null}
                <View className="flex-1">
                  <Text className="text-sm font-medium text-ink">{a?.title}</Text>
                  {a?.description ? (
                    <Text className="text-xs leading-4 text-ink-muted">{a.description}</Text>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        ) : day?.description ? (
          <Text className="mt-2 text-sm leading-5 text-ink-muted">{day.description}</Text>
        ) : null}
      </Card>
    </View>
  )
}

function ReviewCard({ review }: { review: TourReview }) {
  const date = review.created_at
    ? new Date(review.created_at).toLocaleDateString('en-PK', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : ''
  return (
    <Card className="mb-3 p-4">
      <View className="flex-row items-center justify-between">
        <Stars rating={review.rating} />
        <Text className="text-xs text-ink-soft">{date}</Text>
      </View>
      {review.title ? <Text className="mt-2 text-sm font-bold text-ink">{review.title}</Text> : null}
      {review.body ? (
        <Text className="mt-1 text-sm leading-5 text-ink-muted">{review.body}</Text>
      ) : null}
      {review.reply ? (
        <View className="mt-3 rounded-2xl bg-surface-sunken p-3">
          <Text className="text-xs font-semibold text-primary-700">Operator replied</Text>
          <Text className="mt-1 text-sm leading-5 text-ink-muted">{review.reply.body}</Text>
        </View>
      ) : null}
    </Card>
  )
}

export default function TourDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user } = useAuth()
  const theme = useRoleTheme()
  const c = useThemeColors()
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const [activeImageIndex, setActiveImageIndex] = useState(0)

  const { data: tour, isLoading, error } = useQuery({
    queryKey: ['tour', id],
    queryFn: () => fetchTour(id),
    enabled: !!id,
    staleTime: 3 * 60 * 1000,
  })

  const { data: operatorProfile } = useQuery({
    queryKey: ['operator', 'summary', tour?.operator_id ?? 'none'],
    queryFn: () => fetchOperatorProfileById(tour!.operator_id),
    enabled: Boolean(tour?.operator_id),
    staleTime: 5 * 60 * 1000,
  })

  const { data: reviews } = useQuery({
    queryKey: ['tour', 'reviews', tour?.id ?? 'none'],
    queryFn: () => fetchTourReviews(tour!.id),
    enabled: Boolean(tour?.id),
    staleTime: 5 * 60 * 1000,
  })

  const { data: pickups } = useQuery({
    queryKey: ['tour', 'pickups', tour?.id ?? 'none'],
    queryFn: () => fetchTourPickups(tour!.id),
    enabled: Boolean(tour?.id),
    staleTime: 5 * 60 * 1000,
  })

  if (isLoading) {
    return (
      <View className="flex-1 bg-surface-page">
        <Stack.Screen options={{ headerShown: false }} />
        <Skeleton height={320} radius={0} />
        <View className="gap-3 p-5">
          <Skeleton height={26} width="80%" />
          <Skeleton height={14} width="50%" />
          <Skeleton height={14} width="95%" />
          <Skeleton height={14} width="88%" />
        </View>
      </View>
    )
  }

  if (error || !tour) {
    return (
      <View className="flex-1 items-center justify-center bg-surface-page px-6">
        <Stack.Screen options={{ headerShown: false }} />
        <Text className="text-lg font-bold text-ink">Tour not found</Text>
        <Pressable className="mt-4" onPress={() => router.back()}>
          <Text className="font-semibold text-primary-700">Go back</Text>
        </Pressable>
      </View>
    )
  }

  const locObj = tour.location ?? {}
  const destinationCities: string[] = Array.isArray(tour.destination_cities)
    ? tour.destination_cities.filter(Boolean)
    : []
  const locationStr =
    destinationCities.length > 1
      ? destinationCities.join(' · ')
      : [locObj.city, locObj.country].filter(Boolean).join(', ')
  const price = Number(tour.price)
  const rating = Number(tour.rating)
  const tourImages: string[] =
    Array.isArray(tour.images) && tour.images.length > 0 ? tour.images : [FALLBACK_IMAGE]
  const operatorName =
    operatorProfile?.business_name ?? operatorProfile?.company_name ?? 'TripAvail Operator'

  const included: Feature[] =
    Array.isArray(tour.included_features) && tour.included_features.length
      ? tour.included_features
      : (Array.isArray(tour.inclusions) ? tour.inclusions : []).map((l: string) => ({ label: l }))
  const excluded: Feature[] =
    Array.isArray(tour.excluded_features) && tour.excluded_features.length
      ? tour.excluded_features
      : (Array.isArray(tour.exclusions) ? tour.exclusions : []).map((l: string) => ({ label: l }))
  const itinerary: any[] = Array.isArray(tour.itinerary) ? tour.itinerary : []
  const languages: string[] = Array.isArray(tour.languages) ? tour.languages : []
  const highlights: string[] = Array.isArray(tour.highlights) ? tour.highlights.filter(Boolean) : []
  const requirements: string[] = Array.isArray(tour.requirements) ? tour.requirements.filter(Boolean) : []
  const pricingTiers: any[] = Array.isArray(tour.pricing_tiers) ? tour.pricing_tiers : []
  const isVerified = Boolean(tour.is_verified ?? tour.operator_is_verified)

  // Deposit / payment terms
  const depositRequired = Boolean(tour.deposit_required ?? tour.require_deposit)
  const depositPct = Number(tour.deposit_percentage) || 0
  const payToday = depositRequired && depositPct > 0 ? Math.round((price * depositPct) / 100) : price
  const payLater = Math.max(0, price - payToday)

  const cancelKey = String(tour.cancellation_policy_type ?? tour.cancellation_policy ?? '').toLowerCase()
  const cancelMeta = CANCELLATION_META[cancelKey] ?? null

  const handleBook = () => {
    if (!user) {
      router.push('/(auth)/login')
      return
    }
    router.push({ pathname: '/checkout/[tourId]', params: { tourId: String(tour.id) } })
  }

  return (
    <View className="flex-1 bg-surface-page">
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Immersive image gallery */}
        <View>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => {
              const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width)
              setActiveImageIndex(nextIndex)
            }}
          >
            {tourImages.map((image) => (
              <Image key={image} source={{ uri: image }} style={{ width, height: 320 }} resizeMode="cover" />
            ))}
          </ScrollView>

          <LinearGradient
            colors={['rgba(0,0,0,0.35)', 'transparent']}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, height: insets.top + 64 }}
            pointerEvents="none"
          />

          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            style={{ top: insets.top + 8 }}
            className="absolute left-4 h-10 w-10 items-center justify-center rounded-full bg-black/40"
          >
            <ChevronLeft size={22} color="#ffffff" />
          </Pressable>

          <View style={{ top: insets.top + 8 }} className="absolute right-4">
            <WishlistHeart tourId={tour.id} size={20} />
          </View>

          {tourImages.length > 1 ? (
            <View
              style={{ top: insets.top + 8 }}
              className="absolute right-16 rounded-full bg-black/45 px-3 py-1.5"
            >
              <Text className="text-xs font-semibold text-white">
                {activeImageIndex + 1} / {tourImages.length}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Content card overlapping the gallery */}
        <View className="-mt-6 rounded-t-3xl bg-surface-page px-5 pt-5">
          {tourImages.length > 1 ? (
            <View className="mb-4 flex-row items-center justify-center gap-2">
              {tourImages.map((image, index) => (
                <View
                  key={`${image}-${index}`}
                  className={`h-2 rounded-full ${
                    index === activeImageIndex ? 'w-6 bg-primary-700' : 'w-2 bg-line'
                  }`}
                />
              ))}
            </View>
          ) : null}

          <Text className="text-2xl font-black leading-tight text-ink">{tour.title}</Text>

          {tour.short_description ? (
            <Text className="mt-1.5 text-sm italic leading-5 text-ink-muted">{tour.short_description}</Text>
          ) : null}

          {locationStr ? (
            <View className="mt-1.5 flex-row items-center">
              <MapPin size={15} color="#64748b" />
              <Text className="ml-1 flex-1 text-sm text-ink-muted" numberOfLines={2}>
                {locationStr}
              </Text>
            </View>
          ) : null}

          {/* Rating + price */}
          <View className="mt-4 flex-row items-center justify-between">
            {rating > 0 ? (
              <View className="flex-row items-center">
                <Star size={16} color="#f59e0b" fill="#f59e0b" />
                <Text className="ml-1 font-bold text-ink">{rating.toFixed(1)}</Text>
                <Text className="ml-1 text-xs text-ink-soft">/ 5</Text>
              </View>
            ) : (
              <View />
            )}
            <View className="items-end">
              <Text className="text-2xl font-black text-primary-700">
                {tour.currency} {price.toLocaleString()}
              </Text>
              <Text className="text-xs text-ink-soft">per person</Text>
            </View>
          </View>

          {/* Quick facts */}
          <View className="mt-4 flex-row flex-wrap gap-2">
            {tour.duration_days ? (
              <Badge
                label={`${tour.duration_days} day${tour.duration_days !== 1 ? 's' : ''}`}
                tone="primary"
              />
            ) : null}
            {tour.tour_type ? <Badge label={tour.tour_type} tone="neutral" /> : null}
            {tour.difficulty_level ? <Badge label={tour.difficulty_level} tone="neutral" /> : null}
            {languages.length ? (
              <Badge label={languages.map((l) => String(l).toUpperCase()).join(', ')} tone="neutral" />
            ) : null}
            {tour.min_age ? (
              <Badge
                label={`Age ${tour.min_age}${tour.max_age ? `–${tour.max_age}` : '+'}`}
                tone="neutral"
              />
            ) : null}
          </View>

          {/* About */}
          {tour.description ? (
            <View>
              <SectionTitle>About this tour</SectionTitle>
              <Text className="text-sm leading-6 text-ink-muted">{tour.description}</Text>
            </View>
          ) : null}

          {/* Experience highlights */}
          {highlights.length ? (
            <View>
              <SectionTitle>Experience highlights</SectionTitle>
              {highlights.map((h, i) => (
                <View key={`hl-${i}`} className="mb-2.5 flex-row items-center">
                  <View className="h-8 w-8 items-center justify-center rounded-full bg-primary-50">
                    <Sparkles size={15} color={theme.primary} />
                  </View>
                  <Text className="ml-3 flex-1 text-sm text-ink">{h}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {/* What's included */}
          {included.length ? (
            <View>
              <SectionTitle>What's included</SectionTitle>
              {included.map((f, i) => (
                <FeatureRow key={`inc-${i}`} feature={f} />
              ))}
            </View>
          ) : null}

          {/* Not included */}
          {excluded.length ? (
            <View>
              <SectionTitle>Not included</SectionTitle>
              {excluded.map((f, i) => (
                <FeatureRow key={`exc-${i}`} feature={f} muted />
              ))}
            </View>
          ) : null}

          {/* Itinerary */}
          {itinerary.length ? (
            <View>
              <SectionTitle>Itinerary</SectionTitle>
              {itinerary.map((d, i) => (
                <ItineraryDay key={`day-${i}`} day={d} />
              ))}
            </View>
          ) : null}

          {/* Pickup points */}
          {pickups && pickups.length ? (
            <View>
              <SectionTitle>Pickup points</SectionTitle>
              {pickups.map((p) => {
                const hasCoords = p.latitude != null && p.longitude != null
                return (
                  <Card key={p.id} className="mb-2.5 p-4">
                    <View className="flex-row items-start">
                      <View className="h-8 w-8 items-center justify-center rounded-full bg-primary-50">
                        <MapPin size={16} color={theme.primary} />
                      </View>
                      <View className="ml-3 flex-1">
                        <View className="flex-row items-center gap-2">
                          <Text className="flex-1 font-bold text-ink" numberOfLines={1}>
                            {p.title || p.city || 'Pickup point'}
                          </Text>
                          {p.is_primary ? <Badge label="Primary" tone="primary" /> : null}
                        </View>
                        {p.formatted_address ? (
                          <Text className="mt-0.5 text-xs leading-5 text-ink-muted">{p.formatted_address}</Text>
                        ) : null}
                        <View className="mt-1.5 flex-row items-center gap-4">
                          {p.pickup_time ? (
                            <View className="flex-row items-center">
                              <Clock size={12} color={c.inkSoft} />
                              <Text className="ml-1 text-xs text-ink-soft">{p.pickup_time}</Text>
                            </View>
                          ) : null}
                          {hasCoords ? (
                            <Pressable
                              className="flex-row items-center"
                              onPress={() =>
                                Linking.openURL(
                                  `https://www.google.com/maps/dir/?api=1&destination=${p.latitude},${p.longitude}`,
                                )
                              }
                            >
                              <Navigation size={12} color={theme.primary} />
                              <Text className="ml-1 text-xs font-semibold text-primary-700">Directions</Text>
                            </Pressable>
                          ) : null}
                        </View>
                        {p.notes ? (
                          <Text className="mt-1.5 text-xs leading-5 text-ink-soft">{p.notes}</Text>
                        ) : null}
                      </View>
                    </View>
                  </Card>
                )
              })}
            </View>
          ) : null}

          {/* Before you go — requirements + languages */}
          {requirements.length || languages.length ? (
            <View>
              <SectionTitle>Before you go</SectionTitle>
              {languages.length ? (
                <View className="mb-3">
                  <Text className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-soft">Languages</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {languages.map((l) => (
                      <View key={l} className="rounded-full border border-line bg-surface px-3 py-1.5">
                        <Text className="text-xs font-medium text-ink">{String(l)}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}
              {requirements.length ? (
                <>
                  <Text className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-soft">Requirements</Text>
                  {requirements.map((r, i) => (
                    <View key={`req-${i}`} className="mb-2 flex-row items-start">
                      <Check size={15} color={theme.primary} style={{ marginTop: 2 }} />
                      <Text className="ml-2 flex-1 text-sm text-ink">{r}</Text>
                    </View>
                  ))}
                </>
              ) : null}
            </View>
          ) : null}

          {/* Group pricing tiers */}
          {pricingTiers.length ? (
            <View>
              <SectionTitle>Group pricing</SectionTitle>
              {pricingTiers.map((t: any, i: number) => {
                const tierPrice = Number(t?.pricePerPerson ?? t?.price_per_person ?? t?.price) || 0
                const minPeople = Number(t?.minPeople ?? t?.min_people ?? t?.minPax) || 0
                const maxPeople = Number(t?.maxPeople ?? t?.max_people ?? t?.maxPax) || 0
                const savings = price > 0 && tierPrice > 0 ? Math.max(0, price - tierPrice) : 0
                const label =
                  t?.name ??
                  (minPeople && maxPeople ? `${minPeople}–${maxPeople} people` : minPeople ? `${minPeople}+ people` : 'Group')
                return (
                  <Card key={`tier-${i}`} className="mb-2 flex-row items-center justify-between p-4">
                    <View className="flex-1">
                      <Text className="font-bold text-ink">{label}</Text>
                      {savings > 0 ? (
                        <Text className="mt-0.5 text-xs font-semibold text-success">
                          Save {tour.currency} {savings.toLocaleString()} / person
                        </Text>
                      ) : null}
                    </View>
                    <Text className="text-base font-black text-primary-700">
                      {tour.currency} {tierPrice.toLocaleString()}
                      <Text className="text-xs font-normal text-ink-soft"> /person</Text>
                    </Text>
                  </Card>
                )
              })}
            </View>
          ) : null}

          {/* Payment terms */}
          {depositRequired && payToday < price ? (
            <View>
              <SectionTitle>Payment terms</SectionTitle>
              <Card flat className="bg-surface-sunken p-4">
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm text-ink-muted">Pay today ({depositPct}% deposit)</Text>
                  <Text className="text-sm font-bold text-ink">
                    {tour.currency} {payToday.toLocaleString()}
                  </Text>
                </View>
                <View className="mt-2 flex-row items-center justify-between">
                  <Text className="text-sm text-ink-muted">Pay to operator before departure</Text>
                  <Text className="text-sm font-bold text-ink">
                    {tour.currency} {payLater.toLocaleString()}
                  </Text>
                </View>
              </Card>
            </View>
          ) : null}

          {/* Cancellation policy */}
          {cancelMeta ? (
            <View>
              <SectionTitle>Cancellation</SectionTitle>
              <Card flat className="bg-surface-sunken p-4">
                <View className="flex-row items-center">
                  <ShieldCheck size={16} color={theme.primary} />
                  <Text className="ml-2 font-bold text-ink">{cancelMeta.title}</Text>
                </View>
                <Text className="mt-1.5 text-sm leading-5 text-ink-muted">{cancelMeta.body}</Text>
              </Card>
            </View>
          ) : null}

          {/* Operator card */}
          {operatorProfile?.slug ? (
            <Pressable
              className="mt-7"
              onPress={() =>
                router.push({
                  pathname: '/operators/[slug]',
                  params: { slug: operatorProfile.slug! },
                })
              }
            >
              <Card className="p-4">
                <View className="flex-row items-center">
                  <Avatar uri={operatorProfile.company_logo_url} name={operatorName} size={52} />
                  <View className="ml-4 flex-1">
                    <Text className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Hosted by</Text>
                    <View className="mt-0.5 flex-row items-center gap-1.5">
                      <Text className="text-base font-bold text-ink" numberOfLines={1}>
                        {operatorName}
                      </Text>
                      {isVerified ? <ShieldCheck size={15} color={theme.primary} /> : null}
                    </View>
                    <View className="mt-0.5 flex-row flex-wrap items-center gap-x-3">
                      {isVerified ? (
                        <Text className="text-xs font-semibold text-primary-700">Verified operator</Text>
                      ) : null}
                      {operatorProfile.years_experience ? (
                        <Text className="text-xs text-ink-soft">{operatorProfile.years_experience} yrs experience</Text>
                      ) : null}
                      {tour.max_participants ? (
                        <View className="flex-row items-center">
                          <Users size={11} color={c.inkSoft} />
                          <Text className="ml-1 text-xs text-ink-soft">Up to {tour.max_participants}</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                  <ChevronRight size={20} color="#94a3b8" />
                </View>
                {operatorProfile.description ? (
                  <Text className="mt-3 text-sm leading-5 text-ink-muted" numberOfLines={3}>
                    {operatorProfile.description}
                  </Text>
                ) : null}
                <Text className="mt-2 text-sm font-semibold text-primary-700">View operator profile</Text>
              </Card>
            </Pressable>
          ) : null}

          {/* Reviews */}
          {reviews && reviews.length ? (
            <View>
              <View className="mb-3 mt-7 flex-row items-center justify-between">
                <Text className="text-lg font-bold text-ink">Reviews</Text>
                <View className="flex-row items-center">
                  <Star size={15} color="#f59e0b" fill="#f59e0b" />
                  <Text className="ml-1 text-sm font-bold text-ink">
                    {rating > 0 ? rating.toFixed(1) : '—'}
                  </Text>
                  <Text className="ml-1 text-xs text-ink-soft">({reviews.length})</Text>
                </View>
              </View>
              {reviews.map((r) => (
                <ReviewCard key={r.id} review={r} />
              ))}
            </View>
          ) : null}
        </View>

        <View className="h-28" />
      </ScrollView>

      {/* Sticky book bar */}
      <View
        className="absolute bottom-0 left-0 right-0 border-t border-line bg-surface px-5 pt-3"
        style={{ paddingBottom: insets.bottom + 12 }}
      >
        <Button label={`Book Now · ${tour.currency} ${price.toLocaleString()}`} onPress={handleBook} gradient />
      </View>
    </View>
  )
}
