import { Building, Loader2, Sparkles, Upload } from 'lucide-react'
import { ChangeEvent, useState } from 'react'
import { toast } from 'react-hot-toast'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { tourOperatorService } from '@/features/tour-operator/services/tourOperatorService'
import { useAuth } from '@/hooks/useAuth'

interface StepProps {
  onNext: () => void
  onUpdate: (data: any) => void
  data: any
  /** Which sub-screen of this stage to render. The setup page owns the navigation. */
  subStep?: number
}

const DESCRIPTION_MAX_CHARS = 500

/** A bare 10-13 digit number (optionally +country-code) is almost certainly a phone
 * number, not a business registration number. */
function looksLikePhoneNumber(value: string | null | undefined): boolean {
  const v = (value || '').replace(/[\s-]/g, '')
  return /^(\+?\d{10,13})$/.test(v) && (v.startsWith('03') || v.startsWith('+') || v.startsWith('92'))
}

/**
 * Registration-number format check. Lengths genuinely vary (SECP CUIN, trade licences,
 * foreign registries), so we don't enforce a fixed length — just a sane shape:
 * 4-30 chars, letters/digits with - / . separators, and not a phone number.
 * Returns an error message, or null when acceptable (empty is allowed — field is optional).
 */
export function registrationNumberError(value: string | null | undefined): string | null {
  const v = (value || '').trim()
  if (!v) return null
  if (looksLikePhoneNumber(v))
    return 'This looks like a phone number — enter your official business registration number (e.g. SECP / trade licence no.).'
  if (!/^[A-Za-z0-9][A-Za-z0-9\-/. ]{2,28}[A-Za-z0-9]$/.test(v))
    return 'Enter a valid registration number — letters and digits, optionally separated by dashes or slashes (e.g. 12345-67890).'
  return null
}

/** Ready-made description starters — the operator picks one and personalises it.
 * Deliberately template-based (no live AI call): instant, predictable, free. */
function buildDescriptionSuggestions(businessName: string, yearsInBusiness: string): string[] {
  const name = businessName?.trim() || 'Our company'
  const exp =
    yearsInBusiness === '5-plus'
      ? 'over five years'
      : yearsInBusiness === '3-5'
        ? 'more than three years'
        : yearsInBusiness === '1-3'
          ? 'several years'
          : 'a passion for travel'

  return [
    `${name} crafts unforgettable journeys across Pakistan's most breathtaking destinations. With ${exp} of experience, we handle every detail — transport, stays, and local guides — so travellers can simply enjoy the adventure.`,
    `${name} specialises in small-group tours led by local experts. From serene valleys to bustling bazaars, we design each itinerary around authentic experiences, comfort, and safety.`,
    `At ${name}, we believe travel should be effortless. Backed by ${exp} in the field, our team plans seamless trips with verified accommodation, reliable transport, and 24/7 on-tour support.`,
    `${name} is a family-friendly tour operator offering curated day trips, weekend getaways, and multi-day adventures. Transparent pricing, flexible bookings, and genuine local hospitality on every tour.`,
    `Adventure is our speciality — ${name} runs guided hiking, trekking, and sightseeing tours with experienced crews, quality equipment, and routes suited to every fitness level.`,
  ]
}

export function BusinessInfoStep({ onUpdate, data, subStep = 0 }: StepProps) {
  const { user } = useAuth()
  const [isUploading, setIsUploading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [formData, setFormData] = useState(
    data.businessInfo || {
      businessName: '',
      registrationNumber: '',
      yearsInBusiness: '',
      teamSize: '',
      businessDescription: '',
      companyLogo: null as string | null,
    },
  )

  const handleInputChange = (field: string, value: string) => {
    const newData = { ...formData, [field]: value }
    setFormData(newData)
    onUpdate({ businessInfo: newData })
  }

  const handleLogoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user?.id) return

    setIsUploading(true)
    try {
      const publicUrl = await tourOperatorService.uploadAsset(user.id, file, 'logo')
      handleInputChange('companyLogo', publicUrl)
      toast.success('Logo uploaded!')
    } catch (error) {
      console.error('Logo upload error:', error)
      toast.error('Failed to upload logo')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="space-y-8 p-6 rounded-2xl bg-muted/30 border border-border/50">
        {subStep === 0 ? (
          <>
        <div className="space-y-3">
          <Label
            htmlFor="businessName"
            className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1"
          >
            Registered Business Name *
          </Label>
          <Input
            id="businessName"
            value={formData.businessName}
            onChange={(e) => handleInputChange('businessName', e.target.value)}
            placeholder="Official company name"
            className="rounded-xl border-border/60 bg-background py-7 focus-visible:ring-primary/20 focus-visible:border-primary/50 transition-all text-base"
          />
        </div>

        <div className="space-y-3">
          <Label
            htmlFor="registrationNumber"
            className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1"
          >
            Business Registration Number
          </Label>
          <Input
            id="registrationNumber"
            value={formData.registrationNumber}
            onChange={(e) => handleInputChange('registrationNumber', e.target.value)}
            placeholder="e.g. 12345-67890"
            className="rounded-xl border-border/60 bg-background py-7 focus-visible:ring-primary/20 focus-visible:border-primary/50 transition-all text-base"
          />
          {registrationNumberError(formData.registrationNumber) ? (
            <p className="text-xs text-destructive ml-1">
              {registrationNumberError(formData.registrationNumber)}
            </p>
          ) : null}
        </div>
          </>
        ) : null}

        {subStep === 1 ? (
          <>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
              Experience
            </Label>
            <Select
              value={formData.yearsInBusiness}
              onValueChange={(v: string) => handleInputChange('yearsInBusiness', v)}
            >
              <SelectTrigger className="rounded-xl border-border/60 bg-background py-7 focus:ring-primary/20 focus:border-primary/50 transition-all font-medium text-base">
                <SelectValue placeholder="Years in bus..." />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-border/50 shadow-xl overflow-hidden p-1">
                <SelectItem value="lt-1" className="rounded-xl px-4 py-2.5">
                  New Operation
                </SelectItem>
                <SelectItem value="1-3" className="rounded-xl px-4 py-2.5">
                  1-3 years
                </SelectItem>
                <SelectItem value="3-5" className="rounded-xl px-4 py-2.5">
                  3-5 years
                </SelectItem>
                <SelectItem value="5-plus" className="rounded-xl px-4 py-2.5">
                  5+ years
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-3">
            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
              Team Size
            </Label>
            <Select
              value={formData.teamSize}
              onValueChange={(v: string) => handleInputChange('teamSize', v)}
            >
              <SelectTrigger className="rounded-xl border-border/60 bg-background py-7 focus:ring-primary/20 focus:border-primary/50 transition-all font-medium text-base">
                <SelectValue placeholder="Members..." />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-border/50 shadow-xl overflow-hidden p-1">
                <SelectItem value="1" className="rounded-xl px-4 py-2.5">
                  Solo Operator
                </SelectItem>
                <SelectItem value="2-5" className="rounded-xl px-4 py-2.5">
                  2-5 staff
                </SelectItem>
                <SelectItem value="6-15" className="rounded-xl px-4 py-2.5">
                  6-15 staff
                </SelectItem>
                <SelectItem value="15-plus" className="rounded-xl px-4 py-2.5">
                  15+ staff
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
          </>
        ) : null}

        {/* Description before logo: the suggestions read the name and years entered on the
            previous two screens, so this reads as the natural last step. */}
        {subStep === 2 ? (
          <>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="description"
              className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1"
            >
              Business Description
            </Label>
            <button
              type="button"
              onClick={() => setShowSuggestions((s) => !s)}
              className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary hover:bg-primary/15 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              AI Suggest
            </button>
          </div>

          {showSuggestions ? (
            <div className="space-y-2 rounded-2xl border border-primary/20 bg-primary/[0.04] p-3">
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                Pick a starting point — you can edit it after
              </p>
              {buildDescriptionSuggestions(formData.businessName, formData.yearsInBusiness).map(
                (suggestion, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      handleInputChange(
                        'businessDescription',
                        suggestion.slice(0, DESCRIPTION_MAX_CHARS),
                      )
                      setShowSuggestions(false)
                    }}
                    className="block w-full rounded-xl border border-border/60 bg-background p-3 text-left text-sm text-foreground leading-relaxed hover:border-primary/50 hover:bg-primary/[0.03] transition-colors"
                  >
                    {suggestion}
                  </button>
                ),
              )}
            </div>
          ) : null}

          <Textarea
            id="description"
            rows={4}
            value={formData.businessDescription}
            onChange={(e) =>
              handleInputChange(
                'businessDescription',
                e.target.value.slice(0, DESCRIPTION_MAX_CHARS),
              )
            }
            maxLength={DESCRIPTION_MAX_CHARS}
            placeholder="Describe your specialties and experience..."
            className="rounded-xl border-border/60 bg-background min-h-[140px] focus-visible:ring-primary/20 focus-visible:border-primary/50 transition-all text-base p-4"
          />
          <p
            className={`text-xs ml-1 ${
              (formData.businessDescription?.length ?? 0) >= DESCRIPTION_MAX_CHARS
                ? 'text-amber-600 dark:text-amber-500 font-semibold'
                : 'text-muted-foreground'
            }`}
          >
            {formData.businessDescription?.length ?? 0} / {DESCRIPTION_MAX_CHARS} characters
          </p>
        </div>

        <div className="space-y-4">
          <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
            Company Logo
          </Label>
          <div className="flex items-center gap-6 p-6 border-2 border-dashed border-border/50 rounded-2xl bg-muted/30 transition-colors hover:bg-muted/50">
            <div className="w-24 h-24 bg-muted rounded-2xl flex items-center justify-center overflow-hidden border border-border/50 flex-shrink-0 shadow-sm">
              {isUploading ? (
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              ) : formData.companyLogo ? (
                <img
                  src={formData.companyLogo}
                  alt="Business Logo"
                  className="w-full h-full object-contain"
                />
              ) : (
                <Building className="w-8 h-8 text-muted-foreground/30" aria-hidden="true" />
              )}
            </div>
            <div className="flex-1 space-y-3">
              <input
                type="file"
                id="logo-upload"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
                disabled={isUploading}
                aria-label="Upload Company Logo"
              />
              <label
                htmlFor="logo-upload"
                className={`inline-flex items-center gap-2 px-5 py-2.5 bg-primary/5 hover:bg-primary-hover hover:text-primary-foreground text-primary rounded-xl cursor-pointer transition-all font-bold text-sm border border-primary/20 ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" aria-hidden="true" />
                )}
                {isUploading
                  ? 'Uploading...'
                  : formData.companyLogo
                    ? 'Change Logo'
                    : 'Upload Logo'}
              </label>
              <p className="text-xs text-muted-foreground/70 font-medium">
                PNG or SVG (max. 2MB). Squarish format looks best.
              </p>
            </div>
          </div>
        </div>
          </>
        ) : null}
      </div>
    </div>
  )
}
