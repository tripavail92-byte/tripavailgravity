# Tour Booking Hold System - Testing Guide

## System Overview

The tour booking system implements a **temporary hold mechanism** to manage inventory and prevent overbooking:

- **Fixed Schedules**: Each tour has ONE fixed departure date/time
- **Capacity Holding**: When a traveler clicks "Continue", their slots are temporarily reserved for 10 minutes
- **Permanent Booking**: Payment confirmation transitions the hold to a permanent booking
- **Auto-Expiry**: Unpaid holds automatically expire after 10 minutes, releasing slots to other travelers

---

## Test Scenarios

### Scenario 1: Basic Single Booking Flow ✓

**Setup:**
- Tour "5 day trip to hunza" with schedule capacity = 10 seats
- Current bookings: 0 (all slots available)

**Test Steps:**
1. Navigate to tour details page `/tours/{id}`
2. Verify schedule dates are displayed (not date picker)
3. Verify available seats = 10
4. Click "Continue to Booking"
5. Select 2 guests
6. Total price shows: price × 2
7. Click "Continue" button
8. Verify pending booking created with `expires_at` = NOW + 10 minutes
9. Countdown timer displays "10:00" and counts down
10. Verify in database: `tour_bookings.status = 'pending'`

**Expected Result:**
- Pages load correctly
- Countdown timer ticks down
- Booking ID displayed for reference

---

### Scenario 2: Capacity Validation - Test Race Condition Protection ⚠️

**Setup:**
- Tour capacity = 5 seats
- Create two browser tabs/windows
- Both logged in as different travelers

**Tab 1 Test:**
1. Open `/tours/{id}` - shows 5 available seats
2. Go to checkout, select 3 guests
3. PAUSE (don't click Continue yet)

**Tab 2 Test:**
1. Open same tour - might show 5 seats (not yet updated)
2. Go to checkout, select 2 guests
3. Click "Continue" → Booking created for 2 guests (capacity now 3 remaining)

**Tab 1 Resume:**
1. Click "Continue" to create booking for 3 guests
2. **Expected**: Should FAIL with error "Only 3 seats available, you requested 3"
   - OR succeed if exactly 3 remain
   - But verify the error message correctly reflects current capacity

**Database Verification:**
```sql
-- Verify final state
SELECT 
  schedule_id,
  COUNT(*) as total_pending,
  SUM(pax_count) as total_guests_pending
FROM tour_bookings
WHERE status = 'pending'
GROUP BY schedule_id;

-- Should show:
-- - Only valid bookings counted
-- - Total guests ≤ schedule capacity
```

**Expected Result:**
- System prevents overbooking
- Shows accurate available count
- Handles concurrent requests safely

---

### Scenario 3: 10-Minute Expiration & Auto-Cleanup 🔄

**Setup:**
- Create pending booking (should auto-expire in 10 minutes)

**Test Steps:**
1. Create pending booking with 2 guests
2. Note the `expires_at` timestamp from database
3. Wait for 10 minutes, or manually trigger cleanup job:
   ```typescript
   import { expireOldPendingBookings } from '@/features/booking';
   
   const result = await expireOldPendingBookings();
   console.log(`${result.expiredCount} bookings expired`);
   ```
4. Verify in database:
   ```sql
   SELECT * FROM tour_bookings 
   WHERE id = '{booking_id}';
   -- Should show: status = 'expired', expires_at < now
   ```

**Frontend Verification:**
1. Watch countdown timer reach "00:00"
2. Verify UI shows "Booking hold expired"
3. Must rebook to proceed

**Expected Result:**
- Pending booking transitions to `expired` status
- Slots are automatically freed
- Traveler must restart booking process

---

### Scenario 4: Payment Confirmation & Permanent Booking ✅

**Setup:**
- Pending booking exists (status = 'pending')
- Payment intent created via Stripe

**Test Steps:**
1. From TourCheckoutPage pending state, simulate payment success
2. Call `handlePaymentSuccess(paymentIntentId, bookingId)`
3. Redirect to `/booking/confirmation?payment_intent={id}&booking_id={id}`
4. Verify confirmation page loads with:
   - Confirmation number (booking ID)
   - Tour details
   - Departure dates
   - Price summary
   - Next steps guide
5. Check database:
   ```sql
   SELECT * FROM tour_bookings WHERE id = '{booking_id}';
   -- Should show:
   -- - status = 'confirmed'
   -- - payment_status = 'paid'
   -- - stripe_payment_intent_id = set
   -- - paid_at = timestamp
   ```

**Expected Result:**
- Booking transitions from pending → confirmed
- Slots are permanently locked
- Traveler sees confirmation details

---

### Scenario 5: Capacity Calculation Accuracy 📊

**Setup:**
- Multiple bookings at different stages

**Data Setup in Database:**
```sql
-- Insert test schedule
INSERT INTO tour_schedules (tour_id, start_time, end_time, capacity, booked_count, status)
VALUES ('{tour_id}', NOW() + '30 days', NOW() + '35 days', 20, 0, 'scheduled');

-- Create some bookings
-- Confirmed: 3 guests
INSERT INTO tour_bookings (tour_id, schedule_id, traveler_id, status, pax_count, total_price, expires_at)
VALUES ('{tour_id}', '{schedule_id}', '{user1}', 'confirmed', 3, 300, NULL);

-- Pending (active, not expired): 4 guests
INSERT INTO tour_bookings (tour_id, schedule_id, traveler_id, status, pax_count, total_price, expires_at)
VALUES ('{tour_id}', '{schedule_id}', '{user2}', 'pending', 4, 400, NOW() + '9 minutes');

-- Expired (should not count): 2 guests
INSERT INTO tour_bookings (tour_id, schedule_id, traveler_id, status, pax_count, total_price, expires_at)
VALUES ('{tour_id}', '{schedule_id}', '{user3}', 'pending', 2, 200, NOW() - '1 minute');
```

**Test Calculation:**
```typescript
import { tourBookingService } from '@/features/booking';

const available = await tourBookingService.getAvailableSlots(scheduleId);
// Expected: 20 - 3 confirmed - 4 active_pending = 13 available
// Expired (2 guests) should NOT be counted
console.log(`Available slots: ${available}`); // Should be 13
```

**SQL Verification:**
```sql
SELECT
  capacity,
  (SELECT COALESCE(SUM(pax_count), 0) FROM tour_bookings 
   WHERE schedule_id = ts.id AND status = 'confirmed') as confirmed,
  (SELECT COALESCE(SUM(pax_count), 0) FROM tour_bookings 
   WHERE schedule_id = ts.id AND status = 'pending' AND expires_at > NOW()) as active_pending,
  (capacity - COALESCE(
    (SELECT SUM(pax_count) FROM tour_bookings 
     WHERE schedule_id = ts.id AND status = 'confirmed'),
    0) - COALESCE(
    (SELECT SUM(pax_count) FROM tour_bookings 
     WHERE schedule_id = ts.id AND status = 'pending' AND expires_at > NOW()),
    0)) as available
FROM tour_schedules ts
WHERE id = '{schedule_id}';
-- Should show: capacity=20, confirmed=3, active_pending=4, available=13
```

**Expected Result:**
- Available slots = 13
- Expired bookings ignored
- Calculation matches formula: capacity - confirmed - active_pending

---

### Scenario 6: Double-Payment Prevention 🔒

**Setup:**
- Payment confirmed and booking transitioned to confirmed
- Attacker tries to confirm same payment again

**Test Steps:**
1. Setup confirmed booking
2. Call `handlePaymentSuccess()` again with same payment_intent_id
3. **Expected**: Should fail because booking is already `confirmed` (not pending)

**Implementation Check:**
```typescript
// From paymentSuccessHandler.ts
if (booking.status !== 'pending') {
  return {
    success: false,
    error: `Booking is already ${booking.status}`,
  };
}
```

**Expected Result:**
- Second payment attempt rejected
- Booking remains in confirmed state
- No duplicate payment processing

---

### Scenario 7: Stripe Webhook Processing (Optional) 🔔

**Setup:**
- Stripe webhook endpoint configured
- Payment webhook received from Stripe

**Test Steps:**
1. Simulate Stripe webhook: `payment_intent.succeeded`
2. Verify webhook endpoint receives and processes event
3. Check `payment_webhooks` table:
   ```sql
   SELECT * FROM payment_webhooks
   WHERE stripe_event_id = '{event_id}';
   -- Should show: processed = true, event_type = 'payment_intent.succeeded'
   ```
4. Verify booking updated with payment info

**Expected Result:**
- Webhook logged and processed
- Booking updated with payment confirmation
- Idempotent (same webhook processed once)

---

## Manual Testing Checklist

Use this checklist to validate the entire flow:

- [ ] **Tour Details Page**
  - [ ] Schedule dates display (not date picker)
  - [ ] Available seats show correct count
  - [ ] "Low inventory" warning shows when < 5 seats
  - [ ] "Sold Out" state when 0 seats
  - [ ] "Continue to Booking" button works

- [ ] **Checkout Page**
  - [ ] Guest counter works (1 to max available)
  - [ ] Price calculation correct
  - [ ] "Continue" button creates pending booking
  - [ ] Countdown timer starts at 10:00

- [ ] **Pending Booking State**
  - [ ] Booking ID displays
  - [ ] Countdown ticks down every second
  - [ ] Timer reaches 00:00 (or simulate expiry)
  - [ ] Shows "Booking hold expired" after timeout

- [ ] **Confirmation Page**
  - [ ] Shows after payment success
  - [ ] Displays booking confirmation number
  - [ ] Shows tour and schedule details
  - [ ] Shows payment amount and guests
  - [ ] Has download/print option

- [ ] **Database State**
  - [ ] Pending bookings have `expires_at` set
  - [ ] Confirmed bookings have `payment_status = 'paid'`
  - [ ] Payment intent ID linked correctly
  - [ ] Booked_count updated on schedule

- [ ] **Race Condition Safety**
  - [ ] Two concurrent bookings don't oversell
  - [ ] Error message shows accurate available seats
  - [ ] Validation happens before booking creation

---

## Debugging Commands

```typescript
// Check tour and schedule
SELECT t.id, t.title, ts.id as schedule_id, ts.capacity, ts.booked_count, ts.start_time
FROM tours t
LEFT JOIN tour_schedules ts ON t.id = ts.tour_id
WHERE t.title LIKE '%hunza%';

// Check all bookings for a schedule
SELECT id, traveler_id, status, pax_count, expires_at, payment_status
FROM tour_bookings
WHERE schedule_id = '{schedule_id}'
ORDER BY created_at DESC;

// Calculate current capacity
SELECT 
  get_available_slots('{schedule_id}'::uuid) as available_slots;

// Check expired bookings
SELECT id, status, expires_at
FROM tour_bookings
WHERE schedule_id = '{schedule_id}'
AND status = 'pending'
AND expires_at < NOW()
ORDER BY expires_at DESC;

// Manual expiry trigger (if needed)
UPDATE tour_bookings
SET status = 'expired'
WHERE schedule_id = '{schedule_id}'
AND status = 'pending'
AND expires_at < NOW();
```

---

## Troubleshooting

| Issue | Possible Cause | Solution |
|-------|---|---|
| Available slots not updating | Cache | Clear browser cache, refresh page |
| Pending booking not expiring | Job not running | Check if expiry job is scheduled |
| Booking fails with "RLS" error | Permission issue | Verify user is authenticated |
| Capacity calculation wrong | Expired bookings still counted | Check SQL formula ignores expired |
| Double booking possible | Race condition | Ensure atomic transaction at DB level |

---

## Performance Notes

- **Capacity Check**: Should complete in < 100ms (has indexes)
- **Booking Creation**: Should complete in < 500ms (single insert)
- **Confirmation Page Load**: Should complete in < 1s (2 queries)
- **Expiry Job**: Runs every 1-2 minutes, should process < 1s per 1000 bookings

---

## Next Steps (Stripe Integration)

Once you build the Stripe integration:
1. Replace `TODO: Stripe payment form` in TourCheckoutPage
2. Connect Stripe PaymentElement
3. Handle `payment_intent.succeeded` webhook
4. Redirect to confirmation page with query params
5. Process webhook to update payment status

Example (pseudo-code):
```typescript
// In TourCheckoutPage
const { confirmPayment } = useStripe();

const handlePaymentSubmit = async (stripePaymentIntentId: string) => {
  // Validate booking before payment
  const validation = await validateBookingBeforePayment(bookingId);
  if (!validation.isValid) throw new Error(validation.error);
  
  // Process payment with Stripe
  const result = await confirmPayment(stripePaymentIntentId);
  
  // Redirect to confirmation
  navigate(`/booking/confirmation?payment_intent=${stripePaymentIntentId}&booking_id=${bookingId}`);
};
```
