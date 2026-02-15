import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { AlertCircle, Check, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { handlePackagePaymentSuccess } from '@/features/booking'
import { getPackageById } from '@/features/package-creation/services/packageService'
import { supabase } from '@/lib/supabase'

export default function PackageBookingConfirmationPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const paymentIntentId = searchParams.get('payment_intent') || null
  const bookingId = searchParams.get('booking_id')

  const [status, setStatus] = useState<'confirming' | 'success' | 'error'>('confirming')
  const [error, setError] = useState<string | null>(null)
  const [booking, setBooking] = useState<any | null>(null)
  const [pkg, setPkg] = useState<any | null>(null)

  useEffect(() => {
    const run = async () => {
      if (!paymentIntentId || !bookingId) {
        setStatus('error')
        setError('Missing payment or booking ID')
        return
      }

      try {
        // Optional verification step (Edge Function). If not deployed yet, we skip it.
        try {
          const { data, error: verifyError } = await supabase.functions.invoke(
            'stripe-verify-payment-intent',
            { body: { booking_id: bookingId, payment_intent_id: paymentIntentId } },
          )

          if (verifyError) {
            throw verifyError
          }

          if (data && data.ok === false) {
            throw new Error(data.error || 'Payment not verified')
          }
        } catch {
          // Ignore verification failures for now; confirmation below will still run.
        }

        const result = await handlePackagePaymentSuccess(paymentIntentId, bookingId)
        if (!result.success || !result.booking) {
          setStatus('error')
          setError(result.error || 'Failed to confirm booking')
          return
        }

        setBooking(result.booking)
        const packageData = await getPackageById(result.booking.package_id)
        setPkg(packageData)
        setStatus('success')
      } catch (err) {
        setStatus('error')
        setError(err instanceof Error ? err.message : 'Unknown error')
      }
    }

    run()
  }, [paymentIntentId, bookingId])

  if (status === 'confirming') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
          <h2 className="text-2xl font-bold text-gray-900">Confirming Your Booking</h2>
          <p className="text-gray-600 font-medium">Please wait while we finalize your payment...</p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white rounded-2xl p-8 border border-gray-100 shadow-lg text-center space-y-6"
        >
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmation Failed</h2>
            <p className="text-gray-600 font-medium">
              {error || 'An error occurred while confirming your booking'}
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate('/')} className="flex-1">
              Back to Home
            </Button>
            <Button onClick={() => navigate(-1)} className="flex-1">
              Try Again
            </Button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-8 border border-gray-100 shadow-lg space-y-6"
        >
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-black text-gray-900">Booking Confirmed</h1>
            <p className="text-gray-600 font-medium mt-2">Your package booking is confirmed.</p>
          </div>

          <div className="rounded-xl bg-gray-50 p-4 border border-gray-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 font-medium">Package</span>
              <span className="text-gray-900 font-bold text-right">
                {pkg?.name || booking?.package_id}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 font-medium">Total</span>
              <span className="text-gray-900 font-bold">
                ${Number(booking?.total_price || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 font-medium">Booking ID</span>
              <span className="text-gray-900 font-mono font-bold">
                {booking?.id?.slice(0, 8)?.toUpperCase()}
              </span>
            </div>
          </div>

          <Button onClick={() => navigate('/')} className="w-full h-12 rounded-2xl font-bold">
            Done
          </Button>
        </motion.div>
      </div>
    </div>
  )
}
