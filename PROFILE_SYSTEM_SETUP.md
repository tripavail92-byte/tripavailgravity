# Traveller Profile System - Database Setup Guide

## Overview
The new TravellerProfilePage is fully functional but requires Supabase database and storage configuration to work live.

---

## 1. Create Profiles Table

Run this SQL in Supabase SQL Editor:

```sql
-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  bio TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  date_of_birth DATE,
  email_verified BOOLEAN DEFAULT FALSE,
  phone_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('UTC'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('UTC'::TEXT, NOW()) NOT NULL
);

-- Create indexes for performance
CREATE INDEX profiles_email_idx ON public.profiles(email);
CREATE INDEX profiles_created_at_idx ON public.profiles(created_at DESC);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can read their own profile
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('UTC'::TEXT, NOW());
  RETURN NEW;
END;
$$ LANGUAGE PLPGSQL;

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

---

## 2. Create Storage Bucket for Avatars

1. Go to Supabase Dashboard → Storage
2. Click **New bucket**
3. Name: `user-avatars`
4. Set to **Public** (so avatars display without auth)
5. Click **Create bucket**

### Set RLS Policies for Storage

```sql
-- Authenticated users can upload to their own folder
CREATE POLICY "Users can upload avatars" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'user-avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Anyone can read avatars (public)
CREATE POLICY "Public access" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'user-avatars');
```

---

## 3. Create Edge Functions for Phone OTP (Optional but Recommended)

### Option A: Using Twilio (Recommended)

1. **Set up Twilio account** at twilio.com
2. Get Twilio credentials from console:
   - Account SID
   - Auth Token
   - Phone number for SMS

3. **Create send-phone-otp edge function**

Go to Supabase Dashboard → Edge Functions → Create function

```typescript
// supabase/functions/send-phone-otp/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID')
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')
const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER')

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  const { phone } = await req.json()

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString()

  // Store OTP in a temporary table (create phone_otps table)
  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL'),
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  )

  // Store OTP with expiration
  await supabase.from('phone_otps').insert({
    phone,
    otp,
    expires_at: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
  })

  // Send SMS via Twilio
  const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      From: TWILIO_PHONE_NUMBER!,
      To: phone,
      Body: `Your TripAvail verification code is: ${otp}`
    }).toString()
  })

  if (!response.ok) {
    return new Response(JSON.stringify({ error: 'Failed to send OTP' }), { status: 500 })
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 })
})
```

4. **Create verify-phone-otp edge function**

```typescript
// supabase/functions/verify-phone-otp/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  const { phone, otp } = await req.json()

  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL'),
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  )

  // Check OTP validity
  const { data, error } = await supabase
    .from('phone_otps')
    .select('*')
    .eq('phone', phone)
    .eq('otp', otp)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (error || !data) {
    return new Response(JSON.stringify({ error: 'Invalid or expired OTP' }), { status: 400 })
  }

  // OTP valid - delete it and return success
  await supabase.from('phone_otps').delete().eq('id', data.id)

  return new Response(JSON.stringify({ success: true }), { status: 200 })
})
```

5. **Set environment variables** in Supabase project:
   - TWILIO_ACCOUNT_SID
   - TWILIO_AUTH_TOKEN
   - TWILIO_PHONE_NUMBER

### Option B: Mock Implementation (For Testing)

If you don't want to set up Twilio yet, the userProfileService already has a mock implementation. Just comment out the Twilio calls and use a hardcoded OTP for testing.

---

## 4. Create phone_otps Table (For OTP Storage)

```sql
CREATE TABLE public.phone_otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  otp TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('UTC'::TEXT, NOW())
);

-- Delete expired OTPs after 15 minutes
CREATE POLICY "Expired OTPs are deleted" ON public.phone_otps
  FOR DELETE
  USING (expires_at < TIMEZONE('UTC'::TEXT, NOW()));
```

---

## 5. Add Authentication Middleware (Optional)

If you want to protect `/profile` and `/settings` routes, add this to your layouts:

```typescript
// In TravellerLayout.tsx or wherever profile route is rendered
import { useAuth } from '@/hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'

export default function TravellerLayout() {
  const { session } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!session) {
      navigate('/auth/login', { replace: true })
    }
  }, [session])

  if (!session) {
    return <div>Redirecting to login...</div>
  }

  // ... rest of layout
}
```

---

## 6. Testing Checklist

- [ ] Database profiles table created with all columns
- [ ] RLS policies enabled (users can read/write own profile)
- [ ] Storage bucket `user-avatars` created
- [ ] Edge functions deployed (or mock implementation ready)
- [ ] Environment variables set in Supabase
- [ ] Auth user created for testing
- [ ] Profile loaded on page visit
- [ ] Can edit and save profile changes
- [ ] Avatar upload works
- [ ] Email verification sends email
- [ ] Phone verification sends OTP
- [ ] Phone OTP verification updates profile

---

## 7. Troubleshooting

### Profile not loading
- Check: User is authenticated (check browser DevTools → Application → Cookies → auth token)
- Check: Supabase connection string is correct in `.env.local`
- Check: profiles table exists and RLS policies allow SELECT

### Save fails
- Check: RLS UPDATE policy allows current user
- Check: All required fields are being sent
- Check: updated_at trigger exists

### Avatar upload fails
- Check: user-avatars bucket is PUBLIC
- Check: Storage RLS policies allow INSERT
- Check: File size is under limit

### OTP not sending
- Check: Edge function is deployed
- Check: Twilio credentials are correct
- Check: Phone number is in valid format (+1234567890)

---

## Environment Variables Needed

Add to `.env.local` or `.env.production`:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

For edge functions (set in Supabase project settings):
```
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

---

## Production Deployment Notes

1. **Security**: Update RLS policies to be more restrictive if needed
2. **Storage**: Configure CORS if uploading from different domain
3. **Edge Functions**: Test OTP rate limiting to prevent abuse
4. **Clean up**: Add cron job to delete expired OTPs regularly
5. **Monitoring**: Monitor failed OTP attempts for security issues

---

## Current Status

✅ TravellerProfilePage fully implemented with:
- Real data loading and editing
- Avatar upload
- Email/phone verification UI
- Profile completion tracking

⏳ Awaiting:
- Database setup (profiles table, RLS policies)
- Storage bucket creation
- Edge functions deployment
- Testing on production

Once the above is complete, the profile system will be fully live! 🚀
