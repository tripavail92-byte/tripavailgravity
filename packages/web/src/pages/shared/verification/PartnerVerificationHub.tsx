import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { IdentitySubFlow } from './IdentitySubFlow'
import { BusinessDocsSubFlow } from '../../tour-operator/setup/components/verification/BusinessDocsSubFlow'
import { PropertyOwnershipSubFlow } from '../../hotel-manager/setup/components/verification/PropertyOwnershipSubFlow'
import { tourOperatorService } from '@/features/tour-operator/services/tourOperatorService'
import { hotelManagerService } from '@/features/hotel-manager/services/hotelManagerService'
import { useAuth } from '@/hooks/useAuth'
import {
  Loader2,
  CheckCircle2,
  ShieldCheck,
  Clock,
  History,
  FileText,
  UserCheck,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { supabase } from '../../../../../shared/src/core/client'

export function PartnerVerificationHub() {
  const { user, activeRole } = useAuth()
  const [step, setStep] = useState<'identity' | 'docs' | 'property' | 'complete'>('identity')
  const [isLoading, setIsLoading] = useState(true)
  const [verificationData, setVerificationData] = useState<any>({
    idCardUrl: '',
    idBackUrl: '',
    selfieUrl: '',
    matchingScore: 0,
    businessDocs: {},
    ownershipDocs: {},
  })

  const [activityLogs, setActivityLogs] = useState<any[]>([])

  const role = activeRole?.role_type
  const service = role === 'tour_operator' ? tourOperatorService : hotelManagerService

  useEffect(() => {
    const loadStatus = async () => {
      if (!user?.id) return
      try {
        const data = await service.getOnboardingData(user.id)
        if (data?.verification) {
          const ver = data.verification as any
          setVerificationData(ver)
          if (ver.matchingScore > 0) {
            if (role === 'hotel_manager' && !ver.ownershipDocs?.titleDeedUrl) {
              setStep('property')
            } else {
              setStep('docs')
            }
          }
        }

        // Fetch activity logs
        const { data: logs } = await supabase
          .from('verification_activity_logs' as any)
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (logs) setActivityLogs(logs)
      } catch (error) {
        console.error('Error loading verification status:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadStatus()
  }, [user?.id, role])

  const handleIdentityComplete = (idData: any) => {
    setVerificationData((prev: any) => ({ ...prev, ...idData }))
    // Refresh logs after a completion
    const refreshLogs = async () => {
      const { data: logs } = await supabase
        .from('verification_activity_logs' as any)
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
      if (logs) setActivityLogs(logs)
    }
    refreshLogs()
    setStep('docs')
  }

  const handleDocsComplete = async (docs: any) => {
    setVerificationData((prev: any) => ({ ...prev, businessDocs: docs }))

    if (role === 'hotel_manager') {
      setStep('property')
    } else {
      await finishVerification()
    }
  }

  const handlePropertyComplete = async (propertyDocs: any) => {
    setVerificationData((prev: any) => ({ ...prev, ownershipDocs: propertyDocs }))
    await finishVerification()
  }

  const finishVerification = async () => {
    if (!user?.id) return
    setIsLoading(true)
    try {
      // Save final verification data and mark as pending review
      await service.saveOnboardingData(
        user.id,
        {
          verification: verificationData,
        },
        true,
      )
      setStep('complete')
    } catch (error) {
      console.error('Error finishing verification:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="mt-4 text-gray-500 font-medium">Initializing verification hub...</p>
      </div>
    )
  }

  if (step === 'complete') {
    return (
      <div className="text-center py-12 space-y-6">
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-12 h-12 text-green-500" />
          </div>
        </div>
        <h2 className="text-3xl font-black text-gray-900 italic uppercase">
          Verification Submitted
        </h2>
        <p className="text-gray-500 max-w-md mx-auto">
          Your documents have been received and are now under manual review. This typically takes
          48-72 hours.
        </p>
        <Button
          className="rounded-2xl px-8 h-12 font-bold"
          onClick={() => window.location.reload()}
        >
          View Status
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Verification Header */}
      <div className="mb-12 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/5 text-primary rounded-full text-xs font-black uppercase tracking-widest mb-4">
          <ShieldCheck className="w-4 h-4" />
          High-Trust Verification
        </div>
        <h2 className="text-4xl font-black text-gray-900 tracking-tighter uppercase italic">
          {step === 'identity'
            ? 'Identity Verification'
            : step === 'docs'
              ? 'Business Compliance'
              : 'Property Authentication'}
        </h2>
        <p className="text-gray-500 mt-2 font-medium">
          {step === 'identity'
            ? 'Biometric match with government issued ID'
            : step === 'docs'
              ? 'Official registration and license documents'
              : 'Live evidence of property ownership'}
        </p>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          {step === 'identity' && (
            <IdentitySubFlow
              onComplete={handleIdentityComplete}
              initialData={verificationData}
              role={role === 'tour_operator' ? 'tour_operator' : 'hotel_manager'}
            />
          )}

          {step === 'docs' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setStep('identity')}
                  className="text-xs font-black uppercase tracking-widest text-gray-400 hover:text-primary transition-colors"
                >
                  ← Back to Identity
                </button>
              </div>
              <BusinessDocsSubFlow
                onComplete={handleDocsComplete}
                initialData={verificationData?.businessDocs}
              />
            </div>
          )}

          {step === 'property' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setStep('docs')}
                  className="text-xs font-black uppercase tracking-widest text-gray-400 hover:text-primary transition-colors"
                >
                  ← Back to Business Docs
                </button>
              </div>
              <PropertyOwnershipSubFlow
                onComplete={handlePropertyComplete}
                initialData={verificationData?.ownershipDocs}
              />
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Privacy Shield */}
      <Card className="mt-12 p-6 bg-gray-50/50 border-gray-100 rounded-2xl flex gap-4 items-start">
        <div className="p-2 bg-white rounded-xl shadow-sm border border-gray-100">
          <ShieldCheck className="w-5 h-5 text-gray-400" />
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-gray-400 italic mb-1">
            Encrypted & Secure
          </p>
          <p className="text-xs text-gray-500 leading-relaxed font-medium">
            Your documents are processed via end-to-end encryption. TripAvail compliance officers
            only view these files to verify legal eligibility.
          </p>
        </div>
      </Card>

      {/* Verification History Section */}
      {activityLogs.length > 0 && (
        <div className="max-w-2xl mx-auto space-y-6 pt-12 pb-20">
          <div className="flex items-center gap-3 px-2">
            <History className="w-5 h-5 text-gray-400" />
            <h4 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em]">
              Verification History
            </h4>
          </div>
          <div className="space-y-4">
            {activityLogs.map((log) => (
              <Card
                key={log.id}
                className="p-6 border-0 shadow-sm bg-white/50 backdrop-blur-sm rounded-3xl flex items-start gap-4"
              >
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                    log.status === 'success'
                      ? 'bg-green-50 text-green-500'
                      : 'bg-red-50 text-red-500'
                  }`}
                >
                  {log.event_type === 'document_validation' ? (
                    <FileText className="w-6 h-6" />
                  ) : (
                    <UserCheck className="w-6 h-6" />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-start">
                    <p className="font-bold text-gray-900 capitalize">
                      {log.event_type.replace('_', ' ')}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                      <Clock className="w-3 h-3" />
                      {new Date(log.created_at).toLocaleString()}
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed font-medium">
                    {log.details?.reason ||
                      (log.status === 'success'
                        ? 'Verification step completed successfully.'
                        : 'Verification failed.')}
                  </p>
                  {log.details?.score && (
                    <div className="pt-2 flex items-center gap-2">
                      <div className="h-1.5 min-w-[100px] bg-gray-100 rounded-full overflow-hidden flex-1">
                        <div
                          className={`h-full transition-all ${log.status === 'success' ? 'bg-green-500' : 'bg-red-500'}`}
                          style={{ width: `${log.details.score}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-black text-gray-900 whitespace-nowrap">
                        {log.details.score}% match
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
