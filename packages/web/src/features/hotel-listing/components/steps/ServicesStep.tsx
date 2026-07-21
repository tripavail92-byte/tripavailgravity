import {
  BatteryCharging,
  BellRing,
  Car,
  Coffee,
  Sandwich,
  Landmark,
  Map,
  Mountain,
  Package,
  ShieldCheck,
  Stethoscope,
  Utensils,
  Wifi,
} from 'lucide-react'
import { motion } from 'motion/react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

import type { StepData } from '../CompleteHotelListingFlow'

/**
 * This step used to re-ask for things the Amenities step already collects. Of the twelve entries it
 * offered, eleven were duplicates — pool, gym, spa, restaurant, room service, airport shuttle,
 * wheelchair access and elevator are all amenity checkboxes, and breakfast/parking/wi-fi exist there
 * too. Only EV charging was genuinely additional. The heading even read "Facilities & Amenities".
 *
 * The split now means something:
 *   breakfast / parking / wifi  — kept, because they carry a PRICE (included vs paid vs none), which
 *                                 an amenity checkbox cannot express. Ticking "Free Parking" under
 *                                 Amenities says you have it; this says what it costs.
 *   services                    — genuinely additional things, none of which appear in the amenities
 *                                 list. Verified one by one against AmenitiesStep's categories.
 *
 * Old keys (pool, gym, spa, restaurant, roomService, airportShuttle, wheelchairAccessible, elevator)
 * are intentionally gone. Listings that saved them keep the values harmlessly in their JSONB; the
 * Review step renders whatever keys are present, so nothing breaks for existing hotels.
 */
export interface ServicesData {
  breakfast: 'included' | 'optional' | 'none'
  parking: 'free' | 'paid' | 'none'
  wifi: 'free' | 'paid' | 'none'
  facilities: {
    evCharging: boolean
    tourDesk: boolean
    guidedTreks: boolean
    equipmentRental: boolean
    packedMeals: boolean
    localTransfers: boolean
    porterService: boolean
    doctorOnCall: boolean
    security24h: boolean
    prayerRoom: boolean
    halalKitchen: boolean
  }
}

interface ServicesStepProps {
  existingData?: { services?: ServicesData }
  onUpdate?: (data: StepData) => void
}

const FACILITY_ICONS = {
  evCharging: BatteryCharging,
  tourDesk: Map,
  guidedTreks: Mountain,
  equipmentRental: Package,
  packedMeals: Sandwich,
  localTransfers: Car,
  porterService: BellRing,
  doctorOnCall: Stethoscope,
  security24h: ShieldCheck,
  prayerRoom: Landmark,
  halalKitchen: Utensils,
}

// Every label below was checked against AmenitiesStep and is absent from it. Things like a pool,
// gym, restaurant or airport shuttle belong there, not here.
const FACILITY_LABELS = {
  evCharging: 'EV Charging Station',
  tourDesk: 'Tour Desk & Excursion Booking',
  guidedTreks: 'Guided Treks & Expeditions',
  equipmentRental: 'Trekking / Sports Equipment Hire',
  packedMeals: 'Packed Meals for Day Trips',
  localTransfers: 'Local Transfers & Day Hire',
  porterService: 'Porter / Bellhop Service',
  doctorOnCall: 'Doctor on Call',
  security24h: '24-Hour Security',
  prayerRoom: 'Prayer Room',
  halalKitchen: 'Halal-Certified Kitchen',
}

export function ServicesStep({ existingData, onUpdate }: ServicesStepProps) {
  const [services, setServices] = useState<ServicesData>(
    existingData?.services || {
      breakfast: 'none',
      parking: 'none',
      wifi: 'free',
      facilities: {
        evCharging: false,
        tourDesk: false,
        guidedTreks: false,
        equipmentRental: false,
        packedMeals: false,
        localTransfers: false,
        porterService: false,
        doctorOnCall: false,
        security24h: false,
        prayerRoom: false,
        halalKitchen: false,
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

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Additional Services</h2>
        <p className="text-muted-foreground mt-1">
          Pricing for the common ones, plus anything you offer beyond the amenities you already
          selected.
        </p>
      </div>

      {/* These three stay here even though Amenities also lists them: an amenity checkbox says you
          HAVE it, this says what it COSTS. That distinction is the reason for the duplication, so
          the heading now states it outright. */}
      <div>
        <h3 className="font-semibold text-foreground">What do these cost?</h3>
        <p className="text-sm text-muted-foreground mt-1 mb-4">
          You marked what the property has under Amenities. Here you set the price.
        </p>
      </div>
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

      {/* Genuinely additional services. This heading used to read "Facilities & Amenities" over a
          list of things the Amenities step already collected — which is precisely why the two steps
          felt like duplicates. */}
      <Card className="p-6">
        <h3 className="font-semibold text-foreground">Services you provide</h3>
        <p className="text-sm text-muted-foreground mt-1 mb-4">
          Things guests can request or book through you. Facilities the property simply has — pool,
          gym, restaurant, lift — belong under Amenities.
        </p>
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

    </div>
  )
}
