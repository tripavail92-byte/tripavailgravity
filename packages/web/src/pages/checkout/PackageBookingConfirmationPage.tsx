import { AlertCircle, Calendar, Check, Download, Loader2, Users } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/glass'
import { handlePackagePaymentSuccess } from '@/features/booking/services/paymentSuccessHandler'
import {
  getTravelerBookingOutcomeSummary,
  getTravelerBookingSettlementState,
} from '@/features/booking/utils/travelerBookingPresentation'
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
  const packageCurrency = String(pkg?.currency || 'PKR')
  const settlementState = getTravelerBookingSettlementState(booking)
  const outcome = getTravelerBookingOutcomeSummary(settlementState)

  const formatMoney = (value: number) => `${packageCurrency} ${value.toLocaleString()}`
  const formatDate = (value?: string | null) => {
    if (!value) return null
    return new Date(value).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const nextSteps = (() => {
    if (outcome.kind === 'cancelled') {
      return [
        'Keep this receipt for your records and any support follow-up.',
        settlementState.refundAmount > 0
          ? `Refunded amount recorded: ${formatMoney(settlementState.refundAmount)}.`
          : 'Check the booking workspace for the latest operator or support guidance.',
        'Use the message thread if you need written clarification from the operator.',
      ]
    }

    if (outcome.kind === 'refunded') {
      return [
        `Refunded amount recorded: ${formatMoney(settlementState.refundAmount)}.`,
        'Keep this confirmation for your bank or support records.',
        'Use the booking workspace if you need the latest operator context.',
      ]
    }

    if (outcome.kind === 'payment_processing') {
      return [
        'Refresh this page once payment clears if your bank took longer than expected.',
        'Use the booking workspace after payment confirmation to coordinate with the operator.',
        'Contact support if the payment stays in processing unexpectedly.',
      ]
    }

    if (outcome.kind === 'deposit_pending') {
      return [
        'Your reservation is confirmed after the online deposit.',
        `Remaining balance due to the operator before check-in: ${formatMoney(settlementState.remainingAmount)}.`,
        'Use the booking workspace to keep payment and arrival communication in one thread.',
      ]
    }

    return [
      'Your package is confirmed and fully paid online.',
      'Keep this confirmation for check-in and support follow-up.',
      'Use the booking workspace to coordinate arrival details with the operator.',
    ]
  })()

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
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center">
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
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
        <GlassCard
          asMotion
          initial={{ opacity: 0, scale: 0.95 }}
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
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate('/')} className="flex-1">
              Back to Home
            </Button>
            <Button onClick={() => navigate(-1)} className="flex-1">
              Try Again
            </Button>
          </div>
        </GlassCard>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-sky-50 pb-20">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <GlassCard
          asMotion
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          variant="card"
          className="rounded-2xl p-8 space-y-8"
        >
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto">
            {outcome.tone === 'success' ? (
              <Check className="w-8 h-8 text-emerald-600" />
            ) : (
              <AlertCircle className="w-8 h-8 text-amber-600" />
            )}
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-black text-gray-900">{outcome.title}</h1>
            <p className="text-gray-600 font-medium mt-2">{outcome.message}</p>
            {settlementState.hasPromo ? (
              <p className="mt-3 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                Promo savings locked in: {formatMoney(settlementState.promoDiscountValue)} off
              </p>
            ) : null}
          </div>

          <div className="text-center p-6 bg-primary/5 rounded-xl border border-primary/20">
            <p className="text-sm text-gray-600 font-medium uppercase tracking-widest mb-2">
              Confirmation Number
            </p>
            <p className="text-2xl font-black text-primary font-mono break-all">
              {booking?.id?.slice(0, 8)?.toUpperCase()}
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900">Package Details</h3>
            <div className="space-y-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
              <div className="flex items-start justify-between gap-4">
                <span className="text-gray-600 font-medium">Package</span>
                <span className="text-right text-gray-900 font-bold max-w-xs">
                  {pkg?.name || booking?.package_id}
                </span>
              </div>
              <div className="h-px bg-gray-200" />
              <div className="flex items-center justify-between">
                <span className="text-gray-600 font-medium">Type</span>
                <span className="text-gray-900 font-bold capitalize">
                  {pkg?.package_type?.replace('-', ' ') || 'Package'}
                </span>
              </div>
              {booking?.check_in_date ? (
                <>
                  <div className="h-px bg-gray-200" />
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 font-medium">Check-in</span>
                    <span className="text-gray-900 font-bold">{formatDate(booking.check_in_date)}</span>
                  </div>
                </>
              ) : null}
              {booking?.check_out_date ? (
                <>
                  <div className="h-px bg-gray-200" />
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 font-medium">Check-out</span>
                    <span className="text-gray-900 font-bold">{formatDate(booking.check_out_date)}</span>
                  </div>
                </>
              ) : null}
              {booking?.number_of_nights ? (
                <>
                  <div className="h-px bg-gray-200" />
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 font-medium">Stay length</span>
                    <span className="text-gray-900 font-bold">
                      {booking.number_of_nights} night{booking.number_of_nights === 1 ? '' : 's'}
                    </span>
                  </div>
                </>
              ) : null}
              <div className="h-px bg-gray-200" />
              <div className="flex items-center justify-between">
                <span className="text-gray-600 font-medium">Guests</span>
                <span className="text-gray-900 font-bold">{booking?.guest_count || 0}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900">Payment Breakdown</h3>
            <div className="space-y-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 font-medium">Booking status</span>
                <span className="text-gray-900 font-bold">{booking?.status || 'confirmed'}</span>
              </div>
              <div className="h-px bg-gray-200" />
              <div className="flex items-center justify-between">
                <span className="text-gray-600 font-medium">Payment status</span>
                <span className="text-gray-900 font-bold">{booking?.payment_status || 'paid'}</span>
              </div>
              <div className="h-px bg-gray-200" />
              <div className="flex items-center justify-between">
                <span className="text-gray-600 font-medium">Total booking amount</span>
                <span className="text-gray-900 font-bold">
                  {formatMoney(settlementState.totalAmount)}
                </span>
              </div>
              {settlementState.hasPromo ? (
                <>
                  <div className="h-px bg-gray-200" />
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 font-medium">Original total</span>
                    <span className="text-gray-900 font-bold">
                      {formatMoney(settlementState.priceBeforePromo || settlementState.totalAmount)}
                    </span>
                  </div>
                  <div className="h-px bg-gray-200" />
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 font-medium">Promo discount</span>
                    <span className="font-bold text-emerald-700">
                      -{formatMoney(settlementState.promoDiscountValue)}
                    </span>
                  </div>
                </>
              ) : null}
              <div className="h-px bg-gray-200" />
              <div className="flex items-center justify-between text-lg">
                <span className="text-gray-900 font-bold">Paid online</span>
                <span className="font-black text-primary">
                  {formatMoney(settlementState.paidOnline)}
                </span>
              </div>
              <div className="h-px bg-gray-200" />
              <div className="flex items-center justify-between">
                <span className="text-gray-600 font-medium">Remaining to operator</span>
                <span className="text-gray-900 font-bold">
                  {formatMoney(settlementState.remainingAmount)}
                </span>
              </div>
              <div className="h-px bg-gray-200" />
              <div className="flex items-center justify-between">
                <span className="text-gray-600 font-medium">Payment mode</span>
                <span className="text-gray-900 font-bold">
                  {settlementState.remainingAmount > 0 ? 'Deposit booking' : 'Full payment online'}
                </span>
              </div>
              {booking?.payment_policy_text ? (
                <>
                  <div className="h-px bg-gray-200" />
                  <div className="space-y-2">
                    <p className="text-gray-600 font-medium">Payment policy</p>
                    <p className="text-sm text-gray-900">{booking.payment_policy_text}</p>
                  </div>
                </>
              ) : null}
            </div>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <h4 className="flex items-center gap-2 font-bold text-gray-900">
              <Calendar className="w-5 h-5 text-amber-600" />
              What happens next
            </h4>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              {nextSteps.map((step) => (
                <li key={step}>• {step}</li>
              ))}
            </ul>
          </div>

          <div className="space-y-3 border-t border-gray-100 pt-4">
            {booking ? (
              <Button asChild className="w-full h-12 rounded-2xl font-bold">
                <Link to={`/trips/${booking.id}`}>Open Booking Workspace</Link>
              </Button>
            ) : (
              <Button onClick={() => navigate('/')} className="w-full h-12 rounded-2xl font-bold">
                Done
              </Button>
            )}
            {booking ? (
              <Button asChild variant="outline" className="w-full h-12 rounded-2xl font-bold">
                <Link to={`/trips/${booking.id}?tab=messages`}>Message Host</Link>
              </Button>
            ) : null}
            <Button variant="outline" onClick={() => window.print()} className="w-full h-12 rounded-2xl font-bold">
              <Download className="mr-2 h-4 w-4" />
              Download Confirmation / Receipt
            </Button>
          </div>

          <div className="grid gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-white p-4 text-center">
              <Calendar className="mx-auto h-5 w-5 text-primary" />
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Check-in</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">{formatDate(booking?.check_in_date) || 'See workspace'}</p>
            </div>
            <div className="rounded-2xl bg-white p-4 text-center">
              <Users className="mx-auto h-5 w-5 text-primary" />
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Guests</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">{booking?.guest_count || 0}</p>
            </div>
            <div className="rounded-2xl bg-white p-4 text-center">
              <Check className="mx-auto h-5 w-5 text-primary" />
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Paid online</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">{formatMoney(settlementState.paidOnline)}</p>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
