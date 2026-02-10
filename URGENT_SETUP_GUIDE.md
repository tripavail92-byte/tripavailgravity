# 🚀 URGENT SETUP - Run Migrations & Create Storage Bucket

## ⚠️ Current Issues

Your profile system is failing because:
1. ❌ SQL migrations NOT run in Supabase yet
2. ❌ Storage bucket `user-avatars` doesn't exist
3. ⚠️ Dialog accessibility warnings in profile page

---

## ✅ IMMEDIATE FIX (5 minutes)

### Step 1: Run SQL Migrations in Supabase (2 minutes)

1. **Go to Supabase Dashboard**
2. **Select your project**
3. **Navigate to SQL Editor**
4. **Click "New Query"**
5. **Copy & paste the ENTIRE contents of:**
   ```
   supabase/migrations/20260211_create_profiles_system.sql
   ```
6. **Click "Run"** (green play button)
7. **Wait for success message** ✅

8. **Click "New Query" again**
9. **Copy & paste the ENTIRE contents of:**
   ```
   supabase/migrations/20260211_create_settings_tables.sql
   ```
10. **Click "Run"** ✅

---

### Step 2: Create Storage Bucket (1 minute)

1. **In Supabase Dashboard, go to Storage**
2. **Click "New Bucket"**
3. **Name it:** `user-avatars`
4. **Access Level:** CHECK "Public bucket"
5. **Click "Create bucket"** ✅

6. **Click on the bucket**
7. **Go to Policies tab**
8. **Click "New Policy"**
9. **Select "For SELECT" (read)**
10. **Click "Create"** (use defaults)

11. **Click "New Policy" again**
12. **Select "For INSERT"**
13. **Click "Create"** (use defaults)

---

### Step 3: Verify Setup

Go back to your app:
1. **Refresh the page** (F5)
2. **Go to Profile page**
3. **Try editing your name**
4. **Click Save**
5. **Refresh the page**
6. **Name should persist** ✅

---

## 🔧 Dialog Accessibility Fix

The profile page modals need proper Dialog components. Update:

### Replace Modal JSX with Dialog Component

**In TravellerProfilePage.tsx, replace the custom modals with proper Dialog components:**

```tsx
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
```

Then replace the modals:

**Email Verification Modal:**
```tsx
<Dialog open={showEmailVerification} onOpenChange={setShowEmailVerification}>
  <DialogContent>
    <DialogTitle>Verify Your Email</DialogTitle>
    <DialogDescription>
      We'll send a verification link to {profile?.email}
    </DialogDescription>
    
    <div className="flex gap-3">
      <Button variant="outline" className="flex-1" onClick={() => setShowEmailVerification(false)}>
        Cancel
      </Button>
      <Button className="flex-1 bg-primary" onClick={handleVerifyEmail} disabled={isVerifying}>
        {isVerifying ? <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Sending...
        </> : 'Send Verification Link'}
      </Button>
    </div>
  </DialogContent>
</Dialog>
```

**Phone Verification Modal:**
```tsx
<Dialog open={showPhoneVerification} onOpenChange={setShowPhoneVerification}>
  <DialogContent>
    <DialogTitle>Verify Your Phone</DialogTitle>
    <DialogDescription>
      Enter the OTP sent to {profile?.phone}
    </DialogDescription>
    
    <input
      type="text"
      placeholder="Enter 6-digit OTP"
      value={phoneOTP}
      onChange={(e) => setPhoneOTP(e.target.value.replace(/\D/g, '').slice(0, 6))}
      maxLength={6}
      className="w-full px-4 py-3 border border-gray-200 rounded-lg text-center text-2xl tracking-widest font-mono"
    />
    
    <div className="flex gap-3">
      <Button variant="outline" className="flex-1" onClick={() => setShowPhoneVerification(false)}>
        Cancel
      </Button>
      <Button className="flex-1 bg-primary" onClick={handleVerifyPhoneOTP} disabled={isVerifying || phoneOTP.length !== 6}>
        {isVerifying ? <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Verifying...
        </> : 'Verify OTP'}
      </Button>
    </div>
  </DialogContent>
</Dialog>
```

---

## ✨ After Setup

Once you complete these steps:
- ✅ Profile data will save to database
- ✅ Avatar upload will work
- ✅ Dialog accessibility warnings will be gone
- ✅ Email/phone verification will work
- ✅ All data persists on page refresh

---

## 🆘 Troubleshooting

### "Migration failed" error?
- Check you're copying the ENTIRE file (including all lines)
- Make sure there are no syntax errors
- Try running it line by line if it fails

### "Bucket not found" still?
- Refresh the page after creating bucket
- Make sure "Public bucket" is checked
- Wait 2-3 seconds after creation

### "403 Forbidden" on avatar upload?
- Go back to Storage → user-avatars → Policies
- Make sure both SELECT and INSERT policies are created
- Check "Public bucket" is still enabled

### Profile not saving?
- Check SQL migrations ran successfully (no errors)
- Check RLS policies are correct
- Verify user is authenticated

---

## Timeline

- **1 minute**: Run first migration
- **1 minute**: Run second migration
- **1 minute**: Create storage bucket
- **1 minute**: Test everything
- **2 minutes**: Update Dialog components (optional)

**Total: 5 minutes** ⏱️

---

**Do these steps now, then let me know if you see any errors!**
