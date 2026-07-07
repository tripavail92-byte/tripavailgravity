import { useQuery, useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, ScrollView, Text, View } from 'react-native'

import { Field, Segmented, SectionLabel, Stepper, ToggleRow } from '@/components/ui/FormKit'
import { AppHeader, Button, Card, EmptyState, Screen } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { useRoleTheme } from '@/theme'
import {
  fetchManagerSettings,
  saveManagerSettings,
  type ManagerSettings,
} from '@/lib/roleSettings'

export default function ManagerSettingsScreen() {
  const { user } = useAuth()
  const theme = useRoleTheme()
  const queryClient = useQueryClient()
  const [form, setForm] = useState<ManagerSettings | null>(null)
  const [saving, setSaving] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['manager', 'settings', user?.id],
    queryFn: () => fetchManagerSettings(user!.id),
    enabled: !!user,
  })

  useEffect(() => {
    if (data && !form) setForm(data)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  if (!user) {
    return (
      <Screen>
        <AppHeader showBack title="Business settings" />
        <EmptyState icon="person-circle-outline" title="Sign in" description="Sign in to manage your settings.">
          <Button label="Sign In" onPress={() => router.push('/(auth)/login')} />
        </EmptyState>
      </Screen>
    )
  }

  if (isLoading || !form) {
    return (
      <Screen>
        <AppHeader showBack title="Business settings" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </Screen>
    )
  }

  const set = (patch: Partial<ManagerSettings>) => setForm((f) => (f ? { ...f, ...patch } : f))

  const save = async () => {
    setSaving(true)
    try {
      const { manager_id: _omit, ...updates } = form
      await saveManagerSettings(user.id, updates)
      queryClient.invalidateQueries({ queryKey: ['manager', 'settings'] })
      Alert.alert('Saved', 'Your business settings have been updated.')
    } catch (e: any) {
      Alert.alert('Could not save', e?.message ?? 'Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Screen>
      <AppHeader showBack title="Business settings" subtitle="Hotel manager" />
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <SectionLabel>Business information</SectionLabel>
        <Card className="p-4">
          <Field label="Business name" value={form.business_name} onChange={(v) => set({ business_name: v })} placeholder="Your property group / company" />
          <Field label="Business email" value={form.business_email} onChange={(v) => set({ business_email: v })} placeholder="reservations@yourhotel.com" keyboardType="email-address" />
          <Field label="Business phone" value={form.business_phone} onChange={(v) => set({ business_phone: v })} placeholder="+92 …" keyboardType="phone-pad" />
          <Field label="Website (optional)" value={form.website_url} onChange={(v) => set({ website_url: v })} placeholder="https://…" />
          <Field label="Registration number (optional)" value={form.business_registration_number} onChange={(v) => set({ business_registration_number: v })} placeholder="Company registration #" />
          <Field label="Tax ID (optional)" value={form.tax_id} onChange={(v) => set({ tax_id: v })} placeholder="NTN / tax number" />
        </Card>

        <SectionLabel>Cancellation policy</SectionLabel>
        <Card className="p-4">
          <Segmented
            value={form.cancellation_policy}
            onChange={(v) => set({ cancellation_policy: v as ManagerSettings['cancellation_policy'] })}
            options={[
              { v: 'flexible', label: 'Flexible' },
              { v: 'moderate', label: 'Moderate' },
              { v: 'strict', label: 'Strict' },
            ]}
          />
          <View className="flex-row items-center justify-between py-2">
            <Text className="text-[15px] font-medium text-ink">Free cancellation up to</Text>
            <View className="flex-row items-center">
              <Stepper value={form.cancellation_days_before} onChange={(v) => set({ cancellation_days_before: v })} min={0} max={60} />
              <Text className="ml-2 text-sm text-ink-muted">days</Text>
            </View>
          </View>
        </Card>

        <SectionLabel>Notifications</SectionLabel>
        <Card className="p-4">
          <ToggleRow label="New bookings" value={form.booking_notifications} onChange={(v) => set({ booking_notifications: v })} />
          <ToggleRow label="Messages" value={form.messaging_notifications} onChange={(v) => set({ messaging_notifications: v })} />
          <ToggleRow label="New reviews" value={form.review_notifications} onChange={(v) => set({ review_notifications: v })} />
          <ToggleRow label="Payments" value={form.payment_notifications} onChange={(v) => set({ payment_notifications: v })} last />
        </Card>

        <View className="mt-6">
          <Button label="Save settings" gradient loading={saving} onPress={save} />
        </View>
        <Text className="mt-3 text-center text-xs text-ink-soft">
          Payout accounts and identity verification are managed on the web dashboard.
        </Text>
      </ScrollView>
    </Screen>
  )
}
