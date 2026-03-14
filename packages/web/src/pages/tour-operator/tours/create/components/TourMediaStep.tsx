import { AlertTriangle, Image as ImageIcon, Loader2, Star, Upload, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { toast } from 'react-hot-toast'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tour, TourMediaItem, tourService } from '@/features/tour-operator/services/tourService'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

interface TourMediaStepProps {
  data: Partial<Tour>
  onUpdate: (data: Partial<Tour>) => void
  onNext: () => void
  onBack: () => void
  tourId?: string | null
  ensureTourDraft?: () => Promise<string>
}

export function TourMediaStep({ data, onUpdate, onNext, onBack, tourId, ensureTourDraft }: TourMediaStepProps) {
  const { user } = useAuth()
  const [activeTourId, setActiveTourId] = useState<string | null>(tourId ?? null)
  const [isUploading, setIsUploading] = useState(false)
  const [isLoadingMedia, setIsLoadingMedia] = useState(false)
  const [mediaItems, setMediaItems] = useState<TourMediaItem[]>([])
  const [lastProgressAt, setLastProgressAt] = useState<number | null>(null)
  const [showStuckWarning, setShowStuckWarning] = useState(false)
  const [inlineError, setInlineError] = useState<string | null>(null)
  const [skipConfirmed, setSkipConfirmed] = useState(false)

  const hasImages = mediaItems.length > 0
  const canProceed = !isUploading && (hasImages || skipConfirmed)

  const syncParentImages = useCallback(
    (items: TourMediaItem[]) => {
      const ordered = [...items]
        .sort((a, b) => Number(b.is_main) - Number(a.is_main) || a.sort_order - b.sort_order)
        .map((item) => item.url)

      onUpdate({ images: ordered })
      setSkipConfirmed(false)
    },
    [onUpdate],
  )

  const loadMedia = useCallback(async (targetTourId: string) => {
    setIsLoadingMedia(true)
    setInlineError(null)
    try {
      const media = await tourService.listTourMedia(targetTourId)
      setMediaItems(media)
      if (media.length > 0) {
        syncParentImages(media)
      }
    } catch (error: any) {
      console.error('Failed to load tour media:', error)
      setInlineError(error?.message || 'Failed to load uploaded media')
    } finally {
      setIsLoadingMedia(false)
    }
  }, [syncParentImages])

  useEffect(() => {
    if (tourId) setActiveTourId(tourId)
  }, [tourId])

  useEffect(() => {
    if (!activeTourId) {
      setMediaItems([])
      return
    }
    loadMedia(activeTourId)
  }, [activeTourId, loadMedia])

  useEffect(() => {
    if (!isUploading) return

    const intervalId = window.setInterval(() => {
      if (!lastProgressAt) return
      if (Date.now() - lastProgressAt >= 12000) {
        setShowStuckWarning(true)
      }
    }, 1500)

    return () => window.clearInterval(intervalId)
  }, [isUploading, lastProgressAt])

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!user?.id || isUploading) return
      if (acceptedFiles.length === 0) return

      setInlineError(null)
      setShowStuckWarning(false)
      setIsUploading(true)
      setLastProgressAt(Date.now())
      try {
        const draftTourId = activeTourId ?? (ensureTourDraft ? await ensureTourDraft() : null)
        if (!draftTourId) {
          throw new Error('Please complete basic details first so we can save your media')
        }
        setActiveTourId(draftTourId)

        let currentMedia = await tourService.listTourMedia(draftTourId)
        for (const file of acceptedFiles) {
          const hasMain = currentMedia.some((item) => item.is_main)
          await tourService.uploadTourMediaAtomic({
            tourId: draftTourId,
            operatorId: user.id,
            file,
            sortOrder: currentMedia.length,
            makeMain: !hasMain,
            timeoutMs: 15000,
          })
          setLastProgressAt(Date.now())
          currentMedia = await tourService.listTourMedia(draftTourId)
        }

        setMediaItems(currentMedia)
        syncParentImages(currentMedia)
        toast.success(`Uploaded ${acceptedFiles.length} image(s) successfully`)
      } catch (error: any) {
        console.error('Upload failed:', error)
        const message = String(error?.message || 'Failed to upload images')
        const isTimeout = message.toLowerCase().includes('timeout')
        setInlineError(isTimeout ? 'Upload seems stuck. Retry?' : message)
        if (isTimeout) {
          setShowStuckWarning(true)
        }
        toast.error(isTimeout ? 'Upload seems stuck. Please retry.' : message)
      } finally {
        setIsUploading(false)
        setLastProgressAt(null)
      }
    },
    [user?.id, isUploading, activeTourId, ensureTourDraft, syncParentImages],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled: isUploading,
    accept: {
      'image/jpeg': [],
      'image/png': [],
      'image/webp': [],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  })

  const removeImage = async (mediaId: string) => {
    if (!activeTourId || !user?.id) return

    setInlineError(null)
    try {
      await tourService.removeTourMedia(activeTourId, mediaId, user.id)
      const fresh = await tourService.listTourMedia(activeTourId)
      setMediaItems(fresh)
      syncParentImages(fresh)
      toast.success('Image removed')
    } catch (error: any) {
      console.error('Failed to remove media:', error)
      const message = error?.message || 'Failed to remove image'
      setInlineError(message)
      toast.error(message)
    }
  }

  const setAsCoverImage = async (mediaId: string) => {
    if (!activeTourId || !user?.id) return

    setInlineError(null)
    try {
      await tourService.setTourMediaMain(activeTourId, mediaId, user.id)
      const fresh = await tourService.listTourMedia(activeTourId)
      setMediaItems(fresh)
      syncParentImages(fresh)
      toast.success('Cover image updated')
    } catch (error: any) {
      console.error('Failed to set cover image:', error)
      const message = error?.message || 'Failed to set cover image'
      setInlineError(message)
      toast.error(message)
    }
  }

  const orderedMedia = useMemo(
    () =>
      [...mediaItems].sort(
        (a, b) => Number(b.is_main) - Number(a.is_main) || a.sort_order - b.sort_order,
      ),
    [mediaItems],
  )

  const handleSkip = () => {
    const confirmed = window.confirm('Skip images for now? You can add them later, but submission will still require at least one image.')
    if (!confirmed) return
    setSkipConfirmed(true)
  }

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-none shadow-xl rounded-2xl overflow-hidden relative">
        <div className="absolute inset-0 bg-background/10 backdrop-blur-sm" />
        <div className="relative flex items-center gap-4">
          <div className="w-12 h-12 bg-background/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            <ImageIcon className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Tour Media</h2>
            <p className="text-primary-foreground/80 text-sm">
              Upload gallery photos and choose one clear Cover Image. You can change it anytime.
            </p>
          </div>
        </div>
      </Card>

      {(inlineError || showStuckWarning) && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50/80 px-4 py-3 text-sm text-amber-900">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">{inlineError || 'Upload seems stuck. Retry?'}</p>
              {showStuckWarning && (
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8"
                    onClick={() => {
                      setShowStuckWarning(false)
                      setInlineError(null)
                    }}
                  >
                    Retry
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8"
                    onClick={() => setShowStuckWarning(false)}
                  >
                    Keep waiting
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300',
          'bg-background/70 hover:bg-background/85 backdrop-blur-sm',
          isDragActive
            ? 'border-primary/50 bg-primary/10 ring-4 ring-primary/20 shadow-lg'
            : 'border-border/70 hover:border-primary/40',
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center shadow-inner">
            {isUploading ? (
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
            ) : (
              <Upload className="w-10 h-10 text-primary" />
            )}
          </div>
          <div>
            <p className="text-xl font-bold text-foreground">
              {isUploading ? 'Uploading High-Quality Media...' : 'Drop your tour photos here'}
            </p>
            <p className="text-sm text-muted-foreground mt-2 font-medium">
              Support for PNG, JPG and WebP (max. 10MB each)
            </p>
          </div>
          {!isUploading && (
            <Button variant="outline" className="mt-2 font-bold border-input">
              Select Files
            </Button>
          )}
        </div>
      </div>

      {/* Image Grid */}
      {(isLoadingMedia || orderedMedia.length > 0) && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {isLoadingMedia && (
            <div className="col-span-full text-sm text-muted-foreground py-2">Loading media...</div>
          )}
          {orderedMedia.map((item, index) => (
            <div
              key={item.id}
              className="relative group aspect-square rounded-2xl overflow-hidden border border-border shadow-sm"
            >
              {item.is_main && (
                <div className="absolute top-2 left-2 z-10 px-2 py-1 rounded-full text-[10px] font-bold bg-primary text-primary-foreground">
                  Cover Image
                </div>
              )}
              <img
                src={item.url}
                alt={`Tour image ${index + 1}`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-x-0 bottom-0 bg-black/45 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex items-end justify-center backdrop-blur-[2px] p-2">
                <div className="flex items-center gap-2">
                  {item.is_main ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled
                      className="h-8 px-2 text-xs"
                    >
                      <Star className="w-3.5 h-3.5 mr-1" />
                      Cover Image
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setAsCoverImage(item.id)}
                      className="h-8 px-2 text-xs"
                    >
                      <Star className="w-3.5 h-3.5 mr-1" />
                      Set as cover
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => removeImage(item.id)}
                    className="rounded-full shadow-xl h-8 w-8"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {orderedMedia.length === 0 && !isUploading && !isLoadingMedia && (
        <div className="text-center py-10 bg-muted/30 rounded-2xl border border-border">
          <ImageIcon size={48} className="text-muted mx-auto mb-4" />
          <p className="text-muted-foreground font-medium">
            No images uploaded yet. Add at least one image, or confirm skip for now.
          </p>
        </div>
      )}

      <div className="flex justify-between pt-6 border-t border-border">
        <Button
          variant="outline"
          onClick={onBack}
          size="lg"
          className="px-8 border-input flex-1 sm:flex-none"
        >
          Back
        </Button>

        <div className="flex items-center gap-2">
          {!hasImages && (
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={handleSkip}
              disabled={isUploading}
              className="px-6 border-input"
            >
              Confirm Skip
            </Button>
          )}
          <Button
            onClick={onNext}
            size="lg"
            className="px-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold flex-1 sm:flex-none shadow-lg shadow-primary/25"
            disabled={!canProceed}
          >
            Next Step
          </Button>
        </div>
      </div>
    </div>
  )
}
