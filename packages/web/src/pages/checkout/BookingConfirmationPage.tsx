/**
 * Booking Confirmation Page
 *
 * Displayed after successful payment and booking confirmation
 * Shows booking details, booking ID, confirmation number, and next steps
 */

import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { Check, Loader2, Download, Calendar, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/glass'
import { handlePaymentSuccess } from '@/features/booking'
import { tourService, Tour, TourSchedule } from '@/features/tour-operator/services/tourService'

export default function BookingConfirmationPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const paymentIntentId = searchParams.get('payment_intent')
  const bookingId = searchParams.get('booking_id')

  // State
  const [tour, setTour] = useState<Tour | null>(null)
  const [schedule, setSchedule] = useState<TourSchedule | null>(null)
  const [confirmationStatus, setConfirmationStatus] = useState<'confirming' | 'success' | 'error'>(
    'confirming',
  )
  const [error, setError] = useState<string | null>(null)
  const [confirmedBooking, setConfirmedBooking] = useState<any | null>(null)

  // Confirm payment on load
  useEffect(() => {
    const confirmPayment = async () => {
      if (!paymentIntentId || !bookingId) {
        setConfirmationStatus('error')
        setError('Missing payment or booking ID')
        return
      }

      try {
        const result = await handlePaymentSuccess(paymentIntentId, bookingId)

        const booking = result.booking
        if (result.success && booking) {
          setConfirmedBooking(booking)

          // Fetch tour and schedule details
          const foundTour = await tourService.getTourById(booking.tour_id)
          setTour(foundTour)

          if (foundTour) {
            const schedules = await tourService.getTourSchedules(booking.tour_id)
            const mainSchedule = schedules.find((s) => s.id === booking.schedule_id)
            setSchedule(mainSchedule || null)
          }

          setConfirmationStatus('success')
        } else {
          setConfirmationStatus('error')
          setError(result.error || 'Failed to confirm booking')
        }
      } catch (err) {
        setConfirmationStatus('error')
        setError(err instanceof Error ? err.message : 'Unknown error')
      }
    }

    confirmPayment()
  }, [paymentIntentId, bookingId])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  // Confirming state
  if (confirmationStatus === 'confirming') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
          <h2 className="text-2xl font-bold text-gray-900">Confirming Your Booking</h2>
          <p className="text-gray-600 font-medium">Please wait while we process your payment...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (confirmationStatus === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
        <GlassCard
          asMotion
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          variant="card"
          className="max-w-md w-full rounded-2xl p-8 text-center space-y-6"
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
          <div className="space-y-3 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-600">Please contact support if this issue persists.</p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => navigate('/')} className="flex-1">
                Back to Home
              </Button>
              <Button
                onClick={() => (window.location.href = 'mailto:support@tripavail.com')}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                Contact Support
              </Button>
            </div>
          </div>
        </GlassCard>
      </div>
    )
  }

  // Success state
  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 min-h-screen pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <Check className="w-10 h-10 text-green-600" />
          </motion.div>
          <h1 className="text-4xl font-black text-gray-900 mb-2">Booking Confirmed!</h1>
          <p className="text-lg text-gray-600 font-medium">
            Your tour is booked. Get ready for an amazing adventure!
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <GlassCard
          asMotion
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          variant="card"
          className="rounded-2xl p-8 space-y-8"
        >
          {/* Confirmation Number */}
          <div className="text-center p-6 bg-primary/5 rounded-xl border border-primary/20">
            <p className="text-sm text-gray-600 font-medium uppercase tracking-widest mb-2">
              Confirmation Number
            </p>
            <p className="text-2xl font-black text-primary font-mono break-all">
              {confirmedBooking?.id?.slice(0, 8).toUpperCase()}
            </p>
          </div>

          {/* Tour Details */}
          {tour && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900">Tour Details</h3>
              <div className="space-y-3 p-4 bg-gray-50 rounded-xl">
                <div className="flex items-start justify-between">
                  <span className="text-gray-600 font-medium">Tour Name</span>
                  <span className="text-gray-900 font-bold text-right max-w-xs">{tour.title}</span>
                </div>
                <div className="h-px bg-gray-200" />
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 font-medium">Location</span>
                  <span className="text-gray-900 font-bold">
                    {tour.location.city}, {tour.location.country}
                  </span>
                </div>
                <div className="h-px bg-gray-200" />
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 font-medium">Duration</span>
                  <span className="text-gray-900 font-bold">{tour.duration}</span>
                </div>
              </div>
            </div>
          )}

          {/* Schedule Info */}
          {schedule && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900">Departure Details</h3>
              <div className="space-y-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-xs text-blue-600 font-bold uppercase tracking-widest">
                      Departure
                    </p>
                    <p className="text-gray-900 font-bold">
                      {formatDate(schedule.start_time)} at {formatTime(schedule.start_time)}
                    </p>
                  </div>
                </div>
                <div className="h-px bg-blue-200" />
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-xs text-blue-600 font-bold uppercase tracking-widest">
                      Return
                    </p>
                    <p className="text-gray-900 font-bold">{formatDate(schedule.end_time)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Booking Summary */}
          {confirmedBooking && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900">Booking Summary</h3>
              <div className="space-y-3 p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 font-medium">Number of Guests</span>
                  <span className="text-gray-900 font-bold">{confirmedBooking.pax_count}</span>
                </div>
                <div className="h-px bg-gray-200" />
                <div className="flex items-center justify-between text-lg">
                  <span className="text-gray-900 font-bold">Total Paid</span>
                  <span className="font-black text-primary">
                    {tour?.currency} {confirmedBooking.total_price.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Next Steps */}
          <div className="space-y-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
            <h4 className="font-bold text-gray-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              What's Next?
            </h4>
            <ul className="space-y-2 text-sm text-gray-700 font-medium">
              <li>✓ Check your email for booking confirmation and tour details</li>
              <li>✓ Save your confirmation number for check-in</li>
              <li>✓ Review the tour itinerary and packing list</li>
              <li>✓ Follow the tour operator's pre-departure instructions</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-4 border-t border-gray-100">
            <Button
              onClick={() => navigate('/')}
              className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold"
            >
              Back to Home
            </Button>
            <Button
              variant="outline"
              onClick={() => window.print()}
              className="w-full h-12 rounded-xl"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Confirmation
            </Button>
          </div>
        </GlassCard>

        {/* Support Info */}
        <GlassCard
          asMotion
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          variant="light"
          className="mt-8 text-center rounded-2xl p-6"
        >
          <p className="text-gray-600 font-medium mb-2">Need help?</p>
          <a href="mailto:support@tripavail.com" className="text-primary font-bold hover:underline">
            Contact our support team
          </a>
        </GlassCard>
      </div>
    </div>
  )
}
