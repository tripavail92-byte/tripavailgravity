import {
  AlertCircle,
  ArrowRight,
  Camera,
  Check,
  Clock,
  CreditCard,
  FileText,
  Loader2,
  Monitor,
  RefreshCw,
  ShieldCheck,
  Smartphone,
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { QRCodeSVG } from 'qrcode.react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'react-hot-toast'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  KycSession,
  buildMobileKycUrl,
  createKycSession,
  expireKycSession,
  getActiveKycSession,
  getKycSessionByToken,
  subscribeToKycSession,
} from '@/features/verification/services/kycSessionService'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

import { IDCaptureWidget } from './IDCaptureWidget'

interface IdentitySubFlowProps {
  onComplete: (data: {
    kycSessionToken: string
    kycStatus: KycSession['status']
    cnicNumber?: string | null
    expiryDate?: string | null
    failureReason?: string | null
  }) => void
  initialData?: any
  role: 'tour_operator' | 'hotel_manager'
}

// true when the user is on a phone/tablet
function detectMobile(): boolean {
  return (
    typeof window !== 'undefined' &&
    (/Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      window.innerWidth < 768)
  )
}

type SubStep =
  | 'choose'       // desktop: choose method (phone QR vs this device)
  | 'qr_waiting'   // desktop: QR shown, waiting for mobile to complete
  | 'qr_complete'  // desktop: phone capture complete, processing OCR
  | 'id_upload'    // desktop fallback / mobile direct: manual upload
  | 'processing'
  | 'result'

// Remaining time (mm:ss) from an ISO expiry string
function useCountdown(expiresAt: string | null) {
  const [remaining, setRemaining] = useState('')
  useEffect(() => {
    if (!expiresAt) return
    const tick = () => {
      const diff = new Date(expiresAt).getTime() - Date.now()
      if (diff <= 0) { setRemaining('00:00'); return }
      const m = Math.floor(diff / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setRemaining(`${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [expiresAt])
  return remaining
}

export function IdentitySubFlow({ onComplete, initialData, role }: IdentitySubFlowProps) {
  const { user } = useAuth()
  const isMobile = detectMobile()

  // Desktop QR-handoff state
  const [kycSession, setKycSession] = useState<KycSession | null>(null)
  const [mobileUrl,  setMobileUrl]  = useState('')
  const unsubRef = useRef<(() => void) | null>(null)
  const countdown = useCountdown(kycSession?.expires_at ?? null)

  // Upload state (desktop-direct / mobile-direct flows)
  const [subStep, setSubStep] = useState<SubStep>(isMobile ? 'id_upload' : 'choose')
  const [idCardUrl, setIdCardUrl] = useState<string>(initialData?.idCardUrl || '')
  const [idBackUrl, setIdBackUrl] = useState<string>(initialData?.idBackUrl || '')
  const [isUploadingFront,  setIsUploadingFront]  = useState(false)
  const [isUploadingBack,   setIsUploadingBack]   = useState(false)
  const [submissionResult, setSubmissionResult] = useState<{
    ok: boolean
    status: KycSession['status']
    reason?: string
    cnicNumber?: string | null
    expiryDate?: string | null
  } | null>(null)

  console.log('TripAvail Verification System v5.0 [CNIC OCR + Admin Review]')

  // Cleanup realtime sub on unmount
  useEffect(() => () => { unsubRef.current?.() }, [])

  // â”€â”€ QR Handoff: create session + subscribe â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const startQrHandoff = async () => {
    if (!user?.id) return
    try {
      let session = await getActiveKycSession(user.id, role)
      if (!session) session = await createKycSession(user.id, role)
      setKycSession(session)
      setMobileUrl(buildMobileKycUrl(session.session_token))
      setSubStep('qr_waiting')

      unsubRef.current?.()
      let realtimeDone = false

      const realtime = subscribeToKycSession(session.session_token, async (updated) => {
        setKycSession(updated)
        if (['pending_admin_review', 'approved'].includes(updated.status) && !realtimeDone) {
          realtimeDone = true
          unsubRef.current?.()
          setSubStep('qr_complete')
          await handleSessionComplete(updated)
        }
        if (updated.status === 'failed' && !realtimeDone) {
          realtimeDone = true
          unsubRef.current?.()
          setSubStep('result')
          setSubmissionResult({ ok: false, status: 'failed', reason: updated.failure_reason || 'Processing failed.' })
        }
        if (updated.status === 'processing') {
          setSubStep('qr_complete')
        }
        if (updated.status === 'expired') {
          toast.error('Session expired. Generate a new QR code.')
          setSubStep('choose')
        }
      })

      // Polling safety net (realtime can be flaky on free plan)
      const token = session.session_token
      const intervalId = setInterval(async () => {
        if (realtimeDone) { clearInterval(intervalId); return }
        const fresh = await getKycSessionByToken(token)
        if (fresh?.status && ['pending_admin_review', 'approved'].includes(fresh.status)) {
          realtimeDone = true
          clearInterval(intervalId)
          unsubRef.current?.()
          setKycSession(fresh)
          setSubStep('qr_complete')
          await handleSessionComplete(fresh)
        }
        if (fresh?.status === 'failed') {
          realtimeDone = true
          clearInterval(intervalId)
          unsubRef.current?.()
          setKycSession(fresh)
          setSubStep('result')
          setSubmissionResult({ ok: false, status: 'failed', reason: fresh.failure_reason || 'Processing failed.' })
        }
        if (fresh?.status === 'processing') {
          setSubStep('qr_complete')
        }
      }, 4000)

      unsubRef.current = () => { realtime(); clearInterval(intervalId) }
    } catch (e: any) {
      toast.error('Failed to start session: ' + e.message)
    }
  }

  // Called when mobile session is complete
  const handleSessionComplete = async (session: KycSession) => {
    try {
      if (!session.id_front_path || !session.id_back_path) throw new Error('Incomplete session data.')
      setIdCardUrl('uploaded')
      setIdBackUrl('uploaded')

      const ok = ['pending_admin_review', 'approved'].includes(session.status)
      setSubmissionResult({
        ok,
        status: session.status,
        reason: session.failure_reason || undefined,
        cnicNumber: session.cnic_number ?? null,
        expiryDate: session.expiry_date ?? null,
      })
      setSubStep('result')
    } catch (e: any) {
      toast.error(e.message || 'Session processing failed.')
      setSubStep('choose')
    }
  }

  const refreshQr = async () => {
    if (kycSession) await expireKycSession(kycSession.session_token)
    unsubRef.current?.()
    setKycSession(null)
    setMobileUrl('')
    await startQrHandoff()
  }

  // â”€â”€ Desktop-direct upload handlers (private storage via edge function) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const uploadKycImage = async (token: string, field: 'id_front' | 'id_back', file: File) => {
    const form = new FormData()
    form.append('session_token', token)
    form.append('field', field)
    form.append('image', file, `${field}.jpg`)

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

    const res = await fetch(`${supabaseUrl}/functions/v1/kyc-mobile-upload`, {
      method: 'POST',
      headers: { apikey: anonKey },
      body: form,
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'Upload failed')
    return json as { path: string; status: string }
  }

  const ensureSession = async (): Promise<KycSession> => {
    if (!user?.id) throw new Error('Not signed in')
    if (kycSession) return kycSession
    let session = await getActiveKycSession(user.id, role)
    if (!session) session = await createKycSession(user.id, role)
    setKycSession(session)
    return session
  }

  const handleIdFrontUpload = async (file: File) => {
    if (!user?.id) return
    setIsUploadingFront(true)
    try {
      const session = await ensureSession()
      await uploadKycImage(session.session_token, 'id_front', file)
      setIdCardUrl('uploaded')
      toast.success('ID Front uploaded!')
    } catch { toast.error('Upload failed. Try again.') }
    finally { setIsUploadingFront(false) }
  }

  const handleIdBackUpload = async (file: File) => {
    if (!user?.id) return
    setIsUploadingBack(true)
    try {
      const session = await ensureSession()
      await uploadKycImage(session.session_token, 'id_back', file)
      setIdBackUrl('uploaded')
      toast.success('ID Back uploaded!')

      unsubRef.current?.()
      const realtime = subscribeToKycSession(session.session_token, (updated) => {
        setKycSession(updated)
        if (['pending_admin_review', 'approved'].includes(updated.status)) {
          unsubRef.current?.()
          setSubmissionResult({
            ok: true,
            status: updated.status,
            cnicNumber: updated.cnic_number ?? null,
            expiryDate: updated.expiry_date ?? null,
          })
          setSubStep('result')
        }
        if (updated.status === 'failed') {
          unsubRef.current?.()
          setSubmissionResult({ ok: false, status: 'failed', reason: updated.failure_reason || 'Processing failed.' })
          setSubStep('result')
        }
      })
      unsubRef.current = realtime
      setSubStep('processing')
    } catch { toast.error('Upload failed. Try again.') }
    finally { setIsUploadingBack(false) }
  }

  const canProceed = idCardUrl && idBackUrl

  // â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  return (
    <div className="max-w-xl mx-auto py-8">
      <AnimatePresence mode="wait">

        {/* Method chooser (desktop only) */}
        {subStep === 'choose' && (
          <motion.div key="choose" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-4">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h4 className="text-2xl font-black text-foreground tracking-tight italic uppercase">Verify Your Identity</h4>
              <p className="text-muted-foreground mt-2 font-medium">
                We need your CNIC (front &amp; back). Verification is completed via OCR and admin approval.
              </p>
            </div>

            {/* Phone â€” recommended */}
            <Card className="p-6 border-2 border-primary/30 bg-primary/5 cursor-pointer hover:border-primary/60 hover:shadow-lg hover:shadow-primary/10 transition-all" onClick={startQrHandoff}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary/20 text-primary shrink-0">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h5 className="font-black text-foreground uppercase text-sm">Use Your Phone</h5>
                    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-primary text-primary-foreground">Recommended</span>
                  </div>
                  <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                    Scan a QR code with your phone camera. Better quality, auto-focus, back camera. Same as Stripe / Revolut / Wise.
                  </p>
                  <div className="flex gap-3 mt-3">
                    {['HD Camera', 'Auto-focus', 'Back Camera'].map((f) => (
                      <span key={f} className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-1 rounded-lg">{f}</span>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* Laptop fallback */}
            <Card className="p-6 border-2 border-border cursor-pointer hover:border-foreground/30 hover:shadow-md transition-all" onClick={() => setSubStep('id_upload')}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-muted text-muted-foreground shrink-0">
                  <Monitor className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h5 className="font-black text-foreground uppercase text-sm mb-1">Use This Device</h5>
                  <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                    Upload photos from your computer. Lower quality but works without a phone.
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* QR Waiting screen */}
        {subStep === 'qr_waiting' && (
          <motion.div key="qr_waiting" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            <div className="text-center">
              <h4 className="text-2xl font-black text-foreground tracking-tight italic uppercase mb-2">Scan with Your Phone</h4>
              <p className="text-muted-foreground font-medium text-sm">Open your phone camera and scan the code below.</p>
            </div>

            <div className="flex justify-center">
              <div className="p-5 bg-white rounded-3xl shadow-xl border border-border">
                {mobileUrl && <QRCodeSVG value={mobileUrl} size={220} level="M" includeMargin={false} />}
              </div>
            </div>

            {mobileUrl && (
              <Card className="p-4 border-border bg-background/50">
                <p className="text-xs text-muted-foreground font-medium">
                  If scanning doesn’t open the page, copy this link:
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 min-w-0 text-[11px] font-mono text-foreground/80 truncate">
                    {mobileUrl}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl font-bold uppercase text-[10px] tracking-widest"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(mobileUrl)
                        toast.success('Link copied')
                      } catch {
                        toast.error('Could not copy link')
                      }
                    }}
                  >
                    Copy
                  </Button>
                </div>
              </Card>
            )}

            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Camera,     label: 'Scan QR',    desc: 'Open phone camera' },
                { icon: CreditCard, label: 'Capture CNIC',  desc: 'Front + Back' },
                { icon: ShieldCheck,  label: 'Submit',      desc: 'OCR + admin review' },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} className="p-3 bg-muted/50 rounded-2xl text-center space-y-2">
                  <Icon className="w-5 h-5 text-primary mx-auto" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-foreground">{label}</p>
                  <p className="text-[10px] text-muted-foreground font-medium">{desc}</p>
                </div>
              ))}
            </div>

            <Card className="p-5 border-primary/20 bg-primary/5">
              <div className="flex items-center gap-4">
                <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}
                  className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </motion.div>
                <div>
                  <p className="font-bold text-sm text-foreground">Waiting for your phoneâ€¦</p>
                  <p className="text-xs text-muted-foreground font-medium">This page updates automatically once complete.</p>
                </div>
                {countdown && (
                  <div className="ml-auto flex items-center gap-1 text-xs font-bold text-muted-foreground shrink-0">
                    <Clock className="w-3 h-3" /> {countdown}
                  </div>
                )}
              </div>
            </Card>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 rounded-2xl font-bold uppercase text-xs tracking-widest" onClick={refreshQr}>
                <RefreshCw className="w-4 h-4 mr-2" /> New QR
              </Button>
              <Button variant="ghost" className="flex-1 rounded-2xl font-bold uppercase text-xs tracking-widest"
                onClick={() => { unsubRef.current?.(); setSubStep('id_upload') }}>
                <Monitor className="w-4 h-4 mr-2" /> Use Laptop
              </Button>
            </div>
          </motion.div>
        )}

        {/* QR Complete processing */}
        {subStep === 'qr_complete' && (
          <motion.div key="qr_complete" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }}
              className="w-24 h-24 bg-success/20 rounded-full flex items-center justify-center text-success mx-auto mb-8">
              <Check className="w-12 h-12" />
            </motion.div>
            <h4 className="text-2xl font-black text-foreground tracking-tight italic uppercase">Phone Capture Complete!</h4>
            <p className="text-muted-foreground mt-2 font-medium">Processing OCR and preparing admin reviewâ€¦</p>
          </motion.div>
        )}

        {/* Desktop-direct / mobile-direct: ID upload */}
        {subStep === 'id_upload' && (
          <motion.div key="id_upload" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-4">
                <CreditCard className="w-8 h-8" />
              </div>
              <h4 className="text-2xl font-black text-foreground tracking-tight italic uppercase">Step 1: Government ID</h4>
              <p className="text-muted-foreground mt-1 font-medium">Upload both sides of your CNIC.</p>
            </div>

            {/* ID FRONT */}
            {idCardUrl ? (
              <Card className="p-6 border-2 bg-success/10 border-success/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-success/20 text-success"><Check className="w-6 h-6" /></div>
                    <div><h5 className="font-bold text-foreground uppercase text-sm">ID Card Front</h5><p className="text-xs text-muted-foreground font-medium">Captured &amp; validated</p></div>
                  </div>
                  <Button variant="outline" size="sm" className="rounded-xl border-success/20 text-success hover:bg-success/10" onClick={() => setIdCardUrl('')}>Retake</Button>
                </div>
              </Card>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <CreditCard className="w-4 h-4 text-primary" />
                  <h5 className="font-bold text-foreground uppercase text-sm">ID Card Front â€” Face Side</h5>
                </div>
                <IDCaptureWidget side="front" onCapture={handleIdFrontUpload} disabled={isUploadingFront} />
                {isUploadingFront && (
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-1">
                    <Loader2 className="w-4 h-4 animate-spin" /> Uploadingâ€¦
                  </div>
                )}
              </div>
            )}

            {/* ID BACK */}
            {idCardUrl && (
              idBackUrl ? (
                <Card className="p-6 border-2 bg-success/10 border-success/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-success/20 text-success"><Check className="w-6 h-6" /></div>
                      <div><h5 className="font-bold text-foreground uppercase text-sm">ID Card Back</h5><p className="text-xs text-muted-foreground font-medium">Captured &amp; validated</p></div>
                    </div>
                    <Button variant="outline" size="sm" className="rounded-xl border-success/20 text-success hover:bg-success/10" onClick={() => setIdBackUrl('')}>Retake</Button>
                  </div>
                </Card>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-4 h-4 text-primary" />
                    <h5 className="font-bold text-foreground uppercase text-sm">ID Card Back â€” Rear Side</h5>
                  </div>
                  <IDCaptureWidget side="back" onCapture={handleIdBackUpload} disabled={isUploadingBack} />
                  {isUploadingBack && (
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-1">
                      <Loader2 className="w-4 h-4 animate-spin" /> Uploadingâ€¦
                    </div>
                  )}
                </div>
              )
            )}

            <div className="pt-4 space-y-3">
              <Button
                className="w-full h-14 rounded-2xl font-black uppercase tracking-widest bg-primary-gradient shadow-lg shadow-primary/20"
                disabled={!canProceed}
                onClick={() => setSubStep('processing')}
              >
                Submit for Review <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              {!isMobile && (
                <button onClick={() => setSubStep('choose')} className="w-full text-center text-xs font-bold text-muted-foreground uppercase tracking-widest hover:text-primary">
                  â† Switch to phone camera
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* Processing */}
        {subStep === 'processing' && (
          <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }}
              className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center text-primary mx-auto mb-8">
              <ShieldCheck className="w-10 h-10" />
            </motion.div>
            <h4 className="text-2xl font-black text-foreground tracking-tight italic uppercase">Submitting for Review</h4>
            <p className="text-muted-foreground mt-2 font-medium">OCR is running and your request will appear in the admin KYC queue.</p>
          </motion.div>
        )}

        {/* Result */}
        {subStep === 'result' && (
          <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
            <Card className={cn('p-10 rounded-[32px] text-center border-2',
              submissionResult?.ok ? 'bg-success/10 border-success/20' : 'bg-destructive/10 border-destructive/20')}>
              <div className={cn('w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl',
                submissionResult?.ok ? 'bg-success text-primary-foreground' : 'bg-destructive text-primary-foreground')}>
                {submissionResult?.ok ? <Check className="w-10 h-10" /> : <AlertCircle className="w-10 h-10" />}
              </div>
              <h4 className="text-3xl font-black text-foreground tracking-tight italic uppercase">
                {submissionResult?.ok ? 'Submitted for Review' : 'Processing Failed'}
              </h4>
              <p className="text-muted-foreground mt-4 font-medium px-4">
                {submissionResult?.ok
                  ? 'Your CNIC has been received. Admin approval is required before your KYC is accepted.'
                  : (submissionResult?.reason || 'We could not process your CNIC. Please try again with clearer photos.')}
              </p>
              {submissionResult?.ok ? (
                <Button
                  className="mt-10 rounded-2xl h-14 bg-primary-gradient text-primary-foreground px-12 font-black uppercase tracking-widest border-0 shadow-lg shadow-primary/20"
                  onClick={() => {
                    const token = kycSession?.session_token
                    if (!token) return
                    onComplete({
                      kycSessionToken: token,
                      kycStatus: submissionResult?.status || 'pending_admin_review',
                      cnicNumber: submissionResult?.cnicNumber ?? null,
                      expiryDate: submissionResult?.expiryDate ?? null,
                      failureReason: null,
                    })
                  }}
                >
                  Proceed to Documents <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              ) : (
                <Button
                  className="mt-10 rounded-2xl h-14 bg-foreground px-12 font-black uppercase tracking-widest text-background"
                  onClick={() => setSubStep(isMobile ? 'id_upload' : 'choose')}
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
