import path from 'path';
import fs from 'fs';
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

const isImage = (file) => /\.(png|jpg|jpeg|gif|webp)$/i.test(file);

/**
 * Normalize QR code filename to match event/department name
 */
const normalizeQRName = (raw) => {
  return raw
    .replace(/\.[^/.]+$/, '') // Remove extension
    .replace(/\s+\d+\s*$/, '') // Remove trailing numbers (e.g., "RoboRace 1" -> "RoboRace")
    .replace(/\s+[A-Z][a-z]+\s+[A-Z][a-z]+\s*$/, '') // Remove person names at end
    .replace(/\s+[A-Z][a-z]+\s*$/, '') // Remove single names at end
    .replace(/[-_]/g, ' ') // Replace dashes/underscores with spaces
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();
};

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

/**
 * Extract account name from filename
 */
const extractAccountName = (filename) => {
  // Try to extract name from patterns like "Event Name Person Name.jpg"
  const match = filename.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\.(jpg|jpeg|png)$/i);
  if (match) {
    return match[1].trim();
  }
  return null;
};

const main = async () => {
  console.log('\n' + '='.repeat(70));
  console.log('💳 Event QR Code Upload to Cloudinary');
  console.log('='.repeat(70) + '\n');
  
  // Check if Cloudinary is enabled
  if (process.env.USE_CLOUDINARY !== 'true') {
    console.error('❌ ERROR: Cloudinary is not enabled!');
    console.error('   Set USE_CLOUDINARY=true in your .env file');
    process.exit(1);
  }

  // Verify Cloudinary configuration
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.error('❌ ERROR: Cloudinary credentials missing!');
    console.error('   Required: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET');
    process.exit(1);
  }

  console.log('☁️  Cloudinary Configuration:');
  console.log(`   Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME}`);
  console.log(`   API Key: ${process.env.CLOUDINARY_API_KEY.substring(0, 8)}...`);
  console.log('');

  const qrDir = 'D:\\code3\\All QR';
  
  console.log(`📁 Checking QR codes folder: ${qrDir}`);
  if (!fs.existsSync(qrDir)) {
    console.error(`❌ ERROR: QR codes folder not found!`);
    console.error(`   Expected: ${qrDir}`);
    process.exit(1);
  }

  const files = fs.readdirSync(qrDir).filter(isImage);
  console.log(`✅ Found ${files.length} QR code images\n`);

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
  
  const allEvents = await Event.find({});
  console.log(`📊 Total events in database: ${allEvents.length}`);
  console.log(`📋 Event names:`);
  allEvents.forEach(e => console.log(`   - ${e.name} (${e.department || 'No dept'})`));
  console.log('');

  // Get unique departments
  const departments = [...new Set(allEvents.map(e => e.department).filter(Boolean))];
  console.log(`📋 Departments: ${departments.join(', ')}\n`);

  let uploaded = 0;
  let updated = 0;
  const unmatched = [];
  const matched = [];
  const failed = [];

  console.log('🔄 Processing and uploading QR codes...\n');

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const baseName = normalizeQRName(file);
    const filePath = path.join(qrDir, file);
    const accountName = extractAccountName(file);

    console.log(`[${i + 1}/${files.length}] ${file}`);
    console.log(`   Normalized: "${baseName}"`);
    if (accountName) {
      console.log(`   Account Name: "${accountName}"`);
    }

    // Try to match by event name first
    let event = allEvents.find(e => 
      e.name.toLowerCase() === baseName.toLowerCase()
    );

    // Try partial match with event name
    if (!event) {
      const firstWord = baseName.split(' ')[0];
      if (firstWord.length > 2) {
        event = allEvents.find(e => 
          e.name.toLowerCase().includes(firstWord.toLowerCase())
        );
        if (event) {
          console.log(`   ⚠️  Partial event match: "${event.name}"`);
        }
      }
    }

    // Try matching without spaces
    if (!event) {
      const noSpaces = baseName.replace(/\s+/g, '').toLowerCase();
      event = allEvents.find(e => 
        e.name.replace(/\s+/g, '').toLowerCase() === noSpaces
      );
      if (event) {
        console.log(`   ⚠️  No-space event match: "${event.name}"`);
      }
    }

    // Try to match by department name
    if (!event) {
      const matchedDept = departments.find(dept => 
        dept.toLowerCase() === baseName.toLowerCase()
      );
      
      if (matchedDept) {
        // Find all events in this department
        const deptEvents = allEvents.filter(e => e.department === matchedDept);
        console.log(`   🏢 Department match: "${matchedDept}" (${deptEvents.length} events)`);
        
        // We'll add this QR to all events in the department
        if (deptEvents.length > 0) {
          console.log(`   ☁️  Uploading QR code to Cloudinary...`);
          
          try {
            const cloudinaryUrl = await uploadQRToCloudinary(filePath, `dept-${matchedDept}`);
            uploaded++;
            
            console.log(`   ✅ Uploaded successfully!`);
            console.log(`   🔗 Cloudinary URL: ${cloudinaryUrl}`);

            // Add QR code to all events in this department
            for (const deptEvent of deptEvents) {
              const qrCodeData = {
                qrCodeUrl: cloudinaryUrl,
                accountName: accountName || matchedDept,
                usageCount: 0,
                maxUsage: 40,
                isActive: true,
                createdAt: new Date()
              };

              // Initialize qrCodes array if it doesn't exist
              if (!deptEvent.qrCodes) {
                deptEvent.qrCodes = [];
              }

              // Add the QR code
              deptEvent.qrCodes.push(qrCodeData);
              
              // Also set as legacy paymentQRCode if not set
              if (!deptEvent.paymentQRCode) {
                deptEvent.paymentQRCode = cloudinaryUrl;
              }

              await deptEvent.save();
              updated++;
            }
            
            matched.push({ 
              file, 
              type: 'department',
              target: matchedDept,
              eventsCount: deptEvents.length,
              url: cloudinaryUrl 
            });
            
            console.log(`   💾 Added to ${deptEvents.length} events in ${matchedDept}\n`);
          } catch (error) {
            console.error(`   ❌ Upload failed: ${error.message}\n`);
            failed.push({ file, target: matchedDept, error: error.message });
          }
        }
        continue;
      }
    }

    // If we found a specific event match
    if (event) {
      console.log(`   ✅ Matched to event: "${event.name}"`);
      console.log(`   ☁️  Uploading QR code to Cloudinary...`);

      try {
        const cloudinaryUrl = await uploadQRToCloudinary(filePath, `event-${event.name}`);
        uploaded++;
        
        console.log(`   ✅ Uploaded successfully!`);
        console.log(`   🔗 Cloudinary URL: ${cloudinaryUrl}`);

        // Initialize qrCodes array if it doesn't exist
        if (!event.qrCodes) {
          event.qrCodes = [];
        }

        // Add QR code to the event
        const qrCodeData = {
          qrCodeUrl: cloudinaryUrl,
          accountName: accountName || event.name,
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

        await event.save();
        updated++;
        
        matched.push({ 
          file, 
          type: 'event',
          target: event.name, 
          url: cloudinaryUrl 
        });
        
        console.log(`   💾 Database updated\n`);
      } catch (error) {
        console.error(`   ❌ Upload failed: ${error.message}\n`);
        failed.push({ file, target: event.name, error: error.message });
      }
    } else {
      console.log(`   ❌ NO MATCH (not an event or department)\n`);
      unmatched.push({ file, baseName });
    }
  }

  // Summary
  console.log('='.repeat(70));
  console.log('📊 SUMMARY');
  console.log('='.repeat(70));
  console.log(`☁️  Uploaded to Cloudinary: ${uploaded} QR codes`);
  console.log(`💾 Database updates: ${updated} events`);
  console.log(`❌ Failed uploads: ${failed.length}`);
  console.log(`❌ Unmatched files: ${unmatched.length}`);
  console.log(`📁 Total processed: ${files.length}\n`);

  if (matched.length > 0) {
    console.log('✅ Successfully Uploaded & Linked:');
    matched.forEach(m => {
      if (m.type === 'department') {
        console.log(`   ${m.file} → Department: ${m.target} (${m.eventsCount} events)`);
      } else {
        console.log(`   ${m.file} → Event: ${m.target}`);
      }
      console.log(`      ${m.url}`);
    });
    console.log('');
  }

  if (failed.length > 0) {
    console.log('❌ Failed Uploads:');
    failed.forEach(f => {
      console.log(`   ${f.file} (${f.target})`);
      console.log(`      Error: ${f.error}`);
    });
    console.log('');
  }

  if (unmatched.length > 0) {
    console.log('❌ Unmatched Files:');
    unmatched.forEach(u => {
      console.log(`   ${u.file} (normalized: "${u.baseName}")`);
    });
    console.log('\n💡 Tip: Check if these match event or department names');
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
