# TripAvail - Phase 3: User Flows Documentation

> **Document Purpose**: Complete screen-to-screen navigation flows for all user roles, including multi-step processes and drill-down paths.

---

## ⚠️ Role Constraint (Product Rule)

> **CRITICAL**: This is a product-level constraint that affects all flows.

- **Every user starts as a Traveller**
- **A Traveller may choose ONLY ONE partner role**:
  - Hotel Manager **OR** Tour Operator (not both)
- **This choice is permanent** (one-time decision)
- **After choosing, the user may switch between**:
  - Traveller view ↔ chosen partner view
- **The unchosen partner role is never available to that user**

---

## 📊 Flow Summary

| Role | Main Flows | Multi-Step Processes | Total Flow Screens |
|------|-----------|---------------------|-------------------|
| **Traveller** | 4 flows | 0 | 23 screens |
| **Hotel Manager** | 1 main + 2 multi-step | 2 (10 steps each) | 12 + 20 steps |
| **Tour Operator** | 1 main + 1 multi-step | 1 (7 steps) | 6 + 7 steps |

**Note**: Hotel Manager and Tour Operator are mutually exclusive per user (see Role Constraint above).

---

## 🧳 A) TRAVELLER CORE NAVIGATION FLOWS

### **Main Loop** (Primary Navigation)

```
Home/Dashboard
  ├→ Trips (TripsScreen.tsx) ✅
  ├→ Wishlist (WishlistScreen.tsx) ✅
  ├→ Profile (AirbnbProfileScreen.tsx) ✅
  ├→ Settings cluster → [See Settings Drill-down]
  ├→ Payment Methods → [See Payments Drill-down]
  └→ Help (HelpScreen.tsx) ✅
```

**Implementation Status**: ✅ **All screens present (UI-level)**

**Note**: Screens exist but functional completeness varies (e.g., payment processing, booking flow may be stubbed).

---

### **Settings Drill-Down** (From Account Settings)

```
Account Settings (AccountSettingsScreen.tsx) ✅
  ├→ Security Settings (SecuritySettingsScreen.tsx) ✅
  ├→ Account Info (AccountInfoScreen.tsx) ✅
  ├→ Notifications Settings (NotificationsSettingsScreen.tsx) ✅
  ├→ Privacy Settings (PrivacySettingsScreen.tsx) ✅
  ├→ App Preferences (AppPreferencesScreen.tsx) ✅
  └→ Travel Preferences (TravelPreferencesScreen.tsx) ✅
```

**Implementation Status**: ✅ **All 7 screens present (UI-level)**

**Note**: UI screens exist; backend integration and full functionality may vary.

**Navigation Pattern**: 
- Entry: From Profile → Account Settings
- Pattern: List-detail navigation
- Return: Back button to Account Settings

---

### **Payments Drill-Down** (From Payment Methods)

```
Payment Methods (PaymentMethodsScreen.tsx) ✅
  ├→ Payment Cards (PaymentCardsScreen.tsx) ✅
  │   ├→ Add New Card ✅
  │   ├→ Edit Card ✅
  │   └→ Delete Card ✅
  └→ Mobile Wallets (MobileWalletsScreen.tsx) ✅
      ├→ Link Wallet ✅
      └→ Manage Wallet ✅
```

**Implementation Status**: ✅ **All screens present (UI-level)**

**Note**: Screens exist but functional completeness varies (e.g., payment processing, booking flow may be stubbed).

**Navigation Pattern**:
- Entry: From Profile → Payment Methods
- Pattern: Hub-and-spoke navigation
- Return: Back button to Payment Methods hub

---

### **Rewards Path** (Loyalty Program)

```
Profile / Home
  └→ Rewards (RewardsScreen.tsx) ✅
      ├→ Points Balance ✅
      ├→ Rewards History ✅
      ├→ Redeem Rewards ✅
      └→ Loyalty Tier Info ✅
```

**Implementation Status**: ✅ **All screens present (UI-level)**

**Note**: Screens exist but functional completeness varies (e.g., payment processing, booking flow may be stubbed).

**Navigation Pattern**:
- Entry: From Profile or Home Dashboard
- Pattern: Single screen with tabs/sections
- Return: Back to Profile or Home

---

### **Booking Flow** (Critical Gap)

```
Hotel/Package Detail
  └→ Booking Checkout ❌ MISSING
      └→ Booking Confirmation ❌ MISSING
          └→ My Trips ✅
```

**Implementation Status**: ⚠️ **2 critical screens missing**

**Gap Impact**: Cannot complete end-to-end booking flow

---

## 🏨 B) HOTEL MANAGER CORE NAVIGATION FLOWS

### **Primary Manager Loop** (Main Navigation)

```
Dashboard (DashboardScreen.tsx) ✅
  ├→ Properties (PropertiesScreen.tsx) ✅
  ├→ List Your Hotel → [See 10-Step Flow]
  ├→ List Packages (ListPackagesScreen.tsx) ✅
  ├→ Package Creation → [See 10-Step Flow]
  ├→ Calendar (CalendarScreen.tsx) ✅
  ├→ Verification (VerificationScreen.tsx) ✅
  └→ Settings (SettingsScreen.tsx) ✅
```

**Implementation Status**: ✅ **All main screens present (UI-level)**

---

### **Hotel Listing 10-Step Flow** (Multi-Step Process)

**Entry Point**: Dashboard → "List Your Hotel" button

```
Step 1: Welcome & Overview (WelcomeStep.tsx) ✅
  ↓
Step 2: Hotel Info / Basics (HotelInfoStep.tsx) ✅
  ├─ Hotel name
  ├─ Property type selection
  ├─ Star rating
  ├─ Description
  └─ Contact information
  ↓
Step 3: Location (LocationStep.tsx) ✅
  ├─ Interactive map
  ├─ Address form
  ├─ City/State/Country
  └─ Nearby landmarks
  ↓
Step 4: Photos & Media (ModernPhotosStep.tsx) ✅
  ├─ Exterior photos (min 2)
  ├─ Room photos (min 3)
  ├─ Amenities photos
  └─ Dining photos
  ↓
Step 5: Room Configuration (ModernRoomsStep.tsx / RoomDetailsStep.tsx) ✅
  ├─ Total rooms count
  ├─ Room types (Single, Double, Suite, etc.)
  ├─ Guest capacity per room
  └─ Base pricing per room type
  ↓
Step 6: Amenities & Features (ModernAmenitiesStep.tsx / AmenitiesStep.tsx) ✅
  ├─ Internet & Technology (WiFi, TV, etc.)
  ├─ Recreation & Wellness (Pool, Gym, Spa)
  ├─ Dining & Food Services
  ├─ Safety & Security
  └─ Accessibility features
  ↓
Step 7: Services & Staff (ModernServicesStep.tsx) ✅
  ├─ Guest services (Concierge, Room service)
  ├─ Transportation (Airport shuttle, Parking)
  ├─ Business & Events (Meeting rooms)
  └─ Staffing info (24-hour desk, Multilingual)
  ↓
Step 8: Policies & Rules (ModernPoliciesStep.tsx / RulesStep.tsx) ✅
  ├─ Check-in/Check-out times
  ├─ Cancellation policy (Flexible/Moderate/Strict)
  ├─ House rules (Smoking, Pets, Parties)
  └─ Payment terms & deposit
  ↓
Step 9: Review & Confirmation (ReviewStep.tsx) ✅
  ├─ Summary of all information
  ├─ Edit capability for each section
  ├─ Completion checklist
  └─ Legal consent
  ↓
Step 10: Success & Next Steps (SuccessStep.tsx) ✅
  ├─ Celebration animation
  ├─ Reference number
  ├─ Timeline expectations
  └─ Quick actions (App download, Training)
```

**Implementation Status**: ✅ **All 10 steps fully implemented**

**Components Found**:
- `WelcomeStep.tsx`
- `HotelInfoStep.tsx`
- `LocationStep.tsx` / `ModernLocationStep.tsx`
- `ModernPhotosStep.tsx`
- `RoomDetailsStep.tsx` / `ModernRoomsStep.tsx`
- `AmenitiesStep.tsx` / `ModernAmenitiesStep.tsx`
- `ModernServicesStep.tsx`
- `RulesStep.tsx` / `ModernPoliciesStep.tsx`
- `ReviewStep.tsx`
- `SuccessStep.tsx`

**Additional Room Configuration Steps**:
- `RoomTypeSelectionStep.tsx`
- `RoomBasicInfoStep.tsx`
- `BedConfigurationStep.tsx`
- `RoomAmenitiesStep.tsx`
- `RoomSummaryStep.tsx`

**Navigation Pattern**: Linear wizard with progress tracking
**Exit Points**: Save draft (any step), Cancel (returns to Dashboard)
**Completion**: Redirects to Dashboard with success message

---

### **Package Creation 10-Step Flow** (Multi-Step Process)

**Entry Point**: Dashboard → "Create Package" or List Packages → "New Package"

```
Step 1: Package Type Selection (PackageSelectionStep.tsx) ✅
  ├─ Weekend Getaway
  ├─ Romantic Escape
  ├─ Family Adventure
  ├─ Business Elite
  ├─ Adventure Package
  ├─ Culinary Journey
  ├─ Wellness Retreat
  └─ Luxury Experience
  ↓
Step 2: Basics (BasicsStep.tsx) ✅
  ├─ Package name
  ├─ Description
  ├─ Duration
  ├─ Category & tags
  └─ Target audience
  ↓
Step 3: Media (MediaStep.tsx) ✅
  ├─ Hero image (required)
  ├─ Room & accommodation photos
  ├─ Activities & experiences photos
  ├─ Dining & amenities photos
  └─ Optional video upload
  ↓
Step 4: Highlights (HighlightsStep.tsx / HighlightsStepMerged.tsx) ✅
  ├─ Package highlights (key selling points)
  ├─ Highlight templates by package type
  ├─ Custom highlights
  └─ Icon selection for each highlight
  ↓
Step 5: Inclusions & Perks (PerksInclusionsStep.tsx) ✅
  ├─ Accommodation details
  ├─ Dining inclusions
  ├─ Activities & experiences
  ├─ Transportation
  └─ Services & amenities
  ↓
Step 6: Exclusions (ExclusionsStep.tsx) ✅
  ├─ Common exclusions (Flights, Insurance)
  ├─ Package-specific exclusions
  └─ Additional terms & conditions
  ↓
Step 7: Pricing (PricingStep.tsx) ✅
  ├─ Base package price
  ├─ Occupancy-based pricing
  ├─ Seasonal pricing
  └─ Special offers & discounts
  ↓
Step 8: Calendar & Availability (CalendarStep.tsx) ✅
  ├─ Available dates
  ├─ Blackout dates
  ├─ Capacity per date
  └─ Booking window
  ↓
Step 9: Policies (PolicyStep.tsx) ✅
  ├─ Cancellation policy
  ├─ Payment terms
  ├─ Age restrictions
  └─ Special requirements
  ↓
Step 10: Confirmation (ConfirmationStep.tsx) ✅
  ├─ Package summary
  ├─ Preview as guest would see
  ├─ Final review
  └─ Publish package
```

**Implementation Status**: ✅ **All 10 steps fully implemented**

**Components Found**:
- `PackageSelectionStep.tsx`
- `BasicsStep.tsx`
- `MediaStep.tsx`
- `HighlightsStep.tsx` / `HighlightsStepMerged.tsx`
- `PerksInclusionsStep.tsx`
- `ExclusionsStep.tsx`
- `PricingStep.tsx`
- `CalendarStep.tsx`
- `PolicyStep.tsx`
- `ConfirmationStep.tsx`

**Additional Component**:
- `SmallDescriptionStep.tsx` (Alternative description step)

**Navigation Pattern**: Linear wizard with progress tracking
**Exit Points**: Save draft (any step), Cancel (returns to List Packages)
**Completion**: Redirects to List Packages with success message

---

## 🧭 C) TOUR OPERATOR CORE NAVIGATION FLOWS

### **Operator Loop** (Main Navigation)

```
Dashboard (DashboardScreen.tsx) ✅
  ├→ Tours (ToursScreen.tsx) ✅
  ├→ Create Tour → [See 7-Step Flow]
  ├→ Calendar & Availability (CalendarScreen.tsx) ✅
  ├→ Bookings / Trips (BookingsScreen.tsx) ✅
  ├→ Verification (VerificationScreen.tsx) ✅
  └→ Settings (SettingsScreen.tsx) ✅
```

**Implementation Status**: ✅ **All main screens present (UI-level)**

---

### **Tour Creation 7-Step Flow** (Multi-Step Process)

**Entry Point**: Dashboard → "Create Tour" or Tours → "New Tour"

```
Step 1: Basics (TourBasicsStep.tsx) ✅
  ├─ Tour name
  ├─ Tour type/category
  ├─ Description
  ├─ Duration
  ├─ Difficulty level
  └─ Group size limits
  ↓
Step 2: Itinerary (TourItineraryStep.tsx) ✅
  ├─ Day-by-day itinerary builder
  ├─ Activity descriptions
  ├─ Time allocations
  ├─ Stops and locations
  └─ Drag-and-drop reordering
  ↓
Step 3: Media (TourMediaStep.tsx) ✅
  ├─ Tour photos
  ├─ Location images
  ├─ Activity photos
  └─ Optional video
  ↓
Step 4: Pricing (TourPricingStep.tsx) ✅
  ├─ Price per person
  ├─ Group discounts
  ├─ Seasonal pricing
  ├─ Inclusions pricing
  └─ Special offers
  ↓
Step 5: Calendar (TourCalendarStep.tsx) ✅
  ├─ Available tour dates
  ├─ Capacity per date
  ├─ Blackout dates
  └─ Booking cutoff times
  ↓
Step 6: Policies (TourPoliciesStep.tsx) ✅
  ├─ Cancellation policy
  ├─ Weather policy
  ├─ Age restrictions
  ├─ Health requirements
  └─ What to bring
  ↓
Step 7: Confirmation/Publish (TourConfirmationStep.tsx) ✅
  ├─ Tour summary
  ├─ Preview
  ├─ Final review
  └─ Publish tour
```

**Implementation Status**: ✅ **All 7 steps fully implemented**

**Components Found**:
- `TourBasicsStep.tsx`
- `TourItineraryStep.tsx`
- `TourMediaStep.tsx`
- `TourPricingStep.tsx`
- `TourCalendarStep.tsx`
- `TourPoliciesStep.tsx`
- `TourConfirmationStep.tsx`

**Navigation Pattern**: Linear wizard with progress tracking
**Exit Points**: Save draft (any step), Cancel (returns to Tours)
**Completion**: Redirects to Tours list with success message

---

## 🔐 VERIFICATION FLOW (Shared Concept)

### **Overview**

**Entry Point**: Dashboard → Verification (accessible from all roles)

**Purpose**: Identity and business verification for platform users

**Screen**: `VerificationScreen.tsx` ✅ (Shared across all roles)

---

### **Verification Types by Role**

#### **Traveller** (Optional)
- **Purpose**: Basic identity verification for trust and security
- **Requirements**: 
  - Government-issued ID (optional)
  - Email verification (required)
  - Phone verification (optional)
- **Impact**: 
  - Unlocks "Verified Traveller" badge
  - May improve booking approval rates
  - Not required for booking

#### **Hotel Manager** (Required for Publishing)
- **Purpose**: Business verification to ensure legitimate property listings
- **Requirements**:
  - Business license/registration
  - Tax ID/VAT number
  - Proof of property ownership or management rights
  - Bank account details for payouts
  - Government-issued ID of business owner
- **Impact**:
  - **Gates property publishing** (cannot publish until verified)
  - **Gates payout eligibility** (cannot receive payments)
  - May affect search ranking and visibility
  - Required for "Verified Partner" badge

#### **Tour Operator** (Required for Publishing)
- **Purpose**: Operator license and insurance verification for safety compliance
- **Requirements**:
  - Tour operator license
  - Business insurance certificate
  - Safety certifications (if applicable)
  - Tax ID/VAT number
  - Bank account details for payouts
  - Government-issued ID of business owner
- **Impact**:
  - **Gates tour publishing** (cannot publish until verified)
  - **Gates payout eligibility** (cannot receive payments)
  - May affect search ranking and visibility
  - Required for "Verified Operator" badge

---

### **Verification Status Types** (UI-implied)

| Status | Description | User Action |
|--------|-------------|-------------|
| `incomplete` | Missing documents or information | Upload required documents |
| `pending` | Verification submitted, awaiting admin review | Wait for review (24-48 hours) |
| `under_review` | Admin is actively reviewing documents | No action needed |
| `approved` | Verified and can publish/receive payouts | Can now publish listings |
| `rejected` | Verification failed, requires resubmission | Review rejection reason, resubmit |
| `expired` | Verification documents expired (annual renewal) | Upload updated documents |

---

### **Verification Flow Steps** (UI-level)

```
Dashboard → Verification
  ↓
1. Verification Status Overview
   ├─ Current status badge
   ├─ Progress indicator
   └─ Required documents checklist
   ↓
2. Document Upload Section
   ├─ Business license upload
   ├─ Tax ID upload
   ├─ Insurance certificate upload (tour operators)
   ├─ Bank details form
   └─ ID verification upload
   ↓
3. Review & Submit
   ├─ Document preview
   ├─ Completeness check
   └─ Submit for review button
   ↓
4. Pending State
   ├─ Estimated review time (24-48 hours)
   ├─ Email notification confirmation
   └─ Option to edit/update documents
   ↓
5. Approval/Rejection
   ├─ Status notification
   ├─ Admin feedback (if rejected)
   └─ Next steps guidance
```

---

### **Product-Level Impact** (TBD - Backend Logic)

**Likely Gating Behavior**:
- **Publishing**: Properties/tours remain in "draft" status until verification approved
- **Payouts**: Cannot receive payments or set up payout methods until verified
- **Search Visibility**: Unverified listings may be hidden from search results
- **Booking Acceptance**: May require verification to accept bookings

**Implementation Status**: 
- ✅ UI screen exists with document upload capability
- ⚠️ Backend verification workflow details TBD
- ⚠️ Admin review process and approval logic TBD
- ⚠️ Gating enforcement logic TBD

---


## ✅ VERIFICATION SUMMARY

### **Do We Have These Screens?**

#### ✅ **Traveller Flows - YES**
- Main loop: ✅ All screens present
- Settings drill-down: ✅ All 7 screens present
- Payments drill-down: ✅ All screens present
- Rewards path: ✅ Screen present
- **Gap**: Booking Checkout and Confirmation screens missing

#### ✅ **Hotel Manager Flows - YES**
- Primary manager loop: ✅ All screens present
- **10-step Hotel Listing Flow**: ✅ All 10 steps fully implemented
- **10-step Package Creation Flow**: ✅ All 10 steps fully implemented
- **Total**: 33 step components found

#### ✅ **Tour Operator Flows - YES**
- Operator loop: ✅ All screens present
- **7-step Tour Creation Flow**: ✅ All 7 steps fully implemented
- **Total**: 7 step components found

---

## 📋 MULTI-STEP FLOW COMPONENTS INVENTORY

### Hotel Manager Components (33 total)

**Hotel Listing Flow (10 steps)**:
1. `WelcomeStep.tsx`
2. `HotelInfoStep.tsx`
3. `LocationStep.tsx` / `ModernLocationStep.tsx`
4. `ModernPhotosStep.tsx`
5. `RoomDetailsStep.tsx` / `ModernRoomsStep.tsx`
6. `AmenitiesStep.tsx` / `ModernAmenitiesStep.tsx`
7. `ModernServicesStep.tsx`
8. `RulesStep.tsx` / `ModernPoliciesStep.tsx`
9. `ReviewStep.tsx`
10. `SuccessStep.tsx`

**Package Creation Flow (10 steps)**:
1. `PackageSelectionStep.tsx`
2. `BasicsStep.tsx`
3. `MediaStep.tsx`
4. `HighlightsStep.tsx` / `HighlightsStepMerged.tsx`
5. `PerksInclusionsStep.tsx`
6. `ExclusionsStep.tsx`
7. `PricingStep.tsx`
8. `CalendarStep.tsx`
9. `PolicyStep.tsx`
10. `ConfirmationStep.tsx`

**Additional Room Configuration Steps (5)**:
- `RoomTypeSelectionStep.tsx`
- `RoomBasicInfoStep.tsx`
- `BedConfigurationStep.tsx`
- `RoomAmenitiesStep.tsx`
- `RoomSummaryStep.tsx`

**Supporting Components**:
- `StepCompletionTracker.tsx`
- `CompleteHotelListingFlowSteps.tsx`
- `SmallDescriptionStep.tsx`

### Tour Operator Components (7 total)

**Tour Creation Flow (7 steps)**:
1. `TourBasicsStep.tsx`
2. `TourItineraryStep.tsx`
3. `TourMediaStep.tsx`
4. `TourPricingStep.tsx`
5. `TourCalendarStep.tsx`
6. `TourPoliciesStep.tsx`
7. `TourConfirmationStep.tsx`

---

## 🎯 FLOW IMPLEMENTATION STATUS

| Flow Type | Steps | Status | Components |
|-----------|-------|--------|------------|
| **Traveller Main Loop** | 6 screens | ✅ Complete | All implemented |
| **Traveller Settings** | 7 screens | ✅ Complete | All implemented |
| **Traveller Payments** | 3 screens | ✅ Complete | All implemented |
| **Traveller Rewards** | 1 screen | ✅ Complete | Implemented |
| **Traveller Booking** | 2 screens | ❌ Missing | Critical gap |
| **Hotel Manager Loop** | 7 screens | ✅ Complete | All implemented |
| **Hotel Listing Flow** | 10 steps | ✅ Complete | 10+ components |
| **Package Creation Flow** | 10 steps | ✅ Complete | 10+ components |
| **Tour Operator Loop** | 6 screens | ✅ Complete | All implemented |
| **Tour Creation Flow** | 7 steps | ✅ Complete | 7 components |

---

## 🔍 KEY FINDINGS

### ✅ **Strengths**
1. **Complete Multi-Step Flows**: All complex onboarding and creation flows have UI screens present
2. **Comprehensive Step Components**: 40+ step components for guided workflows
3. **Consistent Navigation Patterns**: Clear entry/exit points and progress tracking
4. **Professional UX**: Wizards with save draft, cancel, and review capabilities

### ⚠️ **Phase 3 Flow Gaps** (Screen-Level)
1. **Traveller Booking Flow**: Missing checkout and confirmation screens (critical flow blocker)

### 📋 **Post-Flow Feature Gaps** (Beyond Phase 3)

These are feature/backend gaps, not flow gaps. They don't break Phase 3 (user flows) but are needed for Phase 4/5 (features & backend):

2. **Guest Management**: Hotel managers cannot view guest details or special requests
3. **Financial Tracking**: Missing earnings/payouts screens for both partner types
4. **Payment Integration**: Payment screens exist but gateway integration (Stripe/Razorpay) may be stubbed
5. **Rewards Backend**: Loyalty program UI exists but points calculation/redemption logic may be incomplete
6. **Verification Workflow**: Verification screen exists but approval workflow and gating logic TBD

### 🎯 **Recommendations**
1. **Priority 1**: Implement Booking Checkout and Confirmation screens
2. **Priority 2**: Add Guest Management screen for hotel managers
3. **Priority 3**: Create Earnings/Payouts screens for both partner types

---

*Last Updated: 2026-01-29*  
*Document Version: 1.0*  
*Based on: product_scope_verification.md, extracted_tripavail codebase, and flow documentation*
