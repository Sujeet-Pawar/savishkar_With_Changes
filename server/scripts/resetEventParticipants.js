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

const resetEventParticipants = async () => {
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

    console.log('\n🔄 Resetting Event Participant Counts...\n');

    // Get all events
    const events = await Event.find({});
    console.log(`📊 Found ${events.length} events`);

    // Count actual registrations per event (excluding failed/cancelled)
    // Only count registrations that are active (not cancelled and payment not failed)
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
          count: { $sum: 1 }
        }
      }
    ]);

    // Create a map of event ID to actual registration count
    const countMap = {};
    registrationCounts.forEach(item => {
      countMap[item._id.toString()] = item.count;
    });

    console.log('\n📋 Current vs Actual Participant Counts:\n');

    let updatedCount = 0;
    for (const event of events) {
      const actualCount = countMap[event._id.toString()] || 0;
      const currentCount = event.currentParticipants;

      console.log(`${event.name}:`);
      console.log(`   Current: ${currentCount} | Actual: ${actualCount}`);

      if (currentCount !== actualCount) {
        event.currentParticipants = actualCount;
        await event.save();
        updatedCount++;
        console.log(`   ✅ Updated to ${actualCount}`);
      } else {
        console.log(`   ✓ Already correct`);
      }
      console.log('');
    }

    console.log(`\n✅ Reset complete!`);
    console.log(`   - Total Events: ${events.length}`);
    console.log(`   - Events Updated: ${updatedCount}`);
    console.log(`   - Events Already Correct: ${events.length - updatedCount}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting participant counts:', error.message);
    process.exit(1);
  }
};

resetEventParticipants();
