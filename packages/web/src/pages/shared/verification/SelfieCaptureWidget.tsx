/**
 * SelfieCaptureWidget — front camera with blink liveness detection.
 * Flow: idle → requesting → liveness (blink ×2) → countdown → preview
 * Liveness: tracks eye-region luminance dips (no ML lib required).
 */
import { Camera, CheckCircle2, Eye, FlipHorizontal, Loader2, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SelfieCaptureWidgetProps {
  onCapture: (file: File) => void
  disabled?: boolean
}

type CameraState = 'idle' | 'requesting' | 'liveness' | 'countdown' | 'preview' | 'denied'

function regionLuma(data: Uint8ClampedArray, w: number, x0: number, y0: number, rw: number, rh: number): number {
  let sum = 0, n = 0
  for (let y = y0; y < y0 + rh; y++) {
    for (let x = x0; x < x0 + rw; x++) {
      const i = (y * w + x) * 4
      sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
      n++
    }
  }
  return n > 0 ? sum / n : 0
}

export function SelfieCaptureWidget({ onCapture, disabled }: SelfieCaptureWidgetProps) {
  const videoRef     = useRef<HTMLVideoElement>(null)
  const canvasRef    = useRef<HTMLCanvasElement>(null)
  const streamRef    = useRef<MediaStream | null>(null)
  const analyzeRef   = useRef<ReturnType<typeof setInterval> | null>(null)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const baseLumaRef    = useRef<number | null>(null)
  const blinkCountRef  = useRef(0)
  const inBlinkRef     = useRef(false)
  const blinkFramesRef = useRef(0)

  const [cameraState, setCameraState] = useState<CameraState>('idle')
  const [previewSrc, setPreviewSrc]   = useState<string | null>(null)
  const [isMirrored, setIsMirrored]   = useState(true)
  const [blinkCount, setBlinkCount]   = useState(0)
  const [countdown, setCountdown]     = useState(2)
  const [hint, setHint]               = useState('Blink twice to confirm you are live')

  useEffect(() => () => stopAll(), [])

  const stopAll = () => {
    if (analyzeRef.current)   clearInterval(analyzeRef.current)
    if (countdownRef.current) clearInterval(countdownRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }

  const startCamera = useCallback(async () => {
    setCameraState('requesting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play() }
      blinkCountRef.current = 0; inBlinkRef.current = false
      blinkFramesRef.current = 0; baseLumaRef.current = null
      setBlinkCount(0)
      setHint('Blink twice to confirm you are live')
      setCameraState('liveness')
      startLivenessLoop()
    } catch { setCameraState('denied') }
  }, [])

  const startLivenessLoop = () => {
    analyzeRef.current = setInterval(() => {
      const video = videoRef.current, canvas = canvasRef.current
      if (!video || !canvas || video.readyState < 2) return
      const AW = 160, AH = 90
      canvas.width = AW; canvas.height = AH
      const ctx = canvas.getContext('2d')!
      ctx.save(); ctx.scale(-1, 1); ctx.drawImage(video, -AW, 0, AW, AH); ctx.restore()
      const { data } = ctx.getImageData(0, 0, AW, AH)
      // Eye ROI: horizontal centre, upper-third of frame
      const luma = regionLuma(data, AW, Math.floor(AW * 0.35), Math.floor(AH * 0.28), Math.floor(AW * 0.30), Math.floor(AH * 0.18))
      if (baseLumaRef.current === null) { baseLumaRef.current = luma }
      else { baseLumaRef.current = baseLumaRef.current * 0.95 + luma * 0.05 }
      const drop = (baseLumaRef.current - luma) / baseLumaRef.current
      if (!inBlinkRef.current) {
        if (drop >= 0.14) { inBlinkRef.current = true; blinkFramesRef.current = 1 }
      } else {
        blinkFramesRef.current++
        if (drop < 0.06) {
          if (blinkFramesRef.current <= 5) {
            blinkCountRef.current++
            setBlinkCount(blinkCountRef.current)
            if (blinkCountRef.current >= 2) {
              clearInterval(analyzeRef.current!)
              setHint('Liveness confirmed! Auto-capturing…')
              setTimeout(() => {
                setCountdown(2); let c = 2
                countdownRef.current = setInterval(() => {
                  c--; setCountdown(c)
                  if (c <= 0) { clearInterval(countdownRef.current!); captureFrame() }
                }, 1000)
                setCameraState('countdown')
              }, 300)
              return
            }
            setHint(blinkCountRef.current === 1 ? '✓ One blink! Blink once more…' : 'Blink twice to confirm you are live')
          }
          inBlinkRef.current = false; blinkFramesRef.current = 0
        } else if (blinkFramesRef.current > 5) { inBlinkRef.current = false; blinkFramesRef.current = 0 }
      }
    }, 250)
  }

  const captureFrame = () => {
    const video = videoRef.current, canvas = canvasRef.current
    if (!video || !canvas) return
    canvas.width = video.videoWidth; canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')!
    if (isMirrored) { ctx.translate(canvas.width, 0); ctx.scale(-1, 1) }
    ctx.drawImage(video, 0, 0)
    setPreviewSrc(canvas.toDataURL('image/jpeg', 0.95))
    stopAll(); setCameraState('preview')
  }

  const retake = () => { setPreviewSrc(null); setBlinkCount(0); startCamera() }

  const confirmPhoto = () => {
    canvasRef.current?.toBlob(blob => {
      if (!blob) return
      onCapture(new File([blob], `selfie_${Date.now()}.jpg`, { type: 'image/jpeg' }))
    }, 'image/jpeg', 0.95)
  }

  const isLive = cameraState === 'liveness' || cameraState === 'countdown'

  return (
    <div className="space-y-4">
      <div className="relative rounded-3xl overflow-hidden bg-black aspect-video border border-white/10">
        <video
          ref={videoRef}
          className={cn('w-full h-full object-cover', !isLive && 'hidden', isMirrored && 'scale-x-[-1]')}
          playsInline muted
        />
        {cameraState === 'preview' && previewSrc && (
          <img src={previewSrc} alt="Selfie preview" className="w-full h-full object-cover" />
        )}
        {cameraState === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-muted/80">
            <div className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Camera className="w-10 h-10 text-primary" />
            </div>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Camera off</p>
          </div>
        )}
        {cameraState === 'requesting' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-muted/80">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Requesting camera…</p>
          </div>
        )}
        {cameraState === 'denied' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-destructive/10 px-6 text-center">
            <Camera className="w-10 h-10 text-destructive" />
            <p className="font-bold text-destructive text-sm">Camera permission denied</p>
            <p className="text-xs text-muted-foreground">Allow camera access in browser settings and try again.</p>
          </div>
        )}
        {/* Face oval + dim surround */}
        {isLive && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className={cn(
              'w-44 h-56 rounded-full border-4 transition-all duration-300',
              cameraState === 'countdown' ? 'border-green-400' : blinkCount >= 1 ? 'border-amber-400' : 'border-white/70',
              'shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]',
            )} />
          </div>
        )}
        {/* Blink progress badge */}
        {cameraState === 'liveness' && (
          <div className="absolute bottom-4 inset-x-0 flex justify-center">
            <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-2xl px-4 py-2">
              <Eye className="w-4 h-4 text-white/70" />
              <span className="text-xs font-bold text-white">
                {blinkCount >= 2 ? '✓ Liveness confirmed' : `Blink ${2 - blinkCount} more time${2 - blinkCount !== 1 ? 's' : ''}`}
              </span>
              <div className="flex gap-1 ml-1">
                <div className={cn('w-2 h-2 rounded-full', blinkCount >= 1 ? 'bg-green-400' : 'bg-white/20')} />
                <div className={cn('w-2 h-2 rounded-full', blinkCount >= 2 ? 'bg-green-400' : 'bg-white/20')} />
              </div>
            </div>
          </div>
        )}
        {/* Countdown */}
        {cameraState === 'countdown' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-7xl font-black text-white drop-shadow-2xl">{countdown}</span>
          </div>
        )}
        {/* Mirror toggle */}
        {isLive && (
          <button onClick={() => setIsMirrored(m => !m)}
            className="absolute top-3 right-3 w-9 h-9 rounded-xl bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition">
            <FlipHorizontal className="w-4 h-4" />
          </button>
        )}
        {/* Preview badge */}
        {cameraState === 'preview' && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm rounded-xl px-3 py-1.5">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <span className="text-xs font-bold text-white">Liveness Passed</span>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {(cameraState === 'idle' || cameraState === 'denied') && (
        <Button className="w-full h-12 rounded-2xl font-black uppercase tracking-widest bg-primary text-white shadow-lg shadow-primary/20 gap-2"
          onClick={startCamera} disabled={disabled}>
          <Camera className="w-5 h-5" /> Open Camera
        </Button>
      )}
      {cameraState === 'liveness' && (
        <p className="text-center text-sm font-bold text-muted-foreground">{hint}</p>
      )}
      {cameraState === 'countdown' && (
        <div className="flex items-center justify-center gap-2 text-sm font-black text-green-500 uppercase tracking-widest">
          <CheckCircle2 className="w-5 h-5" /> Auto-capturing in {countdown}…
        </div>
      )}
      {cameraState === 'preview' && (
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1 h-12 rounded-2xl font-bold gap-2" onClick={retake} disabled={disabled}>
            <RefreshCw className="w-4 h-4" /> Retake
          </Button>
          <Button className="flex-1 h-12 rounded-2xl font-black bg-primary text-white shadow-lg shadow-primary/20 uppercase tracking-wide"
            onClick={confirmPhoto} disabled={disabled}>
            Use This Selfie
          </Button>
        </div>
      )}
    </div>
  )
}
