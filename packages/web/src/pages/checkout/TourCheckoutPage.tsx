import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
    ArrowLeft, Clock, MapPin, AlertCircle,
    Loader2, Check, ChevronRight, Shield, Lock
} from 'lucide-react';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';

import { Button } from '@/components/ui/button';
import { tourService, Tour, TourSchedule } from '@/features/tour-operator/services/tourService';
import { tourBookingService, TourBooking, createBookingWithValidation } from '@/features/booking';
import { useAuth } from '@/hooks/useAuth';
import { getStripe } from '@/lib/stripe';
import { supabase } from '@/lib/supabase';

interface CountdownTimer {
    minutes: number;
    seconds: number;
}

export default function TourCheckoutPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    // State
    const [tour, setTour] = useState<Tour | null>(null);
    const [schedule, setSchedule] = useState<TourSchedule | null>(null);
    const [availableSlots, setAvailableSlots] = useState<number | null>(null);
    const [guestCount, setGuestCount] = useState(1);
    const [loading, setLoading] = useState(true);
    const [processingBooking, setProcessingBooking] = useState(false);
    const [bookingError, setBookingError] = useState<string | null>(null);
    const [pendingBooking, setPendingBooking] = useState<TourBooking | null>(null);
    const [countdown, setCountdown] = useState<CountdownTimer>({ minutes: 10, seconds: 0 });
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [creatingPaymentIntent, setCreatingPaymentIntent] = useState(false);
    const [stripeAvailable, setStripeAvailable] = useState<boolean | null>(null);

    // Fetch tour and schedule details
    useEffect(() => {
        const fetchDetails = async () => {
            if (!id) return;
            try {
                const foundTour = await tourService.getTourById(id);
                setTour(foundTour);

                if (foundTour) {
                    const schedules = await tourService.getTourSchedules(id);
                    const mainSchedule = schedules[0];
                    setSchedule(mainSchedule);

                    if (mainSchedule) {
                        try {
                            const slots = await tourBookingService.getAvailableSlots(mainSchedule.id);
                            setAvailableSlots(slots);
                        } catch (error) {
                            console.error('Error fetching available slots:', error);
                            setAvailableSlots(0);
                        }
                    }
                }
            } catch (error) {
                console.error('Error fetching tour details:', error);
                setTour(null);
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [id]);

    // Countdown timer for pending booking (10 minutes)
    useEffect(() => {
        if (!pendingBooking?.expires_at) return;

        const interval = setInterval(() => {
            const now = new Date();
            const expiresAt = new Date(pendingBooking.expires_at!);
            const diff = expiresAt.getTime() - now.getTime();

            if (diff <= 0) {
                // Booking expired
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

    // Require authentication
    useEffect(() => {
        if (!loading && !user) {
            navigate('/auth/login?returnTo=' + encodeURIComponent(window.location.pathname));
        }
    }, [loading, user, navigate]);

    // Calculate totals
    const totalPrice = (tour?.price || 0) * guestCount;
    const maxGuests = Math.min(availableSlots || 0, tour?.max_participants || 20);

    // Create Stripe PaymentIntent when booking is created
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
                    body: {
                        booking_id: pendingBooking.id,
                        booking_type: 'tour',
                    },
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                });

                if (error) {
                    const msg = String((error as any)?.message || error);
                    if (msg.includes('404') || msg.toLowerCase().includes('not found')) {
                        throw new Error(
                            'Payments are not deployed for this Supabase project (missing Edge Function: stripe-create-payment-intent).'
                        );
                    }
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
    }, [pendingBooking?.id, clientSecret, creatingPaymentIntent, totalPrice, tour?.currency, tour?.id, schedule?.id, user?.id, guestCount]);

    // Check Stripe availability
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

    const handleCreatePendingBooking = async () => {
        if (!user?.id || !tour?.id || !schedule?.id) {
            setBookingError('Missing required information');
            return;
        }

        if (guestCount > (availableSlots || 0)) {
            setBookingError('Not enough seats available');
            return;
        }

        setProcessingBooking(true);
        setBookingError(null);

        try {
            // Use safe booking creation with validation
            // This handles race conditions and validates capacity atomically
            const result = await createBookingWithValidation({
                tour_id: tour.id,
                schedule_id: schedule.id,
                traveler_id: user.id,
                pax_count: guestCount,
                total_price: totalPrice,
                metadata: {
                    tour_name: tour.title,
                    schedule_start: schedule.start_time,
                    guest_count: guestCount,
                },
            });

            setPendingBooking(result.booking);
            setClientSecret(null); // Reset client secret to trigger new payment intent

            // Payment form will be shown automatically via the useEffect
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to create booking hold';
            setBookingError(message);
            console.error('Booking creation error:', error);
        } finally {
            setProcessingBooking(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
        );
    }

    if (!tour || !schedule) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Tour not found</h1>
                <Button onClick={() => navigate(-1)} variant="default" className="rounded-2xl px-8 h-12 font-bold mt-8">
                    Back
                </Button>
            </div>
        );
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit'
        });
    };

    return (
        <div className="bg-gray-50 min-h-screen pb-20">
            {/* Header */}
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

            {/* Main Content */}
            <div className="max-w-5xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Booking Details */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Tour Summary */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"
                        >
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Tour Details</h2>
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">{tour.title}</h3>
                                    <div className="flex flex-wrap gap-6 text-sm text-gray-600 font-medium">
                                        <div className="flex items-center gap-2">
                                            <MapPin className="w-4 h-4 text-primary" />
                                            {tour.location.city}, {tour.location.country}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-primary" />
                                            {tour.duration}
                                        </div>
                                    </div>
                                </div>

                                {/* Schedule Info */}
                                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                                    <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">
                                        Your Departure
                                    </p>
                                    <p className="text-gray-900 font-bold">
                                        {formatDate(schedule.start_time)} at {formatTime(schedule.start_time)}
                                    </p>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Returns: {formatDate(schedule.end_time)}
                                    </p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Guest Selector */}
                        {!pendingBooking && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"
                            >
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">Select Number of Guests</h2>
                                <div className="space-y-4">
                                    <p className="text-sm text-gray-600 font-medium">
                                        Available seats: <span className="text-gray-900 font-bold">{availableSlots}</span>
                                    </p>

                                    {/* Guest Counter */}
                                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                                        <button
                                            onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
                                            disabled={guestCount <= 1}
                                            className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center font-bold text-gray-900 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            −
                                        </button>
                                        <div className="flex-1 text-center">
                                            <p className="text-3xl font-black text-gray-900">{guestCount}</p>
                                            <p className="text-xs text-gray-500 font-medium">{guestCount === 1 ? 'Guest' : 'Guests'}</p>
                                        </div>
                                        <button
                                            onClick={() => setGuestCount(Math.min(maxGuests, guestCount + 1))}
                                            disabled={guestCount >= maxGuests}
                                            className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center font-bold text-gray-900 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            +
                                        </button>
                                    </div>

                                    {availableSlots !== null && availableSlots < 5 && availableSlots > 0 && (
                                        <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg border border-orange-200">
                                            <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0" />
                                            <p className="text-sm text-orange-800 font-medium">
                                                Only {availableSlots} seat{availableSlots > 1 ? 's' : ''} left
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* Pending Booking / Payment State */}
                        {pendingBooking && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"
                            >
                                <div className="space-y-6">
                                    <div className="text-center">
                                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Clock className="w-8 h-8 text-primary" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Booking Hold Active</h3>
                                        <p className="text-gray-600 font-medium">Your seats are reserved for 10 minutes</p>
                                    </div>

                                    {/* Countdown Timer */}
                                    <div className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl border border-primary/20 text-center">
                                        <p className="text-sm text-gray-600 font-medium mb-2">Time Remaining</p>
                                        <div className="text-5xl font-black text-primary">
                                            {String(countdown.minutes).padStart(2, '0')}:{String(countdown.seconds).padStart(2, '0')}
                                        </div>
                                    </div>

                                    {/* Booking Details */}
                                    <div className="space-y-3 p-4 bg-gray-50 rounded-xl">
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-600 font-medium">Booking ID</span>
                                            <span className="font-mono text-sm font-bold text-gray-900">{pendingBooking.id.slice(0, 8).toUpperCase()}...</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-600 font-medium">Guests</span>
                                            <span className="font-bold text-gray-900">{pendingBooking.pax_count}</span>
                                        </div>
                                        <div className="h-px bg-gray-200" />
                                        <div className="flex items-center justify-between text-lg">
                                            <span className="text-gray-900 font-bold">Total Price</span>
                                            <span className="font-black text-primary">{tour.currency} {totalPrice.toFixed(2)}</span>
                                        </div>
                                    </div>

                                    {/* Stripe Payment Form */}
                                    <div className="space-y-4">
                                        {stripeAvailable === false ? (
                                            <div className="p-4 bg-red-50 rounded-xl border border-red-200 text-center">
                                                <p className="text-sm text-red-800 font-medium">
                                                    Payments are not configured.
                                                </p>
                                            </div>
                                        ) : !clientSecret ? (
                                            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 text-center">
                                                <Loader2 className="w-5 h-5 animate-spin text-primary inline-block mr-2" />
                                                <p className="text-sm text-blue-900 font-medium inline">
                                                    {creatingPaymentIntent ? 'Preparing secure payment...' : 'Loading payment form...'}
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                                                <Elements stripe={stripePromise} options={{ clientSecret }}>
                                                    <TourPaymentForm
                                                        bookingId={pendingBooking.id}
                                                        total={totalPrice}
                                                        currency={tour.currency}
                                                    />
                                                </Elements>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Error Messages */}
                        {bookingError && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3"
                            >
                                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                                <p className="text-sm text-red-800 font-medium">{bookingError}</p>
                            </motion.div>
                        )}
                    </div>

                    {/* Right Column: Price Summary */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24 space-y-6">
                            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Price Summary</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600 font-medium">
                                            {tour.currency} {tour.price} × {guestCount} {guestCount === 1 ? 'Guest' : 'Guests'}
                                        </span>
                                        <span className="text-gray-900 font-bold">{tour.currency} {totalPrice.toFixed(2)}</span>
                                    </div>
                                    <div className="h-px bg-gray-200" />
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-900 font-bold">Total</span>
                                        <span className="text-2xl font-black text-primary">{tour.currency} {totalPrice.toFixed(2)}</span>
                                    </div>
                                </div>

                                {!pendingBooking && (
                                    <Button
                                        onClick={handleCreatePendingBooking}
                                        disabled={processingBooking || (availableSlots !== null && guestCount > availableSlots)}
                                        className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold mt-6"
                                    >
                                        {processingBooking ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                                Creating Booking...
                                            </>
                                        ) : (
                                            <>
                                                Continue
                                                <ChevronRight className="w-4 h-4 ml-2" />
                                            </>
                                        )}
                                    </Button>
                                )}
                            </div>

                            {/* Trust Badges */}
                            <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-3">
                                <div className="flex items-center gap-3">
                                    <Shield className="w-5 h-5 text-green-600" />
                                    <span className="text-sm text-gray-600 font-medium">Secure Payment</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Lock className="w-5 h-5 text-green-600" />
                                    <span className="text-sm text-gray-600 font-medium">Data Protected</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Check className="w-5 h-5 text-green-600" />
                                    <span className="text-sm text-gray-600 font-medium">Instant Confirmation</span>
                                </div>
                            </div>

                            {/* Policy Info */}
                            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                                <p className="text-xs text-blue-900 font-medium leading-relaxed">
                                    <span className="font-bold">Free cancellation</span> up to 48 hours before departure. Your booking hold will expire in 10 minutes.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function TourPaymentForm(props: { bookingId: string; total: number; currency: string }) {
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
                `/booking/tour/confirmation?booking_id=${encodeURIComponent(props.bookingId)}`;

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
                    `/booking/tour/confirmation?booking_id=${encodeURIComponent(props.bookingId)}&payment_intent=${encodeURIComponent(paymentIntentId)}`
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
                className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 font-black text-lg shadow-xl shadow-primary/25"
                onClick={handlePay}
                disabled={!stripe || !elements || !paymentReady || submitting}
            >
                {submitting ? 'Processing...' : `Pay ${props.currency} ${Number(props.total || 0).toFixed(2)}`}
            </Button>
        </div>
    );
}
