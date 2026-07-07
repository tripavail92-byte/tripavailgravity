import { useQuery, useQueryClient } from '@tanstack/react-query'
import { type Href, router } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Text, View } from 'react-native'
import * as ImagePicker from 'expo-image-picker'

import { Bus, Plus, Star, Users, X } from '@/components/icons/lucide'
import { Field, ReviewRow, SectionLabel, Stepper } from '@/components/ui/FormKit'
import { AppHeader, Button, Card, EmptyState, Screen } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { useRoleTheme, useThemeColors } from '@/theme'
import {
  EMPTY_POLICIES,
  type FleetAsset,
  type GalleryItem,
  type GuideProfile,
  fetchStorefront,
  newId,
  saveStorefront,
  type StorefrontData,
  storefrontCompleteness,
  uploadGalleryImage,
} from '@/lib/operatorStorefront'

const GALLERY_CATEGORIES: GalleryItem['category'][] = [
  'operator',
  'vehicle',
  'traveler',
  'accommodation',
  'food',
]

const POLICY_FIELDS: Array<{ key: keyof typeof EMPTY_POLICIES; label: string; placeholder: string }> = [
  { key: 'cancellation', label: 'Cancellation policy', placeholder: 'Free cancellation up to…' },
  { key: 'deposit', label: 'Deposit policy', placeholder: 'Deposit % and when the balance is due' },
  { key: 'pickup', label: 'Pickup rules', placeholder: 'Where and when travellers are picked up' },
  { key: 'child', label: 'Child policy', placeholder: 'Age limits, child pricing' },
  { key: 'refund', label: 'Refund policy', placeholder: 'How and when refunds are issued' },
  { key: 'weather', label: 'Weather disruption', placeholder: 'What happens if weather cancels a departure' },
  { key: 'emergency', label: 'Emergency contact', placeholder: 'How travellers reach you en route' },
  { key: 'supportHours', label: 'Support hours', placeholder: 'e.g. 9:00–21:00 PKT, 7 days' },
]

function splitComma(v: string): string[] {
  return v
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

export default function OperatorStorefrontScreen() {
  const { user } = useAuth()
  const theme = useRoleTheme()
  const c = useThemeColors()
  const queryClient = useQueryClient()

  const [form, setForm] = useState<StorefrontData | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [fleetOpen, setFleetOpen] = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)
  const [fleetDraft, setFleetDraft] = useState<FleetAsset | null>(null)
  const [guideDraft, setGuideDraft] = useState<{
    name: string
    yearsExperience: string
    languages: string
    specialties: string
    certifications: string
    bio: string
  } | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['operator', 'storefront', user?.id],
    queryFn: () => fetchStorefront(user!.id),
    enabled: !!user,
  })

  useEffect(() => {
    if (data && !form) setForm(data)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  if (!user) {
    return (
      <Screen>
        <AppHeader showBack title="Business profile" />
        <EmptyState icon="person-circle-outline" title="Sign in" description="Sign in to edit your storefront.">
          <Button label="Sign In" onPress={() => router.push('/(auth)/login')} />
        </EmptyState>
      </Screen>
    )
  }

  if (isLoading || !form) {
    return (
      <Screen>
        <AppHeader showBack title="Business profile" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </Screen>
    )
  }

  const set = (patch: Partial<StorefrontData>) => setForm((f) => (f ? { ...f, ...patch } : f))
  const completeness = storefrontCompleteness(form)

  const save = async () => {
    setSaving(true)
    try {
      await saveStorefront(user.id, form)
      queryClient.invalidateQueries({ queryKey: ['operator', 'storefront'] })
      Alert.alert('Storefront saved', 'Your public business profile has been updated.')
    } catch (e: any) {
      Alert.alert('Could not save', e?.message ?? 'Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const addGalleryPhotos = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow photo access to add gallery images.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      selectionLimit: 6,
      quality: 0.8,
    })
    if (result.canceled) return
    setUploading(true)
    try {
      const added: GalleryItem[] = []
      for (const a of result.assets) {
        const url = await uploadGalleryImage(user.id, a.uri)
        added.push({ id: newId(), url, title: '', category: 'operator' })
      }
      set({ galleryMedia: [...form.galleryMedia, ...added] })
    } catch (e: any) {
      Alert.alert('Upload failed', e?.message ?? 'Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const saveFleetDraft = () => {
    if (!fleetDraft) return
    if (!fleetDraft.type.trim() && !fleetDraft.name.trim()) {
      Alert.alert('Add details', 'Give the asset at least a type or name.')
      return
    }
    const exists = form.fleetAssets.some((a) => a.id === fleetDraft.id)
    set({
      fleetAssets: exists
        ? form.fleetAssets.map((a) => (a.id === fleetDraft.id ? fleetDraft : a))
        : [...form.fleetAssets, fleetDraft],
    })
    setFleetDraft(null)
    setFleetOpen(false)
  }

  const saveGuideDraft = () => {
    if (!guideDraft) return
    if (!guideDraft.name.trim()) {
      Alert.alert('Add a name', 'Each guide needs a name.')
      return
    }
    const guide: GuideProfile = {
      id: newId(),
      name: guideDraft.name.trim(),
      yearsExperience: guideDraft.yearsExperience ? Math.max(0, Number(guideDraft.yearsExperience) || 0) : null,
      languages: splitComma(guideDraft.languages),
      specialties: splitComma(guideDraft.specialties),
      certifications: splitComma(guideDraft.certifications),
      bio: guideDraft.bio.trim(),
    }
    set({ guideProfiles: [...form.guideProfiles, guide] })
    setGuideDraft(null)
    setGuideOpen(false)
  }

  return (
    <Screen>
      <AppHeader showBack title="Business profile" subtitle="Your public storefront" />
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 36 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Completeness */}
        <Card className="p-4">
          <View className="flex-row items-end justify-between">
            <Text className="text-base font-bold text-ink">
              Profile completeness — {completeness.done}/{completeness.total} sections
            </Text>
            <Text className="text-base font-black text-primary-700">{completeness.percent}%</Text>
          </View>
          <View className="mt-2 h-2 overflow-hidden rounded-full bg-surface-sunken">
            <View className="h-full rounded-full bg-primary-700" style={{ width: `${completeness.percent}%` }} />
          </View>
          {completeness.missing.length ? (
            <Text className="mt-2 text-xs leading-5 text-ink-soft">
              Completing more sections improves your marketplace ranking and traveller trust. Missing:{' '}
              {completeness.missing.join(', ')}.
            </Text>
          ) : (
            <Text className="mt-2 text-xs text-success">All sections complete — great storefront!</Text>
          )}
        </Card>

        {/* Business identity (from setup) */}
        <SectionLabel>Business identity</SectionLabel>
        <Card className="p-4">
          <ReviewRow label="Business name" value={form.businessName || 'Not set'} />
          <ReviewRow label="Primary city" value={form.primaryCity || 'Not set'} />
          <ReviewRow label="Support phone" value={form.phoneNumber || 'Not set'} />
          <ReviewRow label="Support email" value={form.email || 'Not set'} last />
          <Pressable onPress={() => router.push('/operator/setup' as Href)} className="mt-2">
            <Text className="text-sm font-bold text-primary-700">Edit in Setup →</Text>
          </Pressable>
        </Card>

        {/* Public description */}
        <SectionLabel>Public description</SectionLabel>
        <Card className="p-4">
          <Field
            label="Tell travellers who you are"
            value={form.description}
            onChange={(v) => set({ description: v })}
            placeholder="Your story, terrain expertise, what makes your trips special…"
            multiline
          />
        </Card>

        {/* Fleet */}
        <SectionLabel>Fleet assets</SectionLabel>
        <Card className="p-4">
          {form.fleetAssets.length === 0 && !fleetOpen ? (
            <Text className="text-sm text-ink-soft">
              List transport or equipment travellers can inspect before booking.
            </Text>
          ) : null}
          {form.fleetAssets.map((a) => (
            <View key={a.id} className="mb-2 flex-row items-center rounded-2xl border border-line bg-surface-sunken p-3">
              <Bus size={18} color={theme.primary} />
              <View className="ml-3 flex-1">
                <Text className="font-semibold text-ink" numberOfLines={1}>
                  {a.name || a.type}
                </Text>
                <Text className="text-xs text-ink-soft" numberOfLines={1}>
                  {a.quantity}× {a.type}
                  {a.capacity ? ` · seats ${a.capacity}` : ''}
                  {a.details ? ` · ${a.details}` : ''}
                </Text>
              </View>
              <Pressable onPress={() => set({ fleetAssets: form.fleetAssets.filter((x) => x.id !== a.id) })} hitSlop={8}>
                <X size={16} color={c.inkSoft} />
              </Pressable>
            </View>
          ))}
          {fleetOpen && fleetDraft ? (
            <View className="mt-1 rounded-2xl border border-line p-3">
              <Field label="Vehicle / asset type" value={fleetDraft.type} onChange={(v) => setFleetDraft({ ...fleetDraft, type: v })} placeholder="e.g. 4x4 Land Cruiser" />
              <Field label="Name / model" value={fleetDraft.name} onChange={(v) => setFleetDraft({ ...fleetDraft, name: v })} placeholder="e.g. Prado 2021" />
              <View className="mb-2 flex-row items-center justify-between">
                <Text className="text-[15px] font-medium text-ink">Quantity</Text>
                <Stepper value={fleetDraft.quantity} onChange={(v) => setFleetDraft({ ...fleetDraft, quantity: v })} min={1} max={99} />
              </View>
              <View className="mb-2 flex-row items-center justify-between">
                <Text className="text-[15px] font-medium text-ink">Capacity (seats)</Text>
                <Stepper value={fleetDraft.capacity ?? 0} onChange={(v) => setFleetDraft({ ...fleetDraft, capacity: v || null })} min={0} max={99} />
              </View>
              <Field label="Details" value={fleetDraft.details} onChange={(v) => setFleetDraft({ ...fleetDraft, details: v })} placeholder="AC, owned fleet, rooftop carrier, camping gear…" multiline />
              <View className="flex-row gap-3">
                <View className="flex-1"><Button label="Cancel" variant="secondary" onPress={() => { setFleetOpen(false); setFleetDraft(null) }} /></View>
                <View className="flex-1"><Button label="Add asset" onPress={saveFleetDraft} /></View>
              </View>
            </View>
          ) : (
            <Pressable
              onPress={() => {
                setFleetDraft({ id: newId(), type: '', name: '', quantity: 1, capacity: null, details: '' })
                setFleetOpen(true)
              }}
              className="mt-1 flex-row items-center justify-center gap-2 rounded-2xl border border-dashed border-line py-3"
            >
              <Plus size={16} color={theme.primary} />
              <Text className="text-sm font-bold text-primary-700">Add asset</Text>
            </Pressable>
          )}
        </Card>

        {/* Guides */}
        <SectionLabel>Guide team</SectionLabel>
        <Card className="p-4">
          {form.guideProfiles.length === 0 && !guideOpen ? (
            <Text className="text-sm text-ink-soft">
              Highlight languages, specialties, and certifications that build traveller trust.
            </Text>
          ) : null}
          {form.guideProfiles.map((g) => (
            <View key={g.id} className="mb-2 flex-row items-center rounded-2xl border border-line bg-surface-sunken p-3">
              <Users size={18} color={theme.primary} />
              <View className="ml-3 flex-1">
                <Text className="font-semibold text-ink" numberOfLines={1}>
                  {g.name}
                  {g.yearsExperience ? `  ·  ${g.yearsExperience} yrs` : ''}
                </Text>
                <Text className="text-xs text-ink-soft" numberOfLines={1}>
                  {[g.languages.join('/'), g.specialties.join(', ')].filter(Boolean).join(' · ') || 'No details yet'}
                </Text>
              </View>
              <Pressable onPress={() => set({ guideProfiles: form.guideProfiles.filter((x) => x.id !== g.id) })} hitSlop={8}>
                <X size={16} color={c.inkSoft} />
              </Pressable>
            </View>
          ))}
          {guideOpen && guideDraft ? (
            <View className="mt-1 rounded-2xl border border-line p-3">
              <Field label="Guide name" value={guideDraft.name} onChange={(v) => setGuideDraft({ ...guideDraft, name: v })} placeholder="Full name" />
              <Field label="Years of experience" value={guideDraft.yearsExperience} onChange={(v) => setGuideDraft({ ...guideDraft, yearsExperience: v })} placeholder="e.g. 8" keyboardType="number-pad" />
              <Field label="Languages (comma-separated)" value={guideDraft.languages} onChange={(v) => setGuideDraft({ ...guideDraft, languages: v })} placeholder="Urdu, English" />
              <Field label="Specialties" value={guideDraft.specialties} onChange={(v) => setGuideDraft({ ...guideDraft, specialties: v })} placeholder="High-altitude trekking, family trips" />
              <Field label="Certifications" value={guideDraft.certifications} onChange={(v) => setGuideDraft({ ...guideDraft, certifications: v })} placeholder="First aid, mountain rescue" />
              <Field label="Short bio" value={guideDraft.bio} onChange={(v) => setGuideDraft({ ...guideDraft, bio: v })} placeholder="Terrain expertise, traveller care…" multiline />
              <View className="flex-row gap-3">
                <View className="flex-1"><Button label="Cancel" variant="secondary" onPress={() => { setGuideOpen(false); setGuideDraft(null) }} /></View>
                <View className="flex-1"><Button label="Add guide" onPress={saveGuideDraft} /></View>
              </View>
            </View>
          ) : (
            <Pressable
              onPress={() => {
                setGuideDraft({ name: '', yearsExperience: '', languages: '', specialties: '', certifications: '', bio: '' })
                setGuideOpen(true)
              }}
              className="mt-1 flex-row items-center justify-center gap-2 rounded-2xl border border-dashed border-line py-3"
            >
              <Plus size={16} color={theme.primary} />
              <Text className="text-sm font-bold text-primary-700">Add guide</Text>
            </Pressable>
          )}
        </Card>

        {/* Gallery */}
        <SectionLabel>Gallery & media</SectionLabel>
        <Card className="p-4">
          <Text className="text-sm text-ink-soft">
            Public photos that strengthen trust and unlock showcase awards.
          </Text>
          <View className="mt-3 flex-row flex-wrap gap-3">
            {form.galleryMedia.map((g) => (
              <View key={g.id} className="relative">
                <Image source={{ uri: g.url }} style={{ width: 96, height: 96, borderRadius: 14 }} />
                <Pressable
                  onPress={() => set({ galleryMedia: form.galleryMedia.filter((x) => x.id !== g.id) })}
                  className="absolute -right-2 -top-2 h-6 w-6 items-center justify-center rounded-full bg-ink"
                >
                  <X size={13} color="#ffffff" />
                </Pressable>
              </View>
            ))}
            <Pressable
              onPress={addGalleryPhotos}
              disabled={uploading}
              className="h-24 w-24 items-center justify-center rounded-2xl border border-dashed border-line bg-surface-sunken"
            >
              {uploading ? <ActivityIndicator color={theme.primary} /> : <Plus size={24} color={c.inkSoft} />}
            </Pressable>
          </View>
        </Card>

        {/* Policies */}
        <SectionLabel>Public policies</SectionLabel>
        <Card className="p-4">
          <Text className="mb-2 text-sm text-ink-soft">
            Shown on your public page for pre-booking trust.
          </Text>
          {POLICY_FIELDS.map((p) => (
            <Field
              key={p.key}
              label={p.label}
              value={form.publicPolicies[p.key]}
              onChange={(v) => set({ publicPolicies: { ...form.publicPolicies, [p.key]: v } })}
              placeholder={p.placeholder}
              multiline
            />
          ))}
        </Card>

        <View className="mt-6">
          <Button label="Save storefront" gradient loading={saving} onPress={save} />
        </View>
        {form.slug ? (
          <Pressable className="mt-3" onPress={() => router.push(`/operators/${form.slug}` as Href)}>
            <View className="flex-row items-center justify-center gap-1.5">
              <Star size={13} color={theme.primary} />
              <Text className="text-sm font-bold text-primary-700">View public profile</Text>
            </View>
          </Pressable>
        ) : null}
      </ScrollView>
    </Screen>
  )
}
