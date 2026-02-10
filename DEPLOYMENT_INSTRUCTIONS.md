# Package Booking System - Deployment Guide

## ✅ Pre-Deployment Checklist

- [x] **Database Migrations Applied**: All 4 package booking migrations successfully applied to production Supabase
- [x] **Environment Configuration**: `.env` configured with correct Supabase URL and anon key  
- [x] **Build Verification**: Production build tested and working (`pnpm --filter @tripavail/web build`)
- [x] **Feature Testing**: Overlap rejection and expiry mechanism validated with comprehensive tests

## 🚀 Deployment Options

### Option 1: Railway CLI Deployment (Recommended)

#### Step 1: Authenticate with Railway
```bash
railway login
```

#### Step 2: Link to Railway Project (if not already linked)
```bash
railway link
```
Select your TripAvail project from the list.

#### Step 3: Set Environment Variables
Set these environment variables in Railway (if not already set):

```bash
railway variables set VITE_SUPABASE_URL=https://zkhppxjeaizpyinfpecj.supabase.co
railway variables set VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpraHBweGplYWl6cHlpbmZwZWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MzA5NDIsImV4cCI6MjA4NTIwNjk0Mn0.UWo3pVif2zsN44kAjyYWwhU48XcmC4RPTiw5GSYq1rg
```

Add your Stripe key if needed:
```bash
railway variables set VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

#### Step 4: Deploy
```bash
railway up
```

The deployment will:
1. Install dependencies via `pnpm install --frozen-lockfile`
2. Build the web app via `pnpm --filter @tripavail/web build`
3. Start the server via `pnpm --filter @tripavail/web preview --host`

---

### Option 2: Railway Dashboard Deployment

#### Step 1: Access Railway Dashboard
1. Go to [railway.app](https://railway.app)
2. Log in to your account
3. Select your TripAvail project

#### Step 2: Configure Environment Variables
In the Railway dashboard, add these variables:

| Variable | Value |
|----------|-------|
| `VITE_SUPABASE_URL` | `https://zkhppxjeaizpyinfpecj.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpraHBweGplYWl6cHlpbmZwZWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MzA5NDIsImV4cCI6MjA4NTIwNjk0Mn0.UWo3pVif2zsN44kAjyYWwhU48XcmC4RPTiw5GSYq1rg` |
| `VITE_STRIPE_PUBLISHABLE_KEY` | *(your Stripe key)* |

#### Step 3: Deploy from GitHub
1. Connect your GitHub repository to Railway
2. Railway will automatically detect `nixpacks.toml` and use it for deployment
3. Trigger deployment from the main/master branch

---

## 📦 What's Deployed

### New Features
- **Package Booking System**: Fixed-package booking with 10-minute holds
- **Date Overlap Validation**: Prevents double-booking same package
- **Automatic Expiry**: Releases holds after 10 minutes if unpaid
- **Package Details Page**: Date picker with real-time availability checks
- **Package Checkout Page**: Countdown timer showing remaining hold time

### Database Changes
- `packages.hotel_id` column linking packages to hotels
- `package_bookings.expires_at` timestamp for hold mechanism
- `package_bookings` status extended to include 'expired'
- 4 new SQL functions:
  - `check_package_availability()`
  - `calculate_package_price()`
  - `create_package_booking_atomic()`
  - `expire_package_bookings()`

### API Endpoints (via Supabase RPC)
All package booking operations use serverless functions:
- `/rest/v1/rpc/check_package_availability` - Check date availability
- `/rest/v1/rpc/calculate_package_price` - Get dynamic pricing
- `/rest/v1/rpc/create_package_booking_atomic` - Create booking with lock
- `/rest/v1/rpc/expire_package_bookings` - Expire pending bookings (cron job)

---

## 🔍 Post-Deployment Verification

### 1. Check Deployment Status
```bash
railway status
```

### 2. View Logs
```bash
railway logs
```

### 3. Open Deployed App
```bash
railway open
```

### 4. Test Package Booking Flow
1. Navigate to a package details page
2. Select check-in/check-out dates
3. Click "Book Package"
4. Verify countdown timer appears on checkout page
5. Complete or abandon booking to test expiry

### 5. Verify Database Functions
Use Supabase SQL Editor to test:

```sql
-- Test availability check
SELECT check_package_availability(
  'your-package-id',
  '2026-03-10T15:00:00Z',
  '2026-03-13T11:00:00Z'
);

-- Test price calculation
SELECT * FROM calculate_package_price(
  'your-package-id',
  '2026-03-10T15:00:00Z',
  '2026-03-13T11:00:00Z'
);
```

---

## 🔧 Troubleshooting

### Build Fails
- **Issue**: Import errors or TypeScript errors
- **Fix**: Run `pnpm --filter @tripavail/web typecheck` locally first

### Environment Variables Not Loading
- **Issue**: App shows connection errors
- **Fix**: Verify variables are set in Railway dashboard with `VITE_` prefix

### Database Connection Issues
- **Issue**: Supabase RPC calls fail
- **Fix**: 
  1. Check Supabase URL is correct in Railway variables
  2. Verify anon key has proper permissions
  3. Check RLS policies in Supabase dashboard

### Expiry Job Not Running
- **Issue**: Bookings stay 'pending' past 10 minutes
- **Fix**: Set up a cron job to call `expire_package_bookings()` every 1-2 minutes:
  - Use Supabase Edge Functions with cron trigger, OR
  - Use Railway Cron Jobs feature, OR
  - Use external cron service (e.g., cron-job.org) hitting your endpoint

---

## 📊 Monitoring

### Key Metrics to Watch
1. **Booking Conversion Rate**: `confirmed_bookings / created_bookings`
2. **Expiry Rate**: `expired_bookings / created_bookings` (should be < 30%)
3. **Overlap Rejection Rate**: Monitor error logs for "Package not available" errors
4. **Average Hold Duration**: Time from creation to confirmation/expiry

### Recommended Monitoring Tools
- Railway built-in metrics for response times and errors
- Supabase Analytics for database performance
- Custom dashboard querying `package_bookings` table

---

## 🎯 Next Steps

1. **Set Up Cron Job**: Configure automated expiry job (every 1-2 minutes)
2. **Enable Alerts**: Set up Railway alerts for build failures or downtime
3. **Add Analytics**: Integrate analytics tracking for booking funnel
4. **Load Testing**: Test concurrent bookings to validate locking mechanism
5. **Documentation**: Update user-facing docs with new package booking flow

---

## 📝 Rollback Plan

If issues arise post-deployment:

### Quick Rollback (Railway)
```bash
railway rollback
```

### Database Rollback (if needed)
Supabase migrations are forward-only. To rollback:
1. Create new migration that reverts changes
2. Or restore from Supabase backup (Settings → Database → Backups)

### Feature Flag Alternative
Add a feature flag to disable package bookings without full rollback:
```typescript
// In packages/web/src/config.ts
export const FEATURES = {
  PACKAGE_BOOKINGS_ENABLED: import.meta.env.VITE_ENABLE_PACKAGE_BOOKINGS === 'true'
};
```

Then wrap package booking UI in conditional:
```typescript
{FEATURES.PACKAGE_BOOKINGS_ENABLED && <BookPackageButton />}
```

---

## ✅ Deployment Complete!

Once deployed, your package booking system is live with:
- 10-minute hold mechanism preventing inventory issues
- Date overlap validation preventing double-bookings
- Automatic expiry releasing abandoned holds
- Real-time availability checks before booking
- Professional checkout experience with countdown timer

**Congratulations!** 🎉
