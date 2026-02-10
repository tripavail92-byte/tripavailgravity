import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Calendar, Clock, Loader2, Shield, Users } from 'lucide-react';
import { format } from 'date-fns';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getPackageById } from '@/features/package-creation/services/packageService';
import {
  createPackageBookingWithValidation,
  packageBookingService,
  type PackageBooking,
} from '@/features/booking';
import { useAuth } from '@/hooks/useAuth';
import { getStripe } from '@/lib/stripe';
import { supabase } from '@/lib/supabase';

interface CountdownTimer {
  minutes: number;
  seconds: number;
}

interface CheckoutState {
  checkIn: string;
  checkOut: string;
  guestCount: number;
  pricing?: {
    total_price: number;
    price_per_night: number;
    number_of_nights: number;
  };
}

export default function PackageCheckoutPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const state = location.state as CheckoutState | undefined;

  const [packageData, setPackageData] = useState<any | null>(null);
  const [pricing, setPricing] = useState<CheckoutState['pricing'] | null>(state?.pricing || null);
  const [pendingBooking, setPendingBooking] = useState<PackageBooking | null>(null);
  const [countdown, setCountdown] = useState<CountdownTimer>({ minutes: 10, seconds: 0 });
  const [loading, setLoading] = useState(true);
  const [processingBooking, setProcessingBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [creatingPaymentIntent, setCreatingPaymentIntent] = useState(false);
  const [stripeAvailable, setStripeAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchPackage = async () => {
      try {
        const pkg = await getPackageById(id);
        setPackageData(pkg);
      } catch (error) {
        console.error('Error fetching package:', error);
        setPackageData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPackage();
  }, [id]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth/login?returnTo=' + encodeURIComponent(window.location.pathname));
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    const loadPricing = async () => {
      const hasValidPricing =
        !!pricing &&
        typeof pricing.number_of_nights === 'number' &&
        pricing.number_of_nights > 0 &&
        typeof pricing.total_price === 'number' &&
        pricing.total_price > 0;

      if (!id || !state?.checkIn || !state?.checkOut || hasValidPricing) return;

      try {
        const calculated = await packageBookingService.calculatePrice(
          id,
          state.checkIn,
          state.checkOut
        );
        setPricing(calculated);
      } catch (error) {
        console.error('Error calculating price:', error);
      }
    };

    loadPricing();
  }, [id, state?.checkIn, state?.checkOut, pricing]);

  useEffect(() => {
    if (!pendingBooking?.expires_at) return;

    const interval = setInterval(() => {
      const now = new Date();
      const expiresAt = new Date(pendingBooking.expires_at!);
      const diff = expiresAt.getTime() - now.getTime();

      if (diff <= 0) {
        clearInterval(interval);
        setPendingBooking(null);
        setCountdown({ minutes: 0, seconds: 0 });
        setBookingError('Your booking hold has expired. Please try again.');
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setCountdown({ minutes, seconds });
    }, 1000);

    return () => clearInterval(interval);
  }, [pendingBooking?.expires_at]);

  useEffect(() => {
    const createPaymentIntent = async () => {
      if (!pendingBooking?.id || clientSecret || creatingPaymentIntent) return;

      setCreatingPaymentIntent(true);
      setBookingError(null);

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData?.session?.access_token;

        if (!accessToken) {
          throw new Error('Not authenticated');
        }

        const { data, error } = await supabase.functions.invoke('stripe-create-payment-intent', {
          body: { booking_id: pendingBooking.id },
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (error) {
          throw error;
        }

        if (!data?.ok) {
          throw new Error(data?.error || 'Failed to start payment');
        }

        if (!data?.client_secret) {
          throw new Error('No client secret returned');
        }

        setClientSecret(String(data.client_secret));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to start payment';
        setBookingError(message);
      } finally {
        setCreatingPaymentIntent(false);
      }
    };

    createPaymentIntent();
  }, [pendingBooking?.id, clientSecret, creatingPaymentIntent]);

  const handleCreatePendingBooking = async () => {
    if (!id || !user?.id || !state?.checkIn || !state?.checkOut || !state?.guestCount) {
      setBookingError('Missing booking details. Please try again.');
      return;
    }

    setProcessingBooking(true);
    setBookingError(null);

    try {
      const result = await createPackageBookingWithValidation({
        package_id: id,
        traveler_id: user.id,
        check_in_date: state.checkIn,
        check_out_date: state.checkOut,
        guest_count: state.guestCount,
      });

      setPendingBooking(result.booking as PackageBooking);
      setClientSecret(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create booking hold';
      setBookingError(message);
      console.error('Package booking creation error:', error);
    } finally {
      setProcessingBooking(false);
    }
  };

  const stripePromise = getStripe();

  useEffect(() => {
    let cancelled = false;
    stripePromise
      .then(stripe => {
        if (!cancelled) setStripeAvailable(!!stripe);
      })
      .catch(() => {
        if (!cancelled) setStripeAvailable(false);
      });

    return () => {
      cancelled = true;
    };
  }, [stripePromise]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (!packageData || !state?.checkIn || !state?.checkOut) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Package not found</h1>
        <Button onClick={() => navigate(-1)} variant="default" className="rounded-2xl px-8 h-12 font-bold mt-8">
          Back
        </Button>
      </div>
    );
  }

  const checkInDate = format(new Date(state.checkIn), 'MMM d, yyyy');
  const checkOutDate = format(new Date(state.checkOut), 'MMM d, yyyy');
  const nights = pricing?.number_of_nights || 0;

  const minNights = Number(packageData?.minimum_nights ?? 1);
  const maxNights = Number(packageData?.maximum_nights ?? 30);
  const computedNights = Math.round(
    (new Date(state.checkOut).getTime() - new Date(state.checkIn).getTime()) / (1000 * 60 * 60 * 24)
  );
  const stayNights = nights || computedNights;
  const isStayLengthValid = stayNights > 0 && stayNights >= minNights && stayNights <= maxNights;
  const stayLengthMessage = !isStayLengthValid
    ? stayNights < minNights
      ? `Minimum ${minNights} nights required`
      : `Maximum ${maxNights} nights allowed`
    : `Minimum ${minNights} night${minNights !== 1 ? 's' : ''} · Maximum ${maxNights} nights`;

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      <div className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">Complete Your Booking</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <Badge variant="secondary" className="mb-2 capitalize">
                    {packageData.package_type?.replace('-', ' ') || 'Package'}
                  </Badge>
                  <h2 className="text-2xl font-bold text-gray-900">{packageData.name}</h2>
                </div>
                {pendingBooking && (
                  <div className="flex items-center gap-2 text-sm text-orange-600">
                    <Clock className="w-4 h-4" />
                    {countdown.minutes}:{countdown.seconds.toString().padStart(2, '0')}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  {checkInDate} → {checkOutDate}
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  {state.guestCount} guest{state.guestCount > 1 ? 's' : ''}
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-3">Next Steps</h3>
              <p className="text-gray-600 text-sm">
                We hold your booking for 10 minutes while you complete payment. If the timer expires,
                you will need to start over.
              </p>
                <p className={
                  'mt-3 text-xs ' + (isStayLengthValid ? 'text-gray-500' : 'text-red-600 font-medium')
                }>
                  {stayLengthMessage}
                </p>
            </motion.div>

            {bookingError && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {bookingError}
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Price Summary</h3>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>${pricing?.price_per_night || 0} × {nights} night{nights !== 1 ? 's' : ''}</span>
                  <span>${pricing?.total_price || 0}</span>
                </div>
                <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-100">
                  <span>Total</span>
                  <span>${pricing?.total_price || 0}</span>
                </div>
              </div>

              {!pendingBooking ? (
                <>
                  <Button
                    className="w-full h-12 mt-6 text-base font-semibold bg-primary hover:bg-primary/90 text-white"
                    onClick={handleCreatePendingBooking}
                    disabled={processingBooking || !isStayLengthValid}
                  >
                    {processingBooking ? 'Starting checkout...' : 'Continue to Payment'}
                  </Button>

                  <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
                    <Shield className="w-4 h-4 text-emerald-500" />
                    Secure checkout. You’ll enter card details next.
                  </div>
                </>
              ) : (
                <>
                  <div className="mt-6 rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <div className="text-sm font-semibold text-gray-900 mb-3">Payment</div>

                    {stripeAvailable === false ? (
                      <div className="text-sm text-red-600">
                        Payments are not configured.
                      </div>
                    ) : !clientSecret ? (
                      <div className="text-sm text-gray-600">
                        {creatingPaymentIntent ? 'Preparing secure payment...' : 'Preparing secure payment...'}
                      </div>
                    ) : (
                      <Elements stripe={stripePromise} options={{ clientSecret }}>
                        <PackagePaymentForm
                          bookingId={pendingBooking.id}
                          total={Number(pricing?.total_price || 0)}
                        />
                      </Elements>
                    )}
                  </div>

                  <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
                    <Shield className="w-4 h-4 text-emerald-500" />
                    Your reservation expires when the timer ends.
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PackagePaymentForm(props: { bookingId: string; total: number }) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentReady, setPaymentReady] = useState(false);

  const handlePay = async () => {
    if (!stripe || !elements) return;
    const paymentElement = elements.getElement(PaymentElement);
    if (!paymentElement) {
      setError('Payment form is still loading. Please wait a moment and try again.');
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const returnUrl =
        window.location.origin +
        `/booking/package/confirmation?booking_id=${encodeURIComponent(props.bookingId)}`;

      const result = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: returnUrl },
        redirect: 'if_required',
      });

      if (result.error) {
        throw new Error(result.error.message || 'Payment failed');
      }

      const paymentIntentId = result.paymentIntent?.id;
      if (paymentIntentId && result.paymentIntent?.status === 'succeeded') {
        navigate(
          `/booking/package/confirmation?booking_id=${encodeURIComponent(props.bookingId)}&payment_intent=${encodeURIComponent(paymentIntentId)}`
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <PaymentElement
        onReady={() => setPaymentReady(true)}
        onChange={() => {
          if (error) setError(null);
        }}
      />

      {!paymentReady && !error && (
        <div className="text-xs text-gray-500">Loading secure payment form...</div>
      )}

      {error && <div className="text-sm text-red-600">{error}</div>}

      <Button
        className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-white"
        onClick={handlePay}
        disabled={!stripe || !elements || !paymentReady || submitting}
      >
        {submitting ? 'Processing...' : `Pay $${Number(props.total || 0).toLocaleString()}`}
      </Button>
    </div>
  );
}
