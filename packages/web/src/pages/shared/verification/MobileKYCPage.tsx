import { AlertCircle, Camera, Check, CreditCard, FileText, Loader2, Shield } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'react-hot-toast'
import { useSearchParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

import { KycSession } from '@/features/verification/services/kycSessionService'
import { cn } from '@/lib/utils'

type MobileStep =
  | 'loading'
  | 'invalid'
  | 'expired'
  | 'id_front'
  | 'id_back'
  | 'processing'
  | 'done'
  | 'failed'
  | 'error'

type TokenSessionView = {
  id: string
  status: KycSession['status']
  expires_at: string
  has_id_front: boolean
  has_id_back: boolean
  failure_code: string | null
  failure_reason: string | null
}

async function fetchSessionByToken(token: string): Promise<TokenSessionView> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

  const res = await fetch(`${supabaseUrl}/functions/v1/kyc-session?session_token=${encodeURIComponent(token)}`,
    {
      method: 'GET',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
    },
  )

  const raw = await res.text()
  let json: any = null
  try {
    json = raw ? JSON.parse(raw) : null
  } catch {
    // Non-JSON error bodies happen when the function is missing or misconfigured.
  }

  if (!res.ok) {
    const message = json?.error || `Failed to load session (HTTP ${res.status})`
    const err: any = new Error(message)
    err.status = res.status
    err.raw = raw
    throw err
  }

  if (!json) {
    const err: any = new Error('Failed to load session (invalid JSON response)')
    err.status = 500
    err.raw = raw
    throw err
  }

  return json as TokenSessionView
}

// ── Upload a captured file via the edge function ──────────────────────────────
async function uploadKycImage(
  token: string,
  field: 'id_front' | 'id_back',
  file: File,
): Promise<{ path: string; status: string }> {
  const form = new FormData()
  form.append('session_token', token)
  form.append('field', field)
  form.append('image', file, `${field}.jpg`)

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const anonKey    = import.meta.env.VITE_SUPABASE_ANON_KEY

  const res = await fetch(`${supabaseUrl}/functions/v1/kyc-mobile-upload`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
    },
    body: form,
  })

  const raw = await res.text()
  let json: any = null
  try {
    json = raw ? JSON.parse(raw) : null
  } catch {
    // ignore
  }

  if (!res.ok) {
    const message = json?.error || `Upload failed (HTTP ${res.status})`
    const err: any = new Error(message)
    err.status = res.status
    err.raw = raw
    throw err
  }

  return { path: json?.path as string, status: json?.status as string }
}

// ── Document detection state ──────────────────────────────────────────────────
type DetectionState = 'idle' | 'bad_dark' | 'bad_bright' | 'blurry' | 'ready' | 'locked'

const DETECTION_LABELS: Record<DetectionState, string> = {
  idle:        'Position card in frame',
  bad_dark:    'Too dark — find better lighting',
  bad_bright:  'Too bright — reduce glare',
  blurry:      'Hold still — card is blurry',
  ready:       'Looking good — hold steady…',
  locked:      '✓ Capturing automatically…',
}

const cornerBase = 'absolute w-8 h-8 transition-colors duration-200'
function getGuideColors(state: DetectionState) {
  if (state === 'locked')
    return { outer: 'border-green-500/80', corner: 'border-green-400' }
  if (state === 'ready')
    return { outer: 'border-yellow-400/80', corner: 'border-yellow-400' }
  if (state === 'idle')
    return { outer: 'border-white/40', corner: 'border-white' }
  // bad_dark | bad_bright | blurry
  return { outer: 'border-red-500/80', corner: 'border-red-500' }
}

// ── Camera capture helper ─────────────────────────────────────────────────────
function CameraCapture({
  label,
  hint,
  onCapture,
  disabled,
  facingMode = 'environment',
}: {
  label: string
  hint: string
  onCapture: (file: File) => void
  disabled?: boolean
  facingMode?: 'environment' | 'user'
}) {
  const videoRef       = useRef<HTMLVideoElement>(null)
  const canvasRef      = useRef<HTMLCanvasElement>(null)
  const offscreenRef   = useRef<HTMLCanvasElement | null>(null)
  const rafRef         = useRef<number | null>(null)
  const lastTickRef    = useRef<number>(0)
  const stableRef      = useRef<number>(0)
  const lockedAtRef    = useRef<number | null>(null)
  const capturedRef    = useRef<boolean>(false)
  const captureRef     = useRef<() => void>(() => {})

  const [streaming, setStreaming] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [detection, setDetection] = useState<DetectionState>('idle')

  // ── Camera stream ─────────────────────────────────────────────────────────
  useEffect(() => {
    let stream: MediaStream | null = null
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } } })
      .then((s) => {
        stream = s
        if (videoRef.current) {
          videoRef.current.srcObject = s
          videoRef.current.play()
          offscreenRef.current = document.createElement('canvas')
          capturedRef.current  = false
          stableRef.current    = 0
          lockedAtRef.current  = null
          setDetection('idle')
          setStreaming(true)
        }
      })
      .catch((e) => setCameraError(e.message))

    return () => { stream?.getTracks().forEach((t) => t.stop()) }
  }, [facingMode])

  // ── Capture helper (forward ref so rAF closure always has latest) ─────────
  const capture = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return
    const video  = videoRef.current
    const canvas = canvasRef.current
    canvas.width  = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')!.drawImage(video, 0, 0)
    canvas.toBlob(
      (blob) => { if (blob) onCapture(new File([blob], `${label}.jpg`, { type: 'image/jpeg' })) },
      'image/jpeg', 0.92,
    )
  }, [label, onCapture])

  useEffect(() => { captureRef.current = capture }, [capture])

  // ── Laplacian-variance + brightness analysis loop (~15 fps) ───────────────
  useEffect(() => {
    if (!streaming) return

    const FRAME_INTERVAL_MS = 66          // ~15 fps analysis
    const STABLE_FRAMES_NEEDED = 10       // ~660 ms of consecutive good frames
    const AUTO_CAPTURE_DELAY_MS = 1500    // ms after lock before auto-capture
    const SHARPNESS_THRESHOLD = 150       // Laplacian variance; empirically tuned for mobile CNIC
    const BRIGHTNESS_LOW = 40
    const BRIGHTNESS_HIGH = 220

    const analyzeFrame = (): DetectionState => {
      const video = videoRef.current
      const offscreen = offscreenRef.current
      if (!video || !offscreen || video.readyState < 2) return 'idle'

      // Downscale to 320×240 for fast processing
      const W = 320, H = 240
      offscreen.width  = W
      offscreen.height = H
      const ctx = offscreen.getContext('2d', { willReadFrequently: true })!
      ctx.drawImage(video, 0, 0, W, H)

      // ── Brightness check on center 60 % ROI ─────────────────────────────
      const rx = Math.floor(W * 0.2), ry = Math.floor(H * 0.2)
      const rw = Math.floor(W * 0.6), rh = Math.floor(H * 0.6)
      const roi = ctx.getImageData(rx, ry, rw, rh).data
      let brightnessSum = 0
      const pixelCount = roi.length / 4
      for (let i = 0; i < roi.length; i += 4) {
        brightnessSum += 0.299 * roi[i] + 0.587 * roi[i + 1] + 0.114 * roi[i + 2]
      }
      const brightness = brightnessSum / pixelCount
      if (brightness < BRIGHTNESS_LOW)  return 'bad_dark'
      if (brightness > BRIGHTNESS_HIGH) return 'bad_bright'

      // ── Laplacian variance on full downscaled frame ──────────────────────
      // Kernel: [ 0  1  0 ]   →  L(x,y) = -4·c + N + S + E + W
      //         [ 1 -4  1 ]
      //         [ 0  1  0 ]
      const full = ctx.getImageData(0, 0, W, H).data
      const gray = new Float32Array(W * H)
      for (let i = 0; i < W * H; i++) {
        gray[i] = 0.299 * full[i * 4] + 0.587 * full[i * 4 + 1] + 0.114 * full[i * 4 + 2]
      }
      let lapSumSq = 0, lapCount = 0
      for (let y = 1; y < H - 1; y++) {
        for (let x = 1; x < W - 1; x++) {
          const c   = gray[y * W + x]
          const lap = -4 * c
            + gray[(y - 1) * W + x]
            + gray[(y + 1) * W + x]
            + gray[y * W + (x - 1)]
            + gray[y * W + (x + 1)]
          lapSumSq += lap * lap
          lapCount++
        }
      }
      const sharpness = lapSumSq / lapCount

      if (sharpness < SHARPNESS_THRESHOLD) return 'blurry'
      return 'ready'
    }

    const loop = (timestamp: number) => {
      if (timestamp - lastTickRef.current >= FRAME_INTERVAL_MS) {
        lastTickRef.current = timestamp
        const state = analyzeFrame()

        if (state === 'ready') {
          stableRef.current++
          if (stableRef.current >= STABLE_FRAMES_NEEDED) {
            if (lockedAtRef.current === null) lockedAtRef.current = Date.now()
            if (!capturedRef.current && Date.now() - lockedAtRef.current >= AUTO_CAPTURE_DELAY_MS) {
              capturedRef.current = true
              // Fire capture outside of rAF to avoid canvas race
              Promise.resolve().then(() => captureRef.current())
            }
            setDetection('locked')
          } else {
            setDetection('ready')
          }
        } else {
          stableRef.current  = 0
          lockedAtRef.current = null
          setDetection(state)
        }
      }
      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)
    return () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current) }
  }, [streaming])

  const { outer, corner } = getGuideColors(detection)

  return (
    <div className="space-y-4">
      <div className="relative rounded-2xl overflow-hidden bg-black aspect-[4/3]">
        {cameraError ? (
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
            <div className="space-y-2">
              <AlertCircle className="w-8 h-8 text-destructive mx-auto" />
              <p className="text-sm text-white font-medium">Camera unavailable</p>
              <p className="text-xs text-white/60">{cameraError}</p>
            </div>
          </div>
        ) : (
          <>
            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />

            {/* ── Card guide frame + corner brackets ─────────────────────────── */}
            <div className={cn('absolute inset-4 border-2 rounded-xl pointer-events-none transition-colors duration-200', outer)}>
              {/* Top-left */}
              <div className={cn(cornerBase, 'top-0 left-0 border-t-4 border-l-4 rounded-tl-xl', corner)} />
              {/* Top-right */}
              <div className={cn(cornerBase, 'top-0 right-0 border-t-4 border-r-4 rounded-tr-xl', corner)} />
              {/* Bottom-left */}
              <div className={cn(cornerBase, 'bottom-0 left-0 border-b-4 border-l-4 rounded-bl-xl', corner)} />
              {/* Bottom-right */}
              <div className={cn(cornerBase, 'bottom-0 right-0 border-b-4 border-r-4 rounded-br-xl', corner)} />

              {/* ── Status pill ──────────────────────────────────────────────── */}
              {streaming && (
                <div className={cn(
                  'absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200',
                  detection === 'locked'     ? 'bg-green-500 text-white' :
                  detection === 'ready'      ? 'bg-yellow-400 text-black' :
                  detection === 'idle'       ? 'bg-white/20 text-white' :
                                               'bg-red-500 text-white',
                )}>
                  {detection === 'locked' && <span className="mr-1">✓</span>}
                  {DETECTION_LABELS[detection]}
                </div>
              )}
            </div>

            {/* Spinner while camera warms up */}
            {!streaming && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <Loader2 className="w-8 h-8 animate-spin text-white" />
              </div>
            )}
          </>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <p className="text-center text-sm text-muted-foreground font-medium px-4">{hint}</p>

      <Button
        className="w-full h-14 rounded-2xl font-black uppercase tracking-widest bg-primary text-primary-foreground shadow-lg text-base"
        onClick={capture}
        disabled={!streaming || disabled || !!cameraError}
      >
        {disabled ? (
          <><Loader2 className="mr-2 w-5 h-5 animate-spin" /> Processing…</>
        ) : (
          <><Camera className="mr-2 w-5 h-5" /> Capture</>
        )}
      </Button>

      {/* File fallback — always shown so users can bypass camera issues */}
      {!disabled && (
        <label className="block text-center">
          <span className="text-xs font-bold text-primary uppercase tracking-widest cursor-pointer underline underline-offset-4">
            Choose from gallery
          </span>
          <input
            type="file" accept="image/*" capture="environment" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onCapture(f) }}
          />
        </label>
      )}
    </div>
  )
}

// ── Progress step indicator ───────────────────────────────────────────────────
function StepDots({ current }: { current: 0 | 1 }) {
  return (
    <div className="flex items-center gap-2 justify-center mb-6">
      {['ID Front', 'ID Back'].map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <div className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all',
            i < current  ? 'bg-success text-white' :
            i === current ? 'bg-primary text-white scale-110 shadow-lg shadow-primary/30' :
                            'bg-muted text-muted-foreground',
          )}>
            {i < current ? <Check className="w-4 h-4" /> : i + 1}
          </div>
          {i < 1 && <div className={cn('h-0.5 w-6 rounded', i < current ? 'bg-success' : 'bg-muted')} />}
        </div>
      ))}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function MobileKYCPage() {
  const [params]  = useSearchParams()
  const token     = params.get('session') || ''

  const [step, setStep]       = useState<MobileStep>('loading')
  const [session, setSession] = useState<TokenSessionView | null>(null)
  const [busy, setBusy]       = useState(false)
  const [diag, setDiag] = useState<{ status?: number; message?: string } | null>(null)

  // Load session on mount (no realtime for anon; poll via edge function)
  useEffect(() => {
    if (!token) {
      setStep('invalid')
      return
    }

    let cancelled = false

    const apply = (s: TokenSessionView) => {
      if (new Date(s.expires_at) < new Date() || s.status === 'expired') {
        setStep('expired')
        return
      }
      if (s.status === 'failed') {
        setStep('failed')
        return
      }
      if (s.status === 'processing') {
        setStep('processing')
        return
      }
      if (['pending_admin_review', 'approved', 'rejected'].includes(s.status)) {
        setStep('done')
        return
      }

      setSession(s)
      if (s.has_id_back) setStep('processing')
      else if (s.has_id_front) setStep('id_back')
      else setStep('id_front')
    }

    const load = async () => {
      try {
        const s = await fetchSessionByToken(token)
        if (cancelled) return
        setDiag(null)
        setSession(s)
        apply(s)
      } catch (err: any) {
        if (cancelled) return

        // Diagnostics to avoid "Invalid Link" masking real endpoint problems.
        console.error('[mobile-kyc] failed to load session', {
          status: err?.status,
          message: err?.message,
          raw: err?.raw,
        })

        setDiag({ status: err?.status, message: err?.message })

        if (err?.status === 410) setStep('expired')
        else if (typeof err?.status === 'number' && err.status >= 500) setStep('error')
        else setStep('invalid')
      }
    }

    load()
    const interval = setInterval(load, 2000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [token])

  const handleIdFront = async (file: File) => {
    setBusy(true)
    try {
      await uploadKycImage(token, 'id_front', file)
      toast.success('ID Front captured!')
      setStep('id_back')
    } catch (e: any) {
      toast.error(e.message || 'Upload failed')
    } finally {
      setBusy(false)
    }
  }

  const handleIdBack = async (file: File) => {
    setBusy(true)
    try {
      await uploadKycImage(token, 'id_back', file)
      toast.success('ID Back captured!')
      setStep('processing')
    } catch (e: any) {
      toast.error(e.message || 'Upload failed')
    } finally {
      setBusy(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background p-4 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 pt-2">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Shield className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-base font-black uppercase tracking-wide text-foreground">TripAvail KYC</h1>
          <p className="text-xs text-muted-foreground font-medium">Secure Identity Verification</p>
        </div>
      </div>

      <div className="flex-1">
        <AnimatePresence mode="wait">

          {/* Loading */}
          {step === 'loading' && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-64 gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="text-sm font-medium text-muted-foreground">Loading session…</p>
            </motion.div>
          )}

          {/* Invalid */}
          {step === 'invalid' && (
            <motion.div key="invalid" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className="p-8 text-center space-y-4 border-destructive/20 bg-destructive/5">
                <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
                <h2 className="text-xl font-black uppercase">Invalid Link</h2>
                <p className="text-muted-foreground text-sm font-medium">
                  This QR code is invalid. Please scan the code displayed on your laptop again.
                </p>
                {diag?.status && (
                  <p className="text-xs text-muted-foreground font-medium">
                    Code: HTTP {diag.status}
                  </p>
                )}
              </Card>
            </motion.div>
          )}

          {/* Expired */}
          {step === 'expired' && (
            <motion.div key="expired" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className="p-8 text-center space-y-4 border-amber-500/20 bg-amber-500/5">
                <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
                <h2 className="text-xl font-black uppercase">Session Expired</h2>
                <p className="text-muted-foreground text-sm font-medium">
                  This session has expired (30 min limit). Please go back to your laptop and generate a new QR code.
                </p>
              </Card>
            </motion.div>
          )}

          {/* ID Front */}
          {step === 'id_front' && (
            <motion.div key="id_front" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <StepDots current={0} />
              <div className="text-center mb-4">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-3">
                  <CreditCard className="w-7 h-7" />
                </div>
                <h2 className="text-xl font-black uppercase tracking-tight">ID Card — Front</h2>
                <p className="text-sm text-muted-foreground mt-1 font-medium">Face side of your government ID</p>
              </div>
              <CameraCapture
                label="id_front" facingMode="environment"
                hint="Place your ID card flat. Ensure all text is visible with no glare."
                onCapture={handleIdFront} disabled={busy}
              />
            </motion.div>
          )}

          {/* ID Back */}
          {step === 'id_back' && (
            <motion.div key="id_back" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <StepDots current={1} />
              <div className="text-center mb-4">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-3">
                  <FileText className="w-7 h-7" />
                </div>
                <h2 className="text-xl font-black uppercase tracking-tight">ID Card — Back</h2>
                <p className="text-sm text-muted-foreground mt-1 font-medium">Rear/back side of the same ID card</p>
              </div>
              <CameraCapture
                label="id_back" facingMode="environment"
                hint="Flip your ID card over and capture the back side."
                onCapture={handleIdBack} disabled={busy}
              />
              <button onClick={() => setStep('id_front')} className="w-full text-center text-xs font-bold text-muted-foreground uppercase tracking-widest">
                ← Retake Front
              </button>
            </motion.div>
          )}

          {/* Processing */}
          {step === 'processing' && (
            <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-64 gap-6 text-center">
              <motion.div
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center text-primary"
              >
                <Shield className="w-10 h-10" />
              </motion.div>
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight">Submitting Documents</h2>
                <p className="text-sm text-muted-foreground mt-2 font-medium">We are securely processing your CNIC for OCR. You can switch back to your laptop.</p>
              </div>
            </motion.div>
          )}

          {/* Failed */}
          {step === 'failed' && (
            <motion.div key="failed" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className="p-8 text-center space-y-4 border-destructive/20 bg-destructive/5">
                <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
                <h2 className="text-xl font-black uppercase">Processing Failed</h2>
                <p className="text-muted-foreground text-sm font-medium">
                  {session?.failure_reason || 'We could not process your CNIC. Please retake clearer photos.'}
                </p>
              </Card>
            </motion.div>
          )}

          {/* Done */}
          {step === 'done' && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <Card className="p-8 text-center space-y-6 border-success/20 bg-success/5">
                <div className="w-20 h-20 bg-success rounded-3xl flex items-center justify-center text-white mx-auto shadow-xl">
                  <Check className="w-10 h-10" />
                </div>
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tight">Capture Complete!</h2>
                  <p className="text-muted-foreground mt-3 font-medium text-sm">
                    Your photos have been submitted. Switch back to your laptop — it will update automatically.
                  </p>
                </div>
                <div className="p-4 bg-primary/5 rounded-2xl text-left space-y-2">
                  <div className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-success shrink-0" />
                    <span className="text-sm font-medium">ID Front uploaded</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-success shrink-0" />
                    <span className="text-sm font-medium">ID Back uploaded</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground font-medium">You can close this page.</p>
              </Card>
            </motion.div>
          )}

          {/* Error */}
          {step === 'error' && (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className="p-8 text-center space-y-4 border-destructive/20 bg-destructive/5">
                <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
                <h2 className="text-xl font-black uppercase">Something Went Wrong</h2>
                <p className="text-muted-foreground text-sm font-medium">Please try again or use your laptop camera instead.</p>
                {diag?.status && (
                  <p className="text-xs text-muted-foreground font-medium">
                    Code: HTTP {diag.status}{diag?.message ? ` — ${diag.message}` : ''}
                  </p>
                )}
                <Button variant="outline" onClick={() => setStep('id_front')}>Try Again</Button>
              </Card>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}
