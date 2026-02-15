import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Home,
  FileText,
  Upload,
  Camera,
  Check,
  Loader2,
  ArrowRight,
  MapPin,
  Lightbulb,
} from 'lucide-react'
import { hotelManagerService } from '@/features/hotel-manager/services/hotelManagerService'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'react-hot-toast'

interface PropertyOwnershipSubFlowProps {
  onComplete: (data: {
    titleDeedUrl: string
    utilityBillUrl: string
    propertyLivePhotoUrl: string
  }) => void
  initialData?: any
}

type Step = 'deed' | 'bill' | 'live' | 'summary'

export function PropertyOwnershipSubFlow({
  onComplete,
  initialData,
}: PropertyOwnershipSubFlowProps) {
  const { user } = useAuth()
  const [step, setStep] = useState<Step>('deed')
  const [titleDeedUrl, setTitleDeedUrl] = useState(initialData?.titleDeedUrl || '')
  const [utilityBillUrl, setUtilityBillUrl] = useState(initialData?.utilityBillUrl || '')
  const [propertyLivePhotoUrl, setPropertyLivePhotoUrl] = useState(
    initialData?.propertyLivePhotoUrl || '',
  )
  const [isUploading, setIsUploading] = useState(false)

  const handleUpload = async (file: File, type: 'deed' | 'bill' | 'live') => {
    if (!user?.id) return
    setIsUploading(true)
    try {
      const url = await hotelManagerService.uploadAsset(
        user.id,
        file,
        `verification/property/${type}`,
      )
      if (type === 'deed') {
        setTitleDeedUrl(url)
        setStep('bill')
      } else if (type === 'bill') {
        setUtilityBillUrl(url)
        setStep('live')
      } else {
        setPropertyLivePhotoUrl(url)
        setStep('summary')
      }
      toast.success('Document uploaded!')
    } catch (error) {
      toast.error('Upload failed. Try again.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <AnimatePresence mode="wait">
        {step === 'deed' && (
          <motion.div
            key="deed"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-8"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-6">
                <Home className="w-8 h-8" />
              </div>
              <h4 className="text-2xl font-black text-gray-900 tracking-tight italic uppercase">
                Property Ownership
              </h4>
              <p className="text-gray-500 mt-2 font-medium">
                Please upload your Property Deed or Lease Agreement to prove ownership or management
                rights.
              </p>
            </div>

            <Card className="p-12 border-2 border-dashed border-gray-100 flex flex-col items-center justify-center bg-gray-50/50 rounded-[32px]">
              <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center mb-6">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <input
                type="file"
                id="deed-upload"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], 'deed')}
                disabled={isUploading}
              />
              <Button
                asChild
                className="rounded-2xl px-10 h-14 bg-primary-gradient text-white font-black uppercase tracking-widest border-0 shadow-lg shadow-primary/20"
              >
                <label htmlFor="deed-upload" className="cursor-pointer">
                  {isUploading ? (
                    <Loader2 className="animate-spin mr-2" />
                  ) : (
                    <Upload className="mr-2" />
                  )}
                  Upload Deed / Lease
                </label>
              </Button>
            </Card>
          </motion.div>
        )}

        {step === 'bill' && (
          <motion.div
            key="bill"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-6">
                <Lightbulb className="w-8 h-8" />
              </div>
              <h4 className="text-2xl font-black text-gray-900 tracking-tight italic uppercase">
                Address Verification
              </h4>
              <p className="text-gray-500 mt-2 font-medium">
                Upload a recent Utility Bill (Electricity, Water, or Fiber) showing the property
                address.
              </p>
            </div>

            <Card className="p-12 border-2 border-dashed border-gray-100 flex flex-col items-center justify-center bg-gray-50/50 rounded-[32px]">
              <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center mb-6">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <input
                type="file"
                id="bill-upload"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], 'bill')}
                disabled={isUploading}
              />
              <Button
                asChild
                className="rounded-2xl px-10 h-14 bg-primary-gradient text-white font-black uppercase tracking-widest border-0 shadow-lg shadow-primary/20"
              >
                <label htmlFor="bill-upload" className="cursor-pointer">
                  {isUploading ? (
                    <Loader2 className="animate-spin mr-2" />
                  ) : (
                    <Upload className="mr-2" />
                  )}
                  Upload Utility Bill
                </label>
              </Button>
            </Card>
            <button
              onClick={() => setStep('deed')}
              className="w-full text-center text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-primary"
            >
              ← Go Back
            </button>
          </motion.div>
        )}

        {step === 'live' && (
          <motion.div
            key="live"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-6">
                <Camera className="w-8 h-8" />
              </div>
              <h4 className="text-2xl font-black text-gray-900 tracking-tight italic uppercase">
                Live Verification
              </h4>
              <p className="text-gray-500 mt-2 font-medium">
                Take a real-time photo of the hotel exterior or main signage to prove you are
                physically present at the property.
              </p>
            </div>

            <Card className="p-12 border-2 border-dashed border-gray-100 flex flex-col items-center justify-center bg-gray-50/50 rounded-[32px]">
              <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center mb-6">
                <MapPin className="w-8 h-8 text-gray-400" />
              </div>
              <input
                type="file"
                id="live-upload"
                className="hidden"
                capture="environment"
                onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], 'live')}
                disabled={isUploading}
              />
              <Button
                asChild
                className="rounded-2xl px-10 h-14 bg-primary-gradient text-white font-black uppercase tracking-widest border-0 shadow-lg shadow-primary/20"
              >
                <label htmlFor="live-upload" className="cursor-pointer">
                  {isUploading ? (
                    <Loader2 className="animate-spin mr-2" />
                  ) : (
                    <Camera className="mr-2" />
                  )}
                  Capture Live Property Photo
                </label>
              </Button>
            </Card>
            <button
              onClick={() => setStep('bill')}
              className="w-full text-center text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-primary"
            >
              ← Go Back
            </button>
          </motion.div>
        )}

        {step === 'summary' && (
          <motion.div
            key="summary"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-8"
          >
            <Card className="p-10 rounded-[32px] text-center bg-primary/[0.02] border-primary/10 border-2">
              <div className="w-20 h-20 rounded-3xl bg-primary text-white flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary/20">
                <Check className="w-10 h-10" />
              </div>

              <h4 className="text-3xl font-black text-gray-900 tracking-tight italic uppercase italic">
                Property Verified
              </h4>
              <p className="text-gray-500 mt-4 font-medium px-4">
                All ownership and location evidence has been collected. Our team will verify these
                against local records.
              </p>

              <div className="mt-8 grid grid-cols-3 gap-3">
                {[
                  { label: 'Deed', url: titleDeedUrl },
                  { label: 'Bill', url: utilityBillUrl },
                  { label: 'Live', url: propertyLivePhotoUrl },
                ].map((item, idx) => (
                  <div key={idx} className="bg-white p-3 rounded-2xl border border-gray-100">
                    <div className="w-full aspect-square bg-gray-50 rounded-xl overflow-hidden mb-2">
                      <img src={item.url} alt={item.label} className="w-full h-full object-cover" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>

              <Button
                className="mt-10 rounded-2xl h-14 bg-primary-gradient text-white px-12 font-black uppercase tracking-widest border-0 shadow-lg shadow-primary/20 w-full"
                onClick={() =>
                  onComplete({
                    titleDeedUrl,
                    utilityBillUrl,
                    propertyLivePhotoUrl,
                  })
                }
              >
                Complete Property Step <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
