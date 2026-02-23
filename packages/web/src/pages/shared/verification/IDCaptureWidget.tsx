/**
 * IDCaptureWidget
 * ─────────────────────────────────────────────────────────────────────
 * Back-camera capture optimised for ID card scanning.
 *
 * Quality enforcement (all canvas-based, no external lib):
 *  • Blur   — Laplacian-variance; rejects frames below threshold
 *  • Glare  — rejects if >25% of pixels are overexposed (>240 luma)
 *  • Stability — tracks inter-frame pixel diff; waits 800 ms of stillness
 *  • Auto-capture — 3-2-1 countdown fires automatically when all pass
 *
 * Used for: ID card front and back capture.
 */

import { AlertTriangle, Camera, CheckCircle2, Loader2, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// ── ID-1 card ratio (85.6 × 53.98 mm) ─────────────────────────────────
const CARD_RATIO = 85.6 / 53.98 // ≈ 1.586

interface IDCaptureWidgetProps {
  side: 'front' | 'back'
  onCapture: (file: File) => void
  disabled?: boolean
}

type Status =
  | 'idle'
  | 'requesting'
  | 'live'         // camera on, frames being analysed
  | 'countdown'    // 3-2-1 auto-capture
  | 'preview'      // captured, awaiting confirm
  | 'denied'

type Condition = 'blur' | 'glare' | 'unstable'

// ── Laplacian kernel ──────────────────────────────────────────────────
function laplacianVariance(data: Uint8ClampedArray, w: number, h: number): number {
  let sum = 0; let sumSq = 0; let n = 0
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = (y * w + x) * 4
      const lap =
        -data[idx - w * 4] -
        data[idx - 4] +
        4 * data[idx] -
        data[idx + 4] -
        data[idx + w * 4]
      sum += lap; sumSq += lap * lap; n++
    }
  }
  const mean = sum / n
  return sumSq / n - mean * mean
}

// ── Overexposed region fraction ───────────────────────────────────────
function glareRatio(data: Uint8ClampedArray): number {
  let over = 0
  for (let i = 0; i < data.length; i += 4) {
    const luma = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
    if (luma > 240) over++
  }
  return over / (data.length / 4)
}

// ── Inter-frame mean absolute pixel diff ─────────────────────────────
function frameDiff(a: Uint8ClampedArray, b: Uint8ClampedArray): number {
  let diff = 0
  for (let i = 0; i < a.length; i += 4) diff += Math.abs(a[i] - b[i])
  return diff / (a.length / 4)
}

export function IDCaptureWidget({ side, onCapture, disabled }: IDCaptureWidgetProps) {
  const videoRef   = useRef<HTMLVideoElement>(null)
  const canvasRef  = useRef<HTMLCanvasElement>(null)   // hidden analysis canvas
  const analyzeRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const streamRef  = useRef<MediaStream | null>(null)
  const prevFrameRef = useRef<Uint8ClampedArray | null>(null)
  const stableStartRef = useRef<number | null>(null)
  const countdownRef   = useRef<ReturnType<typeof setInterval> | null>(null)

  const [status, setStatus]           = useState<Status>('idle')
  const [failing, setFailing]         = useState<Condition[]>([])
  const [countdown, setCountdown]     = useState(3)
  const [previewSrc, setPreviewSrc]   = useState<string | null>(null)

  useEffect(() => () => { stopAll() }, [])

  const stopAll = () => {
    if (analyzeRef.current)   clearInterval(analyzeRef.current)
    if (countdownRef.current) clearInterval(countdownRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }

  const startCamera = useCallback(async () => {
    setStatus('requesting')
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { exact: 'environment' }, // back camera
          width:  { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 },
        },
        audio: false,
      }
      let stream: MediaStream
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints)
      } catch {
        // Fallback: any camera (desktop has no "environment" camera)
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1920 }, height: { ideal: 1080 } },
        })
      }
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setStatus('live')
      startAnalysis()
    } catch {
      setStatus('denied')
    }
  }, [])

  // ── Per-frame analysis loop ────────────────────────────────────────
  const startAnalysis = () => {
    analyzeRef.current = setInterval(() => {
      const video  = videoRef.current
      const canvas = canvasRef.current
      if (!video || !canvas || video.readyState < 2) return

      // Downscale to 320×200 for fast analysis
      const AW = 320, AH = Math.round(320 / (video.videoWidth / video.videoHeight))
      canvas.width = AW; canvas.height = AH
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(video, 0, 0, AW, AH)
      const { data } = ctx.getImageData(0, 0, AW, AH)

      const issues: Condition[] = []

      // 1. Blur
      const blur = laplacianVariance(data, AW, AH)
      if (blur < 80) issues.push('blur')

      // 2. Glare
      if (glareRatio(data) > 0.25) issues.push('glare')

      // 3. Stability
      if (prevFrameRef.current) {
        const diff = frameDiff(prevFrameRef.current, data)
        if (diff > 8) {
          stableStartRef.current = null
          issues.push('unstable')
        } else if (!stableStartRef.current) {
          stableStartRef.current = Date.now()
        }
      }
      prevFrameRef.current = new Uint8ClampedArray(data)

      setFailing(issues)

      // All conditions pass AND stable for 800 ms → trigger countdown
      if (
        issues.length === 0 &&
        stableStartRef.current &&
        Date.now() - stableStartRef.current >= 800
      ) {
        clearInterval(analyzeRef.current!)
        beginCountdown()
      }
    }, 250)
  }

  const beginCountdown = () => {
    setStatus('countdown')
    setCountdown(3)
    let c = 3
    countdownRef.current = setInterval(() => {
      c--
      setCountdown(c)
      if (c <= 0) {
        clearInterval(countdownRef.current!)
        captureFrame()
      }
    }, 1000)
  }

  const captureFrame = () => {
    const video  = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    // Full resolution capture
    canvas.width  = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(video, 0, 0)
    setPreviewSrc(canvas.toDataURL('image/jpeg', 0.95))
    stopAll()
    setStatus('preview')
  }

  const retake = () => {
    setPreviewSrc(null)
    prevFrameRef.current = null
    stableStartRef.current = null
    startCamera()
  }

  const confirmCapture = () => {
    canvasRef.current?.toBlob(blob => {
      if (!blob) return
      const file = new File([blob], `id_${side}_${Date.now()}.jpg`, { type: 'image/jpeg' })
      onCapture(file)
    }, 'image/jpeg', 0.95)
  }

  // ── Overlay: ID card rectangle + corners ──────────────────────────
  const cardOverlay = (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {/* dim surround */}
      <div className="absolute inset-0 bg-black/45" />
      {/* card cutout using box-shadow trick */}
      <div
        className={cn(
          'relative z-10 rounded-lg transition-all duration-300',
          (status === 'countdown' || failing.length === 0) && status === 'live'
            ? 'shadow-[0_0_0_9999px_rgba(0,0,0,0)] ring-4 ring-green-400'
            : 'shadow-[0_0_0_9999px_rgba(0,0,0,0.45)] ring-2 ring-white/60',
        )}
        style={{ width: '78%', aspectRatio: String(CARD_RATIO) }}
      >
        {/* Corner marks */}
        {['tl','tr','bl','br'].map(c => (
          <span key={c} className={cn(
            'absolute w-5 h-5 border-white',
            c === 'tl' && 'top-0 left-0 border-t-2 border-l-2 rounded-tl',
            c === 'tr' && 'top-0 right-0 border-t-2 border-r-2 rounded-tr',
            c === 'bl' && 'bottom-0 left-0 border-b-2 border-l-2 rounded-bl',
            c === 'br' && 'bottom-0 right-0 border-b-2 border-r-2 rounded-br',
          )} />
        ))}
        {/* Centre instruction */}
        {status === 'live' && (
          <p className="absolute inset-x-0 -bottom-8 text-center text-[11px] font-bold text-white uppercase tracking-widest">
            {failing.includes('blur')     ? '⚠ Hold steady — too blurry'    :
             failing.includes('glare')    ? '⚠ Reduce glare / adjust angle' :
             failing.includes('unstable') ? '⚠ Hold steady'                 :
             '✓ Looking good — hold still…'}
          </p>
        )}
        {/* Countdown */}
        {status === 'countdown' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-6xl font-black text-white drop-shadow-xl animate-ping-once">
              {countdown}
            </span>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      {/* ── Viewport ── */}
      <div className="relative rounded-3xl overflow-hidden bg-black aspect-video border border-white/10">
        <video
          ref={videoRef}
          className={cn('w-full h-full object-cover', status !== 'live' && status !== 'countdown' && 'hidden')}
          playsInline muted
        />

        {/* Preview */}
        {status === 'preview' && previewSrc && (
          <img src={previewSrc} alt="ID preview" className="w-full h-full object-cover" />
        )}

        {/* Idle */}
        {status === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-muted/90">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Camera className="w-8 h-8 text-primary" />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {side === 'front' ? 'ID Card Front' : 'ID Card Back'} — Camera Ready
            </p>
          </div>
        )}

        {/* Requesting */}
        {status === 'requesting' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-muted/90">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Starting camera…</p>
          </div>
        )}

        {/* Denied */}
        {status === 'denied' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-destructive/10 px-6 text-center">
            <AlertTriangle className="w-8 h-8 text-destructive" />
            <p className="font-bold text-destructive text-sm">Camera access denied</p>
            <p className="text-xs text-muted-foreground">Allow camera in your browser settings, then try again.</p>
          </div>
        )}

        {/* Overlay (live + countdown) */}
        {(status === 'live' || status === 'countdown') && cardOverlay}

        {/* Preview check badge */}
        {status === 'preview' && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm rounded-xl px-3 py-1.5">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <span className="text-xs font-bold text-white">Captured</span>
          </div>
        )}
      </div>

      {/* Hidden canvas for analysis + capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* ── Controls ── */}
      {(status === 'idle' || status === 'denied') && (
        <Button
          className="w-full h-12 rounded-2xl font-black uppercase tracking-widest bg-primary text-white shadow-lg shadow-primary/20 gap-2"
          onClick={startCamera}
          disabled={disabled}
        >
          <Camera className="w-5 h-5" />
          Scan {side === 'front' ? 'ID Front' : 'ID Back'}
        </Button>
      )}

      {status === 'live' && (
        <div className="flex items-center justify-center gap-2 text-xs font-bold text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Auto-capturing when card is steady and clear…
        </div>
      )}

      {status === 'countdown' && (
        <div className="flex items-center justify-center gap-2 text-sm font-black text-green-500 uppercase tracking-widest">
          <CheckCircle2 className="w-5 h-5" />
          Auto-capturing in {countdown}…
        </div>
      )}

      {status === 'preview' && (
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 h-12 rounded-2xl font-bold gap-2"
            onClick={retake}
            disabled={disabled}
          >
            <RefreshCw className="w-4 h-4" /> Retake
          </Button>
          <Button
            className="flex-1 h-12 rounded-2xl font-black bg-primary text-white shadow-lg shadow-primary/20 uppercase tracking-wide"
            onClick={confirmCapture}
            disabled={disabled}
          >
            Use This Photo
          </Button>
        </div>
      )}
    </div>
  )
}
