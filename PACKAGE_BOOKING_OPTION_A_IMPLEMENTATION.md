# Package Booking System - Option A Implementation

## ✅ Completed: Database Schema (Phase 1)

**Decision:** Fixed Package Configuration (Option A)
- Packages have pre-defined room configurations
- Simpler implementation (MVP in 1-2 weeks)
- Example: "Honeymoon Package" = Always 1 Deluxe Suite only

---

## 📊 Database Changes Applied

### Migration 1: Package-Hotel Linkage
**File:** `20260210_add_package_hotel_linkage.sql`

**Added to `packages` table:**
```sql
hotel_id UUID                  -- Links package to specific hotel
room_configuration JSONB       -- Fixed room config (see example below)
max_guests INT DEFAULT 2       -- Maximum guests allowed
base_price_per_night NUMERIC   -- Base nightly rate
minimum_nights INT DEFAULT 1   -- Min stay requirement
maximum_nights INT DEFAULT 30  -- Max stay allowed
```

**Example `room_configuration`:**
```json
{
  "rooms": [
    {"room_id": "uuid-123", "room_type": "deluxe", "count": 1},
    {"room_id": "uuid-456", "room_type": "standard", "count": 2}
  ],
  "max_guests": 6,
  "fixed_price": 1200
}
```

**Benefits:**
- Package creator defines room mix once during creation
- Traveler books package as-is (no room selection needed)
- Simple pricing calculation

---

### Migration 2: Package Bookings Hold System
**File:** `20260210_add_package_bookings_holds.sql`

**Added to `package_bookings` table:**
```sql
expires_at TIMESTAMPTZ                -- 10-minute hold expiration
stripe_payment_intent_id TEXT UNIQUE  -- Stripe payment tracking
payment_status TEXT                   -- unpaid, processing, paid, failed, refunded
paid_at TIMESTAMPTZ                   -- Payment completion timestamp
price_per_night NUMERIC               -- Locked-in price at booking time
number_of_nights INT                  -- Total nights booked
```

**Mirrors tour booking system:**
- Pending bookings expire after 10 minutes
- Prevents indefinite inventory holds
- Same payment flow as tours

---

### Migration 3: Availability Functions
**File:** `20260210_create_package_availability_functions.sql`

**SQL Functions Created:**

#### 1. `check_package_availability(package_id, check_in, check_out)`
**Purpose:** Validate if package available for date range

**Logic:**
```sql
SELECT COUNT(*) FROM package_bookings
WHERE package_id = :id
AND status IN ('confirmed', 'pending')
AND (expires_at > NOW() OR status = 'confirmed')  -- Active holds only
AND (check_in_date, check_out_date) OVERLAPS (:new_check_in, :new_check_out);

-- Returns false if ANY overlap found
```

**Prevents:**
- Overbooking (only 1 booking per package at a time)
- Date conflicts (no overlapping reservations)

---

#### 2. `calculate_package_price(package_id, check_in, check_out)`
**Purpose:** Server-side price calculation (never trust frontend)

**Formula:**
```
total_price = base_price_per_night × number_of_nights
```

**Returns:**
```json
{
  "total_price": 1200,
  "price_per_night": 400,
  "number_of_nights": 3
}
```

---

#### 3. `create_package_booking_atomic(package_id, traveler_id, dates, guests)`
**Purpose:** Create booking with atomic validation (prevents race conditions)

**Transaction Flow:**
1. Lock package row (`SELECT ... FOR UPDATE`)
2. Validate package published
3. Check minimum/maximum nights
4. Check max_guests
5. Verify availability (no overlaps)
6. Calculate pricing server-side
7. Create booking with `expires_at = NOW() + 10 minutes`
8. Commit transaction

**Safety:**
- Row-level lock prevents concurrent bookings
- All validations in single transaction
- Returns booking_id or raises exception

---

#### 4. `expire_package_bookings()`
**Purpose:** Auto-cleanup expired pending bookings (scheduled job)

**Logic:**
```sql
UPDATE package_bookings
SET status = 'expired'
WHERE status = 'pending'
AND expires_at < NOW();
```

**Should run:** Every 1-2 minutes via cron/scheduler

---

## 🔄 How It Works: Booking Flow

### Traveler Side:

1. **Browse Package Details**
   - View package: "Honeymoon Suite Package"
   - See: "Includes 1 Deluxe Suite, 2 nights minimum, $400/night"
   - Select check-in: March 10, 2026
   - Select check-out: March 13, 2026 (3 nights)

2. **Create Booking**
   - Frontend calls: `create_package_booking_atomic()`
   - Database validates:
     ✅ Package published
     ✅ 3 nights (meets 2-night minimum)
     ✅ No overlapping bookings for Mar 10-13
     ✅ Calculate price: $400 × 3 = $1200
   - Creates booking:
     - Status: `pending`
     - Expires at: 10:05 AM (10 minutes from 9:55 AM)
     - Total price: $1200

3. **Checkout Page**
   - Shows countdown timer: "9:45 remaining"
   - Guest enters details
   - Completes payment via Stripe

4. **Payment Success**
   - Webhook validates: `expires_at > NOW()` ✅
   - Updates booking:
     - Status: `pending` → `confirmed`
     - Payment status: `unpaid` → `paid`
     - Paid at: NOW()
   - Booking confirmed!

5. **If Timer Expires**
   - User abandons cart
   - Auto-expiry job runs at 10:05 AM
   - Updates status: `pending` → `expired`
   - Package becomes available again for others

---

## ⚠️ Edge Cases Handled

### 1. Race Condition: Two Users Book Simultaneously
**Scenario:**
- User A: Tries to book Mar 10-13
- User B: Tries to book Mar 10-13 (same dates!)
- Both click "Continue" at 9:55:00 AM

**Solution:**
- Both call `create_package_booking_atomic()`
- Database uses row-level lock (`SELECT ... FOR UPDATE`)
- User A acquires lock first → Booking created
- User B waits for lock → Sees User A's booking → Validation fails
- User B gets error: "Package not available for selected dates"

---

### 2. Partial Expiry
**Scenario:**
- User A: Booked Mar 10-15, expires at 10:05 AM
- User B: Tries to book Mar 12-17 at 10:03 AM (2 min before expiry)

**Solution:**
- `check_package_availability()` checks: `expires_at > NOW()`
- User A's booking still active: 10:05 AM > 10:03 AM
- Conflict detected: Mar 12-17 overlaps with Mar 10-15
- User B blocked until 10:05 AM

---

### 3. Minimum/Maximum Night Validation
**Scenario:**
- Package: Minimum 2 nights, Maximum 30 nights
- User: Tries to book 1 night (Mar 10-11)

**Solution:**
- `create_package_booking_atomic()` calculates: `nights = 11 - 10 = 1`
- Validation: `1 < 2` (fails minimum)
- Raises exception: "Minimum 2 nights required"
- User sees error, adjusts dates

---

### 4. Check-in/Check-out Same Day
**Scenario:**
- Booking 1: Check-out Mar 15
- Booking 2: Check-in Mar 15
- Do they conflict?

**Solution (Recommended):**
- Use DATE only (ignore time)
- Check-out date NOT blocked (available for next check-in)
- SQL overlap logic:
  ```sql
  -- Night counted if: check_in_date::date <= night < check_out_date::date
  -- Mar 15 check-out: Nights are Mar 10, 11, 12, 13, 14 (stops before 15)
  -- Mar 15 check-in: Can start (no conflict)
  ```

---

## 📋 Next Steps: Backend Services

### Still TODO (Priority Order):

**1. Update Package Booking Service** (TypeScript)
- [ ] Build `packageBookingService.createPendingBooking()`
- [ ] Build `packageBookingService.confirmBooking()`
- [ ] Build `packageBookingService.checkAvailability()`
- [ ] Build `packageBookingService.expirePendingBookings()`

**2. Build Validation Service**
- [ ] `validatePackageAvailability()`
- [ ] `createPackageBookingWithValidation()` (calls atomic function)

**3. Update Payment Success Handler**
- [ ] Add package booking validation
- [ ] Check `expires_at > NOW()` before confirming
- [ ] Same flow as tours

**4. Update Auto-Expiry Job**
- [ ] Add `packageBookingService.expirePendingBookings()` to job
- [ ] Currently only expires tours, needs to expire packages too

**5. Frontend Pages**
- [ ] PackageDetailsPage: Date picker, availability check
- [ ] PackageCheckoutPage: 10-min timer, guest form
- [ ] BookingConfirmationPage: Success message

**6. Testing**
- [ ] Test date overlap scenarios
- [ ] Test simultaneous bookings (race conditions)
- [ ] Test expiration flow
- [ ] Test minimum/maximum night validation

---

## 🎯 Implementation Timeline

**Phase 1: Database ✅ DONE (Today)**
- Migrations created
- Functions implemented
- Ready to deploy

**Phase 2: Backend Services (2-3 days)**
- Package booking service
- Validation layer
- Payment handler updates

**Phase 3: Frontend Pages (3-4 days)**
- Details page with date picker
- Checkout flow with timer
- Confirmation page

**Phase 4: Testing & Deployment (2-3 days)**
- End-to-end testing
- Edge case validation
- Production deployment

**Total: ~1-2 weeks for MVP** ✅

---

## 🚀 Deployment Instructions

### Step 1: Apply Migrations
```bash
# Connect to Supabase
cd d:/Tripfinal

# Run migrations in order
supabase db push

# Or manually via Supabase Dashboard > SQL Editor:
# 1. Run 20260210_add_package_hotel_linkage.sql
# 2. Run 20260210_add_package_bookings_holds.sql
# 3. Run 20260210_create_package_availability_functions.sql
```

### Step 2: Verify Functions
```sql
-- Test availability check
SELECT check_package_availability(
  'package-uuid',
  '2026-03-10 15:00:00',
  '2026-03-13 11:00:00'
);
-- Should return: true (if no conflicts)

-- Test price calculation
SELECT * FROM calculate_package_price(
  'package-uuid',
  '2026-03-10',
  '2026-03-13'
);
-- Should return: {total_price, price_per_night, number_of_nights}
```

### Step 3: Update Existing Packages
```sql
-- Add base prices to existing packages
UPDATE packages
SET base_price_per_night = 400,
    minimum_nights = 2,
    maximum_nights = 30,
    max_guests = 4
WHERE base_price_per_night IS NULL;
```

### Step 4: Set Up Auto-Expiry Job
**Option A: Supabase Edge Function**
```typescript
// Create function: expire-package-bookings
import { createClient } from '@supabase/supabase-js'

Deno.serve(async () => {
  const supabase = createClient(...)
  
  const { data } = await supabase.rpc('expire_package_bookings')
  
  return new Response(JSON.stringify({ expired: data }))
})

// Schedule: Run every 2 minutes
```

**Option B: External Cron Job**
```bash
# Add to crontab: */2 * * * *
curl -X POST https://your-api.com/cron/expire-bookings
```

---

## 📊 Comparison: Tours vs Packages

| Feature | Tours | Packages (Option A) |
|---------|-------|---------------------|
| **Inventory Model** | Fixed schedules | Fixed packages |
| **Date Selection** | Operator chooses | Traveler chooses |
| **Validation Logic** | `guests ≤ capacity` | `NO date overlaps` |
| **Hold System** | 10-min expiration ✅ | 10-min expiration ✅ |
| **Price Calculation** | `price × guests` | `price × nights` |
| **Database Schema** | tour_schedules | packages + room_configuration |
| **Complexity** | Medium | Medium (same level) |

---

## ✅ Benefits of Option A

1. **Simple & Fast:** MVP in 1-2 weeks
2. **No Complex Inventory:** No per-room, per-night tracking needed
3. **Familiar Pattern:** Mirrors tour booking flow
4. **Flexible Enough:** Supports fixed room mixes (1 Deluxe + 2 Standard)
5. **Upgradeable:** Can migrate to Option B later if needed

---

## 🔄 Future: Upgrade to Option B (If Needed)

If business evolves to need:
- Traveler-selectable room types
- Per-room, per-night inventory
- Dynamic pricing
- Real hotel booking platform features

Then migrate to Option B:
- Create `package_room_types` table
- Create `package_availability` table
- Build per-night availability checking
- More complex, but full-featured

**But for now:** Option A is perfect ✅

---

## 📝 Summary

**What We Built:**
- Fixed package configuration system
- 10-minute booking holds
- Date overlap validation
- Atomic booking creation (race-safe)
- Server-side pricing
- Auto-expiry mechanism

**What's Next:**
- Backend services (TypeScript)
- Frontend pages (React)
- Testing & deployment

**Timeline:** 1-2 weeks to production-ready MVP ✅
