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
  image: String,
  slug: String,
  description: String,
  category: String,
  department: String,
  date: Date,
  time: String,
  venue: String,
  registrationFee: Number,
  maxParticipants: Number,
  currentParticipants: Number
}, { strict: false });

const isImage = (file) => /\.(png|jpg|jpeg|gif|webp)$/i.test(file);

const normalizeName = (raw) => {
  return raw
    .replace(/\.[^/.]+$/, '') // Remove extension
    .replace(/-ezgif\.com-png-to-webp-converter$/i, '') // Remove conversion suffix
    .replace(/-elementor-io-optimized$/i, '') // Remove optimization suffix
    .replace(/\s*\([^)]*\)\s*/g, ' ') // Remove parentheses
    .replace(/[-_]/g, ' ') // Replace dashes and underscores with spaces
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();
};

/**
 * Upload image to Cloudinary with WebP optimization
 */
const uploadToCloudinary = async (filePath, eventName) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'savishkar/events',
      public_id: eventName.toLowerCase().replace(/\s+/g, '-'),
      format: 'webp',
      transformation: [
        { width: 1200, height: 800, crop: 'limit' },
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
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
  console.log('☁️  Event Poster Upload to Cloudinary');
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

  const uploadsDir = path.join(__dirname, 'uploads', 'events');
  
  console.log(`📁 Checking uploads folder: ${uploadsDir}`);
  if (!fs.existsSync(uploadsDir)) {
    console.error(`❌ ERROR: Uploads folder not found!`);
    console.error(`   Expected: ${uploadsDir}`);
    process.exit(1);
  }

  const files = fs.readdirSync(uploadsDir).filter(isImage);
  console.log(`✅ Found ${files.length} image files\n`);

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
  console.log(`📋 Event names in database:`);
  allEvents.forEach(e => console.log(`   - ${e.name}`));
  console.log('');

  let uploaded = 0;
  let updated = 0;
  const unmatched = [];
  const matched = [];
  const failed = [];

  console.log('🔄 Processing and uploading files...\n');

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const baseName = normalizeName(file);
    const filePath = path.join(uploadsDir, file);

    console.log(`[${i + 1}/${files.length}] ${file}`);
    console.log(`   Normalized: "${baseName}"`);

    // Try exact match (case-insensitive)
    let event = allEvents.find(e => 
      e.name.toLowerCase() === baseName.toLowerCase()
    );

    // Try partial match if exact match fails
    if (!event) {
      const firstWord = baseName.split(' ')[0];
      if (firstWord.length > 2) {
        event = allEvents.find(e => 
          e.name.toLowerCase().includes(firstWord.toLowerCase())
        );
        if (event) {
          console.log(`   ⚠️  Partial match: "${event.name}"`);
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
        console.log(`   ⚠️  No-space match: "${event.name}"`);
      }
    }

    if (!event) {
      console.log(`   ❌ NO MATCH\n`);
      unmatched.push({ file, baseName });
      continue;
    }

    console.log(`   ✅ Matched to event: "${event.name}"`);
    console.log(`   ☁️  Uploading to Cloudinary...`);

    try {
      const cloudinaryUrl = await uploadToCloudinary(filePath, event.name);
      uploaded++;
      
      console.log(`   ✅ Uploaded successfully!`);
      console.log(`   🔗 Cloudinary URL: ${cloudinaryUrl}`);

      // Update event in database
      event.image = cloudinaryUrl;
      await event.save();
      updated++;
      
      matched.push({ 
        file, 
        event: event.name, 
        url: cloudinaryUrl 
      });
      
      console.log(`   💾 Database updated\n`);
    } catch (error) {
      console.error(`   ❌ Upload failed: ${error.message}\n`);
      failed.push({ file, event: event.name, error: error.message });
    }
  }

  // Summary
  console.log('='.repeat(70));
  console.log('📊 SUMMARY');
  console.log('='.repeat(70));
  console.log(`☁️  Uploaded to Cloudinary: ${uploaded} images`);
  console.log(`💾 Database updated: ${updated} events`);
  console.log(`❌ Failed uploads: ${failed.length}`);
  console.log(`❌ Unmatched files: ${unmatched.length}`);
  console.log(`📁 Total processed: ${files.length}\n`);

  if (matched.length > 0) {
    console.log('✅ Successfully Uploaded & Linked:');
    matched.forEach(m => {
      console.log(`   ${m.file} → ${m.event}`);
      console.log(`      ${m.url}`);
    });
    console.log('');
  }

  if (failed.length > 0) {
    console.log('❌ Failed Uploads:');
    failed.forEach(f => {
      console.log(`   ${f.file} (${f.event})`);
      console.log(`      Error: ${f.error}`);
    });
    console.log('');
  }

  if (unmatched.length > 0) {
    console.log('❌ Unmatched Files:');
    unmatched.forEach(u => {
      console.log(`   ${u.file} (normalized: "${u.baseName}")`);
    });
    console.log('\n💡 Tip: Check if these event names exist in your database or rename the files');
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
