# TripAvail - Project Summary

**Version:** 1.0  
**Date:** January 2025  
**Target Platform:** Flutter (Mobile-First)  
**Current Prototype:** React + TypeScript + Tailwind CSS

---

## 📱 Project Overview

**TripAvail** is a comprehensive travel platform that connects travelers with hotels and tour operators through an innovative package-based booking system. The app supports three distinct user roles with seamless role switching capabilities.

### Core Value Proposition
- **For Travelers:** Discover and book curated travel packages with transparent pricing and detailed inclusions
- **For Hotels:** Create and manage property listings, rooms, and promotional packages
- **For Tour Operators:** Design and sell tour experiences with flexible itineraries

---

## 👥 User Roles & Access

### 1. **Traveler (Default Role)**
- Browse destinations and packages
- Search and filter hotels/tours
- Manage bookings and wishlists
- Profile and payment management
- Rewards and loyalty program

### 2. **Hotel Manager**
- Property listing and verification
- Room configuration and pricing
- Package creation (10-step flow)
- Calendar and availability management
- Bookings and reviews dashboard

### 3. **Tour Operator**
- Tour creation and management
- Itinerary planning
- Pricing and calendar setup
- Booking management
- Review handling

### Role Switching
- Users can switch roles via hamburger menu → "Become a Partner"
- Partner selection sheet with role cards
- One account, multiple roles (future: multi-property support)

---

## 🎨 Design System

### Color Scheme (Black & White Airbnb-Style)

#### **Light Mode**
- **Background:** White (#FFFFFF)
- **Surface:** Gray 50 (#F9FAFB)
- **Text Primary:** Gray 900 (#111827)
- **Text Secondary:** Gray 600 (#4B5563)
- **Borders:** Gray 200 (#E5E7EB)

#### **Dark Mode**
- **Background:** Gray 950 (#030712)
- **Surface:** Gray 900 (#111827)
- **Text Primary:** White (#FFFFFF)
- **Text Secondary:** Gray 400 (#9CA3AF)
- **Borders:** Gray 800 (#1F2937)

### Role-Based Button Colors (Professional Distinction)

| Role | Light Mode | Dark Mode | Gradient |
|------|-----------|-----------|----------|
| **Traveler** | Rose 600 (#E11D48) | Rose 400 (#FB7185) | #FF385C → #FF6B9D |
| **Hotel Manager** | Purple-Cyan Flow | Purple-Cyan Flow | #9D4EDD → #00D4FF |
| **Tour Operator** | Bright Coral (#FD5E53) | Bright Coral | Solid #FD5E53 |

### Natural Color Accents (Minimal Usage)
- **Pool Water:** Blue 500 (#0EA5E9)
- **Leaves/Nature:** Green 500 (#10B981)
- **Candle Flames:** Amber 500 (#F59E0B)

### Typography
- Clean, sans-serif system fonts
- Responsive sizing (mobile-first)
- Custom line heights and weights per element

---

## 🏗️ Application Architecture

### Navigation Structure

```
App.tsx (Root)
├── SplashScreen
├── ScreenManager (Role-based routing)
│   ├── Traveler Screens
│   │   ├── DashboardScreen (Home)
│   │   ├── ProfileScreen
│   │   ├── TripsScreen
│   │   ├── WishlistScreen
│   │   ├── AccountSettingsScreen
│   │   └── [10+ more screens]
│   ├── Hotel Manager Screens
│   │   ├── DashboardScreen
│   │   ├── PropertiesScreen
│   │   ├── ListHotelScreen (10-step flow)
│   │   ├── ListPackagesScreen (10-step flow)
│   │   ├── CalendarScreen
│   │   └── VerificationScreen
│   └── Tour Operator Screens
│       ├── DashboardScreen
│       ├── ToursScreen
│       ├── PostTripPackagesScreen (7-step flow)
│       └── CalendarScreen
├── DrawerManager (Hamburger menu)
├── BottomNavigation (Role-specific)
└── SearchOverlay
```

### Key Components

#### **Global Components**
- `HamburgerMenu` - Side drawer navigation
- `BottomNavigation` - Role-specific bottom nav (5 tabs)
- `SearchOverlay` - Full-screen search with filters
- `DarkModeToggle` - Theme switcher
- `PartnerSelection` - Role switching interface

#### **Composite Components**
- `DrawerHeader` - User profile in drawer
- `AppLogo` - Branded logo with theme support
- `VerifiedPill` - Verification status badge
- `QuickActions` - Dashboard action cards

#### **Feature-Specific**
- `HotelListingFlow` - 10-step property listing
- `PackageListingFlow` - 10-step package creation
- `TourCreationScreen` - 7-step tour creation
- `PremiumImageSlider` - Photo galleries
- `LocationPicker` - Map integration

---

## 📋 Critical User Flows

### 1. Hotel Listing Flow (10 Steps)
1. **Property Type** - Select hotel/resort/boutique/etc.
2. **Basic Info** - Name, star rating, description
3. **Location** - Address, map coordinates
4. **Photos** - Upload property images (8 categories)
5. **Amenities** - Select from 50+ amenities
6. **Services** - Additional services offered
7. **Rooms** - Configure room types (5-step sub-flow)
8. **Policies** - Check-in/out times, cancellation, house rules
9. **Coverage** - Set location radius for services
10. **Review & Submit** - Final confirmation

### 2. Package Creation Flow (10 Steps)
1. **Package Selection** - Choose package type (Weekend/Romantic/Family/etc.)
2. **Basics** - Title, tagline, type
3. **Description** - Detailed package description
4. **Highlights** - Free inclusions + Exclusive discounts
5. **Pricing** - Base price, discounts, value calculation
6. **Media** - Package photos/videos
7. **Calendar** - Availability and blackout dates
8. **Policies** - Cancellation, booking rules
9. **Exclusions** - What's not included
10. **Confirmation** - Review and publish

### 3. Tour Creation Flow (7 Steps)
1. **Basics** - Tour name, type, duration
2. **Itinerary** - Day-by-day schedule
3. **Pricing** - Per person/group pricing
4. **Media** - Tour photos/videos
5. **Policies** - Cancellation, requirements
6. **Calendar** - Tour dates and availability
7. **Confirmation** - Review and submit

---

## 🗃️ Data Models

### User
```typescript
{
  id: string
  email: string
  name: string
  phone: string
  avatar?: string
  role: 'traveler' | 'hotel_manager' | 'tour_operator'
  verified: boolean
  created_at: timestamp
}
```

### Hotel Property
```typescript
{
  id: string
  manager_id: string
  name: string
  property_type: string
  star_rating: number
  description: string
  location: {
    address: string
    city: string
    country: string
    coordinates: { lat: number, lng: number }
  }
  photos: PhotoCategory[]
  amenities: string[]
  services: Service[]
  policies: {
    check_in_time: string
    check_out_time: string
    cancellation_policy: string
    house_rules: string[]
  }
  coverage_radius: number
  status: 'draft' | 'pending' | 'verified' | 'active'
  created_at: timestamp
}
```

### Room
```typescript
{
  id: string
  property_id: string
  room_type: string
  bed_configuration: BedConfig[]
  max_guests: number
  size_sqm: number
  amenities: string[]
  base_price: number
  photos: string[]
  availability: boolean
}
```

### Package
```typescript
{
  id: string
  property_id: string
  package_type: string
  title: string
  tagline: string
  description: string
  free_inclusions: Inclusion[]
  discount_offers: DiscountOffer[]
  base_price: number
  total_price: number
  discount_percentage: number
  media: string[]
  calendar: {
    available_dates: Date[]
    blackout_dates: Date[]
  }
  policies: {
    cancellation_policy: string
    booking_deadline: number
    min_stay: number
  }
  exclusions: string[]
  status: 'draft' | 'active' | 'paused'
}
```

### Tour
```typescript
{
  id: string
  operator_id: string
  name: string
  tour_type: string
  duration_days: number
  itinerary: DayItinerary[]
  pricing: {
    per_person: number
    per_group?: number
    min_participants: number
    max_participants: number
  }
  media: string[]
  policies: {
    cancellation_policy: string
    requirements: string[]
  }
  calendar: {
    tour_dates: Date[]
    available_slots: number
  }
  status: 'draft' | 'active'
}
```

### Booking
```typescript
{
  id: string
  user_id: string
  booking_type: 'package' | 'tour' | 'room'
  item_id: string
  check_in: Date
  check_out: Date
  guests: number
  total_price: number
  payment_status: 'pending' | 'paid' | 'refunded'
  booking_status: 'confirmed' | 'cancelled' | 'completed'
  created_at: timestamp
}
```

---

## 🔧 Backend Requirements

### Authentication & Authorization
- **User Registration/Login** (Email/Password + Social OAuth)
- **Role-based access control** (Traveler/Hotel Manager/Tour Operator)
- **Session management** with JWT tokens
- **Password reset** functionality
- **Email verification** for new accounts

### Database Tables (Relational)

#### Core Tables
- `users` - User accounts and profiles
- `properties` - Hotel listings
- `rooms` - Room configurations
- `packages` - Travel packages
- `tours` - Tour offerings
- `bookings` - All booking records
- `reviews` - User reviews and ratings
- `wishlists` - Saved items
- `messages` - In-app messaging
- `notifications` - Push/email notifications

#### Supporting Tables
- `amenities` - Master amenities list
- `services` - Available services
- `policies` - Policy templates
- `photos` - Image storage metadata
- `calendar_availability` - Date-based availability
- `pricing_rules` - Dynamic pricing
- `verification_requests` - Partner verification queue
- `payment_methods` - Saved payment info
- `transactions` - Payment records

### API Endpoints (REST/GraphQL)

#### Authentication
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `POST /auth/refresh-token`
- `POST /auth/forgot-password`
- `POST /auth/verify-email`

#### Users
- `GET /users/me` - Current user profile
- `PUT /users/me` - Update profile
- `POST /users/switch-role` - Role switching
- `GET /users/verification-status`

#### Properties (Hotel Managers)
- `POST /properties` - Create property
- `GET /properties` - List all properties
- `GET /properties/:id` - Get property details
- `PUT /properties/:id` - Update property
- `DELETE /properties/:id` - Delete property
- `POST /properties/:id/verify` - Submit for verification

#### Rooms
- `POST /properties/:id/rooms` - Add room
- `GET /properties/:id/rooms` - List rooms
- `PUT /rooms/:id` - Update room
- `DELETE /rooms/:id` - Delete room

#### Packages
- `POST /packages` - Create package
- `GET /packages` - Search packages (filters, pagination)
- `GET /packages/:id` - Get package details
- `PUT /packages/:id` - Update package
- `DELETE /packages/:id` - Delete package
- `GET /packages/my-packages` - Hotel manager's packages

#### Tours
- `POST /tours` - Create tour
- `GET /tours` - Search tours
- `GET /tours/:id` - Get tour details
- `PUT /tours/:id` - Update tour
- `DELETE /tours/:id` - Delete tour

#### Bookings
- `POST /bookings` - Create booking
- `GET /bookings` - User's bookings
- `GET /bookings/:id` - Booking details
- `PUT /bookings/:id/cancel` - Cancel booking
- `POST /bookings/:id/review` - Add review

#### Search & Filters
- `GET /search/packages` - Search with filters
- `GET /search/hotels` - Hotel search
- `GET /search/tours` - Tour search
- `GET /search/suggestions` - Autocomplete

#### Wishlists
- `POST /wishlists/add` - Add to wishlist
- `GET /wishlists` - Get user's wishlist
- `DELETE /wishlists/:id` - Remove from wishlist

#### Reviews
- `POST /reviews` - Submit review
- `GET /properties/:id/reviews` - Property reviews
- `GET /tours/:id/reviews` - Tour reviews

#### File Upload
- `POST /upload/image` - Upload single image
- `POST /upload/images` - Upload multiple images
- `DELETE /upload/:id` - Delete image

### Real-time Features (WebSocket/Pusher)
- **Messages** - In-app chat
- **Notifications** - Booking updates, verification status
- **Availability Updates** - Live calendar sync

### Third-Party Integrations

#### Required
- **Payment Gateway** - Stripe/Razorpay for payments
- **Maps API** - Google Maps/Mapbox for location
- **Storage** - AWS S3/Cloudinary for images
- **Email Service** - SendGrid/AWS SES for transactional emails
- **SMS Service** - Twilio for OTP and notifications

#### Optional
- **Analytics** - Google Analytics/Mixpanel
- **Push Notifications** - Firebase Cloud Messaging
- **Search** - Algolia/Elasticsearch for advanced search
- **AI/ML** - OpenAI for property descriptions

---

## 🎯 Flutter Implementation Priorities

### Phase 1: Core Foundation (Weeks 1-2)
- [ ] Project setup with clean architecture
- [ ] State management (Riverpod/Bloc)
- [ ] Theme system (Light/Dark mode)
- [ ] Navigation (GoRouter/Auto Route)
- [ ] API client setup (Dio/Retrofit)
- [ ] Local storage (Hive/SharedPreferences)
- [ ] Authentication flow

### Phase 2: Traveler Experience (Weeks 3-4)
- [ ] Dashboard/Home screen
- [ ] Search and filters
- [ ] Package detail view
- [ ] Hotel detail view
- [ ] Booking flow
- [ ] Profile management
- [ ] Wishlist functionality

### Phase 3: Partner Features (Weeks 5-7)
- [ ] Role switching UI
- [ ] Hotel listing flow (10 steps)
- [ ] Package creation flow (10 steps)
- [ ] Tour creation flow (7 steps)
- [ ] Dashboard (Hotel Manager)
- [ ] Dashboard (Tour Operator)
- [ ] Calendar management

### Phase 4: Advanced Features (Weeks 8-10)
- [ ] In-app messaging
- [ ] Reviews and ratings
- [ ] Payment integration
- [ ] Push notifications
- [ ] Analytics tracking
- [ ] Verification system

---

## 📦 Key Dependencies (Flutter)

### Essential Packages
```yaml
dependencies:
  # State Management
  flutter_riverpod: ^2.4.0  # or flutter_bloc: ^8.1.0
  
  # Navigation
  go_router: ^13.0.0
  
  # HTTP & API
  dio: ^5.4.0
  retrofit: ^4.0.0
  
  # Local Storage
  hive: ^2.2.3
  shared_preferences: ^2.2.0
  
  # UI Components
  flutter_svg: ^2.0.9
  cached_network_image: ^3.3.0
  shimmer: ^3.0.0
  
  # Maps
  google_maps_flutter: ^2.5.0
  
  # Image Handling
  image_picker: ^1.0.4
  image_cropper: ^5.0.0
  
  # Animations
  lottie: ^2.7.0
  animations: ^2.0.8
  
  # Forms & Validation
  flutter_form_builder: ^9.1.1
  
  # Date & Time
  intl: ^0.18.1
  table_calendar: ^3.0.9
  
  # Payment
  stripe_flutter: ^10.0.0
  
  # Notifications
  firebase_messaging: ^14.7.6
  
  # Analytics
  firebase_analytics: ^10.7.4
```

---

## 🔐 Security Considerations

### Authentication
- JWT token-based authentication
- Refresh token rotation
- Secure token storage (Keychain/KeyStore)
- Biometric authentication support

### Data Protection
- HTTPS only for all API calls
- Certificate pinning
- Sensitive data encryption at rest
- No hardcoded API keys

### Payment Security
- PCI-DSS compliance
- Tokenized payment methods
- 3D Secure authentication
- Server-side payment processing only

### Privacy
- GDPR compliance
- Data anonymization
- User consent management
- Right to deletion

---

## 📊 Analytics & Tracking

### User Events
- Screen views
- Button clicks
- Search queries
- Booking conversions
- Role switches
- Feature usage

### Business Metrics
- User acquisition cost
- Conversion rates
- Average booking value
- Retention rates
- Partner growth
- Revenue per user

---

## 🚀 Performance Goals

### Mobile App
- **App Launch:** < 2 seconds (cold start)
- **Screen Transitions:** 60 FPS
- **API Response:** < 500ms (avg)
- **Image Loading:** Progressive loading with placeholders
- **App Size:** < 50MB (initial download)

### Backend
- **API Latency:** < 200ms (P95)
- **Database Queries:** < 100ms
- **Concurrent Users:** 10,000+
- **Uptime:** 99.9%

---

## 📝 Development Standards

### Code Quality
- **Flutter:** Clean Architecture pattern
- **Backend:** MVC/Clean Architecture
- **Testing:** 80%+ code coverage
- **Documentation:** Inline comments + API docs
- **Code Review:** Mandatory for all PRs

### Git Workflow
- **Main Branch:** Production-ready code
- **Develop Branch:** Integration branch
- **Feature Branches:** `feature/feature-name`
- **Hotfix Branches:** `hotfix/bug-name`
- **Commit Convention:** Conventional Commits

### API Versioning
- **URL Versioning:** `/api/v1/...`
- **Backward Compatibility:** Maintain for 6 months
- **Deprecation Notice:** 3 months advance warning

---

## 📞 Support & Resources

### Documentation References
- `/hotel_manager_10_step_listing_flow.md` - Hotel listing specs
- `/hotel_manager_package_creation_10_steps.md` - Package creation specs
- `/flutter_migration_complete_guide.md` - Migration guide
- `/TripAvail_Screen_Specifications.tsx` - Screen wireframes
- `/tripavail_color_system_complete.md` - Design system

### Team Contacts
- **Product Manager:** [Name/Email]
- **Design Lead:** [Name/Email]
- **Frontend Lead:** [Name/Email]
- **Backend Lead:** [Name/Email]

---

## 🎯 Success Criteria

### MVP Launch Checklist
- [ ] User registration and authentication
- [ ] Traveler can search and view packages
- [ ] Hotel Manager can list property (10-step flow)
- [ ] Hotel Manager can create packages (10-step flow)
- [ ] Tour Operator can create tours (7-step flow)
- [ ] Booking flow (end-to-end)
- [ ] Payment integration (test mode)
- [ ] Role switching works seamlessly
- [ ] Dark mode support
- [ ] Push notifications
- [ ] Analytics tracking
- [ ] Admin verification dashboard

### KPIs (First 3 Months)
- **User Registrations:** 10,000+
- **Active Properties:** 500+
- **Active Packages:** 1,000+
- **Bookings:** 1,000+
- **User Retention:** 40%+
- **App Rating:** 4.5+ stars

---

## 🗓️ Timeline

**Total Duration:** 10-12 weeks

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| Backend Setup | 2 weeks | API ready, database configured |
| Flutter Foundation | 2 weeks | App skeleton with auth |
| Traveler Features | 2 weeks | Browse, search, booking |
| Partner Features | 3 weeks | Listing flows, dashboards |
| Integration & Testing | 2 weeks | E2E testing, bug fixes |
| Beta Launch | 1 week | Internal testing, feedback |

---

## 📋 Next Steps

### For Backend Engineer
1. Review data models and API endpoints
2. Set up database schema (PostgreSQL/MySQL)
3. Implement authentication system
4. Build core API endpoints (properties, packages, tours)
5. Set up file upload service
6. Integrate payment gateway (test mode)
7. Deploy staging environment

### For Flutter Engineer
1. Review screen specifications and user flows
2. Set up Flutter project with clean architecture
3. Implement state management (Riverpod/Bloc)
4. Build theme system (light/dark mode)
5. Create reusable UI components
6. Implement navigation system
7. Integrate API client and authentication
8. Build traveler screens first, then partner screens

### Collaboration Points
- **API Contract:** Agree on request/response formats
- **Error Handling:** Standardize error codes and messages
- **Real-time Sync:** Define WebSocket events
- **File Upload:** Image compression and storage strategy
- **Search:** Query parameters and filtering logic
- **Pagination:** Page size and cursor-based pagination

---

**Document Version:** 1.0  
**Last Updated:** January 2025  
**Status:** Ready for Development Kickoff

---

## 📎 Appendix

### Glossary
- **Package:** A curated travel offering by a hotel (room + inclusions + discounts)
- **Tour:** A guided experience offered by tour operators
- **Inclusion:** Items included for free in a package (breakfast, spa, etc.)
- **Exclusion:** Items not included in a package
- **Coverage Radius:** Geographic area where hotel services are available
- **Verification:** Partner approval process for listing properties/tours

### Key Metrics Definitions
- **Conversion Rate:** (Bookings / Searches) × 100
- **Average Booking Value:** Total Revenue / Total Bookings
- **Retention Rate:** (Active Users Month N / Active Users Month N-1) × 100
- **Partner Growth Rate:** (New Partners / Total Partners) × 100

---

**End of Document**
