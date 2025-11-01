# Quick Test Guide - Savishkar Website

## 🚀 Quick Start Testing

### Run Comprehensive Test
```bash
node server/scripts/comprehensiveTest.js
```

This will test all major systems and provide a detailed report.

---

## 🧪 Manual Testing Checklist

### 1. User Registration & Authentication (5 min)

#### Test New User Registration:
```
1. Go to /signup
2. Fill form with test data:
   - Name: Test User
   - Email: test@example.com
   - Phone: 9876543210
   - College: Test College
3. Click "Sign Up"
4. Check email for OTP
5. Enter OTP on /verify-otp
6. Should redirect to /dashboard
```

**Expected Result:** ✅ User created, OTP sent, account verified

#### Test Login:
```
1. Go to /login
2. Enter email and password
3. Click "Login"
4. Should redirect to /dashboard
```

**Expected Result:** ✅ Successful login

#### Test Forgot Password:
```
1. Go to /forgot-password
2. Enter email
3. Check email for reset link
4. Click link, enter new password
5. Try logging in with new password
```

**Expected Result:** ✅ Password reset successful

---

### 2. Event Browsing (2 min)

#### Test Event Listing:
```
1. Go to /events
2. Check if all 37 events are displayed
3. Try filtering by category (Technical/Non-Technical/Cultural)
4. Try search functionality
```

**Expected Result:** ✅ Events displayed, filters work

#### Test Event Details:
```
1. Click on any event
2. Check if all details are shown:
   - Event name, description
   - Date, time, venue
   - Registration fee
   - Team size
   - Rules, prizes
3. Check if "Register Now" button is visible
```

**Expected Result:** ✅ All details displayed correctly

---

### 3. Event Registration (5 min)

#### Test Individual Registration:
```
1. Login as user
2. Go to any event
3. Click "Register Now"
4. Fill registration form (individual)
5. Submit
6. Check email for confirmation
7. Should redirect to payment page
```

**Expected Result:** ✅ Registration created, email sent

#### Test Team Registration:
```
1. Login as user
2. Go to team event (e.g., "Tech Tussle")
3. Click "Register Now"
4. Fill team details:
   - Team name
   - Team members (name, email, phone)
5. Submit
6. Check if all team members receive emails
```

**Expected Result:** ✅ Team registration created, all members notified

---

### 4. Payment Flow (5 min)

#### Test Payment Submission:
```
1. After registration, go to /payment/:registrationId
2. Check if QR code is displayed
3. Make test payment (or use test screenshot)
4. Upload screenshot
5. Enter UTR number (12 digits)
6. Submit
7. Check if status changes to "Verification Pending"
```

**Expected Result:** ✅ Payment submitted, status updated

---

### 5. Admin Dashboard (10 min)

#### Test Admin Login:
```
1. Go to /login
2. Login with admin credentials
3. Should redirect to /admin
4. Check if dashboard statistics are displayed
```

**Expected Result:** ✅ Admin dashboard accessible

#### Test Event Management:
```
1. Go to /admin/events
2. Click "Add Event"
3. Fill event form
4. Upload event image
5. Submit
6. Check if event appears in list
7. Try editing the event
8. Try deleting the event
```

**Expected Result:** ✅ CRUD operations work

#### Test Registration Management:
```
1. Go to /admin/registrations
2. Check if all registrations are listed
3. Click "View" on any event
4. Check if registrations are displayed
5. Try downloading Excel export
```

**Expected Result:** ✅ Registrations visible, Excel export works

#### Test Payment Verification:
```
1. Go to /admin/payments
2. Find pending payment
3. Click "View Screenshot"
4. Check UTR number
5. Click "Approve" or "Reject"
6. Check if user receives email
7. If rejected, check if slot is freed
```

**Expected Result:** ✅ Payment verification works, emails sent

#### Test Admin Registration:
```
1. Go to /admin/register-user
2. Fill form for new user
3. Add team members (optional)
4. Select event
5. Submit
6. Check if user receives welcome email
7. Check if registration is created
```

**Expected Result:** ✅ User created, registered, emails sent

---

### 6. User Dashboard (3 min)

#### Test User Dashboard:
```
1. Login as regular user
2. Go to /dashboard
3. Check if registered events are displayed
4. Check payment status for each
5. Try canceling a registration
```

**Expected Result:** ✅ Dashboard shows all registrations

---

### 7. Slot Management (5 min)

#### Test Slot Reservation:
```
1. Note participant count for an event
2. Register for that event
3. Check if count increased by 1
4. Cancel registration
5. Check if count decreased by 1
```

**Expected Result:** ✅ Counts update correctly

#### Test Payment Rejection Slot Release:
```
1. Register for an event (note count)
2. Submit payment
3. Admin rejects payment
4. Check if count decreased
5. Try registering again
6. Should be allowed
```

**Expected Result:** ✅ Slot freed on rejection

---

### 8. Notification System (2 min)

#### Test Email Notifications:
```
1. Register for an event
2. Check email for registration confirmation
3. Submit payment
4. Admin approves
5. Check email for approval notification
6. Admin rejects another payment
7. Check email for rejection notification
```

**Expected Result:** ✅ All emails received

---

### 9. Data Integrity (2 min)

#### Test Data Consistency:
```bash
# Run verification script
node server/scripts/verifySlotCounts.js
```

**Expected Result:** ✅ No mismatches found

---

### 10. Mobile Responsiveness (3 min)

#### Test Mobile View:
```
1. Open website on mobile or use browser dev tools
2. Test navigation menu
3. Test event browsing
4. Test registration form
5. Test payment upload
6. Test admin dashboard
```

**Expected Result:** ✅ All features work on mobile

---

## 🔧 Utility Scripts for Testing

### Reset Data:
```bash
# Clear all registrations
node server/scripts/clearRegistrations.js

# Clear all payments
node server/scripts/clearPayments.js

# Reset participant counts
node server/scripts/resetEventParticipants.js

# Verify slot counts
node server/scripts/verifySlotCounts.js

# Full system test
node server/scripts/comprehensiveTest.js
```

---

## 🎯 Critical Test Scenarios

### Scenario 1: Full Registration Flow
```
User Registration → Event Registration → Payment → Admin Approval → Confirmation
```

### Scenario 2: Payment Rejection Flow
```
Registration → Payment → Admin Rejection → Slot Freed → Re-registration
```

### Scenario 3: Team Registration Flow
```
Team Leader Registers → Team Members Get Accounts → All Receive Emails
```

### Scenario 4: Admin Registration Flow
```
Admin Creates User → User Gets Credentials → User Registered for Event
```

---

## ✅ Quick Verification Commands

### Check Database Status:
```bash
node server/scripts/comprehensiveTest.js
```

### Check Slot Counts:
```bash
node server/scripts/verifySlotCounts.js
```

### Check Cloudinary:
```bash
node server/scripts/checkCloudinaryConfig.js
```

---

## 🚨 Common Issues & Solutions

### Issue: OTP not received
**Solution:** Check email configuration, check spam folder

### Issue: Payment screenshot not uploading
**Solution:** Check Cloudinary configuration, check file size (<10MB)

### Issue: Slot count mismatch
**Solution:** Run `resetEventParticipants.js`

### Issue: Admin can't login
**Solution:** Check if user has admin role in database

---

## 📊 Expected Test Results

### All Tests Should Show:
- ✅ 31/31 tests passed
- ✅ 0 failures
- ✅ 0 warnings
- ✅ All systems operational

---

## 🎉 Sign-Off Checklist

Before going live, ensure:
- [ ] All automated tests pass
- [ ] Manual testing completed
- [ ] Email notifications working
- [ ] Payment flow tested
- [ ] Admin dashboard tested
- [ ] Mobile responsiveness verified
- [ ] Security headers configured
- [ ] SSL certificate installed
- [ ] Database backups configured
- [ ] Error monitoring set up

---

**Total Testing Time:** ~45 minutes for complete manual testing

**Automated Testing Time:** ~5 seconds

**Recommendation:** Run automated tests daily, manual tests before major releases
