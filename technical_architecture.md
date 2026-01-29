# TripAvail - Technical Architecture

> **Document Purpose**: Comprehensive technical approach for TripAvail web portal with future mobile app support, real-time updates, and clean role switching.

---

## 🏗️ Architecture Overview

### **Platform Strategy**
- **Phase 1**: Web portal (React/Vite + Supabase)
- **Phase 2**: Mobile app (React Native/Flutter)
- **Backend**: Single Supabase instance for both platforms
- **Real-time**: Supabase Realtime for live updates

### **Core Principles**
- ✅ Single user account with multiple roles
- ✅ Role switching = UI context change only
- ✅ All data persists across role switches
- ✅ Shared backend API for web and mobile
- ✅ Real-time updates across all platforms

### **⚠️ Role Constraint (Product Rule)**

> **CRITICAL**: Partner roles are mutually exclusive.

- **Every user starts as a Traveller**
- **A Traveller may choose ONLY ONE partner role**:
  - Hotel Manager **OR** Tour Operator (not both)
- **This choice is permanent** (one-time decision)
- **After choosing, the user may switch between**:
  - Traveller view ↔ chosen partner view
- **The unchosen partner role is never available to that user**

**Database Implication**: The `user_roles` table can have at most 2 roles per user:
- `traveller` (always present)
- `hotel_manager` OR `tour_operator` (mutually exclusive)

---

## 🗄️ Database Schema

### **Core Users Table (Single Source of Truth)**

```sql
-- Core Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Roles Table (Many-to-Many with flags)
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role_type TEXT NOT NULL CHECK (role_type IN ('traveller', 'hotel_manager', 'tour_operator')),
  is_active BOOLEAN DEFAULT false, -- Current active role
  enabled_at TIMESTAMPTZ DEFAULT NOW(),
  profile_completion INTEGER DEFAULT 0,
  verification_status TEXT DEFAULT 'pending',
  UNIQUE(user_id, role_type)
);

-- Constraint: Ensure only one partner role per user
CREATE OR REPLACE FUNCTION check_partner_role_exclusivity()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role_type IN ('hotel_manager', 'tour_operator') THEN
    IF EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = NEW.user_id
      AND role_type IN ('hotel_manager', 'tour_operator')
      AND role_type != NEW.role_type
    ) THEN
      RAISE EXCEPTION 'User can only have one partner role (hotel_manager OR tour_operator)';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_partner_role_exclusivity
  BEFORE INSERT ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION check_partner_role_exclusivity();

-- Role-Specific Profile Data
CREATE TABLE traveller_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  travel_preferences JSONB,
  loyalty_points INTEGER DEFAULT 0,
  loyalty_tier TEXT DEFAULT 'bronze'
);

CREATE TABLE hotel_manager_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  business_name TEXT,
  business_license TEXT,
  tax_id TEXT,
  bank_details JSONB,
  verification_documents JSONB
);

CREATE TABLE tour_operator_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  company_name TEXT,
  operator_license TEXT,
  insurance_details JSONB,
  certifications JSONB
);

-- Properties (linked to user, not role)
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT,
  status TEXT DEFAULT 'draft',
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tours (linked to user, not role)
CREATE TABLE tours (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  operator_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bookings (universal - works for all roles)
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  traveller_id UUID REFERENCES users(id),
  property_id UUID REFERENCES properties(id),
  tour_id UUID REFERENCES tours(id),
  status TEXT DEFAULT 'pending',
  booking_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Key Design Principles**:
- ✅ **Single user account** with `user_roles` junction table
- ✅ **One active role** at a time (is_active flag)
- ✅ **All data linked to user_id**, not role
- ✅ **Role-specific profiles** for additional data
- ✅ **No duplicate accounts** needed

---

## ⚡ Real-Time Updates Strategy

### **Supabase Realtime Subscriptions**

```typescript
// Frontend: Real-time subscription service
class RealtimeService {
  private supabase: SupabaseClient;
  private subscriptions: Map<string, RealtimeChannel> = new Map();

  // Subscribe to user-specific updates
  subscribeToUserUpdates(userId: string) {
    // Bookings updates (for all roles)
    const bookingsChannel = this.supabase
      .channel(`user:${userId}:bookings`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `traveller_id=eq.${userId}`
        },
        (payload) => this.handleBookingUpdate(payload)
      )
      .subscribe();

    this.subscriptions.set('bookings', bookingsChannel);
  }

  // Subscribe to role-specific updates
  subscribeToHotelManagerUpdates(userId: string) {
    // Property bookings (when user is hotel manager)
    const propertyBookingsChannel = this.supabase
      .channel(`manager:${userId}:property-bookings`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `property_id=in.(${propertyIds.join(',')})`
        },
        (payload) => this.handlePropertyBookingUpdate(payload)
      )
      .subscribe();

    this.subscriptions.set('property-bookings', propertyBookingsChannel);
  }

  // Subscribe to verification status changes
  subscribeToVerificationUpdates(userId: string) {
    const verificationChannel = this.supabase
      .channel(`user:${userId}:verification`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_roles',
          filter: `user_id=eq.${userId}`
        },
        (payload) => this.handleVerificationUpdate(payload)
      )
      .subscribe();

    this.subscriptions.set('verification', verificationChannel);
  }

  // Clean up subscriptions on role switch
  unsubscribeAll() {
    this.subscriptions.forEach(channel => {
      this.supabase.removeChannel(channel);
    });
    this.subscriptions.clear();
  }
}
```

**Real-time Features**:
- ✅ **Booking notifications** (instant updates)
- ✅ **Verification status** (live updates)
- ✅ **Availability changes** (calendar sync)
- ✅ **Message notifications** (chat/support)
- ✅ **Role-specific subscriptions** (dynamic based on active role)

---

## 🔄 Role Switching Implementation

### **Frontend State Management**

```typescript
// User context with role switching
interface UserState {
  user: User;
  activeRole: 'traveller' | 'hotel_manager' | 'tour_operator';
  availableRoles: UserRole[];
  profiles: {
    traveller?: TravellerProfile;
    hotel_manager?: HotelManagerProfile;
    tour_operator?: TourOperatorProfile;
  };
}

// Role switching service
class RoleService {
  async switchRole(
    userId: string, 
    newRole: 'traveller' | 'hotel_manager' | 'tour_operator'
  ) {
    // 1. Update active role in database
    await supabase.rpc('switch_user_role', {
      p_user_id: userId,
      p_new_role: newRole
    });

    // 2. Unsubscribe from current role's real-time channels
    realtimeService.unsubscribeAll();

    // 3. Load role-specific data
    const roleData = await this.loadRoleData(userId, newRole);

    // 4. Subscribe to new role's real-time channels
    this.subscribeToRoleChannels(userId, newRole);

    // 5. Update UI context
    return {
      activeRole: newRole,
      roleData
    };
  }

  private async loadRoleData(userId: string, role: string) {
    switch (role) {
      case 'hotel_manager':
        return {
          properties: await this.getProperties(userId),
          packages: await this.getPackages(userId),
          bookings: await this.getPropertyBookings(userId)
        };
      case 'tour_operator':
        return {
          tours: await this.getTours(userId),
          bookings: await this.getTourBookings(userId)
        };
      case 'traveller':
        return {
          trips: await this.getTrips(userId),
          wishlist: await this.getWishlist(userId),
          bookings: await this.getTravellerBookings(userId)
        };
    }
  }

  private subscribeToRoleChannels(userId: string, role: string) {
    // Always subscribe to user-level updates
    realtimeService.subscribeToUserUpdates(userId);

    // Subscribe to role-specific channels
    if (role === 'hotel_manager') {
      realtimeService.subscribeToHotelManagerUpdates(userId);
    } else if (role === 'tour_operator') {
      realtimeService.subscribeToTourOperatorUpdates(userId);
    }
  }
}
```

### **Database Function for Role Switching**

```sql
-- Atomic role switching function
CREATE OR REPLACE FUNCTION switch_user_role(
  p_user_id UUID,
  p_new_role TEXT
)
RETURNS VOID AS $$
BEGIN
  -- Deactivate all roles for this user
  UPDATE user_roles
  SET is_active = false
  WHERE user_id = p_user_id;

  -- Activate the new role
  UPDATE user_roles
  SET is_active = true
  WHERE user_id = p_user_id AND role_type = p_new_role;

  -- If role doesn't exist, create it
  IF NOT FOUND THEN
    INSERT INTO user_roles (user_id, role_type, is_active)
    VALUES (p_user_id, p_new_role, true);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 📱 Cross-Platform Architecture (Web → Mobile)

### **Shared Backend API Layer**

```typescript
// API client (works for both web and mobile)
class TripAvailAPI {
  private supabase: SupabaseClient;

  constructor(config: { url: string; anonKey: string }) {
    this.supabase = createClient(config.url, config.anonKey);
  }

  // Universal methods work on both platforms
  async getUser() {
    return this.supabase.auth.getUser();
  }

  async switchRole(role: string) {
    return this.supabase.rpc('switch_user_role', {
      p_user_id: (await this.getUser()).data.user?.id,
      p_new_role: role
    });
  }

  async getBookings(filters?: BookingFilters) {
    return this.supabase
      .from('bookings')
      .select('*')
      .match(filters || {});
  }

  // Real-time subscriptions work on both platforms
  subscribeToBookings(userId: string, callback: (data: any) => void) {
    return this.supabase
      .channel(`bookings:${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bookings',
        filter: `traveller_id=eq.${userId}`
      }, callback)
      .subscribe();
  }
}
```

### **Platform-Specific UI, Shared Logic**

```
Project Structure:
├── packages/
│   ├── shared/                    # Shared business logic
│   │   ├── api/                   # API client (Supabase)
│   │   ├── models/                # Data models
│   │   ├── services/              # Business logic
│   │   │   ├── RoleService.ts
│   │   │   ├── BookingService.ts
│   │   │   └── RealtimeService.ts
│   │   └── utils/
│   │
│   ├── web/                       # Web app (React/Vite)
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── screens/
│   │   │   └── hooks/
│   │   └── package.json
│   │
│   └── mobile/                    # Future: React Native / Flutter
│       ├── src/
│       │   ├── components/
│       │   ├── screens/
│       │   └── hooks/
│       └── package.json
```

**Benefits**:
- ✅ **Single API layer** shared between web and mobile
- ✅ **Consistent business logic** across platforms
- ✅ **Platform-specific UI** for optimal UX
- ✅ **Same Supabase backend** for both

---

## 🔒 Row-Level Security (RLS) for Multi-Role Access

```sql
-- Users can only see their own data
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Properties: Owner can manage, others can view published
CREATE POLICY "Property owners can manage"
  ON properties FOR ALL
  USING (auth.uid() = owner_id);

CREATE POLICY "Anyone can view published properties"
  ON properties FOR SELECT
  USING (status = 'published');

-- Bookings: Complex multi-role access
CREATE POLICY "Travellers can view their bookings"
  ON bookings FOR SELECT
  USING (auth.uid() = traveller_id);

CREATE POLICY "Hotel managers can view property bookings"
  ON bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = bookings.property_id
      AND properties.owner_id = auth.uid()
    )
  );

CREATE POLICY "Tour operators can view tour bookings"
  ON bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tours
      WHERE tours.id = bookings.tour_id
      AND tours.operator_id = auth.uid()
    )
  );
```

---

## 📊 Architecture Summary

| Aspect | Solution |
|--------|----------|
| **Backend** | Single Supabase instance with role-based tables |
| **User Accounts** | One account per user, multiple roles via `user_roles` table |
| **Role Switching** | Database function + frontend state management |
| **Real-time** | Supabase Realtime with role-specific subscriptions |
| **Cross-Platform** | Shared API/logic layer, platform-specific UI |
| **Security** | Row-Level Security (RLS) for multi-role access control |
| **Data Persistence** | All data linked to `user_id`, survives role switches |
| **Mobile Ready** | Same backend, same API, different UI framework |

---

## 🚀 Implementation Phases

### **Phase 1: Web Portal (Current)**
- React/Vite frontend
- Supabase backend
- Role switching implementation
- Real-time updates
- All 49 screens

### **Phase 2: Mobile App (Future)**
- React Native or Flutter
- Reuse Supabase backend
- Reuse API layer
- Platform-specific UI components
- Same real-time capabilities

### **Phase 3: Enhancements**
- Push notifications (mobile)
- Offline mode
- Advanced analytics
- AI-powered recommendations

---

*Last Updated: 2026-01-29*  
*Document Version: 1.0*  
*Architecture for: TripAvail Web Portal + Future Mobile App*
