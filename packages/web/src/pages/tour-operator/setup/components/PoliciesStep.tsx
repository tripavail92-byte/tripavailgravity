import {
  AlertCircle,
  CalendarDays,
  Check,
  ChevronDown,
  ClipboardCheck,
  FileText,
  FileUp,
  HeartPulse,
  Loader2,
  Shield,
  ShieldAlert,
  Trash2,
  Wallet,
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { toast } from 'react-hot-toast'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { tourOperatorService } from '@/features/tour-operator/services/tourOperatorService'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

interface StepProps {
  onNext: () => void
  onUpdate: (data: any) => void
  data: any
}

const PLATFORM_TERMS = [
  { id: 'usage', title: 'Platform Usage', desc: 'Rules for using TripAvail services' },
  { id: 'payments', title: 'Payments & Commission', desc: 'Financial terms and fee structure' },
  { id: 'data', title: 'Data Protection', desc: 'Privacy and data handling policies' },
]

const POLICY_TEMPLATES = [
  {
    id: 'cancellation',
    title: 'Cancellation Policy',
    icon: CalendarDays,
    template:
      'Tours cancelled 48+ hours in advance: Full refund\nTours cancelled 24-48 hours: 50% refund\nTours cancelled <24 hours: No refund\nWeather cancellations: Full refund or reschedule',
  },
  {
    id: 'liability',
    title: 'Liability & Insurance',
    icon: ShieldAlert,
    template:
      'All tours include comprehensive insurance coverage\nOperator liability limited to tour cost\nParticipants advised to have personal travel insurance\nNot liable for acts of God or extreme weather',
  },
  {
    id: 'safety',
    title: 'Safety Standards',
    icon: HeartPulse,
    template:
      'Safety briefing provided before all tours\nFirst aid certified guides on all tours\nEmergency contact procedures established\nAge and fitness requirements clearly communicated',
  },
  {
    id: 'booking',
    title: 'Booking & Payments',
    icon: Wallet,
    template:
      '25% deposit required to secure booking\nFull payment due 7 days before tour\nGroup size minimums and maximums apply\nSpecial dietary requirements accommodated with notice',
  },
]

export function PoliciesStep({ onUpdate, data }: StepProps) {
  const [accepted, setAccepted] = useState(data.policies?.accepted || false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const { user } = useAuth()
  const [policyMode, setPolicyMode] = useState<'templates' | 'upload'>(
    data.policies?.mode || 'templates',
  )
  const [customPolicies, setCustomPolicies] = useState<Record<string, string>>(
    data.policies?.custom || {},
  )
  const [uploads, setUploads] = useState<Record<string, boolean>>(data.policies?.uploads || {})
  const [isUploading, setIsUploading] = useState<string | null>(null)

  const updateAllData = (newData: any) => {
    onUpdate({
      policies: {
        accepted,
        mode: policyMode,
        custom: customPolicies,
        uploads,
        ...newData,
      },
    })
  }

  const toggleAccepted = () => {
    const next = !accepted
    setAccepted(next)
    updateAllData({ accepted: next })
  }

  const handlePolicyChange = (id: string, value: string) => {
    const next = { ...customPolicies, [id]: value }
    setCustomPolicies(next)
    updateAllData({ custom: next })
  }

  const useTemplate = (id: string, template: string) => {
    handlePolicyChange(id, template)
  }

  const handleUpload = async (id: string, file: File) => {
    if (!user?.id) return

    setIsUploading(id)
    try {
      await tourOperatorService.uploadAsset(user.id, file, `policies/${id}`)
      const next = { ...uploads, [id]: true }
      setUploads(next)
      updateAllData({ uploads: next })
      toast.success('Policy document uploaded!')
    } catch (error) {
      console.error('Policy upload error:', error)
      toast.error('Failed to upload policy document')
    } finally {
      setIsUploading(null)
    }
  }

  return (
    <div className="space-y-12">
      <div>
        <h3 className="text-2xl font-black text-white mb-1.5 tracking-tight">
          Terms & Policies
        </h3>
        <p className="text-white/55 leading-relaxed font-medium">
          Define how you operate and ensure a safe experience for travelers.
        </p>
      </div>

      {/* Platform Terms Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-primary/20 border border-primary/30 rounded-xl flex items-center justify-center text-primary">
            <Shield className="w-5 h-5" />
          </div>
          <h4 className="font-black text-white uppercase tracking-widest text-xs">
            Platform Agreement
          </h4>
        </div>
        <div className="space-y-4">
          {PLATFORM_TERMS.map((term) => (
            <div
              key={term.id}
              className="border border-white/10 rounded-2xl overflow-hidden bg-white/[0.04] transition-all hover:bg-white/[0.06]"
            >
              <button
                onClick={() => setExpanded(expanded === term.id ? null : term.id)}
                className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-colors group"
                aria-expanded={expanded === term.id}
              >
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 bg-primary/15 text-primary rounded-2xl flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-white tracking-tight">{term.title}</p>
                    <p className="text-xs text-white/45 font-bold uppercase tracking-widest">
                      {term.desc}
                    </p>
                  </div>
                </div>
                <ChevronDown
                  className={cn(
                    'w-6 h-6 text-white/25 transition-transform duration-300 group-hover:text-primary',
                    expanded === term.id && 'rotate-180 text-primary',
                  )}
                />
              </button>
              <AnimatePresence>
                {expanded === term.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-t border-white/10"
                  >
                    <div className="p-8 text-sm text-white/55 space-y-4 leading-relaxed bg-white/[0.03] font-medium">
                      <p>
                        By using the TripAvail platform, you agree to provide accurate information
                        and maintain professional standards of service. You are responsible for the
                        safety and quality of the tours you list.
                      </p>
                      <ul className="space-y-2">
                        {[
                          'Maintain up-to-date availability calendars.',
                          'Honor all confirmed bookings.',
                          'Respond to traveler inquiries within 24 hours.',
                        ].map((item, i) => (
                          <li key={i} className="flex gap-3 items-start">
                            <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                            <span className="text-xs text-white/45">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        <div
          onClick={toggleAccepted}
          className={cn(
            'p-6 cursor-pointer border-2 transition-all rounded-2xl mt-6 flex items-center gap-5 group',
            accepted
              ? 'border-primary bg-primary/20 shadow-lg shadow-primary/10'
              : 'border-white/15 bg-white/[0.04] hover:border-white/30',
          )}
        >
          <div
            className={cn(
              'w-8 h-8 rounded-xl flex items-center justify-center border-2 transition-all duration-300',
              accepted
                ? 'bg-primary border-primary text-primary-foreground scale-110 shadow-lg shadow-primary/30'
                : 'border-white/25 text-transparent group-hover:border-primary/40',
            )}
          >
            <Check className="w-5 h-5 stroke-[3]" />
          </div>
          <div>
            <p className="font-bold text-white tracking-tight">
              I accept the Platform Terms
            </p>
            <p className="text-xs text-white/40 font-bold uppercase tracking-widest leading-none mt-1">
              I have read and agree to all platform operating policies.
            </p>
          </div>
        </div>
      </section>

      <hr className="border-white/10" />

      {/* Operator Policies Section */}
      <section className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 border border-primary/30 rounded-xl flex items-center justify-center text-primary">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <h4 className="font-black text-white uppercase tracking-widest text-xs">
              Your Operation Policies
            </h4>
          </div>
          <div className="flex bg-white/10 border border-white/15 p-1 rounded-xl w-fit">
            <button
              onClick={() => {
                setPolicyMode('templates')
                updateAllData({ mode: 'templates' })
              }}
              className={cn(
                'px-5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 uppercase tracking-widest',
                policyMode === 'templates'
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-white/40 hover:text-white',
              )}
            >
              <FileText className="w-3.5 h-3.5" />
              Templates
            </button>
            <button
              onClick={() => {
                setPolicyMode('upload')
                updateAllData({ mode: 'upload' })
              }}
              className={cn(
                'px-5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 uppercase tracking-widest',
                policyMode === 'upload'
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-white/40 hover:text-white',
              )}
            >
              <FileUp className="w-3.5 h-3.5" />
              Upload
            </button>
          </div>
        </div>

        {policyMode === 'templates' ? (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {POLICY_TEMPLATES.map((policy) => (
              <div key={policy.id} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/20 border border-primary/25 rounded-2xl flex items-center justify-center text-primary shadow-sm">
                      <policy.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <Label className="text-sm font-bold text-white tracking-tight">
                        {policy.title}
                      </Label>
                      <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest leading-none mt-1">
                        Required Information
                      </p>
                    </div>
                  </div>
                  {!customPolicies[policy.id] && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => useTemplate(policy.id, policy.template)}
                      className="text-xs text-primary border-primary/30 font-bold uppercase tracking-widest hover:bg-primary/15 rounded-xl h-10 px-4 transition-all hover:scale-105"
                    >
                      <ClipboardCheck className="w-4 h-4 mr-2" />
                      Use Template
                    </Button>
                  )}
                </div>
                <div className="relative group">
                  <Textarea
                    placeholder={`Describe your ${policy.title.toLowerCase()}...`}
                    value={customPolicies[policy.id] || ''}
                    onChange={(e) => handlePolicyChange(policy.id, e.target.value)}
                    className="min-h-[160px] rounded-2xl border-white/20 bg-white/10 text-white placeholder:text-white/30 focus:border-primary/40 focus:ring-primary/15 transition-all resize-none text-base p-6 font-medium leading-relaxed"
                  />
                  {customPolicies[policy.id] && (
                    <button
                      onClick={() => handlePolicyChange(policy.id, '')}
                      className="absolute top-4 right-4 p-2 bg-white/10 backdrop-blur shadow-lg rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/20 hover:text-red-400 border border-white/20"
                      aria-label="Clear policy"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-12 border-2 border-dashed border-white/15 rounded-3xl bg-white/[0.03] flex flex-col items-center justify-center text-center group hover:border-primary/30 hover:bg-primary/[0.03] transition-all duration-500">
              <div className="w-20 h-20 bg-white/10 border border-white/15 rounded-[28px] flex items-center justify-center text-white/30 group-hover:text-primary group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 mb-6">
                <FileUp className="w-10 h-10" />
              </div>
              <h5 className="text-lg font-black text-white mb-2 uppercase tracking-tighter">
                Upload Policy Documents
              </h5>
              <p className="text-sm text-white/45 max-w-[280px] leading-relaxed mb-8 font-medium">
                Upload your PDF or Word documents containing all your tour policies for our
                compliance team to review.
              </p>
              <Button className="rounded-2xl font-black uppercase tracking-widest h-14 px-10 shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                Select Files
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {['cancellation_signed', 'safety_manual'].map((id) => (
                <div
                  key={id}
                  className={cn(
                    'p-5 border rounded-2xl flex items-center justify-between transition-all border-white/15 bg-white/[0.04]',
                    uploads[id] && 'bg-primary/15 border-primary/30',
                  )}
                >
                  <div className="flex items-center gap-5">
                    <div
                      className={cn(
                          'w-12 h-12 rounded-xl flex items-center justify-center shadow-sm transition-all duration-300',
                          uploads[id]
                            ? 'bg-primary text-primary-foreground rotate-6'
                            : 'bg-white/10 text-white/30',
                      )}
                    >
                      <FileText className="w-7 h-7" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-white tracking-tight">
                        {id
                          .split('_')
                          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                          .join(' ')}
                      </p>
                      <p
                        className={cn(
                          'text-[10px] uppercase tracking-widest font-black mt-1',
                          uploads[id] ? 'text-primary' : 'text-white/40',
                        )}
                      >
                        {uploads[id] ? 'Verified' : 'Required'}
                      </p>
                    </div>
                  </div>
                  {!uploads[id] ? (
                    <div className="relative">
                      <input
                        type="file"
                        id={`upload-${id}`}
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleUpload(id, file)
                        }}
                        disabled={!!isUploading}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="h-10 w-10 p-0 rounded-xl hover:bg-primary/10 hover:text-primary transition-all active:scale-90"
                        disabled={!!isUploading}
                      >
                        <label
                          htmlFor={`upload-${id}`}
                          className="cursor-pointer flex items-center justify-center"
                        >
                          {isUploading === id ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <FileUp className="w-5 h-5" />
                          )}
                        </label>
                      </Button>
                    </div>
                  ) : (
                    <div className="bg-primary text-primary-foreground rounded-xl p-2 shadow-lg shadow-primary/20">
                      <Check className="w-5 h-5 stroke-[3]" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Helper Alert */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 flex gap-5 group transition-all hover:bg-amber-500/15">
        <div className="w-12 h-12 bg-amber-500/20 border border-amber-500/30 rounded-xl flex items-center justify-center flex-shrink-0">
          <Shield className="w-6 h-6 text-amber-400" />
        </div>
        <div className="space-y-1.5">
          <p className="font-bold text-amber-300 uppercase tracking-widest text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Platform Compliance
          </p>
          <p className="text-sm text-amber-300/70 leading-relaxed font-medium">
            TripAvail reserves the right to audit your tour operations to ensure safety standards
            and insurance requirements are met. Your listed prices must match your publicly
            advertised rates.
          </p>
        </div>
      </div>
    </div>
  )
}
