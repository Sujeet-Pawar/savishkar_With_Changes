import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Event from '../models/Event.js';
import Registration from '../models/Registration.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from server directory
dotenv.config({ path: join(__dirname, '..', '.env') });

const verifySlotCounts = async () => {
  try {
    // Check if MONGODB_URI exists
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('❌ MONGODB_URI not found in .env file');
      console.log('Please make sure .env file exists in the server directory');
      process.exit(1);
    }

    // Connect to MongoDB
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB Connected');

    console.log('\n🔍 Verifying Event Slot Counts...\n');

    // Get all events
    const events = await Event.find({}).sort({ name: 1 });
    console.log(`📊 Analyzing ${events.length} events\n`);

    // Get registration statistics
    const totalRegistrations = await Registration.countDocuments();
    const activeRegistrations = await Registration.countDocuments({
      status: { $ne: 'cancelled' },
      paymentStatus: { $ne: 'failed' }
    });
    const cancelledRegistrations = await Registration.countDocuments({ status: 'cancelled' });
    const failedPayments = await Registration.countDocuments({ paymentStatus: 'failed' });

    console.log('📈 Overall Statistics:');
    console.log(`   Total Registrations in DB: ${totalRegistrations}`);
    console.log(`   Active Registrations: ${activeRegistrations}`);
    console.log(`   Cancelled Registrations: ${cancelledRegistrations}`);
    console.log(`   Failed Payments: ${failedPayments}`);
    console.log('');

    // Count active registrations per event
    const registrationCounts = await Registration.aggregate([
      {
        $match: {
          status: { $ne: 'cancelled' },
          paymentStatus: { $ne: 'failed' }
        }
      },
      {
        $group: {
          _id: '$event',
          count: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'completed'] }, 1, 0] }
          },
          pending: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'pending'] }, 1, 0] }
          },
          verificationPending: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'verification_pending'] }, 1, 0] }
          }
        }
      }
    ]);

    // Create a map of event ID to registration stats
    const statsMap = {};
    registrationCounts.forEach(item => {
      statsMap[item._id.toString()] = {
        total: item.count,
        completed: item.completed,
        pending: item.pending,
        verificationPending: item.verificationPending
      };
    });

    console.log('📋 Event-wise Analysis:\n');
    console.log('─'.repeat(120));
    console.log(
      'Event Name'.padEnd(35) + 
      'Stored'.padEnd(10) + 
      'Actual'.padEnd(10) + 
      'Status'.padEnd(12) + 
      'Completed'.padEnd(12) + 
      'Pending'.padEnd(12) + 
      'Verifying'.padEnd(12) +
      'Availability'
    );
    console.log('─'.repeat(120));

    let totalStored = 0;
    let totalActual = 0;
    let mismatchCount = 0;
    let fullEvents = 0;

    for (const event of events) {
      const stats = statsMap[event._id.toString()] || { total: 0, completed: 0, pending: 0, verificationPending: 0 };
      const storedCount = event.currentParticipants;
      const actualCount = stats.total;
      const isMismatch = storedCount !== actualCount;
      const isFull = storedCount >= event.maxParticipants;
      
      totalStored += storedCount;
      totalActual += actualCount;
      
      if (isMismatch) mismatchCount++;
      if (isFull) fullEvents++;

      const statusIcon = isMismatch ? '⚠️ ' : '✓ ';
      const fullIcon = isFull ? '🔴 FULL' : `🟢 ${event.maxParticipants - storedCount} left`;

      console.log(
        event.name.substring(0, 33).padEnd(35) +
        storedCount.toString().padEnd(10) +
        actualCount.toString().padEnd(10) +
        (statusIcon + (isMismatch ? 'MISMATCH' : 'OK')).padEnd(12) +
        stats.completed.toString().padEnd(12) +
        stats.pending.toString().padEnd(12) +
        stats.verificationPending.toString().padEnd(12) +
        fullIcon
      );
    }

    console.log('─'.repeat(120));
    console.log(
      'TOTAL'.padEnd(35) +
      totalStored.toString().padEnd(10) +
      totalActual.toString().padEnd(10)
    );
    console.log('─'.repeat(120));

    console.log('\n📊 Summary:');
    console.log(`   Events with Mismatches: ${mismatchCount}`);
    console.log(`   Full Events: ${fullEvents}`);
    console.log(`   Total Stored Count: ${totalStored}`);
    console.log(`   Total Actual Count: ${totalActual}`);
    console.log(`   Difference: ${Math.abs(totalStored - totalActual)}`);

    if (mismatchCount > 0) {
      console.log('\n⚠️  WARNING: Found mismatches! Run resetEventParticipants.js to fix.');
      console.log('   Command: node server/scripts/resetEventParticipants.js');
    } else {
      console.log('\n✅ All event participant counts are accurate!');
    }

    // Check for orphaned registrations (registrations for non-existent events)
    const allRegistrations = await Registration.find({}).select('event');
    const eventIds = new Set(events.map(e => e._id.toString()));
    const orphanedCount = allRegistrations.filter(r => !eventIds.has(r.event.toString())).length;
    
    if (orphanedCount > 0) {
      console.log(`\n⚠️  WARNING: Found ${orphanedCount} orphaned registrations (events don't exist)`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error verifying slot counts:', error.message);
    process.exit(1);
  }
};

verifySlotCounts();
