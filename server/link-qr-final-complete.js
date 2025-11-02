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

// MANUAL MAPPING: Event names to QR code files
const EVENT_QR_MAPPING = {
  // Exact mappings for events with different names
  '3D-Modelling': '3d-modeling-69071e709c26b.webp',
  '3D Modeling': '3d-modeling-69071e709c26b.webp',
  '3D-Modeling': '3d-modeling-69071e709c26b.webp',
  
  'Robo Sumo War': 'robo-sumo-war-karthik-ramdurg-69071e7857068.webp',
  'Robo Soccer': 'robo-soccer-praveen-patil-69071e787c015.webp',
  
  'Technical Paper Presentation - ECE': 'paper-presentation-ece-69071e77b9039.webp',
  'Paper Presentation - ECE': 'paper-presentation-ece-69071e77b9039.webp',
  
  'Paper Presentation - CSE': 'paper-presentation-cse-69071e771cd65.webp',
  'Technical Paper Presentation - CSE': 'paper-presentation-cse-69071e771cd65.webp',
  
  'Virtual Gaming (BGMI)': 'virtual-gaming-69071e7cb7b22.webp',
  'Virtual Gaming': 'virtual-gaming-69071e7cb7b22.webp',
  
  // Other events (auto-match will handle these)
  'Bid Premier League': 'bid-premier-league-69071e70abf62.webp',
  'Bigg Boss': 'bigg-boss-69071e7190ed6.webp',
  'Checkmate': 'checkmate-69071e71ab1d1.webp',
  'CodeBreak': 'codebreak-69071e733d749.webp',
  'Corporate Carnival': 'corporate-carnival-69071e72b308b.webp',
  'Dhwani': 'dhwani-69071e735ef9c.webp',
  'Electro Quest': 'electro-quest-69071e73ee3d8.webp',
  'Fun Quest': 'fun-quest-69071e7413dcc.webp',
  'Gaana Groove': 'gaana-groove-69071e74bd902.webp',
  'Hacksphere': 'hacksphere-69071e74ea337.webp',
  'Impersona': 'impersona-69071e75a23c6.webp',
  'Minute to Win It': 'minute-to-win-it-69071e768b714.webp',
  'Nrityanova': 'nrityanova-69071e76c023b.webp',
  'Photography': 'photography-mallikarjun-69071e77a51c6.webp',
  'RoboRace': 'roborace-69071e79568a3.webp',
  'Robo Race': 'roborace-69071e79568a3.webp',
  'Seconds Ka Tashan': 'seconds-ka-tashan-69071e7aa3640.webp',
  'Squid Game': 'squid-game-ganesh-chitnis-69071e79f2942.webp',
  'Taal Rhythm': 'taal-rhythm-69071e7adb417.webp',
  'Tandav Troupe': 'tandav-troupe-69071e7bc19ec.webp',
  'Tech Tussle': 'tech-tussle-69071e7bc5182.webp',
  'Treasure Hunt': 'treasure-hunt-69071e7caebf9.webp',
  'Zenith': 'zenith-69071e7d4a590.webp'
};

// Department-wide QR codes
const DEPARTMENT_QR_MAPPING = {
  'MBA': 'mba-69071e75de440.webp'
};

const isImage = (file) => /\.(png|jpg|jpeg|gif|webp)$/i.test(file);

/**
 * Extract account name from filename
 */
const extractAccountName = (filename) => {
  // Remove hash and extension first
  const cleaned = filename.replace(/-[a-f0-9]{13}\.(webp|jpg|jpeg|png)$/i, '');
  
  // Try to extract name from patterns like "event-name-person-name"
  const parts = cleaned.split('-');
  
  // If last 2-3 parts look like names, extract them
  if (parts.length >= 3) {
    const lastParts = parts.slice(-2);
    const possibleName = lastParts.join(' ');
    
    // Check if it looks like a name
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
    .replace(/\s*\([^)]*\)\s*/g, '') // Remove parentheses content
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const main = async () => {
  console.log('\n' + '='.repeat(70));
  console.log('💳 FINAL COMPLETE QR CODE SETUP - ALL EVENTS');
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

  const files = fs.readdirSync(qrSourceDir).filter(isImage);
  console.log(`✅ Found ${files.length} QR code images in source folder\n`);

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

  // CLEAR ALL EXISTING QR CODES
  console.log('🧹 Clearing existing QR codes from all events...');
  for (const event of allEvents) {
    event.qrCodes = [];
    event.paymentQRCode = null;
    event.currentQRIndex = 0;
    await event.save();
  }
  console.log('✅ All existing QR codes cleared!\n');

  let copied = 0;
  let updated = 0;
  const matched = [];
  const unmatched = [];
  const eventsProcessed = new Set();

  console.log('🔄 Processing QR codes with manual mapping...\n');

  // First, process manual event mappings
  console.log('📋 STEP 1: Processing Manual Event Mappings');
  console.log('='.repeat(70));
  
  for (const [eventName, qrFileName] of Object.entries(EVENT_QR_MAPPING)) {
    const sourceFilePath = path.join(qrSourceDir, qrFileName);
    
    if (!fs.existsSync(sourceFilePath)) {
      console.log(`⚠️  QR file not found: ${qrFileName}`);
      continue;
    }

    // Find matching event
    const event = allEvents.find(e => {
      const normalized1 = normalizeEventName(e.name);
      const normalized2 = normalizeEventName(eventName);
      return normalized1 === normalized2 || e.name === eventName;
    });

    if (!event) {
      console.log(`⚠️  Event not found in DB: ${eventName}`);
      continue;
    }

    // Copy to local folder
    const localFileName = qrFileName.replace(/-[a-f0-9]{13}/, '');
    const localFilePath = path.join(qrLocalDir, localFileName);
    
    try {
      fs.copyFileSync(sourceFilePath, localFilePath);
      copied++;
    } catch (error) {
      console.error(`❌ Failed to copy ${qrFileName}: ${error.message}`);
      continue;
    }

    const qrUrl = `/uploads/qrcodes/${localFileName}`;
    const accountName = extractAccountName(qrFileName) || event.department || event.name;

    // Add QR code to event
    const qrCodeData = {
      qrCodeUrl: qrUrl,
      accountName: accountName,
      usageCount: 0,
      maxUsage: 40,
      isActive: true,
      createdAt: new Date()
    };

    event.qrCodes = [qrCodeData];
    event.paymentQRCode = qrUrl;
    event.currentQRIndex = 0;

    await event.save();
    updated++;
    eventsProcessed.add(event._id.toString());

    matched.push({
      event: event.name,
      department: event.department,
      qrFile: qrFileName,
      url: qrUrl,
      accountName: accountName
    });

    console.log(`✅ ${event.name} (${event.department || 'N/A'})`);
    console.log(`   → ${localFileName}`);
    console.log(`   → Account: ${accountName}\n`);
  }

  // Process department-wide QR codes
  console.log('\n📋 STEP 2: Processing Department-Wide QR Codes');
  console.log('='.repeat(70));
  
  for (const [deptName, qrFileName] of Object.entries(DEPARTMENT_QR_MAPPING)) {
    const sourceFilePath = path.join(qrSourceDir, qrFileName);
    
    if (!fs.existsSync(sourceFilePath)) {
      console.log(`⚠️  QR file not found: ${qrFileName}`);
      continue;
    }

    // Find all events in this department
    const deptEvents = allEvents.filter(e => 
      e.department && e.department.toLowerCase() === deptName.toLowerCase()
    );

    if (deptEvents.length === 0) {
      console.log(`⚠️  No events found for department: ${deptName}`);
      continue;
    }

    // Copy to local folder
    const localFileName = qrFileName.replace(/-[a-f0-9]{13}/, '');
    const localFilePath = path.join(qrLocalDir, localFileName);
    
    try {
      fs.copyFileSync(sourceFilePath, localFilePath);
      copied++;
    } catch (error) {
      console.error(`❌ Failed to copy ${qrFileName}: ${error.message}`);
      continue;
    }

    const qrUrl = `/uploads/qrcodes/${localFileName}`;

    console.log(`✅ ${deptName} Department → ${deptEvents.length} events`);
    
    for (const event of deptEvents) {
      // Skip if already processed
      if (eventsProcessed.has(event._id.toString())) {
        console.log(`   ⏭️  ${event.name} (already has QR)`);
        continue;
      }

      const qrCodeData = {
        qrCodeUrl: qrUrl,
        accountName: deptName,
        usageCount: 0,
        maxUsage: 40,
        isActive: true,
        createdAt: new Date()
      };

      event.qrCodes = [qrCodeData];
      event.paymentQRCode = qrUrl;
      event.currentQRIndex = 0;

      await event.save();
      updated++;
      eventsProcessed.add(event._id.toString());

      matched.push({
        event: event.name,
        department: event.department,
        qrFile: qrFileName,
        url: qrUrl,
        accountName: deptName
      });

      console.log(`   ✅ ${event.name}`);
    }
    console.log('');
  }

  // Check for events still without QR codes
  console.log('\n📋 STEP 3: Checking for Events Without QR Codes');
  console.log('='.repeat(70));
  
  const eventsWithoutQR = allEvents.filter(e => !eventsProcessed.has(e._id.toString()));
  
  if (eventsWithoutQR.length > 0) {
    console.log(`⚠️  Found ${eventsWithoutQR.length} events without QR codes:\n`);
    eventsWithoutQR.forEach(e => {
      unmatched.push({
        event: e.name,
        department: e.department
      });
      console.log(`   - ${e.name} (${e.department || 'No dept'})`);
    });
  } else {
    console.log('✅ All events have QR codes!\n');
  }

  // Final Summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 FINAL SUMMARY');
  console.log('='.repeat(70));
  console.log(`📋 QR files copied: ${copied}`);
  console.log(`💾 Events updated: ${updated}`);
  console.log(`✅ Events with QR: ${eventsProcessed.size}`);
  console.log(`❌ Events without QR: ${eventsWithoutQR.length}`);
  console.log(`📁 Total events: ${allEvents.length}\n`);

  if (matched.length > 0) {
    console.log('✅ Successfully Linked Events:');
    console.log('='.repeat(70));
    matched.forEach(m => {
      console.log(`   ${m.event} (${m.department || 'N/A'})`);
      console.log(`   → QR: ${m.qrFile}`);
      console.log(`   → URL: ${m.url}`);
      console.log(`   → Account: ${m.accountName}`);
      console.log('');
    });
  }

  if (unmatched.length > 0) {
    console.log('❌ Events Still Missing QR Codes:');
    console.log('='.repeat(70));
    unmatched.forEach(u => {
      console.log(`   - ${u.event} (${u.department || 'No dept'})`);
    });
    console.log('\n💡 These events need QR codes to be added manually or via department mapping\n');
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
