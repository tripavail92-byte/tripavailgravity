import { Check, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

import { BedConfig, RoomType } from './RoomsStep'

interface RoomWizardModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (room: RoomType) => void
  editingRoom?: RoomType | null
}

const ROOM_TYPES = [
  { value: 'standard', label: 'Standard Room', icon: '🛏️', priceRange: '$50-100' },
  { value: 'deluxe', label: 'Deluxe Room', icon: '✨', priceRange: '$100-150' },
  { value: 'suite', label: 'Suite', icon: '🏰', priceRange: '$150-250' },
  { value: 'family', label: 'Family Room', icon: '👨‍👩‍👧‍👦', priceRange: '$120-200' },
  { value: 'executive', label: 'Executive Room', icon: '💼', priceRange: '$180-300' },
  { value: 'presidential', label: 'Presidential Suite', icon: '👑', priceRange: '$300+' },
] as const

const BED_TYPES = [
  { value: 'king', label: 'King Bed', icon: '🛏️', width: 180 },
  { value: 'queen', label: 'Queen Bed', icon: '🛌', width: 150 },
  { value: 'double', label: 'Double Bed', icon: '🛏️', width: 135 },
  { value: 'twin', label: 'Twin Bed', icon: '🛏️', width: 90 },
  { value: 'single', label: 'Single Bed', icon: '🛏️', width: 90 },
  { value: 'sofaBed', label: 'Sofa Bed', icon: '🛋️', width: 120 },
] as const

export function RoomWizardModal({ isOpen, onClose, onSave, editingRoom }: RoomWizardModalProps) {
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
        currency: 'USD',
      },
    },
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
        type: roomData.type as any,
        name: roomData.name || getRoomTypeLabel(roomData.type as any),
        description: roomData.description || '',
        count: roomData.count || 1,
        maxGuests: roomData.maxGuests || 2,
        size: roomData.size || 25,
        beds: roomData.beds || [],
        pricing: roomData.pricing || { basePrice: 100, currency: 'USD' },
      }
      onSave(finalRoom)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const getRoomTypeLabel = (type: string) => {
    return ROOM_TYPES.find((t) => t.value === type)?.label || type
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

  return (
    // overflow-y-auto + overscroll-contain: the dialog was taller than the viewport, so its
    // footer (Back / Next) sat below the fold with no way to reach it, and the wheel scrolled the
    // PAGE BEHIND instead. The body scroll-lock above stops the background moving at all.
    <div className="fixed inset-0 bg-foreground/50 z-50 flex items-center justify-center p-4 overflow-y-auto overscroll-contain">
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
                          setRoomData({ ...roomData, type: type.value as any })
                          if (
                            !roomData.name ||
                            roomData.name === getRoomTypeLabel(roomData.type as any)
                          ) {
                            setRoomData({ ...roomData, type: type.value as any, name: type.label })
                          }
                        }}
                        className={`p-4 border-2 rounded-xl transition-all ${
                          roomData.type === type.value
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-border/60'
                        }`}
                      >
                        <div className="text-3xl mb-2">{type.icon}</div>
                        <div className="font-semibold text-foreground">{type.label}</div>
                        <div className="text-xs text-muted-foreground mt-1">{type.priceRange}</div>
                        {roomData.type === type.value && (
                          <div className="mt-2">
                            <Check size={20} className="text-primary mx-auto" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
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
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Number of Rooms *
                      </label>
                      <Input
                        type="number"
                        min="1"
                        value={roomData.count}
                        onChange={(e) =>
                          setRoomData({ ...roomData, count: parseInt(e.target.value) || 1 })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Max Guests *
                      </label>
                      <Input
                        type="number"
                        min="1"
                        value={roomData.maxGuests}
                        onChange={(e) =>
                          setRoomData({ ...roomData, maxGuests: parseInt(e.target.value) || 1 })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Size (m²) *
                      </label>
                      <Input
                        type="number"
                        min="1"
                        value={roomData.size}
                        onChange={(e) =>
                          setRoomData({ ...roomData, size: parseInt(e.target.value) || 1 })
                        }
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
                      return (
                        <div key={bed.value} className="border rounded-lg p-4">
                          <div className="text-2xl mb-2">{bed.icon}</div>
                          <div className="font-medium text-foreground">{bed.label}</div>
                          <div className="text-xs text-muted-foreground">{bed.width}cm wide</div>
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
                        </div>
                      )
                    })}
                  </div>

                  {roomData.beds && roomData.beds.length > 0 && (
                    <div className="bg-info/10 border border-info/20 rounded-lg p-4">
                      <p className="text-sm text-foreground">
                        <strong>Selected:</strong>{' '}
                        {roomData.beds
                          .map(
                            (b) =>
                              `${b.quantity}x ${BED_TYPES.find((bt) => bt.value === b.type)?.label}`,
                          )
                          .join(', ')}
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
                        <Input
                          type="number"
                          min="1"
                          value={roomData.pricing?.basePrice}
                          onChange={(e) =>
                            setRoomData({
                              ...roomData,
                              pricing: {
                                ...roomData.pricing!,
                                basePrice: parseInt(e.target.value) || 0,
                              },
                            })
                          }
                          placeholder="100"
                        />
                      </div>
                      <select
                        value={roomData.pricing?.currency || 'USD'}
                        onChange={(e) =>
                          setRoomData({
                            ...roomData,
                            pricing: {
                              ...roomData.pricing!,
                              currency: e.target.value,
                            },
                          })
                        }
                        className="px-4 py-2 border border-border rounded-lg"
                      >
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                        <option value="PKR">PKR</option>
                      </select>
                    </div>
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
                          {roomData.beds
                            ?.map(
                              (b) =>
                                `${b.quantity}x ${BED_TYPES.find((bt) => bt.value === b.type)?.label}`,
                            )
                            .join(', ')}
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
    </div>
  )
}
