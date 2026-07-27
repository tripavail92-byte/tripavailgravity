import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/hooks/useAuth'
import { isValidEmail } from '@/lib/validators'

import type { StepData } from '../CompleteHotelListingFlow'
import { PropertyDescriptionSuggestions } from '../ui/PropertyDescriptionSuggestions'

interface PropertyDetailsStepProps {
  onComplete: (data: StepData) => void
  existingData?: StepData
  onUpdate: (data: StepData) => void
  onBack: () => void
}

export function PropertyDetailsStep({
  onComplete,
  existingData,
  onUpdate,
  onBack,
}: PropertyDetailsStepProps) {
  const { user } = useAuth()
  const accountEmail = user?.email ?? ''

  const [formData, setFormData] = useState({
    hotelName: existingData?.hotelName || '',
    description: existingData?.description || '',
    contactEmail: existingData?.contactEmail || accountEmail,
    contactPhone: existingData?.contactPhone || '',
    currency: existingData?.currency || 'USD',
    // Kept as number|undefined rather than 0-as-unrated, so ReviewStep and the details page can
    // legitimately distinguish "not rated" from "rated at zero stars" (the star-rating cast for a
    // hostel or guesthouse should not be a 0 badge — it should simply be absent).
    starRating: existingData?.starRating,
  })

  const [showAISuggestions, setShowAISuggestions] = useState(false)
  const [emailTouched, setEmailTouched] = useState(false)

  const propertyType = existingData?.propertyType || 'Property'

  // Auth may still be resolving when this step first mounts, so the lazy initialiser above can miss
  // the account email. Fill it in when it arrives — but only into a field the partner has not
  // already filled, so we never overwrite what they typed.
  useEffect(() => {
    if (!accountEmail) return
    setFormData((prev) => {
      if (prev.contactEmail) return prev
      const next = { ...prev, contactEmail: accountEmail }
      onUpdate(next)
      return next
    })
    // onUpdate is redefined on every parent render; depending on it would loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountEmail])

  const handleInputChange = (field: string, value: string) => {
    const newData = { ...formData, [field]: value }
    setFormData(newData)
    onUpdate(newData)
  }

  // starRating is number | undefined, not a string, so it can't go through handleInputChange —
  // an empty picker selection must be `undefined`, not the string "" that stringifies as truthy.
  const handleStarRatingChange = (value: number | undefined) => {
    const newData = { ...formData, starRating: value }
    setFormData(newData)
    onUpdate(newData)
  }

  // The wizard's Next only checked that contactEmail was a non-empty string, so "khayam ali shujhat"
  // sailed through and was saved as the property's booking address — every guest notification to it
  // would silently fail.
  const emailIsValid = isValidEmail(formData.contactEmail)
  const showEmailError = emailTouched && formData.contactEmail.length > 0 && !emailIsValid

  const handleAISuggestionSelect = (suggestion: string) => {
    handleInputChange('description', suggestion)
    setShowAISuggestions(false)
  }

  const handleContinue = () => {
    if (formData.hotelName && formData.description && formData.contactEmail) {
      onComplete(formData)
    }
  }

  const isValid = formData.hotelName && formData.description && formData.contactEmail

  return (
    <div className="space-y-6">
      {/* Property Type Indicator - Black Airbnb Style */}
      <div className="bg-black p-4 rounded-lg -mx-4 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
            <span className="text-black text-xs font-bold">✓</span>
          </div>
          <span className="text-sm font-medium text-white">
            Listing a <span className="font-bold">{propertyType}</span>
          </span>
        </div>
      </div>

      {/* Property Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {propertyType} Name *
        </label>
        <Input
          type="text"
          placeholder={`Enter your ${propertyType.toLowerCase()} name`}
          value={formData.hotelName}
          onChange={(e) => handleInputChange('hotelName', e.target.value)}
          className="w-full"
        />
        <p className="text-xs text-gray-500 mt-1">
          Example: Sunset View {propertyType}, Paradise {propertyType}
        </p>
      </div>

      {/* Description with AI Assistant */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            {propertyType} Description *
          </label>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAISuggestions(!showAISuggestions)}
            className="text-xs text-purple-600 hover:text-purple-700 h-auto p-0"
          >
            <motion.div
              animate={{ rotate: showAISuggestions ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              ✨
            </motion.div>
            {showAISuggestions ? 'Hide ideas' : 'Need ideas?'}
          </Button>
        </div>

        <Textarea
          placeholder={`Describe your ${propertyType.toLowerCase()}, its unique features, and what makes it special...`}
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          className="w-full min-h-[120px] mb-2"
        />
        <p className="text-xs text-gray-500 mb-3">{formData.description.length}/500 characters</p>

        {/* AI Suggestions */}
        <AnimatePresence>
          {showAISuggestions && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Pass through whatever the wizard has collected so far, so the composed copy names
                  the real place rather than the property type alone. Absent fields are omitted —
                  fragments that reference a missing value are dropped, not rendered with a gap. */}
              <PropertyDescriptionSuggestions
                propertyType={propertyType}
                hotelName={formData.hotelName}
                city={existingData?.city}
                country={existingData?.country}
                starRating={existingData?.starRating}
                amenities={existingData?.amenities}
                onSuggestionSelect={handleAISuggestionSelect}
                className="mb-4"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Star Rating.
          Optional — some property types genuinely aren't rated (guesthouses, hostels), and forcing
          a value there would either push partners to invent one or park the field as a permanent 0.
          "Not rated" is a first-class choice, distinct from selecting 0 stars, so the field is
          stored as number | undefined rather than 0-as-unrated. */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Star rating <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <div className="flex flex-wrap items-center gap-2">
          {[1, 2, 3, 4, 5].map((n) => {
            const selected = formData.starRating === n
            return (
              <button
                key={n}
                type="button"
                onClick={() =>
                  // A second click on the same rating clears it — the only way to "un-set" once
                  // you've picked something without needing a separate reset control.
                  handleStarRatingChange(selected ? undefined : n)
                }
                aria-pressed={selected}
                className={`h-10 min-w-[3rem] rounded-full border px-4 text-sm font-semibold transition-colors ${
                  selected
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-input bg-background text-foreground hover:bg-muted'
                }`}
              >
                {n}★
              </button>
            )
          })}
          <button
            type="button"
            onClick={() => handleStarRatingChange(undefined)}
            aria-pressed={formData.starRating === undefined}
            className={`h-10 rounded-full border px-4 text-sm font-medium transition-colors ${
              formData.starRating === undefined
                ? 'border-primary bg-primary/10 text-foreground'
                : 'border-input bg-background text-muted-foreground hover:bg-muted'
            }`}
          >
            Not rated
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          The official rating your {propertyType.toLowerCase()} holds. Leave as “Not rated” if it
          doesn’t have one — many guesthouses, hostels and boutique stays don’t.
        </p>
      </div>

      {/* Contact Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Contact Email *</label>
          <Input
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="contact@yourhotel.com"
            value={formData.contactEmail}
            onChange={(e) => handleInputChange('contactEmail', e.target.value)}
            onBlur={() => setEmailTouched(true)}
            aria-invalid={showEmailError}
            className={showEmailError ? 'border-destructive focus-visible:ring-destructive' : ''}
          />
          {showEmailError ? (
            <p className="text-xs text-destructive mt-1">
              That doesn’t look like an email address. Bookings and guest messages are sent here.
            </p>
          ) : (
            <p className="text-xs text-gray-500 mt-1">
              {formData.contactEmail && formData.contactEmail === accountEmail
                ? 'Your account email — change it if bookings should go elsewhere.'
                : 'Where booking requests and guest messages are sent.'}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
          <Input
            type="tel"
            placeholder="+92 300 1234567"
            value={formData.contactPhone}
            onChange={(e) => handleInputChange('contactPhone', e.target.value)}
          />
        </div>
      </div>

      {/* Currency — one per property. Rooms are priced in it and nothing is ever converted. */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Currency *</label>
        <select
          value={formData.currency}
          onChange={(e) => handleInputChange('currency', e.target.value)}
          className="w-full max-w-xs rounded-lg border border-input bg-background px-4 py-2 text-foreground focus:border-transparent focus:ring-2 focus:ring-ring"
        >
          <option value="USD">USD — US Dollar</option>
          <option value="PKR">PKR — Pakistani Rupee</option>
          <option value="EUR">EUR — Euro</option>
          <option value="GBP">GBP — British Pound</option>
          <option value="AED">AED — UAE Dirham</option>
          <option value="SAR">SAR — Saudi Riyal</option>
        </select>
        <p className="text-xs text-gray-500 mt-1">
          All your room prices use this currency. Guests see prices converted to their own.
        </p>
      </div>
    </div>
  )
}
