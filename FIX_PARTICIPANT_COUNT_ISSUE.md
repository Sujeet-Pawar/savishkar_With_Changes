# Fix: Event Participant Count Issue

## Problem
After clearing all registrations and payments, the events section still showed participant counts (e.g., "0/30", "1/50", "0/25") instead of all being "0/X". This was causing confusion in the admin dashboard.

## Root Cause
The `clearRegistrations.js` script was deleting all registration records from the database but **was not resetting the `currentParticipants` field** in the Event model. This field is used to track how many participants have registered for each event.

## Solution Implemented

### 1. Updated `clearRegistrations.js` Script
**File:** `server/scripts/clearRegistrations.js`

Added code to reset the `currentParticipants` count for all events after deleting registrations:

```javascript
// Reset currentParticipants count for all events
console.log('\n🔄 Resetting event participant counts...');
const eventUpdateResult = await Event.updateMany(
  {},
  { $set: { currentParticipants: 0 } }
);
console.log(`✅ Reset participant counts for ${eventUpdateResult.modifiedCount} events`);
```

### 2. Created `resetEventParticipants.js` Script
**File:** `server/scripts/resetEventParticipants.js`

Created a new standalone script to fix the current issue and sync participant counts with actual registrations:

- Counts actual registrations for each event
- Compares with the stored `currentParticipants` value
- Updates any mismatched counts
- Provides detailed logging of changes

**Usage:**
```bash
node server/scripts/resetEventParticipants.js
```

### 3. Immediate Fix Applied
Ran the `resetEventParticipants.js` script to immediately fix all event participant counts. The script successfully reset all 37 events to their correct participant counts (all 0 since registrations were cleared).

## Verification
✅ All event participant counts have been reset to 0
✅ Future runs of `clearRegistrations.js` will automatically reset participant counts
✅ Existing functionality for incrementing/decrementing counts remains intact:
   - Registration creation: increments count
   - Registration cancellation: decrements count
   - Payment rejection: decrements count

## Files Modified
1. `server/scripts/clearRegistrations.js` - Added participant count reset
2. `server/scripts/resetEventParticipants.js` - New script created

## Testing
The fix has been applied and verified. All events now show correct participant counts (0/maxParticipants) after clearing registrations.

## Future Prevention
The updated `clearRegistrations.js` script will automatically handle this issue in future database cleanups, ensuring participant counts are always in sync with actual registrations.
