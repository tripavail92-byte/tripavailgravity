import { useState } from 'react'

import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface StepProps {
  onNext: () => void
  onUpdate: (data: any) => void
  data: any
}

const COUNTRY_OPTIONS = [
  { code: '+92', country: 'Pakistan', flag: '🇵🇰', placeholder: '3001234567' },
  { code: '+1', country: 'United States', flag: '🇺🇸', placeholder: '4155550123' },
  { code: '+44', country: 'United Kingdom', flag: '🇬🇧', placeholder: '7400123456' },
  { code: '+971', country: 'UAE', flag: '🇦🇪', placeholder: '501234567' },
  { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦', placeholder: '501234567' },
  { code: '+91', country: 'India', flag: '🇮🇳', placeholder: '9876543210' },
] as const

const DEFAULT_COUNTRY_CODE = '+92'

export function PersonalInfoStep({ onUpdate, data }: StepProps) {
  const normalizeDigits = (value: string) => (value || '').replace(/[^0-9]/g, '')

  const parseInitialPhone = (raw: string) => {
    const trimmed = (raw || '').trim()
    const digitsOnly = normalizeDigits(trimmed)

    // Attempt to detect the country code from known options (prefer longest match)
    const codesByLength = [...COUNTRY_OPTIONS]
      .map((c) => c.code)
      .sort((a, b) => b.length - a.length)

    // If the stored value includes a '+', trust it; otherwise treat as national number.
    const storedHasPlus = trimmed.startsWith('+')
    if (!storedHasPlus) {
      return { countryCode: DEFAULT_COUNTRY_CODE, nationalNumber: digitsOnly }
    }

    // Compare against options using digits without '+'
    for (const code of codesByLength) {
      const codeDigits = code.replace('+', '')
      if (digitsOnly.startsWith(codeDigits)) {
        return {
          countryCode: code,
          nationalNumber: digitsOnly.slice(codeDigits.length),
        }
      }
    }

    // Unknown code: fall back to default and keep all digits as national number
    return { countryCode: DEFAULT_COUNTRY_CODE, nationalNumber: digitsOnly }
  }

  const initialPhone = parseInitialPhone(data.personalInfo?.phone || '')

  const [formData, setFormData] = useState(
    data.personalInfo || {
      operatorName: '',
      email: '',
      phone: '',
      contactPerson: '',
    },
  )

  const [countryCode, setCountryCode] = useState<string>(initialPhone.countryCode)
  const [nationalNumber, setNationalNumber] = useState<string>(initialPhone.nationalNumber)

  const handleChange = (field: string, value: string) => {
    const newData = { ...formData, [field]: value }
    setFormData(newData)
    onUpdate({ personalInfo: newData })
  }

  const normalizePhone = (cc: string, number: string) => {
    const digits = normalizeDigits(number)
    return `${cc}${digits}`
  }

  const handleCountryChange = (nextCc: string) => {
    setCountryCode(nextCc)
    handleChange('phone', normalizePhone(nextCc, nationalNumber))
  }

  const handleNationalNumberChange = (nextNational: string) => {
    const digitsOnly = normalizeDigits(nextNational)
    setNationalNumber(digitsOnly)
    handleChange('phone', normalizePhone(countryCode, digitsOnly))
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-3xl font-extrabold text-foreground mb-2 tracking-tight">
          Personal Information
        </h3>
        <p className="text-lg text-muted-foreground leading-relaxed font-medium">
          Let's start with your basic contact information.
        </p>
      </div>

      <Card className="p-8 space-y-6 border-border/50 shadow-sm rounded-[32px] bg-background ring-1 ring-border/40">
        <div className="space-y-3">
          <Label
            htmlFor="operatorName"
            className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1"
          >
            Your Full Name *
          </Label>
          <Input
            id="operatorName"
            value={formData.operatorName}
            onChange={(e) => handleChange('operatorName', e.target.value)}
            placeholder="e.g. Hassan Noor"
            className="rounded-2xl border-border/60 py-7 focus-visible:ring-primary/20 focus-visible:border-primary/50 transition-all text-base placeholder:text-muted-foreground/40"
          />
        </div>

        <div className="space-y-3">
          <Label
            htmlFor="email"
            className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1"
          >
            Work Email Address *
          </Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="hello@adventure.com"
            className="rounded-2xl border-border/60 py-7 focus-visible:ring-primary/20 focus-visible:border-primary/50 transition-all text-base placeholder:text-muted-foreground/40"
          />
        </div>

        <div className="space-y-3">
          <Label
            htmlFor="phone"
            className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1"
          >
            Phone Number *
          </Label>
          <div className="flex gap-3">
            <Select value={countryCode} onValueChange={handleCountryChange}>
              <SelectTrigger className="w-[140px] rounded-2xl border-border/60 py-7 focus:ring-primary/20 focus:border-primary/50 transition-all font-medium text-base">
                <SelectValue placeholder="Code" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-border/50 shadow-xl overflow-hidden p-1">
                {COUNTRY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.code} value={opt.code} className="rounded-xl px-4 py-2.5">
                    {opt.flag} {opt.country} {opt.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              id="phone"
              type="tel"
              value={nationalNumber}
              onChange={(e) => handleNationalNumberChange(e.target.value)}
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder={
                COUNTRY_OPTIONS.find((o) => o.code === countryCode)?.placeholder || '3001234567'
              }
              className="flex-1 rounded-2xl border-border/60 py-7 focus-visible:ring-primary/20 focus-visible:border-primary/50 transition-all text-base placeholder:text-muted-foreground/40"
            />
          </div>
        </div>

        <div className="space-y-3">
          <Label
            htmlFor="contactPerson"
            className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1"
          >
            Primary Contact Person
          </Label>
          <Input
            id="contactPerson"
            value={formData.contactPerson}
            onChange={(e) => handleChange('contactPerson', e.target.value)}
            placeholder="Name of the person managing the account"
            className="rounded-2xl border-border/60 py-7 focus-visible:ring-primary/20 focus-visible:border-primary/50 transition-all text-base placeholder:text-muted-foreground/40"
          />
        </div>
      </Card>

      <div className="bg-warning/10 border border-warning/20 rounded-[28px] p-6 flex gap-4 transition-colors hover:bg-warning/20">
        <div className="w-10 h-10 bg-background rounded-xl shadow-sm border border-warning/20 flex items-center justify-center flex-shrink-0">
          <span className="text-warning text-xl font-black italic">!</span>
        </div>
        <p className="text-sm text-warning leading-relaxed font-medium">
          Make sure your email and phone number are correct. We'll use these for important booking
          notifications and account verification.
        </p>
      </div>
    </div>
  )
}
