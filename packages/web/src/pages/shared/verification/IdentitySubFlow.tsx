import {
  AlertCircle,
  ArrowRight,
  Camera,
  Check,
  CreditCard,
  FileText,
  Loader2,
  ShieldCheck,
  UserCheck,
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { toast } from 'react-hot-toast'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { hotelManagerService } from '@/features/hotel-manager/services/hotelManagerService'
import { tourOperatorService } from '@/features/tour-operator/services/tourOperatorService'
import { KYCSelfieVector } from '@/features/verification/assets/KYCSelfieVector'
import { aiVerificationService } from '@/features/verification/services/aiVerificationService'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

interface IdentitySubFlowProps {
  onComplete: (data: {
    idCardUrl: string
    idBackUrl: string
    selfieUrl: string
    matchingScore: number
    match: boolean
    reason?: string
  }) => void
  initialData?: any
  role: 'tour_operator' | 'hotel_manager'
}

type SubStep = 'id_upload' | 'selfie' | 'verifying' | 'result'

export function IdentitySubFlow({ onComplete, initialData, role }: IdentitySubFlowProps) {
  const { user } = useAuth()
  const [subStep, setSubStep] = useState<SubStep>('id_upload')

  // State for assets
  const [idCardUrl, setIdCardUrl] = useState<string>(initialData?.idCardUrl || '')
  const [idBackUrl, setIdBackUrl] = useState<string>(initialData?.idBackUrl || '')
  const [selfieUrl, setSelfieUrl] = useState<string>(initialData?.selfieUrl || '')

  // Uploading states
  const [isUploadingFront, setIsUploadingFront] = useState(false)
  const [isUploadingBack, setIsUploadingBack] = useState(false)
  const [isUploadingSelfie, setIsUploadingSelfie] = useState(false)

  const [verificationResult, setVerificationResult] = useState<{
    match: boolean
    score: number
    reason?: string
  } | null>(null)

  // Verify deployment version
  console.log('TripAvail Verification System v3.0 [Dual ID + AI]')

  const service = role === 'tour_operator' ? tourOperatorService : hotelManagerService

  const handleIdFrontUpload = async (file: File) => {
    if (!user?.id) return
    setIsUploadingFront(true)
    try {
      const url = await service.uploadAsset(user.id, file, 'verification/id_card_front')

      // AI Validation for Front ID (Strict)
      const validation = await aiVerificationService.validateIdCard(url, user.id, role)
      if (!validation.valid) {
        toast.error(
          validation.reason || 'Invalid ID document. Please upload a clear photo of your ID.',
        )
        return // Don't save URL if invalid
      }

      setIdCardUrl(url)
      toast.success('ID Front validated!')
    } catch (error) {
      toast.error('Upload failed. Try again.')
    } finally {
      setIsUploadingFront(false)
    }
  }

  const handleIdBackUpload = async (file: File) => {
    if (!user?.id) return
    setIsUploadingBack(true)
    try {
      // No strict AI validation for back yet, just upload
      const url = await service.uploadAsset(user.id, file, 'verification/id_card_back')
      setIdBackUrl(url)
      toast.success('ID Back uploaded!')
    } catch (error) {
      toast.error('Upload failed. Try again.')
    } finally {
      setIsUploadingBack(false)
    }
  }

  const handleSelfieUpload = async (file: File) => {
    if (!user?.id) return
    setIsUploadingSelfie(true)
    try {
      const url = await service.uploadAsset(user.id, file, 'verification/selfie')
      setSelfieUrl(url)
      setSubStep('verifying')

      // Run AI Verification: Match Face to ID Front
      const result = await aiVerificationService.compareFaceToId(idCardUrl, url, user.id, role)
      setVerificationResult(result)
      setSubStep('result')

      if (result.match) {
        toast.success('Identity Verified!')
      } else {
        toast.error(result.reason || 'Biometric match failed.')
      }
    } catch (error) {
      toast.error('Verification failed. Try again.')
      setSubStep('selfie')
    } finally {
      setIsUploadingSelfie(false)
    }
  }

  const canProceedToSelfie = idCardUrl && idBackUrl

  return (
    <div className="max-w-xl mx-auto py-8">
      <AnimatePresence mode="wait">
        {subStep === 'id_upload' && (
          <motion.div
            key="id_upload"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-4">
                <CreditCard className="w-8 h-8" />
              </div>
              <h4 className="text-2xl font-black text-foreground tracking-tight italic uppercase">
                Step 1: Government ID
              </h4>
              <p className="text-muted-foreground mt-1 font-medium">
                Upload both sides of your ID card.
              </p>
            </div>

            {/* ID FRONT */}
            <Card
              className={cn(
                'p-6 border-2 border-dashed transition-all',
                idCardUrl ? 'bg-success/10 border-success/20' : 'bg-muted border-border',
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center',
                      idCardUrl
                        ? 'bg-success/20 text-success'
                        : 'bg-background text-muted-foreground',
                    )}
                  >
                    {idCardUrl ? <Check className="w-6 h-6" /> : <CreditCard className="w-6 h-6" />}
                  </div>
                  <div className="text-left">
                    <h5 className="font-bold text-foreground uppercase text-sm">ID Card Front</h5>
                    <p className="text-xs text-muted-foreground font-medium">
                      Photo page with your face
                    </p>
                  </div>
                </div>
                <div>
                  <input
                    type="file"
                    id="id-front-upload"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleIdFrontUpload(e.target.files[0])}
                    disabled={isUploadingFront}
                  />
                  <Button
                    asChild
                    variant={idCardUrl ? 'outline' : 'default'}
                    className={cn(
                      'rounded-xl',
                      idCardUrl && 'border-success/20 text-success hover:bg-success/10',
                    )}
                  >
                    <label htmlFor="id-front-upload" className="cursor-pointer">
                      {isUploadingFront ? (
                        <Loader2 className="animate-spin w-4 h-4" />
                      ) : idCardUrl ? (
                        'Change'
                      ) : (
                        'Upload'
                      )}
                    </label>
                  </Button>
                </div>
              </div>
            </Card>

            {/* ID BACK */}
            <Card
              className={cn(
                'p-6 border-2 border-dashed transition-all',
                idBackUrl ? 'bg-success/10 border-success/20' : 'bg-muted border-border',
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center',
                      idBackUrl
                        ? 'bg-success/20 text-success'
                        : 'bg-background text-muted-foreground',
                    )}
                  >
                    {idBackUrl ? <Check className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                  </div>
                  <div className="text-left">
                    <h5 className="font-bold text-foreground uppercase text-sm">ID Card Back</h5>
                    <p className="text-xs text-muted-foreground font-medium">
                      Rear side with details
                    </p>
                  </div>
                </div>
                <div>
                  <input
                    type="file"
                    id="id-back-upload"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleIdBackUpload(e.target.files[0])}
                    disabled={isUploadingBack}
                  />
                  <Button
                    asChild
                    variant={idBackUrl ? 'outline' : 'default'}
                    className={cn(
                      'rounded-xl',
                      idBackUrl && 'border-success/20 text-success hover:bg-success/10',
                    )}
                  >
                    <label htmlFor="id-back-upload" className="cursor-pointer">
                      {isUploadingBack ? (
                        <Loader2 className="animate-spin w-4 h-4" />
                      ) : idBackUrl ? (
                        'Change'
                      ) : (
                        'Upload'
                      )}
                    </label>
                  </Button>
                </div>
              </div>
            </Card>

            <div className="pt-4">
              <Button
                className="w-full h-14 rounded-2xl font-black uppercase tracking-widest bg-primary-gradient shadow-lg shadow-primary/20"
                disabled={!canProceedToSelfie}
                onClick={() => setSubStep('selfie')}
              >
                Continue to Selfie <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </motion.div>
        )}

        {subStep === 'selfie' && (
          <motion.div
            key="selfie"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <KYCSelfieVector size={200} className="filter drop-shadow-xl" />
              </div>
              <h4 className="text-2xl font-black text-foreground tracking-tight italic uppercase">
                Step 2: Selfie with ID
              </h4>
              <p className="text-muted-foreground mt-2 font-medium px-4">
                Hold your ID card next to your face. Both must be clearly visible.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-success/10 rounded-2xl flex flex-col items-center text-center space-y-2">
                <UserCheck className="w-5 h-5 text-success" />
                <p className="text-[10px] font-black uppercase text-success tracking-widest">
                  Face Visible
                </p>
              </div>
              <div className="p-3 bg-success/10 rounded-2xl flex flex-col items-center text-center space-y-2">
                <CreditCard className="w-5 h-5 text-success" />
                <p className="text-[10px] font-black uppercase text-success tracking-widest">
                  ID Visible
                </p>
              </div>
            </div>

            <Card className="p-8 border-2 border-dashed border-border flex flex-col items-center justify-center bg-muted/50 rounded-[32px]">
              <div className="w-16 h-16 bg-background rounded-2xl shadow-sm flex items-center justify-center mb-4">
                <Camera className="w-8 h-8 text-muted-foreground" />
              </div>
              <input
                type="file"
                id="selfie-upload"
                className="hidden"
                accept="image/*"
                capture="user"
                onChange={(e) => e.target.files?.[0] && handleSelfieUpload(e.target.files[0])}
                disabled={isUploadingSelfie}
              />
              <Button
                asChild
                className="rounded-2xl px-8 h-12 bg-primary-gradient text-primary-foreground font-black uppercase tracking-widest border-0 shadow-lg shadow-primary/20"
              >
                <label htmlFor="selfie-upload" className="cursor-pointer">
                  {isUploadingSelfie ? (
                    <Loader2 className="animate-spin mr-2" />
                  ) : (
                    <Camera className="mr-2" />
                  )}
                  Take Selfie
                </label>
              </Button>
            </Card>
            <button
              onClick={() => setSubStep('id_upload')}
              className="w-full text-center text-xs font-bold text-muted-foreground uppercase tracking-widest hover:text-primary"
            >
              ← Go Back
            </button>
          </motion.div>
        )}

        {subStep === 'verifying' && (
          <motion.div
            key="verifying"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center text-primary mx-auto mb-8"
            >
              <ShieldCheck className="w-10 h-10" />
            </motion.div>
            <h4 className="text-2xl font-black text-foreground tracking-tight italic uppercase">
              Verifying Identity
            </h4>
            <p className="text-muted-foreground mt-2 font-medium">
              AI is analyzing your biometric data...
            </p>
          </motion.div>
        )}

        {subStep === 'result' && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-8"
          >
            <Card
              className={cn(
                'p-10 rounded-[32px] text-center border-2',
                verificationResult?.match
                  ? 'bg-success/10 border-success/20'
                  : 'bg-destructive/10 border-destructive/20',
              )}
            >
              <div
                className={cn(
                  'w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl',
                  verificationResult?.match
                    ? 'bg-success text-primary-foreground'
                    : 'bg-destructive text-primary-foreground',
                )}
              >
                {verificationResult?.match ? (
                  <Check className="w-10 h-10" />
                ) : (
                  <AlertCircle className="w-10 h-10" />
                )}
              </div>

              <h4 className="text-3xl font-black text-foreground tracking-tight italic uppercase">
                {verificationResult?.match ? 'Identity Matched' : 'Verification Failed'}
              </h4>

              <p className="text-muted-foreground mt-4 font-medium px-4">
                {verificationResult?.reason ||
                  (verificationResult?.match
                    ? `AI confirmed identity with a confidence score of ${verificationResult.score}%.`
                    : 'The face in the selfie does not match the ID card.')}
              </p>

              {verificationResult?.match ? (
                <Button
                  className="mt-10 rounded-2xl h-14 bg-primary-gradient text-primary-foreground px-12 font-black uppercase tracking-widest border-0 shadow-lg shadow-primary/20"
                  onClick={() =>
                    onComplete({
                      idCardUrl,
                      idBackUrl,
                      selfieUrl,
                      matchingScore: verificationResult.score,
                      match: true,
                      reason: verificationResult.reason,
                    })
                  }
                >
                  Proceed to Documents <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              ) : (
                <Button
                  className="mt-10 rounded-2xl h-14 bg-foreground px-12 font-black uppercase tracking-widest text-background"
                  onClick={() => setSubStep('id_upload')}
                >
                  Try Again
                </Button>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
