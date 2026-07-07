import { router, type Href } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  type KeyboardTypeOptions,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native'

import { AppHeader, Button, Card, Screen } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import {
  COVERAGE_RADII,
  OPERATOR_CATEGORIES,
  getOperatorSetup,
  saveOperatorSetup,
  type OperatorSetupData,
} from '@/lib/operatorSetup'

const EMPTY: OperatorSetupData = {
  operatorName: '',
  contactPerson: '',
  phone: '',
  email: '',
  businessName: '',
  description: '',
  yearsInBusiness: '',
  teamSize: '',
  registrationNumber: '',
  categories: [],
  primaryCity: '',
  radii: [],
}

const STEP_TITLES = ['Welcome', 'Your details', 'Your business', 'What you offer', 'Where you operate', 'Review & finish']
const LAST = STEP_TITLES.length - 1

function Field({
  label,
  value,
  onChange,
  placeholder,
  multiline,
  keyboardType,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  multiline?: boolean
  keyboardType?: KeyboardTypeOptions
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
          autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
          className="py-3 text-base text-ink"
          style={multiline ? { minHeight: 92, textAlignVertical: 'top' } : undefined}
        />
      </View>
    </View>
  )
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className={`rounded-full border px-4 py-2 ${active ? 'border-primary-700 bg-primary-700' : 'border-line bg-surface'}`}
    >
      <Text className={`text-sm font-semibold ${active ? 'text-white' : 'text-ink'}`}>{label}</Text>
    </Pressable>
  )
}

function ReviewRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View className={`flex-row items-center justify-between py-2.5 ${last ? '' : 'border-b border-line'}`}>
      <Text className="text-sm text-ink-muted">{label}</Text>
      <Text className="flex-1 text-right text-sm font-semibold text-ink" numberOfLines={1}>
        {value}
      </Text>
    </View>
  )
}

export default function OperatorSetupScreen() {
  const { user } = useAuth()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<OperatorSetupData>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    let active = true
    ;(async () => {
      try {
        const existing = await getOperatorSetup(user.id)
        if (!active) return
        if (existing) {
          setForm({ ...EMPTY, ...existing })
          const resume = existing.setupCurrentStep ?? 0
          setStep(resume > 0 ? Math.min(resume, LAST) : 0)
        } else {
          setForm((f) => ({
            ...f,
            operatorName: user.user_metadata?.full_name ?? '',
            email: user.email ?? '',
          }))
        }
      } catch {
        // Start fresh on any read error.
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [user])

  const set = (patch: Partial<OperatorSetupData>) => setForm((f) => ({ ...f, ...patch }))
  const toggle = (key: 'categories' | 'radii', value: string) =>
    setForm((f) => ({
      ...f,
      [key]: f[key].includes(value) ? f[key].filter((v) => v !== value) : [...f[key], value],
    }))

  const persist = async (completed: boolean, nextStep?: number): Promise<boolean> => {
    if (!user) return false
    setSaving(true)
    try {
      await saveOperatorSetup(user.id, form, completed, nextStep)
      return true
    } catch (e: any) {
      Alert.alert('Could not save', e?.message ?? 'Please try again.')
      return false
    } finally {
      setSaving(false)
    }
  }

  const next = async () => {
    if (step === 2 && !form.businessName.trim()) {
      Alert.alert('Company name needed', 'Travellers need to see who runs the tour.')
      return
    }
    const n = step + 1
    if (await persist(false, n)) setStep(n)
  }

  const back = () => setStep((s) => Math.max(0, s - 1))

  const finish = async () => {
    if (!form.businessName.trim()) {
      setStep(2)
      Alert.alert('Company name needed', 'Add your business name to finish.')
      return
    }
    if (await persist(true)) {
      Alert.alert('Setup complete', 'Your operator profile is live. You can now create tours.')
      router.replace('/operator/dashboard' as Href)
    }
  }

  if (!user) {
    return (
      <Screen>
        <AppHeader showBack title="Operator setup" />
        <View className="p-6">
          <Text className="text-ink-muted">Please sign in to set up your operator profile.</Text>
        </View>
      </Screen>
    )
  }

  if (loading) {
    return (
      <Screen>
        <AppHeader showBack title="Operator setup" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FD5E53" />
        </View>
      </Screen>
    )
  }

  return (
    <Screen>
      <AppHeader showBack title="Operator setup" subtitle={`Step ${step + 1} of ${STEP_TITLES.length}`} />

      {/* Progress */}
      <View className="mx-5 mb-3 mt-1 flex-row gap-1">
        {STEP_TITLES.map((t, i) => (
          <View key={t} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-primary-700' : 'bg-surface-sunken'}`} />
        ))}
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 24 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text className="text-2xl font-black text-ink">{STEP_TITLES[step]}</Text>

        {step === 0 ? (
          <Text className="mt-2 text-sm leading-6 text-ink-muted">
            Let's build your operator profile. This becomes your public storefront and unlocks tour
            creation. Takes about 2 minutes — you can edit anytime, and your progress saves as you go.
          </Text>
        ) : null}

        {step === 1 ? (
          <View className="mt-4">
            <Field label="Your name" value={form.operatorName} onChange={(v) => set({ operatorName: v })} placeholder="e.g. Ali Khan" />
            <Field label="Contact person" value={form.contactPerson} onChange={(v) => set({ contactPerson: v })} placeholder="Who travellers reach out to" />
            <Field label="Phone" value={form.phone} onChange={(v) => set({ phone: v })} placeholder="+92 3xx xxxxxxx" keyboardType="phone-pad" />
            <Field label="Email" value={form.email} onChange={(v) => set({ email: v })} placeholder="you@company.com" keyboardType="email-address" />
          </View>
        ) : null}

        {step === 2 ? (
          <View className="mt-4">
            <Field label="Company name" value={form.businessName} onChange={(v) => set({ businessName: v })} placeholder="Your business name" />
            <Field label="About your company" value={form.description} onChange={(v) => set({ description: v })} placeholder="What makes your tours special…" multiline />
            <Field label="Years in business" value={form.yearsInBusiness} onChange={(v) => set({ yearsInBusiness: v })} placeholder="e.g. 5" keyboardType="number-pad" />
            <Field label="Team size" value={form.teamSize} onChange={(v) => set({ teamSize: v })} placeholder="e.g. 8" keyboardType="number-pad" />
            <Field label="Registration number (optional)" value={form.registrationNumber} onChange={(v) => set({ registrationNumber: v })} placeholder="Business reg. no." />
          </View>
        ) : null}

        {step === 3 ? (
          <View className="mt-4">
            <Text className="mb-3 text-sm text-ink-muted">Pick the kinds of experiences you run.</Text>
            <View className="flex-row flex-wrap gap-2">
              {OPERATOR_CATEGORIES.map((c) => (
                <Chip key={c.id} label={c.label} active={form.categories.includes(c.id)} onPress={() => toggle('categories', c.id)} />
              ))}
            </View>
          </View>
        ) : null}

        {step === 4 ? (
          <View className="mt-4">
            <Field label="Primary city" value={form.primaryCity} onChange={(v) => set({ primaryCity: v })} placeholder="e.g. Islamabad" />
            <Text className="mb-2 mt-2 text-sm text-ink-muted">How far do you cover?</Text>
            <View className="flex-row flex-wrap gap-2">
              {COVERAGE_RADII.map((r) => (
                <Chip key={r} label={r} active={form.radii.includes(r)} onPress={() => toggle('radii', r)} />
              ))}
            </View>
          </View>
        ) : null}

        {step === 5 ? (
          <View className="mt-4">
            <Card className="p-4">
              <ReviewRow label="Company" value={form.businessName || '—'} />
              <ReviewRow label="Contact" value={form.operatorName || '—'} />
              <ReviewRow label="Phone" value={form.phone || '—'} />
              <ReviewRow label="City" value={form.primaryCity || '—'} />
              <ReviewRow label="Offers" value={form.categories.length ? `${form.categories.length} categories` : '—'} last />
            </Card>
            <Text className="mt-3 text-xs leading-5 text-ink-soft">
              Finishing creates your public storefront and unlocks tour creation. Identity verification
              (KYC) is a separate step required before payouts.
            </Text>
          </View>
        ) : null}
      </ScrollView>

      {/* Footer nav */}
      <View className="flex-row gap-3 px-5 pb-3 pt-2">
        {step > 0 ? (
          <View className="flex-1">
            <Button label="Back" variant="secondary" onPress={back} disabled={saving} />
          </View>
        ) : null}
        <View className="flex-1">
          {step === LAST ? (
            <Button label="Finish setup" loading={saving} onPress={finish} />
          ) : (
            <Button label={step === 0 ? "Let's go" : 'Continue'} loading={saving} onPress={next} />
          )}
        </View>
      </View>
    </Screen>
  )
}
