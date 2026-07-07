import { router, type Href } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, ScrollView, Text, View } from 'react-native'

import { Field, ReviewRow, WizardProgress } from '@/components/ui/FormKit'
import { AppHeader, Button, Card, Screen } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { getManagerSetup, saveManagerSetup, type ManagerSetupData } from '@/lib/managerSetup'

const EMPTY: ManagerSetupData = { bankName: '', accountHolder: '', accountNumber: '', routingNumber: '' }
const STEP_TITLES = ['Welcome', 'Payout details', 'Review']
const LAST = STEP_TITLES.length - 1

export default function ManagerSetupScreen() {
  const { user } = useAuth()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<ManagerSetupData>(EMPTY)
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
        const existing = await getManagerSetup(user.id)
        if (!active) return
        if (existing) {
          setForm({ ...EMPTY, ...existing })
          const r = existing.setupCurrentStep ?? 0
          setStep(r > 0 ? Math.min(r, LAST) : 0)
        }
      } catch {
        // start fresh
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [user])

  const set = (patch: Partial<ManagerSetupData>) => setForm((f) => ({ ...f, ...patch }))

  const persist = async (completed: boolean, nextStep?: number): Promise<boolean> => {
    if (!user) return false
    setSaving(true)
    try {
      await saveManagerSetup(user.id, form, completed, nextStep)
      return true
    } catch (e: any) {
      Alert.alert('Could not save', e?.message ?? 'Please try again.')
      return false
    } finally {
      setSaving(false)
    }
  }

  const next = async () => {
    const n = step + 1
    if (await persist(false, n)) setStep(n)
  }
  const finish = async () => {
    if (await persist(true)) {
      Alert.alert('All set', 'Your manager profile is ready. List your first property to go live.')
      router.replace('/manager/dashboard' as Href)
    }
  }

  if (!user) {
    return (
      <Screen>
        <AppHeader showBack title="Manager setup" />
        <View className="p-6">
          <Text className="text-ink-muted">Please sign in to set up your manager profile.</Text>
        </View>
      </Screen>
    )
  }
  if (loading) {
    return (
      <Screen>
        <AppHeader showBack title="Manager setup" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#9D4EDD" />
        </View>
      </Screen>
    )
  }

  return (
    <Screen>
      <AppHeader showBack title="Manager setup" subtitle={`Step ${step + 1} of ${STEP_TITLES.length}`} />
      <WizardProgress steps={STEP_TITLES} current={step} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 24 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text className="text-2xl font-black text-ink">{STEP_TITLES[step]}</Text>

        {step === 0 ? (
          <Text className="mt-2 text-sm leading-6 text-ink-muted">
            Welcome aboard! Add your payout details so we can send your earnings, then list your first
            property to go live. You can edit this anytime.
          </Text>
        ) : null}

        {step === 1 ? (
          <View className="mt-4">
            <Field label="Bank name" value={form.bankName} onChange={(v) => set({ bankName: v })} placeholder="e.g. HBL" />
            <Field label="Account holder" value={form.accountHolder} onChange={(v) => set({ accountHolder: v })} placeholder="Full name on the account" />
            <Field label="Account / IBAN" value={form.accountNumber} onChange={(v) => set({ accountNumber: v })} placeholder="Account number or IBAN" />
            <Field label="Swift / Routing (optional)" value={form.routingNumber} onChange={(v) => set({ routingNumber: v })} placeholder="SWIFT/BIC or routing" />
          </View>
        ) : null}

        {step === 2 ? (
          <View className="mt-4">
            <Card className="p-4">
              <ReviewRow label="Bank" value={form.bankName || '—'} />
              <ReviewRow label="Holder" value={form.accountHolder || '—'} />
              <ReviewRow label="Account" value={form.accountNumber ? `••••${form.accountNumber.slice(-4)}` : '—'} last />
            </Card>
            <Text className="mt-3 text-xs leading-5 text-ink-soft">Payouts are sent here once travellers complete bookings. Next: list a property.</Text>
          </View>
        ) : null}
      </ScrollView>

      <View className="flex-row gap-3 px-5 pb-3 pt-2">
        {step > 0 ? (
          <View className="flex-1">
            <Button label="Back" variant="secondary" disabled={saving} onPress={() => setStep((s) => Math.max(0, s - 1))} />
          </View>
        ) : null}
        <View className="flex-1">
          {step === LAST ? (
            <Button label="Finish" loading={saving} onPress={finish} />
          ) : (
            <Button label={step === 0 ? "Let's go" : 'Continue'} loading={saving} onPress={next} />
          )}
        </View>
      </View>
    </Screen>
  )
}
