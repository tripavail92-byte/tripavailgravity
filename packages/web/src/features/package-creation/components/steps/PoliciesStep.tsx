import { AlertCircle, DollarSign, FileText, Shield } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

import { StepData } from '../../types'

interface PoliciesStepProps {
  onComplete: (data: StepData) => void
  onUpdate: (data: StepData) => void
  existingData?: StepData
  onBack: () => void
}

const CANCELLATION_POLICIES = [
  {
    id: 'flexible',
    name: 'Flexible',
    description: 'Free cancellation up to 24 hours before start',
    refundSchedule:
      '100% refund if cancelled 24+ hours before • 0% refund if cancelled within 24 hours',
  },
  {
    id: 'moderate',
    name: 'Moderate',
    description: 'Free cancellation up to 7 days before start',
    refundSchedule:
      '100% refund if cancelled 7+ days before • 50% refund if cancelled 3-7 days before • 0% refund if cancelled within 3 days',
  },
  {
    id: 'strict',
    name: 'Strict',
    description: 'No refunds after booking',
    refundSchedule:
      '100% refund if cancelled within 24 hours of booking • 0% refund after 24 hours',
  },
  {
    id: 'custom',
    name: 'Custom Policy',
    description: 'Define your own cancellation terms',
    refundSchedule: null,
  },
]

const PAYMENT_TERMS = [
  { id: 'full', name: 'Full Payment Required', description: '100% payment at time of booking' },
  {
    id: 'deposit',
    name: 'Deposit Required',
    description: '30% deposit at booking, balance before trip',
  },
  { id: 'flexible', name: 'Flexible Payment', description: 'Pay in installments' },
]

export function PoliciesStep({ onComplete, onUpdate, existingData, onBack }: PoliciesStepProps) {
  const [cancellationPolicy, setCancellationPolicy] = useState(
    (existingData?.cancellationPolicy as string) || 'moderate',
  )
  const [customCancellationPolicy, setCustomCancellationPolicy] = useState(
    (existingData?.customCancellationPolicy as string) || '',
  )
  const [paymentTerms, setPaymentTerms] = useState((existingData?.paymentTerms as string) || 'full')
  const [termsAndConditions, setTermsAndConditions] = useState(
    (existingData?.termsAndConditions as string) || '',
  )

  const handleContinue = () => {
    onComplete({
      cancellationPolicy,
      customCancellationPolicy:
        cancellationPolicy === 'custom' ? customCancellationPolicy : undefined,
      paymentTerms,
      termsAndConditions,
    })
  }

  const selectedCancellationPolicy = CANCELLATION_POLICIES.find((p) => p.id === cancellationPolicy)
  const selectedPaymentTerm = PAYMENT_TERMS.find((p) => p.id === paymentTerms)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Package Policies</h2>
        <p className="text-gray-600">Define your cancellation, payment, and booking policies</p>
      </div>

      {/* Cancellation Policy */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-primary" />
          <Label className="text-lg font-semibold">Cancellation Policy</Label>
        </div>
        <div className="space-y-3">
          {CANCELLATION_POLICIES.map((policy) => (
            <button
              key={policy.id}
              onClick={() => setCancellationPolicy(policy.id)}
              className={cn(
                'w-full p-4 rounded-lg border-2 text-left transition-all',
                cancellationPolicy === policy.id
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 hover:border-gray-300',
              )}
            >
              <div className="font-semibold text-gray-900 mb-1">{policy.name}</div>
              <div className="text-sm text-gray-600 mb-2">{policy.description}</div>
              {policy.refundSchedule && (
                <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                  {policy.refundSchedule}
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Custom Policy Input */}
        {cancellationPolicy === 'custom' && (
          <div className="mt-4">
            <Label htmlFor="customPolicy" className="mb-2 block">
              Custom Cancellation Policy
            </Label>
            <Textarea
              id="customPolicy"
              placeholder="Describe your cancellation policy and refund schedule in detail..."
              value={customCancellationPolicy}
              onChange={(e) => setCustomCancellationPolicy(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>
        )}
      </Card>

      {/* Payment Terms */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="w-5 h-5 text-primary" />
          <Label className="text-lg font-semibold">Payment Terms</Label>
        </div>
        <div className="space-y-3">
          {PAYMENT_TERMS.map((term) => (
            <button
              key={term.id}
              onClick={() => setPaymentTerms(term.id)}
              className={cn(
                'w-full p-4 rounded-lg border-2 text-left transition-all',
                paymentTerms === term.id
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 hover:border-gray-300',
              )}
            >
              <div className="font-semibold text-gray-900 mb-1">{term.name}</div>
              <div className="text-sm text-gray-600">{term.description}</div>
            </button>
          ))}
        </div>
      </Card>

      {/* Terms and Conditions */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-primary" />
          <Label className="text-lg font-semibold">Additional Terms & Conditions</Label>
        </div>
        <div className="bg-info/5 border border-info/20 rounded-lg p-3 mb-4 flex items-start gap-2">
          <AlertCircle size={16} className="text-info mt-0.5 flex-shrink-0" />
          <p className="text-sm text-gray-700">
            Include important details like age restrictions, health requirements, required
            documents, etc.
          </p>
        </div>
        <Textarea
          placeholder="e.g., Minimum age: 18 years
Valid ID required at check-in
Medical fitness required for adventure activities
Travel insurance recommended..."
          value={termsAndConditions}
          onChange={(e) => setTermsAndConditions(e.target.value)}
          rows={6}
          className="resize-none"
        />
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button
          onClick={handleContinue}
          disabled={cancellationPolicy === 'custom' && !customCancellationPolicy.trim()}
        >
          Continue
        </Button>
      </div>
    </div>
  )
}
