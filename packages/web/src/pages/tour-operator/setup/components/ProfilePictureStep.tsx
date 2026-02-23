import { Camera, Info, Loader2, Trash2, Upload } from 'lucide-react'
import { ChangeEvent, useState } from 'react'
import { toast } from 'react-hot-toast'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { tourOperatorService } from '@/features/tour-operator/services/tourOperatorService'
import { useAuth } from '@/hooks/useAuth'

interface StepProps {
  onNext: () => void
  onUpdate: (data: any) => void
  data: any
}

export function ProfilePictureStep({ onUpdate, data }: StepProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(data.profilePicture || null)
  const [isUploading, setIsUploading] = useState(false)
  const { user } = useAuth()

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user?.id) return

    setIsUploading(true)
    try {
      const publicUrl = await tourOperatorService.uploadAsset(user.id, file, 'profile')
      setSelectedImage(publicUrl)
      onUpdate({ profilePicture: publicUrl })
      toast.success('Photo uploaded!')
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload photo')
    } finally {
      setIsUploading(false)
    }
  }

  const removeImage = () => {
    setSelectedImage(null)
    onUpdate({ profilePicture: null })
  }

  return (
    <div className="space-y-12">
      <div className="space-y-10 flex flex-col items-center">
        <div className="text-center">
          <h3 className="text-2xl font-black text-foreground mb-1.5 tracking-tight">
            Add a profile photo
          </h3>
          <p className="text-muted-foreground max-w-md mx-auto leading-relaxed font-medium">
            A great photo helps travelers get to know you before booking.
          </p>
        </div>

        <div className="relative group">
          <div className="relative">
            <Avatar className="w-48 h-48 border-4 border-border/50 shadow-2xl ring-4 ring-primary/20 transition-all group-hover:scale-[1.02]">
              <AvatarImage src={selectedImage || ''} alt="Profile Picture" />
              <AvatarFallback className="bg-muted text-muted-foreground/50 text-4xl">
                {isUploading ? (
                  <Loader2 className="w-12 h-12 animate-spin opacity-40" />
                ) : (
                  <Camera className="w-20 h-20 opacity-30" aria-hidden="true" />
                )}
              </AvatarFallback>
            </Avatar>

            {selectedImage && !isUploading && (
              <button
                onClick={removeImage}
                className="absolute -top-3 -right-3 bg-background text-destructive rounded-2xl p-3 shadow-2xl border border-destructive/20 transition-all hover:scale-110 active:scale-90 z-10 hover:bg-destructive/10"
                aria-label="Remove image"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}

            <input
              type="file"
              id="profile-upload"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              disabled={isUploading}
              aria-label="Upload Profile Photo"
            />
            <label
              htmlFor="profile-upload"
              className={`absolute bottom-2 right-2 w-12 h-12 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center cursor-pointer hover:bg-primary-hover transition-all shadow-xl hover:scale-110 active:scale-95 border-[3px] border-background ${isUploading ? 'opacity-50 cursor-not-allowed shadow-none' : ''}`}
            >
              {isUploading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Upload className="w-5 h-5" aria-hidden="true" />
              )}
            </label>
          </div>
        </div>

        <div className="text-center space-y-4 max-w-sm">
          <div className="space-y-1">
            <h4 className="text-base font-bold text-foreground tracking-tight">
              {isUploading
                ? 'Uploading...'
                : selectedImage
                  ? 'Looking Great!'
                  : 'Professionalism matters'}
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed font-medium">
              High-quality square photos (JPG or PNG) work best. Max size 5MB. Travelers prefer see
              your friendly face!
            </p>
          </div>

          {!selectedImage && !isUploading && (
            <div className="pt-4">
              <Button
                variant="ghost"
                asChild
                className="text-primary font-bold hover:bg-primary/5 rounded-2xl px-6"
              >
                <label htmlFor="profile-upload" className="cursor-pointer">
                  Choose from files
                </label>
              </Button>
            </div>
          )}
          {/* Informational Alert */}
          <div className="bg-sky-500/10 border border-sky-500/20 rounded-2xl p-6 flex gap-5 group">
            <div className="w-12 h-12 bg-sky-500/20 border border-sky-500/30 rounded-xl flex items-center justify-center flex-shrink-0">
              <Info className="w-6 h-6 text-sky-600" />
            </div>
            <div className="space-y-1.5 text-left">
              <p className="font-bold text-sky-700 uppercase tracking-widest text-xs">
                Why this matters
              </p>
              <p className="text-sm text-sky-700/70 leading-relaxed font-medium">
                A clear, professional profile picture significantly increases booking requests by
                appearing more trustworthy to travelers. Profiles with real photos receive up to 3x
                more interest.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
