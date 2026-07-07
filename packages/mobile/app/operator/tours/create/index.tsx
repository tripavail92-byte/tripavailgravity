import { router, useLocalSearchParams, type Href } from 'expo-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Image,
  type KeyboardTypeOptions,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'

import { Check, MapPin, Minus, Plus, Star, X } from '@/components/icons/lucide'
import { AppHeader, Button, Card, Screen } from '@/components/ui'
import { LocationPickerModal } from '@/components/ui/LocationPickerModal'
import { useAuth } from '@/hooks/useAuth'
import { useRoleTheme } from '@/theme'
import { supabase } from '@/lib/supabase'
import { getTourPaymentTerms } from '@/lib/pricing'
import { fetchOperatorCommercial, parsePublishError, type OperatorCommercialGates } from '@/lib/operatorCommercial'
import { fetchOperatorGateProfile, hasCompletedTourOperatorSetup } from '@/lib/operatorSetup'
import { EXCLUDED_FEATURE_OPTIONS, INCLUDED_FEATURE_OPTIONS } from '@/lib/tourFeatureCatalog'
import {
  calculateCompletionPercentage,
  createDraftClientId,
  listTourMedia,
  publishTour,
  removeTourMedia,
  saveTourDraft,
  saveTourPickups,
  syncTourImagesFromMedia,
  uploadTourImage,
} from '@/lib/tourAuthoring'

const TOUR_TYPES = [
  'Adventure', 'Cultural', 'Nature', 'City Tour', 'Food & Drink', 'Beach', 'Historical',
  'Religious', 'Honeymoon', 'Family', 'Photography', 'Wellness', 'Luxury', 'Budget', 'Custom',
]
const CURRENCIES = ['PKR', 'USD', 'EUR', 'GBP', 'AED']
const CANCELLATION = [
  { id: 'flexible', label: 'Flexible' },
  { id: 'moderate', label: 'Moderate' },
  { id: 'strict', label: 'Strict' },
  { id: 'non-refundable', label: 'Non-refundable' },
]
const DIFFICULTY = [
  { id: 'easy', label: 'Easy' },
  { id: 'moderate', label: 'Moderate' },
  { id: 'difficult', label: 'Difficult' },
]
const LANGUAGES = ['Urdu', 'English', 'Arabic', 'French', 'Spanish']

const STEP_TITLES = ['Basics', 'Pickup', 'Itinerary', 'Pricing', 'Details', 'Photos', 'Review']
const LAST = STEP_TITLES.length - 1

function Field({
  label, value, onChange, placeholder, multiline, keyboardType,
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string
  multiline?: boolean; keyboardType?: KeyboardTypeOptions
}) {
  return (
    <View className="mb-3">
      <Text className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-soft">{label}</Text>
      <View className="rounded-2xl border border-line bg-surface px-4">
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor="#94a3b8"
          multiline={multiline}
          keyboardType={keyboardType ?? 'default'}
          className="py-3 text-base text-ink"
          style={multiline ? { minHeight: 90, textAlignVertical: 'top' } : undefined}
        />
      </View>
    </View>
  )
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className={`mb-2 mr-2 rounded-full border px-4 py-2 ${active ? 'border-primary-700 bg-primary-700' : 'border-line bg-surface'}`}
    >
      <Text className={`text-sm font-semibold ${active ? 'text-white' : 'text-ink'}`}>{label}</Text>
    </Pressable>
  )
}

function Stepper({ value, onChange, min = 1, max = 300 }: { value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <View className="flex-row items-center gap-3">
      <Pressable onPress={() => onChange(Math.max(min, value - 1))} className="h-10 w-10 items-center justify-center rounded-full border border-line bg-surface">
        <Minus size={18} color="#0f172a" />
      </Pressable>
      <Text className="min-w-[40px] text-center text-lg font-bold text-ink">{value}</Text>
      <Pressable onPress={() => onChange(Math.min(max, value + 1))} className="h-10 w-10 items-center justify-center rounded-full border border-line bg-surface">
        <Plus size={18} color="#0f172a" />
      </Pressable>
    </View>
  )
}

function SectionLabel({ children }: { children: string }) {
  return <Text className="mb-2 mt-3 text-xs font-semibold uppercase tracking-wide text-ink-soft">{children}</Text>
}

function todayISO(offsetDays = 0): string {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return d.toISOString().slice(0, 10)
}

/** Map an existing `tours` row back into the wizard's form shape (for editing). */
function tourRowToWizardData(row: Record<string, any>): Record<string, any> {
  let schedules = Array.isArray(row.schedules) ? row.schedules : []
  schedules = schedules.map((s: any) => {
    if (s?.date) return s
    if (s?.start_time) {
      const d = new Date(s.start_time)
      return {
        id: s.id ?? createDraftClientId(),
        date: d.toISOString().slice(0, 10),
        time: d.toISOString().slice(11, 16),
        capacity: s.capacity ?? row.max_participants ?? 10,
      }
    }
    return s
  })
  if (!schedules.length) schedules = [{ id: createDraftClientId(), date: todayISO(1), time: '09:00', capacity: row.max_participants ?? 10 }]
  return {
    title: row.title ?? '',
    tour_type: row.tour_type ?? '',
    custom_category_label: row.custom_category_label ?? undefined,
    duration_days: row.duration_days ?? 1,
    duration: row.duration ?? '1 day',
    location: row.location ?? {},
    destination_cities: row.destination_cities ?? [],
    short_description: row.short_description ?? '',
    description: row.description ?? '',
    price: row.base_price ?? row.price ?? '',
    currency: row.currency ?? 'PKR',
    deposit_percentage: row.deposit_percentage ?? 20,
    cancellation_policy: row.cancellation_policy_type ?? row.cancellation_policy ?? 'moderate',
    inclusions: row.included ?? row.inclusions ?? [],
    exclusions: row.excluded ?? row.exclusions ?? [],
    min_participants: row.min_participants ?? 1,
    max_participants: row.max_participants ?? 10,
    min_age: row.min_age ?? 5,
    max_age: row.max_age ?? 80,
    difficulty_level: row.difficulty_level ?? 'moderate',
    languages: row.languages ?? ['English'],
    images: row.images ?? [],
    itinerary: row.itinerary ?? [],
    pricing_tiers: row.pricing_tiers ?? [],
    schedules,
    draft_data: row.draft_data ?? {},
    is_published: row.is_published ?? false,
  }
}

export default function CreateTourScreen() {
  const { user } = useAuth()
  const theme = useRoleTheme()
  const { id: editId } = useLocalSearchParams<{ id?: string }>()
  const draftClientId = useRef(createDraftClientId())
  const [gate, setGate] = useState<'loading' | 'allowed' | 'blocked'>('loading')
  const [gates, setGates] = useState<OperatorCommercialGates | null>(null)
  const [step, setStep] = useState(0)
  const [tourId, setTourId] = useState<string | null>(null)
  const [publishing, setPublishing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [savingDraft, setSavingDraft] = useState(false)
  const [mapOpen, setMapOpen] = useState(false)

  const [data, setData] = useState<Record<string, any>>({
    duration_days: 1,
    duration: '1 day',
    currency: 'PKR',
    max_participants: 10,
    min_participants: 1,
    min_age: 5,
    max_age: 80,
    deposit_percentage: 20,
    cancellation_policy: 'moderate',
    difficulty_level: 'moderate',
    languages: ['English'],
    images: [],
    itinerary: [],
    schedules: [{ id: createDraftClientId(), date: todayISO(1), time: '09:00', capacity: 10 }],
    inclusions: [],
    exclusions: [],
    location: {},
  })

  const set = (patch: Record<string, any>) => setData((d) => ({ ...d, ...patch }))
  const setLocation = (patch: Record<string, any>) => setData((d) => ({ ...d, location: { ...(d.location || {}), ...patch } }))
  const setSchedule = (patch: Record<string, any>) =>
    setData((d) => ({ ...d, schedules: [{ ...(d.schedules?.[0] || {}), ...patch }] }))
  const toggleArray = (key: string, value: string) =>
    setData((d) => {
      const arr: string[] = d[key] || []
      return { ...d, [key]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value] }
    })

  useEffect(() => {
    if (!user) {
      setGate('blocked')
      return
    }
    let active = true
    ;(async () => {
      try {
        const [profile, commercial] = await Promise.all([
          fetchOperatorGateProfile(user.id),
          fetchOperatorCommercial(user.id),
        ])
        if (!active) return
        setGates(commercial)
        const allowed = hasCompletedTourOperatorSetup(profile, null)
        // Editing an existing tour: load it into the wizard.
        if (allowed && editId) {
          const { data: row } = await supabase
            .from('tours')
            .select('*')
            .eq('id', editId)
            .eq('operator_id', user.id)
            .maybeSingle()
          if (!active) return
          if (row) {
            setData(tourRowToWizardData(row as Record<string, any>))
            setTourId(editId)
            try {
              const media = await listTourMedia(editId)
              if (active) setData((d) => ({ ...d, _media: media }))
            } catch {
              // media list is best-effort
            }
          }
        }
        setGate(allowed ? 'allowed' : 'blocked')
      } catch {
        if (active) setGate('blocked')
      }
    })()
    return () => {
      active = false
    }
  }, [user])

  const saveDraft = async (): Promise<string | null> => {
    if (!user) return null
    const payload = { ...data, draft_data: { ...(data.draft_data || {}), _clientDraftId: draftClientId.current } }
    const res = await saveTourDraft(payload, user.id, tourId, calculateCompletionPercentage(data))
    setTourId(res.tourId)
    return res.tourId
  }

  const persistPickup = async (tid: string) => {
    const p = data._pickup
    const lat = Number(p?.latitude)
    const lng = Number(p?.longitude)
    if (!p?.title?.trim?.() || !Number.isFinite(lat) || !Number.isFinite(lng)) return
    await saveTourPickups(tid, [
      {
        title: String(p.title).trim(),
        formatted_address: p.formatted_address?.trim?.() || `Lat: ${lat}, Lng: ${lng}`,
        city: data.location?.city ?? null,
        country: data.location?.country ?? null,
        latitude: lat,
        longitude: lng,
        google_place_id: null,
        pickup_time: p.pickup_time?.trim?.() || null,
        notes: null,
        is_primary: true,
      },
    ])
  }

  const onNextSaveDraft = async () => {
    setSavingDraft(true)
    try {
      await saveDraft()
    } catch {
      // Non-fatal — drafts retry on the next step / publish.
    } finally {
      setSavingDraft(false)
    }
  }

  const pickImages = async () => {
    if (!user) return
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow photo access to add tour images.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      selectionLimit: 8,
      quality: 0.8,
    })
    if (result.canceled) return
    setUploading(true)
    try {
      const tid = tourId ?? (await saveDraft())
      if (!tid) throw new Error('Could not create a draft to attach photos to.')
      let current = await listTourMedia(tid)
      for (const asset of result.assets) {
        const media = await uploadTourImage({
          tourId: tid,
          operatorId: user.id,
          localUri: asset.uri,
          fileName: asset.fileName ?? undefined,
          mimeType: asset.mimeType ?? undefined,
          sortOrder: current.length,
          makeMain: current.length === 0,
        })
        current = [...current, media]
      }
      const urls = await syncTourImagesFromMedia(tid, user.id)
      set({ images: urls, _media: current })
    } catch (e: any) {
      Alert.alert('Upload failed', e?.message ?? 'Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const removeImage = async (index: number) => {
    if (!user || !tourId) return
    const media = (data._media as Array<{ id: string }>) || []
    const target = media[index]
    if (!target) return
    try {
      await removeTourMedia(tourId, target.id, user.id)
      const remaining = await listTourMedia(tourId)
      set({ images: remaining.map((m) => m.url), _media: remaining })
    } catch (e: any) {
      Alert.alert('Could not remove', e?.message ?? 'Try again.')
    }
  }

  const missingForPublish = useMemo(() => {
    const miss: string[] = []
    if (!data.title?.trim?.()) miss.push('title')
    if (!data.tour_type) miss.push('category')
    if (!data.location?.city) miss.push('city')
    if (!(Number(data.price) > 0)) miss.push('price')
    if (!data.description?.trim?.()) miss.push('description')
    if (!(data.itinerary?.length > 0)) miss.push('itinerary')
    if (!(data.images?.length > 0)) miss.push('at least 1 photo')
    if (!data.schedules?.[0]?.date) miss.push('departure date')
    return miss
  }, [data])

  const handlePublish = async () => {
    if (!user) return
    // Re-publishing an already-published tour doesn't consume the monthly limit.
    const isEditingPublished = Boolean(editId && data.is_published === true)
    if (gates && !gates.canPublishMore && !isEditingPublished) {
      Alert.alert('Publish limit reached', `Your ${gates.tier} tier allows ${gates.monthlyPublishLimit} published tours this cycle.`)
      return
    }
    const minDep = gates?.minimumDepositPercent ?? 20
    if (Number(data.deposit_percentage || 0) < minDep) {
      setStep(3)
      Alert.alert('Deposit too low', `Your tier requires at least a ${minDep}% deposit.`)
      return
    }
    if (missingForPublish.length) {
      Alert.alert('Almost there', `Please add: ${missingForPublish.join(', ')}.`)
      return
    }
    setPublishing(true)
    try {
      const savedId = await saveDraft()
      if (savedId) {
        try {
          await persistPickup(savedId)
        } catch {
          // Pickup is optional — don't block publish on it.
        }
      }
      await publishTour({ ...data }, user.id, savedId)
      Alert.alert('Published 🎉', 'Your tour is now live for travellers.')
      router.replace('/operator/dashboard' as Href)
    } catch (e: any) {
      Alert.alert('Could not publish', parsePublishError(e) ?? e?.message ?? 'Please try again.')
    } finally {
      setPublishing(false)
    }
  }

  const screenTitle = editId ? 'Edit tour' : 'Create a tour'

  // ── Gate states ────────────────────────────────────────────────────────────
  if (gate === 'loading') {
    return (
      <Screen>
        <AppHeader showBack title={screenTitle} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FD5E53" />
        </View>
      </Screen>
    )
  }
  if (gate === 'blocked') {
    return (
      <Screen>
        <AppHeader showBack title={screenTitle} />
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center text-lg font-bold text-ink">Finish your operator setup first</Text>
          <Text className="mt-2 text-center text-sm text-ink-muted">
            Complete your storefront profile to unlock tour creation.
          </Text>
          <View className="mt-5 w-full">
            <Button label="Go to setup" onPress={() => router.replace('/operator/setup' as Href)} />
          </View>
        </View>
      </Screen>
    )
  }

  const itinerary: Array<{ day: number; title?: string; description?: string }> = data.itinerary || []
  const paymentTerms = Number(data.price) > 0
    ? getTourPaymentTerms({ basePrice: Number(data.price), guestCount: 1, depositRequired: true, depositPercentage: Number(data.deposit_percentage || 20) })
    : null

  return (
    <Screen>
      <AppHeader showBack title={screenTitle} subtitle={`${STEP_TITLES[step]} · Step ${step + 1}/${STEP_TITLES.length}`} />

      <View className="mx-5 mb-3 mt-1 flex-row gap-1">
        {STEP_TITLES.map((t, i) => (
          <View key={t} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-primary-700' : 'bg-surface-sunken'}`} />
        ))}
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 28 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* STEP 0 — Basics */}
        {step === 0 ? (
          <View>
            <Field label="Tour title" value={data.title ?? ''} onChange={(v) => set({ title: v })} placeholder="e.g. 3-Day Hunza Valley Adventure" />
            <SectionLabel>Category</SectionLabel>
            <View className="flex-row flex-wrap">
              {TOUR_TYPES.map((t) => (
                <Chip key={t} label={t} active={data.tour_type === t} onPress={() => set({ tour_type: t })} />
              ))}
            </View>
            {data.tour_type === 'Custom' ? (
              <Field label="Custom category" value={data.custom_category_label ?? ''} onChange={(v) => set({ custom_category_label: v })} placeholder="Name your category" />
            ) : null}

            <SectionLabel>Duration (days)</SectionLabel>
            <Stepper value={data.duration_days || 1} min={1} max={60} onChange={(v) => set({ duration_days: v, duration: `${v} day${v !== 1 ? 's' : ''}` })} />

            <View className="mt-2">
              <Field label="Primary city" value={data.location?.city ?? ''} onChange={(v) => setLocation({ city: v })} placeholder="e.g. Gilgit" />
              <Field label="Country" value={data.location?.country ?? ''} onChange={(v) => setLocation({ country: v })} placeholder="e.g. Pakistan" />
            </View>

            <SectionLabel>Group size (max seats)</SectionLabel>
            <Stepper value={data.max_participants || 10} min={1} max={300} onChange={(v) => { set({ max_participants: v }); setSchedule({ capacity: v }) }} />

            <SectionLabel>First departure</SectionLabel>
            <View className="flex-row gap-2">
              <Pressable onPress={() => setSchedule({ date: todayISO(1) })} className="rounded-full border border-line bg-surface px-3 py-1.5">
                <Text className="text-xs font-semibold text-ink">Tomorrow</Text>
              </Pressable>
              <Pressable onPress={() => setSchedule({ date: todayISO(7) })} className="rounded-full border border-line bg-surface px-3 py-1.5">
                <Text className="text-xs font-semibold text-ink">In a week</Text>
              </Pressable>
            </View>
            <View className="mt-2 flex-row gap-3">
              <View className="flex-1">
                <Field label="Date (YYYY-MM-DD)" value={data.schedules?.[0]?.date ?? ''} onChange={(v) => setSchedule({ date: v })} placeholder="2026-07-01" />
              </View>
              <View className="w-32">
                <Field label="Time" value={data.schedules?.[0]?.time ?? '09:00'} onChange={(v) => setSchedule({ time: v })} placeholder="09:00" />
              </View>
            </View>

            <Field label="Short description" value={data.short_description ?? ''} onChange={(v) => set({ short_description: v })} placeholder="One catchy line travellers see first" multiline />
          </View>
        ) : null}

        {/* STEP 1 — Pickup (optional) */}
        {step === 1 ? (
          <View>
            <Text className="text-sm leading-6 text-ink-muted">Add a primary pickup point (optional). Drop a pin on the map or type coordinates.</Text>
            <View className="mt-3">
              <Field label="Pickup name" value={data._pickup?.title ?? ''} onChange={(v) => set({ _pickup: { ...(data._pickup || {}), title: v } })} placeholder="e.g. Main Bus Terminal" />
              <Field label="Address" value={data._pickup?.formatted_address ?? ''} onChange={(v) => set({ _pickup: { ...(data._pickup || {}), formatted_address: v } })} placeholder="Street, area, city" />
              <Pressable
                onPress={() => setMapOpen(true)}
                className="mb-3 flex-row items-center justify-center gap-2 rounded-2xl border border-primary-700 bg-primary-50 py-3"
              >
                <MapPin size={16} color={theme.primary} />
                <Text className="text-sm font-bold text-primary-700">
                  {data._pickup?.latitude ? 'Adjust pin on map' : 'Pick on map'}
                </Text>
              </Pressable>
              <View className="flex-row gap-3">
                <View className="flex-1"><Field label="Latitude" value={data._pickup?.latitude ?? ''} onChange={(v) => set({ _pickup: { ...(data._pickup || {}), latitude: v } })} placeholder="35.92" keyboardType="numbers-and-punctuation" /></View>
                <View className="flex-1"><Field label="Longitude" value={data._pickup?.longitude ?? ''} onChange={(v) => set({ _pickup: { ...(data._pickup || {}), longitude: v } })} placeholder="74.31" keyboardType="numbers-and-punctuation" /></View>
              </View>
              <Field label="Pickup time" value={data._pickup?.pickup_time ?? ''} onChange={(v) => set({ _pickup: { ...(data._pickup || {}), pickup_time: v } })} placeholder="08:30" />
            </View>
            <Text className="mt-1 text-xs text-ink-soft">Pickup is optional for publishing — you can edit it anytime.</Text>
          </View>
        ) : null}

        {/* STEP 2 — Itinerary */}
        {step === 2 ? (
          <View>
            <Text className="text-sm leading-6 text-ink-muted">Add a day-by-day plan. At least one entry is required to publish.</Text>
            {itinerary.map((day, i) => (
              <Card key={i} className="mt-3 p-4">
                <View className="mb-2 flex-row items-center justify-between">
                  <Text className="text-sm font-bold text-ink">Day {day.day ?? i + 1}</Text>
                  <Pressable onPress={() => set({ itinerary: itinerary.filter((_, idx) => idx !== i) })}>
                    <X size={18} color="#94a3b8" />
                  </Pressable>
                </View>
                <Field label="Title" value={day.title ?? ''} onChange={(v) => set({ itinerary: itinerary.map((d, idx) => (idx === i ? { ...d, title: v } : d)) })} placeholder="e.g. Arrival & local bazaar" />
                <Field label="What happens" value={day.description ?? ''} onChange={(v) => set({ itinerary: itinerary.map((d, idx) => (idx === i ? { ...d, description: v } : d)) })} placeholder="Describe the day…" multiline />
              </Card>
            ))}
            <View className="mt-3">
              <Button label="Add a day" variant="secondary" onPress={() => set({ itinerary: [...itinerary, { day: itinerary.length + 1, title: '', description: '' }] })} />
            </View>
          </View>
        ) : null}

        {/* STEP 3 — Pricing */}
        {step === 3 ? (
          <View>
            <Field label="Base price per person" value={data.price ? String(data.price) : ''} onChange={(v) => set({ price: v.replace(/[^0-9.]/g, '') })} placeholder="0" keyboardType="decimal-pad" />
            <SectionLabel>Currency</SectionLabel>
            <View className="flex-row flex-wrap">
              {CURRENCIES.map((c) => <Chip key={c} label={c} active={data.currency === c} onPress={() => set({ currency: c })} />)}
            </View>

            <SectionLabel>Deposit %</SectionLabel>
            <View className="flex-row flex-wrap">
              {[10, 20, 30, 40, 50].filter((p) => p >= (gates?.minimumDepositPercent ?? 20)).map((p) => (
                <Chip key={p} label={`${p}%`} active={Number(data.deposit_percentage) === p} onPress={() => set({ deposit_percentage: p })} />
              ))}
            </View>
            {gates ? <Text className="-mt-1 mb-1 text-xs text-ink-soft">Your {gates.tier} tier minimum is {gates.minimumDepositPercent}%.</Text> : null}

            <SectionLabel>Cancellation policy</SectionLabel>
            <View className="flex-row flex-wrap">
              {CANCELLATION.map((c) => <Chip key={c.id} label={c.label} active={data.cancellation_policy === c.id} onPress={() => set({ cancellation_policy: c.id })} />)}
            </View>

            {paymentTerms ? (
              <Card className="mt-2 p-4">
                <Text className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Traveller pays</Text>
                <View className="mt-2 flex-row items-center justify-between">
                  <Text className="text-sm text-ink-muted">Due now (deposit)</Text>
                  <Text className="text-sm font-bold text-ink">{data.currency} {Math.round(paymentTerms.upfrontAmount).toLocaleString()}</Text>
                </View>
                <View className="mt-1 flex-row items-center justify-between">
                  <Text className="text-sm text-ink-muted">Balance later</Text>
                  <Text className="text-sm font-bold text-ink">{data.currency} {Math.round(paymentTerms.remainingAmount).toLocaleString()}</Text>
                </View>
              </Card>
            ) : null}

            <SectionLabel>What's included</SectionLabel>
            <View className="flex-row flex-wrap">
              {INCLUDED_FEATURE_OPTIONS.map((o) => <Chip key={o.label} label={o.label} active={(data.inclusions || []).includes(o.label)} onPress={() => toggleArray('inclusions', o.label)} />)}
            </View>
            <SectionLabel>What's excluded</SectionLabel>
            <View className="flex-row flex-wrap">
              {EXCLUDED_FEATURE_OPTIONS.map((o) => <Chip key={o.label} label={o.label} active={(data.exclusions || []).includes(o.label)} onPress={() => toggleArray('exclusions', o.label)} />)}
            </View>
          </View>
        ) : null}

        {/* STEP 4 — Details */}
        {step === 4 ? (
          <View>
            <SectionLabel>Difficulty</SectionLabel>
            <View className="flex-row flex-wrap">
              {DIFFICULTY.map((d) => <Chip key={d.id} label={d.label} active={data.difficulty_level === d.id} onPress={() => set({ difficulty_level: d.id })} />)}
            </View>
            <View className="mt-1 flex-row gap-3">
              <View className="flex-1"><Field label="Min age" value={String(data.min_age ?? 5)} onChange={(v) => set({ min_age: Number(v.replace(/[^0-9]/g, '')) || 0 })} placeholder="5" keyboardType="number-pad" /></View>
              <View className="flex-1"><Field label="Max age" value={String(data.max_age ?? 80)} onChange={(v) => set({ max_age: Number(v.replace(/[^0-9]/g, '')) || 0 })} placeholder="80" keyboardType="number-pad" /></View>
            </View>
            <SectionLabel>Languages</SectionLabel>
            <View className="flex-row flex-wrap">
              {LANGUAGES.map((l) => <Chip key={l} label={l} active={(data.languages || []).includes(l)} onPress={() => toggleArray('languages', l)} />)}
            </View>
            <Field label="Full description" value={data.description ?? ''} onChange={(v) => set({ description: v })} placeholder="Everything a traveller should know about this tour…" multiline />
          </View>
        ) : null}

        {/* STEP 5 — Photos */}
        {step === 5 ? (
          <View>
            <Text className="text-sm leading-6 text-ink-muted">Add at least one photo. The first becomes the cover.</Text>
            <View className="mt-3 flex-row flex-wrap gap-3">
              {(data.images || []).map((uri: string, i: number) => (
                <View key={uri + i} className="relative">
                  <Image source={{ uri }} style={{ width: 100, height: 100, borderRadius: 14 }} />
                  {i === 0 ? (
                    <View className="absolute left-1 top-1 flex-row items-center rounded-full bg-black/60 px-2 py-0.5">
                      <Star size={10} color="#fbbf24" fill="#fbbf24" />
                      <Text className="ml-1 text-[10px] font-bold text-white">Cover</Text>
                    </View>
                  ) : null}
                  <Pressable onPress={() => removeImage(i)} className="absolute -right-2 -top-2 h-6 w-6 items-center justify-center rounded-full bg-ink">
                    <X size={13} color="#ffffff" />
                  </Pressable>
                </View>
              ))}
              <Pressable onPress={pickImages} disabled={uploading} className="h-[100px] w-[100px] items-center justify-center rounded-2xl border border-dashed border-line bg-surface-sunken">
                {uploading ? <ActivityIndicator color="#FD5E53" /> : <Plus size={26} color="#94a3b8" />}
              </Pressable>
            </View>
          </View>
        ) : null}

        {/* STEP 6 — Review */}
        {step === 6 ? (
          <View>
            <Card className="p-4">
              <Row label="Title" value={data.title || '—'} />
              <Row label="Category" value={data.tour_type || '—'} />
              <Row label="City" value={data.location?.city || '—'} />
              <Row label="Duration" value={data.duration || '—'} />
              <Row label="Price" value={Number(data.price) > 0 ? `${data.currency} ${Number(data.price).toLocaleString()}` : '—'} />
              <Row label="Photos" value={String((data.images || []).length)} />
              <Row label="Itinerary" value={`${(data.itinerary || []).length} day(s)`} last />
            </Card>
            {missingForPublish.length ? (
              <Text className="mt-3 text-xs leading-5 text-danger">Add before publishing: {missingForPublish.join(', ')}.</Text>
            ) : (
              <Text className="mt-3 text-xs leading-5 text-ink-soft">Publishing makes this tour live for travellers immediately. You can edit it anytime.</Text>
            )}
          </View>
        ) : null}
      </ScrollView>

      {/* Footer nav */}
      <View className="flex-row gap-3 px-5 pb-3 pt-2">
        {step > 0 ? (
          <View className="flex-1">
            <Button label="Back" variant="secondary" disabled={publishing} onPress={() => setStep((s) => Math.max(0, s - 1))} />
          </View>
        ) : null}
        <View className="flex-[2]">
          {step === LAST ? (
            <Button label={editId && data.is_published ? 'Save & publish' : 'Publish tour'} loading={publishing} gradient onPress={handlePublish} />
          ) : (
            <Button
              label="Continue"
              loading={savingDraft}
              onPress={async () => {
                if (step === 0 && (!data.title?.trim?.() || !data.tour_type || !data.location?.city || !data.schedules?.[0]?.date)) {
                  Alert.alert('A few basics first', 'Add a title, category, city, and departure date to continue.')
                  return
                }
                await onNextSaveDraft()
                setStep((s) => Math.min(LAST, s + 1))
              }}
            />
          )}
        </View>
      </View>

      <LocationPickerModal
        visible={mapOpen}
        title="Pickup location"
        initial={
          Number.isFinite(Number(data._pickup?.latitude)) && Number.isFinite(Number(data._pickup?.longitude)) && data._pickup?.latitude
            ? { lat: Number(data._pickup.latitude), lng: Number(data._pickup.longitude) }
            : null
        }
        onClose={() => setMapOpen(false)}
        onConfirm={(loc) =>
          set({
            _pickup: {
              ...(data._pickup || {}),
              latitude: String(loc.lat.toFixed(6)),
              longitude: String(loc.lng.toFixed(6)),
            },
          })
        }
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
