# Hotel Package Booking - Critical Analysis

## 🚨 Current State Assessment

### What Exists
```sql
-- packages table
id, owner_id, package_type, name, description, media, highlights, 
inclusions, exclusions, is_published, created_at, updated_at

-- package_bookings table  
id, package_id, traveler_id, status, total_price, guest_count,
check_in_date, check_out_date, booking_date, metadata, 
stripe_payment_intent_id, payment_status, paid_at
```

### ❌ Critical Missing Components

| Issue | Current State | Required |
|-------|--------------|----------|
| **Inventory Model** | ❌ No capacity/rooms tracking | ✅ Per-package room inventory |
| **Availability Tracking** | ❌ No per-night availability | ✅ Date-based availability table |
| **Hold System** | ❌ No `expires_at` field | ✅ 10-min temporary holds |
| **Overbooking Prevention** | ❌ No validation | ✅ Atomic capacity checks |
| **Date Conflict Detection** | ❌ No overlap checking | ✅ Prevent double-booking same dates |
| **Price Calculation** | ❌ Frontend only | ✅ Server-side per-night pricing |
| **Room Types** | ❌ Single unit assumed | ✅ Different room categories |

---

## 🔍 Fundamental Difference: Tours vs Packages

### Tour Booking Model (✅ Implemented)
```
Tour → tour_schedules (ONE fixed departure)
       ├── start_time: 2026-03-15 08:00
       ├── end_time: 2026-03-20 18:00
       ├── capacity: 20 seats
       └── booked_count: auto-calculated

Traveler Action: Select guest count (no date choice)
Validation: guest_count ≤ available_slots
Formula: available = capacity - SUM(confirmed) - SUM(active_pending)
```

### Package Booking Model (❌ Not Implemented)
```
Package → package_inventory (Multiple date ranges possible)
          └── Room 101 - Deluxe Suite
              ├── 2026-03-01 to 2026-03-10: Available
              ├── 2026-03-11 to 2026-03-15: Blocked (maintenance)
              ├── 2026-03-16 to 2026-03-31: Available

Traveler Action: Choose check_in + check_out dates + rooms/guests
Validation: 
  - All nights in range available?
  - Room capacity not exceeded?
  - No overlapping bookings?
Formula: Complex - must check EVERY NIGHT in date range
```

---

## 🏗️ Required Architecture

### Option A: Simple Model (Single Room Type)

**Assumption:** Each package = ONE bookable unit (like an Airbnb listing)

**Schema:**
```sql
-- Add to packages table
ALTER TABLE packages
ADD COLUMN max_guests INT DEFAULT 2,
ADD COLUMN base_price_per_night NUMERIC NOT NULL,
ADD COLUMN available_from TIMESTAMPTZ,
ADD COLUMN available_until TIMESTAMPTZ;

-- Add to package_bookings (same as tours)
ALTER TABLE package_bookings
ADD COLUMN expires_at TIMESTAMPTZ; -- 10-min hold
```

**Capacity Logic:**
```sql
-- Check if dates are available (no overlapping confirmed/pending bookings)
SELECT COUNT(*) FROM package_bookings
WHERE package_id = :package_id
AND status IN ('confirmed', 'pending')
AND expires_at > NOW() -- Active holds only
AND (
  -- Check for date overlap
  (check_in_date, check_out_date) OVERLAPS (:new_check_in, :new_check_out)
);
-- If count > 0, dates NOT available (conflict exists)
```

**Pros:**
- Simple to implement
- Works for vacation rentals, villas, single-property packages
- Easy to understand

**Cons:**
- Can't handle hotels with multiple rooms of same type
- Can't do partial availability (some rooms available, some not)

---

### Option B: Multi-Room Model (Hotel-Style)

**Assumption:** Package has multiple rooms/units of different types

**Schema:**
```sql
-- Room type definitions
CREATE TABLE package_room_types (
  id UUID PRIMARY KEY,
  package_id UUID REFERENCES packages(id),
  name TEXT NOT NULL, -- "Deluxe Suite", "Standard Room"
  description TEXT,
  max_guests INT NOT NULL,
  base_price_per_night NUMERIC NOT NULL,
  total_units INT NOT NULL, -- How many of this room type exist
  amenities TEXT[]
);

-- Per-night inventory tracking
CREATE TABLE package_availability (
  id UUID PRIMARY KEY,
  room_type_id UUID REFERENCES package_room_types(id),
  date DATE NOT NULL,
  available_units INT NOT NULL, -- How many units available this date
  price_override NUMERIC, -- Optional dynamic pricing
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'blocked')),
  UNIQUE(room_type_id, date)
);

-- Update package_bookings
ALTER TABLE package_bookings
ADD COLUMN room_type_id UUID REFERENCES package_room_types(id),
ADD COLUMN rooms_count INT DEFAULT 1, -- How many rooms booked
ADD COLUMN expires_at TIMESTAMPTZ; -- 10-min hold

-- Index for fast date range queries
CREATE INDEX idx_availability_date_range 
ON package_availability(room_type_id, date);
```

**Capacity Logic:**
```sql
-- Check if X rooms available for entire date range
WITH date_series AS (
  SELECT generate_series(
    :check_in_date::date,
    :check_out_date::date - interval '1 day',
    interval '1 day'
  )::date AS night
),
availability_per_night AS (
  SELECT 
    ds.night,
    pa.available_units - COALESCE(
      (SELECT SUM(pb.rooms_count) 
       FROM package_bookings pb
       WHERE pb.room_type_id = :room_type_id
       AND pb.status IN ('confirmed', 'pending')
       AND (pb.status != 'pending' OR pb.expires_at > NOW())
       AND ds.night >= pb.check_in_date::date
       AND ds.night < pb.check_out_date::date),
      0
    ) AS available_this_night
  FROM date_series ds
  LEFT JOIN package_availability pa 
    ON pa.room_type_id = :room_type_id 
    AND pa.date = ds.night
)
SELECT MIN(available_this_night) AS min_available_across_stay
FROM availability_per_night;

-- If min_available_across_stay >= :requested_rooms, booking allowed
```

**Pros:**
- Handles real hotel inventory
- Supports multiple room types
- Per-night dynamic pricing
- Can block dates for maintenance

**Cons:**
- Complex queries (slower)
- More tables to maintain
- Harder to understand

---

## 🎯 Recommended: Start with Option A (Simple)

**Why:**
1. Your current `packages` table structure suggests single-unit model
2. Easier to implement and test
3. Can upgrade to Option B later if needed
4. Matches your tour booking approach (single inventory unit)

**Implementation Matches Tours:**
```
Tours:         ONE schedule → capacity → guest count selection
Packages:      ONE unit → dates unavailable when booked → date range selection
```

---

## 📋 Critical Fixes Required (Option A)

### 1. Add Hold System to Packages

```sql
-- Migration: Add expires_at to package_bookings
ALTER TABLE public.package_bookings
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Add index for expiration queries
CREATE INDEX IF NOT EXISTS idx_package_bookings_expires_at 
ON public.package_bookings(expires_at) 
WHERE status = 'pending';
```

### 2. Add Capacity Fields to Packages

```sql
-- Migration: Add inventory fields to packages
ALTER TABLE public.packages
ADD COLUMN IF NOT EXISTS max_guests INT DEFAULT 2,
ADD COLUMN IF NOT EXISTS base_price_per_night NUMERIC,
ADD COLUMN IF NOT EXISTS minimum_nights INT DEFAULT 1,
ADD COLUMN IF NOT EXISTS maximum_nights INT DEFAULT 30;
```

### 3. Build Availability Check Function

```sql
-- Check if package is available for date range
CREATE OR REPLACE FUNCTION check_package_availability(
  package_id_param UUID,
  check_in_param TIMESTAMPTZ,
  check_out_param TIMESTAMPTZ
)
RETURNS BOOLEAN AS $$
DECLARE
  conflict_count INT;
BEGIN
  -- Count overlapping bookings (confirmed + active pending)
  SELECT COUNT(*) INTO conflict_count
  FROM public.package_bookings
  WHERE package_id = package_id_param
  AND status IN ('confirmed', 'pending')
  AND (status != 'pending' OR expires_at > NOW())
  AND (check_in_date, check_out_date) OVERLAPS (check_in_param, check_out_param);
  
  RETURN conflict_count = 0;
END;
$$ LANGUAGE plpgsql STABLE;
```

### 4. Update Package Booking Service

```typescript
// packages/web/src/features/booking/services/bookingService.ts

export const packageBookingService = {
  // Check if package available for dates
  async checkAvailability(
    packageId: string,
    checkIn: string,
    checkOut: string
  ): Promise<boolean> {
    const { data, error } = await supabase.rpc('check_package_availability', {
      package_id_param: packageId,
      check_in_param: checkIn,
      check_out_param: checkOut,
    });

    if (error) throw error;
    return data as boolean;
  },

  // Create pending package booking with 10-min hold
  async createPendingBooking(params: {
    package_id: string;
    traveler_id: string;
    check_in_date: string;
    check_out_date: string;
    guest_count: number;
    total_price: number;
    metadata?: any;
  }): Promise<PackageBooking> {
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const booking: Omit<PackageBooking, 'id' | 'booking_date'> = {
      package_id: params.package_id,
      traveler_id: params.traveler_id,
      check_in_date: params.check_in_date,
      check_out_date: params.check_out_date,
      guest_count: params.guest_count,
      total_price: params.total_price,
      status: 'pending',
      expires_at: expiresAt.toISOString(),
      payment_status: 'unpaid',
      metadata: params.metadata || {},
    };

    const { data, error } = await supabase
      .from('package_bookings')
      .insert(booking)
      .select()
      .single();

    if (error) throw error;
    return data as PackageBooking;
  },

  // Confirm booking after payment
  async confirmBooking(bookingId: string): Promise<PackageBooking> {
    const { data, error } = await supabase
      .from('package_bookings')
      .update({
        status: 'confirmed',
        payment_status: 'paid',
      })
      .eq('id', bookingId)
      .eq('status', 'pending')
      .select()
      .single();

    if (error) throw error;
    return data as PackageBooking;
  },

  // Auto-expire old pending bookings
  async expirePendingBookings(): Promise<number> {
    const { data, error } = await supabase
      .from('package_bookings')
      .update({ status: 'expired' })
      .eq('status', 'pending')
      .lt('expires_at', new Date().toISOString())
      .select();

    if (error) throw error;
    return (data as any[]).length;
  },
};
```

### 5. Add Validation with Race Condition Prevention

```typescript
// Similar to tours but checks date overlap instead of capacity
export async function validatePackageAvailability(
  packageId: string,
  checkIn: string,
  checkOut: string
): Promise<{ isAvailable: boolean; error?: string }> {
  try {
    const available = await packageBookingService.checkAvailability(
      packageId,
      checkIn,
      checkOut
    );

    if (!available) {
      return {
        isAvailable: false,
        error: 'Package not available for selected dates',
      };
    }

    return { isAvailable: true };
  } catch (error) {
    return {
      isAvailable: false,
      error: error instanceof Error ? error.message : 'Validation failed',
    };
  }
}

export async function createPackageBookingWithValidation(params: {
  package_id: string;
  traveler_id: string;
  check_in_date: string;
  check_out_date: string;
  guest_count: number;
  total_price: number;
  metadata?: any;
}) {
  // Validate availability before creating
  const validation = await validatePackageAvailability(
    params.package_id,
    params.check_in_date,
    params.check_out_date
  );

  if (!validation.isAvailable) {
    throw new Error(validation.error || 'Package not available');
  }

  // Create booking atomically
  try {
    const booking = await packageBookingService.createPendingBooking(params);
    return {
      success: true,
      booking,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorMsg.includes('conflict') || errorMsg.includes('overlap')) {
      throw new Error('Package was just booked by someone else. Please try different dates.');
    }

    throw error;
  }
}
```

---

## 🚧 Key Differences from Tours

| Aspect | Tours | Packages |
|--------|-------|----------|
| **Date Selection** | Operator sets (fixed) | Traveler chooses (flexible) |
| **Capacity Check** | Count guests on ONE schedule | Check date RANGE for conflicts |
| **Validation Query** | `SUM(pax_count) ≤ capacity` | `NO OVERLAPS with existing bookings` |
| **Price Calculation** | `price × guests` | `price_per_night × nights × rooms` |
| **Expiry Impact** | Frees X slots on ONE schedule | Frees date range (makes dates available again) |
| **Overbooking Risk** | Multiple users book > capacity | Multiple users book overlapping dates |

---

## ⚠️ Critical Edge Cases

### 1. Race Condition: Overlapping Bookings
**Scenario:**
- User A: Books Mar 10-15
- User B: Books Mar 12-17 (overlaps!)
- Both click "Continue" at same time

**Solution:**
- Atomic check + insert in single transaction
- Use PostgreSQL row-level locks: `SELECT ... FOR UPDATE`
- Or database constraint on date overlap (complex)

### 2. Partial Expiry
**Scenario:**
- Pending booking: Mar 10-15
- Expires at 10:05 AM
- New user tries to book Mar 12-17 at 10:03 AM (2 min before expiry)

**Solution:**
- Expiry job runs every 1-2 minutes (same as tours)
- Validation always checks `expires_at > NOW()`
- Conflict detected even if booking about to expire

### 3. Minimum/Maximum Night Restrictions
**Scenario:**
- Package requires minimum 2 nights
- User tries to book 1 night

**Solution:**
- Add validation in `createPendingBooking`:
```typescript
const nights = calculateNights(check_in, check_out);
if (nights < package.minimum_nights) {
  throw new Error(`Minimum ${package.minimum_nights} nights required`);
}
```

### 4. Check-in/out Time Ambiguity
**Scenario:**
- Booking 1: Check-out Mar 15 at 11:00 AM
- Booking 2: Check-in Mar 15 at 3:00 PM
- Do they conflict?

**Solution (Recommended):**
- Use DATE only for overlap check (ignore time)
- Check-out date is NOT blocked (available for next check-in)
- SQL: `check_in_date::date <= night < check_out_date::date`

---

## 📝 Implementation Checklist

### Phase 1: Database
- [ ] Add `expires_at` to `package_bookings`
- [ ] Add `max_guests`, `base_price_per_night`, `minimum_nights` to `packages`
- [ ] Create `check_package_availability()` SQL function
- [ ] Add indexes on date fields for performance
- [ ] Update expiry job to include packages

### Phase 2: Backend Services
- [ ] Build `checkAvailability()` service
- [ ] Build `createPendingBooking()` with holds
- [ ] Build `confirmBooking()` after payment
- [ ] Build `validatePackageAvailability()` with race condition safety
- [ ] Update `expirePendingBookings()` to handle both tours + packages

### Phase 3: Frontend Pages
- [ ] PackageDetailsPage: Show calendar, date picker, guest selector
- [ ] PackageCheckoutPage: Similar to tour checkout but date-based
- [ ] Booking confirmation: Same flow as tours
- [ ] Real-time availability check on date selection

### Phase 4: Testing
- [ ] Test overlapping date bookings (race condition)
- [ ] Test pending booking expiry (dates become available)
- [ ] Test minimum night restrictions
- [ ] Test same-day check-in/check-out edge case
- [ ] Test payment expiry (10-min hold)

---

## 🎯 Bottom Line

**Current State:**
- ❌ No inventory/capacity tracking
- ❌ No hold system (missing `expires_at`)
- ❌ No date conflict detection
- ❌ Trivial to overbook (no validation)

**Required:**
- ✅ Add hold system (copy from tours)
- ✅ Add date overlap checks
- ✅ Build availability validation
- ✅ Implement atomic booking with race condition safety
- ✅ Mirror tour booking flow but with flexible dates

**Complexity Level:**
- Tours: **Medium** (fixed schedule + capacity math)
- Packages: **High** (flexible dates + date range validation + overlap detection)

---

## Next Steps

Should I:
1. **Build the Simple Model (Option A)** - Single inventory unit per package
2. **Build the Multi-Room Model (Option B)** - Hotel-style with room types
3. **Just fix critical issues** - Add holds + validation only

Which approach matches your business model?
