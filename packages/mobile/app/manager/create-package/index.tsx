import { router, useLocalSearchParams, type Href } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Text, View } from 'react-native'
import * as ImagePicker from 'expo-image-picker'

import { Check, Percent, Plus, X } from '@/components/icons/lucide'
import { Chip, Field, SectionLabel, Stepper, WizardProgress } from '@/components/ui/FormKit'
import { AppHeader, Button, Card, Screen } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { useRoleTheme, useThemeColors } from '@/theme'
import { hasPublishedHotel } from '@/lib/managerSetup'
import { PACKAGE_EXCLUSIONS, PACKAGE_INCLUSIONS, PACKAGE_TYPES, SUGGESTED_FREE_INCLUSIONS } from '@/lib/packageOptions'
import { fetchHotelRooms, fetchOwnedPublishedHotels, fetchPackageForEdit, publishPackage, type HotelRoomOption, type PackageData } from '@/lib/packageAuthoring'

const STEP_TITLES = ['Hotel', 'Type', 'Basics', 'Photos', 'Highlights', 'Included', 'Excluded', 'Rooms', 'Stay', 'Policies', 'Review']
const LAST = STEP_TITLES.length - 1
const MIN_MEDIA = 4

type SelectHotel = { id: string; name: string; address: string; roomCount: number }

export default function CreatePackageScreen() {
  const { user } = useAuth()
  const theme = useRoleTheme()
  const c = useThemeColors()
  const params = useLocalSearchParams<{ id?: string }>()
  const editId = typeof params.id === 'string' && params.id ? params.id : null
  const [gate, setGate] = useState<'loading' | 'allowed' | 'blocked'>('loading')
  const [hotels, setHotels] = useState<SelectHotel[]>([])
  const [rooms, setRooms] = useState<HotelRoomOption[]>([])
  const [roomsLoading, setRoomsLoading] = useState(false)
  const [step, setStep] = useState(0)
  const [publishing, setPublishing] = useState(false)

  // add-form locals
  const [customInc, setCustomInc] = useState('')
  const [offerName, setOfferName] = useState('')
  const [offerPrice, setOfferPrice] = useState('')
  const [offerDiscount, setOfferDiscount] = useState('')

  const [data, setData] = useState<Record<string, any>>({
    packageType: '',
    photos: [],
    freeInclusions: [],
    discountOffers: [],
    inclusions: [],
    exclusions: [],
    selectedRooms: {},
    minimumNights: 1,
    maximumNights: 7,
    maxGuests: 2,
    currency: 'PKR',
  })
  const set = (patch: Record<string, any>) => setData((d) => ({ ...d, ...patch }))
  const toggleArray = (key: 'inclusions' | 'exclusions', v: string) =>
    setData((d) => {
      const arr: string[] = d[key] || []
      return { ...d, [key]: arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v] }
    })

  const freeInclusions: Array<{ name: string }> = data.freeInclusions || []
  const toggleFreeInclusion = (name: string) =>
    setData((d) => {
      const arr: Array<{ name: string }> = d.freeInclusions || []
      const has = arr.some((x) => x.name === name)
      return { ...d, freeInclusions: has ? arr.filter((x) => x.name !== name) : [...arr, { name }] }
    })
  const addCustomInclusion = () => {
    const n = customInc.trim()
    if (!n) return
    setData((d) => ({ ...d, freeInclusions: [...(d.freeInclusions || []), { name: n }] }))
    setCustomInc('')
  }
  const addDiscountOffer = () => {
    const n = offerName.trim()
    if (!n) return
    setData((d) => ({
      ...d,
      discountOffers: [...(d.discountOffers || []), { name: n, originalPrice: Number(offerPrice) || 0, discount: Number(offerDiscount) || 0 }],
    }))
    setOfferName('')
    setOfferPrice('')
    setOfferDiscount('')
  }

  const selectedRooms: Record<string, any> = data.selectedRooms || {}
  const toggleRoom = (room: HotelRoomOption) =>
    setData((d) => {
      const sel = { ...(d.selectedRooms || {}) }
      if (sel[room.roomId]) delete sel[room.roomId]
      else
        sel[room.roomId] = {
          roomId: room.roomId,
          roomName: room.roomName,
          originalPrice: room.basePrice,
          packagePrice: room.basePrice,
          currency: room.currency,
          maxGuests: room.maxGuests,
          size: room.size,
          roomType: room.roomType,
        }
      return { ...d, selectedRooms: sel, currency: d.currency || room.currency }
    })
  const setRoomPrice = (roomId: string, price: number) =>
    setData((d) => ({ ...d, selectedRooms: { ...(d.selectedRooms || {}), [roomId]: { ...(d.selectedRooms?.[roomId] || {}), packagePrice: price } } }))

  const photos: string[] = data.photos || []
  const pickMedia = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow photo access to add package images.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({ allowsMultipleSelection: true, selectionLimit: 10, quality: 0.8 })
    if (result.canceled) return
    set({ photos: [...photos, ...result.assets.map((a) => a.uri)] })
  }

  useEffect(() => {
    if (!user) {
      setGate('blocked')
      return
    }
    let active = true
    ;(async () => {
      try {
        const has = await hasPublishedHotel(user.id)
        if (!active) return
        if (!has) {
          setGate('blocked')
          return
        }
        const list = await fetchOwnedPublishedHotels(user.id)
        if (!active) return
        setHotels(list)
        if (editId) {
          // Edit mode — prefill from the owned package row before opening.
          const prefill = await fetchPackageForEdit(editId, user.id)
          if (!active) return
          const hotel = list.find((h) => h.id === prefill.hotelId)
          setData((d) => ({
            ...d,
            ...prefill,
            hotelName: hotel?.name,
            hotelAddress: hotel?.address,
          }))
        } else if (list.length === 1) {
          set({ hotelId: list[0].id, hotelName: list[0].name, hotelAddress: list[0].address })
        }
        setGate('allowed')
      } catch {
        if (active) setGate('blocked')
      }
    })()
    return () => {
      active = false
    }
  }, [user])

  useEffect(() => {
    if (!data.hotelId) {
      setRooms([])
      return
    }
    let active = true
    setRoomsLoading(true)
    ;(async () => {
      try {
        const r = await fetchHotelRooms(data.hotelId)
        if (active) setRooms(r)
      } catch {
        if (active) setRooms([])
      } finally {
        if (active) setRoomsLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [data.hotelId])

  const missingForPublish = useMemo(() => {
    const miss: string[] = []
    if (!data.hotelId) miss.push('hotel')
    if (!data.packageType) miss.push('type')
    if (!(data.name?.trim?.().length >= 3)) miss.push('name (3+ chars)')
    if (!data.description?.trim?.()) miss.push('description')
    if (photos.length < MIN_MEDIA) miss.push(`${MIN_MEDIA} photos (have ${photos.length})`)
    if (!(data.inclusions?.length > 0)) miss.push('inclusions')
    if (!(Object.keys(selectedRooms).length > 0)) miss.push('at least 1 room')
    return miss
  }, [data, photos.length, selectedRooms])

  const handlePublish = async () => {
    if (!user) return
    if (missingForPublish.length) {
      Alert.alert('Almost there', `Please add: ${missingForPublish.join(', ')}.`)
      return
    }
    const prices = Object.values(selectedRooms).map((r: any) => Number(r.packagePrice) || 0).filter((n) => n > 0)
    const minPrice = prices.length ? Math.min(...prices) : 0
    const pkg: PackageData = {
      hotelId: data.hotelId,
      hotelName: data.hotelName,
      packageType: data.packageType,
      name: data.name,
      description: data.description,
      photos,
      inclusions: data.inclusions,
      exclusions: data.exclusions,
      freeInclusions: data.freeInclusions,
      discountOffers: data.discountOffers,
      cancellationPolicy: data.cancellationPolicy,
      paymentTerms: data.paymentTerms,
      selectedRooms,
      roomIds: Object.keys(selectedRooms),
      priceRange: minPrice ? { min: minPrice, max: Math.max(...prices), currency: data.currency } : null,
      currency: data.currency,
      basePricePerNight: minPrice,
      minimumNights: data.minimumNights,
      maximumNights: data.maximumNights,
      maxGuests: data.maxGuests,
    }
    setPublishing(true)
    try {
      await publishPackage(pkg, user.id, editId)
      Alert.alert(
        editId ? 'Package updated 🎉' : 'Package published 🎉',
        editId ? 'Your changes are live for travellers.' : 'Travellers can now find and book this package.',
      )
      router.replace('/manager/dashboard' as Href)
    } catch (e: any) {
      Alert.alert('Could not publish', e?.message ?? 'Please try again.')
    } finally {
      setPublishing(false)
    }
  }

  if (gate === 'loading') {
    return (
      <Screen>
        <AppHeader showBack title={editId ? 'Edit package' : 'Create a package'} />
        <View className="flex-1 items-center justify-center"><ActivityIndicator size="large" color="#9D4EDD" /></View>
      </Screen>
    )
  }
  if (gate === 'blocked') {
    return (
      <Screen>
        <AppHeader showBack title="Create a package" />
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center text-lg font-bold text-ink">Publish a hotel first</Text>
          <Text className="mt-2 text-center text-sm text-ink-muted">Packages bundle a stay at one of your published properties.</Text>
          <View className="mt-5 w-full"><Button label="List a hotel" onPress={() => router.replace('/manager/list-hotel' as Href)} /></View>
        </View>
      </Screen>
    )
  }

  return (
    <Screen>
      <AppHeader
        showBack
        title={editId ? 'Edit package' : 'Create a package'}
        subtitle={`${STEP_TITLES[step]} · Step ${step + 1}/${STEP_TITLES.length}`}
      />
      <WizardProgress steps={STEP_TITLES} current={step} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 28 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* 0 — Hotel */}
        {step === 0 ? (
          <View>
            <Text className="mb-2 text-sm text-ink-muted">Which property is this package for?</Text>
            {hotels.map((h) => {
              const active = data.hotelId === h.id
              return (
                <Pressable key={h.id} onPress={() => set({ hotelId: h.id, hotelName: h.name, hotelAddress: h.address })} className="mb-2">
                  <Card className={`flex-row items-center p-4 ${active ? 'border-2 border-primary-700' : ''}`}>
                    <View className="flex-1">
                      <Text className="text-base font-bold text-ink">{h.name}</Text>
                      <Text className="text-xs text-ink-muted" numberOfLines={1}>{h.address} · {h.roomCount} room type(s)</Text>
                    </View>
                    {active ? <Check size={20} color={theme.primary} /> : null}
                  </Card>
                </Pressable>
              )
            })}
          </View>
        ) : null}

        {/* 1 — Type cards */}
        {step === 1 ? (
          <View>
            <Text className="mb-3 text-sm text-ink-muted">Choose the theme that best represents this package.</Text>
            <View className="flex-row flex-wrap justify-between">
              {PACKAGE_TYPES.map((t) => {
                const active = data.packageType === t.id
                return (
                  <Pressable key={t.id} onPress={() => set({ packageType: t.id })} style={{ width: '48%' }} className={`mb-3 rounded-2xl border-2 p-4 ${active ? 'border-primary-700 bg-primary-50' : 'border-line bg-surface'}`}>
                    <View className={`h-11 w-11 items-center justify-center rounded-xl ${active ? 'bg-primary-700' : 'bg-surface-sunken'}`}>
                      <t.Icon size={22} color={active ? '#ffffff' : c.inkMuted} strokeWidth={1.9} />
                    </View>
                    <Text className="mt-2 font-bold text-ink">{t.name}</Text>
                    <Text className="text-xs leading-4 text-ink-soft">{t.description}</Text>
                  </Pressable>
                )
              })}
            </View>
          </View>
        ) : null}

        {/* 2 — Basics */}
        {step === 2 ? (
          <View>
            <Field label="Package name" value={data.name ?? ''} onChange={(v) => set({ name: v })} placeholder="e.g. 3-Night Romantic Getaway" />
            <Field label="Description" value={data.description ?? ''} onChange={(v) => set({ description: v })} placeholder="What's special about this package…" multiline />
          </View>
        ) : null}

        {/* 3 — Photos */}
        {step === 3 ? (
          <View>
            <Text className="text-sm leading-6 text-ink-muted">Add at least {MIN_MEDIA} photos ({photos.length}/{MIN_MEDIA}). Uploaded when you publish.</Text>
            <View className="mt-3 flex-row flex-wrap gap-3">
              {photos.map((uri, i) => (
                <View key={uri + i} className="relative">
                  <Image source={{ uri }} style={{ width: 100, height: 100, borderRadius: 14 }} />
                  <Pressable onPress={() => set({ photos: photos.filter((_, idx) => idx !== i) })} className="absolute -right-2 -top-2 h-6 w-6 items-center justify-center rounded-full bg-ink"><X size={13} color="#ffffff" /></Pressable>
                </View>
              ))}
              <Pressable onPress={pickMedia} className="h-[100px] w-[100px] items-center justify-center rounded-2xl border border-dashed border-line bg-surface-sunken"><Plus size={26} color="#94a3b8" /></Pressable>
            </View>
          </View>
        ) : null}

        {/* 4 — Highlights */}
        {step === 4 ? (
          <View>
            <SectionLabel>Complimentary perks</SectionLabel>
            <Text className="mb-2 text-xs text-ink-soft">Free extras guests get with this package.</Text>
            <View className="flex-row flex-wrap">
              {SUGGESTED_FREE_INCLUSIONS.map((s) => (
                <Chip key={s} label={s} active={freeInclusions.some((x) => x.name === s)} onPress={() => toggleFreeInclusion(s)} />
              ))}
            </View>
            <View className="mt-1 flex-row items-center gap-2">
              <View className="flex-1"><Field label="Add a custom perk" value={customInc} onChange={setCustomInc} placeholder="e.g. Sunset boat ride" /></View>
            </View>
            <View className="-mt-1 mb-2"><Button label="Add perk" variant="secondary" fullWidth={false} onPress={addCustomInclusion} /></View>
            {freeInclusions.filter((f) => !SUGGESTED_FREE_INCLUSIONS.includes(f.name)).map((f, i) => (
              <View key={`cf-${i}`} className="mb-1 flex-row items-center">
                <Check size={14} color={theme.primary} />
                <Text className="ml-2 flex-1 text-sm text-ink">{f.name}</Text>
                <Pressable onPress={() => toggleFreeInclusion(f.name)}><X size={16} color="#94a3b8" /></Pressable>
              </View>
            ))}

            <SectionLabel>Discounted add-ons</SectionLabel>
            <Text className="mb-2 text-xs text-ink-soft">Optional extras at a special price.</Text>
            {(data.discountOffers || []).map((o: any, i: number) => (
              <Card key={`do-${i}`} className="mb-2 flex-row items-center p-3">
                <View className="h-9 w-9 items-center justify-center rounded-full bg-primary-50"><Percent size={16} color={theme.primary} /></View>
                <View className="ml-3 flex-1">
                  <Text className="font-semibold text-ink" numberOfLines={1}>{o.name}</Text>
                  <Text className="text-xs text-ink-soft">{data.currency} {Number(o.originalPrice).toLocaleString()} · {o.discount}% off</Text>
                </View>
                <Pressable onPress={() => set({ discountOffers: data.discountOffers.filter((_: any, idx: number) => idx !== i) })}><X size={18} color="#94a3b8" /></Pressable>
              </Card>
            ))}
            <Field label="Add-on name" value={offerName} onChange={setOfferName} placeholder="e.g. Couples spa massage" />
            <View className="flex-row gap-3">
              <View className="flex-1"><Field label="Original price" value={offerPrice} onChange={setOfferPrice} placeholder="100" keyboardType="decimal-pad" /></View>
              <View className="flex-1"><Field label="Discount %" value={offerDiscount} onChange={setOfferDiscount} placeholder="20" keyboardType="number-pad" /></View>
            </View>
            <View className="-mt-1"><Button label="Add discounted add-on" variant="secondary" onPress={addDiscountOffer} /></View>
          </View>
        ) : null}

        {/* 5 — Included */}
        {step === 5 ? (
          <View>
            <Text className="mb-2 text-sm text-ink-muted">What's included in the package price?</Text>
            <View className="flex-row flex-wrap">
              {PACKAGE_INCLUSIONS.map((o) => <Chip key={o} label={o} active={(data.inclusions || []).includes(o)} onPress={() => toggleArray('inclusions', o)} />)}
            </View>
          </View>
        ) : null}

        {/* 6 — Excluded */}
        {step === 6 ? (
          <View>
            <Text className="mb-2 text-sm text-ink-muted">What's not included?</Text>
            <View className="flex-row flex-wrap">
              {PACKAGE_EXCLUSIONS.map((o) => <Chip key={o} label={o} active={(data.exclusions || []).includes(o)} onPress={() => toggleArray('exclusions', o)} />)}
            </View>
          </View>
        ) : null}

        {/* 7 — Rooms & price */}
        {step === 7 ? (
          <View>
            <Text className="text-sm text-ink-muted">Pick the room type(s) included and set the package price per night.</Text>
            {roomsLoading ? (
              <View className="py-8"><ActivityIndicator color="#9D4EDD" /></View>
            ) : rooms.length === 0 ? (
              <Text className="mt-4 text-sm text-ink-soft">This hotel has no rooms yet. Add rooms to the hotel first.</Text>
            ) : (
              rooms.map((room) => {
                const sel = selectedRooms[room.roomId]
                return (
                  <Card key={room.roomId} className={`mt-3 p-4 ${sel ? 'border-2 border-primary-700' : ''}`}>
                    <Pressable onPress={() => toggleRoom(room)} className="flex-row items-center justify-between">
                      <View className="flex-1">
                        <Text className="text-base font-bold text-ink">{room.roomName || room.roomType}</Text>
                        <Text className="text-xs text-ink-muted">Up to {room.maxGuests} guests · base {room.currency} {room.basePrice.toLocaleString()}</Text>
                      </View>
                      <View className={`h-6 w-6 items-center justify-center rounded-full border ${sel ? 'border-primary-700 bg-primary-700' : 'border-line'}`}>{sel ? <Check size={14} color="#ffffff" /> : null}</View>
                    </Pressable>
                    {sel ? (
                      <View className="mt-3">
                        <Field label={`Package price / night (${room.currency})`} value={sel.packagePrice ? String(sel.packagePrice) : ''} onChange={(v) => setRoomPrice(room.roomId, Number(v.replace(/[^0-9.]/g, '')) || 0)} placeholder={String(room.basePrice)} keyboardType="decimal-pad" />
                      </View>
                    ) : null}
                  </Card>
                )
              })
            )}
          </View>
        ) : null}

        {/* 8 — Stay length */}
        {step === 8 ? (
          <View>
            <SectionLabel>Minimum nights</SectionLabel>
            <Stepper value={data.minimumNights || 1} min={1} max={30} onChange={(v) => set({ minimumNights: v })} />
            <SectionLabel>Maximum nights</SectionLabel>
            <Stepper value={data.maximumNights || 7} min={1} max={60} onChange={(v) => set({ maximumNights: v })} />
            <SectionLabel>Max guests</SectionLabel>
            <Stepper value={data.maxGuests || 2} min={1} max={20} onChange={(v) => set({ maxGuests: v })} />
          </View>
        ) : null}

        {/* 9 — Policies */}
        {step === 9 ? (
          <View>
            <Field label="Cancellation policy" value={data.cancellationPolicy ?? ''} onChange={(v) => set({ cancellationPolicy: v })} placeholder="e.g. Free cancellation up to 7 days before" multiline />
            <Field label="Payment terms" value={data.paymentTerms ?? ''} onChange={(v) => set({ paymentTerms: v })} placeholder="e.g. 30% deposit, balance on arrival" multiline />
          </View>
        ) : null}

        {/* 10 — Review */}
        {step === 10 ? (
          <View>
            <Card className="p-4">
              <Row label="Hotel" value={data.hotelName || '—'} />
              <Row label="Type" value={PACKAGE_TYPES.find((t) => t.id === data.packageType)?.name || '—'} />
              <Row label="Name" value={data.name || '—'} />
              <Row label="Rooms" value={String(Object.keys(selectedRooms).length)} />
              <Row label="Perks / add-ons" value={`${freeInclusions.length} / ${(data.discountOffers || []).length}`} />
              <Row label="Photos" value={`${photos.length}/${MIN_MEDIA}`} />
              <Row label="Stay" value={`${data.minimumNights}-${data.maximumNights} nights`} last />
            </Card>
            {missingForPublish.length ? (
              <Text className="mt-3 text-xs leading-5 text-danger">Add before publishing: {missingForPublish.join(', ')}.</Text>
            ) : (
              <Text className="mt-3 text-xs leading-5 text-ink-soft">Publishing makes this package bookable by travellers immediately.</Text>
            )}
          </View>
        ) : null}
      </ScrollView>

      <View className="flex-row gap-3 px-5 pb-3 pt-2">
        {step > 0 ? (
          <View className="flex-1"><Button label="Back" variant="secondary" disabled={publishing} onPress={() => setStep((s) => Math.max(0, s - 1))} /></View>
        ) : null}
        <View className="flex-[2]">
          {step === LAST ? (
            <Button label={editId ? 'Save & publish' : 'Publish package'} loading={publishing} gradient onPress={handlePublish} />
          ) : (
            <Button
              label="Continue"
              onPress={() => {
                if (step === 0 && !data.hotelId) {
                  Alert.alert('Choose a hotel', 'Select which property this package is for.')
                  return
                }
                if (step === 1 && !data.packageType) {
                  Alert.alert('Pick a type', 'Choose a package theme to continue.')
                  return
                }
                setStep((s) => Math.min(LAST, s + 1))
              }}
            />
          )}
        </View>
      </View>
    </Screen>
  )
}

function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View className={`flex-row items-center justify-between py-2.5 ${last ? '' : 'border-b border-line'}`}>
      <Text className="text-sm text-ink-muted">{label}</Text>
      <Text className="flex-1 text-right text-sm font-semibold text-ink" numberOfLines={1}>{value}</Text>
    </View>
  )
}
