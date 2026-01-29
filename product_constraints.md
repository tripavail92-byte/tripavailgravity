# TripAvail - Product Constraints (LOCKED)

> **Document Purpose**: Defines non-negotiable product rules. Sign-off required before coding.

---

## 1. Role Constraint (Mutual Exclusivity) 🔒
✓ **Every user starts as a Traveller**
✓ **Traveller can choose ONLY ONE partner role**:
  - Hotel Manager **OR** Tour Operator (never both)
✓ **This choice is permanent** (one-time decision)
✓ **User can switch between**:
  - Traveller view ↔ Chosen partner view
✓ **Database trigger enforces this constraint** (no code workaround)

---

## 2. Verification Semantics 🔒
✓ **Traveller**: Optional (unlocks "Verified" badge)
✓ **Hotel Manager**: Required for publishing properties
   - Can draft properties but cannot publish until verified
   - Payouts blocked until verified
✓ **Tour Operator**: Required for publishing tours
   - Can draft tours but cannot publish until verified
   - Payouts blocked until verified
✓ **Verification Statuses**: `pending` → `under_review` → `approved` / `rejected`

---

## 3. Booking Ownership Rules 🔒
✓ **Traveller**: Creates bookings (owns the demand side)
✓ **Hotel Manager**: Receives property bookings (owns the supply side)
✓ **Tour Operator**: Receives tour bookings (owns the supply side)
✓ **Context Awareness**:
  - A user in "Traveller" mode sees their *trips*
  - A user in "Manager" mode sees their *reservations*

---

## 4. Data Persistence Rules 🔒
✓ **All data linked to `user_id`** (not role tables)
✓ **Properties persist** when switching context to Traveller
✓ **Tours persist** when switching context to Traveller
✓ **Traveller bookings persist** when switching context to Partner
✓ **No data loss on role switch**

---

## 5. Payment Gateway (Postponed Decision) ⚠️
⚠️ **Payment gateway choice is NOT locked** (Stripe vs Razorpay vs both)
⚠️ **Decision deferred to Phase 4** (Backend Implementation)
✓ **Booking checkout UI must be built with abstraction layer**
✓ **Payment integration must be pluggable** (not hardcoded to one provider)

---

## 6. Frontend Design Constraint (NON-NEGOTIABLE) 🔒
✓ **The folder `extracted_tripavail_frontend_screens` is the BIBLE**
  - Contains ~90% of final frontend
  - Single source of truth for UI/UX
✓ **Web portal MUST look and behave EXACTLY like existing screens**
✓ **Any missing screens (e.g., checkout) MUST**:
  - Follow the same visual language
  - Follow the same navigation patterns
  - Feel like they were always part of the same app
✓ **NO redesigns or "improvements" allowed**

---

## 7. Role-Based Branding 🔒
✓ **Traveller**: Airbnb Rose (`#FF385C` - `#FF6B9D`)
✓ **Hotel Manager**: Purple Cyan Flow (`#9D4EDD` - `#00D4FF`)
✓ **Tour Operator**: Bright Coral (`#FD5E53`)
✓ **Implementation**:
  - CSS variables for primary colors
  - Tailwind design tokens
  - Check `react_engineering_standards.md` for exact values
✓ **Components must be role-agnostic** (no branching logic inside buttons)

---

## 8. Technology Stack (LOCKED) 🔒
✓ **Frontend**: React 18 + TypeScript + Vite
✓ **Styling**: Tailwind CSS + shadcn/ui
✓ **State**: Zustand (UI) + TanStack Query (Server)
✓ **Mobile**: React Native + Expo (Phase 2)
❌ **Flutter Web is NOT approved**
❌ **Changes require executive re-approval**

---

## ✍️ Sign-Off Section

**I certify that these constraints are correct and ready for implementation.**

**Product Owner**: __________________________  
**Date**: __________________________  
**Engineering Lead**: <u>Antigravity AI</u>  
**Date**: <u>2026-01-30</u>
