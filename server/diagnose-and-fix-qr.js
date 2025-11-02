import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
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
  console.log('🔍 Diagnose QR Code Issue for Paper Presentation - CSE');
  console.log('='.repeat(70) + '\n');

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

  const Event = mongoose.models.Event || mongoose.model('Event', eventSchema);
  
  // Find the Paper Presentation - CSE event
  console.log('🔍 Looking for "Paper Presentation - CSE" event...\n');
  
  const event = await Event.findOne({ 
    name: /Paper.*Presentation.*CSE/i
  });

  if (!event) {
    console.error('❌ Event not found!');
    console.log('\n📋 Available events with "Paper" in name:');
    const paperEvents = await Event.find({ name: /Paper/i });
    paperEvents.forEach(e => {
      console.log(`   - ${e.name} (${e.department || 'No dept'})`);
    });
    await mongoose.connection.close();
    process.exit(1);
  }

  console.log(`✅ Found event: "${event.name}"`);
  console.log(`   Department: ${event.department || 'N/A'}`);
  console.log(`   ID: ${event._id}\n`);

  // Check QR code status
  console.log('📊 Current QR Code Status:');
  console.log('='.repeat(70));
  
  const hasQRArray = event.qrCodes && event.qrCodes.length > 0;
  const hasLegacyQR = !!event.paymentQRCode;
  
  console.log(`   qrCodes array: ${hasQRArray ? `✅ ${event.qrCodes.length} QR code(s)` : '❌ Empty'}`);
  console.log(`   paymentQRCode: ${hasLegacyQR ? `✅ ${event.paymentQRCode}` : '❌ Not set'}`);
  
  if (hasQRArray) {
    console.log('\n   QR Codes in array:');
    event.qrCodes.forEach((qr, idx) => {
      console.log(`   ${idx + 1}. URL: ${qr.qrCodeUrl}`);
      console.log(`      Account: ${qr.accountName || 'N/A'}`);
    });
  }
  console.log('');

  // Check if QR file exists locally
  const qrDir = path.join(__dirname, 'uploads', 'qrcodes');
  console.log(`📁 Checking local QR codes folder: ${qrDir}\n`);
  
  if (!fs.existsSync(qrDir)) {
    console.log('❌ QR codes folder does not exist!');
    console.log('   Creating folder...');
    fs.mkdirSync(qrDir, { recursive: true });
    console.log('   ✅ Folder created\n');
  }

  const qrFiles = fs.existsSync(qrDir) ? fs.readdirSync(qrDir).filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f)) : [];
  console.log(`📋 QR codes in local folder: ${qrFiles.length} files`);
  
  if (qrFiles.length > 0) {
    console.log('   Files:');
    qrFiles.forEach(f => console.log(`   - ${f}`));
  }
  console.log('');

  // Look for matching QR code file
  const possibleNames = [
    'paper-presentation-cse.webp',
    'paper-presentation-cse.jpg',
    'paper-presentation-cse.png',
    'paperpresentationcse.webp',
    'cse.webp',
    'cse.jpg'
  ];

  let matchedFile = null;
  for (const name of possibleNames) {
    if (qrFiles.includes(name)) {
      matchedFile = name;
      break;
    }
  }

  // Check source folder
  const sourceQRDir = 'D:\\code3\\All QR';
  console.log(`📁 Checking source QR folder: ${sourceQRDir}\n`);
  
  if (fs.existsSync(sourceQRDir)) {
    const sourceFiles = fs.readdirSync(sourceQRDir).filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f));
    console.log(`📋 QR codes in source folder: ${sourceFiles.length} files`);
    
    const cseFiles = sourceFiles.filter(f => /paper.*presentation.*cse/i.test(f) || /cse/i.test(f));
    if (cseFiles.length > 0) {
      console.log('\n   Possible matches for CSE:');
      cseFiles.forEach(f => console.log(`   - ${f}`));
      
      if (!matchedFile && cseFiles.length > 0) {
        matchedFile = cseFiles[0];
        console.log(`\n   📋 Will use: ${matchedFile}`);
        
        // Copy to local folder
        const sourcePath = path.join(sourceQRDir, matchedFile);
        const destFileName = matchedFile.replace(/-[a-f0-9]{13}/, ''); // Remove hash
        const destPath = path.join(qrDir, destFileName);
        
        console.log(`   📋 Copying to: ${destFileName}`);
        fs.copyFileSync(sourcePath, destPath);
        console.log('   ✅ File copied!');
        
        matchedFile = destFileName;
      }
    }
  }
  console.log('');

  // Fix the event
  if (matchedFile) {
    console.log('🔧 Fixing event QR code...\n');
    
    const qrUrl = `/uploads/qrcodes/${matchedFile}`;
    
    // Clear existing QR codes
    event.qrCodes = [];
    
    // Add new QR code
    event.qrCodes.push({
      qrCodeUrl: qrUrl,
      accountName: 'CSE Department',
      usageCount: 0,
      maxUsage: 40,
      isActive: true,
      createdAt: new Date()
    });
    
    event.paymentQRCode = qrUrl;
    event.currentQRIndex = 0;
    
    await event.save();
    
    console.log('✅ Event updated successfully!');
    console.log(`   QR Code URL: ${qrUrl}`);
    console.log(`   Account: CSE Department\n`);
  } else {
    console.log('❌ No matching QR code file found!');
    console.log('\n💡 Solutions:');
    console.log('   1. Run: npm run link-qr-local');
    console.log('   2. Or manually add a QR code file to server/uploads/qrcodes/');
    console.log('   3. File should be named: paper-presentation-cse.webp\n');
  }

  await mongoose.connection.close();
  console.log('='.repeat(70));
  console.log('✅ Diagnosis completed!\n');
};

main().catch(err => {
  console.error('\n❌ Fatal Error:', err.message);
  console.error(err.stack);
  process.exit(1);
});
