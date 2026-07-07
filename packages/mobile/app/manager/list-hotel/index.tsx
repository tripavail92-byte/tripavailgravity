import { router, useLocalSearchParams, type Href } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Text, View } from 'react-native'
import * as ImagePicker from 'expo-image-picker'

import { Check, MapPin, Plus, Star, X } from '@/components/icons/lucide'
import { Field, SectionLabel, WizardProgress } from '@/components/ui/FormKit'
import { AppHeader, Button, Card, Screen } from '@/components/ui'
import { LocationPickerModal } from '@/components/ui/LocationPickerModal'
import { RoomEditorModal } from '@/components/ui/RoomEditorModal'
import { useAuth } from '@/hooks/useAuth'
import { useRoleTheme, useThemeColors } from '@/theme'
import {
  AMENITY_CATEGORIES,
  EMPTY_SERVICES,
  FACILITY_OPTIONS,
  PROPERTY_TYPES,
  ROOM_TYPES,
  getAmenityIcon,
  type ServicesData,
} from '@/lib/hotelOptions'
import { fetchHotelForEdit, publishHotelListing, saveHotelDraft, uploadHotelImage, type HotelPhoto, type HotelRoomInput } from '@/lib/hotelAuthoring'

const STEP_TITLES = ['Type', 'Details', 'Location', 'Amenities', 'Rooms', 'Services', 'Policies', 'Photos', 'Review']
const LAST = STEP_TITLES.length - 1
const MIN_PHOTOS = 5
const STAR_OPTIONS = [1, 2, 3, 4, 5]

function freshServices(): ServicesData {
  return { ...EMPTY_SERVICES, facilities: {}, accessibility: { wheelchairAccessible: false, elevator: false } }
}

function bedsSummary(room: HotelRoomInput): string {
  if (!room.beds.length) return 'No beds set'
  return room.beds.map((b) => `${b.quantity} ${b.type}`).join(', ')
}

function Segment({ options, value, onChange }: { options: Array<{ v: string; label: string }>; value: string; onChange: (v: string) => void }) {
  return (
    <View className="mb-3 flex-row rounded-2xl border border-line bg-surface p-1">
      {options.map((o) => {
        const active = value === o.v
        return (
          <Pressable key={o.v} onPress={() => onChange(o.v)} className={`flex-1 items-center rounded-xl py-2 ${active ? 'bg-primary-700' : ''}`}>
            <Text className={`text-sm font-semibold ${active ? 'text-white' : 'text-ink-muted'}`}>{o.label}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}

export default function ListHotelScreen() {
  const { user } = useAuth()
  const theme = useRoleTheme()
  const c = useThemeColors()
  const params = useLocalSearchParams<{ id?: string }>()
  const editId = typeof params.id === 'string' && params.id ? params.id : null
  const [step, setStep] = useState(0)
  const [publishing, setPublishing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [loadingEdit, setLoadingEdit] = useState(!!editId)
  const [editingPublished, setEditingPublished] = useState(false)
  const [draftId, setDraftId] = useState<string | null>(null)
  const [roomModal, setRoomModal] = useState(false)
  const [mapOpen, setMapOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  const [data, setData] = useState<Record<string, any>>({
    propertyType: '',
    amenities: [],
    rooms: [],
    services: freshServices(),
    policies: {},
    photos: { propertyPhotos: [] },
    location: {},
  })

  // Edit mode — prefill the wizard from an owned hotel row.
  useEffect(() => {
    if (!editId || !user) return
    let active = true
    ;(async () => {
      try {
        const res = await fetchHotelForEdit(editId, user.id)
        if (!active) return
        setData((d) => ({
          ...d,
          ...res.data,
          services: res.data.services ?? freshServices(),
          policies: res.data.policies ?? {},
          photos: res.data.photos ?? { propertyPhotos: [] },
          location: res.data.location ?? {},
        }))
        setDraftId(editId)
        setEditingPublished(res.isPublished)
      } catch (e: any) {
        Alert.alert('Could not load hotel', e?.message ?? 'Please try again.', [
          { text: 'OK', onPress: () => router.back() },
        ])
      } finally {
        if (active) setLoadingEdit(false)
      }
    })()
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId, user?.id])

  const set = (patch: Record<string, any>) => setData((d) => ({ ...d, ...patch }))
  const setLocation = (patch: Record<string, any>) => setData((d) => ({ ...d, location: { ...(d.location || {}), ...patch } }))
  const setPolicies = (patch: Record<string, any>) => setData((d) => ({ ...d, policies: { ...(d.policies || {}), ...patch } }))
  const setService = (patch: Partial<ServicesData>) => setData((d) => ({ ...d, services: { ...d.services, ...patch } }))
  const toggleFacility = (key: string) => setData((d) => ({ ...d, services: { ...d.services, facilities: { ...d.services.facilities, [key]: !d.services.facilities?.[key] } } }))
  const toggleAccess = (key: 'wheelchairAccessible' | 'elevator') => setData((d) => ({ ...d, services: { ...d.services, accessibility: { ...d.services.accessibility, [key]: !d.services.accessibility?.[key] } } }))
  const toggleAmenity = (id: string) =>
    setData((d) => {
      const arr: string[] = d.amenities || []
      return { ...d, amenities: arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id] }
    })

  const rooms: HotelRoomInput[] = data.rooms || []
  const photos: HotelPhoto[] = data.photos?.propertyPhotos || []
  const services: ServicesData = data.services

  const saveRoom = (room: HotelRoomInput) =>
    setData((d) => {
      const list: HotelRoomInput[] = d.rooms || []
      if (editingIndex != null) return { ...d, rooms: list.map((r, i) => (i === editingIndex ? room : r)) }
      return { ...d, rooms: [...list, room] }
    })

  const saveDraft = async () => {
    if (!user) return
    // Draft autosave writes is_published=false — never run it against a LIVE
    // hotel being edited, or every Continue would unpublish it. Edits to a
    // published hotel only persist on the final "Save & publish".
    if (editingPublished) return
    try {
      const res = await saveHotelDraft(data, user.id, draftId)
      if (res.success && res.draftId) setDraftId(res.draftId)
    } catch {
      // non-fatal
    }
  }

  const pickPhotos = async () => {
    if (!user) return
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow photo access to add property images.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({ allowsMultipleSelection: true, selectionLimit: 12, quality: 0.8 })
    if (result.canceled) return
    setUploading(true)
    try {
      const existing: HotelPhoto[] = data.photos?.propertyPhotos ?? []
      const added: HotelPhoto[] = []
      for (let i = 0; i < result.assets.length; i++) {
        const a = result.assets[i]
        const url = await uploadHotelImage({ userId: user.id, draftHotelId: draftId ?? undefined, localUri: a.uri, fileName: a.fileName ?? undefined, mimeType: a.mimeType ?? undefined })
        const idx = existing.length + added.length
        added.push({ id: `${Date.now()}_${i}`, url, order: idx, isCover: idx === 0 })
      }
      set({ photos: { propertyPhotos: [...existing, ...added] } })
    } catch (e: any) {
      Alert.alert('Upload failed', e?.message ?? 'Please try again.')
    } finally {
      setUploading(false)
    }
  }
  const removePhoto = (i: number) => {
    const remaining = photos.filter((_, idx) => idx !== i).map((p, idx) => ({ ...p, order: idx, isCover: idx === 0 }))
    set({ photos: { propertyPhotos: remaining } })
  }

  const missingForPublish = useMemo(() => {
    const miss: string[] = []
    if (!data.propertyType) miss.push('property type')
    if (!data.hotelName?.trim?.()) miss.push('name')
    if (!data.description?.trim?.()) miss.push('description')
    if (!data.contactEmail?.trim?.()) miss.push('contact email')
    if (!(data.amenities?.length > 0)) miss.push('amenities')
    if (!(rooms.length > 0)) miss.push('at least 1 room')
    if (photos.length < MIN_PHOTOS) miss.push(`${MIN_PHOTOS} photos (have ${photos.length})`)
    return miss
  }, [data, rooms.length, photos.length])

  const handlePublish = async () => {
    if (!user) return
    if (missingForPublish.length) {
      Alert.alert('Almost there', `Please add: ${missingForPublish.join(', ')}.`)
      return
    }
    setPublishing(true)
    try {
      await publishHotelListing(data, user.id, draftId)
      Alert.alert(
        editingPublished ? 'Hotel updated 🎉' : 'Hotel published 🎉',
        editingPublished
          ? 'Your changes are live for travellers.'
          : 'Travellers can now find your property. Next: build a package.',
      )
      router.replace('/manager/dashboard' as Href)
    } catch (e: any) {
      Alert.alert('Could not publish', e?.message ?? 'Please try again.')
    } finally {
      setPublishing(false)
    }
  }

  if (!user) {
    return (
      <Screen>
        <AppHeader showBack title="List a hotel" />
        <View className="p-6"><Text className="text-ink-muted">Please sign in.</Text></View>
      </Screen>
    )
  }

  if (loadingEdit) {
    return (
      <Screen>
        <AppHeader showBack title="Edit hotel" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </Screen>
    )
  }

  return (
    <Screen>
      <AppHeader
        showBack
        title={editId ? 'Edit hotel' : 'List a hotel'}
        subtitle={`${STEP_TITLES[step]} · Step ${step + 1}/${STEP_TITLES.length}`}
      />
      <WizardProgress steps={STEP_TITLES} current={step} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 28 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* 0 — Property type */}
        {step === 0 ? (
          <View>
            <Text className="mb-3 text-sm text-ink-muted">Select your property type to get started.</Text>
            <View className="flex-row flex-wrap justify-between">
              {PROPERTY_TYPES.map((t) => {
                const active = data.propertyType === t.id
                return (
                  <Pressable key={t.id} onPress={() => set({ propertyType: t.id })} style={{ width: '48%' }} className={`mb-3 rounded-2xl border-2 p-4 ${active ? 'border-primary-700 bg-primary-50' : 'border-line bg-surface'}`}>
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

        {/* 1 — Details */}
        {step === 1 ? (
          <View>
            <Field label="Property name" value={data.hotelName ?? ''} onChange={(v) => set({ hotelName: v })} placeholder="e.g. Hunza Serena Inn" />
            <Field label="Description" value={data.description ?? ''} onChange={(v) => set({ description: v })} placeholder="What makes your property special…" multiline />
            <Field label="Contact email" value={data.contactEmail ?? ''} onChange={(v) => set({ contactEmail: v })} placeholder="bookings@yourhotel.com" keyboardType="email-address" />
            <Field label="Contact phone" value={data.contactPhone ?? ''} onChange={(v) => set({ contactPhone: v })} placeholder="+92 …" keyboardType="phone-pad" />
            <SectionLabel>Star rating</SectionLabel>
            <View className="flex-row gap-2">
              {STAR_OPTIONS.map((s) => {
                const active = data.starRating === s
                return (
                  <Pressable key={s} onPress={() => set({ starRating: s })} className={`flex-row items-center rounded-full border px-3 py-1.5 ${active ? 'border-primary-700 bg-primary-700' : 'border-line bg-surface'}`}>
                    <Star size={12} color={active ? '#ffffff' : '#f59e0b'} fill={active ? '#ffffff' : '#f59e0b'} />
                    <Text className={`ml-1 text-sm font-semibold ${active ? 'text-white' : 'text-ink'}`}>{s}</Text>
                  </Pressable>
                )
              })}
            </View>
          </View>
        ) : null}

        {/* 2 — Location */}
        {step === 2 ? (
          <View>
            <Field label="City" value={data.city ?? ''} onChange={(v) => set({ city: v })} placeholder="e.g. Hunza" />
            <Field label="Country" value={data.country ?? ''} onChange={(v) => set({ country: v })} placeholder="e.g. Pakistan" />
            <Field label="Area / neighbourhood" value={data.area ?? ''} onChange={(v) => set({ area: v })} placeholder="Optional" />
            <Field label="Address" value={data.address ?? ''} onChange={(v) => set({ address: v })} placeholder="Street address" />
            <View className="flex-row gap-3">
              <View className="flex-1"><Field label="Latitude (optional)" value={data.location?.lat != null ? String(data.location.lat) : ''} onChange={(v) => setLocation({ lat: Number(v) || undefined })} placeholder="36.32" keyboardType="numbers-and-punctuation" /></View>
              <View className="flex-1"><Field label="Longitude (optional)" value={data.location?.lng != null ? String(data.location.lng) : ''} onChange={(v) => setLocation({ lng: Number(v) || undefined })} placeholder="74.65" keyboardType="numbers-and-punctuation" /></View>
            </View>
            <Pressable
              onPress={() => setMapOpen(true)}
              className="mt-1 flex-row items-center justify-center gap-2 rounded-2xl border border-primary-700 bg-primary-50 py-3"
            >
              <MapPin size={16} color={theme.primary} />
              <Text className="text-sm font-bold text-primary-700">
                {data.location?.lat != null ? 'Adjust pin on map' : 'Pick on map'}
              </Text>
            </Pressable>
            <Text className="mt-2 text-xs text-ink-soft">Coordinates help travellers find you — drop a pin or type them in.</Text>
          </View>
        ) : null}

        {/* 3 — Amenities */}
        {step === 3 ? (
          <View>
            <Text className="mb-1 text-sm text-ink-muted">Select everything your property offers.</Text>
            {Object.entries(AMENITY_CATEGORIES).map(([category, items]) => (
              <View key={category}>
                <SectionLabel>{category}</SectionLabel>
                <View className="flex-row flex-wrap">
                  {items.map((a) => {
                    const active = (data.amenities || []).includes(a.id)
                    const AIcon = getAmenityIcon(a.id)
                    return (
                      <Pressable key={a.id} onPress={() => toggleAmenity(a.id)} className={`mb-2 mr-2 flex-row items-center rounded-full border px-3 py-2 ${active ? 'border-primary-700 bg-primary-700' : 'border-line bg-surface'}`}>
                        <AIcon size={14} color={active ? '#ffffff' : c.inkSoft} />
                        <Text className={`ml-1.5 text-sm font-medium ${active ? 'text-white' : 'text-ink'}`}>{a.name}</Text>
                      </Pressable>
                    )
                  })}
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {/* 4 — Rooms */}
        {step === 4 ? (
          <View>
            <Text className="text-sm text-ink-muted">Add your room types. Each can have its own beds, capacity, and price.</Text>
            {rooms.map((room, i) => {
              const emoji = ROOM_TYPES.find((t) => t.value === room.type)?.emoji ?? '🛏️'
              return (
                <Card key={room.id} className="mt-3 flex-row items-center p-4">
                  <Text className="text-2xl">{emoji}</Text>
                  <View className="ml-3 flex-1">
                    <Text className="font-bold text-ink" numberOfLines={1}>{room.name || room.type}</Text>
                    <Text className="text-xs text-ink-soft" numberOfLines={1}>{room.count} room(s) · up to {room.maxGuests} · {bedsSummary(room)}</Text>
                    <Text className="mt-0.5 text-xs font-semibold text-primary-700">{room.pricing.currency} {Number(room.pricing.basePrice).toLocaleString()} / night</Text>
                  </View>
                  <Pressable onPress={() => { setEditingIndex(i); setRoomModal(true) }} className="ml-2 rounded-full bg-surface-sunken px-3 py-1.5"><Text className="text-xs font-semibold text-ink">Edit</Text></Pressable>
                  <Pressable onPress={() => set({ rooms: rooms.filter((_, idx) => idx !== i) })} className="ml-2"><X size={18} color="#94a3b8" /></Pressable>
                </Card>
              )
            })}
            <View className="mt-3">
              <Button label="Add a room type" variant="secondary" onPress={() => { setEditingIndex(null); setRoomModal(true) }} />
            </View>
          </View>
        ) : null}

        {/* 5 — Services */}
        {step === 5 ? (
          <View>
            <SectionLabel>Breakfast</SectionLabel>
            <Segment value={services.breakfast} onChange={(v) => setService({ breakfast: v as any })} options={[{ v: 'included', label: 'Included' }, { v: 'optional', label: 'Optional' }, { v: 'none', label: 'None' }]} />
            <SectionLabel>Parking</SectionLabel>
            <Segment value={services.parking} onChange={(v) => setService({ parking: v as any })} options={[{ v: 'free', label: 'Free' }, { v: 'paid', label: 'Paid' }, { v: 'none', label: 'None' }]} />
            <SectionLabel>WiFi</SectionLabel>
            <Segment value={services.wifi} onChange={(v) => setService({ wifi: v as any })} options={[{ v: 'free', label: 'Free' }, { v: 'paid', label: 'Paid' }, { v: 'none', label: 'None' }]} />

            <SectionLabel>Facilities</SectionLabel>
            <View className="flex-row flex-wrap">
              {FACILITY_OPTIONS.map((f) => {
                const active = !!services.facilities?.[f.key]
                return (
                  <Pressable key={f.key} onPress={() => toggleFacility(f.key)} className={`mb-2 mr-2 flex-row items-center rounded-2xl border px-3 py-2 ${active ? 'border-primary-700 bg-primary-50' : 'border-line bg-surface'}`}>
                    <f.Icon size={16} color={active ? theme.primary : c.inkSoft} />
                    <Text className={`ml-2 text-sm font-medium ${active ? 'text-ink' : 'text-ink-muted'}`}>{f.label}</Text>
                  </Pressable>
                )
              })}
            </View>

            <SectionLabel>Accessibility</SectionLabel>
            <View className="flex-row flex-wrap">
              {([{ k: 'wheelchairAccessible', label: 'Wheelchair accessible' }, { k: 'elevator', label: 'Elevator' }] as const).map((opt) => {
                const active = !!services.accessibility?.[opt.k]
                return (
                  <Pressable key={opt.k} onPress={() => toggleAccess(opt.k)} className={`mb-2 mr-2 rounded-full border px-4 py-2 ${active ? 'border-primary-700 bg-primary-700' : 'border-line bg-surface'}`}>
                    <Text className={`text-sm font-semibold ${active ? 'text-white' : 'text-ink'}`}>{opt.label}</Text>
                  </Pressable>
                )
              })}
            </View>
          </View>
        ) : null}

        {/* 6 — Policies */}
        {step === 6 ? (
          <View>
            <Field label="Check-in time" value={data.policies?.checkIn ?? ''} onChange={(v) => setPolicies({ checkIn: v })} placeholder="e.g. 2:00 PM" />
            <Field label="Check-out time" value={data.policies?.checkOut ?? ''} onChange={(v) => setPolicies({ checkOut: v })} placeholder="e.g. 11:00 AM" />
            <Field label="Cancellation policy" value={data.policies?.cancellationPolicy ?? ''} onChange={(v) => setPolicies({ cancellationPolicy: v })} placeholder="e.g. Free cancellation up to 48h before" multiline />
            <Field label="House rules (optional)" value={data.policies?.houseRules ?? ''} onChange={(v) => setPolicies({ houseRules: v })} placeholder="Anything guests should know" multiline />
          </View>
        ) : null}

        {/* 7 — Photos */}
        {step === 7 ? (
          <View>
            <Text className="text-sm leading-6 text-ink-muted">Add at least {MIN_PHOTOS} photos — the first is the cover. ({photos.length}/{MIN_PHOTOS})</Text>
            <View className="mt-3 flex-row flex-wrap gap-3">
              {photos.map((p, i) => (
                <View key={p.id} className="relative">
                  <Image source={{ uri: p.url }} style={{ width: 100, height: 100, borderRadius: 14 }} />
                  {i === 0 ? (
                    <View className="absolute left-1 top-1 flex-row items-center rounded-full bg-black/60 px-2 py-0.5">
                      <Star size={10} color="#fbbf24" fill="#fbbf24" />
                      <Text className="ml-1 text-[10px] font-bold text-white">Cover</Text>
                    </View>
                  ) : null}
                  <Pressable onPress={() => removePhoto(i)} className="absolute -right-2 -top-2 h-6 w-6 items-center justify-center rounded-full bg-ink"><X size={13} color="#ffffff" /></Pressable>
                </View>
              ))}
              <Pressable onPress={pickPhotos} disabled={uploading} className="h-[100px] w-[100px] items-center justify-center rounded-2xl border border-dashed border-line bg-surface-sunken">
                {uploading ? <ActivityIndicator color={theme.primary} /> : <Plus size={26} color="#94a3b8" />}
              </Pressable>
            </View>
          </View>
        ) : null}

        {/* 8 — Review */}
        {step === 8 ? (
          <View>
            <Card className="p-4">
              <Row label="Name" value={data.hotelName || '—'} />
              <Row label="Type" value={PROPERTY_TYPES.find((t) => t.id === data.propertyType)?.name || '—'} />
              <Row label="City" value={data.city || '—'} />
              <Row label="Rooms" value={String(rooms.length)} />
              <Row label="Amenities" value={String((data.amenities || []).length)} />
              <Row label="Photos" value={`${photos.length}/${MIN_PHOTOS}`} last />
            </Card>
            {missingForPublish.length ? (
              <Text className="mt-3 text-xs leading-5 text-danger">Add before publishing: {missingForPublish.join(', ')}.</Text>
            ) : (
              <Text className="mt-3 text-xs leading-5 text-ink-soft">Publishing makes your property visible to travellers immediately.</Text>
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
            <Button label={editingPublished ? 'Save & publish' : 'Publish hotel'} loading={publishing} gradient onPress={handlePublish} />
          ) : (
            <Button
              label="Continue"
              onPress={async () => {
                if (step === 0 && !data.propertyType) {
                  Alert.alert('Pick a type', 'Choose a property type to continue.')
                  return
                }
                await saveDraft()
                setStep((s) => Math.min(LAST, s + 1))
              }}
            />
          )}
        </View>
      </View>

      <RoomEditorModal
        visible={roomModal}
        editingRoom={editingIndex != null ? rooms[editingIndex] : null}
        onClose={() => setRoomModal(false)}
        onSave={saveRoom}
      />

      <LocationPickerModal
        visible={mapOpen}
        title="Property location"
        initial={
          data.location?.lat != null && data.location?.lng != null
            ? { lat: Number(data.location.lat), lng: Number(data.location.lng) }
            : null
        }
        onClose={() => setMapOpen(false)}
        onConfirm={(loc) => setLocation({ lat: Number(loc.lat.toFixed(6)), lng: Number(loc.lng.toFixed(6)) })}
      />
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
