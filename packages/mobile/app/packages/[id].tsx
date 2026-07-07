import { useQuery } from '@tanstack/react-query'
import { router, useLocalSearchParams, type Href } from 'expo-router'
import { useState } from 'react'
import { Alert, Image, Modal, Pressable, ScrollView, Text, View } from 'react-native'
import { useStripe } from '@stripe/stripe-react-native'

import { Bed, Check, Clock, Gift, MapPin, Minus, Percent, Plus, Sparkles, Star, Users, X } from '@/components/icons/lucide'
import { AppHeader, Badge, Button, Card, EmptyState, Screen, Skeleton } from '@/components/ui'
import { GlassPanel } from '@/components/ui/Glass'
import { useAuth } from '@/hooks/useAuth'
import { useRoleTheme, useThemeColors } from '@/theme'
import { fetchPackageDetail, type PackageRoom } from '@/lib/packageDiscovery'
import { PROPERTY_TYPES, resolveAmenity, resolveRoomType } from '@/lib/hotelOptions'
import { resolvePackageType } from '@/lib/packageOptions'
import { createPackageBookingHold, createPaymentIntent, verifyPayment } from '@/lib/payments'

function bedsLabel(beds: PackageRoom['beds']): string {
  if (!beds.length) return ''
  return beds
    .map((b) => `${b.quantity} ${b.type}${b.quantity > 1 ? 's' : ''}`.trim())
    .join(', ')
}

function propertyTypeLabel(id: string | null): string | null {
  if (!id) return null
  return PROPERTY_TYPES.find((t) => t.id === id)?.name ?? id.replace(/\b\w/g, (c) => c.toUpperCase())
}

function addDays(base: Date, days: number): Date {
  const d = new Date(base)
  d.setDate(d.getDate() + days)
  return d
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function prettyDate(d: Date): string {
  return d.toLocaleDateString('en-PK', { weekday: 'short', day: 'numeric', month: 'short' })
}

const FALLBACK = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=1080'

function SectionTitle({ children }: { children: string }) {
  return <Text className="mb-3 mt-7 text-lg font-bold text-ink">{children}</Text>
}

function FeatureLine({ label, excluded }: { label: string; excluded?: boolean }) {
  const theme = useRoleTheme()
  return (
    <View className="mb-2.5 flex-row items-center">
      <View className={`h-7 w-7 items-center justify-center rounded-full ${excluded ? 'bg-surface-sunken' : 'bg-primary-50'}`}>
        {excluded ? <X size={14} color="#94a3b8" /> : <Check size={14} color={theme.primary} />}
      </View>
      <Text className={`ml-3 flex-1 text-sm ${excluded ? 'text-ink-soft' : 'text-ink'}`}>{label}</Text>
    </View>
  )
}

export default function PackageDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>()
  const { data: pkg, isLoading, error } = useQuery({
    queryKey: ['package', id],
    queryFn: () => fetchPackageDetail(id!),
    enabled: !!id,
  })
  const theme = useRoleTheme()
  const c = useThemeColors()
  const { user } = useAuth()
  const { initPaymentSheet, presentPaymentSheet } = useStripe()

  const [sheetOpen, setSheetOpen] = useState(false)
  const [checkInOffset, setCheckInOffset] = useState(1) // days from today
  const [nights, setNights] = useState(1)
  const [guests, setGuests] = useState(2)
  const [paying, setPaying] = useState(false)

  if (isLoading) {
    return (
      <Screen>
        <AppHeader showBack title="" />
        <View className="px-5">
          <Skeleton height={220} radius={24} />
          <View className="mt-4 gap-2">
            <Skeleton height={26} width="70%" radius={8} />
            <Skeleton height={16} width="50%" radius={8} />
          </View>
        </View>
      </Screen>
    )
  }

  if (error || !pkg) {
    return (
      <Screen>
        <AppHeader showBack title="" />
        <EmptyState icon="business-outline" title="Package unavailable" description="This package is not available right now.">
          <Button label="Go back" onPress={() => router.back()} />
        </EmptyState>
      </Screen>
    )
  }

  const locationLabel = pkg.hotel
    ? [pkg.hotel.city, pkg.hotel.country].filter(Boolean).join(', ')
    : ''

  const minNights = Math.max(1, Number(pkg.minimumNights ?? 1))
  const maxNights = Math.max(minNights, Number(pkg.maximumNights ?? 30))
  const maxGuests = Math.max(1, Number(pkg.maxGuests ?? 4))
  const checkIn = addDays(new Date(), checkInOffset)
  const checkOut = addDays(checkIn, Math.max(nights, minNights))
  const estTotal = pkg.pricePerNight != null ? pkg.pricePerNight * Math.max(nights, minNights) : null

  const reserve = () => {
    if (!user) {
      router.push('/(auth)/login' as Href)
      return
    }
    setNights(minNights)
    setGuests(Math.min(2, maxGuests))
    setSheetOpen(true)
  }

  const confirmAndPay = async () => {
    if (!user) return
    setPaying(true)
    try {
      // 1. Atomic 10-minute hold via the same RPC the web uses
      const hold = await createPackageBookingHold({
        packageId: pkg.id,
        travelerId: user.id,
        checkInDate: isoDate(checkIn),
        checkOutDate: isoDate(checkOut),
        guestCount: guests,
      })

      // 2. PaymentIntent → 3. native PaymentSheet
      const intent = await createPaymentIntent(hold.id, 'package')
      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: intent.clientSecret,
        merchantDisplayName: 'TripAvail',
        defaultBillingDetails: { email: user.email ?? undefined },
      })
      if (initError) throw new Error(initError.message)
      const { error: payError } = await presentPaymentSheet()
      if (payError) {
        if (payError.code === 'Canceled') return
        throw new Error(payError.message)
      }

      // 4. Server-side verification finalizes the stay
      await verifyPayment(hold.id, intent.paymentIntentId, 'package')

      setSheetOpen(false)
      Alert.alert('Stay booked 🎉', `${pkg.name} — check-in ${prettyDate(checkIn)}.`, [
        { text: 'View my trips', onPress: () => router.replace('/(tabs)/trips' as Href) },
      ])
    } catch (e: any) {
      Alert.alert('Could not complete booking', e?.message ?? 'Please try again.')
    } finally {
      setPaying(false)
    }
  }

  return (
    <Screen edges={['top']}>
      <AppHeader showBack title="" />
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <View className="px-5">
          <Image source={{ uri: pkg.images[0] ?? FALLBACK }} style={{ height: 220 }} className="w-full rounded-3xl" resizeMode="cover" />
        </View>

        <View className="px-5">
          {(() => {
            const pt = resolvePackageType(pkg.packageType)
            return (
              <>
                <View className="mt-4 flex-row flex-wrap items-center gap-2">
                  {pkg.packageType ? <Badge label={pt.name} tone="primary" /> : null}
                  {propertyTypeLabel(pkg.hotel?.propertyType ?? null) ? (
                    <Badge label={propertyTypeLabel(pkg.hotel?.propertyType ?? null)!} tone="neutral" />
                  ) : null}
                  {pkg.minimumNights ? <Badge label={`${pkg.minimumNights}+ nights`} tone="neutral" /> : null}
                </View>
                <Text className="mt-2 text-2xl font-black text-ink">{pkg.name}</Text>
                {pkg.packageType ? (
                  <View className="mt-1.5 flex-row items-center">
                    <pt.Icon size={14} color={theme.primary} />
                    <Text className="ml-1.5 text-sm font-medium text-primary-700">{pt.tagline}</Text>
                    <Text className="text-sm text-ink-soft"> · {pt.description}</Text>
                  </View>
                ) : null}
              </>
            )
          })()}

          <View className="mt-1.5 flex-row items-center">
            <MapPin size={14} color="#94a3b8" />
            <Text className="ml-1 flex-1 text-sm text-ink-muted" numberOfLines={1}>
              {pkg.hotel?.name ?? 'Partner hotel'}
              {locationLabel ? ` · ${locationLabel}` : ''}
            </Text>
            {pkg.hotel?.rating && pkg.hotel.rating > 0 ? (
              <View className="flex-row items-center">
                <Star size={14} color="#f59e0b" fill="#f59e0b" />
                <Text className="ml-1 text-sm font-semibold text-ink">{pkg.hotel.rating.toFixed(1)}</Text>
              </View>
            ) : null}
          </View>

          {pkg.hotel?.starRating && pkg.hotel.starRating > 0 ? (
            <View className="mt-1.5 flex-row items-center">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={13}
                  color={i < pkg.hotel!.starRating! ? '#f59e0b' : '#cbd5e1'}
                  fill={i < pkg.hotel!.starRating! ? '#f59e0b' : 'transparent'}
                />
              ))}
              <Text className="ml-1.5 text-xs font-medium text-ink-soft">{pkg.hotel.starRating}-star property</Text>
            </View>
          ) : null}

          <View className="mt-4 flex-row gap-3">
            <Card flat className="flex-1 bg-surface-sunken p-3">
              <Text className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Stay</Text>
              <Text className="mt-1 text-sm font-bold text-ink">
                {pkg.minimumNights ?? 1}–{pkg.maximumNights ?? '∞'} nights
              </Text>
            </Card>
            <Card flat className="flex-1 bg-surface-sunken p-3">
              <View className="flex-row items-center gap-1">
                <Users size={12} color="#64748b" />
                <Text className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Guests</Text>
              </View>
              <Text className="mt-1 text-sm font-bold text-ink">Up to {pkg.maxGuests ?? 2}</Text>
            </Card>
          </View>

          {pkg.description ? (
            <>
              <SectionTitle>About this package</SectionTitle>
              <Text className="text-sm leading-6 text-ink-muted">{pkg.description}</Text>
            </>
          ) : null}

          {/* Accommodation — room types in this package */}
          {pkg.rooms.length > 0 ? (
            <>
              <SectionTitle>Accommodation</SectionTitle>
              {pkg.rooms.map((room) => {
                const rt = resolveRoomType(room.roomType)
                const beds = bedsLabel(room.beds)
                return (
                  <Card key={room.id} className="mb-2.5 p-4">
                    <View className="flex-row items-start">
                      <Text className="text-2xl">{rt.emoji}</Text>
                      <View className="ml-3 flex-1">
                        <View className="flex-row items-center gap-2">
                          <Text className="flex-1 font-bold text-ink" numberOfLines={1}>
                            {room.name}
                          </Text>
                          <Badge label={rt.label} tone="primary" />
                        </View>
                        {room.description ? (
                          <Text className="mt-1 text-xs leading-5 text-ink-muted" numberOfLines={3}>
                            {room.description}
                          </Text>
                        ) : null}
                        <View className="mt-2 flex-row flex-wrap items-center gap-x-4 gap-y-1">
                          {beds ? (
                            <View className="flex-row items-center">
                              <Bed size={13} color={c.inkSoft} />
                              <Text className="ml-1 text-xs text-ink-soft">{beds}</Text>
                            </View>
                          ) : null}
                          {room.capacityAdults ? (
                            <View className="flex-row items-center">
                              <Users size={13} color={c.inkSoft} />
                              <Text className="ml-1 text-xs text-ink-soft">
                                Sleeps {room.capacityAdults}
                                {room.capacityChildren ? ` + ${room.capacityChildren} child` : ''}
                              </Text>
                            </View>
                          ) : null}
                          {room.sizeSqm ? (
                            <Text className="text-xs text-ink-soft">{room.sizeSqm} m²</Text>
                          ) : null}
                        </View>
                        {room.amenities.length > 0 ? (
                          <View className="mt-2 flex-row flex-wrap gap-1.5">
                            {room.amenities.slice(0, 6).map((a) => (
                              <View key={a} className="rounded-full bg-surface-sunken px-2 py-0.5">
                                <Text className="text-[11px] text-ink-muted">{resolveAmenity(a).label}</Text>
                              </View>
                            ))}
                          </View>
                        ) : null}
                      </View>
                    </View>
                  </Card>
                )
              })}
            </>
          ) : null}

          {/* Amenities & experience — hotel + room amenities + highlights, de-duplicated */}
          {pkg.aggregatedAmenities.length > 0 ? (
            <>
              <SectionTitle>Amenities & experience</SectionTitle>
              <View className="flex-row flex-wrap">
                {pkg.aggregatedAmenities.slice(0, 18).map((a) => {
                  const { label, Icon } = resolveAmenity(a)
                  return (
                    <View key={a} style={{ width: '50%' }} className="mb-2.5 flex-row items-center pr-3">
                      <View className="h-7 w-7 items-center justify-center rounded-full bg-primary-50">
                        <Icon size={14} color={theme.primary} />
                      </View>
                      <Text className="ml-2 flex-1 text-sm text-ink" numberOfLines={1}>
                        {label}
                      </Text>
                    </View>
                  )
                })}
              </View>
            </>
          ) : null}

          {/* Complimentary perks — promoted to its own accented section like web */}
          {pkg.freeInclusions.length > 0 ? (
            <>
              <SectionTitle>Included perks</SectionTitle>
              <Card flat className="bg-primary-50 p-4">
                {pkg.freeInclusions.map((f, i) => (
                  <View key={`fi-${i}`} className={`flex-row items-center ${i === 0 ? '' : 'mt-2.5'}`}>
                    <Gift size={16} color={theme.primary} />
                    <Text className="ml-2.5 flex-1 text-sm font-medium text-ink">{f.name}</Text>
                  </View>
                ))}
              </Card>
            </>
          ) : null}

          {pkg.highlights.length > 0 ? (
            <>
              <SectionTitle>Highlights</SectionTitle>
              {pkg.highlights.map((h, i) => (
                <FeatureLine key={`h-${i}`} label={h} />
              ))}
            </>
          ) : null}

          {pkg.inclusions.length > 0 ? (
            <>
              <SectionTitle>What's included</SectionTitle>
              {pkg.inclusions.map((inc, i) => (
                <FeatureLine key={`i-${i}`} label={inc} />
              ))}
            </>
          ) : null}

          {pkg.exclusions.length > 0 ? (
            <>
              <SectionTitle>Not included</SectionTitle>
              {pkg.exclusions.map((ex, i) => (
                <FeatureLine key={`e-${i}`} label={ex} excluded />
              ))}
            </>
          ) : null}

          {pkg.discountOffers.length > 0 ? (
            <>
              <SectionTitle>Add-ons & savings</SectionTitle>
              {pkg.discountOffers.map((o, i) => {
                const discounted = Math.round(o.originalPrice * (1 - o.discount / 100))
                return (
                  <View key={`do-${i}`} className="mb-2.5 flex-row items-center">
                    <View className="h-9 w-9 items-center justify-center rounded-full bg-primary-50">
                      <Percent size={16} color={theme.primary} />
                    </View>
                    <View className="ml-3 flex-1">
                      <Text className="text-sm font-semibold text-ink" numberOfLines={1}>{o.name}</Text>
                      {o.originalPrice > 0 ? (
                        <Text className="text-xs text-ink-soft">
                          <Text className="line-through">{pkg.currency} {o.originalPrice.toLocaleString()}</Text>
                          {`  →  ${pkg.currency} ${discounted.toLocaleString()}${o.discount > 0 ? `  ·  ${o.discount}% off` : ''}`}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                )
              })}
            </>
          ) : null}

          {/* Hotel services */}
          {pkg.hotel?.services && pkg.hotel.services.length > 0 ? (
            <>
              <SectionTitle>Hotel services</SectionTitle>
              <View className="flex-row flex-wrap gap-2">
                {pkg.hotel.services.map((s) => (
                  <View key={s} className="flex-row items-center rounded-full border border-line bg-surface px-3 py-1.5">
                    <Sparkles size={12} color={theme.primary} />
                    <Text className="ml-1.5 text-xs font-medium text-ink">{s}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : null}

          {/* Good to know — hotel check-in/out + house rules */}
          {pkg.hotel && (pkg.hotel.checkIn || pkg.hotel.checkOut || pkg.hotel.houseRules) ? (
            <>
              <SectionTitle>Good to know</SectionTitle>
              <Card flat className="bg-surface-sunken p-4">
                {pkg.hotel.checkIn || pkg.hotel.checkOut ? (
                  <View className="flex-row items-center">
                    <Clock size={15} color={c.inkMuted} />
                    <Text className="ml-2 text-sm text-ink">
                      {pkg.hotel.checkIn ? `Check-in ${pkg.hotel.checkIn}` : ''}
                      {pkg.hotel.checkIn && pkg.hotel.checkOut ? '  ·  ' : ''}
                      {pkg.hotel.checkOut ? `Check-out ${pkg.hotel.checkOut}` : ''}
                    </Text>
                  </View>
                ) : null}
                {pkg.hotel.houseRules ? (
                  <Text className={`text-xs leading-5 text-ink-muted ${pkg.hotel.checkIn || pkg.hotel.checkOut ? 'mt-2' : ''}`}>
                    {pkg.hotel.houseRules}
                  </Text>
                ) : null}
              </Card>
            </>
          ) : null}

          {pkg.cancellationPolicy ? (
            <>
              <SectionTitle>Cancellation</SectionTitle>
              <Text className="text-sm leading-6 text-ink-muted">{pkg.cancellationPolicy}</Text>
            </>
          ) : null}

          {pkg.paymentTerms ? (
            <>
              <SectionTitle>Payment terms</SectionTitle>
              <Text className="text-sm leading-6 text-ink-muted">{pkg.paymentTerms}</Text>
            </>
          ) : null}
        </View>
      </ScrollView>

      {/* Sticky reserve bar */}
      <View className="flex-row items-center justify-between border-t border-line px-5 pb-3 pt-3">
        <View>
          {pkg.pricePerNight != null ? (
            <Text className="text-lg font-black text-ink">
              {pkg.currency} {pkg.pricePerNight.toLocaleString()}
              <Text className="text-xs font-normal text-ink-soft"> /night</Text>
            </Text>
          ) : (
            <Text className="text-base font-bold text-ink-muted">Contact for pricing</Text>
          )}
        </View>
        <View className="w-40">
          <Button label="Reserve" gradient onPress={reserve} />
        </View>
      </View>

      {/* Reserve sheet — dates, nights, guests → hold → PaymentSheet */}
      <Modal visible={sheetOpen} transparent animationType="slide" onRequestClose={() => setSheetOpen(false)}>
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.55)' }}
          onPress={() => !paying && setSheetOpen(false)}
        />
        <View style={{ position: 'absolute', left: 12, right: 12, bottom: 24 }}>
          <GlassPanel radius={28} intensity={55} contentStyle={{ padding: 20 }}>
            <Text className="text-lg font-bold text-ink">Reserve your stay</Text>
            <Text className="mt-0.5 text-xs text-ink-soft" numberOfLines={1}>
              {pkg.name}
            </Text>

            <View className="mt-4 flex-row items-center justify-between">
              <Text className="text-[15px] font-medium text-ink">Check-in</Text>
              <View className="flex-row items-center gap-3">
                <Pressable
                  onPress={() => setCheckInOffset((d) => Math.max(1, d - 1))}
                  className="h-9 w-9 items-center justify-center rounded-full border border-line bg-surface"
                >
                  <Minus size={16} color={c.ink} />
                </Pressable>
                <Text className="min-w-[112px] text-center text-sm font-bold text-ink">
                  {prettyDate(checkIn)}
                </Text>
                <Pressable
                  onPress={() => setCheckInOffset((d) => Math.min(365, d + 1))}
                  className="h-9 w-9 items-center justify-center rounded-full border border-line bg-surface"
                >
                  <Plus size={16} color={c.ink} />
                </Pressable>
              </View>
            </View>

            <View className="mt-3 flex-row items-center justify-between">
              <Text className="text-[15px] font-medium text-ink">Nights</Text>
              <View className="flex-row items-center gap-3">
                <Pressable
                  onPress={() => setNights((n) => Math.max(minNights, n - 1))}
                  className="h-9 w-9 items-center justify-center rounded-full border border-line bg-surface"
                >
                  <Minus size={16} color={c.ink} />
                </Pressable>
                <Text className="min-w-[44px] text-center text-base font-bold text-ink">
                  {Math.max(nights, minNights)}
                </Text>
                <Pressable
                  onPress={() => setNights((n) => Math.min(maxNights, n + 1))}
                  className="h-9 w-9 items-center justify-center rounded-full border border-line bg-surface"
                >
                  <Plus size={16} color={c.ink} />
                </Pressable>
              </View>
            </View>

            <View className="mt-3 flex-row items-center justify-between">
              <Text className="text-[15px] font-medium text-ink">Guests</Text>
              <View className="flex-row items-center gap-3">
                <Pressable
                  onPress={() => setGuests((g) => Math.max(1, g - 1))}
                  className="h-9 w-9 items-center justify-center rounded-full border border-line bg-surface"
                >
                  <Minus size={16} color={c.ink} />
                </Pressable>
                <Text className="min-w-[44px] text-center text-base font-bold text-ink">{guests}</Text>
                <Pressable
                  onPress={() => setGuests((g) => Math.min(maxGuests, g + 1))}
                  className="h-9 w-9 items-center justify-center rounded-full border border-line bg-surface"
                >
                  <Plus size={16} color={c.ink} />
                </Pressable>
              </View>
            </View>

            <View className="mt-4 flex-row items-center justify-between border-t border-line pt-3">
              <Text className="text-sm text-ink-muted">
                {prettyDate(checkIn)} → {prettyDate(checkOut)}
              </Text>
              {estTotal != null ? (
                <Text className="text-lg font-black text-primary-700">
                  {pkg.currency} {estTotal.toLocaleString()}
                </Text>
              ) : (
                <Text className="text-sm font-semibold text-ink-muted">Priced at checkout</Text>
              )}
            </View>

            <View className="mt-4">
              <Button
                label={paying ? 'Processing…' : 'Confirm & pay'}
                gradient
                loading={paying}
                onPress={confirmAndPay}
              />
            </View>
            <Text className="mt-2 text-center text-[11px] text-ink-soft">
              Secure payment via Stripe · card, Google Pay & Apple Pay
            </Text>
          </GlassPanel>
        </View>
      </Modal>
    </Screen>
  )
}
