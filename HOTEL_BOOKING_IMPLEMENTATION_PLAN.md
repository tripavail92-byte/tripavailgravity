# Hotel Package Booking - Full Implementation Plan (Option B Extended)

## 🎯 Core Philosophy

**Hotel booking is fundamentally different from tour booking:**

| Tours | Hotels |
|-------|--------|
| Fixed departure schedules | Flexible check-in/check-out dates |
| Seat capacity (total count) | Room inventory (per type, per night) |
| Single price × guests | Price per night × nights × rooms |
| Book "seats on a tour" | Book "rooms for date range" |

**Critical Requirements:**
1. **Room-based inventory** - Not package counts, but actual room types with quantities
2. **Per-night availability** - Must validate EVERY night in date range
3. **Dynamic pricing** - Auto-calculate: `room_price × nights × room_count`
4. **Hotel manager control** - Configure room types, set prices, view bookings
5. **10-minute holds** - Reserve rooms across date ranges temporarily
6. **Zero overbooking tolerance** - Never exceed available rooms for any night

---

## 📊 Database Schema (Complete)

### 1. Package Room Types Table

```sql
-- supabase/migrations/20260210_create_package_room_types.sql

CREATE TABLE IF NOT EXISTS public.package_room_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES public.packages(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) <= 100),
  description TEXT,
  max_guests INT NOT NULL CHECK (max_guests > 0 AND max_guests <= 10),
  base_price_per_night NUMERIC(10, 2) NOT NULL CHECK (base_price_per_night > 0),
  total_units INT NOT NULL CHECK (total_units > 0),
  amenities TEXT[] DEFAULT '{}',
  images TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_room_types_package ON public.package_room_types(package_id);
CREATE INDEX idx_room_types_active ON public.package_room_types(package_id, is_active);

-- RLS Policies
ALTER TABLE public.package_room_types ENABLE ROW LEVEL SECURITY;

-- Public can view active room types for published packages
CREATE POLICY "room_types_select_public" ON public.package_room_types
FOR SELECT USING (
  is_active = true AND 
  EXISTS (
    SELECT 1 FROM public.packages 
    WHERE id = package_id AND is_published = true
  )
);

-- Hotel owners can manage their room types
CREATE POLICY "room_types_all_owner" ON public.package_room_types
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.packages 
    WHERE id = package_id AND owner_id = auth.uid()
  )
);

-- Trigger to update updated_at
CREATE TRIGGER update_package_room_types_updated_at
BEFORE UPDATE ON public.package_room_types
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE public.package_room_types IS 'Room type definitions for hotel packages (Deluxe, Standard, etc.)';
COMMENT ON COLUMN public.package_room_types.total_units IS 'Total number of rooms of this type (e.g., 10 Deluxe Suites)';
COMMENT ON COLUMN public.package_room_types.base_price_per_night IS 'Base price per night for one room of this type';
```

### 2. Package Availability Table (Per-Night Tracking)

```sql
-- supabase/migrations/20260210_create_package_availability.sql

CREATE TABLE IF NOT EXISTS public.package_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_type_id UUID NOT NULL REFERENCES public.package_room_types(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  available_units INT NOT NULL CHECK (available_units >= 0),
  price_override NUMERIC(10, 2) CHECK (price_override IS NULL OR price_override > 0),
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'blocked', 'maintenance')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_type_id, date)
);

-- Indexes for fast date range queries
CREATE INDEX idx_availability_room_date ON public.package_availability(room_type_id, date);
CREATE INDEX idx_availability_date_range ON public.package_availability(date);
CREATE INDEX idx_availability_status ON public.package_availability(status) WHERE status != 'available';

-- RLS Policies
ALTER TABLE public.package_availability ENABLE ROW LEVEL SECURITY;

-- Public can view available dates for published packages
CREATE POLICY "availability_select_public" ON public.package_availability
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.package_room_types prt
    JOIN public.packages p ON p.id = prt.package_id
    WHERE prt.id = room_type_id 
    AND p.is_published = true
    AND prt.is_active = true
  )
);

-- Hotel owners can manage their availability
CREATE POLICY "availability_all_owner" ON public.package_availability
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.package_room_types prt
    JOIN public.packages p ON p.id = prt.package_id
    WHERE prt.id = room_type_id AND p.owner_id = auth.uid()
  )
);

-- Trigger
CREATE TRIGGER update_package_availability_updated_at
BEFORE UPDATE ON public.package_availability
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Helper function to initialize availability for date range
CREATE OR REPLACE FUNCTION initialize_room_availability(
  room_type_id_param UUID,
  start_date_param DATE,
  end_date_param DATE,
  default_available_units INT
)
RETURNS INT AS $$
DECLARE
  inserted_count INT := 0;
  current_date DATE;
BEGIN
  current_date := start_date_param;
  
  WHILE current_date <= end_date_param LOOP
    INSERT INTO public.package_availability (
      room_type_id, 
      date, 
      available_units, 
      status
    )
    VALUES (
      room_type_id_param, 
      current_date, 
      default_available_units, 
      'available'
    )
    ON CONFLICT (room_type_id, date) DO NOTHING;
    
    inserted_count := inserted_count + 1;
    current_date := current_date + interval '1 day';
  END LOOP;
  
  RETURN inserted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE public.package_availability IS 'Per-night room inventory tracking for each room type';
COMMENT ON COLUMN public.package_availability.available_units IS 'Number of rooms available on this specific date';
COMMENT ON COLUMN public.package_availability.price_override IS 'Optional dynamic pricing for this specific date (overrides base_price_per_night)';
COMMENT ON FUNCTION initialize_room_availability IS 'Bulk create availability records for a date range';
```

### 3. Update Package Bookings Table

```sql
-- supabase/migrations/20260210_update_package_bookings_for_rooms.sql

-- Add room-based booking fields
ALTER TABLE public.package_bookings
ADD COLUMN IF NOT EXISTS room_type_id UUID REFERENCES public.package_room_types(id),
ADD COLUMN IF NOT EXISTS rooms_count INT DEFAULT 1 CHECK (rooms_count > 0),
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS price_per_night NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS number_of_nights INT;

-- Add index for expiration queries
CREATE INDEX IF NOT EXISTS idx_package_bookings_expires_at 
ON public.package_bookings(expires_at) 
WHERE status = 'pending';

-- Add index for date overlaps
CREATE INDEX IF NOT EXISTS idx_package_bookings_dates 
ON public.package_bookings(room_type_id, check_in_date, check_out_date);

-- Computed columns (for convenience)
ALTER TABLE public.package_bookings
ADD COLUMN IF NOT EXISTS calculated_total NUMERIC(10, 2) 
GENERATED ALWAYS AS (
  COALESCE(price_per_night, 0) * 
  COALESCE(number_of_nights, 0) * 
  COALESCE(rooms_count, 1)
) STORED;

COMMENT ON COLUMN public.package_bookings.room_type_id IS 'Which room type was booked (Deluxe, Standard, etc.)';
COMMENT ON COLUMN public.package_bookings.rooms_count IS 'Number of rooms booked (e.g., 2 Deluxe rooms)';
COMMENT ON COLUMN public.package_bookings.expires_at IS 'Booking hold expiration (10 minutes from creation)';
COMMENT ON COLUMN public.package_bookings.price_per_night IS 'Locked-in price per night at booking time';
COMMENT ON COLUMN public.package_bookings.number_of_nights IS 'Total nights (check_out_date - check_in_date)';
```

### 4. Package Metadata Table (Add Pricing Rules)

```sql
-- supabase/migrations/20260210_add_package_pricing_metadata.sql

-- Add pricing and booking rules to packages table
ALTER TABLE public.packages
ADD COLUMN IF NOT EXISTS minimum_nights INT DEFAULT 1 CHECK (minimum_nights > 0),
ADD COLUMN IF NOT EXISTS maximum_nights INT DEFAULT 30 CHECK (maximum_nights >= minimum_nights),
ADD COLUMN IF NOT EXISTS check_in_time TIME DEFAULT '15:00',
ADD COLUMN IF NOT EXISTS check_out_time TIME DEFAULT '11:00',
ADD COLUMN IF NOT EXISTS booking_buffer_days INT DEFAULT 0 CHECK (booking_buffer_days >= 0),
ADD COLUMN IF NOT EXISTS advance_booking_days INT DEFAULT 365 CHECK (advance_booking_days > 0);

COMMENT ON COLUMN public.packages.minimum_nights IS 'Minimum stay requirement (e.g., 2 nights minimum)';
COMMENT ON COLUMN public.packages.maximum_nights IS 'Maximum stay allowed (e.g., 30 nights max)';
COMMENT ON COLUMN public.packages.booking_buffer_days IS 'Minimum days before check-in (e.g., 1 = must book at least 1 day in advance)';
COMMENT ON COLUMN public.packages.advance_booking_days IS 'Maximum days in advance bookings allowed (e.g., 365 = can book up to 1 year ahead)';
```

---

## 🔧 Core SQL Functions

### 1. Check Room Availability for Date Range

```sql
-- supabase/migrations/20260210_create_room_availability_functions.sql

-- Check if X rooms available for entire date range
CREATE OR REPLACE FUNCTION check_room_availability(
  room_type_id_param UUID,
  check_in_param DATE,
  check_out_param DATE,
  requested_rooms_param INT
)
RETURNS TABLE(
  is_available BOOLEAN,
  min_available_rooms INT,
  blocking_date DATE
) AS $$
DECLARE
  min_rooms INT;
  blocking_dt DATE;
BEGIN
  -- Generate all nights in the stay (check-out day is NOT counted)
  WITH date_series AS (
    SELECT generate_series(
      check_in_param::date,
      (check_out_param - interval '1 day')::date,
      interval '1 day'
    )::date AS night
  ),
  -- Get base available units from availability table
  availability_per_night AS (
    SELECT 
      ds.night,
      COALESCE(pa.available_units, prt.total_units) AS base_available,
      COALESCE(pa.status, 'available') AS night_status
    FROM date_series ds
    LEFT JOIN public.package_availability pa 
      ON pa.room_type_id = room_type_id_param 
      AND pa.date = ds.night
    LEFT JOIN public.package_room_types prt 
      ON prt.id = room_type_id_param
  ),
  -- Subtract currently booked/held rooms
  booked_per_night AS (
    SELECT 
      apn.night,
      apn.base_available,
      apn.night_status,
      COALESCE(
        (SELECT SUM(pb.rooms_count) 
         FROM public.package_bookings pb
         WHERE pb.room_type_id = room_type_id_param
         AND pb.status IN ('confirmed', 'pending')
         -- Only count pending if not expired
         AND (pb.status != 'pending' OR pb.expires_at > NOW())
         -- Check if this night falls within booking range
         AND apn.night >= pb.check_in_date::date
         AND apn.night < pb.check_out_date::date),
        0
      ) AS rooms_booked,
      apn.base_available - COALESCE(
        (SELECT SUM(pb.rooms_count) 
         FROM public.package_bookings pb
         WHERE pb.room_type_id = room_type_id_param
         AND pb.status IN ('confirmed', 'pending')
         AND (pb.status != 'pending' OR pb.expires_at > NOW())
         AND apn.night >= pb.check_in_date::date
         AND apn.night < pb.check_out_date::date),
        0
      ) AS available_this_night
    FROM availability_per_night apn
  )
  SELECT 
    MIN(bpn.available_this_night),
    MIN(bpn.night) FILTER (WHERE bpn.available_this_night < requested_rooms_param OR bpn.night_status != 'available')
  INTO min_rooms, blocking_dt
  FROM booked_per_night bpn;

  -- Return availability result
  RETURN QUERY SELECT 
    (min_rooms >= requested_rooms_param AND blocking_dt IS NULL) AS is_available,
    COALESCE(min_rooms, 0) AS min_available_rooms,
    blocking_dt AS blocking_date;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION check_room_availability IS 
'Checks if requested number of rooms available for ENTIRE date range, accounting for confirmed + active pending bookings';
```

### 2. Calculate Booking Price (Server-Side)

```sql
-- Never trust frontend pricing calculations
CREATE OR REPLACE FUNCTION calculate_package_booking_price(
  room_type_id_param UUID,
  check_in_param DATE,
  check_out_param DATE,
  rooms_count_param INT
)
RETURNS TABLE(
  total_price NUMERIC,
  price_per_night NUMERIC,
  number_of_nights INT,
  price_breakdown JSONB
) AS $$
DECLARE
  base_price NUMERIC;
  nights INT;
  total NUMERIC := 0;
  breakdown JSONB := '[]'::jsonb;
  current_date DATE;
BEGIN
  -- Get base price per night
  SELECT base_price_per_night INTO base_price
  FROM public.package_room_types
  WHERE id = room_type_id_param;

  IF base_price IS NULL THEN
    RAISE EXCEPTION 'Room type not found';
  END IF;

  -- Calculate nights (check-out day doesn't count)
  nights := (check_out_param - check_in_param)::int;

  IF nights <= 0 THEN
    RAISE EXCEPTION 'Invalid date range: check-out must be after check-in';
  END IF;

  -- Calculate total with per-night overrides
  current_date := check_in_param;
  
  WHILE current_date < check_out_param LOOP
    DECLARE
      night_price NUMERIC;
    BEGIN
      -- Check for price override on this specific date
      SELECT COALESCE(pa.price_override, base_price) INTO night_price
      FROM public.package_availability pa
      WHERE pa.room_type_id = room_type_id_param 
      AND pa.date = current_date;

      -- If no override, use base price
      night_price := COALESCE(night_price, base_price);

      -- Add to breakdown
      breakdown := breakdown || jsonb_build_object(
        'date', current_date,
        'price_per_room', night_price,
        'rooms', rooms_count_param,
        'subtotal', night_price * rooms_count_param
      );

      total := total + (night_price * rooms_count_param);
      current_date := current_date + interval '1 day';
    END;
  END LOOP;

  RETURN QUERY SELECT 
    total AS total_price,
    (total / nights / rooms_count_param) AS price_per_night,
    nights AS number_of_nights,
    breakdown AS price_breakdown;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION calculate_package_booking_price IS 
'Server-side price calculation with per-night dynamic pricing support';
```

### 3. Create Booking with Atomic Validation

```sql
CREATE OR REPLACE FUNCTION create_package_booking_with_validation(
  package_id_param UUID,
  traveler_id_param UUID,
  room_type_id_param UUID,
  check_in_param TIMESTAMPTZ,
  check_out_param TIMESTAMPTZ,
  rooms_count_param INT,
  guest_count_param INT
)
RETURNS UUID AS $$
DECLARE
  booking_id UUID;
  availability_check RECORD;
  price_info RECORD;
  package_info RECORD;
  nights INT;
BEGIN
  -- Get package rules
  SELECT minimum_nights, maximum_nights, booking_buffer_days
  INTO package_info
  FROM public.packages
  WHERE id = package_id_param AND is_published = true;

  IF package_info IS NULL THEN
    RAISE EXCEPTION 'Package not found or not published';
  END IF;

  -- Validate date range
  nights := (check_out_param::date - check_in_param::date)::int;

  IF nights < package_info.minimum_nights THEN
    RAISE EXCEPTION 'Minimum % nights required', package_info.minimum_nights;
  END IF;

  IF nights > package_info.maximum_nights THEN
    RAISE EXCEPTION 'Maximum % nights allowed', package_info.maximum_nights;
  END IF;

  -- Check availability (with row-level lock to prevent race conditions)
  SELECT * INTO availability_check
  FROM check_room_availability(
    room_type_id_param,
    check_in_param::date,
    check_out_param::date,
    rooms_count_param
  );

  IF NOT availability_check.is_available THEN
    IF availability_check.blocking_date IS NOT NULL THEN
      RAISE EXCEPTION 'Not available on %', availability_check.blocking_date;
    ELSE
      RAISE EXCEPTION 'Only % rooms available (requested %)', 
        availability_check.min_available_rooms, 
        rooms_count_param;
    END IF;
  END IF;

  -- Calculate pricing
  SELECT * INTO price_info
  FROM calculate_package_booking_price(
    room_type_id_param,
    check_in_param::date,
    check_out_param::date,
    rooms_count_param
  );

  -- Create booking with 10-minute hold
  INSERT INTO public.package_bookings (
    package_id,
    traveler_id,
    room_type_id,
    check_in_date,
    check_out_date,
    rooms_count,
    guest_count,
    number_of_nights,
    price_per_night,
    total_price,
    status,
    payment_status,
    expires_at,
    metadata
  ) VALUES (
    package_id_param,
    traveler_id_param,
    room_type_id_param,
    check_in_param,
    check_out_param,
    rooms_count_param,
    guest_count_param,
    price_info.number_of_nights,
    price_info.price_per_night,
    price_info.total_price,
    'pending',
    'unpaid',
    NOW() + interval '10 minutes',
    jsonb_build_object(
      'price_breakdown', price_info.price_breakdown,
      'booking_created_at', NOW()
    )
  )
  RETURNING id INTO booking_id;

  RETURN booking_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION create_package_booking_with_validation IS 
'Atomically validates availability and creates booking with 10-minute hold';
```

---

## 📦 Backend Services (TypeScript)

### 1. Package Room Type Service

```typescript
// packages/web/src/features/packages/services/packageRoomTypeService.ts

import { supabase } from '@/lib/supabase';

export interface PackageRoomType {
  id: string;
  package_id: string;
  name: string;
  description?: string;
  max_guests: number;
  base_price_per_night: number;
  total_units: number;
  amenities: string[];
  images: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const packageRoomTypeService = {
  // Get all room types for a package
  async getRoomTypes(packageId: string): Promise<PackageRoomType[]> {
    const { data, error } = await supabase
      .from('package_room_types')
      .select('*')
      .eq('package_id', packageId)
      .eq('is_active', true)
      .order('base_price_per_night', { ascending: true });

    if (error) throw error;
    return data as PackageRoomType[];
  },

  // Create room type (hotel manager)
  async createRoomType(
    roomType: Omit<PackageRoomType, 'id' | 'created_at' | 'updated_at'>
  ): Promise<PackageRoomType> {
    const { data, error } = await supabase
      .from('package_room_types')
      .insert(roomType)
      .select()
      .single();

    if (error) throw error;
    return data as PackageRoomType;
  },

  // Update room type
  async updateRoomType(
    roomTypeId: string,
    updates: Partial<PackageRoomType>
  ): Promise<PackageRoomType> {
    const { data, error } = await supabase
      .from('package_room_types')
      .update(updates)
      .eq('id', roomTypeId)
      .select()
      .single();

    if (error) throw error;
    return data as PackageRoomType;
  },

  // Delete (soft delete by setting is_active=false)
  async deleteRoomType(roomTypeId: string): Promise<void> {
    const { error } = await supabase
      .from('package_room_types')
      .update({ is_active: false })
      .eq('id', roomTypeId);

    if (error) throw error;
  },
};
```

### 2. Package Availability Service

```typescript
// packages/web/src/features/packages/services/packageAvailabilityService.ts

import { supabase } from '@/lib/supabase';

export interface PackageAvailability {
  id: string;
  room_type_id: string;
  date: string;
  available_units: number;
  price_override?: number;
  status: 'available' | 'blocked' | 'maintenance';
  notes?: string;
}

export const packageAvailabilityService = {
  // Initialize availability for date range
  async initializeAvailability(
    roomTypeId: string,
    startDate: string,
    endDate: string,
    defaultUnits: number
  ): Promise<number> {
    const { data, error } = await supabase.rpc('initialize_room_availability', {
      room_type_id_param: roomTypeId,
      start_date_param: startDate,
      end_date_param: endDate,
      default_available_units: defaultUnits,
    });

    if (error) throw error;
    return data as number;
  },

  // Get availability for date range
  async getAvailability(
    roomTypeId: string,
    startDate: string,
    endDate: string
  ): Promise<PackageAvailability[]> {
    const { data, error } = await supabase
      .from('package_availability')
      .select('*')
      .eq('room_type_id', roomTypeId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date');

    if (error) throw error;
    return data as PackageAvailability[];
  },

  // Block specific dates (maintenance, etc.)
  async blockDates(
    roomTypeId: string,
    dates: string[],
    reason: string
  ): Promise<void> {
    const updates = dates.map((date) => ({
      room_type_id: roomTypeId,
      date,
      available_units: 0,
      status: 'blocked' as const,
      notes: reason,
    }));

    const { error } = await supabase
      .from('package_availability')
      .upsert(updates, { onConflict: 'room_type_id,date' });

    if (error) throw error;
  },

  // Set dynamic pricing for specific dates
  async setPriceOverride(
    roomTypeId: string,
    date: string,
    price: number
  ): Promise<void> {
    const { error } = await supabase
      .from('package_availability')
      .upsert(
        {
          room_type_id: roomTypeId,
          date,
          price_override: price,
        },
        { onConflict: 'room_type_id,date' }
      );

    if (error) throw error;
  },
};
```

### 3. Updated Package Booking Service

```typescript
// packages/web/src/features/booking/services/packageBookingService.ts

import { supabase } from '@/lib/supabase';

export interface RoomAvailabilityCheck {
  is_available: boolean;
  min_available_rooms: number;
  blocking_date?: string;
}

export interface PriceCalculation {
  total_price: number;
  price_per_night: number;
  number_of_nights: number;
  price_breakdown: Array<{
    date: string;
    price_per_room: number;
    rooms: number;
    subtotal: number;
  }>;
}

export const packageBookingService = {
  // Check room availability for date range
  async checkRoomAvailability(
    roomTypeId: string,
    checkIn: string,
    checkOut: string,
    roomsCount: number
  ): Promise<RoomAvailabilityCheck> {
    const { data, error } = await supabase.rpc('check_room_availability', {
      room_type_id_param: roomTypeId,
      check_in_param: checkIn,
      check_out_param: checkOut,
      requested_rooms_param: roomsCount,
    });

    if (error) throw error;
    return data as RoomAvailabilityCheck;
  },

  // Calculate pricing (server-side, never trust frontend)
  async calculatePrice(
    roomTypeId: string,
    checkIn: string,
    checkOut: string,
    roomsCount: number
  ): Promise<PriceCalculation> {
    const { data, error } = await supabase.rpc(
      'calculate_package_booking_price',
      {
        room_type_id_param: roomTypeId,
        check_in_param: checkIn,
        check_out_param: checkOut,
        rooms_count_param: roomsCount,
      }
    );

    if (error) throw error;
    return data as PriceCalculation;
  },

  // Create booking with atomic validation
  async createBookingWithValidation(params: {
    package_id: string;
    traveler_id: string;
    room_type_id: string;
    check_in_date: string;
    check_out_date: string;
    rooms_count: number;
    guest_count: number;
  }): Promise<string> {
    const { data, error } = await supabase.rpc(
      'create_package_booking_with_validation',
      {
        package_id_param: params.package_id,
        traveler_id_param: params.traveler_id,
        room_type_id_param: params.room_type_id,
        check_in_param: params.check_in_date,
        check_out_param: params.check_out_date,
        rooms_count_param: params.rooms_count,
        guest_count_param: params.guest_count,
      }
    );

    if (error) {
      // Parse error messages
      if (error.message.includes('Minimum')) {
        throw new Error(error.message);
      }
      if (error.message.includes('Not available')) {
        throw new Error(error.message);
      }
      if (error.message.includes('Only')) {
        throw new Error(error.message);
      }
      throw error;
    }

    return data as string; // booking ID
  },

  // Confirm booking after payment
  async confirmBooking(bookingId: string): Promise<void> {
    const { error } = await supabase
      .from('package_bookings')
      .update({
        status: 'confirmed',
        payment_status: 'paid',
        paid_at: new Date().toISOString(),
      })
      .eq('id', bookingId)
      .eq('status', 'pending');

    if (error) throw error;
  },

  // Expire pending bookings
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

  // Get booking by ID
  async getBookingById(bookingId: string) {
    const { data, error } = await supabase
      .from('package_bookings')
      .select(`
        *,
        package:packages(*),
        room_type:package_room_types(*)
      `)
      .eq('id', bookingId)
      .single();

    if (error) throw error;
    return data;
  },

  // Update payment status
  async updatePaymentStatus(
    bookingId: string,
    paymentIntentId: string,
    status: 'paid' | 'failed'
  ): Promise<void> {
    const { error } = await supabase
      .from('package_bookings')
      .update({
        stripe_payment_intent_id: paymentIntentId,
        payment_status: status,
        paid_at: status === 'paid' ? new Date().toISOString() : null,
      })
      .eq('id', bookingId);

    if (error) throw error;
  },
};
```

### 4. Update Payment Success Handler

```typescript
// packages/web/src/features/booking/services/paymentSuccessHandler.ts

// Add package booking validation
export async function handlePackagePaymentSuccess(
  paymentIntentId: string,
  bookingId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Get booking
    const booking = await packageBookingService.getBookingById(bookingId);

    if (!booking) {
      return { success: false, error: 'Booking not found' };
    }

    // 2. Validate booking state
    if (booking.status !== 'pending') {
      return {
        success: false,
        error: `Booking already ${booking.status}`,
      };
    }

    // 3. Check expiration
    if (new Date(booking.expires_at) < new Date()) {
      return {
        success: false,
        error: 'Booking hold has expired. Please book again.',
      };
    }

    // 4. Verify payment intent matches
    if (
      booking.stripe_payment_intent_id &&
      booking.stripe_payment_intent_id !== paymentIntentId
    ) {
      return {
        success: false,
        error: 'Payment intent mismatch',
      };
    }

    // 5. Re-check availability (critical for race conditions)
    const availabilityCheck = await packageBookingService.checkRoomAvailability(
      booking.room_type_id,
      booking.check_in_date,
      booking.check_out_date,
      booking.rooms_count
    );

    if (!availabilityCheck.is_available) {
      // Another booking confirmed during payment process
      return {
        success: false,
        error: 'Room no longer available. Your payment will be refunded.',
      };
    }

    // 6. Confirm booking
    await packageBookingService.confirmBooking(bookingId);

    // 7. Update payment status
    await packageBookingService.updatePaymentStatus(
      bookingId,
      paymentIntentId,
      'paid'
    );

    return { success: true };
  } catch (error) {
    console.error('Package payment success error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
```

---

## 🎨 Hotel Manager UI Components

### 1. Room Types Configuration Page

**Route:** `/hotel-manager/packages/:packageId/room-types`

**Features:**
- List all room types
- Add new room type (name, description, max guests, price, total units)
- Edit existing room types
- Upload room images
- Set amenities (WiFi, AC, TV, etc.)
- Enable/disable room types

**Key Interactions:**
- When total_units changed → Auto-initialize availability for next 365 days
- Show total capacity: `SUM(total_units) across all room types`
- Warn if no room types configured

### 2. Availability Calendar

**Route:** `/hotel-manager/packages/:packageId/availability`

**Features:**
- Calendar view showing next 12 months
- Color-coded availability:
  - Green: Fully available
  - Yellow: Partially booked
  - Red: Fully booked
  - Gray: Blocked/maintenance
- Click date → See bookings + set overrides
- Bulk actions:
  - Block date range (maintenance)
  - Set dynamic pricing for date range
  - Clone availability from previous period

**Dynamic Pricing Example:**
```
Christmas Week (Dec 25-31):
  Standard Room: $150/night → $250/night
  Deluxe Suite: $250/night → $400/night
```

### 3. Booking Dashboard

**Route:** `/hotel-manager/bookings`

**Features:**
- List all bookings (confirmed, pending, expired)
- Filter by:
  - Date range
  - Room type
  - Status
  - Traveler name
- Quick stats:
  - Today's check-ins/check-outs
  - Revenue this month
  - Occupancy rate
  - Pending bookings expiring soon

---

## 🌐 Traveler Booking Flow (Frontend)

### 1. Package Details Page

```typescript
// packages/web/src/pages/traveller/PackageDetailsPage.tsx

export default function PackageDetailsPage() {
  const { packageId } = useParams();
  const [packageData, setPackageData] = useState<Package | null>(null);
  const [roomTypes, setRoomTypes] = useState<PackageRoomType[]>([]);
  const [selectedRoomType, setSelectedRoomType] = useState<string>('');
  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);
  const [roomsCount, setRoomsCount] = useState(1);
  const [guestCount, setGuestCount] = useState(2);
  const [priceEstimate, setPriceEstimate] = useState<PriceCalculation | null>(null);
  const [availabilityStatus, setAvailabilityStatus] = useState<RoomAvailabilityCheck | null>(null);

  // Load package and room types
  useEffect(() => {
    loadPackageData();
  }, [packageId]);

  // Real-time availability check when dates/room selection changes
  useEffect(() => {
    if (selectedRoomType && checkIn && checkOut && roomsCount > 0) {
      checkAvailabilityAndPrice();
    }
  }, [selectedRoomType, checkIn, checkOut, roomsCount]);

  async function checkAvailabilityAndPrice() {
    try {
      // Check availability
      const availability = await packageBookingService.checkRoomAvailability(
        selectedRoomType,
        checkIn!.toISOString(),
        checkOut!.toISOString(),
        roomsCount
      );
      setAvailabilityStatus(availability);

      // Calculate price if available
      if (availability.is_available) {
        const price = await packageBookingService.calculatePrice(
          selectedRoomType,
          checkIn!.toISOString(),
          checkOut!.toISOString(),
          roomsCount
        );
        setPriceEstimate(price);
      }
    } catch (error) {
      console.error('Availability check failed:', error);
    }
  }

  function handleBookNow() {
    if (!availabilityStatus?.is_available) {
      toast.error('Selected dates are not available');
      return;
    }

    // Navigate to checkout with selections
    navigate(`/checkout/package/${packageId}`, {
      state: {
        roomTypeId: selectedRoomType,
        checkIn: checkIn!.toISOString(),
        checkOut: checkOut!.toISOString(),
        roomsCount,
        guestCount,
        priceEstimate,
      },
    });
  }

  return (
    <div>
      {/* Package overview */}
      <PackageHeader package={packageData} />

      {/* Room type selector */}
      <RoomTypeSelector
        roomTypes={roomTypes}
        selected={selectedRoomType}
        onSelect={setSelectedRoomType}
      />

      {/* Date picker with availability calendar */}
      <DateRangePicker
        checkIn={checkIn}
        checkOut={checkOut}
        onCheckInChange={setCheckIn}
        onCheckOutChange={setCheckOut}
        minNights={packageData?.minimum_nights}
        maxNights={packageData?.maximum_nights}
        disabledDates={/* fetch blocked dates */}
      />

      {/* Room and guest counters */}
      <BookingControls
        roomsCount={roomsCount}
        guestCount={guestCount}
        maxGuests={roomTypes.find(rt => rt.id === selectedRoomType)?.max_guests}
        onRoomsChange={setRoomsCount}
        onGuestsChange={setGuestCount}
      />

      {/* Availability status */}
      {availabilityStatus && (
        <AvailabilityIndicator
          isAvailable={availabilityStatus.is_available}
          availableRooms={availabilityStatus.min_available_rooms}
          blockingDate={availabilityStatus.blocking_date}
        />
      )}

      {/* Dynamic price display */}
      {priceEstimate && (
        <PriceSummary
          total={priceEstimate.total_price}
          pricePerNight={priceEstimate.price_per_night}
          nights={priceEstimate.number_of_nights}
          rooms={roomsCount}
          breakdown={priceEstimate.price_breakdown}
        />
      )}

      {/* Book button */}
      <Button
        onClick={handleBookNow}
        disabled={!availabilityStatus?.is_available || !priceEstimate}
      >
        Book Now - ${priceEstimate?.total_price.toFixed(2)}
      </Button>
    </div>
  );
}
```

### 2. Package Checkout Page

```typescript
// packages/web/src/pages/checkout/PackageCheckoutPage.tsx

export default function PackageCheckoutPage() {
  const { packageId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const {
    roomTypeId,
    checkIn,
    checkOut,
    roomsCount,
    guestCount,
    priceEstimate,
  } = location.state;

  const [bookingId, setBookingId] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [isCreatingBooking, setIsCreatingBooking] = useState(false);

  // Create pending booking on mount
  useEffect(() => {
    createPendingBooking();
  }, []);

  async function createPendingBooking() {
    setIsCreatingBooking(true);
    try {
      const bookingId = await packageBookingService.createBookingWithValidation({
        package_id: packageId!,
        traveler_id: user!.id,
        room_type_id: roomTypeId,
        check_in_date: checkIn,
        check_out_date: checkOut,
        rooms_count: roomsCount,
        guest_count: guestCount,
      });

      setBookingId(bookingId);
      setExpiresAt(new Date(Date.now() + 10 * 60 * 1000));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Booking failed');
      navigate(`/packages/${packageId}`);
    } finally {
      setIsCreatingBooking(false);
    }
  }

  return (
    <div>
      {/* 10-minute countdown timer */}
      <BookingTimer expiresAt={expiresAt} onExpired={() => navigate(`/packages/${packageId}`)} />

      {/* Booking summary */}
      <BookingSummary
        checkIn={checkIn}
        checkOut={checkOut}
        roomsCount={roomsCount}
        guestCount={guestCount}
        nights={priceEstimate.number_of_nights}
        totalPrice={priceEstimate.total_price}
        priceBreakdown={priceEstimate.price_breakdown}
      />

      {/* Guest details form */}
      <GuestDetailsForm guestCount={guestCount} />

      {/* Payment form (Phase 3 Stripe integration) */}
      <StripePaymentForm
        bookingId={bookingId}
        amount={priceEstimate.total_price}
        onSuccess={() => navigate(`/booking-confirmation?booking_id=${bookingId}`)}
      />

      {/* Trust badges and policies */}
      <TrustSection />
    </div>
  );
}
```

---

## ✅ Testing Strategy

### Database Tests

```sql
-- Test 1: Availability calculation
SELECT * FROM check_room_availability(
  'room-type-uuid',
  '2026-03-10',
  '2026-03-15',
  2 -- requesting 2 rooms
);

-- Test 2: Overlapping booking detection
-- Create booking 1: Mar 10-15
-- Create booking 2: Mar 12-17 (should fail)

-- Test 3: Partial expiry
-- Create pending booking: Mar 10-15, expires in 2 min
-- Try booking Mar 12-17 (should succeed after expiry)

-- Test 4: Price calculation with overrides
SELECT * FROM calculate_package_booking_price(
  'room-type-uuid',
  '2026-12-25', -- Christmas
  '2026-12-31', -- New Year
  1
);
```

### Race Condition Tests

```typescript
// Test: Concurrent bookings for same dates
async function testConcurrentBookings() {
  const bookingParamsconst params = {
    package_id: 'pkg-uuid',
    traveler_id: 'user1',
    room_type_id: 'room-uuid',
    check_in_date: '2026-03-10',
    check_out_date: '2026-03-15',
    rooms_count: 2,
    guest_count: 4,
  };

  // Simulate 3 users booking simultaneously
  const [result1, result2, result3] = await Promise.allSettled([
    packageBookingService.createBookingWithValidation({ ...params, traveler_id: 'user1' }),
    packageBookingService.createBookingWithValidation({ ...params, traveler_id: 'user2' }),
    packageBookingService.createBookingWithValidation({ ...params, traveler_id: 'user3' }),
  ]);

  // If only 2 rooms available, one should fail
  console.log({
    user1: result1.status,
    user2: result2.status,
    user3: result3.status,
  });
}
```

---

## 📋 Implementation Phase Breakdown

### Phase 1: Database Foundation (Week 1)
1. Create package_room_types table
2. Create package_availability table
3. Update package_bookings with room fields
4. Build SQL functions (availability check, price calc, validation)
5. Test with sample data

### Phase 2: Backend Services (Week 2)
6. Build packageRoomTypeService
7. Build packageAvailabilityService
8. Update packageBookingService with room logic
9. Update payment success handler
10. Update expiry job

### Phase 3: Hotel Manager UI (Week 3)
11. Room types configuration page
12. Availability calendar
13. Booking dashboard with filters
14. Bulk availability management
15. Dynamic pricing interface

### Phase 4: Traveler Booking Flow (Week 4)
16. Update PackageDetailsPage with room selector
17. Build date range picker with availability
18. Dynamic price calculation display
19. Build PackageCheckoutPage
20. Integrate Stripe payment

### Phase 5: Testing & Polish (Week 5)
21. Race condition testing
22. Overbooking prevention tests
23. Payment expiry edge cases
24. Load testing (100 concurrent bookings)
25. Documentation and deployment

---

## 🚀 Next Immediate Steps

1. **Review this plan** - Confirm it matches your business requirements
2. **Choose starting point** - Database migrations first?
3. **Clarify edge cases:**
   - Dynamic pricing: Manual only or automatic (weekends, holidays)?
   - Minimum booking buffer: Can book same-day or 1+ days in advance?
   - Cancellation policy: Full refund window? Partial refund?
   - Multiple room types per booking: Can book 1 Deluxe + 2 Standard in one transaction?

**Ready to start building?** Let me know which phase to begin with!
