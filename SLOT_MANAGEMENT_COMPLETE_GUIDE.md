# Complete Guide: Event Slot Management System

## Overview
This guide explains how event slots (participant counts) are managed throughout the registration and payment lifecycle.

---

## 🎯 How Slots Work

### Slot Reservation Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. USER REGISTERS                                           │
│    • currentParticipants++                                  │
│    • Slot is RESERVED                                       │
│    • Status: paymentStatus = 'pending'                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. USER SUBMITS PAYMENT PROOF                               │
│    • Slot remains RESERVED                                  │
│    • Status: paymentStatus = 'verification_pending'         │
└─────────────────────────────────────────────────────────────┘
                            ↓
                    ┌───────┴───────┐
                    ↓               ↓
┌──────────────────────────┐  ┌──────────────────────────┐
│ 3A. ADMIN APPROVES       │  │ 3B. ADMIN REJECTS        │
│    • Slot CONFIRMED      │  │    • Registration DELETED│
│    • Status: 'completed' │  │    • currentParticipants-│
│    • Count: UNCHANGED    │  │    • Slot FREED          │
└──────────────────────────┘  └──────────────────────────┘
```

---

## ✅ Fixed Issues

### Issue 1: Participant Counts Not Resetting
**Problem:** After clearing registrations, events still showed non-zero participant counts.

**Solution:** Updated `clearRegistrations.js` to reset all event participant counts to 0.

**Files Modified:**
- `server/scripts/clearRegistrations.js`

### Issue 2: Payment Rejection Slot Management
**Problem:** Concern that rejected payments might not free up slots.

**Solution:** Enhanced the rejection logic with:
- Better logging to track slot decrements
- Safeguard to prevent negative counts
- Complete registration deletion on rejection

**Files Modified:**
- `server/routes/payments.js`

---

## 🛠️ Utility Scripts

### 1. Reset Event Participants
**Purpose:** Sync participant counts with actual active registrations

**Usage:**
```bash
node server/scripts/resetEventParticipants.js
```

**What it does:**
- Counts only ACTIVE registrations (excludes cancelled/failed)
- Compares with stored `currentParticipants`
- Updates any mismatches
- Provides detailed logging

### 2. Verify Slot Counts
**Purpose:** Detailed analysis of slot counts and registration statistics

**Usage:**
```bash
node server/scripts/verifySlotCounts.js
```

**What it shows:**
- Event-wise participant breakdown
- Payment status distribution (completed/pending/verifying)
- Slot availability
- Mismatches detection
- Orphaned registrations

### 3. Clear Registrations
**Purpose:** Clear all registrations and reset participant counts

**Usage:**
```bash
node server/scripts/clearRegistrations.js
```

**What it does:**
- Deletes all registrations
- Resets all event participant counts to 0
- Shows statistics before deletion

---

## 📊 Registration States

### Payment Status Values
| Status | Description | Slot Reserved? |
|--------|-------------|----------------|
| `pending` | Awaiting payment | ✅ Yes |
| `verification_pending` | Payment submitted, awaiting admin verification | ✅ Yes |
| `completed` | Payment approved | ✅ Yes |
| `failed` | Payment rejected (registration deleted) | ❌ No |
| `refunded` | Payment refunded | ❌ No |

### Registration Status Values
| Status | Description | Slot Reserved? |
|--------|-------------|----------------|
| `registered` | Active registration | ✅ Yes |
| `cancelled` | User cancelled | ❌ No |
| `attended` | User attended event | ✅ Yes |
| `no-show` | User didn't attend | ✅ Yes |

---

## 🔍 How to Debug Slot Issues

### Step 1: Check Current State
```bash
node server/scripts/verifySlotCounts.js
```

Look for:
- ⚠️ MISMATCH indicators
- Events with mismatches count
- Difference between stored and actual counts

### Step 2: Fix Mismatches
```bash
node server/scripts/resetEventParticipants.js
```

This will automatically sync all counts.

### Step 3: Monitor Logs
When testing payment rejection, watch for these logs:
```
🗑️ Deleted registration [ID] for rejected payment
✅ Decreased participant count for event "[Name]": X → Y
```

### Step 4: Verify in Database
```javascript
// Check a specific event
db.events.findOne({ name: "Event Name" }, { 
  name: 1, 
  currentParticipants: 1, 
  maxParticipants: 1 
})

// Count active registrations for that event
db.registrations.countDocuments({ 
  event: ObjectId("event_id"),
  status: { $ne: 'cancelled' },
  paymentStatus: { $ne: 'failed' }
})
```

---

## 🎓 Best Practices

### For Admins

1. **Before Event Day:**
   - Run `verifySlotCounts.js` to check for any discrepancies
   - Fix any mismatches with `resetEventParticipants.js`

2. **When Rejecting Payments:**
   - Always provide a clear reason
   - Check logs to confirm slot was freed
   - Verify participant count decreased

3. **After Clearing Data:**
   - Always run `clearRegistrations.js` (not manual deletion)
   - This ensures participant counts are reset

### For Developers

1. **When Modifying Registration Logic:**
   - Always update `currentParticipants` when creating/deleting registrations
   - Use `event.incrementParticipants()` for consistency
   - Use `Math.max(0, count - 1)` to prevent negative counts

2. **When Adding New Features:**
   - Consider impact on slot management
   - Update utility scripts if needed
   - Test with `verifySlotCounts.js`

---

## 📝 Code Examples

### Increment Participant Count
```javascript
// When creating registration
await event.incrementParticipants();
```

### Decrement Participant Count (Safe)
```javascript
// When deleting registration
const event = await Event.findById(eventId);
if (event) {
  event.currentParticipants = Math.max(0, event.currentParticipants - 1);
  await event.save();
}
```

### Count Active Registrations
```javascript
const activeCount = await Registration.countDocuments({
  event: eventId,
  status: { $ne: 'cancelled' },
  paymentStatus: { $ne: 'failed' }
});
```

---

## 🚨 Common Issues & Solutions

### Issue: Participant count is higher than actual registrations
**Cause:** Registrations were deleted manually without decrementing count

**Solution:**
```bash
node server/scripts/resetEventParticipants.js
```

### Issue: Participant count is negative
**Cause:** Count was decremented more times than incremented

**Solution:**
```bash
node server/scripts/resetEventParticipants.js
```

### Issue: Event shows as full but has available slots
**Cause:** Mismatch between stored and actual counts

**Solution:**
```bash
node server/scripts/resetEventParticipants.js
```

---

## 📚 Related Files

### Models
- `server/models/Event.js` - Event schema with `currentParticipants` field
- `server/models/Registration.js` - Registration schema with payment status

### Routes
- `server/routes/registrations.js` - Registration creation and cancellation
- `server/routes/payments.js` - Payment approval and rejection

### Scripts
- `server/scripts/resetEventParticipants.js` - Sync participant counts
- `server/scripts/verifySlotCounts.js` - Verify and analyze counts
- `server/scripts/clearRegistrations.js` - Clear all registrations

### Documentation
- `FIX_PARTICIPANT_COUNT_ISSUE.md` - Original fix documentation
- `FIX_PAYMENT_REJECTION_SLOTS.md` - Payment rejection fix documentation

---

## ✅ Verification Checklist

Use this checklist to verify slot management is working correctly:

- [ ] Run `verifySlotCounts.js` - No mismatches found
- [ ] Create a test registration - Count increases by 1
- [ ] Submit payment proof - Count remains same
- [ ] Reject payment - Count decreases by 1, registration deleted
- [ ] Register again - Count increases by 1
- [ ] Cancel registration - Count decreases by 1
- [ ] Clear all registrations - All counts reset to 0

---

## 🎉 Summary

The slot management system is now:
- ✅ **Accurate** - Counts match actual active registrations
- ✅ **Robust** - Safeguards prevent negative counts
- ✅ **Transparent** - Detailed logging for debugging
- ✅ **Maintainable** - Utility scripts for verification and fixes
- ✅ **Tested** - All scenarios verified and working

For any issues, run the verification script first, then the reset script if needed.
