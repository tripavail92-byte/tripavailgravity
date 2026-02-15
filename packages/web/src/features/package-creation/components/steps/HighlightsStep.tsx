import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus, Trash2, Sparkles, Percent } from 'lucide-react'
import { getIconForHighlight } from '@/components/icons/packages/AnimatedHighlightIcons'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { StepData } from '../../types'

// Helper to determine if a highlight should be visually prominent
const isPremiumHighlight = (name: string): boolean => {
  const lower = name.toLowerCase()
  return (
    lower.includes('spa') ||
    lower.includes('massage') ||
    lower.includes('dinner') ||
    lower.includes('champagne') ||
    lower.includes('suite') ||
    lower.includes('view') ||
    lower.includes('transfer')
  )
}

// Suggested free inclusions - universal options with clear usage details
const getSuggestedFreeInclusions = (_packageType: string): string[] => {
  return [
    'Breakfast for 2 (daily) — restaurant buffet or set menu',
    'Late checkout to 3:00 PM — subject to availability; 1× per stay',
    'Early check-in from 12:00 PM — subject to availability; 1× per stay',
    'Welcome drink on arrival for 2 — 1× per guest',
    'High-speed Wi-Fi',
    'Spa wet-area access — sauna/steam/Jacuzzi, once per day',
    'Romantic room setup — rose petals + towel art, 1st night only',
    'In-room coffee/tea + two waters (daily)',
    'Complimentary parking — for duration of stay',
    'Pool / rooftop lounge access — standard hours',
  ]
}

// Suggested discount offers with prices
const getSuggestedDiscounts = (
  packageType: string,
): Array<{ name: string; originalPrice: number; discount: number }> => {
  const discountMap: {
    [key: string]: Array<{ name: string; originalPrice: number; discount: number }>
  } = {
    weekend: [
      { name: 'Spa treatments', originalPrice: 100, discount: 20 },
      { name: 'Restaurant dining', originalPrice: 60, discount: 15 },
      { name: 'In-room dining', originalPrice: 45, discount: 10 },
      { name: 'Laundry service', originalPrice: 40, discount: 10 },
      { name: 'Extra night extension', originalPrice: 150, discount: 25 },
    ],
    romantic: [
      { name: 'Couples massage', originalPrice: 200, discount: 30 },
      { name: 'Photography session', originalPrice: 150, discount: 25 },
      { name: 'Premium wine selection', originalPrice: 80, discount: 20 },
      { name: 'Private dining upgrade', originalPrice: 120, discount: 35 },
      { name: 'Flower arrangements', originalPrice: 60, discount: 15 },
    ],
    family: [
      { name: 'Babysitting services', originalPrice: 50, discount: 20 },
      { name: 'Theme park tickets', originalPrice: 80, discount: 15 },
      { name: 'Kids activities extra', originalPrice: 40, discount: 25 },
      { name: 'Family photography', originalPrice: 120, discount: 30 },
      { name: 'Extra bed/crib', originalPrice: 30, discount: 50 },
    ],
    business: [
      { name: 'Extended meeting room', originalPrice: 100, discount: 25 },
      { name: 'Secretarial services', originalPrice: 80, discount: 20 },
      { name: 'Business printing', originalPrice: 30, discount: 15 },
      { name: 'Video conferencing', originalPrice: 70, discount: 30 },
      { name: 'Translation services', originalPrice: 150, discount: 25 },
    ],
    adventure: [
      { name: 'Adventure photography', originalPrice: 120, discount: 30 },
      { name: 'Equipment insurance', originalPrice: 50, discount: 50 },
      { name: 'Additional guides', originalPrice: 100, discount: 20 },
      { name: 'Gear upgrades', originalPrice: 80, discount: 25 },
      { name: 'Extra excursions', originalPrice: 150, discount: 15 },
    ],
    culinary: [
      { name: 'Premium wine selection', originalPrice: 100, discount: 25 },
      { name: 'Private chef service', originalPrice: 300, discount: 35 },
      { name: 'Additional courses', originalPrice: 75, discount: 20 },
      { name: 'Cooking equipment', originalPrice: 50, discount: 30 },
      { name: 'Food delivery', originalPrice: 40, discount: 15 },
    ],
    wellness: [
      { name: 'Additional spa services', originalPrice: 120, discount: 25 },
      { name: 'Personal trainer session', originalPrice: 90, discount: 30 },
      { name: 'Wellness products', originalPrice: 60, discount: 20 },
      { name: 'Nutrition consultation', originalPrice: 100, discount: 35 },
      { name: 'Extended treatments', originalPrice: 150, discount: 15 },
    ],
    luxury: [
      { name: 'Luxury car service', originalPrice: 300, discount: 40 },
      { name: 'Private dining chef', originalPrice: 400, discount: 30 },
      { name: 'Premium experiences', originalPrice: 500, discount: 25 },
      { name: 'Personal shopper', originalPrice: 200, discount: 35 },
      { name: 'Yacht rental', originalPrice: 1000, discount: 20 },
    ],
  }

  return discountMap[packageType] || discountMap.weekend
}

// Get smart default price based on service name
const getDefaultPrice = (serviceName: string): number => {
  const priceMap: { [key: string]: number } = {
    spa: 100,
    massage: 150,
    restaurant: 60,
    dining: 50,
    laundry: 40,
    'room service': 35,
    photography: 150,
    photo: 150,
    wine: 80,
    transfer: 100,
    car: 120,
    meeting: 100,
    guide: 100,
    equipment: 80,
    ticket: 80,
    babysit: 50,
    bed: 30,
    crib: 30,
  }

  const key = Object.keys(priceMap).find((k) => serviceName.toLowerCase().includes(k))

  return key ? priceMap[key] : 50 // Default $50
}

interface HighlightsStepProps {
  onComplete: (data: StepData) => void
  onUpdate: (data: StepData) => void
  existingData?: StepData
  onBack: () => void
}

export const HighlightsStep = ({
  onComplete,
  onUpdate,
  existingData,
  onBack,
}: HighlightsStepProps) => {
  // Local state for free inclusions
  const [inclusions, setInclusions] = useState<Array<{ name: string; icon?: string }>>(
    existingData?.freeInclusions || [],
  )
  const [newInclusion, setNewInclusion] = useState('')

  // Local state for discounts
  // Local state for discounts
  const [discounts, setDiscounts] = useState<
    Array<{ name: string; originalPrice: number; discount: number; icon?: string }>
  >(existingData?.discountOffers || [])

  // Dialog state for adding discount
  const [isDiscountDialogOpen, setIsDiscountDialogOpen] = useState(false)
  const [editingDiscountIndex, setEditingDiscountIndex] = useState<number | null>(null)
  const [newDiscount, setNewDiscount] = useState({
    name: '',
    originalPrice: 100, // Default value
    discount: 20, // Default percentage
  })

  // Sync back to global state when local state changes
  useEffect(() => {
    onUpdate({
      ...existingData,
      freeInclusions: inclusions,
      discountOffers: discounts,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inclusions, discounts])

  // Handler for adding a free inclusion
  const addFreeInclusion = (name: string) => {
    if (!name.trim()) return

    // Check for duplicates
    if (inclusions.some((i) => i.name.toLowerCase() === name.toLowerCase())) {
      return
    }

    setInclusions((prev) => [...prev, { name: name.trim() }])
    setNewInclusion('')
  }

  // Handler for removing a free inclusion
  const removeFreeInclusion = (index: number) => {
    setInclusions((prev) => prev.filter((_, i) => i !== index))
  }

  // Handler for adding/updating a discount Offer
  const saveDiscountOffer = () => {
    if (!newDiscount.name.trim()) return

    if (editingDiscountIndex !== null) {
      // Update existing
      setDiscounts((prev) =>
        prev.map((item, i) =>
          i === editingDiscountIndex
            ? {
                name: newDiscount.name.trim(),
                originalPrice: Number(newDiscount.originalPrice),
                discount: Number(newDiscount.discount),
              }
            : item,
        ),
      )
    } else {
      // Add new
      // Check for duplicates only on add
      if (discounts.some((d) => d.name.toLowerCase() === newDiscount.name.trim().toLowerCase())) {
        return
      }

      setDiscounts((prev) => [
        ...prev,
        {
          name: newDiscount.name.trim(),
          originalPrice: Number(newDiscount.originalPrice),
          discount: Number(newDiscount.discount),
        },
      ])
    }

    setNewDiscount({ name: '', originalPrice: 100, discount: 20 })
    setEditingDiscountIndex(null)
    setIsDiscountDialogOpen(false)
  }

  // Handler for removing a discount
  const removeDiscountOffer = (index: number) => {
    setDiscounts((prev) => prev.filter((_, i) => i !== index))
  }

  // Open discount dialog with data
  const openDiscountDialog = (
    name: string = '',
    originalPrice: number = 0,
    discount: number = 10,
    index: number | null = null,
  ) => {
    setNewDiscount({
      name,
      originalPrice: originalPrice || getDefaultPrice(name),
      discount,
    })
    setEditingDiscountIndex(index)
    setIsDiscountDialogOpen(true)
  }

  const suggestedFreeInclusions = getSuggestedFreeInclusions(
    existingData?.packageType || 'weekend',
  ).filter((s) => !inclusions.some((i) => i.name.toLowerCase() === s.toLowerCase()))

  const suggestedDiscounts = getSuggestedDiscounts(existingData?.packageType || 'weekend')

  // Calculate generic total value for preview (just an estimation for visual flair)
  const estimatedValue =
    inclusions.length * 50 +
    discounts.reduce((acc, d) => acc + d.originalPrice * (d.discount / 100), 0)

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-primary">Package Highlights</h2>
        <p className="text-muted-foreground max-w-[600px] mx-auto text-lg">
          Make your package irresistible with free perks and exclusive discounts.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Input Forms */}
        <div className="lg:col-span-2 space-y-8">
          {/* Section 1: Free Inclusions */}
          <Card className="p-6 border-primary/20 shadow-sm overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Sparkles className="w-24 h-24 text-primary" />
            </div>

            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Free Inclusions</h3>
                  <p className="text-sm text-muted-foreground">Perks included in the base price</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="e.g. Daily Breakfast, Airport Transfer..."
                  value={newInclusion}
                  onChange={(e) => setNewInclusion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addFreeInclusion(newInclusion)
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  onClick={() => addFreeInclusion(newInclusion)}
                  disabled={!newInclusion.trim()}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add
                </Button>
              </div>

              {/* Suggestions */}
              {suggestedFreeInclusions.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs text-muted-foreground">Popular free inclusions:</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {suggestedFreeInclusions.slice(0, 6).map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => addFreeInclusion(suggestion)}
                        className="text-xs bg-secondary/50 hover:bg-secondary px-3 py-2 rounded-lg transition-colors flex items-center justify-between group/btn text-left"
                      >
                        <span className="truncate pr-2">{suggestion}</span>
                        <Plus className="w-3 h-3 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* List of Added Inclusions */}
              <div className="space-y-3 pt-2">
                <AnimatePresence mode="popLayout">
                  {inclusions.map((item, index) => {
                    const Icon = getIconForHighlight(item.name)
                    return (
                      <motion.div
                        key={`inclusion-${index}`}
                        initial={{ opacity: 0, height: 0, y: 10 }}
                        animate={{ opacity: 1, height: 'auto', y: 0 }}
                        exit={{ opacity: 0, height: 0, scale: 0.9 }}
                        className="flex items-center justify-between p-3 bg-card border rounded-lg group hover:border-primary/20 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Icon className="w-4 h-4 text-primary" animate={false} />
                          </div>
                          <span className="font-medium">{item.name}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                          onClick={() => removeFreeInclusion(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>

                {inclusions.length === 0 && (
                  <div className="text-center py-8 border-2 border-dashed rounded-lg">
                    <p className="text-muted-foreground">No inclusions added yet</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Add perks like WiFi, Breakfast, or Parking
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Section 2: Exclusive Discounts */}
          <Card className="p-6 border-primary/20 shadow-sm overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Percent className="w-24 h-24 text-primary" />
            </div>

            <div className="relative z-10 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Percent className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">Exclusive Discounts</h3>
                    <p className="text-sm text-muted-foreground">
                      Special offers on extra services
                    </p>
                  </div>
                </div>

                <Dialog open={isDiscountDialogOpen} onOpenChange={setIsDiscountDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      onClick={() => openDiscountDialog()}
                      className="border-primary/20 hover:bg-primary/5 text-primary"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Offer
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Discount Offer</DialogTitle>
                      <DialogDescription>
                        Create a special price for an add-on service.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Item Name</Label>
                        <Input
                          placeholder="e.g. Couples Massage"
                          value={newDiscount.name}
                          onChange={(e) => setNewDiscount({ ...newDiscount, name: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Original Price ($)</Label>
                          <Input
                            type="number"
                            min="0"
                            value={newDiscount.originalPrice}
                            onChange={(e) =>
                              setNewDiscount({
                                ...newDiscount,
                                originalPrice: parseFloat(e.target.value),
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Discount (%)</Label>
                          <div className="flex items-center gap-2">
                            <Slider
                              value={[newDiscount.discount]}
                              onValueChange={(vals) =>
                                setNewDiscount({ ...newDiscount, discount: vals[0] })
                              }
                              max={100}
                              step={5}
                              className="flex-1"
                            />
                            <span className="w-12 text-right font-mono">
                              {newDiscount.discount}%
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 bg-secondary/30 rounded-lg text-sm flex justify-between items-center">
                        <span>New Price:</span>
                        <span className="font-bold text-success">
                          $
                          {(newDiscount.originalPrice * (1 - newDiscount.discount / 100)).toFixed(
                            2,
                          )}
                        </span>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={saveDiscountOffer}>
                        {editingDiscountIndex !== null ? 'Update Offer' : 'Add Offer'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {/* List of Discounts */}
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {discounts.map((item, index) => {
                    const Icon = getIconForHighlight(item.name)
                    return (
                      <motion.div
                        key={`discount-${index}`}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center justify-between p-4 bg-card border border-primary/20 rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Icon className="w-5 h-5 text-primary" animate={false} />
                          </div>
                          <div>
                            <div className="font-medium">{item.name}</div>
                            <div className="flex items-center gap-2 text-sm">
                              <span className="line-through text-muted-foreground">
                                ${item.originalPrice}
                              </span>
                              <span className="font-bold text-success">
                                ${(item.originalPrice * (1 - item.discount / 100)).toFixed(0)}
                              </span>
                              <span className="text-xs bg-success-foreground text-success px-1.5 py-0.5 rounded">
                                -{item.discount}%
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs text-primary hover:text-primary/80 hover:bg-primary/10"
                            onClick={() =>
                              openDiscountDialog(
                                item.name,
                                item.originalPrice,
                                item.discount,
                                index,
                              )
                            }
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive h-8 w-8"
                            onClick={() => removeDiscountOffer(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>

                {discounts.length === 0 && (
                  <div className="text-center py-8 border-2 border-dashed border-primary/20 rounded-lg">
                    <p className="text-muted-foreground">No custom offers added yet</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Add custom offers or select from popular ones below
                    </p>
                  </div>
                )}
              </div>

              {/* Discount Suggestions */}
              <div className="space-y-3 pt-4 border-t border-primary/10">
                <p className="text-xs text-muted-foreground font-medium">
                  Popular discount offers:
                </p>
                <div className="space-y-2">
                  {suggestedDiscounts
                    .filter(
                      (suggestion) => !discounts.some((item) => item.name === suggestion.name),
                    )
                    .slice(0, 4)
                    .map((suggestion, index) => {
                      const finalPrice =
                        suggestion.originalPrice -
                        (suggestion.originalPrice * suggestion.discount) / 100
                      return (
                        <motion.button
                          key={suggestion.name}
                          onClick={() =>
                            openDiscountDialog(
                              suggestion.name,
                              suggestion.originalPrice,
                              suggestion.discount,
                            )
                          }
                          className="w-full flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-primary/5 dark:hover:bg-slate-700 hover:border-primary/30 dark:hover:border-primary/30 text-left transition-all group"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ x: 2 }}
                        >
                          <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full group-hover:bg-white dark:group-hover:bg-slate-600 transition-colors">
                            <Percent className="w-4 h-4 text-slate-600 dark:text-slate-300 group-hover:text-primary dark:group-hover:text-primary" />
                          </div>
                          <div className="flex-1">
                            <span className="text-sm font-medium text-slate-900 dark:text-slate-100 block group-hover:text-primary dark:group-hover:text-primary transition-colors">
                              {suggestion.name}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              ${suggestion.originalPrice}{' '}
                              <span className="text-slate-300 px-1">→</span>{' '}
                              <span className="font-medium text-success">
                                ${finalPrice.toFixed(0)} ({suggestion.discount}% OFF)
                              </span>
                            </span>
                          </div>
                          <Plus className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" />
                        </motion.button>
                      )
                    })}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Live Preview */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <Card className="p-0 overflow-hidden border-2 shadow-lg bg-slate-50 dark:bg-slate-950/50">
              <div className="bg-slate-900 text-white p-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  <span className="text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Guest View
                  </span>
                </div>
                <h4 className="font-semibold">Package Preview</h4>
              </div>

              <div className="p-5 space-y-6">
                {/* Inclusions Tag Cloud */}
                <div className="space-y-3">
                  <h5 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-3 h-3" /> Included FREE
                  </h5>

                  <div className="flex flex-wrap gap-2">
                    {inclusions.length > 0 ? (
                      inclusions.map((item, i) => {
                        const Icon = getIconForHighlight(item.name)
                        const isPremium = isPremiumHighlight(item.name)

                        return (
                          <div
                            key={i}
                            className={cn(
                              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-all duration-300',
                              isPremium
                                ? 'bg-primary/5 border-primary/20 text-primary shadow-sm'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300',
                            )}
                          >
                            <Icon
                              className={cn(
                                'w-3.5 h-3.5',
                                isPremium ? 'text-primary' : 'text-slate-400',
                              )}
                              animate={inclusions.length < 5}
                            />
                            <span className="font-medium">{item.name}</span>
                          </div>
                        )
                      })
                    ) : (
                      <span className="text-sm text-muted-foreground italic">
                        Add inclusions to see them here...
                      </span>
                    )}
                  </div>
                </div>

                {/* Discounts List */}
                {discounts.length > 0 && (
                  <div className="space-y-3">
                    <div className="h-px bg-slate-200 dark:bg-slate-800" />
                    <h5 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <Percent className="w-3 h-3" /> Exclusive Offers
                    </h5>

                    <div className="space-y-2">
                      {discounts.map((item, i) => (
                        <div
                          key={i}
                          className="flex justify-between items-center bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm"
                        >
                          <span
                            className="text-sm font-medium truncate max-w-[120px]"
                            title={item.name}
                          >
                            {item.name}
                          </span>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="line-through text-slate-400 text-xs">
                              ${item.originalPrice}
                            </span>
                            <span className="font-bold text-success">
                              ${(item.originalPrice * (1 - item.discount / 100)).toFixed(0)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Value Summary */}
                {(inclusions.length > 0 || discounts.length > 0) && (
                  <div className="pt-2">
                    <div className="bg-primary/5 p-3 rounded-lg border border-primary/10 text-center">
                      <div className="text-xs text-muted-foreground">Total Added Value</div>
                      <div className="text-xl font-bold text-primary">
                        ~${estimatedValue.toFixed(0)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-6 border-t">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button
          onClick={() =>
            onComplete({
              ...existingData,
              freeInclusions: inclusions,
              discountOffers: discounts,
            })
          }
          size="lg"
          disabled={inclusions.length === 0 && discounts.length === 0}
        >
          Continue
        </Button>
      </div>
    </div>
  )
}
