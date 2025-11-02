import path from 'path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import cloudinary from './config/cloudinary.js';

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

/**
 * Upload QR code to Cloudinary
 */
const uploadQRToCloudinary = async (filePath, identifier) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'savishkar/qrcodes',
      public_id: identifier.toLowerCase().replace(/\s+/g, '-'),
      format: 'webp',
      transformation: [
        { width: 800, height: 800, crop: 'limit' },
        { quality: 'auto:best' }
      ],
      overwrite: true,
      invalidate: true
    });
    
    return result.secure_url;
  } catch (error) {
    throw new Error(`Cloudinary upload failed: ${error.message}`);
  }
};

const main = async () => {
  console.log('\n' + '='.repeat(70));
  console.log('💳 Apply QR Code to 3D Modeling Event');
  console.log('='.repeat(70) + '\n');
  
  // Check if Cloudinary is enabled
  if (process.env.USE_CLOUDINARY !== 'true') {
    console.error('❌ ERROR: Cloudinary is not enabled!');
    console.error('   Set USE_CLOUDINARY=true in your .env file');
    process.exit(1);
  }

  const qrFilePath = 'D:\\code3\\All QR\\3D-Modeling.jpeg';
  
  console.log(`📁 QR Code file: ${qrFilePath}`);

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
  
  // Find 3D Modeling event in Mechanical department
  console.log('🔍 Looking for 3D Modeling event in Mech department...');
  
  const event = await Event.findOne({ 
    name: /3D.*Modeling/i,
    department: /Mech/i
  });

  if (!event) {
    console.error('❌ ERROR: 3D Modeling event not found in Mech department!');
    console.log('\n💡 Searching for any 3D Modeling event...');
    
    const anyEvent = await Event.findOne({ name: /3D.*Modeling/i });
    if (anyEvent) {
      console.log(`   Found: ${anyEvent.name} (${anyEvent.department || 'No dept'})`);
      console.log('   Please verify the department name in your database.');
    }
    
    await mongoose.connection.close();
    process.exit(1);
  }

  console.log(`✅ Found event: "${event.name}" (${event.department})\n`);

  // Upload QR code to Cloudinary
  console.log('☁️  Uploading QR code to Cloudinary...');
  
  try {
    const cloudinaryUrl = await uploadQRToCloudinary(qrFilePath, '3d-modeling-qr');
    
    console.log('✅ Uploaded successfully!');
    console.log(`🔗 Cloudinary URL: ${cloudinaryUrl}\n`);

    // Initialize qrCodes array if it doesn't exist
    if (!event.qrCodes) {
      event.qrCodes = [];
    }

    // Add QR code to the event
    const qrCodeData = {
      qrCodeUrl: cloudinaryUrl,
      accountName: 'Santosh Awade',
      usageCount: 0,
      maxUsage: 40,
      isActive: true,
      createdAt: new Date()
    };

    event.qrCodes.push(qrCodeData);
    
    // Also set as legacy paymentQRCode if not set
    if (!event.paymentQRCode) {
      event.paymentQRCode = cloudinaryUrl;
    }

    // Reset currentQRIndex to use the new QR
    event.currentQRIndex = event.qrCodes.length - 1;

    await event.save();
    
    console.log('💾 Database updated successfully!');
    console.log(`   Event: ${event.name}`);
    console.log(`   Department: ${event.department}`);
    console.log(`   QR Code URL: ${cloudinaryUrl}`);
    console.log(`   Account Name: Santosh Awade`);
    console.log(`   Total QR Codes: ${event.qrCodes.length}`);

  } catch (error) {
    console.error(`❌ Upload failed: ${error.message}`);
    await mongoose.connection.close();
    process.exit(1);
  }

  await mongoose.connection.close();
  console.log('\n✅ Script completed successfully!\n');
  console.log('='.repeat(70) + '\n');
};

main().catch(err => {
  console.error('\n❌ Fatal Error:', err.message);
  console.error(err.stack);
  process.exit(1);
});
