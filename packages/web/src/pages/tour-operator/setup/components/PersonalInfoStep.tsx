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
        <h3 className="text-3xl font-extrabold text-foreground mb-2 tracking-tight">
          Personal Information
        </h3>
        <p className="text-lg text-muted-foreground leading-relaxed font-medium">
          Let's start with your basic contact information.
        </p>
      </div>

      <Card className="p-8 space-y-6 border-border/50 shadow-sm rounded-[32px] bg-background ring-1 ring-border/40">
        <div className="space-y-3">
          <Label
            htmlFor="operatorName"
            className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1"
          >
            Tour Operator Name *
          </Label>
          <Input
            id="operatorName"
            value={formData.operatorName}
            onChange={(e) => handleChange('operatorName', e.target.value)}
            placeholder="e.g. Peak Adventures Ltd"
            className="rounded-2xl border-border/60 py-7 focus-visible:ring-primary/20 focus-visible:border-primary/50 transition-all text-base placeholder:text-muted-foreground/40"
          />
        </div>

        <div className="space-y-3">
          <Label
            htmlFor="email"
            className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1"
          >
            Work Email Address *
          </Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="hello@adventure.com"
            className="rounded-2xl border-border/60 py-7 focus-visible:ring-primary/20 focus-visible:border-primary/50 transition-all text-base placeholder:text-muted-foreground/40"
          />
        </div>

        <div className="space-y-3">
          <Label
            htmlFor="phone"
            className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1"
          >
            Phone Number *
          </Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder="+92 XXX XXXXXXX"
            className="rounded-2xl border-border/60 py-7 focus-visible:ring-primary/20 focus-visible:border-primary/50 transition-all text-base placeholder:text-muted-foreground/40"
          />
        </div>

        <div className="space-y-3">
          <Label
            htmlFor="contactPerson"
            className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1"
          >
            Primary Contact Person
          </Label>
          <Input
            id="contactPerson"
            value={formData.contactPerson}
            onChange={(e) => handleChange('contactPerson', e.target.value)}
            placeholder="Name of the person managing the account"
            className="rounded-2xl border-border/60 py-7 focus-visible:ring-primary/20 focus-visible:border-primary/50 transition-all text-base placeholder:text-muted-foreground/40"
          />
        </div>
      </Card>

      <div className="bg-warning/10 border border-warning/20 rounded-[28px] p-6 flex gap-4 transition-colors hover:bg-warning/20">
        <div className="w-10 h-10 bg-background rounded-xl shadow-sm border border-warning/20 flex items-center justify-center flex-shrink-0">
          <span className="text-warning text-xl font-black italic">!</span>
        </div>
        <p className="text-sm text-warning leading-relaxed font-medium">
          Make sure your email and phone number are correct. We'll use these for important booking
          notifications and account verification.
        </p>
      </div>
    </div>
  )
}
