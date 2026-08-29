import { useMemo, useState } from 'react'
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { MapPin, Search, Users, X } from '@/components/icons/lucide'
import { Button } from '@/components/ui'
import { useThemeColors } from '@/theme'

/**
 * Airbnb-style stacked search, adapted for TOURS.
 *
 * Why it isn't a copy of the stays flow: a hotel's "When" is a stay range (check-in → check-out),
 * but a tour sells FIXED departures the operator schedules. You don't pick arbitrary nights — you
 * find a trip that departs when you're free. So the middle step asks "when do you want to go" and
 * resolves to a departure WINDOW (any time / a month), and the last step counts TRAVELLERS (seats),
 * not guests-and-rooms.
 */

export interface TourSearchValue {
  where: string
  /** ISO start of the departure window, or null for "any time". */
  departureFrom: string | null
  departureTo: string | null
  /** Human label for the chosen window, e.g. "September". */
  whenLabel: string | null
  travellers: number | null
}

export const EMPTY_TOUR_SEARCH: TourSearchValue = {
  where: '',
  departureFrom: null,
  departureTo: null,
  whenLabel: null,
  travellers: null,
}

type Step = 'where' | 'when' | 'who'

function monthOptions(count = 6) {
  const out: { label: string; from: string; to: string }[] = []
  const now = new Date()
  for (let i = 0; i < count; i++) {
    const start = new Date(now.getFullYear(), now.getMonth() + i, 1)
    const end = new Date(now.getFullYear(), now.getMonth() + i + 1, 0, 23, 59, 59)
    // Never search into the past for the current month.
    const from = i === 0 && now > start ? now : start
    out.push({
      label: start.toLocaleDateString('en-US', { month: 'long' }),
      from: from.toISOString(),
      to: end.toISOString(),
    })
  }
  return out
}

export function TourSearchSheet({
  visible,
  initial,
  suggestions = [],
  onClose,
  onSearch,
}: {
  visible: boolean
  initial?: TourSearchValue
  /** Destinations drawn from the live catalogue, e.g. [{ city: 'Hunza', count: 3 }]. */
  suggestions?: { city: string; count: number }[]
  onClose: () => void
  onSearch: (value: TourSearchValue) => void
}) {
  const c = useThemeColors()
  const [step, setStep] = useState<Step>('where')
  const [value, setValue] = useState<TourSearchValue>(initial ?? EMPTY_TOUR_SEARCH)
  const months = useMemo(() => monthOptions(6), [])

  const set = (patch: Partial<TourSearchValue>) => setValue((v) => ({ ...v, ...patch }))
  const reset = () => setValue(EMPTY_TOUR_SEARCH)

  const whereSummary = value.where.trim() || 'Anywhere'
  const whenSummary = value.whenLabel ?? 'Any time'
  const whoSummary =
    value.travellers && value.travellers > 0
      ? `${value.travellers} ${value.travellers === 1 ? 'traveller' : 'travellers'}`
      : 'Add travellers'

  // A collapsed row — tapping it opens that step (Airbnb's stacked pattern).
  const Row = ({ step: s, label, summary }: { step: Step; label: string; summary: string }) => (
    <Pressable
      onPress={() => setStep(s)}
      className="mb-3 flex-row items-center justify-between rounded-3xl border border-line bg-surface px-5 py-4"
    >
      <Text className="text-sm text-ink-soft">{label}</Text>
      <Text className="text-sm font-semibold text-ink">{summary}</Text>
    </Pressable>
  )

  const CardHeader = ({ title }: { title: string }) => (
    <Text className="mb-4 text-2xl font-black text-ink">{title}</Text>
  )

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent={false}>
      <SafeAreaView style={{ flex: 1, backgroundColor: c.surfacePage }} edges={['top', 'bottom']}>
        {/* Close */}
        <View className="flex-row items-center justify-end px-5 pb-2 pt-2">
          <Pressable
            onPress={onClose}
            hitSlop={10}
            className="h-9 w-9 items-center justify-center rounded-full border border-line bg-surface"
          >
            <X size={17} color={c.ink} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
          {/* ── WHERE ─────────────────────────────────────────────── */}
          {step === 'where' ? (
            <View className="mb-3 rounded-3xl bg-surface p-5 shadow-sm">
              <CardHeader title="Where to?" />
              <View className="mb-4 flex-row items-center rounded-2xl border border-line px-4 py-3">
                <Search size={17} color={c.inkSoft} />
                <TextInput
                  className="ml-2 flex-1 text-base text-ink"
                  placeholder="Search destinations"
                  placeholderTextColor={c.inkSoft}
                  value={value.where}
                  onChangeText={(t) => set({ where: t })}
                  autoFocus
                  returnKeyType="next"
                  onSubmitEditing={() => setStep('when')}
                />
              </View>

              {suggestions.length > 0 ? (
                <>
                  <Text className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">
                    Popular destinations
                  </Text>
                  {suggestions.slice(0, 6).map((s) => (
                    <Pressable
                      key={s.city}
                      onPress={() => {
                        set({ where: s.city })
                        setStep('when')
                      }}
                      className="flex-row items-center py-2.5"
                    >
                      <View className="h-10 w-10 items-center justify-center rounded-xl bg-surface-page">
                        <MapPin size={17} color={c.ink} />
                      </View>
                      <View className="ml-3">
                        <Text className="text-sm font-semibold text-ink">{s.city}</Text>
                        <Text className="text-xs text-ink-soft">
                          {s.count} {s.count === 1 ? 'trip' : 'trips'}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </>
              ) : null}
            </View>
          ) : (
            <Row step="where" label="Where" summary={whereSummary} />
          )}

          {/* ── WHEN ──────────────────────────────────────────────────
              Departure-shaped, not stay-shaped: months, because operators run
              departures on a rhythm (e.g. every Saturday) — picking one exact day
              would hide trips leaving the day before or after. */}
          {step === 'when' ? (
            <View className="mb-3 rounded-3xl bg-surface p-5 shadow-sm">
              <CardHeader title="When do you want to go?" />
              <Text className="mb-4 -mt-2 text-sm text-ink-soft">
                We’ll show trips with a departure in that time.
              </Text>
              <View className="flex-row flex-wrap gap-2">
                <Pressable
                  onPress={() => {
                    set({ departureFrom: null, departureTo: null, whenLabel: null })
                    setStep('who')
                  }}
                  className={`rounded-full border px-4 py-2.5 ${
                    !value.whenLabel ? 'border-primary-700 bg-primary-700' : 'border-line bg-surface'
                  }`}
                >
                  <Text className={`text-sm font-semibold ${!value.whenLabel ? 'text-white' : 'text-ink'}`}>
                    Any time
                  </Text>
                </Pressable>
                {months.map((m) => {
                  const active = value.whenLabel === m.label
                  return (
                    <Pressable
                      key={m.label}
                      onPress={() => {
                        set({ departureFrom: m.from, departureTo: m.to, whenLabel: m.label })
                        setStep('who')
                      }}
                      className={`rounded-full border px-4 py-2.5 ${
                        active ? 'border-primary-700 bg-primary-700' : 'border-line bg-surface'
                      }`}
                    >
                      <Text className={`text-sm font-semibold ${active ? 'text-white' : 'text-ink'}`}>
                        {m.label}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>
            </View>
          ) : (
            <Row step="when" label="When" summary={whenSummary} />
          )}

          {/* ── TRAVELLERS ────────────────────────────────────────────
              Seats, not guests/rooms — and it's what unlocks group pricing. */}
          {step === 'who' ? (
            <View className="mb-3 rounded-3xl bg-surface p-5 shadow-sm">
              <CardHeader title="How many travellers?" />
              <View className="flex-row items-center justify-between py-2">
                <View className="flex-row items-center">
                  <Users size={18} color={c.ink} />
                  <Text className="ml-2 text-base font-semibold text-ink">Travellers</Text>
                </View>
                <View className="flex-row items-center">
                  <Pressable
                    onPress={() => set({ travellers: Math.max(0, (value.travellers ?? 0) - 1) || null })}
                    className="h-10 w-10 items-center justify-center rounded-full border border-line"
                  >
                    <Text className="text-lg font-bold text-ink">−</Text>
                  </Pressable>
                  <Text className="mx-4 min-w-6 text-center text-base font-bold text-ink">
                    {value.travellers ?? 0}
                  </Text>
                  <Pressable
                    onPress={() => set({ travellers: (value.travellers ?? 0) + 1 })}
                    className="h-10 w-10 items-center justify-center rounded-full border border-line"
                  >
                    <Text className="text-lg font-bold text-ink">+</Text>
                  </Pressable>
                </View>
              </View>
              {(value.travellers ?? 0) >= 5 ? (
                <Text className="mt-2 text-xs font-semibold text-primary-700">
                  Group rates often unlock from 5 travellers.
                </Text>
              ) : null}
            </View>
          ) : (
            <Row step="who" label="Travellers" summary={whoSummary} />
          )}
        </ScrollView>

        {/* Footer */}
        <View className="flex-row items-center justify-between border-t border-line px-5 py-3">
          <Pressable onPress={reset} hitSlop={8}>
            <Text className="text-sm font-bold text-ink underline">Clear all</Text>
          </Pressable>
          <View className="w-40">
            <Button label="Search" size="lg" onPress={() => onSearch(value)} />
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  )
}
