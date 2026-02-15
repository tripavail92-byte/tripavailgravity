import {
  Accessibility,
  BatteryCharging,
  Car,
  Coffee,
  ConciergeBell,
  Dumbbell,
  Plane,
  Sparkles,
  Utensils,
  Waves,
  Wifi,
} from 'lucide-react'
import { motion } from 'motion/react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

import type { StepData } from '../CompleteHotelListingFlow'

export interface ServicesData {
  breakfast: 'included' | 'optional' | 'none'
  parking: 'free' | 'paid' | 'none'
  wifi: 'free' | 'paid' | 'none'
  facilities: {
    pool: boolean
    gym: boolean
    spa: boolean
    restaurant: boolean
    roomService: boolean
    airportShuttle: boolean
    evCharging: boolean
  }
  accessibility: {
    wheelchairAccessible: boolean
    elevator: boolean
  }
}

interface ServicesStepProps {
  existingData?: { services?: ServicesData }
  onUpdate?: (data: StepData) => void
}

const FACILITY_ICONS = {
  pool: Waves,
  gym: Dumbbell,
  spa: Sparkles,
  restaurant: Utensils,
  roomService: ConciergeBell,
  airportShuttle: Plane,
  evCharging: BatteryCharging,
}

const FACILITY_LABELS = {
  pool: 'Swimming Pool',
  gym: 'Gym / Fitness Center',
  spa: 'Spa & Wellness',
  restaurant: 'Restaurant / Bar',
  roomService: 'Room Service',
  airportShuttle: 'Airport Shuttle',
  evCharging: 'EV Charging Station',
}

export function ServicesStep({ existingData, onUpdate }: ServicesStepProps) {
  const [services, setServices] = useState<ServicesData>(
    existingData?.services || {
      breakfast: 'none',
      parking: 'none',
      wifi: 'free',
      facilities: {
        pool: false,
        gym: false,
        spa: false,
        restaurant: false,
        roomService: false,
        airportShuttle: false,
        evCharging: false,
      },
      accessibility: {
        wheelchairAccessible: false,
        elevator: false,
      },
    },
  )

  const handleUpdate = (updates: Partial<ServicesData>) => {
    const updated = { ...services, ...updates }
    setServices(updated)
    if (onUpdate) {
      onUpdate({ services: updated })
    }
  }

  const handleFacilityToggle = (key: keyof ServicesData['facilities']) => {
    handleUpdate({
      facilities: {
        ...services.facilities,
        [key]: !services.facilities[key],
      },
    })
  }

  const handleAccessibilityToggle = (key: keyof ServicesData['accessibility']) => {
    handleUpdate({
      accessibility: {
        ...services.accessibility,
        [key]: !services.accessibility[key],
      },
    })
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Additional Services</h2>
        <p className="text-gray-600 mt-1">What extra services and facilities do you offer?</p>
      </div>

      {/* Core Services */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Breakfast */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Coffee size={24} className="text-primary" />
            </div>
            <h3 className="font-semibold">Breakfast</h3>
          </div>
          <div className="space-y-2">
            {[
              { value: 'included', label: 'Included in price' },
              { value: 'optional', label: 'Optional (extra cost)' },
              { value: 'none', label: 'Not available' },
            ].map((opt) => (
              <Button
                key={opt.value}
                variant="ghost"
                onClick={() => handleUpdate({ breakfast: opt.value as any })}
                className={`w-full text-left px-4 py-2 text-sm ${
                  services.breakfast === opt.value
                    ? 'bg-primary/5 text-primary font-medium ring-1 ring-primary/20'
                    : 'hover:bg-gray-50 text-gray-600'
                }`}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </Card>

        {/* Parking */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Car size={24} className="text-primary" />
            </div>
            <h3 className="font-semibold">Parking</h3>
          </div>
          <div className="space-y-2">
            {[
              { value: 'free', label: 'Free parking' },
              { value: 'paid', label: 'Paid parking' },
              { value: 'none', label: 'No parking' },
            ].map((opt) => (
              <Button
                key={opt.value}
                variant="ghost"
                onClick={() => handleUpdate({ parking: opt.value as any })}
                className={`w-full text-left px-4 py-2 text-sm ${
                  services.parking === opt.value
                    ? 'bg-primary/5 text-primary font-medium ring-1 ring-primary/20'
                    : 'hover:bg-gray-50 text-gray-600'
                }`}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </Card>

        {/* WiFi */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Wifi size={24} className="text-primary" />
            </div>
            <h3 className="font-semibold">Internet</h3>
          </div>
          <div className="space-y-2">
            {[
              { value: 'free', label: 'Free Wi-Fi' },
              { value: 'paid', label: 'Paid Wi-Fi' },
              { value: 'none', label: 'No internet access' },
            ].map((opt) => (
              <Button
                key={opt.value}
                variant="ghost"
                onClick={() => handleUpdate({ wifi: opt.value as any })}
                className={`w-full text-left px-4 py-2 text-sm ${
                  services.wifi === opt.value
                    ? 'bg-primary/5 text-primary font-medium ring-1 ring-primary/20'
                    : 'hover:bg-gray-50 text-gray-600'
                }`}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </Card>
      </div>

      {/* Facilities Grid */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Facilities & Amenities</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(FACILITY_LABELS).map(([key, label]) => {
            const Icon = FACILITY_ICONS[key as keyof typeof FACILITY_ICONS]
            const isSelected = services.facilities[key as keyof typeof services.facilities]

            return (
              <motion.button
                key={key}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleFacilityToggle(key as any)}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-gray-100 bg-white hover:border-gray-200 text-gray-600'
                }`}
              >
                <Icon size={20} className={isSelected ? 'text-primary' : 'text-gray-400'} />
                <span className="font-medium text-sm">{label}</span>
              </motion.button>
            )
          })}
        </div>
      </Card>

      {/* Accessibility */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-success/10 rounded-lg">
            <Accessibility size={24} className="text-success" />
          </div>
          <h3 className="font-semibold">Accessibility</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="checkbox"
              checked={services.accessibility.wheelchairAccessible}
              onChange={() => handleAccessibilityToggle('wheelchairAccessible')}
              className="w-5 h-5 text-primary rounded focus:ring-primary/50"
            />
            <span className="font-medium text-gray-700">Wheelchair Accessible</span>
          </label>
          <label className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="checkbox"
              checked={services.accessibility.elevator}
              onChange={() => handleAccessibilityToggle('elevator')}
              className="w-5 h-5 text-primary rounded focus:ring-primary/50"
            />
            <span className="font-medium text-gray-700">Elevator / Lift</span>
          </label>
        </div>
      </Card>
    </div>
  )
}
