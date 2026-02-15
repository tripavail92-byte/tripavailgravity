import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tour, tourService } from '@/features/tour-operator/services/tourService'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'react-hot-toast'
import { cn } from '@/lib/utils'

interface TourMediaStepProps {
  data: Partial<Tour>
  onUpdate: (data: Partial<Tour>) => void
  onNext: () => void
  onBack: () => void
}

export function TourMediaStep({ data, onUpdate, onNext, onBack }: TourMediaStepProps) {
  const { user } = useAuth()
  const [isUploading, setIsUploading] = useState(false)
  const [images, setImages] = useState<string[]>(data.images || [])

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!user?.id || isUploading) return

      setIsUploading(true)
      try {
        const urls = await tourService.uploadTourImages(user.id, acceptedFiles)
        setImages((prev) => {
          const updated = [...prev, ...urls]
          onUpdate({ images: updated })
          return updated
        })
        toast.success(`Successfully uploaded ${urls.length} image(s)`)
      } catch (error: any) {
        console.error('Upload failed:', error)
        const message = error?.message || 'Failed to upload images'
        toast.error(message)
      } finally {
        setIsUploading(false)
      }
    },
    [user?.id, isUploading, onUpdate],
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

  const removeImage = (indexToRemove: number) => {
    const newImages = images.filter((_, index) => index !== indexToRemove)
    setImages(newImages)
    onUpdate({ images: newImages })
  }

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-r from-primary to-primary/80 text-white border-none shadow-md">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            <ImageIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Tour Media</h2>
            <p className="text-white/80 text-sm">
              Showcase your tour with high-quality photos and videos.
            </p>
          </div>
        </div>
      </Card>

      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all bg-gray-50/50 hover:bg-white',
          isDragActive
            ? 'border-primary bg-primary/5 ring-4 ring-primary/10'
            : 'border-gray-200 hover:border-primary/40',
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
            <p className="text-xl font-bold text-gray-900">
              {isUploading ? 'Uploading High-Quality Media...' : 'Drop your tour photos here'}
            </p>
            <p className="text-sm text-gray-500 mt-2 font-medium">
              Support for PNG, JPG and WebP (max. 10MB each)
            </p>
          </div>
          {!isUploading && (
            <Button variant="outline" className="mt-2 font-bold border-gray-200">
              Select Files
            </Button>
          )}
        </div>
      </div>

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {images.map((url, index) => (
            <div
              key={index}
              className="relative group aspect-square rounded-2xl overflow-hidden border border-gray-100 shadow-sm"
            >
              <img
                src={url}
                alt={`Tour image ${index + 1}`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => removeImage(index)}
                  className="rounded-full shadow-xl"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {images.length === 0 && !isUploading && (
        <div className="text-center py-10 bg-gray-50/30 rounded-2xl border border-gray-100">
          <ImageIcon size={48} className="text-gray-200 mx-auto mb-4" />
          <p className="text-gray-400 font-medium">
            No images uploaded yet. High-quality visuals increase bookings!
          </p>
        </div>
      )}

      <div className="flex justify-between pt-6 border-t border-gray-100">
        <Button
          variant="outline"
          onClick={onBack}
          size="lg"
          className="px-8 border-gray-200 flex-1 sm:flex-none"
        >
          Back
        </Button>
        <Button
          onClick={onNext}
          size="lg"
          className="px-12 bg-primary hover:bg-primary/90 text-white font-bold flex-1 sm:flex-none shadow-lg shadow-primary/20"
          disabled={isUploading || images.length === 0}
        >
          Next Step
        </Button>
      </div>
    </div>
  )
}
