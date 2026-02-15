import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface StepProps {
  onNext: () => void
  onUpdate: (data: any) => void
  data: any
}

export function PersonalInfoStep({ onUpdate, data }: StepProps) {
  const [formData, setFormData] = useState(
    data.personalInfo || {
      operatorName: '',
      email: '',
      phone: '',
      contactPerson: '',
    },
  )

  const handleChange = (field: string, value: string) => {
    const newData = { ...formData, [field]: value }
    setFormData(newData)
    onUpdate({ personalInfo: newData })
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">
          Personal Information
        </h3>
        <p className="text-lg text-gray-500 leading-relaxed font-medium">
          Let's start with your basic contact information.
        </p>
      </div>

      <Card className="p-8 space-y-6 border-gray-100 shadow-sm rounded-[32px] bg-white ring-1 ring-black/[0.02]">
        <div className="space-y-3">
          <Label
            htmlFor="operatorName"
            className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1"
          >
            Tour Operator Name *
          </Label>
          <Input
            id="operatorName"
            value={formData.operatorName}
            onChange={(e) => handleChange('operatorName', e.target.value)}
            placeholder="e.g. Peak Adventures Ltd"
            className="rounded-2xl border-gray-200 py-7 focus-visible:ring-primary/20 focus-visible:border-primary/50 transition-all text-base placeholder:text-gray-300"
          />
        </div>

        <div className="space-y-3">
          <Label
            htmlFor="email"
            className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1"
          >
            Work Email Address *
          </Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="hello@adventure.com"
            className="rounded-2xl border-gray-200 py-7 focus-visible:ring-primary/20 focus-visible:border-primary/50 transition-all text-base placeholder:text-gray-300"
          />
        </div>

        <div className="space-y-3">
          <Label
            htmlFor="phone"
            className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1"
          >
            Phone Number *
          </Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder="+92 XXX XXXXXXX"
            className="rounded-2xl border-gray-200 py-7 focus-visible:ring-primary/20 focus-visible:border-primary/50 transition-all text-base placeholder:text-gray-300"
          />
        </div>

        <div className="space-y-3">
          <Label
            htmlFor="contactPerson"
            className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1"
          >
            Primary Contact Person
          </Label>
          <Input
            id="contactPerson"
            value={formData.contactPerson}
            onChange={(e) => handleChange('contactPerson', e.target.value)}
            placeholder="Name of the person managing the account"
            className="rounded-2xl border-gray-200 py-7 focus-visible:ring-primary/20 focus-visible:border-primary/50 transition-all text-base placeholder:text-gray-300"
          />
        </div>
      </Card>

      <div className="bg-amber-50/50 border border-amber-100 rounded-[28px] p-6 flex gap-4 transition-colors hover:bg-amber-50">
        <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-amber-100 flex items-center justify-center flex-shrink-0">
          <span className="text-amber-600 text-xl font-black italic">!</span>
        </div>
        <p className="text-sm text-amber-900 leading-relaxed font-medium">
          Make sure your email and phone number are correct. We'll use these for important booking
          notifications and account verification.
        </p>
      </div>
    </div>
  )
}
