import { useEffect, useState } from 'react'
import { Modal, Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { Check, Minus, Plus, X } from '@/components/icons/lucide'
import { Button } from '@/components/ui'
import { Field, Stepper } from '@/components/ui/FormKit'
import { useThemeColors } from '@/theme'
import { BED_TYPES, ROOM_CURRENCIES, ROOM_TYPES } from '@/lib/hotelOptions'
import type { HotelBed, HotelRoomInput } from '@/lib/hotelAuthoring'

const STEP_LABELS = ['Type', 'Details', 'Beds', 'Pricing']

function blankRoom(): HotelRoomInput {
  return {
    id: `room_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    type: 'standard',
    name: '',
    description: '',
    count: 1,
    maxGuests: 2,
    size: 25,
    beds: [],
    amenities: [],
    pricing: { basePrice: 0, currency: 'PKR' },
  }
}

export function RoomEditorModal({
  visible,
  onClose,
  onSave,
  editingRoom,
}: {
  visible: boolean
  onClose: () => void
  onSave: (room: HotelRoomInput) => void
  editingRoom?: HotelRoomInput | null
}) {
  const c = useThemeColors()
  const [step, setStep] = useState(0)
  const [room, setRoom] = useState<HotelRoomInput>(blankRoom())

  useEffect(() => {
    if (visible) {
      setRoom(editingRoom ? { ...editingRoom } : blankRoom())
      setStep(0)
    }
  }, [visible, editingRoom])

  const set = (patch: Partial<HotelRoomInput>) => setRoom((r) => ({ ...r, ...patch }))
  const setPrice = (patch: Partial<HotelRoomInput['pricing']>) => setRoom((r) => ({ ...r, pricing: { ...r.pricing, ...patch } }))
  const bedQty = (type: string) => room.beds.find((b) => b.type === type)?.quantity ?? 0
  const addBed = (type: string) =>
    setRoom((r) => {
      const ex = r.beds.find((b) => b.type === type)
      return {
        ...r,
        beds: ex
          ? r.beds.map((b) => (b.type === type ? { ...b, quantity: b.quantity + 1 } : b))
          : [...r.beds, { type, quantity: 1 } as HotelBed],
      }
    })
  const removeBed = (type: string) =>
    setRoom((r) => {
      const ex = r.beds.find((b) => b.type === type)
      if (!ex) return r
      return ex.quantity > 1
        ? { ...r, beds: r.beds.map((b) => (b.type === type ? { ...b, quantity: b.quantity - 1 } : b)) }
        : { ...r, beds: r.beds.filter((b) => b.type !== type) }
    })

  const stepValid = () => {
    if (step === 0) return !!room.type
    if (step === 1) return !!room.name.trim() && room.count > 0 && room.maxGuests > 0
    if (step === 2) return room.beds.length > 0
    if (step === 3) return room.pricing.basePrice > 0
    return false
  }

  const next = () => {
    if (!stepValid()) return
    if (step < 3) setStep(step + 1)
    else {
      onSave(room)
      onClose()
    }
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: c.surfacePage }}>
        <View className="flex-row items-center justify-between px-5 pb-2 pt-2">
          <View className="flex-1">
            <Text className="text-xl font-black text-ink">{editingRoom ? 'Edit room type' : 'Add room type'}</Text>
            <Text className="text-xs text-ink-soft">{STEP_LABELS[step]} · Step {step + 1} of 4</Text>
          </View>
          <Pressable onPress={onClose} hitSlop={10} className="h-9 w-9 items-center justify-center rounded-full bg-surface-sunken">
            <X size={18} color={c.inkMuted} />
          </Pressable>
        </View>
        <View className="mx-5 mb-2 flex-row gap-1">
          {STEP_LABELS.map((l, i) => (
            <View key={l} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-primary-700' : 'bg-surface-sunken'}`} />
          ))}
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 20 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {step === 0 ? (
            <View>
              <Text className="mb-3 text-sm text-ink-muted">What type of room is this?</Text>
              <View className="flex-row flex-wrap justify-between">
                {ROOM_TYPES.map((t) => {
                  const active = room.type === t.value
                  return (
                    <Pressable
                      key={t.value}
                      onPress={() => set({ type: t.value, name: room.name || t.label })}
                      style={{ width: '48%' }}
                      className={`mb-3 rounded-2xl border-2 p-4 ${active ? 'border-primary-700 bg-primary-50' : 'border-line bg-surface'}`}
                    >
                      <Text className="text-3xl">{t.emoji}</Text>
                      <Text className="mt-2 font-bold text-ink">{t.label}</Text>
                      <Text className="text-xs text-ink-soft">{t.hint}</Text>
                      {active ? (
                        <View className="mt-2 self-start rounded-full bg-primary-700 p-1">
                          <Check size={12} color="#ffffff" />
                        </View>
                      ) : null}
                    </Pressable>
                  )
                })}
              </View>
            </View>
          ) : null}

          {step === 1 ? (
            <View>
              <Field label="Room name" value={room.name} onChange={(v) => set({ name: v })} placeholder="e.g. Deluxe Mountain View" />
              <Field label="Description" value={room.description} onChange={(v) => set({ description: v })} placeholder="What makes this room special…" multiline />
              <View className="mt-1 flex-row gap-6">
                <View>
                  <Text className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-soft">Rooms</Text>
                  <Stepper value={room.count} min={1} max={500} onChange={(v) => set({ count: v })} />
                </View>
                <View>
                  <Text className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-soft">Max guests</Text>
                  <Stepper value={room.maxGuests} min={1} max={20} onChange={(v) => set({ maxGuests: v })} />
                </View>
              </View>
              <View className="mt-3">
                <Field label="Size (m²)" value={room.size ? String(room.size) : ''} onChange={(v) => set({ size: Number(v.replace(/[^0-9.]/g, '')) || 0 })} placeholder="25" keyboardType="number-pad" />
              </View>
            </View>
          ) : null}

          {step === 2 ? (
            <View>
              <Text className="mb-3 text-sm text-ink-muted">How many beds of each type?</Text>
              {BED_TYPES.map((b) => (
                <View key={b.value} className="mb-2 flex-row items-center justify-between rounded-2xl border border-line bg-surface px-4 py-3">
                  <View className="flex-row items-center">
                    <Text className="text-2xl">{b.emoji}</Text>
                    <Text className="ml-3 font-semibold text-ink">{b.label}</Text>
                  </View>
                  <View className="flex-row items-center gap-3">
                    <Pressable onPress={() => removeBed(b.value)} className="h-9 w-9 items-center justify-center rounded-full border border-line bg-surface">
                      <Minus size={16} color={c.ink} />
                    </Pressable>
                    <Text className="min-w-[22px] text-center text-base font-bold text-ink">{bedQty(b.value)}</Text>
                    <Pressable onPress={() => addBed(b.value)} className="h-9 w-9 items-center justify-center rounded-full border border-line bg-surface">
                      <Plus size={16} color={c.ink} />
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          ) : null}

          {step === 3 ? (
            <View>
              <Field label="Base price / night" value={room.pricing.basePrice ? String(room.pricing.basePrice) : ''} onChange={(v) => setPrice({ basePrice: Number(v.replace(/[^0-9.]/g, '')) || 0 })} placeholder="0" keyboardType="decimal-pad" />
              <Text className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">Currency</Text>
              <View className="flex-row flex-wrap">
                {ROOM_CURRENCIES.map((cur) => {
                  const active = room.pricing.currency === cur
                  return (
                    <Pressable key={cur} onPress={() => setPrice({ currency: cur })} className={`mb-2 mr-2 rounded-full border px-4 py-2 ${active ? 'border-primary-700 bg-primary-700' : 'border-line bg-surface'}`}>
                      <Text className={`text-sm font-semibold ${active ? 'text-white' : 'text-ink'}`}>{cur}</Text>
                    </Pressable>
                  )
                })}
              </View>
            </View>
          ) : null}
        </ScrollView>

        <View className="flex-row gap-3 px-5 pb-2 pt-2">
          {step > 0 ? (
            <View className="flex-1">
              <Button label="Back" variant="secondary" onPress={() => setStep((s) => Math.max(0, s - 1))} />
            </View>
          ) : null}
          <View className="flex-[2]">
            <Button label={step === 3 ? (editingRoom ? 'Save room' : 'Add room') : 'Continue'} disabled={!stepValid()} onPress={next} />
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  )
}
