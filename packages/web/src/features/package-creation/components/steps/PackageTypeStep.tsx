import { Check } from 'lucide-react'
import { motion } from 'motion/react'

import { cn } from '@/lib/utils'

import { PACKAGE_TYPE_CONFIG } from '../../assets/PackageTypeIcons'
import { PackageType, StepData } from '../../types'

interface PackageTypeStepProps {
  onComplete: (data: StepData) => void
  existingData?: StepData
  onUpdate: (data: StepData) => void
  onBack: () => void
}

export function PackageTypeStep({ onComplete, existingData, onUpdate }: PackageTypeStepProps) {
  const selectedType = existingData?.packageType

  const handleSelect = (type: PackageType) => {
    if (existingData?.packageType !== type) {
      onUpdate({
        ...existingData,
        packageType: type,
        name: '',
        description: '',
        durationDays: undefined,
      })
    } else {
      onUpdate({ ...existingData, packageType: type })
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Choose Your Package Type</h2>
        <p className="text-gray-600 mt-2">
          Select the type of package that best represents your offering.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(PACKAGE_TYPE_CONFIG).map(([key, config]) => {
          const type = key as PackageType
          const isSelected = selectedType === type
          const isCustom = type === PackageType.CUSTOM
          const Icon = config.icon

          return (
            <motion.button
              key={type}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSelect(type)}
              className={cn(
                'relative p-6 rounded-xl border-2 text-left transition-all duration-200 h-full flex flex-col group',
                isSelected
                  ? 'border-primary bg-primary/5 shadow-md ring-1 ring-primary'
                  : cn(
                      'border-gray-200 hover:border-gray-300 bg-white hover:shadow-sm',
                      isCustom && 'border-dashed border-gray-300 bg-gray-50/50',
                    ),
              )}
            >
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-3 right-3 w-6 h-6 bg-gradient-to-br from-[#9D4EDD] to-[#00D4FF] rounded-full flex items-center justify-center shadow-sm"
                >
                  <Check className="w-4 h-4 text-white" />
                </motion.div>
              )}

              <div className="flex justify-center mb-4 h-24 items-center">
                {config.vector ? (
                  <config.vector
                    isActive={isSelected}
                    size={96}
                    className="w-24 h-24 transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div
                    className={cn(
                      'w-12 h-12 rounded-lg flex items-center justify-center',
                      isSelected ? 'bg-white' : config.bg,
                    )}
                  >
                    <Icon className={cn('w-6 h-6', config.color)} />
                  </div>
                )}
              </div>

              <h3
                className={cn(
                  'font-semibold text-lg mb-1',
                  isSelected ? 'text-gray-900' : 'text-gray-700',
                )}
              >
                {config.label}
              </h3>

              <p className="text-sm text-gray-500 leading-relaxed mb-4">{config.description}</p>

              <div className="space-y-1 mt-auto">
                {config.features?.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div
                      className={cn(
                        'w-1 h-1 rounded-full',
                        isSelected ? 'bg-gray-600' : 'bg-gray-400',
                      )}
                    ></div>
                    <span className="text-xs text-gray-600">{feature}</span>
                  </div>
                ))}
              </div>
            </motion.button>
          )
        })}
      </div>

      {selectedType && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center mt-8"
        >
          <button
            onClick={() => onComplete({ packageType: selectedType })}
            className="px-8 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0"
          >
            Continue with {PACKAGE_TYPE_CONFIG[selectedType].label}
          </button>
        </motion.div>
      )}
    </div>
  )
}
