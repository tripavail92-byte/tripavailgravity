# TripAvail Backend - Deployment Guide

Complete step-by-step instructions to deploy your Supabase backend.

---

## 📋 Prerequisites

- Supabase account (you have this ✅)
- Supabase CLI installed
- Node.js 18+ installed

---

## STEP 1: Install Supabase CLI

```bash
# macOS/Linux
brew install supabase/tap/supabase

# Windows (PowerShell)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Or via NPM (all platforms)
npm install -g supabase
```

Verify installation:
```bash
supabase --version
```

---

## STEP 2: Login to Supabase

```bash
supabase login
```

This will open your browser. Login with your Supabase account.

---

## STEP 3: Link Your Project

```bash
supabase link --project-ref ffgdsyttlykyuplehdlb
```

When prompted:
- Enter your database password (the one you set when creating the project)
- Or find it in Supabase Dashboard → Settings → Database → Database password

---

## STEP 4: Run Database Migrations

Run these commands **in order**:

### Migration 1: Create Tables
```bash
supabase db push --file supabase/migrations/001_initial_schema.sql
```

✅ Expected: Creates 12 tables (users, properties, amenities, etc.)

### Migration 2: Seed Amenities
```bash
supabase db push --file supabase/migrations/002_seed_amenities.sql
```

✅ Expected: Inserts 86 amenities

### Migration 3: Row Level Security
```bash
supabase db push --file supabase/migrations/003_row_level_security.sql
```

✅ Expected: Enables RLS on all tables

### Migration 4: Storage Setup
```bash
supabase db push --file supabase/migrations/004_storage_setup.sql
```

✅ Expected: Creates 3 storage buckets

**OR run all at once:**
```bash
supabase db push
```

---

## STEP 5: Verify Database Setup

Go to Supabase Dashboard → Table Editor

You should see these tables:
- ✅ users
- ✅ properties
- ✅ amenities (with 86 rows)
- ✅ property_amenities
- ✅ discounts
- ✅ property_images
- ✅ bookings
- ✅ reviews
- ✅ payments
- ✅ favorites
- ✅ notifications
- ✅ search_history

---

## STEP 6: Deploy Edge Function

### Set Environment Variables

```bash
# Set required environment variables
supabase secrets set SUPABASE_URL=https://ffgdsyttlykyuplehdlb.supabase.co
supabase secrets set SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY_HERE
```

**Where to find keys:**
- Go to Supabase Dashboard → Settings → API
- Copy `anon` `public` key → Use as SUPABASE_ANON_KEY
- Copy `service_role` key → Use as SUPABASE_SERVICE_ROLE_KEY

### Deploy the Function

```bash
supabase functions deploy server
```

✅ Expected output:
```
Deploying function: server
Function deployed successfully!
Function URL: https://ffgdsyttlykyuplehdlb.supabase.co/functions/v1/server
```

---

## STEP 7: Test the API

### Test Health Endpoint

```bash
curl https://ffgdsyttlykyuplehdlb.supabase.co/functions/v1/server/health
```

✅ Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-03T...",
  "service": "TripAvail API Server",
  "version": "1.0.0"
}
```

### Test Amenities Endpoint

```bash
curl https://ffgdsyttlykyuplehdlb.supabase.co/functions/v1/server/api/amenities
```

✅ Expected: JSON response with 86 amenities grouped by category

---

## STEP 8: Get Your API Credentials

For your frontend, you'll need:

### 1. Supabase URL
```
https://ffgdsyttlykyuplehdlb.supabase.co
```

### 2. Supabase Anon Key
Go to: Dashboard → Settings → API → Copy `anon` `public` key

### 3. API Base URL
```
https://ffgdsyttlykyuplehdlb.supabase.co/functions/v1/server/api
```

---

## STEP 9: Update Frontend Environment Variables

Create `.env.local` in your web project:

```env
VITE_SUPABASE_URL=https://ffgdsyttlykyuplehdlb.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE
VITE_API_BASE_URL=https://ffgdsyttlykyuplehdlb.supabase.co/functions/v1/server/api
```

---

## 🎯 Available API Endpoints

Once deployed, you have these endpoints:

### Authentication
```
POST   /api/auth/signup        - Create account
POST   /api/auth/signin        - Sign in
POST   /api/auth/signout       - Sign out
GET    /api/auth/session       - Get session
```

### Properties (Hotel Listing)
```
GET    /api/properties         - List all published properties
GET    /api/properties/:id     - Get property details
POST   /api/properties         - Create property (auth required)
PUT    /api/properties/:id     - Update property (auth required)
POST   /api/properties/:id/publish  - Publish property (auth required)
DELETE /api/properties/:id     - Delete property (auth required)
GET    /api/properties/user/my-properties  - Get my properties (auth required)
```

### Discounts
```
POST   /api/discounts/:propertyId  - Set discount (auth required)
GET    /api/discounts/:propertyId  - Get discount
DELETE /api/discounts/:propertyId  - Remove discount (auth required)
```

### Amenities
```
GET    /api/amenities              - Get all amenities (grouped)
POST   /api/amenities/:propertyId  - Set property amenities (auth required)
GET    /api/amenities/:propertyId  - Get property amenities
```

### Users
```
GET    /api/users/me               - Get current user (auth required)
PUT    /api/users/me               - Update profile (auth required)
POST   /api/users/me/switch-role   - Switch role (auth required)
```

### Coming Soon
```
/api/bookings  - Create and manage bookings
/api/reviews   - Property reviews
/api/search    - Search properties
/api/uploads   - File uploads
```

---

## 🔑 Authentication Flow

### 1. Sign Up
```bash
curl -X POST https://ffgdsyttlykyuplehdlb.supabase.co/functions/v1/server/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "full_name": "Test User"
  }'
```

### 2. Sign In
```bash
curl -X POST https://ffgdsyttlykyuplehdlb.supabase.co/functions/v1/server/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

Response includes `access_token` - use this for authenticated requests.

### 3. Make Authenticated Request
```bash
curl https://ffgdsyttlykyuplehdlb.supabase.co/functions/v1/server/api/users/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

---

## 🧪 Testing the Complete Flow

### Test 1: Create a Hotel Listing

```bash
# 1. Sign up
curl -X POST https://ffgdsyttlykyuplehdlb.supabase.co/functions/v1/server/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "hotelowner@test.com",
    "password": "password123",
    "full_name": "Hotel Owner"
  }'

# Save the access_token from response

# 2. Switch to hotel_manager role
curl -X POST https://ffgdsyttlykyuplehdlb.supabase.co/functions/v1/server/api/users/me/switch-role \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role": "hotel_manager"}'

# 3. Create property
curl -X POST https://ffgdsyttlykyuplehdlb.supabase.co/functions/v1/server/api/properties \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sunset Beach Hotel",
    "property_type": "hotel",
    "description": "Beautiful beachfront hotel",
    "address": "123 Beach Road",
    "city": "Miami",
    "country": "USA",
    "base_price_per_night": 150,
    "max_guests": 4
  }'

# Save the property id from response

# 4. Set discount
curl -X POST https://ffgdsyttlykyuplehdlb.supabase.co/functions/v1/server/api/discounts/PROPERTY_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "is_enabled": true,
    "percentage": 25
  }'

# 5. Get all amenities
curl https://ffgdsyttlykyuplehdlb.supabase.co/functions/v1/server/api/amenities

# 6. Set property amenities (use IDs from step 5)
curl -X POST https://ffgdsyttlykyuplehdlb.supabase.co/functions/v1/server/api/amenities/PROPERTY_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amenity_ids": ["amenity-id-1", "amenity-id-2", "amenity-id-3"]
  }'
```

---

## 🐛 Troubleshooting

### "Function not found"
- Make sure you deployed: `supabase functions deploy server`
- Check function logs: `supabase functions logs server`

### "Database connection failed"
- Verify you linked correct project: `supabase link --project-ref ffgdsyttlykyuplehdlb`
- Check database is running in Supabase Dashboard

### "Unauthorized" errors
- Make sure you're sending `Authorization: Bearer TOKEN` header
- Token might be expired - sign in again to get new token

### "CORS errors" in browser
- CORS is configured for localhost:5173 and localhost:3000
- Update `supabase/functions/server/index.ts` to add your domain

### View Logs
```bash
# Real-time logs
supabase functions logs server --follow

# Recent logs
supabase functions logs server
```

---

## 🔄 Updating the Backend

### Update Edge Function
```bash
# Make changes to files in /supabase/functions/server/
# Then deploy again
supabase functions deploy server
```

### Add New Migration
```bash
# Create new migration file
supabase migration new my_changes

# Edit the file in /supabase/migrations/

# Apply migration
supabase db push
```

---

## 📊 Monitoring

### View Function Logs
```bash
supabase functions logs server --follow
```

### View Database Activity
- Go to Dashboard → Database → Query Performance
- Monitor slow queries
- Check connection pool

### Storage Usage
- Dashboard → Storage → Buckets
- Monitor file upload sizes
- Clean up orphaned files

---

## ✅ Checklist

- [  ] Supabase CLI installed
- [ ] Logged into Supabase
- [ ] Project linked
- [ ] All 4 migrations run successfully
- [ ] 12 tables created
- [ ] 86 amenities inserted
- [ ] Storage buckets created
- [ ] Environment variables set
- [ ] Edge function deployed
- [ ] Health endpoint returns 200
- [ ] Amenities endpoint returns data
- [ ] Frontend .env.local configured

---

## 🚀 You're Done!

Your backend is now live at:
```
https://ffgdsyttlykyuplehdlb.supabase.co/functions/v1/server
```

**Next Steps:**
1. Test all endpoints with Postman/Thunder Client
2. Integrate with your React frontend
3. Build the remaining endpoints (bookings, reviews, search)
4. Add file upload functionality
5. Implement payment processing (Stripe)

---

## 📞 Need Help?

- Check logs: `supabase functions logs server`
- Supabase Docs: https://supabase.com/docs
- Edge Functions Guide: https://supabase.com/docs/guides/functions

---

**Created:** January 3, 2025  
**Project:** TripAvail  
**Backend Status:** ✅ Core features ready for hotel listing flow
