# Hotel-Package Architecture Analysis

## 🏗️ Current Database Architecture

### Existing Tables

```
hotels (Main hotel properties)
  ├─ id, owner_id, name, location, base_price_per_night
  ├─ description, amenities, images
  └─ is_published, created_at
  
rooms (Room types within hotels)
  ├─ id, hotel_id (FK to hotels)
  ├─ name ("Deluxe Suite", "Standard Room", etc.)
  ├─ room_type (TEXT: 'standard', 'deluxe', 'suite', 'family', 'executive', 'presidential')
  ├─ capacity_adults, capacity_children
  ├─ price_override (overrides hotel base_price_per_night)
  ├─ initial_stock (how many rooms of this type exist)
  └─ created_at

packages (Travel packages/experiences)
  ├─ id, owner_id
  ├─ hotel_id (FK to hotels) ← Links package to specific hotel
  ├─ room_ids (UUID[]) ← Array of room IDs included in package
  ├─ name, description, package_type
  ├─ cover_image, media_urls[]
  ├─ highlights[], inclusions[], exclusions[]
  └─ is_published, created_at

package_bookings (Traveler bookings)
  ├─ id, package_id (FK to packages)
  ├─ traveler_id (FK to users)
  ├─ check_in_date, check_out_date, guest_count
  ├─ status (pending, confirmed, cancelled, completed)
  ├─ total_price, booking_date
  └─ metadata (JSONB)
```

---

## 🔗 Relationships

```
Hotel (e.g., "Marriott Downtown Bangkok")
  │
  ├─ Room 1: Deluxe Suite ($250/night, stock: 10)
  ├─ Room 2: Standard Room ($150/night, stock: 20)
  ├─ Room 3: Family Suite ($350/night, stock: 5)
  │
  └─ Package: "Family Weekend Getaway"
       ├─ Includes: Room 1 (Deluxe Suite) × 1
       ├─ Includes: Room 2 (Standard Room) × 2
       ├─ Price: Calculated from room prices
       └─ Booking: Traveler books this package
            └─ Reserves rooms for check-in to check-out dates
```

---

## ❓ User Question: "1 Deluxe + 2 Standard - check how many room types we have"

### Answer: YES, packages can include multiple room types

**Current Design:**
- `packages.room_ids` is an **array** of room UUIDs
- A package can reference: `[deluxe_room_id, standard_room_id_1, standard_room_id_2]`
- Example package JSON:
  ```json
  {
    "id": "pkg-uuid",
    "hotel_id": "hotel-uuid",
    "room_ids": [
      "room-deluxe-uuid",
      "room-standard-uuid",
      "room-standard-uuid"
    ],
    "name": "Family Package",
    "package_type": "family"
  }
  ```

**But... Current Design Has Problems:**

### ⚠️ Critical Issues

#### Issue 1: Room IDs are Instance IDs, Not Types

The `room_ids` array stores **specific room IDs**, but:
- "Deluxe Suite" is a **room type** (with `initial_stock = 10`)
- Each physical room isn't individually tracked as separate DB rows
- The package references room TYPE definitions, not actual room instances

**Confusion:**
```
rooms table:
  - id: uuid-123, name: "Deluxe Suite", initial_stock: 10
  - id: uuid-456, name: "Standard Room", initial_stock: 20

Package room_ids: [uuid-123, uuid-456, uuid-456]
  → This means 1 Deluxe type + 2 Standard types, NOT 3 specific rooms
```

#### Issue 2: No Availability Tracking

**Current state:**
- `rooms.initial_stock` = Total inventory (e.g., 10 Deluxe rooms)
- NO per-night availability tracking
- NO way to know how many Deluxe rooms are booked on March 10-15

**Problem:**
- Multiple travelers can book "1 Deluxe Suite" for overlapping dates
- No validation to prevent overbooking
- Stock is static, not dynamic

#### Issue 3: Ambiguous Package Booking Schema

**When a traveler books a package:**

Current `package_bookings` table:
```sql
{
  package_id: "family-package-uuid",
  check_in_date: "2026-03-10",
  check_out_date: "2026-03-15",
  guest_count: 6,
  -- But... which rooms?
  -- How many of each type?
  -- From which hotel? (package has hotel_id, but booking doesn't store it directly)
}
```

**Missing fields:**
- ❌ Which room types were booked? (Deluxe? Standard?)
- ❌ How many of each room type? (2 Standard rooms? Or 1 Standard + 1 Family?)
- ❌ How to handle dynamic room selection? (Traveler picks "2 rooms" but which types?)

---

## 🛠️ Required Architecture Changes

### Option A: Fixed Package Configuration (Simpler)

**Concept:** Package defines exact room mix upfront

**Schema Changes:**
```sql
-- Add to packages table
ALTER TABLE packages
ADD COLUMN room_configuration JSONB;
-- Example: {"deluxe": 1, "standard": 2}
-- Means: This package always includes 1 Deluxe + 2 Standard

-- No change needed to package_bookings
-- Booking inherits room config from package
```

**Pros:**
- Simple: Package creator defines room mix once
- Traveler books package as-is (no room selection)
- Pricing can be pre-calculated and stored

**Cons:**
- Inflexible: Can't offer variations (e.g., "2 Deluxe instead of 1 Deluxe + 2 Standard")
- Can't handle "Choose your room type" scenarios

---

### Option B: Flexible Room Selection (Complex but Powerful)

**Concept:** Traveler chooses room types during booking

**Schema Changes:**

```sql
-- 1. Create room_inventory table (per-night tracking)
CREATE TABLE room_inventory (
  id UUID PRIMARY KEY,
  hotel_id UUID REFERENCES hotels(id),
  room_type_id UUID REFERENCES rooms(id), -- Which room type
  date DATE NOT NULL,
  total_units INT NOT NULL, -- Total rooms of this type at hotel
  available_units INT NOT NULL, -- Decremented by bookings
  UNIQUE(room_type_id, date)
);

-- 2. Update package_bookings to store selected rooms
ALTER TABLE package_bookings
ADD COLUMN rooms_booked JSONB; -- {"deluxe": 1, "standard": 2}
ADD COLUMN expires_at TIMESTAMPTZ; -- 10-min hold

-- 3. Track bookings against inventory
CREATE TABLE room_booking_details (
  id UUID PRIMARY KEY,
  package_booking_id UUID REFERENCES package_bookings(id),
  room_type_id UUID REFERENCES rooms(id),
  rooms_count INT NOT NULL, -- How many of this type
  price_per_room_per_night NUMERIC, -- Locked-in price
  check_in_date DATE,
  check_out_date DATE
);
```

**Booking Flow:**
1. Traveler views package "Family Getaway"
2. Package shows available room types (from hotel):
   - Deluxe Suite: $250/night (5 available for Mar 10-15)
   - Standard Room: $150/night (12 available for Mar 10-15)
3. Traveler selects: "1 Deluxe + 2 Standard"
4. System validates availability for EVERY NIGHT in range
5. Creates booking with 10-min hold (reserves inventory)
6. After payment, confirms booking (deducts from available_units)

**Pros:**
- Maximum flexibility for travelers
- Supports dynamic pricing per room type
- Handles real hotel inventory

**Cons:**
- Complex queries (check availability across date ranges)
- More tables to manage
- Higher development effort

---

## 📊 Comparison: Fixed vs Flexible

| Feature | Fixed Package Config | Flexible Room Selection |
|---------|---------------------|------------------------|
| **Package Creation** | Owner picks room mix once | Owner sets available room types |
| **Traveler Booking** | Books pre-defined mix | Chooses rooms during booking |
| **Inventory Tracking** | Simple (package-level) | Complex (per-room-type, per-night) |
| **Pricing** | Static (calculated once) | Dynamic (calculated at booking) |
| **Examples** | "Honeymoon Suite Package" (always 1 Deluxe) | "Family Package" (pick 2-4 rooms, any type) |
| **Database Complexity** | Low (2-3 tables) | High (5-6 tables) |
| **Overbooking Risk** | Medium (date overlap only) | Low (per-room validation) |

---

## 🎯 Recommended Approach

### **Start with Fixed Package (Option A), Prepare for Flexible (Option B)**

**Phase 1: Minimum Viable (Fixed Packages)**

1. Add `room_configuration` JSONB to packages
   ```json
   {
     "rooms": [
       {"room_type_id": "deluxe-uuid", "count": 1},
       {"room_type_id": "standard-uuid", "count": 2}
     ],
     "max_guests": 6,
     "fixed_price": 1200
   }
   ```

2. Add `expires_at` to package_bookings (10-min hold)

3. Create simple availability check:
   ```sql
   -- Check if ANY confirmed/pending booking overlaps dates for same package
   SELECT COUNT(*) FROM package_bookings
   WHERE package_id = :pkg_id
   AND status IN ('confirmed', 'pending')
   AND (expires_at > NOW() OR status = 'confirmed')
   AND (check_in_date, check_out_date) OVERLAPS (:new_check_in, :new_check_out);
   ```

4. When booking confirmed:
   - Reserves entire package (not individual rooms yet)
   - Stores guest_count and room_configuration in metadata
   - Hotel manager sees "Package X booked" (handles room assignment manually)

**Benefits:**
- Can ship MVP quickly (1-2 weeks)
- Solves immediate overbooking problem
- Provides 10-min hold system
- Works for most package use cases

**Limitations:**
- Can't handle "only 1 Deluxe left but 5 Standard available" scenarios
- No per-room inventory visibility

---

### **Phase 2: Full Room Inventory (Option B)**

After MVP proven, upgrade to:
1. `room_inventory` table (per-night availability)
2. `room_booking_details` table (which rooms in each booking)
3. Dynamic pricing based on room selection
4. Real-time availability updates per room type

---

## 🔢 Current Room Types in Database

**Based on code references, typical room types are:**

```sql
-- From migrations/20260208_fix_hotel_schema_gaps.sql comment:
room_type values: 
  'standard'
  'deluxe'
  'suite'
  'family'
  'executive'  
  'presidential'
```

**To check actual room types in your database:**

```sql
-- Count rooms by type across all hotels
SELECT 
  r.room_type,
  COUNT(*) as type_count,
  SUM(r.initial_stock) as total_inventory,
  AVG(COALESCE(r.price_override, h.base_price_per_night)) as avg_price
FROM rooms r
JOIN hotels h ON h.id = r.hotel_id
GROUP BY r.room_type
ORDER BY total_inventory DESC;
```

**To see which packages use multiple room types:**

```sql
-- Find packages with multiple rooms referenced
SELECT 
  p.id,
  p.name,
  p.package_type,
  array_length(p.room_ids, 1) as room_count,
  p.room_ids
FROM packages p
WHERE array_length(p.room_ids, 1) > 1;
```

---

## ✅ Action Plan

### Immediate (This Week):

1. **Clarify business requirement:**
   - Are packages **fixed** (always same rooms) or **flexible** (traveler picks)?
   - Example: "Honeymoon Package" = Always 1 Deluxe Suite (fixed)?
   - Example: "Family Package" = Pick 2-4 rooms, any type (flexible)?

2. **Document current packages:**
   - How many packages exist?
   - Do they reference multiple room types currently?
   - What's the intended booking flow?

3. **Choose Option A or B:**
   - **If fixed packages:** Implement Phase 1 (simpler, faster)
   - **If flexible rooms:** Implement Full Option B (complex, slower)

### Next Steps (After Decision):

**If Option A (Fixed Packages):**
- [ ] Add `room_configuration` to packages table
- [ ] Add `expires_at` to package_bookings
- [ ] Build simple overlap validation
- [ ] Update booking service with 10-min holds
- [ ] Update payment handler with expiration check
- [ ] Deploy in 1-2 weeks

**If Option B (Flexible Rooms):**
- [ ] Follow [HOTEL_BOOKING_IMPLEMENTATION_PLAN.md](HOTEL_BOOKING_IMPLEMENTATION_PLAN.md)
- [ ] Create room_inventory, room_booking_details tables
- [ ] Build per-night availability checking
- [ ] Implement dynamic pricing calculator
- [ ] Build room selector UI
- [ ] Deploy in 4-5 weeks

---

## 🤔 Questions to Answer

Before proceeding, clarify:

1. **Business Model:**
   - Do you sell pre-configured packages (like "3-Day Bali Romance = 1 Deluxe Suite only")?
   - Or do travelers customize room selection (like "Family Trip = Pick 2-4 rooms")?

2. **Current Usage:**
   - Are there existing packages with multiple room types?
   - How are hotels currently listing packages?

3. **Priority:**
   - Need MVP fast (go with Fixed Packages)?
   - Or build complete system from start (go with Flexible Rooms)?

4. **Room Assignment:**
   - Does hotel manager manually assign physical rooms after booking?
   - Or should system auto-assign (requires individual room tracking)?

