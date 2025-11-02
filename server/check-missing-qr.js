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
  department: String,
  qrCodes: [{
    qrCodeUrl: String,
    accountName: String
  }],
  paymentQRCode: String
}, { strict: false });

const main = async () => {
  console.log('\n' + '='.repeat(70));
  console.log('🔍 Check Events Missing QR Codes');
  console.log('='.repeat(70) + '\n');

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

  const withQR = [];
  const withoutQR = [];
  const withMultipleQR = [];

  for (const event of allEvents) {
    const hasLegacyQR = !!event.paymentQRCode;
    const hasQRArray = event.qrCodes && event.qrCodes.length > 0;
    const qrCount = event.qrCodes ? event.qrCodes.length : 0;

    if (hasQRArray || hasLegacyQR) {
      if (qrCount > 1) {
        withMultipleQR.push({
          name: event.name,
          department: event.department,
          qrCount: qrCount,
          legacyQR: hasLegacyQR,
          qrUrls: event.qrCodes ? event.qrCodes.map(qr => qr.qrCodeUrl) : []
        });
      } else {
        withQR.push({
          name: event.name,
          department: event.department,
          qrCount: qrCount,
          legacyQR: hasLegacyQR,
          qrUrl: hasQRArray ? event.qrCodes[0].qrCodeUrl : event.paymentQRCode,
          accountName: hasQRArray ? event.qrCodes[0].accountName : 'N/A'
        });
      }
    } else {
      withoutQR.push({
        name: event.name,
        department: event.department
      });
    }
  }

  // Summary
  console.log('='.repeat(70));
  console.log('📊 SUMMARY');
  console.log('='.repeat(70));
  console.log(`✅ Events with QR codes: ${withQR.length + withMultipleQR.length}`);
  console.log(`   - Single QR: ${withQR.length}`);
  console.log(`   - Multiple QRs: ${withMultipleQR.length}`);
  console.log(`❌ Events WITHOUT QR codes: ${withoutQR.length}`);
  console.log(`📁 Total events: ${allEvents.length}\n`);

  if (withoutQR.length > 0) {
    console.log('❌ Events Missing QR Codes:');
    console.log('='.repeat(70));
    withoutQR.forEach(e => {
      console.log(`   - ${e.name} (${e.department || 'No dept'})`);
    });
    console.log('');
  }

  if (withQR.length > 0) {
    console.log('✅ Events with Single QR Code:');
    console.log('='.repeat(70));
    withQR.forEach(e => {
      console.log(`   - ${e.name} (${e.department || 'No dept'})`);
      console.log(`     QR: ${e.qrUrl}`);
      console.log(`     Account: ${e.accountName}`);
    });
    console.log('');
  }

  if (withMultipleQR.length > 0) {
    console.log('🔄 Events with Multiple QR Codes:');
    console.log('='.repeat(70));
    withMultipleQR.forEach(e => {
      console.log(`   - ${e.name} (${e.department || 'No dept'}) - ${e.qrCount} QR codes`);
      e.qrUrls.forEach((url, idx) => {
        console.log(`     ${idx + 1}. ${url}`);
      });
    });
    console.log('');
  }

  await mongoose.connection.close();
  console.log('✅ Check completed!\n');
  console.log('='.repeat(70) + '\n');
};

main().catch(err => {
  console.error('\n❌ Fatal Error:', err.message);
  console.error(err.stack);
  process.exit(1);
});
