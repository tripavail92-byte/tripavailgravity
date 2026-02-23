import { Camera, FlipHorizontal, Loader2, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SelfieCaptureWidgetProps {
  onCapture: (file: File) => void
  disabled?: boolean
}

type CameraState = 'idle' | 'requesting' | 'live' | 'preview' | 'denied'

export function SelfieCaptureWidget({ onCapture, disabled }: SelfieCaptureWidgetProps) {
  const videoRef  = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [cameraState, setCameraState] = useState<CameraState>('idle')
  const [previewSrc, setPreviewSrc]   = useState<string | null>(null)
  const [isMirrored, setIsMirrored]   = useState(true)

  // Stop stream on unmount
  useEffect(() => {
    return () => stopStream()
  }, [])

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
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
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setCameraState('live')
    } catch (err: any) {
      console.warn('Camera access denied:', err)
      setCameraState('denied')
    }
  }, [])

  const capturePhoto = () => {
    const video  = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    canvas.width  = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')!
    if (isMirrored) {
      ctx.translate(canvas.width, 0)
      ctx.scale(-1, 1)
    }
    ctx.drawImage(video, 0, 0)
    setPreviewSrc(canvas.toDataURL('image/jpeg', 0.95))
    stopStream()
    setCameraState('preview')
  }

  const retake = () => {
    setPreviewSrc(null)
    startCamera()
  }

  const confirmPhoto = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.toBlob(
      (blob) => {
        if (!blob) return
        const file = new File([blob], `selfie_${Date.now()}.jpg`, { type: 'image/jpeg' })
        onCapture(file)
      },
      'image/jpeg',
      0.95,
    )
  }

  return (
    <div className="space-y-4">
      {/* ── CAMERA VIEWPORT ── */}
      <div className="relative rounded-3xl overflow-hidden bg-black aspect-video border-2 border-dashed border-border">
        {/* Live feed */}
        <video
          ref={videoRef}
          className={cn(
            'w-full h-full object-cover',
            cameraState !== 'live' && 'hidden',
            isMirrored && 'scale-x-[-1]',
          )}
          playsInline
          muted
        />

        {/* Preview captured photo */}
        {cameraState === 'preview' && previewSrc && (
          <img src={previewSrc} alt="Selfie preview" className="w-full h-full object-cover" />
        )}

        {/* Idle splash */}
        {cameraState === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-muted/80">
            <div className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Camera className="w-10 h-10 text-primary" />
            </div>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
              Camera off
            </p>
          </div>
        )}

        {/* Requesting */}
        {cameraState === 'requesting' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-muted/80">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
              Requesting camera…
            </p>
          </div>
        )}

        {/* Denied */}
        {cameraState === 'denied' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-destructive/10 px-6 text-center">
            <Camera className="w-10 h-10 text-destructive" />
            <p className="font-bold text-destructive text-sm">Camera permission denied</p>
            <p className="text-xs text-muted-foreground">
              Go to your browser settings, allow camera access for this site, then try again.
            </p>
          </div>
        )}

        {/* Face-oval guide overlay when live */}
        {cameraState === 'live' && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-44 h-56 rounded-full border-4 border-primary/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
          </div>
        )}

        {/* Mirror toggle button */}
        {cameraState === 'live' && (
          <button
            onClick={() => setIsMirrored((m) => !m)}
            className="absolute top-3 right-3 w-9 h-9 rounded-xl bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition"
            title="Flip mirror"
          >
            <FlipHorizontal className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* ── CONTROLS ── */}
      <div className="space-y-3">
        {/* Idle / Denied → Start camera */}
        {(cameraState === 'idle' || cameraState === 'denied') && (
          <Button
            className="w-full h-12 rounded-2xl font-black uppercase tracking-widest bg-primary text-white shadow-lg shadow-primary/20 gap-2"
            onClick={startCamera}
            disabled={disabled}
          >
            <Camera className="w-5 h-5" />
            Open Camera
          </Button>
        )}

        {/* Live → Capture */}
        {cameraState === 'live' && (
          <Button
            className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-lg bg-primary text-white shadow-xl shadow-primary/30 gap-2"
            onClick={capturePhoto}
            disabled={disabled}
          >
            <Camera className="w-6 h-6" />
            Take Selfie
          </Button>
        )}

        {/* Preview → Use or Retake */}
        {cameraState === 'preview' && (
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 h-12 rounded-2xl font-bold gap-2"
              onClick={retake}
              disabled={disabled}
            >
              <RefreshCw className="w-4 h-4" />
              Retake
            </Button>
            <Button
              className="flex-1 h-12 rounded-2xl font-black uppercase tracking-wide bg-primary text-white shadow-lg shadow-primary/20"
              onClick={confirmPhoto}
              disabled={disabled}
            >
              Use This Photo
            </Button>
          </div>
        )}


      </div>
    </div>
  )
}
