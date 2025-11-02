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
    .replace(/-[a-f0-9]{13}$/, '') // Remove hash suffix (e.g., -69071e709c26b)
    .replace(/\s+\d+\s*$/, '') // Remove trailing numbers
    .replace(/\s+[a-z]+\s+[a-z]+\s*$/i, '') // Remove person names at end
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
  // Remove hash and extension first
  const cleaned = filename.replace(/-[a-f0-9]{13}\.(webp|jpg|jpeg|png)$/i, '');
  
  // Try to extract name from patterns like "event-name-person-name"
  const parts = cleaned.split('-');
  
  // If last 2-3 parts look like names (capitalized), extract them
  if (parts.length >= 3) {
    const lastParts = parts.slice(-2);
    const possibleName = lastParts.join(' ');
    
    // Check if it looks like a name (starts with capital letter)
    if (/^[A-Z][a-z]+\s+[A-Z][a-z]+/.test(possibleName)) {
      return possibleName.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    }
  }
  
  return null;
};

const main = async () => {
  console.log('\n' + '='.repeat(70));
  console.log('💳 Complete QR Code Setup - Local + Cloudinary');
  console.log('='.repeat(70) + '\n');
  
  const qrSourceDir = 'D:\\code3\\All QR';
  const qrLocalDir = path.join(__dirname, 'uploads', 'qrcodes');
  
  // Create local uploads directory if it doesn't exist
  if (!fs.existsSync(qrLocalDir)) {
    fs.mkdirSync(qrLocalDir, { recursive: true });
    console.log(`📂 Created local directory: ${qrLocalDir}\n`);
  }

  console.log(`📁 Source QR folder: ${qrSourceDir}`);
  console.log(`📁 Local uploads folder: ${qrLocalDir}\n`);
  
  if (!fs.existsSync(qrSourceDir)) {
    console.error(`❌ ERROR: Source QR folder not found!`);
    process.exit(1);
  }

  const files = fs.readdirSync(qrSourceDir).filter(isImage);
  console.log(`✅ Found ${files.length} QR code images\n`);

  // Check Cloudinary configuration
  const useCloudinary = process.env.USE_CLOUDINARY === 'true';
  
  if (useCloudinary) {
    console.log('☁️  Cloudinary: ENABLED');
    console.log(`   Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME}`);
  } else {
    console.log('💾 Cloudinary: DISABLED (using local storage only)');
  }
  console.log('');

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

  let copied = 0;
  let uploaded = 0;
  let updated = 0;
  const unmatched = [];
  const matched = [];
  const failed = [];

  console.log('🔄 Processing QR codes...\n');

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const baseName = normalizeQRName(file);
    const sourceFilePath = path.join(qrSourceDir, file);
    const accountName = extractAccountName(file);

    console.log(`[${i + 1}/${files.length}] ${file}`);
    console.log(`   Normalized: "${baseName}"`);
    if (accountName) {
      console.log(`   Account Name: "${accountName}"`);
    }

    // Copy to local uploads folder
    const localFileName = file.replace(/-[a-f0-9]{13}/, ''); // Remove hash from filename
    const localFilePath = path.join(qrLocalDir, localFileName);
    
    try {
      fs.copyFileSync(sourceFilePath, localFilePath);
      copied++;
      console.log(`   📋 Copied to local: ${localFileName}`);
    } catch (error) {
      console.error(`   ❌ Failed to copy locally: ${error.message}`);
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
        const deptEvents = allEvents.filter(e => e.department === matchedDept);
        console.log(`   🏢 Department match: "${matchedDept}" (${deptEvents.length} events)`);
        
        if (deptEvents.length > 0) {
          let qrUrl;
          
          // Upload to Cloudinary if enabled
          if (useCloudinary) {
            console.log(`   ☁️  Uploading to Cloudinary...`);
            try {
              qrUrl = await uploadQRToCloudinary(sourceFilePath, `dept-${matchedDept}`);
              uploaded++;
              console.log(`   ✅ Cloudinary URL: ${qrUrl}`);
            } catch (error) {
              console.error(`   ❌ Cloudinary upload failed: ${error.message}`);
              qrUrl = `/uploads/qrcodes/${localFileName}`;
              console.log(`   💾 Using local URL: ${qrUrl}`);
            }
          } else {
            qrUrl = `/uploads/qrcodes/${localFileName}`;
            console.log(`   💾 Local URL: ${qrUrl}`);
          }

          // Add QR code to all events in this department
          for (const deptEvent of deptEvents) {
            const qrCodeData = {
              qrCodeUrl: qrUrl,
              accountName: accountName || matchedDept,
              usageCount: 0,
              maxUsage: 40,
              isActive: true,
              createdAt: new Date()
            };

            if (!deptEvent.qrCodes) {
              deptEvent.qrCodes = [];
            }

            deptEvent.qrCodes.push(qrCodeData);
            
            if (!deptEvent.paymentQRCode) {
              deptEvent.paymentQRCode = qrUrl;
            }

            await deptEvent.save();
            updated++;
          }
          
          matched.push({ 
            file, 
            type: 'department',
            target: matchedDept,
            eventsCount: deptEvents.length,
            url: qrUrl 
          });
          
          console.log(`   💾 Added to ${deptEvents.length} events\n`);
        }
        continue;
      }
    }

    // If we found a specific event match
    if (event) {
      console.log(`   ✅ Matched to event: "${event.name}"`);
      
      let qrUrl;
      
      // Upload to Cloudinary if enabled
      if (useCloudinary) {
        console.log(`   ☁️  Uploading to Cloudinary...`);
        try {
          qrUrl = await uploadQRToCloudinary(sourceFilePath, `event-${event.name}`);
          uploaded++;
          console.log(`   ✅ Cloudinary URL: ${qrUrl}`);
        } catch (error) {
          console.error(`   ❌ Cloudinary upload failed: ${error.message}`);
          qrUrl = `/uploads/qrcodes/${localFileName}`;
          console.log(`   💾 Using local URL: ${qrUrl}`);
        }
      } else {
        qrUrl = `/uploads/qrcodes/${localFileName}`;
        console.log(`   💾 Local URL: ${qrUrl}`);
      }

      // Initialize qrCodes array if it doesn't exist
      if (!event.qrCodes) {
        event.qrCodes = [];
      }

      // Add QR code to the event
      const qrCodeData = {
        qrCodeUrl: qrUrl,
        accountName: accountName || event.name,
        usageCount: 0,
        maxUsage: 40,
        isActive: true,
        createdAt: new Date()
      };

      event.qrCodes.push(qrCodeData);
      
      if (!event.paymentQRCode) {
        event.paymentQRCode = qrUrl;
      }

      await event.save();
      updated++;
      
      matched.push({ 
        file, 
        type: 'event',
        target: event.name, 
        url: qrUrl 
      });
      
      console.log(`   💾 Database updated\n`);
    } else {
      console.log(`   ❌ NO MATCH\n`);
      unmatched.push({ file, baseName });
    }
  }

  // Summary
  console.log('='.repeat(70));
  console.log('📊 SUMMARY');
  console.log('='.repeat(70));
  console.log(`📋 Copied to local: ${copied} files`);
  if (useCloudinary) {
    console.log(`☁️  Uploaded to Cloudinary: ${uploaded} QR codes`);
  }
  console.log(`💾 Database updates: ${updated} events`);
  console.log(`❌ Unmatched files: ${unmatched.length}`);
  console.log(`📁 Total processed: ${files.length}\n`);

  if (matched.length > 0) {
    console.log('✅ Successfully Linked:');
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
