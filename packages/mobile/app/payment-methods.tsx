import { useQuery, useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { useState } from 'react'
import { Alert, Pressable, ScrollView, Text, View } from 'react-native'

import { Check, CreditCard, Lock, Wallet, X } from '@/components/icons/lucide'
import { Field, Segmented } from '@/components/ui/FormKit'
import { AppHeader, Badge, Button, Card, EmptyState, Screen, Skeleton } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { useRoleTheme, useThemeColors } from '@/theme'
import {
  addWalletMethod,
  deletePaymentMethod,
  fetchPaymentMethods,
  setDefaultPaymentMethod,
  type UserPaymentMethod,
} from '@/lib/paymentMethods'

function MethodRow({
  method,
  onMakeDefault,
  onRemove,
}: {
  method: UserPaymentMethod
  onMakeDefault: () => void
  onRemove: () => void
}) {
  const theme = useRoleTheme()
  const c = useThemeColors()
  const isCard = method.method_type === 'card'
  return (
    <Card className="mb-2 p-4">
      <View className="flex-row items-center">
        <View className="h-11 w-11 items-center justify-center rounded-2xl bg-primary-100">
          {isCard ? <CreditCard size={20} color={theme.primary} /> : <Wallet size={20} color={theme.primary} />}
        </View>
        <View className="ml-3 flex-1">
          <View className="flex-row items-center gap-2">
            <Text className="font-bold text-ink">
              {method.label}
              {isCard && method.last_four ? ` •••• ${method.last_four}` : ''}
            </Text>
            {method.is_default ? <Badge label="Default" tone="primary" /> : null}
          </View>
          <Text className="mt-0.5 text-xs text-ink-soft">
            {isCard
              ? `${method.card_brand ?? 'Card'}${method.exp_month ? ` · expires ${method.exp_month}/${method.exp_year}` : ''}`
              : method.phone_number ?? 'Mobile wallet'}
          </Text>
        </View>
        {!method.is_default ? (
          <Pressable onPress={onMakeDefault} className="mr-2 rounded-full bg-surface-sunken px-3 py-1.5">
            <Text className="text-xs font-semibold text-ink">Make default</Text>
          </Pressable>
        ) : null}
        <Pressable onPress={onRemove} hitSlop={8}>
          <X size={18} color={c.inkSoft} />
        </Pressable>
      </View>
    </Card>
  )
}

export default function PaymentMethodsScreen() {
  const { user } = useAuth()
  const theme = useRoleTheme()
  const queryClient = useQueryClient()
  const [adding, setAdding] = useState(false)
  const [walletType, setWalletType] = useState<'easypaisa' | 'jazzcash'>('easypaisa')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)

  const { data: methods = [], isLoading, isError } = useQuery({
    queryKey: ['payment-methods', user?.id],
    queryFn: fetchPaymentMethods,
    enabled: !!user,
  })

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['payment-methods'] })

  if (!user) {
    return (
      <Screen>
        <AppHeader showBack title="Payment methods" />
        <EmptyState icon="card-outline" title="Sign in" description="Sign in to manage payment methods.">
          <Button label="Sign In" onPress={() => router.push('/(auth)/login')} />
        </EmptyState>
      </Screen>
    )
  }

  const saveWallet = async () => {
    const p = phone.trim()
    if (!/^\+?\d{10,13}$/.test(p.replace(/[\s-]/g, ''))) {
      Alert.alert('Check the number', 'Enter the mobile number registered with your wallet.')
      return
    }
    setSaving(true)
    try {
      await addWalletMethod({ userId: user.id, type: walletType, phoneNumber: p, makeDefault: methods.length === 0 })
      setPhone('')
      setAdding(false)
      refresh()
    } catch (e: any) {
      Alert.alert('Could not save', e?.message ?? 'Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const remove = (m: UserPaymentMethod) => {
    Alert.alert('Remove payment method', `Remove ${m.label}${m.last_four ? ` •••• ${m.last_four}` : ''}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePaymentMethod(m.id)
            refresh()
          } catch (e: any) {
            Alert.alert('Could not remove', e?.message ?? 'Please try again.')
          }
        },
      },
    ])
  }

  return (
    <Screen>
      <AppHeader showBack title="Payment methods" subtitle="Cards & mobile wallets" />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
        {isLoading ? (
          <View>
            <Skeleton height={76} radius={16} />
            <View className="mt-2"><Skeleton height={76} radius={16} /></View>
          </View>
        ) : isError ? (
          <EmptyState
            icon="card-outline"
            title="Couldn't load payment methods"
            description="Pull to retry, or add one below — it will appear once saved."
          />
        ) : methods.length === 0 && !adding ? (
          <Card className="items-center p-6">
            <View className="h-14 w-14 items-center justify-center rounded-full bg-primary-100">
              <Wallet size={26} color={theme.primary} />
            </View>
            <Text className="mt-3 text-base font-bold text-ink">No payment methods yet</Text>
            <Text className="mt-1 text-center text-sm leading-5 text-ink-muted">
              Save a mobile wallet for faster checkout. Cards arrive with secure Stripe payments.
            </Text>
          </Card>
        ) : (
          methods.map((m) => (
            <MethodRow
              key={m.id}
              method={m}
              onMakeDefault={async () => {
                try {
                  await setDefaultPaymentMethod(user.id, m.id)
                  refresh()
                } catch (e: any) {
                  Alert.alert('Could not update', e?.message ?? 'Please try again.')
                }
              }}
              onRemove={() => remove(m)}
            />
          ))
        )}

        {adding ? (
          <Card className="mt-4 p-4">
            <Text className="mb-2 text-base font-bold text-ink">Add a mobile wallet</Text>
            <Segmented
              value={walletType}
              onChange={(v) => setWalletType(v as 'easypaisa' | 'jazzcash')}
              options={[
                { v: 'easypaisa', label: 'EasyPaisa' },
                { v: 'jazzcash', label: 'JazzCash' },
              ]}
            />
            <Field
              label="Wallet mobile number"
              value={phone}
              onChange={setPhone}
              placeholder="+92 3xx xxxxxxx"
              keyboardType="phone-pad"
            />
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Button label="Cancel" variant="secondary" onPress={() => setAdding(false)} />
              </View>
              <View className="flex-1">
                <Button label="Save wallet" loading={saving} onPress={saveWallet} />
              </View>
            </View>
          </Card>
        ) : (
          <View className="mt-4">
            <Button label="Add new method" gradient onPress={() => setAdding(true)} />
          </View>
        )}

        <Card flat className="mt-5 flex-row items-start bg-surface-sunken p-4">
          <Lock size={16} color={theme.primary} style={{ marginTop: 2 }} />
          <Text className="ml-2.5 flex-1 text-xs leading-5 text-ink-muted">
            Your security is our priority. TripAvail uses Stripe for card processing — we never store
            full card details. Wallet numbers are only used to prepare your checkout.
          </Text>
        </Card>

        <View className="mt-3 flex-row items-center justify-center gap-1.5">
          <Check size={13} color="#16a34a" />
          <Text className="text-xs text-ink-soft">Card entry unlocks with the payments update.</Text>
        </View>
      </ScrollView>
    </Screen>
  )
}
