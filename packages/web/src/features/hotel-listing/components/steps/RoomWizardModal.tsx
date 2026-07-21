import { Check, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

import { NumberStepper } from '../ui/NumberStepper'
import { RoomDescriptionSuggestions } from '../ui/RoomDescriptionSuggestions'
import { BedConfig, RoomType } from './RoomsStep'

interface RoomWizardModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (room: RoomType) => void
  editingRoom?: RoomType | null
  /** Set once for the whole property; every room is priced in it. */
  listingCurrency?: string
}

/**
 * The price ranges that used to sit under each label ('$50-100', '$150-250' …) were INVENTED — no
 * hotel, market or booking data fed them. A partner setting their nightly rate was reading a made-up
 * anchor as though it were guidance from the platform. They are replaced with the sleeping capacity
 * each type implies, which is a genuine property of the room and is what the partner configures two
 * steps later.
 */
const CUSTOM_ROOM_TYPE = 'custom'

const ROOM_TYPES = [
  { value: 'standard', label: 'Standard Room', icon: '🛏️', sleeps: 'Sleeps 2' },
  { value: 'deluxe', label: 'Deluxe Room', icon: '✨', sleeps: 'Sleeps 2' },
  { value: 'suite', label: 'Suite', icon: '🏰', sleeps: 'Sleeps 2–4' },
  { value: 'family', label: 'Family Room', icon: '👨‍👩‍👧‍👦', sleeps: 'Sleeps 4–6' },
  { value: 'executive', label: 'Executive Room', icon: '💼', sleeps: 'Sleeps 2' },
  { value: 'presidential', label: 'Presidential Suite', icon: '👑', sleeps: 'Sleeps 4+' },
  { value: CUSTOM_ROOM_TYPE, label: 'Other', icon: '➕', sleeps: 'Name your own' },
] as const

const CUSTOM_BED_TYPE = 'custom'

const BED_TYPES = [
  { value: 'king', label: 'King Bed', icon: '🛏️', width: 180 },
  { value: 'queen', label: 'Queen Bed', icon: '🛌', width: 150 },
  { value: 'double', label: 'Double Bed', icon: '🛏️', width: 135 },
  { value: 'twin', label: 'Twin Bed', icon: '🛏️', width: 90 },
  { value: 'single', label: 'Single Bed', icon: '🛏️', width: 90 },
  { value: 'sofaBed', label: 'Sofa Bed', icon: '🛋️', width: 120 },
  { value: CUSTOM_BED_TYPE, label: 'Other', icon: '➕', width: 0 },
] as const

/**
 * Label for a bed row. Both summary lines used to do
 *   BED_TYPES.find((bt) => bt.value === b.type)?.label
 * unguarded, so any type outside the six printed the literal string "undefined" — which a custom
 * bed type would hit immediately. Falls back to the stored value, and to the partner's own name for
 * a custom bed.
 */
function bedLabel(bed: BedConfig): string {
  if (bed.type === CUSTOM_BED_TYPE) return bed.customLabel?.trim() || 'Bed'
  return BED_TYPES.find((bt) => bt.value === bed.type)?.label ?? bed.type
}

export function RoomWizardModal({
  isOpen,
  onClose,
  onSave,
  editingRoom,
  listingCurrency = 'USD',
}: RoomWizardModalProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [roomData, setRoomData] = useState<Partial<RoomType>>(
    editingRoom || {
      type: 'standard',
      name: '',
      description: '',
      count: 1,
      maxGuests: 2,
      size: 25,
      beds: [],
      pricing: {
        basePrice: 100,
        currency: listingCurrency,
      },
    },
  )

  // The price field is edited as a STRING so it can be genuinely empty — see the input for why.
  // State keeps the number; this keeps what the partner is actually typing.
  const [priceDraft, setPriceDraft] = useState(() =>
    editingRoom?.pricing?.basePrice ? String(editingRoom.pricing.basePrice) : '100',
  )

  // Lock the page behind the dialog. Without this the wheel scrolled the listing wizard
  // underneath while the dialog itself stayed put — the "scroll only works for the background
  // window" the team reported.
  //
  // Lock <html>, NOT <body>: index.css sets `html { overflow-x: hidden }`, and body's overflow is
  // only propagated to the viewport when the root's computed overflow is `visible`. It isn't, so
  // <html> is the real scroller and locking body here is a silent no-op.
  useEffect(() => {
    if (!isOpen) return
    const root = document.documentElement
    const previous = root.style.overflow
    root.style.overflow = 'hidden'
    return () => {
      root.style.overflow = previous
    }
  }, [isOpen])

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    } else {
      // Save room
      const finalRoom: RoomType = {
        id: editingRoom?.id || `room_${Date.now()}`,
        type: roomData.type ?? 'standard',
        name: roomData.name || getRoomTypeLabel(roomData.type),
        description: roomData.description || '',
        count: roomData.count || 1,
        maxGuests: roomData.maxGuests || 2,
        size: roomData.size || 25,
        beds: roomData.beds || [],
        // Only carried when the type is actually custom, so a partner who tried Other and then
        // picked a preset does not leave a stale name behind on the saved room.
        ...(roomData.type === CUSTOM_ROOM_TYPE ? { customType: roomData.customType?.trim() } : {}),
        // Currency always comes from the listing, never from stale per-room state — that is what
        // stopped rooms in one property disagreeing with each other.
        pricing: {
          basePrice: roomData.pricing?.basePrice ?? 0,
          currency: listingCurrency,
        },
      }
      onSave(finalRoom)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const getRoomTypeLabel = (type?: string) => {
    if (type === CUSTOM_ROOM_TYPE) return roomData.customType?.trim() || 'Other'
    return ROOM_TYPES.find((t) => t.value === type)?.label || type || ''
  }

  const addBed = (bedType: BedConfig['type']) => {
    const existingBed = roomData.beds?.find((b) => b.type === bedType)
    if (existingBed) {
      setRoomData({
        ...roomData,
        beds: roomData.beds!.map((b) =>
          b.type === bedType ? { ...b, quantity: b.quantity + 1 } : b,
        ),
      })
    } else {
      setRoomData({
        ...roomData,
        beds: [...(roomData.beds || []), { type: bedType, quantity: 1 }],
      })
    }
  }

  const removeBed = (bedType: BedConfig['type']) => {
    const existingBed = roomData.beds?.find((b) => b.type === bedType)
    if (existingBed && existingBed.quantity > 1) {
      setRoomData({
        ...roomData,
        beds: roomData.beds!.map((b) =>
          b.type === bedType ? { ...b, quantity: b.quantity - 1 } : b,
        ),
      })
    } else {
      setRoomData({
        ...roomData,
        beds: roomData.beds!.filter((b) => b.type !== bedType),
      })
    }
  }

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        // 'custom' without a name would publish a room type of literally "custom", so the free-text
        // field is required once Other is chosen. Every preset stays one click as before.
        if (roomData.type === CUSTOM_ROOM_TYPE) return !!roomData.customType?.trim()
        return !!roomData.type
      case 2:
        return (
          !!roomData.name && roomData.count! > 0 && roomData.maxGuests! > 0 && roomData.size! > 0
        )
      case 3:
        return roomData.beds && roomData.beds.length > 0
      case 4:
        return roomData.pricing && roomData.pricing.basePrice > 0
      default:
        return false
    }
  }

  if (!isOpen) return null

  // Rendered into document.body, NOT in place.
  //
  // The dialog is returned from inside the step content, so in DOM order it came BEFORE
  // <AirbnbBottomNav>, which is a fixed z-50 sibling. Two positioned elements at the same z-index
  // are painted in tree order, so the wizard's own Back/Next bar won the tie and sat on top of the
  // dialog's Save/Next — the partner saw the modal footer covered and reported "I can't reach Next
  // unless I hide the suggestions" and "Next goes very far down, I have to zoom out". Portalling to
  // document.body puts it after #root, and z-[100] states the intent rather than relying on order.
  return createPortal(
    // overflow-y-auto + overscroll-contain: the dialog was taller than the viewport, so its
    // footer (Back / Next) sat below the fold with no way to reach it, and the wheel scrolled the
    // PAGE BEHIND instead. The body scroll-lock above stops the background moving at all.
    <div className="fixed inset-0 bg-foreground/50 z-[100] flex items-center justify-center p-4 overflow-y-auto overscroll-contain">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-3xl max-h-[calc(100dvh-2rem)]"
      >
        {/* Column layout: header/progress/footer stay put, only the step body scrolls. */}
        <Card className="bg-background shadow-2xl flex flex-col max-h-[calc(100dvh-2rem)] overflow-hidden">
          {/* Header */}
          <div className="shrink-0 flex items-center justify-between p-6 border-b">
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                {editingRoom ? 'Edit Room Type' : 'Add Room Type'}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">Step {currentStep} of 4</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
              <X size={20} className="text-muted-foreground" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="shrink-0 px-6 py-4 bg-muted">
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex-1">
                  <div
                    className={`h-2 rounded-full transition-colors ${
                      step <= currentStep ? 'bg-info' : 'bg-muted'
                    }`}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>Room Type</span>
              <span>Details</span>
              <span>Beds</span>
              <span>Pricing</span>
            </div>
          </div>

          {/* Step Content — the only scrollable region. min-h-0 is required or a flex child
              refuses to shrink and the overflow never kicks in. overscroll-contain belongs HERE,
              on the box that actually scrolls: hitting the end of this list must not hand the
              wheel to the page behind. The overlay's copy of it never fires, because the card is
              capped at exactly the overlay's content height so the overlay never overflows. */}
          <div className="p-6 flex-1 min-h-0 overflow-y-auto overscroll-contain">
            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <h3 className="text-lg font-semibold mb-4">Select Room Type</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {ROOM_TYPES.map((type) => (
                      <button
                        key={type.value}
                        onClick={() => {
                          // Only auto-fill the name while it is still empty or still the previous
                          // preset's label, so a name the partner typed themselves is never
                          // overwritten. 'Other' never auto-fills — they are about to name it.
                          const nameIsUntouched =
                            !roomData.name || roomData.name === getRoomTypeLabel(roomData.type)
                          setRoomData({
                            ...roomData,
                            type: type.value,
                            name:
                              nameIsUntouched && type.value !== CUSTOM_ROOM_TYPE
                                ? type.label
                                : roomData.name,
                          })
                        }}
                        className={`p-4 border-2 rounded-xl transition-all ${
                          roomData.type === type.value
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-border/60'
                        }`}
                      >
                        <div className="text-3xl mb-2">{type.icon}</div>
                        <div className="font-semibold text-foreground">{type.label}</div>
                        <div className="text-sm text-muted-foreground mt-1">{type.sleeps}</div>
                        {roomData.type === type.value && (
                          <div className="mt-2">
                            <Check size={20} className="text-primary mx-auto" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  {roomData.type === CUSTOM_ROOM_TYPE && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="pt-2"
                    >
                      <label className="block text-sm font-medium text-foreground mb-2">
                        What do you call this room type? *
                      </label>
                      <Input
                        autoFocus
                        value={roomData.customType ?? ''}
                        onChange={(e) =>
                          setRoomData({
                            ...roomData,
                            customType: e.target.value,
                            // Keep the room's display name in step with the type until the partner
                            // edits it themselves on the next step.
                            name:
                              !roomData.name || roomData.name === roomData.customType
                                ? e.target.value
                                : roomData.name,
                          })
                        }
                        placeholder="e.g. Dormitory, Treehouse, Cabin"
                        maxLength={40}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Guests will see this exactly as you write it.
                      </p>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <h3 className="text-lg font-semibold mb-4">Room Details</h3>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Room Name *
                    </label>
                    <Input
                      value={roomData.name}
                      onChange={(e) => setRoomData({ ...roomData, name: e.target.value })}
                      placeholder="e.g., Deluxe Ocean View"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Description
                    </label>
                    <Textarea
                      value={roomData.description}
                      onChange={(e) => setRoomData({ ...roomData, description: e.target.value })}
                      placeholder="Describe what makes this room special..."
                      rows={3}
                    />
                    {/* Suggestions built from this room's own type, beds and size — see the
                        component for why they are labelled "suggested" and not "AI". */}
                    <RoomDescriptionSuggestions
                      room={roomData}
                      onSelect={(text) => setRoomData({ ...roomData, description: text })}
                    />
                  </div>

                  {/* Steppers rather than bare number inputs: on a phone the old spinners were
                      fiddly and summoned a keyboard over the form. */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Number of Rooms *
                      </label>
                      <NumberStepper
                        value={roomData.count ?? 1}
                        onChange={(count) => setRoomData({ ...roomData, count })}
                        min={1}
                        max={500}
                        aria-label="number of rooms"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Max Guests *
                      </label>
                      <NumberStepper
                        value={roomData.maxGuests ?? 1}
                        onChange={(maxGuests) => setRoomData({ ...roomData, maxGuests })}
                        min={1}
                        max={20}
                        suffix="guests"
                        aria-label="maximum guests"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Size *
                      </label>
                      <NumberStepper
                        value={roomData.size ?? 1}
                        onChange={(size) => setRoomData({ ...roomData, size })}
                        min={1}
                        max={2000}
                        step={5}
                        suffix="m²"
                        aria-label="room size in square metres"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <h3 className="text-lg font-semibold mb-4">Bed Configuration</h3>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {BED_TYPES.map((bed) => {
                      const quantity =
                        roomData.beds?.find((b) => b.type === bed.value)?.quantity || 0
                      const isCustom = bed.value === CUSTOM_BED_TYPE
                      return (
                        <div key={bed.value} className="border rounded-lg p-4">
                          <div className="text-2xl mb-2">{bed.icon}</div>
                          <div className="font-medium text-foreground">{bed.label}</div>
                          <div className="text-xs text-muted-foreground">
                            {isCustom ? 'Name your own' : `${bed.width}cm wide`}
                          </div>
                          <div className="flex items-center gap-2 mt-3">
                            <button
                              onClick={() => removeBed(bed.value)}
                              className="w-8 h-8 flex items-center justify-center bg-muted hover:bg-muted/80 rounded"
                              disabled={quantity === 0}
                            >
                              -
                            </button>
                            <span className="w-8 text-center font-semibold">{quantity}</span>
                            <button
                              onClick={() => addBed(bed.value)}
                              className="w-8 h-8 flex items-center justify-center bg-info hover:bg-info/90 text-primary-foreground rounded"
                            >
                              +
                            </button>
                          </div>

                          {isCustom && quantity > 0 && (
                            <Input
                              value={
                                roomData.beds?.find((b) => b.type === CUSTOM_BED_TYPE)
                                  ?.customLabel ?? ''
                              }
                              onChange={(e) =>
                                setRoomData({
                                  ...roomData,
                                  beds: (roomData.beds ?? []).map((b) =>
                                    b.type === CUSTOM_BED_TYPE
                                      ? { ...b, customLabel: e.target.value }
                                      : b,
                                  ),
                                })
                              }
                              placeholder="e.g. Bunk bed"
                              maxLength={30}
                              className="mt-3 h-9 text-sm"
                            />
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {roomData.beds && roomData.beds.length > 0 && (
                    <div className="bg-info/10 border border-info/20 rounded-lg p-4">
                      <p className="text-sm text-foreground">
                        <strong>Selected:</strong>{' '}
                        {roomData.beds.map((b) => `${b.quantity}x ${bedLabel(b)}`).join(', ')}
                      </p>
                    </div>
                  )}
                </motion.div>
              )}

              {currentStep === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <h3 className="text-lg font-semibold mb-4">Pricing</h3>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Base Price per Night *
                    </label>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        {/* type="text" + inputMode="decimal", NOT type="number".
                            Two bugs lived in the number input. Clearing it made e.target.value ''
                            so `parseInt('') || 0` wrote a literal 0 back into state, and React
                            re-rendered value={0} over an empty box — the partner could never delete
                            the zero. Then typing after it produced '0120000', and React did not
                            correct the DOM because for number inputs it compares LOOSELY
                            ('0120000' != 120000 is false), so the wrong string stayed on screen
                            while state held 120000. A string draft can be genuinely empty and
                            strips its own leading zeros. */}
                        <Input
                          type="text"
                          inputMode="decimal"
                          value={priceDraft}
                          onChange={(e) => {
                            const raw = e.target.value
                              .replace(/[^\d.]/g, '')
                              .replace(/(\..*)\./g, '$1')
                              .replace(/^0+(?=\d)/, '')
                            setPriceDraft(raw)
                            setRoomData({
                              ...roomData,
                              pricing: {
                                ...roomData.pricing!,
                                basePrice: raw === '' ? 0 : Number(raw),
                              },
                            })
                          }}
                          placeholder="100"
                          aria-label="Base price per night"
                        />
                      </div>
                      {/* Currency is a property of the LISTING, not of each room. It used to be a
                          per-room select, so two rooms could disagree and the "from" price did a
                          Math.min across mixed currencies — comparing 120000 PKR against 400 USD as
                          bare numbers. It is now set once on the property and shown here read-only.
                          Nothing is converted: the price is stored exactly as the partner types it. */}
                      <div className="flex items-center rounded-lg border border-border bg-muted px-4 text-sm font-medium text-muted-foreground">
                        {listingCurrency}
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Prices are in {listingCurrency}, set for the whole property on the details
                      step.
                    </p>
                  </div>

                  {roomData.pricing && roomData.pricing.basePrice > 0 && (
                    <div className="bg-success/10 border border-success/20 rounded-lg p-6">
                      <h4 className="font-semibold text-foreground mb-3">Summary</h4>
                      <div className="space-y-2 text-sm text-success">
                        <p>
                          <strong>{roomData.name}</strong> ({roomData.count} room
                          {roomData.count! > 1 ? 's' : ''})
                        </p>
                        <p>
                          Max {roomData.maxGuests} guests · {roomData.size}m²
                        </p>
                        <p>
                          {roomData.beds?.map((b) => `${b.quantity}x ${bedLabel(b)}`).join(', ')}
                        </p>
                        <p className="text-lg font-bold text-foreground mt-3">
                          {roomData.pricing.basePrice} {roomData.pricing.currency}/night
                        </p>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          {/* shrink-0 pins the footer so Back/Next are always reachable, however tall the step is. */}
          <div className="shrink-0 flex items-center justify-between p-6 border-t bg-muted">
            <Button onClick={handleBack} variant="outline" disabled={currentStep === 1}>
              <ChevronLeft size={20} className="mr-1" />
              Back
            </Button>

            <Button
              onClick={handleNext}
              disabled={!isStepValid()}
              className="bg-info hover:bg-info/90 text-primary-foreground"
            >
              {currentStep === 4 ? (
                <>
                  <Check size={20} className="mr-2" />
                  Save Room
                </>
              ) : (
                <>
                  Next
                  <ChevronRight size={20} className="ml-1" />
                </>
              )}
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>,
    document.body,
  )
}
