import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
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
    upiId: String,
    accountName: String,
    usageCount: { type: Number, default: 0 },
    maxUsage: { type: Number, default: 40 },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
  }],
  paymentQRCode: String,
  currentQRIndex: { type: Number, default: 0 }
}, { strict: false });

// SPECIFIC EVENTS TO UPDATE (without clearing existing QR codes)
const EVENTS_TO_UPDATE = [
  { name: '3D-Modelling', department: 'Mech', qrFile: '3d-modeling-69071e709c26b.webp' },
  { name: 'Robo Sumo War', department: 'Mech', qrFile: 'robo-sumo-war-karthik-ramdurg-69071e7857068.webp' },
  { name: 'Robo Soccer', department: 'Mech', qrFile: 'robo-soccer-praveen-patil-69071e787c015.webp' },
  { name: 'Technical Paper Presentation - ECE', department: 'ECE', qrFile: 'paper-presentation-ece-69071e77b9039.webp' },
  { name: 'Paper Presentation - CSE', department: 'CSE', qrFile: 'paper-presentation-cse-69071e771cd65.webp' },
  { name: 'Virtual Gaming (BGMI)', department: 'CSE', qrFile: 'virtual-gaming-69071e7cb7b22.webp' },
  { name: 'Mock CID', department: 'Civil', qrFile: null }, // No specific QR found
  { name: 'Rapid rush', department: 'Civil', qrFile: null },
  { name: 'Modulux', department: 'Civil', qrFile: null },
  { name: 'Video graphy', department: 'Civil', qrFile: null },
  { name: 'Poster Presentation', department: 'Civil', qrFile: null },
  { name: 'Design Dynamics', department: 'Civil', qrFile: null },
  { name: 'Spin to win', department: 'Civil', qrFile: null }
];

/**
 * Extract account name from filename
 */
const extractAccountName = (filename) => {
  if (!filename) return null;
  
  const cleaned = filename.replace(/-[a-f0-9]{13}\.(webp|jpg|jpeg|png)$/i, '');
  const parts = cleaned.split('-');
  
  if (parts.length >= 3) {
    const lastParts = parts.slice(-2);
    const possibleName = lastParts.join(' ');
    
    if (/^[a-z]+\s+[a-z]+/i.test(possibleName)) {
      return possibleName.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    }
  }
  
  return null;
};

/**
 * Normalize event name for comparison
 */
const normalizeEventName = (name) => {
  return name
    .toLowerCase()
    .replace(/\s*\([^)]*\)\s*/g, '') // Remove parentheses
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const main = async () => {
  console.log('\n' + '='.repeat(70));
  console.log('💳 Add QR Codes to Specific Events (Without Clearing Existing)');
  console.log('='.repeat(70) + '\n');
  
  const qrSourceDir = 'D:\\code3\\All QR';
  const qrLocalDir = path.join(__dirname, 'uploads', 'qrcodes');
  
  // Create local uploads directory if it doesn't exist
  if (!fs.existsSync(qrLocalDir)) {
    fs.mkdirSync(qrLocalDir, { recursive: true });
    console.log(`📂 Created local directory: ${qrLocalDir}\n`);
  }

  console.log(`📁 Source QR folder: ${qrSourceDir}`);
  console.log(`📁 Local QR folder: ${qrLocalDir}\n`);
  
  if (!fs.existsSync(qrSourceDir)) {
    console.error(`❌ ERROR: Source QR folder not found!`);
    process.exit(1);
  }

  // Connect to MongoDB
  console.log('🔌 Connecting to MongoDB...');
  const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
  
  if (!MONGODB_URI) {
    console.error('❌ ERROR: MONGODB_URI not found!');
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
  
  const allEvents = await Event.find({});
  console.log(`📊 Total events in database: ${allEvents.length}\n`);

  let copied = 0;
  let updated = 0;
  let skipped = 0;
  let notFound = 0;
  const results = [];

  console.log('🔄 Processing specific events...\n');
  console.log('='.repeat(70));

  for (const eventInfo of EVENTS_TO_UPDATE) {
    console.log(`\n📌 Processing: ${eventInfo.name} (${eventInfo.department})`);
    
    // Find the event in database
    const event = allEvents.find(e => {
      const normalized1 = normalizeEventName(e.name);
      const normalized2 = normalizeEventName(eventInfo.name);
      const deptMatch = e.department && e.department.toLowerCase() === eventInfo.department.toLowerCase();
      
      return (normalized1 === normalized2 || e.name === eventInfo.name) && deptMatch;
    });

    if (!event) {
      console.log(`   ❌ Event not found in database`);
      notFound++;
      results.push({
        event: eventInfo.name,
        status: 'not_found',
        message: 'Event not found in database'
      });
      continue;
    }

    console.log(`   ✅ Found in database: "${event.name}"`);

    // Check if event already has QR code
    const hasQR = (event.qrCodes && event.qrCodes.length > 0) || event.paymentQRCode;
    
    if (hasQR) {
      console.log(`   ⏭️  Already has QR code - SKIPPING`);
      if (event.qrCodes && event.qrCodes.length > 0) {
        console.log(`      Current QR: ${event.qrCodes[0].qrCodeUrl}`);
      } else if (event.paymentQRCode) {
        console.log(`      Current QR: ${event.paymentQRCode}`);
      }
      skipped++;
      results.push({
        event: event.name,
        status: 'skipped',
        message: 'Already has QR code'
      });
      continue;
    }

    // If no QR file specified, skip
    if (!eventInfo.qrFile) {
      console.log(`   ⚠️  No QR file specified - SKIPPING`);
      skipped++;
      results.push({
        event: event.name,
        status: 'no_qr_file',
        message: 'No QR file specified for this event'
      });
      continue;
    }

    // Check if QR file exists
    const sourceFilePath = path.join(qrSourceDir, eventInfo.qrFile);
    
    if (!fs.existsSync(sourceFilePath)) {
      console.log(`   ❌ QR file not found: ${eventInfo.qrFile}`);
      notFound++;
      results.push({
        event: event.name,
        status: 'qr_not_found',
        message: `QR file not found: ${eventInfo.qrFile}`
      });
      continue;
    }

    // Copy to local folder
    const localFileName = eventInfo.qrFile.replace(/-[a-f0-9]{13}/, '');
    const localFilePath = path.join(qrLocalDir, localFileName);
    
    try {
      fs.copyFileSync(sourceFilePath, localFilePath);
      copied++;
      console.log(`   📋 Copied to: ${localFileName}`);
    } catch (error) {
      console.error(`   ❌ Failed to copy: ${error.message}`);
      results.push({
        event: event.name,
        status: 'copy_failed',
        message: error.message
      });
      continue;
    }

    const qrUrl = `/uploads/qrcodes/${localFileName}`;
    const accountName = extractAccountName(eventInfo.qrFile) || eventInfo.department || event.name;

    // Add QR code to event (without clearing existing)
    const qrCodeData = {
      qrCodeUrl: qrUrl,
      accountName: accountName,
      usageCount: 0,
      maxUsage: 40,
      isActive: true,
      createdAt: new Date()
    };

    // Initialize qrCodes array if it doesn't exist
    if (!event.qrCodes) {
      event.qrCodes = [];
    }

    // Add the new QR code
    event.qrCodes.push(qrCodeData);
    
    // Set as paymentQRCode if not set
    if (!event.paymentQRCode) {
      event.paymentQRCode = qrUrl;
    }
    
    event.currentQRIndex = 0;

    await event.save();
    updated++;

    console.log(`   ✅ QR code added successfully!`);
    console.log(`      URL: ${qrUrl}`);
    console.log(`      Account: ${accountName}`);

    results.push({
      event: event.name,
      status: 'success',
      qrFile: localFileName,
      url: qrUrl,
      accountName: accountName
    });
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 SUMMARY');
  console.log('='.repeat(70));
  console.log(`✅ Successfully updated: ${updated} events`);
  console.log(`⏭️  Skipped (already has QR): ${skipped} events`);
  console.log(`❌ Not found: ${notFound} events`);
  console.log(`📋 QR files copied: ${copied}`);
  console.log(`📁 Total processed: ${EVENTS_TO_UPDATE.length}\n`);

  // Detailed results
  const successful = results.filter(r => r.status === 'success');
  const skippedResults = results.filter(r => r.status === 'skipped');
  const failed = results.filter(r => r.status !== 'success' && r.status !== 'skipped');

  if (successful.length > 0) {
    console.log('✅ Successfully Updated Events:');
    console.log('='.repeat(70));
    successful.forEach(r => {
      console.log(`   ${r.event}`);
      console.log(`   → QR: ${r.qrFile}`);
      console.log(`   → URL: ${r.url}`);
      console.log(`   → Account: ${r.accountName}`);
      console.log('');
    });
  }

  if (skippedResults.length > 0) {
    console.log('⏭️  Skipped Events (Already Have QR):');
    console.log('='.repeat(70));
    skippedResults.forEach(r => {
      console.log(`   - ${r.event}`);
    });
    console.log('');
  }

  if (failed.length > 0) {
    console.log('❌ Failed/Not Found:');
    console.log('='.repeat(70));
    failed.forEach(r => {
      console.log(`   - ${r.event}`);
      console.log(`     Reason: ${r.message}`);
    });
    console.log('');
  }

  await mongoose.connection.close();
  console.log('✅ Script completed successfully!');
  console.log(`📁 QR codes location: ${qrLocalDir}`);
  console.log('🔗 QR codes will be served from: /uploads/qrcodes/\n');
  console.log('='.repeat(70) + '\n');
};

main().catch(err => {
  console.error('\n❌ Fatal Error:', err.message);
  console.error(err.stack);
  process.exit(1);
});
