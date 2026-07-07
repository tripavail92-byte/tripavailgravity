import { useQuery } from '@tanstack/react-query'
import { router, useLocalSearchParams, type Href } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useStripe } from '@stripe/stripe-react-native'

import { Check, Minus, Plus } from '@/components/icons/lucide'
import { AppHeader, Button, Card, Screen } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { useRoleTheme } from '@/theme'
import {
  fetchTourForCheckout,
  fetchTourSchedules,
  getAvailableSlots,
  inspectPromo,
  type PromoPreview,
} from '@/lib/booking'
import { createPaymentIntent, createTourBookingHold, verifyPayment } from '@/lib/payments'
import { buildPaymentTermsFromTotal, getTourPaymentTerms } from '@/lib/pricing'

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1488085061387-422e29b40080?auto=format&fit=crop&w=400&q=80'

function formatDate(iso: string): string {
  const d = new Date(iso)
  const date = d.toLocaleDateString('en-PK', { weekday: 'short', day: 'numeric', month: 'short' })
  const time = d.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })
  return `${date} · ${time}`
}

function promoStatusMsg(status: string, code: string): string {
  const c = code.trim().toUpperCase()
  switch (status) {
    case 'inactive':
      return `${c} is currently inactive.`
    case 'expired':
      return `${c} has expired.`
    case 'not_started':
      return `${c} is not active yet.`
    case 'inapplicable':
      return `${c} is not valid for this tour.`
    default:
      return `${c} is not a valid code.`
  }
}

export default function CheckoutScreen() {
  const { tourId } = useLocalSearchParams<{ tourId: string }>()
  const { user } = useAuth()
  const theme = useRoleTheme()
  const insets = useSafeAreaInsets()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [guests, setGuests] = useState(1)
  const [promo, setPromo] = useState('')
  const [applied, setApplied] = useState<PromoPreview | null>(null)
  const [promoMsg, setPromoMsg] = useState<string | null>(null)
  const [applying, setApplying] = useState(false)
  const [paying, setPaying] = useState(false)
  const { initPaymentSheet, presentPaymentSheet } = useStripe()

  const { data: tour } = useQuery({
    queryKey: ['checkout', 'tour', tourId],
    queryFn: () => fetchTourForCheckout(tourId),
    enabled: !!tourId,
  })

  const { data: schedules = [] } = useQuery({
    queryKey: ['checkout', 'schedules', tour?.id ?? 'none'],
    queryFn: () => fetchTourSchedules(tour!.id),
    enabled: !!tour?.id,
  })

  useEffect(() => {
    if (!selectedId && schedules.length) setSelectedId(schedules[0].id)
  }, [schedules, selectedId])

  const selected = schedules.find((s) => s.id === selectedId) ?? null

  const { data: slots } = useQuery({
    queryKey: ['checkout', 'slots', selectedId ?? 'none'],
    queryFn: () => getAvailableSlots(selectedId!),
    enabled: !!selectedId,
  })

  if (!tour) {
    return (
      <Screen>
        <AppHeader showBack title="Book" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </Screen>
    )
  }

  const depositRequired = Boolean(tour.deposit_required ?? tour.require_deposit)
  const depositPercentage = Number(tour.deposit_percentage ?? 0)
  const basePrice = Number(selected?.price_override ?? tour.price)
  const seatsLeft = slots ?? (selected ? Math.max(0, selected.capacity - selected.booked_count) : 1)
  const maxGuests = Math.max(1, Math.min(seatsLeft || 1, 20))
  const currency = tour.currency ?? 'PKR'
  const loc = tour.location ?? {}

  const baseTerms = getTourPaymentTerms({
    basePrice,
    guestCount: guests,
    pricingTiers: tour.pricing_tiers,
    depositRequired,
    depositPercentage,
  })
  const terms = applied
    ? buildPaymentTermsFromTotal({
        totalAmount: applied.discountedTotal,
        guestCount: guests,
        depositRequired,
        depositPercentage,
      })
    : baseTerms

  const applyPromo = async () => {
    const code = promo.trim()
    if (!code) return
    setApplying(true)
    try {
      const res = await inspectPromo(tour.id, code, baseTerms.totalAmount)
      if (res.status === 'valid') {
        setApplied(res)
        setPromoMsg(
          `${(res.code ?? code).toUpperCase()} applied — you save ${currency} ${res.appliedDiscount.toLocaleString()}`,
        )
      } else {
        setApplied(null)
        setPromoMsg(promoStatusMsg(res.status, code))
      }
    } catch {
      setApplied(null)
      setPromoMsg('Could not check that code right now.')
    } finally {
      setApplying(false)
    }
  }

  const onContinue = async () => {
    if (!user) {
      router.push('/(auth)/login')
      return
    }
    if (!selectedId || !selected) {
      Alert.alert('Choose a date', 'Pick a departure date first.')
      return
    }
    if (seatsLeft <= 0) {
      Alert.alert('Sold out', 'This date has no seats left — try another.')
      return
    }

    setPaying(true)
    try {
      // 1. 10-minute hold (validated against live capacity, promo re-checked server-side)
      const hold = await createTourBookingHold({
        tourId: tour.id,
        scheduleId: selectedId,
        travelerId: user.id,
        guestCount: guests,
        promoCode: applied?.code ?? undefined,
        tourTitle: tour.title,
        scheduleStart: selected.start_time,
      })

      // 2. PaymentIntent for the upfront amount (full or deposit)
      const intent = await createPaymentIntent(hold.id, 'tour')

      // 3. Native Stripe PaymentSheet (card / Google Pay / Apple Pay)
      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: intent.clientSecret,
        merchantDisplayName: 'TripAvail',
        defaultBillingDetails: { email: user.email ?? undefined },
      })
      if (initError) throw new Error(initError.message)

      const { error: payError } = await presentPaymentSheet()
      if (payError) {
        if (payError.code === 'Canceled') return // traveller backed out — hold simply expires
        throw new Error(payError.message)
      }

      // 4. Server-side verification finalizes the booking
      await verifyPayment(hold.id, intent.paymentIntentId, 'tour')

      Alert.alert(
        'Booking confirmed 🎉',
        hold.remaining_amount > 0
          ? `Deposit paid. The remaining ${currency} ${hold.remaining_amount.toLocaleString()} is due to the operator before departure.`
          : 'Paid in full — see you on the trip!',
        [{ text: 'View my trip', onPress: () => router.replace(`/trips/${hold.id}` as Href) }],
      )
    } catch (e: any) {
      Alert.alert('Could not complete booking', e?.message ?? 'Please try again.')
    } finally {
      setPaying(false)
    }
  }

  return (
    <Screen>
      <AppHeader showBack title="Book this tour" />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 200 }} showsVerticalScrollIndicator={false}>
        {/* Tour summary */}
        <Card className="flex-row items-center p-3">
          <Image
            source={{ uri: tour.images?.[0] ?? FALLBACK_IMAGE }}
            style={{ width: 64, height: 64, borderRadius: 12 }}
          />
          <View className="ml-3 flex-1">
            <Text className="font-bold text-ink" numberOfLines={2}>
              {tour.title}
            </Text>
            <Text className="mt-0.5 text-xs text-ink-soft">
              {[loc.city, loc.country].filter(Boolean).join(', ')}
            </Text>
          </View>
        </Card>

        {/* Date */}
        <Text className="mb-3 mt-6 text-lg font-bold text-ink">Choose a date</Text>
        {schedules.length === 0 ? (
          <Text className="text-sm text-ink-soft">No upcoming departures yet. Check back soon.</Text>
        ) : (
          schedules.map((s) => {
            const active = s.id === selectedId
            const left = Math.max(0, s.capacity - s.booked_count)
            return (
              <Pressable
                key={s.id}
                className="mb-2"
                onPress={() => {
                  setSelectedId(s.id)
                  setApplied(null)
                  setPromoMsg(null)
                }}
              >
                <Card className={`flex-row items-center p-4 ${active ? 'border-primary-700' : ''}`}>
                  <View
                    className={`h-5 w-5 items-center justify-center rounded-full border-2 ${
                      active ? 'border-primary-700 bg-primary-700' : 'border-line'
                    }`}
                  >
                    {active ? <Check size={12} color="#ffffff" /> : null}
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="font-semibold text-ink">{formatDate(s.start_time)}</Text>
                    <Text className="text-xs text-ink-soft">
                      {left > 0 ? `${left} seats left` : 'Sold out'}
                    </Text>
                  </View>
                </Card>
              </Pressable>
            )
          })
        )}

        {/* Guests */}
        <Text className="mb-3 mt-6 text-lg font-bold text-ink">Guests</Text>
        <Card className="flex-row items-center justify-between p-4">
          <View>
            <Text className="font-semibold text-ink">Travellers</Text>
            <Text className="text-xs text-ink-soft">Up to {maxGuests}</Text>
          </View>
          <View className="flex-row items-center gap-4">
            <Pressable
              onPress={() => setGuests((g) => Math.max(1, g - 1))}
              disabled={guests <= 1}
              className={`h-9 w-9 items-center justify-center rounded-full border border-line ${
                guests <= 1 ? 'opacity-40' : ''
              }`}
            >
              <Minus size={16} color="#0f172a" />
            </Pressable>
            <Text className="w-6 text-center text-base font-bold text-ink">{guests}</Text>
            <Pressable
              onPress={() => setGuests((g) => Math.min(maxGuests, g + 1))}
              disabled={guests >= maxGuests}
              className={`h-9 w-9 items-center justify-center rounded-full border border-line ${
                guests >= maxGuests ? 'opacity-40' : ''
              }`}
            >
              <Plus size={16} color="#0f172a" />
            </Pressable>
          </View>
        </Card>

        {/* Promo */}
        <Text className="mb-3 mt-6 text-lg font-bold text-ink">Promo code</Text>
        <View className="flex-row gap-2">
          <TextInput
            value={promo}
            onChangeText={setPromo}
            placeholder="Enter code"
            placeholderTextColor="#94a3b8"
            autoCapitalize="characters"
            className="flex-1 rounded-2xl border border-line bg-surface px-4 py-3 text-ink"
          />
          <Button label={applying ? '…' : 'Apply'} variant="secondary" fullWidth={false} onPress={applyPromo} />
        </View>
        {promoMsg ? (
          <Text className={`mt-2 text-xs ${applied ? 'text-success-fg' : 'text-danger-fg'}`}>{promoMsg}</Text>
        ) : null}
      </ScrollView>

      {/* Sticky summary + CTA */}
      <View
        className="absolute bottom-0 left-0 right-0 border-t border-line bg-surface px-5 pt-3"
        style={{ paddingBottom: insets.bottom + 12 }}
      >
        <View className="mb-1 flex-row items-center justify-between">
          <Text className="text-sm text-ink-muted">
            {guests} × {currency} {baseTerms.effectiveUnitPrice.toLocaleString()}
          </Text>
          <Text className="text-base font-black text-ink">
            {currency} {terms.totalAmount.toLocaleString()}
          </Text>
        </View>
        {terms.paymentCollectionMode === 'partial_online' ? (
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="text-xs text-ink-soft">Pay now ({terms.upfrontPercentage}%)</Text>
            <Text className="text-sm font-bold text-primary-700">
              {currency} {terms.upfrontAmount.toLocaleString()}
            </Text>
          </View>
        ) : null}
        <Button
          label={paying ? 'Processing…' : 'Continue to payment'}
          gradient
          loading={paying}
          onPress={onContinue}
        />
      </View>
    </Screen>
  )
}
