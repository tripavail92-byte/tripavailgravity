import { CheckCircle2, Loader2, MessageCircle, Shield, XCircle } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'react-hot-toast'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'

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
const normalizeDigits = (value: string) => (value || '').replace(/[^0-9]/g, '')

function parseInitialPhone(raw: string) {
  const trimmed = (raw || '').trim()
  const digitsOnly = normalizeDigits(trimmed)
  const storedHasPlus = trimmed.startsWith('+')
  if (!storedHasPlus) return { countryCode: DEFAULT_COUNTRY_CODE, nationalNumber: digitsOnly.replace(/^0+/, '') }
  const codesByLength = [...COUNTRY_OPTIONS].map((c) => c.code).sort((a, b) => b.length - a.length)
  for (const code of codesByLength) {
    const codeDigits = code.replace('+', '')
    if (digitsOnly.startsWith(codeDigits)) {
      // Strip trunk prefix 0 from the national portion (handles previously mis-stored numbers)
      return { countryCode: code, nationalNumber: digitsOnly.slice(codeDigits.length).replace(/^0+/, '') }
    }
  }
  return { countryCode: DEFAULT_COUNTRY_CODE, nationalNumber: digitsOnly.replace(/^0+/, '') }
}

// ── OTP input: 6 auto-advance boxes ──────────────────────────────────────────
function OtpInput({ onComplete }: { onComplete: (code: string) => void }) {
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const r0 = useRef<HTMLInputElement>(null)
  const r1 = useRef<HTMLInputElement>(null)
  const r2 = useRef<HTMLInputElement>(null)
  const r3 = useRef<HTMLInputElement>(null)
  const r4 = useRef<HTMLInputElement>(null)
  const r5 = useRef<HTMLInputElement>(null)
  const refs = [r0, r1, r2, r3, r4, r5]

  const update = (idx: number, val: string) => {
    const d = val.replace(/[^0-9]/g, '').slice(-1)
    const next = [...digits]
    next[idx] = d
    setDigits(next)
    if (d && idx < 5) refs[idx + 1].current?.focus()
    const full = next.join('')
    if (full.length === 6) onComplete(full)
  }

  const handleKey = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) refs[idx - 1].current?.focus()
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6)
    if (pasted.length === 6) { setDigits(pasted.split('')); onComplete(pasted) }
  }

  return (
    <div className="flex gap-2 justify-center" onPaste={handlePaste}>
      {digits.map((d, i) => (
        <input
          key={i} ref={refs[i]} type="text" inputMode="numeric" maxLength={1} value={d}
          onChange={(e) => update(i, e.target.value)}
          onKeyDown={(e) => handleKey(i, e)}
          className={cn(
            'w-11 h-14 text-center text-xl font-black rounded-xl border-2 bg-background outline-none transition-all',
            d ? 'border-primary text-foreground' : 'border-border text-muted-foreground',
            'focus:border-primary focus:ring-2 focus:ring-primary/20',
          )}
        />
      ))}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export function PersonalInfoStep({ onUpdate, data }: StepProps) {
  const { user } = useAuth()

  const accountEmail = user?.email ?? ''
  const authName: string =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    (user?.user_metadata?.first_name
      ? `${user.user_metadata.first_name} ${user.user_metadata.last_name ?? ''}`.trim()
      : '') ||
    ''

  const initialPhone = parseInitialPhone(data.personalInfo?.phone || '')
  const [countryCode, setCountryCode] = useState(initialPhone.countryCode)
  const [nationalNumber, setNationalNumber] = useState(initialPhone.nationalNumber)

  const [formData, setFormData] = useState(() => ({
    operatorName:  data.personalInfo?.operatorName || authName,
    phone:         data.personalInfo?.phone || '',
    contactPerson: data.personalInfo?.contactPerson || '',
  }))

  const [phoneVerified, setPhoneVerified] = useState(false)
  const [verifiedPhone, setVerifiedPhone]  = useState('')
  const [otpPhone, setOtpPhone]            = useState('')
  const [otpStage, setOtpStage]            = useState<'idle' | 'sending' | 'sent' | 'verifying'>('idle')
  const [devOtp, setDevOtp]                = useState<string | null>(null)

  useEffect(() => {
    if (!user?.id) return
    supabase.from('profiles').select('phone_verified, phone').eq('id', user.id).maybeSingle()
      .then(({ data: prof }) => {
        if (prof?.phone_verified) {
          setPhoneVerified(true)
          setVerifiedPhone(prof.phone ?? '')
          emitUpdate({ operatorName: data.personalInfo?.operatorName || authName, phone: prof.phone ?? '', contactPerson: data.personalInfo?.contactPerson || '' }, true)
        }
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  // Build E.164: strip trunk prefix (leading zeros) from national number.
  // Many countries prefix domestic numbers with 0 (e.g. PK 03XXXXXXXXX → +92 3XXXXXXXXX).
  // That 0 is a trunk prefix — it must be dropped when the country code is already present.
  const normalizePhone = (cc: string, nat: string) => {
    const national = normalizeDigits(nat).replace(/^0+/, '') // strip trunk prefix 0s
    return `${cc}${national}`
  }

  const emitUpdate = (fd: typeof formData, pv: boolean) => {
    onUpdate({ personalInfo: { ...fd, email: accountEmail }, phoneVerified: pv })
  }

  const handleChange = (field: keyof typeof formData, value: string) => {
    const updated = { ...formData, [field]: value }
    setFormData(updated)
    emitUpdate(updated, phoneVerified)
  }

  const handleCountryChange = (cc: string) => {
    setCountryCode(cc)
    const phone = normalizePhone(cc, nationalNumber)
    const updated = { ...formData, phone }
    setFormData(updated)
    emitUpdate(updated, phoneVerified)
    setOtpPhone('')
    if (phoneVerified) { setPhoneVerified(false); setVerifiedPhone('') }
  }

  const handleNationalNumberChange = (nat: string) => {
    // Strip trunk prefix immediately so the input field shows the correct subscriber number
    const digits = normalizeDigits(nat).replace(/^0+/, '')
    setNationalNumber(digits)
    const phone = normalizePhone(countryCode, digits)
    const updated = { ...formData, phone }
    setFormData(updated)
    emitUpdate(updated, phoneVerified)
    setOtpPhone('')
    if (phoneVerified && phone !== verifiedPhone) { setPhoneVerified(false); setVerifiedPhone('') }
  }

  const handleSendOtp = async () => {
    const phone = normalizePhone(countryCode, nationalNumber)
    if (!nationalNumber || nationalNumber.length < 7) { toast.error('Enter a valid phone number first'); return }
    if (!user?.id) { toast.error('Please sign in again to verify your phone.'); return }
    setOtpStage('sending')
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData?.session?.access_token
      if (!accessToken) throw new Error('Session expired. Please sign in again.')

      const { data: res, error } = await supabase.functions.invoke('send-whatsapp-otp', {
        body: { phone },
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (error) throw error
      const sentToPhone = res?._wa?.to ? `+${String(res._wa.to).replace(/^\+/, '')}` : phone
      setOtpPhone(sentToPhone)

      if (res?.dev && res?.otp) {
        setDevOtp(res.otp)
        toast('Dev mode: OTP shown below', { icon: '🔧' })
      } else {
        setDevOtp(null)
        toast.success(`OTP sent to ${sentToPhone}`)
      }
      setOtpStage('sent')
    } catch (e: any) {
      toast.error(e.message || 'Failed to send OTP')
      setOtpPhone('')
      setOtpStage('idle')
    }
  }

  const handleVerifyOtp = async (code: string) => {
    const phone = otpPhone || normalizePhone(countryCode, nationalNumber)
    setOtpStage('verifying')
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData?.session?.access_token
      if (!accessToken) throw new Error('Session expired. Please sign in again.')

      const { error } = await supabase.functions.invoke('verify-phone-otp', {
        body: { phone, otp: code },
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (error) throw error
      setPhoneVerified(true)
      setVerifiedPhone(phone)
      setOtpStage('idle')
      setDevOtp(null)
      setOtpPhone('')
      const updated = { ...formData, phone }
      setFormData(updated)
      emitUpdate(updated, true)
      toast.success('Phone verified! ✓')
    } catch (e: any) {
      toast.error(e.message || 'Incorrect code — try again')
      setOtpStage('sent')
    }
  }

  const currentPhone = normalizePhone(countryCode, nationalNumber)
  const phoneChanged = phoneVerified && currentPhone !== verifiedPhone

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-2xl font-black text-foreground mb-1.5 tracking-tight">Personal Information</h3>
        <p className="text-muted-foreground leading-relaxed font-medium">
          Your identity is tied to your account. Email is locked to your login for security.
        </p>
      </div>

      <div className="space-y-6 p-6 rounded-2xl bg-muted/30 border border-border/50">

        {/* Full Name */}
        <div className="space-y-3">
          <Label htmlFor="operatorName" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Your Full Name *</Label>
          <Input id="operatorName" value={formData.operatorName} onChange={(e) => handleChange('operatorName', e.target.value)}
            placeholder="e.g. Hassan Noor"
            className="rounded-xl border-border/60 bg-background py-7 focus-visible:ring-primary/20 focus-visible:border-primary/50 transition-all text-base" />
        </div>

        {/* Account Email — read-only + verified badge */}
        <div className="space-y-3">
          <Label htmlFor="accountEmail" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Account Email</Label>
          <div className="relative">
            <Input id="accountEmail" type="email" value={accountEmail} readOnly
              className="rounded-xl border-border/60 bg-muted/60 py-7 text-base pr-36 cursor-not-allowed select-none text-muted-foreground" />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 bg-green-500/10 border border-green-500/30 rounded-lg px-2.5 py-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
              <span className="text-[11px] font-bold text-green-600 uppercase tracking-wide">Verified</span>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground/70 font-medium ml-1 flex items-center gap-1.5">
            <Shield className="w-3 h-3 inline-block" />
            This is your login email — it is used for security, payouts and audit logs. It cannot be changed here.
          </p>
        </div>

        {/* Phone Number + WhatsApp Verification */}
        <div className="space-y-3">
          <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Phone Number *</Label>
          <div className="flex gap-3">
            <Select value={countryCode} onValueChange={handleCountryChange} disabled={otpStage === 'sent' || otpStage === 'verifying'}>
              <SelectTrigger className="w-[140px] rounded-xl border-border/60 bg-background py-7 focus:ring-primary/20 focus:border-primary/50 transition-all font-medium text-base">
                <SelectValue placeholder="Code" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-border/50 shadow-xl p-1 max-h-64 overflow-y-auto">
                {COUNTRY_OPTIONS.map((opt) => (
                  <SelectItem key={`${opt.iso}-${opt.code}`} value={opt.code} className="rounded-xl px-4 py-2.5">{opt.iso} {opt.code}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input id="phone" type="tel" value={nationalNumber} onChange={(e) => handleNationalNumberChange(e.target.value)}
              inputMode="numeric" pattern="[0-9]*" disabled={otpStage === 'sent' || otpStage === 'verifying'}
              placeholder={COUNTRY_OPTIONS.find((o) => o.code === countryCode)?.placeholder || '3001234567'}
              className="flex-1 rounded-xl border-border/60 bg-background py-7 focus-visible:ring-primary/20 focus-visible:border-primary/50 transition-all text-base" />
          </div>

          {/* Verification badge */}
          {phoneVerified && !phoneChanged ? (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/30">
              <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
              <span className="text-sm font-bold text-green-600">Phone Verified</span>
              <span className="text-xs text-green-600/70 font-medium truncate ml-auto">{verifiedPhone}</span>
            </div>
          ) : (
            <div className="rounded-xl border border-red-500/30 bg-red-500/5 overflow-hidden">
              <div className="flex items-center justify-between gap-3 p-3">
                <div className="flex items-center gap-2">
                  {phoneChanged ? (
                    <><XCircle className="w-4 h-4 text-amber-500 shrink-0" /><span className="text-sm font-bold text-amber-600">Phone changed — re-verify</span></>
                  ) : (
                    <><XCircle className="w-4 h-4 text-red-500 shrink-0" /><span className="text-sm font-bold text-red-600">Not Verified</span></>
                  )}
                </div>
                <Button size="sm" variant="outline"
                  className="rounded-xl border-green-500/50 text-green-700 hover:bg-green-500/10 font-bold gap-1.5 shrink-0"
                  onClick={handleSendOtp} disabled={otpStage === 'sending' || otpStage === 'sent' || !nationalNumber}>
                  {otpStage === 'sending'
                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending…</>
                    : <><MessageCircle className="w-3.5 h-3.5" /> Verify via WhatsApp</>}
                </Button>
              </div>
              {(otpStage === 'sent' || otpStage === 'verifying') && (
                <div className="border-t border-red-500/20 bg-background/50 p-4 space-y-4">
                  <div className="text-center">
                    <p className="text-sm font-bold text-foreground">Enter the 6-digit code</p>
                    <p className="text-xs text-muted-foreground font-medium mt-1">Sent to your WhatsApp: <span className="font-bold">{otpPhone || `${countryCode} ${nationalNumber}`}</span></p>
                    {devOtp && (
                      <p className="text-xs font-black text-amber-700 bg-amber-500/10 rounded-lg px-3 py-2 mt-2 border border-amber-500/30">
                        🔧 Dev OTP: <span className="tracking-widest">{devOtp}</span>
                      </p>
                    )}
                  </div>
                  <OtpInput onComplete={handleVerifyOtp} />
                  {otpStage === 'verifying' && (
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" /> Verifying…
                    </div>
                  )}
                  <div className="text-center">
                    <button type="button" className="text-xs font-bold text-primary underline underline-offset-4"
                      onClick={() => { setOtpStage('idle'); setDevOtp(null); setOtpPhone('') }}>
                      Didn't receive it? Try again
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Primary Contact Person */}
        <div className="space-y-3">
          <Label htmlFor="contactPerson" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Primary Contact Person</Label>
          <Input id="contactPerson" value={formData.contactPerson} onChange={(e) => handleChange('contactPerson', e.target.value)}
            placeholder="Name of the person managing the account"
            className="rounded-xl border-border/60 bg-background py-7 focus-visible:ring-primary/20 focus-visible:border-primary/50 transition-all text-base" />
        </div>
      </div>

      {!phoneVerified && (
        <div className="flex gap-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0 text-amber-600 font-black text-sm">!</div>
          <p className="text-sm text-amber-700/80 leading-relaxed font-medium">
            Phone verification is required before you can continue. We use it for booking alerts, payouts and account security.
          </p>
        </div>
      )}
    </div>
  )
}
