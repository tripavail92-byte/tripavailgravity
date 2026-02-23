import { useState } from 'react'

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
  { iso: 'AE', code: '+971', placeholder: '501234567' },
  { iso: 'AR', code: '+54', placeholder: '1112345678' },
  { iso: 'AT', code: '+43', placeholder: '6601234567' },
  { iso: 'AU', code: '+61', placeholder: '412345678' },
  { iso: 'BD', code: '+880', placeholder: '1712345678' },
  { iso: 'BE', code: '+32', placeholder: '470123456' },
  { iso: 'BG', code: '+359', placeholder: '881234567' },
  { iso: 'BH', code: '+973', placeholder: '36001234' },
  { iso: 'BR', code: '+55', placeholder: '11912345678' },
  { iso: 'CA', code: '+1', placeholder: '4165550123' },
  { iso: 'CH', code: '+41', placeholder: '791234567' },
  { iso: 'CL', code: '+56', placeholder: '912345678' },
  { iso: 'CN', code: '+86', placeholder: '13123456789' },
  { iso: 'CO', code: '+57', placeholder: '3001234567' },
  { iso: 'CZ', code: '+420', placeholder: '601123456' },
  { iso: 'DE', code: '+49', placeholder: '15123456789' },
  { iso: 'DK', code: '+45', placeholder: '20123456' },
  { iso: 'EG', code: '+20', placeholder: '1012345678' },
  { iso: 'ES', code: '+34', placeholder: '612345678' },
  { iso: 'FI', code: '+358', placeholder: '401234567' },
  { iso: 'FR', code: '+33', placeholder: '612345678' },
  { iso: 'GB', code: '+44', placeholder: '7400123456' },
  { iso: 'GH', code: '+233', placeholder: '201234567' },
  { iso: 'GR', code: '+30', placeholder: '6912345678' },
  { iso: 'HK', code: '+852', placeholder: '51234567' },
  { iso: 'HU', code: '+36', placeholder: '201234567' },
  { iso: 'ID', code: '+62', placeholder: '81234567890' },
  { iso: 'IE', code: '+353', placeholder: '851234567' },
  { iso: 'IN', code: '+91', placeholder: '9876543210' },
  { iso: 'IQ', code: '+964', placeholder: '7901234567' },
  { iso: 'IR', code: '+98', placeholder: '9123456789' },
  { iso: 'IT', code: '+39', placeholder: '3123456789' },
  { iso: 'JO', code: '+962', placeholder: '790123456' },
  { iso: 'JP', code: '+81', placeholder: '9012345678' },
  { iso: 'KE', code: '+254', placeholder: '712345678' },
  { iso: 'KR', code: '+82', placeholder: '1012345678' },
  { iso: 'KW', code: '+965', placeholder: '50012345' },
  { iso: 'LB', code: '+961', placeholder: '70123456' },
  { iso: 'LK', code: '+94', placeholder: '771234567' },
  { iso: 'MA', code: '+212', placeholder: '612345678' },
  { iso: 'MX', code: '+52', placeholder: '5512345678' },
  { iso: 'MY', code: '+60', placeholder: '123456789' },
  { iso: 'NG', code: '+234', placeholder: '8012345678' },
  { iso: 'NL', code: '+31', placeholder: '612345678' },
  { iso: 'NO', code: '+47', placeholder: '41234567' },
  { iso: 'NP', code: '+977', placeholder: '9812345678' },
  { iso: 'NZ', code: '+64', placeholder: '211234567' },
  { iso: 'OM', code: '+968', placeholder: '92123456' },
  { iso: 'PE', code: '+51', placeholder: '912345678' },
  { iso: 'PH', code: '+63', placeholder: '9171234567' },
  { iso: 'PK', code: '+92', placeholder: '3001234567' },
  { iso: 'PL', code: '+48', placeholder: '501234567' },
  { iso: 'PT', code: '+351', placeholder: '912345678' },
  { iso: 'QA', code: '+974', placeholder: '33123456' },
  { iso: 'RO', code: '+40', placeholder: '712345678' },
  { iso: 'RU', code: '+7', placeholder: '9123456789' },
  { iso: 'SA', code: '+966', placeholder: '501234567' },
  { iso: 'SE', code: '+46', placeholder: '701234567' },
  { iso: 'SG', code: '+65', placeholder: '81234567' },
  { iso: 'TH', code: '+66', placeholder: '812345678' },
  { iso: 'TN', code: '+216', placeholder: '20123456' },
  { iso: 'TR', code: '+90', placeholder: '5312345678' },
  { iso: 'UA', code: '+380', placeholder: '501234567' },
  { iso: 'US', code: '+1', placeholder: '4155550123' },
  { iso: 'VN', code: '+84', placeholder: '912345678' },
  { iso: 'ZA', code: '+27', placeholder: '821234567' },
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
        <h3 className="text-2xl font-black text-white mb-1.5 tracking-tight">
          Personal Information
        </h3>
        <p className="text-white/55 leading-relaxed font-medium">
          Let's start with your basic contact information.
        </p>
      </div>

      <div className="space-y-6 p-6 rounded-2xl bg-white/[0.04] border border-white/10">
        <div className="space-y-3">
          <Label
            htmlFor="operatorName"
            className="text-xs font-bold uppercase tracking-widest text-white/60 ml-1"
          >
            Your Full Name *
          </Label>
          <Input
            id="operatorName"
            value={formData.operatorName}
            onChange={(e) => handleChange('operatorName', e.target.value)}
            placeholder="e.g. Hassan Noor"
            className="rounded-xl border-white/20 bg-white/10 text-white placeholder:text-white/30 py-6 focus-visible:ring-primary/30 focus-visible:border-primary/60 transition-all text-base"
          />
        </div>

        <div className="space-y-3">
          <Label
            htmlFor="email"
            className="text-xs font-bold uppercase tracking-widest text-white/60 ml-1"
          >
            Work Email Address *
          </Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="hello@adventure.com"
            className="rounded-xl border-white/20 bg-white/10 text-white placeholder:text-white/30 py-6 focus-visible:ring-primary/30 focus-visible:border-primary/60 transition-all text-base"
          />
        </div>

        <div className="space-y-3">
          <Label
            htmlFor="phone"
            className="text-xs font-bold uppercase tracking-widest text-white/60 ml-1"
          >
            Phone Number *
          </Label>
          <div className="flex gap-3">
            <Select value={countryCode} onValueChange={handleCountryChange}>
              <SelectTrigger className="w-[140px] rounded-xl border-white/20 bg-white/10 text-white py-6 focus:ring-primary/30 focus:border-primary/60 transition-all font-medium text-base">
                <SelectValue placeholder="Code" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-border/50 shadow-xl p-1 max-h-64 overflow-y-auto">
                {COUNTRY_OPTIONS.map((opt) => (
                  <SelectItem key={`${opt.iso}-${opt.code}`} value={opt.code} className="rounded-xl px-4 py-2.5">
                    {opt.iso} {opt.code}
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
              className="flex-1 rounded-xl border-white/20 bg-white/10 text-white placeholder:text-white/30 py-6 focus-visible:ring-primary/30 focus-visible:border-primary/60 transition-all text-base"
            />
          </div>
        </div>

        <div className="space-y-3">
          <Label
            htmlFor="contactPerson"
            className="text-xs font-bold uppercase tracking-widest text-white/60 ml-1"
          >
            Primary Contact Person
          </Label>
          <Input
            id="contactPerson"
            value={formData.contactPerson}
            onChange={(e) => handleChange('contactPerson', e.target.value)}
            placeholder="Name of the person managing the account"
            className="rounded-xl border-white/20 bg-white/10 text-white placeholder:text-white/30 py-6 focus-visible:ring-primary/30 focus-visible:border-primary/60 transition-all text-base"
          />
        </div>
      </div>

      <div className="flex gap-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
        <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0 text-amber-400 font-black">!</div>
        <p className="text-sm text-amber-300/80 leading-relaxed font-medium">
          Make sure your email and phone number are correct. We'll use these for important booking notifications and account verification.
        </p>
      </div>
    </div>
  )
}
