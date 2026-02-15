import { Image as ImageIcon, Star, Upload, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

import type { StepData } from '../CompleteHotelListingFlow'

export interface Photo {
  id: string
  url: string // base64 data URL
  fileName: string
  size: number
  uploadedAt: string
  order: number
  isCover?: boolean
}

export interface PhotoData {
  propertyPhotos: Photo[]
}

interface PhotosStepProps {
  existingData?: { photos?: PhotoData }
  onUpdate?: (data: StepData) => void
}

export function PhotosStep({ existingData, onUpdate }: PhotosStepProps) {
  const [photos, setPhotos] = useState<Photo[]>(existingData?.photos?.propertyPhotos || [])
  const [isDragging, setIsDragging] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const compressImage = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')

          // Max dimensions
          const MAX_WIDTH = 1920
          const MAX_HEIGHT = 1080

          let width = img.width
          let height = img.height

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width
              width = MAX_WIDTH
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height
              height = MAX_HEIGHT
            }
          }

          canvas.width = width
          canvas.height = height
          ctx?.drawImage(img, 0, 0, width, height)

          // Compress to 0.8 quality
          resolve(canvas.toDataURL('image/jpeg', 0.8))
        }
        img.onerror = reject
        img.src = e.target?.result as string
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const handleFiles = async (files: FileList | null) => {
    if (!files) return

    setUploadError(null)
    const fileArray = Array.from(files)

    // Validate files
    const validFiles = fileArray.filter((file) => {
      const validTypes = ['image/jpeg', 'image/png', 'image/webp']
      const maxSize = 10 * 1024 * 1024 // 10MB

      if (!validTypes.includes(file.type)) {
        setUploadError('Only JPG, PNG, and WebP images are allowed')
        return false
      }
      if (file.size > maxSize) {
        setUploadError('File size must be less than 10MB')
        return false
      }
      return true
    })

    // Convert to Photo objects with compression
    const newPhotos: Photo[] = []
    for (const file of validFiles) {
      try {
        const compressed = await compressImage(file)
        newPhotos.push({
          id: `photo_${Date.now()}_${Math.random()}`,
          url: compressed,
          fileName: file.name,
          size: file.size,
          uploadedAt: new Date().toISOString(),
          order: photos.length + newPhotos.length,
          isCover: photos.length === 0 && newPhotos.length === 0, // First photo is cover
        })
      } catch (error) {
        console.error('Error compressing image:', error)
        setUploadError('Error processing image')
      }
    }

    const updatedPhotos = [...photos, ...newPhotos]
    setPhotos(updatedPhotos)

    if (onUpdate) {
      onUpdate({ photos: { propertyPhotos: updatedPhotos } })
    }
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      handleFiles(e.dataTransfer.files)
    },
    [photos],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files)
  }

  const deletePhoto = (photoId: string) => {
    const updatedPhotos = photos.filter((p) => p.id !== photoId)
    setPhotos(updatedPhotos)
    if (onUpdate) {
      onUpdate({ photos: { propertyPhotos: updatedPhotos } })
    }
  }

  const setCoverPhoto = (photoId: string) => {
    const updatedPhotos = photos.map((p) => ({
      ...p,
      isCover: p.id === photoId,
    }))
    setPhotos(updatedPhotos)
    if (onUpdate) {
      onUpdate({ photos: { propertyPhotos: updatedPhotos } })
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Photos & Media</h2>
        <p className="text-gray-600 mt-1">Upload photos to showcase your property</p>
      </div>

      {/* Upload Zone */}
      <Card
        className={`p-8 border-2 border-dashed transition-all ${
          isDragging ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-gray-400'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Upload size={32} className="text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Drag & drop photos here</h3>
          <p className="text-gray-600 mb-4">or click to browse (JPG, PNG, WebP • Max 10MB)</p>
          <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileInput}
            className="hidden"
            id="photo-upload"
          />
          <label htmlFor="photo-upload">
            <Button
              type="button"
              className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
              onClick={() => document.getElementById('photo-upload')?.click()}
            >
              <Upload size={20} className="mr-2" />
              Select Photos
            </Button>
          </label>
          {uploadError && <p className="text-red-600 text-sm mt-2">{uploadError}</p>}
        </div>
      </Card>

      {/* Photo Count & Requirements */}
      {photos.length > 0 && (
        <div className="flex items-center justify-between px-4">
          <div className="text-sm text-gray-600">
            {photos.length} photo{photos.length !== 1 ? 's' : ''} uploaded
            {photos.length < 5 && (
              <span className="text-warning ml-2">• Minimum 5 photos required</span>
            )}
          </div>
          <p className="text-xs text-gray-500">Click the star to set cover photo</p>
        </div>
      )}

      {/* Photo Grid */}
      <AnimatePresence mode="popLayout">
        {photos.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo, index) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="relative group overflow-hidden aspect-square">
                  {/* Image */}
                  <img
                    src={photo.url}
                    alt={photo.fileName}
                    className="w-full h-full object-cover"
                  />

                  {/* Cover Badge */}
                  {photo.isCover && (
                    <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1">
                      <Star size={12} fill="white" />
                      Cover
                    </div>
                  )}

                  {/* Overlay Actions */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCoverPhoto(photo.id)}
                      className="px-3 py-1.5 bg-white text-gray-900 hover:bg-gray-100"
                    >
                      <Star size={14} />
                      Set as Cover
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deletePhoto(photo.id)}
                      className="px-3 py-1.5"
                    >
                      <X size={14} />
                      Delete
                    </Button>
                  </div>

                  {/* File Info */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                    <p className="text-white text-xs truncate">{photo.fileName}</p>
                    <p className="text-white/70 text-xs">{formatFileSize(photo.size)}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {photos.length === 0 && (
        <div className="text-center py-12">
          <ImageIcon size={48} className="text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No photos uploaded yet</p>
          <p className="text-sm text-gray-500 mt-1">Upload at least 5 photos to continue</p>
        </div>
      )}
    </div>
  )
}
