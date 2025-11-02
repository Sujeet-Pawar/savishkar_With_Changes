import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Event Schema
const eventSchema = new mongoose.Schema({
  name: String,
  whatsappLink: String
}, { strict: false });

const main = async () => {
  console.log('\n' + '='.repeat(70));
  console.log('📱 Add WhatsApp Community Link to All Events');
  console.log('='.repeat(70) + '\n');

  const whatsappLink = 'https://chat.whatsapp.com/Ll4nyOidijK3Btz3RtTv5U';

  // Connect to MongoDB
  console.log('🔌 Connecting to MongoDB...');
  const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
  
  if (!MONGODB_URI) {
    console.error('❌ ERROR: MONGODB_URI not found in environment variables!');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB Connected!\n');
  } catch (error) {
    console.error(`❌ MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }

  // Get Event model
  const Event = mongoose.models.Event || mongoose.model('Event', eventSchema);
  
  // Get all events
  const allEvents = await Event.find({});
  console.log(`📊 Total events in database: ${allEvents.length}\n`);

  console.log('🔄 Updating events with WhatsApp link...\n');

  let updated = 0;
  const results = [];

  for (const event of allEvents) {
    console.log(`   Processing: ${event.name}`);
    
    try {
      event.whatsappLink = whatsappLink;
      await event.save();
      updated++;
      results.push({ name: event.name, success: true });
      console.log(`   ✅ Updated`);
    } catch (error) {
      console.error(`   ❌ Failed: ${error.message}`);
      results.push({ name: event.name, success: false, error: error.message });
    }
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 SUMMARY');
  console.log('='.repeat(70));
  console.log(`✅ Successfully updated: ${updated} events`);
  console.log(`❌ Failed: ${allEvents.length - updated} events`);
  console.log(`📁 Total processed: ${allEvents.length}`);
  console.log(`📱 WhatsApp Link: ${whatsappLink}\n`);

  const successful = results.filter(r => r.success);
  if (successful.length > 0) {
    console.log('✅ Updated Events:');
    successful.forEach(r => console.log(`   - ${r.name}`));
    console.log('');
  }

  const failed = results.filter(r => !r.success);
  if (failed.length > 0) {
    console.log('❌ Failed Events:');
    failed.forEach(r => console.log(`   - ${r.name}: ${r.error}`));
    console.log('');
  }

  await mongoose.connection.close();
  console.log('✅ Script completed successfully!\n');
  console.log('='.repeat(70) + '\n');
};

main().catch(err => {
  console.error('\n❌ Fatal Error:', err.message);
  console.error(err.stack);
  process.exit(1);
});
