import { Camera, Info, Loader2, Trash2, Upload } from 'lucide-react'
import { ChangeEvent, useState } from 'react'
import { toast } from 'react-hot-toast'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
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
          <h3 className="text-3xl font-extrabold text-foreground mb-2 tracking-tight">
            Add a profile photo
          </h3>
          <p className="text-lg text-muted-foreground max-w-md mx-auto leading-relaxed font-medium">
            A great photo helps travelers get to know you before booking.
          </p>
        </div>

        <div className="relative group">
          <div className="relative">
            <Avatar className="w-48 h-48 border-[6px] border-background shadow-2xl ring-1 ring-border/[0.05] transition-all group-hover:scale-[1.02]">
              <AvatarImage src={selectedImage || ''} alt="Profile Picture" />
              <AvatarFallback className="bg-primary/5 text-primary text-4xl">
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
            <h4 className="text-xl font-extrabold text-foreground tracking-tight">
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
          <Card className="bg-info/10 border-info/20 rounded-[32px] p-8 flex gap-6 transition-all hover:bg-info/15 group">
            <div className="w-14 h-14 bg-background rounded-2xl shadow-sm border border-info/20 flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110">
              <Info className="w-7 h-7 text-info" />
            </div>
            <div className="space-y-2">
              <p className="font-black text-info uppercase tracking-widest text-xs italic">
                Why this matters
              </p>
              <p className="text-sm text-info/90 leading-relaxed font-medium">
                A clear, professional profile picture significantly increases booking requests by
                appearing more trustworthy to travelers. Profiles with real photos receive up to 3x
                more interest.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
