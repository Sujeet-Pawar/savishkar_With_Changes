import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Sponsor from '../models/Sponsor.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from server directory
dotenv.config({ path: join(__dirname, '..', '.env') });

const clearSponsors = async () => {
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

    console.log('\n🗑️  Clearing Sponsors Collection...\n');

    // Count sponsors before deletion
    const totalSponsors = await Sponsor.countDocuments();
    const goldSponsors = await Sponsor.countDocuments({ tier: 'gold' });
    const silverSponsors = await Sponsor.countDocuments({ tier: 'silver' });
    const partnerSponsors = await Sponsor.countDocuments({ tier: 'partner' });
    const activeSponsors = await Sponsor.countDocuments({ isActive: true });
    const inactiveSponsors = await Sponsor.countDocuments({ isActive: false });

    console.log(`📊 Current Status:`);
    console.log(`   - Total Sponsors: ${totalSponsors}`);
    console.log(`   - Gold Tier: ${goldSponsors}`);
    console.log(`   - Silver Tier: ${silverSponsors}`);
    console.log(`   - Partner Tier: ${partnerSponsors}`);
    console.log(`   - Active: ${activeSponsors}`);
    console.log(`   - Inactive: ${inactiveSponsors}`);

    // Delete all sponsors
    const result = await Sponsor.deleteMany({});
    console.log(`\n✅ Deleted ${result.deletedCount} sponsors`);

    console.log('\n✅ Sponsors collection cleared successfully!');
    
    console.log('\n📊 Final Summary:');
    console.log(`   - Total Sponsors Deleted: ${result.deletedCount}`);
    console.log(`   - Gold Tier Sponsors: ${goldSponsors}`);
    console.log(`   - Silver Tier Sponsors: ${silverSponsors}`);
    console.log(`   - Partner Tier Sponsors: ${partnerSponsors}`);
    console.log(`   - Active Sponsors: ${activeSponsors}`);
    console.log(`   - Inactive Sponsors: ${inactiveSponsors}`);
    console.log(`   - Sponsors Remaining: 0`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing sponsors:', error.message);
    process.exit(1);
  }
};

clearSponsors();
