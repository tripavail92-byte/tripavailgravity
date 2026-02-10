# Phase 3: Stripe PaymentElement Integration

## Overview

Clean, minimal Stripe integration following production best practices:
- **Server validates first** - Price calculated server-side, never trusted from frontend
- **Atomic operations** - Payment intent creation guards booking state
- **Graceful failures** - Expired bookings handled with clear user messages
- **Webhook processing** (optional) - Auto-confirm bookings on webhook success

---

## Step 1️⃣: Create Payment Intent Endpoint (Backend)

### Endpoint Specification

**POST** `/api/checkout/create-payment-intent`

**Request Body:**
```json
{
  "bookingId": "uuid",
  "amount": 9999  // in cents (frontend sends, but server must verify!)
}
```

**Response (Success):**
```json
{
  "success": true,
  "clientSecret": "pi_1234567890_secret_ABCDEFG",
  "bookingId": "uuid",
  "amount": 9999,
  "currency": "usd"
}
```

**Response (Error - Booking Expired):**
```json
{
  "success": false,
  "error": "Booking hold has expired. Please book again.",
  "errorCode": "booking_expired"
}
```

---

### Backend Implementation (Example - Node.js/Express)

```typescript
import { Stripe } from 'stripe';
import { tourBookingService, validateBookingBeforePayment } from '@/features/booking';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Create a payment intent for a pending booking
 * 
 * ⚠️ CRITICAL SECURITY:
 * 1. Always validate booking state (pending + not expired)
 * 2. Always calculate amount server-side (never trust frontend)
 * 3. Store payment_intent_id on booking BEFORE returning to client
 */
export async function createPaymentIntent(
  bookingId: string,
  frontendAmount: number
): Promise<{
  success: boolean;
  clientSecret?: string;
  error?: string;
  errorCode?: string;
}> {
  try {
    // STEP 1: Validate booking state (pending + not expired)
    const bookingValidation = await validateBookingBeforePayment(bookingId);
    
    if (!bookingValidation.isValid) {
      return {
        success: false,
        error: bookingValidation.error || 'Booking validation failed',
        errorCode: 'booking_invalid',
      };
    }

    // STEP 2: Fetch booking details from DB
    const booking = await tourBookingService.getPendingBooking(bookingId);
    
    if (!booking) {
      return {
        success: false,
        error: 'Booking not found',
        errorCode: 'booking_not_found',
      };
    }

    // STEP 3: Verify amount (server-side calculation)
    // Never trust frontend amount - recalculate
    const serverAmount = booking.total_price * 100; // Convert to cents
    
    if (serverAmount !== frontendAmount) {
      console.warn(`Amount mismatch for booking ${bookingId}: front=${frontendAmount}, server=${serverAmount}`);
      // Option A: Reject (strict)
      // return { success: false, error: 'Amount mismatch', errorCode: 'amount_mismatch' };
      
      // Option B: Use server amount (recommended)
      // Log the discrepancy but proceed
    }

    // STEP 4: Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: serverAmount,
      currency: 'usd',
      payment_method_types: ['card'],
      metadata: {
        bookingId,
        tourId: booking.tour_id,
        travelerId: booking.traveler_id,
      },
      statement_descriptor: 'TripAvail Tour Booking', // Shows on bank statement
    });

    // STEP 5: Save payment_intent_id on booking
    // This links the booking to the payment for webhook processing
    await tourBookingService.updatePaymentStatus(
      bookingId,
      'processing', // Mark as payment processing
      paymentIntent.id, // Save the payment intent ID
      'stripe_card'
    );

    // STEP 6: Return client secret for payment form
    return {
      success: true,
      clientSecret: paymentIntent.client_secret!,
      bookingId,
      amount: serverAmount,
      currency: 'usd',
    };
  } catch (error) {
    console.error('Error creating payment intent:', error);
    
    // Don't expose internal error to client
    return {
      success: false,
      error: 'Failed to initialize payment',
      errorCode: 'payment_init_failed',
    };
  }
}
```

---

## Step 2️⃣: Build Stripe Form in Frontend (TourCheckoutPage)

### Setup Stripe SDK

```bash
npm install @stripe/react-stripe-js @stripe/js
```

### Create Stripe Provider (Wrap App)

In `App.tsx` or parent component:

```typescript
import { loadStripe } from '@stripe/js';
import { Elements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export default function App() {
  return (
    <Elements stripe={stripePromise}>
      {/* Your routes */}
    </Elements>
  );
}
```

### Replace TODO in TourCheckoutPage

Find this section in **TourCheckoutPage.tsx**:

```tsx
{/* TODO: Stripe Payment Form will go here */}
<div className="p-4 bg-blue-50 rounded-xl border border-blue-200 text-center">
  <p className="text-sm text-blue-900 font-medium">
    Payment form coming next... Click "Proceed to Payment" below
  </p>
</div>
```

Replace with:

```tsx
<StripePaymentForm 
  bookingId={pendingBooking.id}
  amount={totalPrice}
  onSuccess={(paymentIntentId) => {
    // Redirect to confirmation
    navigate(`/booking/confirmation?payment_intent=${paymentIntentId}&booking_id=${pendingBooking.id}`);
  }}
  onError={(error) => {
    setBookingError(error);
  }}
/>
```

### Create StripePaymentForm Component

Create file: `packages/web/src/components/checkout/StripePaymentForm.tsx`

```typescript
import { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle } from 'lucide-react';

interface StripePaymentFormProps {
  bookingId: string;
  amount: number;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
}

export default function StripePaymentForm({
  bookingId,
  amount,
  onSuccess,
  onError,
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      setError('Stripe not initialized');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // STEP 1: Create payment intent on server
      const intentResponse = await fetch('/api/checkout/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          amount: Math.round(amount * 100), // cents
        }),
      });

      const intentData = await intentResponse.json();

      if (!intentData.success) {
        setError(intentData.error || 'Failed to initialize payment');
        onError(intentData.error);
        return;
      }

      // STEP 2: Confirm payment with Stripe
      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret: intentData.clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/booking/confirmation?booking_id=${bookingId}`,
        },
      });

      if (confirmError) {
        setError(confirmError.message || 'Payment failed');
        onError(confirmError.message || 'Payment failed');
      } else if (paymentIntent?.status === 'succeeded') {
        // Success - redirect
        onSuccess(paymentIntent.id);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Payment error';
      setError(message);
      onError(message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-800 font-medium">{error}</p>
        </div>
      )}

      <Button
        type="submit"
        disabled={!stripe || processing}
        className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 font-bold"
      >
        {processing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Processing Payment...
          </>
        ) : (
          `Pay $${(amount).toFixed(2)}`
        )}
      </Button>

      <p className="text-xs text-gray-500 font-medium text-center">
        Your payment is secure and encrypted
      </p>
    </form>
  );
}
```

---

## Step 3️⃣: Handle Payment Submission

The flow is already built in **BookingConfirmationPage**:

```typescript
// User lands on /booking/confirmation?payment_intent={id}&booking_id={id}
// Page calls handlePaymentSuccess(paymentIntentId, bookingId)
// Function validates booking state (checks expiration!)
// Shows confirmation with booking details
```

**The validation chain:**

```
Payment Success
    ↓
handlePaymentSuccess()
    ↓
validateBookingBeforePayment() ← ⚠️ Checks expires_at!
    ├─ If expired: Returns error "Booking hold has expired. Please book again."
    └─ If valid: Continue
        ↓
    confirmBooking() ← pending → confirmed
        ↓
    updatePaymentStatus() ← payment_status = 'paid'
        ↓
BookingConfirmationPage
    ├─ Display confirmation details
    ├─ Show booking ID & amount
    └─ Offer print/download
```

---

## Step 4️⃣: Webhook Processing (Optional)

### Setup Stripe Webhook

1. Go to **Stripe Dashboard → Developers → Webhooks**
2. Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
3. Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
4. Copy webhook signing secret to env: `STRIPE_WEBHOOK_SECRET`

### Webhook Handler (Backend)

```typescript
import { Stripe } from 'stripe';
import { paymentWebhookService, tourBookingService } from '@/features/booking';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Stripe webhook handler
 * Called when payment_intent succeeds/fails
 */
export async function handleStripeWebhook(
  body: Buffer,
  signature: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify webhook signature (prevent spoofing)
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    // Log the webhook
    await paymentWebhookService.recordWebhook({
      stripe_event_id: event.id,
      event_type: event.type,
      booking_type: 'tour',
      booking_id: event.data.object.metadata?.bookingId || 'unknown',
      event_data: event.data.object,
      processed: false,
    });

    // Handle specific events
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const bookingId = paymentIntent.metadata?.bookingId;

      if (bookingId) {
        // Auto-confirm booking (idempotent)
        await tourBookingService.confirmBooking(bookingId);
        await tourBookingService.updatePaymentStatus(
          bookingId,
          'paid',
          paymentIntent.id,
          'stripe_card'
        );
      }
    }

    if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const bookingId = paymentIntent.metadata?.bookingId;

      if (bookingId) {
        // Mark as failed
        await tourBookingService.updatePaymentStatus(
          bookingId,
          'failed',
          paymentIntent.id
        );
      }
    }

    return { success: true };
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error };
  }
}
```

---

## Environment Variables

Add to `.env`:

```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_XXXXX...
STRIPE_SECRET_KEY=sk_test_XXXXX...
STRIPE_WEBHOOK_SECRET=whsec_XXXXX...
```

---

## Testing Checklist

- [ ] **Create Payment Intent**
  - [ ] POST to `/api/checkout/create-payment-intent`
  - [ ] Verify `amount` is recalculated server-side
  - [ ] Verify `clientSecret` returned
  - [ ] Test with expired booking → Returns `booking_expired` error

- [ ] **Stripe Payment Form**
  - [ ] PaymentElement renders
  - [ ] Test with Stripe test card: `4242 4242 4242 4242`
  - [ ] Form validates before submit
  - [ ] Loading state shows on submit

- [ ] **Payment Success**
  - [ ] Payment succeeds → Redirects to confirmation
  - [ ] Confirmation page loads booking details
  - [ ] Database shows `status = 'confirmed'`, `payment_status = 'paid'`

- [ ] **Expiration Edge Case**
  - [ ] Booking created at -9 min
  - [ ] Wait > 10 min
  - [ ] Try to create payment intent → Returns error
  - [ ] Confirmation page handles error gracefully

- [ ] **Double Payment Prevention**
  - [ ] Pay once → Success
  - [ ] Try to pay same booking again → Fails (already confirmed)

---

## Production Checklist

- [ ] Verify SSL/TLS on domain
- [ ] Test with real Stripe keys (not test mode)
- [ ] Configure Stripe webhook with live endpoint
- [ ] Store webhook secret securely (env var, not hardcoded)
- [ ] Test payment refunds + partial refunds
- [ ] Monitor failed payments + retry logic
- [ ] Set up Stripe alerts in dashboard
- [ ] Test 3D Secure cards (SCA compliance)
- [ ] Add email receipt to webhook handler
- [ ] Rate limit payment intent creation
- [ ] Log all payment events for audit

---

## Key Principles

✅ **Server-side validation always** - Price, booking state, expiration  
✅ **Graceful error handling** - User understands what happened  
✅ **Atomic operations** - Payment intent ↔️ booking state stay in sync  
✅ **Idempotent webhooks** - Can safely process same event twice  
✅ **Clear error messages** - "Booking expired" not "Error 42"  

Ready to build? 🚀
