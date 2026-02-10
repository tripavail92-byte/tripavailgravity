# Profile System - Production Testing Guide

## 📋 Pre-Test Checklist

- [ ] SQL migration has been run in Supabase
- [ ] profiles table exists with all columns
- [ ] RLS policies are active
- [ ] user-avatars storage bucket exists and is PUBLIC
- [ ] Edge functions deployed (send-phone-otp, verify-phone-otp)
- [ ] Test user account created in Auth
- [ ] Environment variables are set

---

## 🧪 Test Cases

### **Test 1: Profile Loading**
**Steps:**
1. Create a test user in Supabase Auth (e.g., `test@tripavail.com` / `password123`)
2. Log in to production: https://tripavail-web-production.up.railway.app
3. Navigate to `/profile`

**Expected Results:**
- ✅ Page loads without errors
- ✅ Spinner shows while loading
- ✅ User email displays (from auth)
- ✅ Other fields show "Not added" if empty
- ✅ Profile completion shows 0% (empty profile)

**Troubleshooting:**
- If spinner loops forever: Check Supabase connection in console
- If "Failed to load" error: Check RLS SELECT policy

---

### **Test 2: Edit Profile - Name**
**Steps:**
1. Click Edit button in header
2. Enter first name: "John"
3. Enter last name: "Doe"
4. Click "Save Changes"

**Expected Results:**
- ✅ Form inputs appear in edit mode
- ✅ Fields populate with current values (or empty)
- ✅ Save button shows loading spinner
- ✅ Toast shows "Profile saved successfully!"
- ✅ Edit mode closes
- ✅ Name displays as "John Doe" on profile

**Troubleshooting:**
- If save fails: Check RLS UPDATE policy allows user
- If data doesn't persist: Check updated_at trigger exists

---

### **Test 3: Edit Profile - Bio**
**Steps:**
1. Click Edit
2. Scroll to bio textarea
3. Type: "Passionate traveler exploring the world!"
4. Save

**Expected Results:**
- ✅ Bio textarea appears initialized with current value
- ✅ Save works for multi-line text
- ✅ Bio displays in About Me section after save
- ✅ Profile completion increases

---

### **Test 4: Edit Profile - Address & City**
**Steps:**
1. Click Edit
2. Enter Address: "123 Main Street"
3. Enter City: "San Francisco"
4. Save

**Expected Results:**
- ✅ Address and City fields are editable
- ✅ Values save to database
- ✅ Fields update on profile display
- ✅ Profile completion increases

---

### **Test 5: Edit Profile - Date of Birth**
**Steps:**
1. Click Edit
2. Scroll to "Date of Birth" field
3. Click on date field
4. Select date from calendar (e.g., Jan 15, 1990)
5. Save

**Expected Results:**
- ✅ Calendar picker opens
- ✅ Selected date displays as "January 15, 1990"
- ✅ Date persists after save
- ✅ Profile completion increases

---

### **Test 6: Edit Profile - Phone Number**
**Steps:**
1. Click Edit
2. Enter Phone: "+1 (555) 123-4567"
3. Save

**Expected Results:**
- ✅ Phone field accepts input
- ✅ Data saves to database
- ✅ Phone now shows in contact info
- ✅ Profile completion increases

---

### **Test 7: Avatar Upload**
**Steps:**
1. Click Edit
2. Click camera icon on avatar circle
3. Select an image file (JPG or PNG, <5MB)
4. Wait for upload to complete

**Expected Results:**
- ✅ File picker opens
- ✅ Image preview appears
- ✅ Upload shows progress/spinner
- ✅ Avatar updates on page immediately
- ✅ Avatar URL saved to database
- ✅ Avatar persists on page reload
- ✅ Profile completion increases

**Troubleshooting:**
- If upload fails: Check storage bucket is PUBLIC
- If no progress: Check file size is reasonable

---

### **Test 8: Email Verification**
**Steps:**
1. On profile, next to email, click "Verify" button
2. Modal appears asking to confirm
3. Click "Send Verification Link"
4. Check email inbox

**Expected Results:**
- ✅ Modal appears with email address
- ✅ Button shows "Sending..." state
- ✅ Toast shows "Verification email sent"
- ✅ Verification email arrives (may take 30 seconds)
- ✅ Email contains verification link
- ✅ After clicking link, modal closes
- ✅ Email shows "Verified" badge on profile

**Troubleshooting:**
- If email not received: Check spam folder
- If modal doesn't close: Manually check email_verified in DB

---

### **Test 9: Phone Verification - Send OTP**
**Steps:**
1. Add a phone number (if not already added)
2. Click "Verify" next to phone
3. Modal appears to enter OTP
4. App sends OTP to phone

**Expected Results:**
- ✅ Modal shows phone number
- ✅ Toast shows "Verification code sent"
- ✅ SMS arrives on phone with OTP code
- ✅ OTP valid for 10 minutes

**Troubleshooting:**
- If SMS not received: Check phone number format (+1234567890)
- If timeout: Edge function may not be deployed

---

### **Test 10: Phone Verification - Verify OTP**
**Steps:**
1. From step above, SMS arrives with OTP (e.g., 123456)
2. Enter 6-digit code in modal
3. Click "Verify OTP"

**Expected Results:**
- ✅ Input auto-formats as you type (only digits accepted)
- ✅ Verify button only enabled with 6 digits
- ✅ Button shows "Verifying..." while processing
- ✅ Toast shows "Phone number verified successfully!"
- ✅ Modal closes
- ✅ Phone shows "Verified" badge
- ✅ Profile completion increases

**Troubleshooting:**
- If verification fails: Check OTP matches exactly
- If OTP expires: Request new one
- If edge function fails: Check send-phone-otp deployment

---

### **Test 11: Cancel Edit Mode**
**Steps:**
1. Click Edit
2. Edit some fields (change name, etc.)
3. Click Cancel button

**Expected Results:**
- ✅ Changes are discarded
- ✅ Profile displays original values
- ✅ Edit mode closes

---

### **Test 12: Profile Completion Percentage**
**Steps:**
1. Start with empty profile (0%)
2. Add name (30%)
3. Add email verification (30%+)
4. Add phone (15%)
5. Add address (15%)
6. Add city (15%) - should reach higher percentage

**Expected Results:**
- ✅ Percentage increases as fields are added
- ✅ Progress bar animates smoothly
- ✅ Final percentage updates in real-time
- ✅ All required fields show correct weights

**Calculation:**
- Name (first + last): 15% each = 30%
- Email: 15%
- Phone: 15%
- Address: 15%
- City: 15%
- Bio: 10%
- DOB: 10%
- Avatar: 10%

---

### **Test 13: Page Reload - Data Persistence**
**Steps:**
1. Complete and save a full profile
2. Refresh browser (F5 or Ctrl+R)

**Expected Results:**
- ✅ Page reloads
- ✅ Profile data loads from database
- ✅ All saved fields display correctly
- ✅ Avatar still shows
- ✅ Verification badges correct

---

### **Test 14: Multiple Users**
**Steps:**
1. Complete profile for user 1 (test@example.com)
2. Log out
3. Log in as user 2 (test2@example.com)
4. Navigate to `/profile`

**Expected Results:**
- ✅ User 2 sees their own empty profile
- ✅ User 1's data is NOT visible
- ✅ RLS policies working correctly
- ✅ No data leakage between users

---

## 🔗 Direct Links to Test

**Production URL:** https://tripavail-web-production.up.railway.app

**Paths:**
- `/profile` - Traveller profile page
- `/settings` - Account settings page
- `/manager/settings` - Hotel manager settings (if logged in as hotel manager)
- `/operator/settings` - Tour operator settings (if logged in as tour operator)

---

## 📊 Database Verification

After tests, verify data in Supabase:

**SQL to check profile data:**
```sql
SELECT * FROM public.profiles WHERE id = 'user-uuid-here';
```

**SQL to check OTP logs:**
```sql
SELECT * FROM public.phone_otps ORDER BY created_at DESC LIMIT 10;
```

**SQL to check email verification:**
```sql
SELECT * FROM public.email_verifications ORDER BY sent_at DESC LIMIT 10;
```

---

## 🚨 Known Issues & Workarounds

### Issue: "Profile not loading"
**Cause:** User doesn't have a profiles row yet
**Fix:** Run this SQL:
```sql
INSERT INTO profiles (id, email) 
VALUES ('user-id-here', 'user@email.com')
ON CONFLICT DO NOTHING;
```

### Issue: "Avatar upload fails"
**Cause:** Storage bucket not public
**Fix:** Go to Supabase → Storage → user-avatars → Settings → uncheck "Private"

### Issue: "Phone OTP not sending"
**Cause:** Edge functions not deployed
**Fix:** Deploy functions with `supabase functions deploy` or via dashboard

### Issue: "Save fails silently"
**Cause:** RLS policy error
**Fix:** Check browser DevTools → Network tab → see the error response

---

## ✅ Final Checklist

After all tests pass:
- [ ] Profile loading works
- [ ] Edit mode functions
- [ ] Save persists to database
- [ ] Avatar upload works
- [ ] Email verification works
- [ ] Phone OTP works
- [ ] Profile completion calculates correctly
- [ ] Data persists on reload
- [ ] Multiple users isolated correctly
- [ ] No console errors
- [ ] No TypeScript errors

**Status: Ready for launch!** 🚀
