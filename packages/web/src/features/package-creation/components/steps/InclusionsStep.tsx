import { Camera, Car, Check, Clock, Map, Plus, Shield, Utensils, X } from 'lucide-react'
import { motion } from 'motion/react'
import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

import { StepData } from '../../types'

interface InclusionsStepProps {
  onComplete: (data: StepData) => void
  onUpdate: (data: StepData) => void
  existingData?: StepData
  onBack: () => void
}

const PRESET_CATEGORIES = [
  {
    id: 'meals',
    name: 'Meals & Beverages',
    icon: Utensils,
    items: ['Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Beverages', 'Welcome Drink', 'All Meals'],
  },
  {
    id: 'transport',
    name: 'Transportation',
    icon: Car,
    items: [
      'Airport Transfers',
      'All Transportation',
      'Private Vehicle',
      'Shared Transport',
      'Train Tickets',
      'Flight Tickets',
    ],
  },
  {
    id: 'activities',
    name: 'Activities & Tours',
    icon: Map,
    items: [
      'Guided Tours',
      'Entrance Fees',
      'Activity Equipment',
      'Safari',
      'Boat Ride',
      'City Tour',
      'Cultural Experience',
    ],
  },
  {
    id: 'guide',
    name: 'Guide & Support',
    icon: Camera,
    items: [
      'Professional Guide',
      'English Speaking Guide',
      'Local Guide',
      '24/7 Support',
      'Trip Coordinator',
    ],
  },
  {
    id: 'insurance',
    name: 'Insurance & Safety',
    icon: Shield,
    items: ['Travel Insurance', 'Medical Insurance', 'Safety Equipment', 'First Aid Kit'],
  },
  {
    id: 'accommodation',
    name: 'Accommodation',
    icon: Clock,
    items: [
      'Hotel Stay',
      'Resort Stay',
      'Camping',
      'Luxury Accommodation',
      'Standard Accommodation',
    ],
  },
]

export function InclusionsStep({
  onComplete,
  onUpdate,
  existingData,
  onBack,
}: InclusionsStepProps) {
  const [selectedInclusions, setSelectedInclusions] = useState<string[]>(
    (existingData?.inclusions as string[]) || [],
  )
  const [customInclusion, setCustomInclusion] = useState('')

  const toggleInclusion = (item: string) => {
    setSelectedInclusions((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item],
    )
  }

  const addCustomInclusion = () => {
    if (customInclusion.trim() && !selectedInclusions.includes(customInclusion.trim())) {
      setSelectedInclusions((prev) => [...prev, customInclusion.trim()])
      setCustomInclusion('')
    }
  }

  const removeInclusion = (item: string) => {
    setSelectedInclusions((prev) => prev.filter((i) => i !== item))
  }

  const handleContinue = () => {
    onComplete({ inclusions: selectedInclusions })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-32">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="text-center space-y-2"
      >
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">What's Included?</h2>
        <p className="text-gray-600 text-lg">Select everything that's included in your package</p>
      </motion.div>

      {/* Selected Inclusions Summary */}
      {selectedInclusions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <Card className="p-6 bg-success/5 border-success/20 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Check className="w-5 h-5 text-success" />
              <h3 className="font-semibold text-gray-900">
                {selectedInclusions.length} inclusion{selectedInclusions.length !== 1 ? 's' : ''}{' '}
                selected
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedInclusions.map((item) => (
                <Badge
                  key={item}
                  variant="outline"
                  className="bg-white border-success/30 text-gray-700 pr-1"
                >
                  {item}
                  <button
                    onClick={() => removeInclusion(item)}
                    className="ml-2 rounded-full hover:bg-error/10 p-0.5 transition-colors"
                  >
                    <X size={14} className="text-gray-500 hover:text-error" />
                  </button>
                </Badge>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Preset Categories */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="space-y-4"
      >
        {PRESET_CATEGORIES.map((category) => {
          const IconComponent = category.icon
          const selectedCount = category.items.filter((item) =>
            selectedInclusions.includes(item),
          ).length

          return (
            <Card
              key={category.id}
              className="p-6 border-gray-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <IconComponent size={20} className="text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{category.name}</h3>
                  {selectedCount > 0 && (
                    <p className="text-sm text-success">{selectedCount} selected</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                {category.items.map((item) => {
                  const isSelected = selectedInclusions.includes(item)
                  return (
                    <button
                      key={item}
                      onClick={() => toggleInclusion(item)}
                      className={cn(
                        'px-3 py-2 rounded-lg text-sm font-medium transition-all text-left',
                        isSelected
                          ? 'bg-primary/10 text-primary border-2 border-primary/30 ring-1 ring-primary/20 shadow-sm'
                          : 'bg-gray-50 text-gray-700 border-2 border-transparent hover:border-gray-200 hover:bg-gray-100',
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {isSelected && <Check size={16} className="flex-shrink-0" />}
                        <span className="truncate">{item}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </Card>
          )
        })}
      </motion.div>

      {/* Custom Inclusions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <Card className="p-6 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="font-semibold text-gray-900 mb-3">Add Custom Inclusion</h3>
          <div className="flex gap-2">
            <Input
              placeholder="e.g., Photography Session, Spa Treatment..."
              value={customInclusion}
              onChange={(e) => setCustomInclusion(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addCustomInclusion()}
              className="flex-1 bg-white"
            />
            <Button
              onClick={addCustomInclusion}
              disabled={!customInclusion.trim()}
              variant="outline"
              className="flex-shrink-0"
            >
              <Plus size={18} className="mr-1" />
              Add
            </Button>
          </div>
        </Card>
      </motion.div>

      {/* Navigation Buttons */}
      <motion.div
        className="flex justify-between pt-8 border-t border-gray-100 mt-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <button
          onClick={onBack}
          className="px-6 py-3 text-gray-600 font-medium hover:text-gray-900 transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleContinue}
          disabled={selectedInclusions.length === 0}
          className={cn(
            'px-8 py-3 bg-black text-white rounded-lg font-medium transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0 hover:bg-gray-800',
            selectedInclusions.length === 0 && 'opacity-50 cursor-not-allowed hover:transform-none',
          )}
        >
          Continue
        </button>
      </motion.div>
    </div>
  )
}
