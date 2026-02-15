import { Building, Loader2, Upload } from 'lucide-react'
import { ChangeEvent, useState } from 'react'
import { toast } from 'react-hot-toast'

import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { tourOperatorService } from '@/features/tour-operator/services/tourOperatorService'
import { useAuth } from '@/hooks/useAuth'

interface StepProps {
  onNext: () => void
  onUpdate: (data: any) => void
  data: any
}

export function BusinessInfoStep({ onUpdate, data }: StepProps) {
  const { user } = useAuth()
  const [isUploading, setIsUploading] = useState(false)
  const [formData, setFormData] = useState(
    data.businessInfo || {
      businessName: '',
      registrationNumber: '',
      yearsInBusiness: '',
      teamSize: '',
      businessDescription: '',
      companyLogo: null as string | null,
    },
  )

  const handleInputChange = (field: string, value: string) => {
    const newData = { ...formData, [field]: value }
    setFormData(newData)
    onUpdate({ businessInfo: newData })
  }

  const handleLogoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user?.id) return

    setIsUploading(true)
    try {
      const publicUrl = await tourOperatorService.uploadAsset(user.id, file, 'logo')
      handleInputChange('companyLogo', publicUrl)
      toast.success('Logo uploaded!')
    } catch (error) {
      console.error('Logo upload error:', error)
      toast.error('Failed to upload logo')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">
          Business Details
        </h3>
        <p className="text-lg text-gray-500 leading-relaxed font-medium">
          Tell travelers about your tour business operation.
        </p>
      </div>

      <Card className="p-8 space-y-8 border-gray-100 shadow-sm rounded-[32px] bg-white ring-1 ring-black/[0.02]">
        <div className="space-y-4">
          <Label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">
            Company Logo
          </Label>
          <div className="flex items-center gap-6 p-6 border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/50 transition-colors hover:bg-gray-50/80">
            <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center overflow-hidden border border-gray-100 flex-shrink-0 shadow-sm">
              {isUploading ? (
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              ) : formData.companyLogo ? (
                <img
                  src={formData.companyLogo}
                  alt="Business Logo"
                  className="w-full h-full object-contain"
                />
              ) : (
                <Building className="w-8 h-8 text-gray-200" aria-hidden="true" />
              )}
            </div>
            <div className="flex-1 space-y-3">
              <input
                type="file"
                id="logo-upload"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
                disabled={isUploading}
                aria-label="Upload Company Logo"
              />
              <label
                htmlFor="logo-upload"
                className={`inline-flex items-center gap-2 px-5 py-2.5 bg-primary/5 hover:bg-primary-hover hover:text-white text-primary rounded-xl cursor-pointer transition-all font-bold text-sm border border-primary/20 ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" aria-hidden="true" />
                )}
                {isUploading
                  ? 'Uploading...'
                  : formData.companyLogo
                    ? 'Change Logo'
                    : 'Upload Logo'}
              </label>
              <p className="text-xs text-gray-400 font-medium">
                PNG or SVG (max. 2MB). Squarish format looks best.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Label
            htmlFor="businessName"
            className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1"
          >
            Registered Business Name *
          </Label>
          <Input
            id="businessName"
            value={formData.businessName}
            onChange={(e) => handleInputChange('businessName', e.target.value)}
            placeholder="Official company name"
            className="rounded-2xl border-gray-200 py-7 focus-visible:ring-primary/20 focus-visible:border-primary/50 transition-all text-base placeholder:text-gray-300"
          />
        </div>

        <div className="space-y-3">
          <Label
            htmlFor="registrationNumber"
            className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1"
          >
            Business Registration Number
          </Label>
          <Input
            id="registrationNumber"
            value={formData.registrationNumber}
            onChange={(e) => handleInputChange('registrationNumber', e.target.value)}
            placeholder="e.g. 12345-67890"
            className="rounded-2xl border-gray-200 py-7 focus-visible:ring-primary/20 focus-visible:border-primary/50 transition-all text-base placeholder:text-gray-300"
          />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <Label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">
              Experience
            </Label>
            <Select
              value={formData.yearsInBusiness}
              onValueChange={(v: string) => handleInputChange('yearsInBusiness', v)}
            >
              <SelectTrigger className="rounded-2xl border-gray-200 py-7 focus:ring-primary/20 focus:border-primary/50 transition-all font-medium text-base">
                <SelectValue placeholder="Years in bus..." />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-gray-100 shadow-xl overflow-hidden p-1">
                <SelectItem value="lt-1" className="rounded-xl px-4 py-2.5">
                  New Operation
                </SelectItem>
                <SelectItem value="1-3" className="rounded-xl px-4 py-2.5">
                  1-3 years
                </SelectItem>
                <SelectItem value="3-5" className="rounded-xl px-4 py-2.5">
                  3-5 years
                </SelectItem>
                <SelectItem value="5-plus" className="rounded-xl px-4 py-2.5">
                  5+ years
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-3">
            <Label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">
              Team Size
            </Label>
            <Select
              value={formData.teamSize}
              onValueChange={(v: string) => handleInputChange('teamSize', v)}
            >
              <SelectTrigger className="rounded-2xl border-gray-200 py-7 focus:ring-primary/20 focus:border-primary/50 transition-all font-medium text-base">
                <SelectValue placeholder="Members..." />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-gray-100 shadow-xl overflow-hidden p-1">
                <SelectItem value="1" className="rounded-xl px-4 py-2.5">
                  Solo Operator
                </SelectItem>
                <SelectItem value="2-5" className="rounded-xl px-4 py-2.5">
                  2-5 staff
                </SelectItem>
                <SelectItem value="6-15" className="rounded-xl px-4 py-2.5">
                  6-15 staff
                </SelectItem>
                <SelectItem value="15-plus" className="rounded-xl px-4 py-2.5">
                  15+ staff
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-3">
          <Label
            htmlFor="description"
            className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1"
          >
            Business Description
          </Label>
          <Textarea
            id="description"
            rows={4}
            value={formData.businessDescription}
            onChange={(e) => handleInputChange('businessDescription', e.target.value)}
            placeholder="Describe your specialties and experience..."
            className="rounded-2xl border-gray-200 min-h-[140px] focus-visible:ring-primary/20 focus-visible:border-primary/50 transition-all text-base placeholder:text-gray-300 p-4"
          />
        </div>
      </Card>
    </div>
  )
}
